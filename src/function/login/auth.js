import supabase from "../../supabaseClinet.js";

export async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        console.error("Login error:", error.message);
    } else {
        console.log("Login success:", data);
    }
}

export async function signup(name, email, password) {
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        Name: name

    });
    console.log("Signup function called with:", name, email, password);

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
