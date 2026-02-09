import supabase from "../../supabaseClient.js";

const FALLBACK_AUTH_ORIGIN = "https://codesyncioo.netlify.app";
const FALLBACK_APP_DEEP_LINK = "codesync://auth-callback";
const KNOWN_WEB_ORIGINS = [
  "https://codesyncioo.netlify.app",
  "https://codesyncio.in",
  "https://www.codesyncio.in",
];

const trimTrailingSlash = (value = "") => value.replace(/\/+$/, "");
const isLocalHostName = (host = "") =>
  host === "localhost" ||
  host === "127.0.0.1" ||
  host === "0.0.0.0" ||
  host.endsWith(".local");

const parseHost = (origin = "") => {
  try {
    return new URL(origin).hostname.toLowerCase();
  } catch (_) {
    return "";
  }
};

const isKnownWebOrigin = (origin = "") => {
  const normalized = trimTrailingSlash(origin).toLowerCase();
  return KNOWN_WEB_ORIGINS.includes(normalized);
};

const resolveAuthOrigin = () => {
  const envOrigin = trimTrailingSlash(import.meta.env.VITE_AUTH_REDIRECT_ORIGIN || "");
  if (typeof window === "undefined") {
    return envOrigin || FALLBACK_AUTH_ORIGIN;
  }

  const currentOrigin = trimTrailingSlash(window.location.origin || "");
  const host = (window.location.hostname || "").toLowerCase();
  const isCurrentLocal = isLocalHostName(host);

  // Keep users on the same production domain they started from.
  if (!isCurrentLocal && isKnownWebOrigin(currentOrigin)) {
    return currentOrigin;
  }

  if (envOrigin) {
    const envHost = parseHost(envOrigin);
    const isEnvLocal = envHost ? isLocalHostName(envHost) : false;
    if (isEnvLocal && !isCurrentLocal) {
      return currentOrigin || FALLBACK_AUTH_ORIGIN;
    }
    if (!envHost && !envOrigin.startsWith("http")) {
      return currentOrigin || FALLBACK_AUTH_ORIGIN;
    }
    if (!isCurrentLocal && !isKnownWebOrigin(envOrigin)) {
      return currentOrigin || FALLBACK_AUTH_ORIGIN;
    }
    return envOrigin;
  }

  return isCurrentLocal ? FALLBACK_AUTH_ORIGIN : currentOrigin || FALLBACK_AUTH_ORIGIN;
};

const normalizeReturnPath = (returnPath = "/create-room") => {
  if (!returnPath || returnPath === "Google" || returnPath === "GitHub") {
    return "/create-room";
  }
  return returnPath.startsWith("/") ? returnPath : `/${returnPath}`;
};

const buildOAuthRedirect = (returnPath = "/create-room") => {
  const authOrigin = resolveAuthOrigin();
  const safePath = normalizeReturnPath(returnPath);
  return `${authOrigin}/?oauth_return=${encodeURIComponent(safePath)}`;
};

const resolveAppDeepLink = () => {
  const envDeepLink = (import.meta.env.VITE_APP_DEEP_LINK || "").trim();
  return envDeepLink || FALLBACK_APP_DEEP_LINK;
};

const getInAppBridge = async (timeoutMs = 6000) => {
  if (typeof window === "undefined") return null;
  if (window.flutter_inappwebview?.callHandler) return window.flutter_inappwebview;

  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (window.flutter_inappwebview?.callHandler) {
      return window.flutter_inappwebview;
    }

    await new Promise((resolve) => {
      let settled = false;
      const done = () => {
        if (settled) return;
        settled = true;
        window.removeEventListener("flutterInAppWebViewPlatformReady", done);
        resolve();
      };
      window.addEventListener("flutterInAppWebViewPlatformReady", done, { once: true });
      setTimeout(done, 400);
    });
  }

  return window.flutter_inappwebview?.callHandler ? window.flutter_inappwebview : null;
};

const buildAppDeepLinkRedirect = (returnPath = "/create-room") => {
  const deepLinkBase = resolveAppDeepLink();
  const safePath = normalizeReturnPath(returnPath);
  const hasQuery = deepLinkBase.includes("?");
  const separator = hasQuery ? "&" : "?";
  return `${deepLinkBase}${separator}oauth_return=${encodeURIComponent(safePath)}`;
};

const buildInAppOAuthRedirect = (returnPath = "/create-room") => {
  const authOrigin = resolveAuthOrigin();
  const safePath = normalizeReturnPath(returnPath);
  const deepLinkBase = resolveAppDeepLink();
  return `${authOrigin}/?oauth_return=${encodeURIComponent(safePath)}&app_redirect=${encodeURIComponent(deepLinkBase)}`;
};

const beginExternalOAuthInApp = async (provider, returnPath = "/create-room", options = {}) => {
  const bridge = await getInAppBridge();
  if (!bridge) return null;

  // Prefer direct deep-link callback so successful OAuth re-opens the app.
  // Fallback to web bridge for providers/environments that reject custom schemes.
  const authAttempts = [
    buildAppDeepLinkRedirect(returnPath),
    buildInAppOAuthRedirect(returnPath),
  ];

  let data = null;
  let error = null;
  for (const redirectTo of authAttempts) {
    const result = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        ...options,
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    data = result.data ?? null;
    error = result.error ?? null;
    if (!error && data?.url) {
      break;
    }
  }

  if (error) throw error;
  const authUrl = data?.url;
  if (!authUrl) {
    throw new Error("Could not start OAuth flow.");
  }

  const bridgeResult = await bridge.callHandler("openExternalAuth", {
    url: authUrl,
    returnPath: normalizeReturnPath(returnPath),
  });

  if (bridgeResult?.success === false) {
    throw new Error(bridgeResult.error || "Failed to open external browser.");
  }

  return { inAppExternal: true };
};

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
export async function loginWithGoogle(returnPath = "/create-room") {
  const inAppResult = await beginExternalOAuthInApp("google", returnPath);
  if (inAppResult) return inAppResult;

  return await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: buildOAuthRedirect(returnPath),
    },
  });
}

/* GITHUB LOGIN */
export async function loginWithGithub(returnPath = "/create-room") {
  const inAppResult = await beginExternalOAuthInApp("github", returnPath, {
    scopes: "repo",
  });
  if (inAppResult) return inAppResult;

  return await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      scopes: "repo",
      redirectTo: buildOAuthRedirect(returnPath),
    },
  });
}

// Use root redirect with query param to avoid provider redirect restrictions
export async function loginWithGithubReturn(returnPath = "/create-room") {
  const inAppResult = await beginExternalOAuthInApp("github", returnPath, {
    scopes: "repo",
  });
  if (inAppResult) return inAppResult;

  return await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      scopes: "repo",
      redirectTo: buildOAuthRedirect(returnPath),
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
