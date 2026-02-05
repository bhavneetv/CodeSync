import { enc } from "crypto-js";
import { get } from "lodash";
import supabase from "../../supabaseClient";
import { encrypt, hashRoomCode, decrypt } from "../login/encryption";


function generateUUID() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}


// create file
export async function createEncryptedFile(
    roomCode,
    fileName,
    extension,
    is_new = false,
    folderPath = "",
    rawContent = ""
) {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not logged in");

        const roomHash = hashRoomCode(await getRoomCode(roomCode));

        const fileId = generateUUID();
        const encryptedFileName = `${fileId}.enc`;

        const storagePath = folderPath
            ? `${roomHash}/${folderPath}/${encryptedFileName}`
            : `${roomHash}/${encryptedFileName}`;

        // Encrypt content (allow empty files)
        const encryptedContent = encrypt(rawContent || "");

        const fileBlob = new Blob([encryptedContent], {
            type: "text/plain;charset=utf-8",
        });

        // Upload to storage
        const { error: uploadError } = await supabase.storage
            .from("user-files")
            .upload(storagePath, fileBlob, {
                contentType: "text/plain;charset=utf-8",
                upsert: false,
                cacheControl: "no-cache",
            });

        if (uploadError) {
            console.error("Upload error:", uploadError);
            throw uploadError;
        }

        // Insert into database
        const { data, error: dbError } = await supabase
            .from("files")
            .insert({
                user_id: user.id,
                room_code: roomHash,
                file_name: encrypt(fileName),
                extension: encrypt(extension),
                folder_path: folderPath || "",
                storage_path: storagePath,
            })
            .select()
            .single();

        if (dbError) {
            // Rollback: delete the uploaded file
            await supabase.storage
                .from("user-files")
                .remove([storagePath]);

            console.error("DB error:", dbError);
            throw dbError;
        }

        // console.log("[Create] File created successfully:", storagePath);

        return {
            success: true,
            message: "File created successfully",
            data,
        };
    } catch (error) {
        console.error("[Create] Failed to create file:", error);
        return {
            success: false,
            error: error.message,
        };
    }
}

// Update existing file (simplified version)
export async function updateEncryptedFile(storagePath, rawContent) {
    try {
        // console.log("[Update] Starting update for:", storagePath);
        // console.log("[Update] Content length:", rawContent?.length || 0);

        // Encrypt the content
        const encryptedContent = encrypt(rawContent || "");

        const blob = new Blob(
            [encryptedContent],
            { type: "text/plain;charset=utf-8" }
        );

        // Use upsert to update the file
        const { data, error: uploadError } = await supabase.storage
            .from("user-files")
            .upload(storagePath, blob, {
                upsert: true, // This will overwrite if exists
                contentType: "text/plain;charset=utf-8",
                cacheControl: "no-cache, no-store, must-revalidate",
            });

        if (uploadError) {
            console.error("[Update] Upload error:", uploadError);
            throw new Error(`Failed to update file: ${uploadError.message}`);
        }

        console.log("[Update] File updated successfully:", storagePath);

        // Verify the update (optional but recommended)
        const { data: verifyData, error: verifyError } = await supabase
            .storage
            .from("user-files")
            .download(storagePath);

        if (verifyError) {
            console.warn("[Update] Could not verify update:", verifyError);
        } else {
            const verifiedContent = decrypt(await verifyData.text());
            console.log("[Update] Verified content length:", verifiedContent?.length || 0);

            // Check if content matches
            if (verifiedContent !== rawContent) {
                console.warn("[Update] Content mismatch after save!");
            }
        }

        return { success: true };
    } catch (error) {
        console.error("[Update] Update failed:", error);
        return { success: false, error: error.message };
    }
}

// Alternative update method using direct replacement (more reliable)
export async function updateEncryptedFileReliable(storagePath, rawContent) {
    try {
        console.log("[UpdateReliable] Starting update for:", storagePath);

        const encryptedContent = encrypt(rawContent || "");
        const blob = new Blob([encryptedContent], {
            type: "text/plain;charset=utf-8"
        });

        const bucket = supabase.storage.from("user-files");

        // Step 1: Remove old file
        const { error: removeError } = await bucket.remove([storagePath]);

        if (removeError) {
            console.warn("[UpdateReliable] Remove error (file may not exist):", removeError);
            // Continue anyway - file might not exist yet
        }

        // Step 2: Upload new file
        const { data: uploadData, error: uploadError } = await bucket.upload(
            storagePath,
            blob,
            {
                upsert: false, // Don't use upsert since we just removed it
                contentType: "text/plain;charset=utf-8",
                cacheControl: "no-cache",
            }
        );

        if (uploadError) {
            console.error("[UpdateReliable] Upload error:", uploadError);
            throw new Error(`Failed to upload file: ${uploadError.message}`);
        }

        console.log("[UpdateReliable] File updated successfully");

        return { success: true };
    } catch (error) {
        console.error("[UpdateReliable] Update failed:", error);
        return { success: false, error: error.message };
    }
}

