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
export async function loginWithGithub(redirectPath = "/") {
  const redirectTo = redirectPath.startsWith("/")
    ? window.location.origin + redirectPath
    : window.location.origin + "/" + redirectPath;
  return await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      scopes: "repo",
      redirectTo,
    },
  });
}

// Use root redirect with query param to avoid provider redirect restrictions
export async function loginWithGithubReturn(returnPath = "/") {
  const safePath = returnPath.startsWith("/") ? returnPath : `/${returnPath}`;
  const redirectTo = `${window.location.origin}/?oauth_return=${encodeURIComponent(safePath)}`;
  return await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      scopes: "repo",
      redirectTo,
    },
  });
}

/* SYNC GITHUB TOKEN TO PROFILE (after OAuth redirect) */
export async function syncGithubTokenToProfile() {
  const { data, error } = await supabase.auth.getSession();
  if (error) return { updated: false, token: null };

  const session = data?.session;
  const user = session?.user;
  const providerToken = session?.provider_token || null;

  if (!user) return { updated: false, token: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("github_token")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.github_token) {
    return { updated: false, token: profile.github_token };
  }

  if (!providerToken) {
    return { updated: false, token: null };
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ github_token: providerToken })
    .eq("id", user.id);

  return { updated: !updateError, token: providerToken };
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
