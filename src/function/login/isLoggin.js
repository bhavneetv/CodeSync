import supabase from "../../supabaseClinet";

export async function isLoggin(val) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        if (window.location.pathname === '/login') {
            return redirectIfLoggedIn();
        }
        else {
            // Return user information based on the requested value
            if (val == "info") return session.user.user_metadata;
            // Return user ID
            else if (val == "id") return session.user.id;
            // Return the entire user object
            else return session.user;
        }

    }
    else {
        // User is not logged in
        return false;
    }

}
function redirectIfLoggedIn() {
    window.location.href = '/create-room';
}
