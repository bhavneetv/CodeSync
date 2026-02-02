import supabase from "../../supabaseClient.js";

/* LOGIN */
export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return error.message;
  return data;
}

/* SIGNUP */
export async function signup(name, email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
    },
  });

  if (error) {
    console.error("Signup error:", error.message);
    return null;
  }

  return data;
}

/* GOOGLE LOGIN */
export async function loginWithGoogle() {
  return await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin + "/",
    },
  });
}

/* GITHUB LOGIN */
export async function loginWithGithub() {
  return await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      scopes: "repo",
      redirectTo: window.location.origin + "/",
    },
  });
}

/* LOGOUT */
export async function logout() {
  return await supabase.auth.signOut();
}

/* GET USER */
export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/* GET USER NAME */
export function getUserName(user) {
  if (!user) return null;

  return (
    user.user_metadata?.name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.user_name ||
    user.email.split("@")[0]
  );
}