// Delete file
export async function deleteEncryptedFile(fileId, storagePath) {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        // Delete from storage
        const { error: storageError } = await supabase.storage
            .from("user-files")
            .remove([storagePath]);

        if (storageError) {
            console.error("[Delete] Storage error:", storageError);
            // Continue anyway to clean up database
        }

        // Delete from database
        const { error: dbError } = await supabase
            .from("files")
            .delete()
            .eq("id", fileId)
            .eq("user_id", user.id);

        if (dbError) {
            console.error("[Delete] DB error:", dbError);
            throw dbError;
        }

        console.log("[Delete] File deleted successfully:", storagePath);

        return { success: true };
    } catch (error) {
        console.error("[Delete] Delete failed:", error);
        return { success: false, error: error.message };
    }
}

// Rename file
export async function renameEncryptedFile(fileId, newFileName, newExtension) {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        // Update database only (storage path stays the same)
        const { error: dbError } = await supabase
            .from("files")
            .update({
                file_name: encrypt(newFileName),
                extension: encrypt(newExtension),
            })
            .eq("id", fileId)
            .eq("user_id", user.id);

        if (dbError) {
            console.error("[Rename] DB error:", dbError);
            throw dbError;
        }

        console.log("[Rename] File renamed successfully");

        return { success: true };
    } catch (error) {
        console.error("[Rename] Rename failed:", error);
        return { success: false, error: error.message };
    }
}

// get room code
async function getRoomCode(roomLink) {
    const { data, error } = await supabase
        .from("rooms")
        .select("room_code")
        .eq("room_link", roomLink)
        .single();

    if (error) {
        console.error("[getRoomCode] Error:", error);
        throw error;
    }

    return data.room_code;
}

// get room files
export async function getRoomFiles(roomCode) {
    try {
        const roomHash = hashRoomCode(await getRoomCode(roomCode));

        const { data, error } = await supabase
            .from("files")
            .select("*")
            .eq("room_code", roomHash)
            .order("created_at", { ascending: true });

        if (error) {
            console.error("[getRoomFiles] Error:", error);
            throw error;
        }

        return data.map(file => ({
            id: file.id,
            name: decrypt(file.file_name),
            extension: decrypt(file.extension),
            folderPath: file.folder_path || "",
            storagePath: file.storage_path,
            createdAt: file.created_at,
        }));
    } catch (error) {
        console.error("[getRoomFiles] Failed:", error);
        return [];
    }
}

// build file tree
export function buildFileTree(files) {
    const root = {
        name: "project",
        type: "folder",
        isExpanded: true,
        children: [],
    };

    if (!files || files.length === 0) {
        return root;
    }

    for (const file of files) {
        try {
            const folders = file.folderPath ? file.folderPath.split("/").filter(f => f) : [];
            let current = root;

            // Navigate/create folder structure
            for (const folder of folders) {
                let node = current.children.find(
                    c => c.type === "folder" && c.name === folder
                );

                if (!node) {
                    node = {
                        name: folder,
                        type: "folder",
                        isExpanded: false,
                        children: [],
                    };
                    current.children.push(node);
                }

                current = node;
            }

            // Add file to current folder
            const fileName = file.extension
                ? `${file.name}.${file.extension}`
                : file.name;

            current.children.push({
                id: file.id,
                name: fileName,
                type: "file",
                fullPath: file.storagePath,
                folderPath: file.folderPath || "",
                repoPath: (file.folderPath ? `${file.folderPath}/${fileName}` : fileName),
                content: null,
            });
        } catch (err) {
            console.error("[buildFileTree] Error processing file:", file, err);
        }
    }

    // Sort folders first, then files
    const sortChildren = (node) => {
        if (node.children) {
            node.children.sort((a, b) => {
                if (a.type === b.type) {
                    return a.name.localeCompare(b.name);
                }
                return a.type === "folder" ? -1 : 1;
            });
            node.children.forEach(sortChildren);
        }
    };

    sortChildren(root);

    return root;
}

