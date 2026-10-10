# Relay

Relay is a pull request review dashboard for GitHub. You connect your GitHub account, pick a repository, and Relay lists its open pull requests, runs an AI review on the diff, and shows the findings by file and severity. It also tracks review activity, like how long PRs wait for a first review.

## Features

- GitHub OAuth with a state check, tokens encrypted with AES-256-GCM before they're stored
- Repository picker for every repo your account can access
- AI review of a PR's diff using a local model through Ollama, with findings grouped by severity and category
- GitHub webhooks keep pull request history up to date without polling
- Review stats: median time to first review, PRs waiting 3+ days, PRs merged this week
- Supabase auth and Postgres with row level security

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Supabase, Vitest, Docker

## How it works

When you pick a repository, Relay saves it to your workspace, adds a webhook to the repo on GitHub, and imports the last 50 pull requests with their first review times. After that, GitHub sends `pull_request` and `pull_request_review` events to `/api/github/webhook`. The route checks the `X-Hub-Signature-256` header against the webhook secret before saving anything.

Adding the webhook needs admin access to the repo and a public URL, so live updates are off when running on localhost. Settings shows whether they're on for the current repo.

## Running locally

```bash
npm install
npm run dev
```

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=

GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_REDIRECT_URI=http://localhost:3000/auth/github/callback
GITHUB_TOKEN_ENCRYPTION_KEY=   # openssl rand -hex 32
GITHUB_WEBHOOK_SECRET=         # openssl rand -hex 32

# Optional
RELAY_URL=                     # public URL, used for the webhook
OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5-coder:7b
```

Run the SQL in `supabase/migrations` in the Supabase SQL editor. For AI reviews, install [Ollama](https://ollama.com) and run `ollama pull qwen2.5-coder:7b`.

### Docker

```bash
docker compose --env-file .env.local up --build
```

The container reaches Ollama on your machine through `host.docker.internal`.

## Scripts

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

CI runs all four on every push and pull request.
