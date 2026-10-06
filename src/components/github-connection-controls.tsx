"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buttonStyles } from "./button-styles";

export function GitHubConnectionControls() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function disconnect() {
    if (!window.confirm("Disconnect your GitHub account from Relay?")) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/github/disconnect", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to disconnect GitHub.");
      }

      router.refresh();
    } catch (error) {
      console.error(error);
      window.alert("Failed to disconnect GitHub. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      <a
        href="/auth/github"
        className={buttonStyles.secondary}
      >
        Reconnect
      </a>

      <button
        type="button"
        onClick={disconnect}
        disabled={loading}
        className={buttonStyles.danger}
      >
        {loading ? "Disconnecting..." : "Disconnect"}
      </button>
    </div>
  );
}