// read file
export async function readEncryptedFile(storagePath) {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        // console.log("[Read] Downloading file:", storagePath);

        const { data, error } = await supabase.storage
            .from("user-files")
            .download(storagePath);

        if (error) {
            console.error("[Read] Storage download error:", error);
            throw error;
        }

        if (!data) {
            throw new Error("No file data returned");
        }

        const encryptedText = await data.text();
        const decrypted = decrypt(encryptedText);

        // console.log("[Read] File read successfully, length:", decrypted?.length || 0);

        // Allow empty files
        if (decrypted === null || decrypted === undefined) {
            throw new Error("Decryption failed (null/undefined)");
        }

        return decrypted;
    } catch (error) {
        console.error("[Read] Read failed:", error);
        throw error;
    }
}

// Create folder (database entry for folder metadata - optional)
export async function createFolder(roomCode, folderName, parentPath = "") {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not logged in");

        const roomHash = hashRoomCode(await getRoomCode(roomCode));

        const fullFolderPath = parentPath
            ? `${parentPath}/${folderName}`
            : folderName;

        // Insert folder metadata into database (optional - depends on your schema)
        const { data, error } = await supabase
            .from("folders")
            .insert({
                user_id: user.id,
                room_code: roomHash,
                folder_name: encrypt(folderName),
                folder_path: fullFolderPath,
            })
            .select()
            .single();

        if (error) {
            console.error("[CreateFolder] DB error:", error);
            throw error;
        }

        // console.log("[CreateFolder] Folder created successfully:", fullFolderPath);

        return {
            success: true,
            data,
        };
    } catch (error) {
        console.error("[CreateFolder] Failed:", error);
        return {
            success: false,
            error: error.message,
        };
    }
}

// Batch file operations
export async function batchCreateFiles(roomCode, files) {
    const results = [];

    for (const file of files) {
        const result = await createEncryptedFile(
            roomCode,
            file.name,
            file.extension,
            false,
            file.folderPath || "",
            file.content || ""
        );
        results.push(result);
    }

    return results;
}

// Check if file exists
export async function fileExists(storagePath) {
    try {
        const { data, error } = await supabase.storage
            .from("user-files")
            .list(storagePath.split('/').slice(0, -1).join('/'));

        if (error) return false;

        const fileName = storagePath.split('/').pop();
        return data.some(file => file.name === fileName);
    } catch (error) {
        console.error("[fileExists] Error:", error);
        return false;
    }
}

// Get file metadata
export async function getFileMetadata(fileId) {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { data, error } = await supabase
            .from("files")
            .select("*")
            .eq("id", fileId)
            .single();

        if (error) {
            console.error("[getFileMetadata] Error:", error);
            throw error;
        }

        return {
            id: data.id,
            name: decrypt(data.file_name),
            extension: decrypt(data.extension),
            folderPath: data.folder_path || "",
            storagePath: data.storage_path,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
        };
    } catch (error) {
        console.error("[getFileMetadata] Failed:", error);
        return null;
    }
}

// Export for backward compatibility
export const handleCreateFolder = (folderName, parentPath, setFileTree, setCreateFolderModal) => {
    if (!folderName) return;

    const addFolder = (node, path) => {
        if (path.length === 0) {
            const exists = node.children?.some(
                (child) =>
                    child.type === "folder" && child.name === folderName
            );

            if (exists) return node;

            return {
                ...node,
                isExpanded: true,
                children: [
                    ...(node.children || []),
                    {
                        name: folderName,
                        type: "folder",
                        isExpanded: false,
                        children: [],
                    },
                ],
            };
        }

        const [index, ...rest] = path;

        return {
            ...node,
            children: node.children.map((child, i) =>
                i === index ? addFolder(child, rest) : child
            ),
        };
    };

    setFileTree((prevTree) => addFolder(prevTree, parentPath));
    setCreateFolderModal({ show: false, parentPath: [] });
};
export async function deleteFolder(
    roomCode,
    folderPath
) {
    try {
        const roomHash = hashRoomCode(await getRoomCode(roomCode));

        // 1️⃣ Get all files inside this folder (recursive)
        const { data: files, error } = await supabase
            .from("files")
            .select("id, storage_path")
            .eq("room_code", roomHash)
            .or(
                `folder_path.eq.${folderPath},folder_path.like.${folderPath}/%`
            );

        if (error) throw error;

        if (!files || files.length === 0) {
            return { success: true };
        }

        // 2️⃣ Delete from STORAGE
        const paths = files.map(f => f.storage_path);

        const { error: storageError } = await supabase.storage
            .from("user-files")
            .remove(paths);

        if (storageError) throw storageError;

        
        const { error: dbError } = await supabase
            .from("files")
            .delete()
            .in(
                "id",
                files.map(f => f.id)
            );

        if (dbError) throw dbError;

        return { success: true };
    } catch (err) {
        console.error("[Delete Folder]", err);
        return { success: false, error: err.message };
    }
}
