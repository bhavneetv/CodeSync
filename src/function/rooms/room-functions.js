import supabase from "../../supabaseClient";
import { isLoggin } from "../login/isLoggin";
import { hashRoomCode } from "../login/encryption";

const NORMAL_DELETE_DAYS = 14;
const TEMPORARY_DELETE_HOURS = 48;
const MEMBER_STORAGE_CLEANUP_DAYS = 7;

const getRoomType = (room) => (room?.type || "").toString().trim().toLowerCase();

const asTimestampMs = (value, fallback = NaN) => {
    const parsed = value ? new Date(value).getTime() : NaN;
    return Number.isFinite(parsed) ? parsed : fallback;
};

const getLastRoomActivityMs = (room) => {
    const base = room?.last_join || room?.created_at;
    return asTimestampMs(base, Date.now());
};

const getMemberActivityMs = (member) => {
    const lastSeenMs = asTimestampMs(member?.last_seen, NaN);
    const joinedAtMs = asTimestampMs(member?.joined_at, NaN);
    const maxMs = Math.max(
        Number.isFinite(lastSeenMs) ? lastSeenMs : -Infinity,
        Number.isFinite(joinedAtMs) ? joinedAtMs : -Infinity
    );
    return Number.isFinite(maxMs) ? maxMs : NaN;
};

const collectStoragePaths = async (roomHash) => {
    const bucket = supabase.storage.from("user-files");
    const filesToDelete = [];

    const walk = async (prefix) => {
        let offset = 0;
        const limit = 100;

        while (true) {
            const { data: entries, error: listError } = await bucket.list(prefix, {
                limit,
                offset
            });

            if (listError) {
                console.warn("[roomCleanup] List error:", listError);
                return;
            }

            if (!entries || entries.length === 0) break;

            for (const entry of entries) {
                const entryPath = prefix ? `${prefix}/${entry.name}` : entry.name;
                if (entry.id) {
                    filesToDelete.push(entryPath);
                } else {
                    await walk(entryPath);
                }
            }

            if (entries.length < limit) break;
            offset += limit;
        }
    };

    await walk(roomHash);
    return filesToDelete;
};

const cleanupRoomStorage = async (room, { fallbackToFilesTable = true } = {}) => {
    const roomHash = hashRoomCode(room?.room_code || "");
    const bucket = supabase.storage.from("user-files");

    let storagePaths = await collectStoragePaths(roomHash);

    if (storagePaths.length === 0 && fallbackToFilesTable) {
        const { data: filesData, error: filesError } = await supabase
            .from("files")
            .select("storage_path")
            .eq("room_code", roomHash);

        if (filesError) {
            console.warn("[roomCleanup] Files lookup error:", filesError);
        } else {
            storagePaths = (filesData || []).map((f) => f.storage_path).filter(Boolean);
        }
    }

    storagePaths = [...new Set(storagePaths)];

    let removedCount = 0;

    if (storagePaths.length > 0) {
        const chunkSize = 100;
        for (let i = 0; i < storagePaths.length; i += chunkSize) {
            const batch = storagePaths.slice(i, i + chunkSize);
            const { data: removed, error: storageError } = await bucket.remove(batch);
            if (storageError) {
                console.warn("[roomCleanup] Storage delete error:", storageError);
                continue;
            }
            removedCount += Array.isArray(removed) ? removed.length : batch.length;
        }
    }

    return {
        roomHash,
        candidateCount: storagePaths.length,
        removedCount
    };
};

const deactivateRoomByRow = async (room) => {
    const { roomHash } = await cleanupRoomStorage(room, { fallbackToFilesTable: true });

    await supabase.from("files").delete().eq("room_code", roomHash);
    await supabase.from("room_members").delete().eq("room_id", room.id);

    // Best-effort cleanup if folder metadata table exists.
    try {
        await supabase.from("folders").delete().eq("room_code", roomHash);
    } catch {
        // ignore optional table cleanup failures
    }

    const { error: deactivateRoomError } = await supabase
        .from("rooms")
        .update({
            active: false
        })
        .eq("id", room.id);

    if (deactivateRoomError) {
        throw deactivateRoomError;
    }
};

const cleanupRoomStorageOnlyByRow = async (room) =>
    cleanupRoomStorage(room, { fallbackToFilesTable: false });

