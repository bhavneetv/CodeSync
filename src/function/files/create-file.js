import supabase from "../../supabaseClinet";
import { encrypt , hashRoomCode } from "../login/encryption";


export async function createEncryptedFile(
    roomCode,
    fileName,
    extension,
    folderPath = ""
) {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Not authenticated");

    const encryptedRoom = hashRoomCode(roomCode);


    const fileId = crypto.randomUUID();
    const encryptedFileName = `${fileId}.enc`;


    const basePath = `${encryptedRoom}`;

    const fullPath = folderPath
        ? `${basePath}/${folderPath}/${encryptedFileName}`
        : `${basePath}/${encryptedFileName}`;


    const encryptedContent = encrypt("");


    const { error: uploadError } = await supabase.storage
        .from("user-files")
        .upload(fullPath, encryptedContent, {
            contentType: "text/plain",
            upsert: false,
        });

    if (uploadError) throw uploadError;


    const { error: dbError } = await supabase.from("files").insert({
        user_id: user.id,
        room_code: roomCode,
        file_name: fileName,
        extension,
        folder_path: folderPath,
        storage_path: fullPath,
    });

    if (dbError) throw dbError;

    return {
        success: true,
        room: roomCode,
        storagePath: fullPath,
    };
}
