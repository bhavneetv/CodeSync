import supabase from "../../supabaseClinet.js";

export async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        return error.message;
    } else {
        return data
    }
}

export async function signup(name, email, password) {
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
            data: {
                name: name,
            },
        },


    });

    if (error) {
        console.error("Signup error:", error.message);
    } else {
        console.log("Signup success:", data);
    }

}

export async function loginWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
    });
}

export async function logout() {
    return await supabase.auth.signOut();
}

export async function getUser() {
    const { data: { session } } = await supabase.auth.getSession();

    return session;

}