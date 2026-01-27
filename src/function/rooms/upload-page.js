import supabase from "../../supabaseClinet";


// function to find room by room link
export async function findRoomname(roomLink) {
    const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("room_link", roomLink)
        .eq("type", "permanent")
        .eq("is_room_new", true)
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

export const handleJoinNext =  async(roomCode , roomPassword)=>{
      const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('room_code', roomCode)
      .eq('room_password', roomPassword)
      .single();

    if (error || !data) {
      console.error('Invalid Room Code or Password', error);

      navigate("/create-room");
    } else {
      console.log('Successfully joined room:', data);

      navigate("/editor");
    }
}