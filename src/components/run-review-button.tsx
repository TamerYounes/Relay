"use client";

import { useState } from "react";
import { buttonStyles } from "./button-styles";

export function RunReviewButton({
  prNumber,
  hasReview,
}: {
  prNumber: number;
  hasReview: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);

  async function runReview() {
    setLoading(true);
    setMessage("");
    setFailed(false);

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
      setFailed(true);
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
    <div className="flex flex-wrap items-center gap-2">
      {message && (
        <span
          role={failed ? "alert" : "status"}
          className={`order-last w-full text-xs sm:order-first sm:w-auto ${
            failed ? "text-red-600" : "text-zinc-500"
          }`}
        >
          {message}
        </span>
      )}

      <button
        type="button"
        onClick={runReview}
        disabled={loading || hasReview}
        className={buttonStyles.primary}
      >
        {loading && (
          <span
            aria-hidden="true"
            className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-white/40 border-t-white"
          />
        )}
        {loading
          ? "Reviewing..."
          : hasReview
            ? "Reviewed"
            : "Run review"}
      </button>
    </div>
  );
}
