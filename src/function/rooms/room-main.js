import { link } from "framer-motion/client";
import supabase from "../../supabaseClinet";
import { isLoggin } from "../login/isLoggin";



// random string generator
function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

// function to generate room code link in XXXXX-XXXXX-XXXXX format
function generateRoomCode() {
    const part1 = generateRandomString(5);
    const part2 = generateRandomString(5);
    const part3 = generateRandomString(5);
    return `${part1}-${part2}-${part3}`;
}

const Link = generateRoomCode();


// create room function
export async function createRoom(name, password = null) {
    let roomType = "permanent";

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
        await supabase.auth.signInAnonymously();
        roomType = "temporary";
    }

    const { error } = await supabase.from("rooms").insert({
        room_name: name,
        room_password: password,
        room_code: generateRandomString(6),
        room_link: Link,
        type: roomType,
    });

    if (error) {
        console.error("Insert failed:", error);
        throw error;
    }

    return {
        success: true,
        message: "Room created successfully",
        roomLink: `${Link}`,
        type: roomType
    };
}
