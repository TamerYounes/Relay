"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
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
    <main data-surface="ink" className="flex min-h-screen items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6">
          <span className="flex h-8 w-8 items-center justify-center rounded-xs bg-signal font-mono text-[15px] font-bold text-ink">
            R
          </span>
          <h1 className="mt-5 text-[22px] font-semibold tracking-[-0.02em] text-white">
            Sign in to Relay
          </h1>
          <p className="mt-1 text-[13px] text-ink-muted">
            Review pull requests across your workspace.
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="space-y-4 rounded border border-ink-line bg-white p-5 [&_:focus-visible]:outline-zinc-900"
        >
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-[13px] font-medium text-zinc-900"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="h-9 w-full rounded-sm border border-zinc-300 bg-white px-3 text-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-signal/60"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-[13px] font-medium text-zinc-900"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="h-9 w-full rounded-sm border border-zinc-300 bg-white px-3 text-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-signal/60"
            />
          </div>

          {error && (
            <p
              className="rounded-sm border border-red-200 border-l-[3px] border-l-red-600 bg-red-50 px-3 py-2 text-[13px] text-red-800"
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-9 w-full rounded-sm bg-zinc-900 px-4 text-sm font-medium text-white transition hover:bg-zinc-700 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}