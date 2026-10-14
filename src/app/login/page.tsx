"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { RelayMark } from "@/components/icons";

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
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white">
            <RelayMark className="h-5 w-5" />
          </span>
          <h1 className="mt-6 text-[24px] font-bold tracking-[-0.025em] text-zinc-900">
            Sign in
          </h1>
          <p className="mt-1 text-[14px] text-zinc-600">
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
              className="h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
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
              className="h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
            />
          </div>

          {error && (
            <p
              className="rounded-md bg-red-50 px-3 py-2 text-[13px] text-red-800"
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-10 w-full rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white transition hover:bg-zinc-700 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}