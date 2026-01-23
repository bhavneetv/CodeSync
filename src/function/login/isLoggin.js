import supabase from "../../supabaseClinet";

export async function isLoggin(val) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        if (window.location.pathname === '/login') {
            return redirectIfLoggedIn();
        }
        else {
            if (val == "info") return session.user.user_metadata;
            else return session.user;
        }

    }
    else {
        return false;
    }





}
function redirectIfLoggedIn() {
    window.location.href = '/create-room';
}
