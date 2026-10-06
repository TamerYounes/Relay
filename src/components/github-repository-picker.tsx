"use client";

import { useState } from "react";
import { buttonStyles } from "./button-styles";

type Repository = {
  id: number;
  name: string;
  full_name: string;
  owner: string;
  default_branch: string;
  private: boolean;
};

export function GitHubRepositoryPicker({
  currentRepository,
}: {
  currentRepository?: string;
}) {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedRepository, setSelectedRepository] = useState<string | null>(
    null,
  );
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");

  async function loadRepositories() {
    setOpen(true);
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/github/repos", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load repositories.");
      }

      setRepositories(data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Couldn't load your GitHub repositories.",
      );
    } finally {
      setLoading(false);
    }
  }

  function chooseRepository(repository: Repository) {
    setSelectedRepository(repository.full_name);
    setError("");
    setMessage("");
  }

  async function saveRepository() {
    if (!selectedRepository) {
      return;
    }

    const repository = repositories.find(
      (item) => item.full_name === selectedRepository,
    );

    if (!repository) {
      setError("Repository not found.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/github/repos/select", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: repository.full_name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            `Request failed with status ${response.status}`,
        );
      }

      setMessage("Repository saved.");

      window.location.reload();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Couldn't save this repository.",
      );
    } finally {
      setSaving(false);
    }
  }

  const normalizedQuery = query.trim().toLowerCase();
  const visibleRepositories = normalizedQuery
    ? repositories.filter((repository) =>
        repository.full_name.toLowerCase().includes(normalizedQuery),
      )
    : repositories;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-zinc-500">
          {currentRepository ? (
            <>
              Current repository:{" "}
              <span className="font-mono font-medium text-zinc-800">
                {currentRepository}
              </span>
            </>
          ) : (
            "Pick a repository from your GitHub account."
          )}
        </p>

        {!open && (
          <button
            type="button"
            onClick={loadRepositories}
            className={buttonStyles.secondary}
          >
            {currentRepository ? "Change repository" : "Choose repository"}
          </button>
        )}
      </div>

      {open && (
        <div className="mt-3 overflow-hidden rounded-sm border border-zinc-300 bg-white shadow-[0_1px_0_rgb(0_0_0/0.04)]">
          <div className="flex items-center gap-2 border-b border-zinc-200 px-3 py-2">
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              className="h-3.5 w-3.5 shrink-0 text-zinc-400"
            >
              <circle cx="7" cy="7" r="4.5" />
              <path d="m10.5 10.5 3 3" />
            </svg>

            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter repositories"
              aria-label="Filter repositories"
              disabled={loading}
              className="h-7 min-w-0 flex-1 bg-transparent text-[13px] text-zinc-900 outline-none placeholder:text-zinc-400"
            />

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="shrink-0 rounded px-1.5 py-0.5 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
            >
              Cancel
            </button>
          </div>

          {loading && (
            <div className="divide-y divide-zinc-100" aria-label="Loading repositories">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="flex items-center gap-3 px-3 py-2.5">
                  <span className="h-3.5 w-3.5 rounded-full bg-zinc-100" />
                  <span className="h-3 w-48 animate-pulse rounded bg-zinc-100" />
                </div>
              ))}
            </div>
          )}

          {error && (
            <div role="alert" className="border-b border-red-100 bg-red-50 px-3 py-2.5">
              <p className="text-xs font-medium text-red-700">{error}</p>
            </div>
          )}

          {message && (
            <div role="status" className="border-b border-emerald-100 bg-emerald-50 px-3 py-2.5">
              <p className="text-xs font-medium text-emerald-700">
                {message}
              </p>
            </div>
          )}

          {!loading && !error && repositories.length === 0 && (
            <p className="px-3 py-6 text-center text-xs text-zinc-500">
              No repositories found for this GitHub account.
            </p>
          )}

          {!loading && repositories.length > 0 && (
            <>
              <div
                role="radiogroup"
                aria-label="GitHub repositories"
                className="max-h-72 divide-y divide-zinc-100 overflow-y-auto"
              >
                {visibleRepositories.length === 0 && (
                  <p className="px-3 py-6 text-center text-xs text-zinc-500">
                    No repositories match &ldquo;{query}&rdquo;.
                  </p>
                )}

                {visibleRepositories.map((repository) => {
                  const selected =
                    selectedRepository === repository.full_name;
                  const current = currentRepository === repository.full_name;

                  return (
                    <button
                      key={repository.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => chooseRepository(repository)}
                      className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors ${
                        selected ? "row-cursor bg-zinc-100" : "hover:bg-zinc-50"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border ${
                          selected
                            ? "border-zinc-900 bg-zinc-900"
                            : "border-zinc-300 bg-white"
                        }`}
                      >
                        {selected && (
                          <span className="h-1.5 w-1.5 rounded-full bg-white" />
                        )}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-mono text-xs font-medium text-zinc-900">
                          {repository.full_name}
                        </span>
                        <span className="block text-[11px] text-zinc-400">
                          {repository.default_branch}
                        </span>
                      </span>

                      {current && (
                        <span className="eyebrow shrink-0 text-emerald-700">
                          Current
                        </span>
                      )}

                      <span className="eyebrow shrink-0 rounded-xs border border-zinc-300 px-1 leading-4 text-zinc-500">
                        {repository.private ? "Private" : "Public"}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-zinc-200 bg-zinc-50 px-3 py-2">
                <p className="min-w-0 truncate text-xs text-zinc-500">
                  {selectedRepository ? (
                    <span className="font-mono text-zinc-800">
                      {selectedRepository}
                    </span>
                  ) : (
                    `${repositories.length} repositories`
                  )}
                </p>

                <button
                  type="button"
                  onClick={saveRepository}
                  disabled={!selectedRepository || saving}
                  className={buttonStyles.primary}
                >
                  {saving ? "Saving..." : "Save repository"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
