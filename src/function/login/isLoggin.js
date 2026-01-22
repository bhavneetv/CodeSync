import supabase from "../../supabaseClinet";

export async function isLoggin() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        if (window.location.pathname === '/login') {
            return redirectIfLoggedIn();
        }

    }
     else {
        if (window.location.pathname !== '/login') {
            return false;
        }

        return window.location.href = '/login';
    }

    return session;

}
function redirectIfLoggedIn() {
    window.location.href = '/create-room';
}
