import supabase from "../../supabaseClient";
// import { v4 as uuidv4 } from "uuid";
import { v4 as uuidv4 } from "uuid";



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


function generateRoomCode() {
    const part1 = generateRandomString(5);
    const part2 = generateRandomString(5);
    const part3 = generateRandomString(5);
    return `${part1}-${part2}-${part3}`;
}

const isKickedMember = (kickedUser) => {
    if (kickedUser === true) return true;
    if (kickedUser?.kicked === true) return true;
    if (kickedUser?.kicker_user === true) return true;
    if (kickedUser?.kicker_user) return true;
    return false;
};

// create room function


export async function createRoom(name, password = null , solo = false) {
    let roomType = "permanent";
    if(solo) {
        roomType = "Solo";
    }
    let isAnonymous = false;


    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData.session) {

        await supabase.auth.signInAnonymously();
        roomType = "temporary";
        isAnonymous = true;
    }

    const user = (await supabase.auth.getUser()).data.user;

//anonymous users
    if (user.is_anonymous ) {
        roomType = "temporary";
        isAnonymous = true;
    }

    const roomCode = generateRandomString(6);
    const roomLink = generateRoomCode();


    const { data: room, error } = await supabase
        .from("rooms")
        .insert({
            room_name: name,
            room_password: password,
            room_code: roomCode,
            type: roomType,
            room_link: roomLink,
            owner_id: user.id,
            is_room_new: true,
            last_join: new Date().toISOString(),
            active: true
        })
        .select()
        .single();

    if (error) throw error;


    const token = uuidv4();

    const { error: memberError } = await supabase.from("room_members").insert({
        room_id: room.id,
        user_id: user.id,
        role: "owner",
        join_token: token
    });

    if (memberError) throw memberError;

    return {
        success: true,
        roomId: room.room_link,
        token,
        type: roomType,
        isAnonymous
    };
}

export const handleRoomJoin = async (
    roomCode,
    roomPassword = null,
    passwordCheck = false
) => {

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
        await supabase.auth.signInAnonymously();
    }

    const user = (await supabase.auth.getUser()).data.user;


    const { data: room } = await supabase
        .from("rooms")
        .select("*")
        .eq("room_code", roomCode)
        .eq("active", true)
        .single();

    if (!room) {
        return { status: "not_found" };
    }

    if (!passwordCheck) {
        if (room.room_password) {
            return { status: "need_password" };
        }

    }


    if (room.room_password && room.room_password !== roomPassword) {
        return { status: "wrong_password" };
    }

    const token = uuidv4();

    const { data: member } = await supabase
        .from("room_members")
        .select("*")
        .eq("room_id", room.id)
        .eq("user_id", user.id)
        .single();

    if (member) {
        if (isKickedMember(member.kicked_user)) {
            return { status: "kicked" };
        }
        await supabase
            .from("room_members")
            .update({
            join_token: token,
            joined_at: new Date()
        })
            .eq("id", member.id);
    } else {
        await supabase.from("room_members").insert({
            room_id: room.id,
            user_id: user.id,
            role: "guest",
            join_token: token
        });
    }

    await supabase
        .from("rooms")
        .update({
            last_join: new Date().toISOString(),
            active: true
        })
        .eq("id", room.id);

    return {
        status: "joined",
        roomId: room.room_link,
        token
    };
};
