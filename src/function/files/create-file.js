// createEncryptedFile.js
import { get } from "lodash";
import supabase from "../../supabaseClient";
import { encrypt, hashRoomCode, decrypt } from "../login/encryption";

export async function createEncryptedFile(
    roomCode,
    fileName,
    extension,
    folderPath = ""
) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not logged in");

    const roomHash = hashRoomCode(roomCode.trim());
    const fileId = crypto.randomUUID();
    const encryptedFileName = `${fileId}.enc`;


    const storagePath = folderPath
        ? `${roomHash}/${folderPath}/${encryptedFileName}`
        : `${roomHash}/${encryptedFileName}`;

    const encryptedContent = encrypt("HELLO_TEST_123");


    // ✅ FIX: convert string → Blob
    const fileBlob = new Blob([encryptedContent], {
        type: "text/plain",
    });

    // Upload to storage
    const { error: uploadError } = await supabase.storage
        .from("user-files")
        .upload(storagePath, fileBlob, {
            contentType: "text/plain",
            upsert: false,
        });

    if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
    }

    // Save metadata
    const { data, error: dbError } = await supabase
        .from("files")
        .insert({
            user_id: user.id,
            room_code: roomHash,
            file_name: encrypt(fileName),
            extension: encrypt(extension),
            folder_path: folderPath,
            storage_path: storagePath,
        })
        .select()
        .single();

    if (dbError) {
        console.error("DB error:", dbError);
        throw dbError;
    }

    return {
        success: true,
        message: "File created successfully",
        data,
    };
}



async function getRoomCode(roomLink) {
    const { data, error } = await supabase
        .from("rooms")
        .select("room_code")
        .eq("room_link", roomLink).single();
    if (error) throw error;
    return data.room_code
}

export async function getRoomFiles(roomCode) {
    const roomHash = hashRoomCode(await getRoomCode(roomCode));

    const { data, error } = await supabase
        .from("files")
        .select("*")
        .eq("room_code", roomHash);

    if (error) throw error;

    return data.map(file => ({
        id: file.id,
        name: decrypt(file.file_name),
        extension: decrypt(file.extension),
        folderPath: file.folder_path,
        storagePath: file.storage_path,
    }));
}

export function buildFileTree(files) {
    const root = {
        name: "project",
        type: "folder",
        isExpanded: true,
        children: [],
    };

    for (const file of files) {
        const folders = file.folderPath ? file.folderPath.split("/") : [];
        let current = root;

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

        current.children.push({
            id: file.id,
            name: `${file.name}${file.extension}`,
            type: "file",
            fullPath: file.storagePath,
            content: null,
        });
    }

    return root;
}



export async function readEncryptedFile(storagePath) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase.storage
        .from("user-files")
        .download(storagePath);

    if (error) {
        console.error("Storage download error:", error);
        throw error;
    }

    if (!data) {
        throw new Error("No file data returned");
    }

    const encryptedText = await data.text();

    // 🔑 Decrypt
    const decrypted = decrypt(encryptedText);

    // ✅ EMPTY FILE IS VALID
    if (decrypted === "") {
        return "Empty file";
    }

    // ❌ Only error if decrypt failed AND encryptedText exists
    if (!decrypted && encryptedText) {
        throw new Error("Decryption failed (wrong key or corrupted file)");
    }

    return decrypted;
}
