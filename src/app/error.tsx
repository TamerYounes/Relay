"use client";

import Link from "next/link";
import { useEffect } from "react";
import { buttonStyles } from "@/components/button-styles";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded border border-zinc-200 border-l-[3px] border-l-red-600 bg-white p-6">
        <p className="eyebrow text-red-700">Error</p>

        <h1 className="mt-1.5 text-[17px] font-semibold text-zinc-950">
          Something went wrong
        </h1>

        <p className="mt-1 text-[13px] leading-5 text-zinc-500">
          Relay hit an unexpected error while loading this page. Try again, or
          head back to your pull requests.
        </p>

        {error.digest && (
          <p className="mt-3 font-mono text-[11px] text-zinc-400">
            Error ID: {error.digest}
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => retry()}
            className={buttonStyles.primary}
          >
            Try again
          </button>

          <Link href="/" className={buttonStyles.secondary}>
            Go to pull requests
          </Link>
        </div>
      </div>
    </main>
  );
}
