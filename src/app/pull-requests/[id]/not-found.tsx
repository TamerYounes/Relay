import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { buttonStyles } from "@/components/button-styles";
import { EmptyState } from "@/components/empty-state";

export default function PullRequestNotFound() {
  return (
    <AppShell>
      <main className="space-y-6">
        <nav aria-label="Breadcrumb" className="text-xs text-zinc-500">
          <Link href="/" className="font-medium transition-colors hover:text-zinc-950">
            Pull requests
          </Link>
        </nav>

        <EmptyState
          title="Pull request not found"
          description="This pull request doesn't exist in the selected repository, or Relay can't reach GitHub. Check your repository and GitHub connection in Settings."
          action={
            <>
              <Link href="/" className={buttonStyles.primary}>
                Back to pull requests
              </Link>
              <Link href="/settings" className={buttonStyles.secondary}>
                Open settings
              </Link>
            </>
          }
        />
      </main>
    </AppShell>
  );
}
