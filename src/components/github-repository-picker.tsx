"use client";

import { useState } from "react";

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

  async function loadRepositories() {
    setOpen(true);
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/github/repos");

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
        body: JSON.stringify(repository),
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

  return (
    <div>
      {currentRepository && (
        <p className="mb-3 text-xs text-zinc-500">
          Current repository:{" "}
          <span className="font-medium text-zinc-700">
            {currentRepository}
          </span>
        </p>
      )}

      <button
        type="button"
        onClick={loadRepositories}
        className="rounded-md border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
      >
        {currentRepository ? "Change repository" : "Choose repository"}
      </button>

      {open && (
        <div className="mt-4 overflow-hidden rounded-md border border-zinc-200">
          <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-3">
            <p className="text-xs font-semibold text-zinc-800">
              GitHub repositories
            </p>
          </div>

          {loading && (
            <p className="px-4 py-5 text-xs text-zinc-500">
              Loading repositories...
            </p>
          )}

          {error && (
            <div className="border-b border-red-100 bg-red-50 px-4 py-4">
              <p className="text-xs font-medium text-red-700">{error}</p>
            </div>
          )}

          {message && (
            <div className="border-b border-emerald-100 bg-emerald-50 px-4 py-4">
              <p className="text-xs font-medium text-emerald-700">
                {message}
              </p>
            </div>
          )}

          {!loading && !error && repositories.length === 0 && (
            <p className="px-4 py-5 text-xs text-zinc-500">
              No repositories found.
            </p>
          )}

          {!loading && repositories.length > 0 && (
            <>
              <div className="max-h-80 overflow-y-auto">
                {repositories.map((repository) => {
                  const selected =
                    selectedRepository === repository.full_name;

                  return (
                    <button
                      key={repository.id}
                      type="button"
                      onClick={() => chooseRepository(repository)}
                      className={`flex w-full items-center justify-between border-b border-zinc-100 px-4 py-3 text-left last:border-0 ${
                        selected
                          ? "bg-zinc-100"
                          : "hover:bg-zinc-50"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-medium text-zinc-900">
                          {repository.full_name}
                        </p>

                        <p className="mt-0.5 text-xs text-zinc-400">
                          {repository.private ? "Private" : "Public"} ·{" "}
                          {repository.default_branch}
                        </p>
                      </div>

                      {selected && (
                        <span className="text-xs font-medium text-zinc-700">
                          Selected
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between border-t border-zinc-200 bg-white px-4 py-3">
                <p className="text-xs text-zinc-400">
                  {selectedRepository
                    ? selectedRepository
                    : "Select a repository"}
                </p>

                <button
                  type="button"
                  onClick={saveRepository}
                  disabled={!selectedRepository || saving}
                  className="rounded-md bg-zinc-900 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
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