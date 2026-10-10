import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  findRepositoryIds,
  saveReview,
  savePullRequest,
  type GitHubPullRequestPayload,
  type GitHubReviewPayload,
} from "@/lib/github/sync";
import { verifySignature } from "@/lib/github/webhooks";

type WebhookPayload = {
  action?: string;
  repository?: { id: number; full_name: string };
  pull_request?: GitHubPullRequestPayload;
  review?: GitHubReviewPayload;
};

export async function POST(request: Request) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  const admin = createAdminClient();

  if (!secret || !admin) {
    return NextResponse.json(
      { error: "Webhooks are not configured." },
      { status: 503 },
    );
  }

  const body = await request.text();

  if (
    !verifySignature(secret, body, request.headers.get("x-hub-signature-256"))
  ) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  const event = request.headers.get("x-github-event");
  const payload = JSON.parse(body) as WebhookPayload;

  if (event === "ping") {
    return NextResponse.json({ ok: true });
  }

  if (!payload.repository || !payload.pull_request) {
    return NextResponse.json({ ignored: true });
  }

  try {
    const repositoryIds = await findRepositoryIds(admin, payload.repository);

    if (event === "pull_request") {
      await savePullRequest(admin, repositoryIds, payload.pull_request);
    }

    if (
      event === "pull_request_review" &&
      payload.action === "submitted" &&
      payload.review
    ) {
      await saveReview(
        admin,
        repositoryIds,
        payload.pull_request,
        payload.review,
      );
    }
  } catch (error) {
    console.error(`Failed to handle ${event} webhook:`, error);

    return NextResponse.json({ error: "Failed to save event." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
