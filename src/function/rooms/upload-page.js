import supabase from "../../supabaseClient";
import { isLoggin } from "../login/isLoggin";


// function to find room by room link
export async function findRoomname(roomLink) {
    const { data, error } = await supabase
        .from("rooms")
        .select("room_name, room_code, type, is_room_new")
        .eq("room_link", roomLink)
        .eq("type", "permanent")
         .eq("owner_id", await isLoggin("id") ?? null)
        .maybeSingle();
    if (error) return null;
    return data ?? null;
}


export async function isRoomValid(roomLink) {
    const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("room_link", roomLink)
        .single();
    if (error) return false;
    else return true;
}


