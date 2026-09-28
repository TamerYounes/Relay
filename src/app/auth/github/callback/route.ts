import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";

function encryptToken(token: string) {
  const keyHex = process.env.GITHUB_TOKEN_ENCRYPTION_KEY;

  if (!keyHex) {
    throw new Error("GitHub token encryption key is not configured.");
  }

  const key = Buffer.from(keyHex, "hex");
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

  const oauthState = request.headers
    .get("cookie")
    ?.split("; ")
    .find((cookie) => cookie.startsWith("github_oauth_state="))
    ?.split("=")[1];

  if (
    error ||
    !code ||
    !state ||
    !oauthState ||
    state !== oauthState
  ) {
    return NextResponse.redirect(
      new URL("/settings?github=error", request.url),
    );
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const redirectUri = process.env.GITHUB_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return new NextResponse("GitHub OAuth is not configured.", {
      status: 500,
    });
  }

  const tokenResponse = await fetch(
    "https://github.com/login/oauth/access_token",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    },
  );

  const tokenData = await tokenResponse.json();

  if (!tokenData.access_token) {
    return NextResponse.redirect(
      new URL("/settings?github=error", request.url),
    );
  }

  const githubResponse = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!githubResponse.ok) {
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
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const encryptedToken = encryptToken(tokenData.access_token);

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
    console.error("Failed to save GitHub connection:", saveError);

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