const fetchMemberLastActivityMap = async (roomIds) => {
    const lastActivityByRoom = new Map();
    if (!Array.isArray(roomIds) || roomIds.length === 0) return lastActivityByRoom;

    const { data: members, error } = await supabase
        .from("room_members")
        .select("room_id, joined_at, last_seen")
        .in("room_id", roomIds);

    if (error) {
        console.warn("[roomCleanup] Member activity fetch error:", error);
        return lastActivityByRoom;
    }

    for (const member of members || []) {
        const activityMs = getMemberActivityMs(member);
        if (!Number.isFinite(activityMs)) continue;

        const current = lastActivityByRoom.get(member.room_id) || 0;
        if (activityMs > current) {
            lastActivityByRoom.set(member.room_id, activityMs);
        }
    }

    return lastActivityByRoom;
};

export async function deleteRoom(roomLink) {
    try {
        const ownerId = await isLoggin("id");
        if (!ownerId) {
            return { success: false, error: "NOT_AUTHENTICATED" };
        }

        const { data: room, error: roomError } = await supabase
            .from("rooms")
            .select("id, room_code, owner_id")
            .eq("room_link", roomLink)
            .eq("owner_id", ownerId)
            .single();

        if (roomError || !room) {
            return { success: false, error: "NOT_OWNER_OR_NOT_FOUND" };
        }

        await deactivateRoomByRow(room);

        return { success: true };
    } catch (error) {
        console.error("[deleteRoom] Failed:", error);
        return { success: false, error: error.message };
    }
}

export async function cleanupStaleRooms() {
    const now = Date.now();
    const normalDeleteMs = NORMAL_DELETE_DAYS * 24 * 60 * 60 * 1000;
    const tempDeleteMs = TEMPORARY_DELETE_HOURS * 60 * 60 * 1000;
    const memberStorageCleanupMs = MEMBER_STORAGE_CLEANUP_DAYS * 24 * 60 * 60 * 1000;

    const summary = {
        scanned: 0,
        deactivatedInactive: 0,
        deactivatedTemporary: 0,
        storageOnlyCleanedRooms: 0,
        storageObjectsRemoved: 0,
        failures: []
    };

    try {
        let from = 0;
        const pageSize = 200;

        while (true) {
            const { data: rooms, error } = await supabase
                .from("rooms")
                .select("id, room_code, room_link, type, created_at, last_join, active")
                .eq("active", true)
                .order("created_at", { ascending: true })
                .range(from, from + pageSize - 1);

            if (error) throw error;
            if (!rooms || rooms.length === 0) break;

            const memberActivityMap = await fetchMemberLastActivityMap(rooms.map((room) => room.id));

            for (const room of rooms) {
                summary.scanned += 1;
                const roomType = getRoomType(room);
                const createdAtMs = asTimestampMs(room.created_at, now);
                const lastRoomActivityMs = getLastRoomActivityMs(room);
                const inactiveMs = now - lastRoomActivityMs;
                const ageMs = now - createdAtMs;
                const lastMemberActivityMs = memberActivityMap.get(room.id);
                const effectiveMemberActivityMs = Number.isFinite(lastMemberActivityMs)
                    ? lastMemberActivityMs
                    : lastRoomActivityMs;
                const memberInactiveMs = now - effectiveMemberActivityMs;

                const isTemporary = roomType === "temporary";

                if (isTemporary) {
                    if (ageMs >= tempDeleteMs) {
                        try {
                            await deactivateRoomByRow(room);
                            summary.deactivatedTemporary += 1;
                        } catch (err) {
                            summary.failures.push({
                                roomId: room.id,
                                roomLink: room.room_link,
                                reason: `TEMP_DEACTIVATE_FAILED: ${err.message}`
                            });
                        }
                    }
                    continue;
                }

                if (inactiveMs >= normalDeleteMs) {
                    try {
                        await deactivateRoomByRow(room);
                        summary.deactivatedInactive += 1;
                    } catch (err) {
                        summary.failures.push({
                            roomId: room.id,
                            roomLink: room.room_link,
                            reason: `INACTIVE_DEACTIVATE_FAILED: ${err.message}`
                        });
                    }
                    continue;
                }

                if (memberInactiveMs >= memberStorageCleanupMs) {
                    try {
                        const storageCleanup = await cleanupRoomStorageOnlyByRow(room);
                        if (storageCleanup.candidateCount > 0) {
                            summary.storageOnlyCleanedRooms += 1;
                            summary.storageObjectsRemoved += storageCleanup.removedCount;
                        }
                    } catch (err) {
                        summary.failures.push({
                            roomId: room.id,
                            roomLink: room.room_link,
                            reason: `STORAGE_ONLY_CLEANUP_FAILED: ${err.message}`
                        });
                    }
                }
            }

            if (rooms.length < pageSize) break;
            from += pageSize;
        }

        return { success: true, summary };
    } catch (error) {
        return { success: false, error: error.message, summary };
    }
}

export const runAutoRoomMaintenance = async () => cleanupStaleRooms();
