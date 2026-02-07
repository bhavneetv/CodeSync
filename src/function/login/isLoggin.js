import supabase from "../../supabaseClient";

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
export async function isAnyLogin() {
    // console.log("Checking if user is logged in...");
    const {
        data: { session   }, error

    } = await supabase.auth.getSession();
    // console.log("Session data:", session , "Error:", error );

    if (!session || !session.user || session == null) return false;
    if(session.user.is_anonymous == true) return false;

    
    return true
}

function redirectIfLoggedIn() {
    window.location.href = '/create-room';
}
