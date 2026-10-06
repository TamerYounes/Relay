import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const { error } = await supabase
    .from("github_connections")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to disconnect GitHub:", error);

    return NextResponse.json(
      { error: "Failed to disconnect GitHub." },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}