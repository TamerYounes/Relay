export function DashboardHeader() {
  return (
    <section className="flex flex-col gap-5 border-b border-zinc-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="mb-3 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#3b4fd8]" />
          <p className="text-xs font-semibold uppercase tracking-wide text-[#3b4fd8]">
            Overview
          </p>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
          Pull requests
        </h1>

        <p className="mt-1.5 text-sm text-zinc-500">
          Review activity across your repositories.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-left">
          <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
            Repository
          </p>

          <p className="mt-0.5 font-mono text-xs font-medium text-zinc-800">
            acme / production
          </p>
        </div>

        <button
          type="button"
          className="h-10.5 rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
        >
          Filter
        </button>
      </div>
    </section>
  );
}