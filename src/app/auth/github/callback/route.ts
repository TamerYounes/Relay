import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";

function encryptToken(token: string) {
  const keyHex = process.env.GITHUB_TOKEN_ENCRYPTION_KEY;

  if (!keyHex) {
    throw new Error("GitHub token encryption key is not configured.");
  }

  const key = Buffer.from(keyHex, "hex");

  if (key.length !== 32) {
    throw new Error(
      "GITHUB_TOKEN_ENCRYPTION_KEY must be exactly 32 bytes (64 hex characters).",
    );
  }

  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([
    cipher.update(token, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    iv.toString("hex"),
    authTag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
}

export async function GET(request: Request) {
  const url = new URL(request.url);

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const cookieHeader = request.headers.get("cookie") ?? "";

  const oauthState = cookieHeader
    .split("; ")
    .find((cookie) => cookie.startsWith("github_oauth_state="))
    ?.split("=")[1];

  if (error || !code || !state || !oauthState || state !== oauthState) {
    return NextResponse.redirect(
      new URL("/settings?github=error", request.url),
    );
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const redirectUri = process.env.GITHUB_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    console.error("Missing GitHub OAuth environment variables.");

    return new NextResponse(
      "GitHub OAuth is not configured correctly.",
      { status: 500 },
    );
  }

  // Exchange OAuth code for access token
  const tokenResponse = await fetch(
    "https://github.com/login/oauth/access_token",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }).toString(),
      cache: "no-store",
    },
  );

  const tokenData = await tokenResponse.json();

  if (!tokenResponse.ok || !tokenData.access_token) {
    console.error("GitHub OAuth token exchange failed:", tokenData);

    return NextResponse.redirect(
      new URL("/settings?github=error", request.url),
    );
  }

  const accessToken = tokenData.access_token;

  // Verify the token immediately with GitHub
  const githubResponse = await fetch("https://api.github.com/user", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "Relay",
    },
    cache: "no-store",
  });

  if (!githubResponse.ok) {
    const githubError = await githubResponse.text();

    console.error(
      "GitHub token verification failed:",
      githubResponse.status,
      githubError,
    );

    return NextResponse.redirect(
      new URL("/settings?github=error", request.url),
    );
  }

  const githubUser = await githubResponse.json();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(
      new URL("/login", request.url),
    );
  }

  let encryptedToken: string;

  try {
    encryptedToken = encryptToken(accessToken);
  } catch (error) {
    console.error("Failed to encrypt GitHub token:", error);

    return new NextResponse(
      "Failed to secure GitHub connection.",
      { status: 500 },
    );
  }

  const { error: saveError } = await supabase
    .from("github_connections")
    .upsert(
      {
        user_id: user.id,
        github_user_id: githubUser.id,
        github_login: githubUser.login,
        access_token_encrypted: encryptedToken,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      },
    );

  if (saveError) {
    console.error(
      "Failed to save GitHub connection:",
      saveError,
    );

    return NextResponse.redirect(
      new URL("/settings?github=error", request.url),
    );
  }

  const response = NextResponse.redirect(
    new URL("/settings?github=connected", request.url),
  );

  response.cookies.delete("github_oauth_state");

  return response;
}