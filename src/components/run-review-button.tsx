"use client";

import { useState } from "react";

export function RunReviewButton({
  prNumber,
  hasReview,
}: {
  prNumber: number;
  hasReview: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function runReview() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prNumber,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Review failed.");
      }

      setMessage(
        data.findingsCount !== undefined
          ? `Review complete · ${data.findingsCount} finding${
              data.findingsCount === 1 ? "" : "s"
            }`
          : "Review complete",
      );

      window.location.reload();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={runReview}
        disabled={loading || hasReview}
        className="inline-flex items-center rounded-md bg-zinc-900 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading
          ? "Reviewing..."
          : hasReview
            ? "Reviewed"
            : "Run review"}
      </button>

      {message && (
        <span className="text-xs text-zinc-500">
          {message}
        </span>
      )}
    </div>
  );
}