// <<<<<<< HEAD
import supabase from "../../supabaseClient";
import { encrypt, hashRoomCode } from "../login/encryption";

// =======
import { enc } from "crypto-js";
import supabase from "../../supabaseClinet";
import { encrypt, hashRoomCode, decrypt } from "../login/encryption";
// >>>>>>> b47b27695044e30048fac56ca7f9aaadda479072

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


    const normalizedRoomCode = roomCode.trim();


    const encryptedRoom = hashRoomCode(normalizedRoomCode);

    const fileId = crypto.randomUUID();
    const encryptedFileName = `${fileId}.enc`;

    const basePath = encryptedRoom;

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
        room_code: encryptedRoom,
        file_name: encrypt(fileName),
        extension: encrypt(extension),
        folder_path: folderPath,
        storage_path: fullPath,
    });

    if (dbError) throw dbError;

    return {
        success: true,
        roomHash: encryptedRoom,
        storagePath: fullPath,
    };
}

async function getRoomCode(roomLink) {
    const { data, error } = await supabase
        .from("rooms")
        .select("room_code")
        .eq("room_link", roomLink)
        .single();
    if (error) return null;
    return data.room_code;
}



export async function getRoomFiles(roomCode) {
    

    roomCode = await getRoomCode(roomCode)

    const normalizedRoomCode = roomCode.trim();


    const encryptedRoom = hashRoomCode(normalizedRoomCode);



    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return { success: false, error: "User not logged in" };
    }


    const { data, error } = await supabase
        .from("files")
        .select("*")
        .eq("room_code", encryptedRoom)
        .order("created_at", { ascending: true });

    if (error) {
        return { success: false, error: error.message };
    }


    const files = data.map((file) => ({
        ...file,
        file_name: decrypt(file.file_name),
        extension: decrypt(file.extension),
        folder_path: decrypt(file.storage_path),
    }));

    return {
        success: true,
        files,
    };
}


export function buildFileTreeFromDB(dbFiles) {
    const root = {
        name: "my-project",
        type: "folder",
        isExpanded: true,
        children: [],
    };

    for (const file of dbFiles) {
        const { file_name, extension, folder_path } = file;
        const fullName = `${file_name}.${extension}`;
        const folders = folder_path ? folder_path.split("/") : [];

        let current = root;


        for (const folder of folders) {
            let existing = current.children.find(
                (c) => c.type === "folder" && c.name === folder
            );

            if (!existing) {
                existing = {
                    name: folder,
                    type: "folder",
                    isExpanded: false,
                    children: [],
                };
                current.children.push(existing);
            }

            current = existing;
        }


        current.children.push({
            name: fullName,
            type: "file",
            content: "",
        });
    }

    return root;
}


export async function readFileContent(storagePath) {

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("User not authenticated");
    }


    const { data, error } = await supabase.storage
        .from("user-files")
        .download(storagePath);

    if (error) {
        throw new Error("Failed to download file");
    }


    const encryptedText = await data.text();


    const decryptedContent = safeDecrypt(encryptedText);

    return decryptedContent;
}