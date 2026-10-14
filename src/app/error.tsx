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
      <div className="w-full max-w-md surface p-6">
        <h1 className="text-[18px] font-semibold text-zinc-900">
          Something went wrong
        </h1>

        <p className="mt-1.5 text-[14px] leading-6 text-zinc-600">
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
