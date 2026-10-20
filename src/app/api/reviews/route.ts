import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOllamaUrl } from "@/lib/ai-review";
import { fetchAllPages, GitHubError, githubHeaders } from "@/lib/github/api";
import { reviewPullRequest, type ChangedFile } from "@/lib/review";
import {
  demoReadOnlyResponse,
  demoReviewsAllowed,
  getGitHubToken,
  isDemoUser,
} from "@/lib/demo";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  if (isDemoUser(user.email) && !demoReviewsAllowed()) {
    return demoReadOnlyResponse();
  }

  let body: { prNumber?: number };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const prNumber = body.prNumber;

  if (
    !prNumber ||
    !Number.isInteger(prNumber) ||
    prNumber < 1
  ) {
    return NextResponse.json(
      { error: "A valid pull request number is required." },
      { status: 400 },
    );
  }

  const { data: workspace, error: workspaceError } =
    await supabase
      .from("workspaces")
      .select("id, selected_repository_id")
      .eq("created_by", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

  if (workspaceError) {
    console.error(
      "Failed to load workspace:",
      workspaceError,
    );

    return NextResponse.json(
      { error: "Failed to load workspace." },
      { status: 500 },
    );
  }

  if (!workspace) {
    return NextResponse.json(
      { error: "Workspace not found." },
      { status: 404 },
    );
  }

  if (!workspace.selected_repository_id) {
    return NextResponse.json(
      { error: "No repository selected." },
      { status: 400 },
    );
  }

  const { data: repository, error: repositoryError } =
    await supabase
      .from("repositories")
      .select("id, owner, name, full_name")
      .eq("id", workspace.selected_repository_id)
      .maybeSingle();

  if (repositoryError) {
    console.error(
      "Failed to load repository:",
      repositoryError,
    );

    return NextResponse.json(
      { error: "Failed to load repository." },
      { status: 500 },
    );
  }

  if (!repository) {
    return NextResponse.json(
      { error: "Selected repository not found." },
      { status: 404 },
    );
  }

  let token: string | null = null;

  try {
    token = await getGitHubToken(supabase, user);
  } catch {
    return NextResponse.json(
      { error: "Unable to decrypt GitHub connection." },
      { status: 500 },
    );
  }

  if (!token) {
    return NextResponse.json(
      { error: "GitHub is not connected." },
      { status: 400 },
    );
  }

  const { data: existingReview } = await supabase
    .from("reviews")
    .select("id, status, commit_sha")
    .eq("repository_id", repository.id)
    .eq("github_pr_number", prNumber)
    .maybeSingle();

  const headers = githubHeaders(token);

  try {
    const repositoryPath = `${encodeURIComponent(
      repository.owner,
    )}/${encodeURIComponent(repository.name)}`;

    const pullRequestResponse = await fetch(
      `https://api.github.com/repos/${repositoryPath}/pulls/${prNumber}`,
      {
        headers,
        cache: "no-store",
      },
    );

    if (!pullRequestResponse.ok) {
      return NextResponse.json(
        {
          error:
            "Failed to load the pull request from GitHub.",
        },
        { status: pullRequestResponse.status },
      );
    }

    const pullRequest = await pullRequestResponse.json();

    // Only re-review when new commits were pushed since the last review.
    if (
      existingReview?.status === "completed" &&
      existingReview.commit_sha === (pullRequest.head?.sha ?? null)
    ) {
      return NextResponse.json({
        reviewId: existingReview.id,
        status: "completed",
        message: "This commit has already been reviewed.",
      });
    }

    // GitHub returns up to 3,000 files, 100 per page.
    let files: ChangedFile[];

    try {
      files = await fetchAllPages<ChangedFile>(
        `https://api.github.com/repos/${repositoryPath}/pulls/${prNumber}/files?per_page=100`,
        token,
        30,
      );
    } catch (error) {
      return NextResponse.json(
        { error: "Failed to load changed files from GitHub." },
        { status: error instanceof GitHubError ? error.status : 502 },
      );
    }

    let reviewId = existingReview?.id;

    if (!reviewId) {
      const { data: review, error: reviewError } =
        await supabase
          .from("reviews")
          .insert({
            workspace_id: workspace.id,
            repository_id: repository.id,
            github_pr_number: prNumber,
            status: "running",
            title: pullRequest.title,
            commit_sha: pullRequest.head?.sha ?? null,
          })
          .select("id")
          .single();

      if (reviewError || !review) {
        console.error(
          "Failed to create review:",
          reviewError,
        );

        return NextResponse.json(
          { error: "Failed to create review." },
          { status: 500 },
        );
      }

      reviewId = review.id;
    } else {
      await supabase
        .from("reviews")
        .update({
          status: "running",
          title: pullRequest.title,
          commit_sha:
            pullRequest.head?.sha ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", reviewId);

      await supabase
        .from("review_findings")
        .delete()
        .eq("review_id", reviewId);
    }

    const { findings, ruleFindingsCount, aiFindingsCount } =
      await reviewPullRequest(files, { ollamaUrl: getOllamaUrl() });

    if (findings.length > 0) {
      const { error: findingsError } =
        await supabase
          .from("review_findings")
          .insert(
            findings.map((finding) => ({
              review_id: reviewId,
              severity: finding.severity,
              category: finding.category,
              title: finding.title,
              file_path: finding.file_path,
              line: finding.line,
              explanation: finding.explanation,
              suggestion: finding.suggestion,
              code_snippet: finding.code_snippet,
            })),
          );

      if (findingsError) {
        console.error(
          "Failed to save review findings:",
          findingsError,
        );

        await supabase
          .from("reviews")
          .update({
            status: "failed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", reviewId);

        return NextResponse.json(
          { error: "Failed to save review findings." },
          { status: 500 },
        );
      }
    }

    await supabase
      .from("reviews")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", reviewId);

    return NextResponse.json({
      reviewId,
      status: "completed",
      findingsCount: findings.length,
      deterministicFindingsCount: ruleFindingsCount,
      aiFindingsCount,
    });
  } catch (error) {
    console.error("Review failed:", error);

    return NextResponse.json(
      { error: "Failed to review pull request." },
      { status: 500 },
    );
  }
}