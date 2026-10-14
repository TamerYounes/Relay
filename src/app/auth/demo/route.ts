import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Signs in to the read-only demo account. The password stays on the server
 * (DEMO_EMAIL / DEMO_PASSWORD), so it never reaches the browser.
 */
export async function POST(request: Request) {
  const email = process.env.DEMO_EMAIL;
  const password = process.env.DEMO_PASSWORD;

  if (!email || !password) {
    return NextResponse.redirect(new URL("/login?demo=unavailable", request.url), 303);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    console.error("Demo sign-in failed:", error.message);
    return NextResponse.redirect(new URL("/login?demo=unavailable", request.url), 303);
  }

  return NextResponse.redirect(new URL("/", request.url), 303);
}
