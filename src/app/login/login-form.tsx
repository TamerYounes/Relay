"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { RelayMark } from "@/components/icons";

const demoEnabled = process.env.NEXT_PUBLIC_DEMO_ENABLED === "true";

export function LoginForm({ demoUnavailable }: { demoUnavailable: boolean }) {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(
    demoUnavailable ? "The demo isn't available right now. Try again later." : "",
  );
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-background">
            <RelayMark className="h-5 w-5" />
          </span>
          <h1 className="mt-6 text-[24px] font-bold tracking-[-0.025em] text-ink">
            Sign in
          </h1>
          <p className="mt-1 text-[14px] text-ink-muted">
            Review pull requests on your selected repository.
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="surface space-y-4 p-6"
        >
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-[13px] font-medium text-ink"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="h-10 w-full rounded-lg border border-line bg-surface-2 px-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-[13px] font-medium text-ink"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="h-10 w-full rounded-lg border border-line bg-surface-2 px-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>

          {error && (
            <p
              className="rounded-lg bg-red-500/10 px-3 py-2 text-[13px] text-red-300 ring-1 ring-inset ring-red-400/25"
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-10 w-full rounded-lg bg-accent px-4 text-sm font-semibold text-background transition hover:bg-accent-strong active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {demoEnabled && (
          <form action="/auth/demo" method="post" className="mt-4">
            <button
              type="submit"
              className="h-10 w-full rounded-lg bg-surface-2 px-4 text-sm font-medium text-ink shadow-(--shadow-card) transition hover:bg-surface-3"
            >
              Try the demo
            </button>
            <p className="mt-2 text-center text-[12.5px] text-ink-faint">
              Read-only, with a sample repository. No sign-up needed.
            </p>
          </form>
        )}
      </div>
    </main>
  );
}