"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function UserProfile() {
  const [email, setEmail] = useState("");

  useEffect(() => {
    const supabase = createClient();

    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setEmail(user?.email ?? "");
    }

    loadUser();
  }, []);

  return (
    <div className="flex items-center gap-3 px-3 py-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-semibold text-zinc-600">
        {email ? email.charAt(0).toUpperCase() : "U"}
      </span>

      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-zinc-800">
          {email || "User"}
        </p>

        <p className="text-[11px] text-zinc-400">Developer</p>
      </div>
    </div>
  );
}