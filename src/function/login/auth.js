import supabase from "../../supabaseClient.js";

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

export async function loginWithGoogle(prov) {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: prov,
    });
    if (error) {
        console.error("OAuth login error:", error.message);
    } else {
        console.log("OAuth login success:", data);
    }
}

export async function logout() {
    return await supabase.auth.signOut();
}

export async function getUser() {
    const { data: { session } } = await supabase.auth.getSession();

    return session;

}


export async function loginWithGithub() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      scopes: 'repo', 
      redirectTo: window.location.origin + '/'
    },
  });
  return { data, error };
}