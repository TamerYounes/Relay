"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();

    await supabase.auth.signOut();

    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="mt-2 w-full rounded-md px-3 py-2 text-left text-xs text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
    >
      Sign out
    </button>
  );
}