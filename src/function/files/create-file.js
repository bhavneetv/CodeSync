
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
    folderPath = ""
) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not logged in");

    const roomHash = hashRoomCode(await getRoomCode(roomCode));


    const fileId = generateUUID();

    const encryptedFileName = `${fileId}.enc`;

    const storagePath = folderPath
        ? `${roomHash}/${folderPath}/${encryptedFileName}`
        : `${roomHash}/${encryptedFileName}`;

    const encryptedContent = encrypt("HELLO_TEST_123");

    const fileBlob = new Blob([encryptedContent], {
        type: "text/plain",
    });

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

    // if (is_new) {
    //     await supabase
    //         .from("rooms")
    //         .update({ is_room_new: false })
    //         .eq("room_link", roomCode);
    // }

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



// get room code
async function getRoomCode(roomLink) {
    const { data, error } = await supabase
        .from("rooms")
        .select("room_code")
        .eq("room_link", roomLink).single();
    if (error) throw error;
    return data.room_code
}

// get room files
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

// build file tree
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
            name: `${file.name}.${file.extension}`,
            type: "file",
            fullPath: file.storagePath,
            content: null,
        });
    }

    return root;
}


// read file

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


    const decrypted = decrypt(encryptedText);


    if (decrypted === "") {
        return "Start from Here";
    }


    if (!decrypted && encryptedText) {
        throw new Error("Decryption failed (wrong key or corrupted file)");
    }

    return decrypted;
}

export const handleCreateFolder = (folderName, parentPath) => {
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
