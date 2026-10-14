import { NextResponse } from "next/server";
import { decryptToken } from "@/lib/github/encryption";
import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * The public demo account, set with DEMO_EMAIL. It is read-only: the app
 * blocks writes here, and the read_only workspace flag blocks them in the
 * database as well.
 */
export function isDemoUser(email: string | null | undefined) {
  const demoEmail = process.env.DEMO_EMAIL;
  return Boolean(demoEmail && email && email.toLowerCase() === demoEmail.toLowerCase());
}

export function demoReadOnlyResponse() {
  return NextResponse.json(
    { error: "The demo is read-only." },
    { status: 403 },
  );
}

/**
 * GitHub token for reading pull requests. The demo account uses
 * DEMO_GITHUB_TOKEN (a read-only token limited to the demo repository), so
 * demo visitors never touch a real user's GitHub connection.
 */
export async function getGitHubToken(
  supabase: SupabaseServerClient,
  user: { id: string; email?: string | null },
): Promise<string | null> {
  if (isDemoUser(user.email)) {
    return process.env.DEMO_GITHUB_TOKEN ?? null;
  }

  const { data: connection } = await supabase
    .from("github_connections")
    .select("access_token_encrypted")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!connection) {
    return null;
  }

  return decryptToken(connection.access_token_encrypted);
}
