-- Pull request history for review stats, filled by the repo sync and GitHub webhooks.

alter table repositories
  add column if not exists github_repo_id bigint,
  add column if not exists webhook_id bigint;

create index if not exists repositories_github_repo_id_idx
  on repositories (github_repo_id);

create table if not exists pull_requests (
  id uuid primary key default gen_random_uuid(),
  repository_id uuid not null references repositories (id) on delete cascade,
  number integer not null,
  title text not null,
  author_login text,
  state text not null check (state in ('open', 'closed', 'merged')),
  draft boolean not null default false,
  opened_at timestamptz not null,
  first_review_at timestamptz,
  closed_at timestamptz,
  merged_at timestamptz,
  github_updated_at timestamptz not null,
  synced_at timestamptz not null default now(),
  unique (repository_id, number)
);

create index if not exists pull_requests_repository_opened_idx
  on pull_requests (repository_id, opened_at desc);

alter table pull_requests enable row level security;

-- Users can read rows for repositories in their own workspaces.
-- Writes go through the server with the secret key.
drop policy if exists "Read own pull requests" on pull_requests;
create policy "Read own pull requests" on pull_requests
  for select using (
    exists (
      select 1
      from repositories r
      join workspaces w on w.id = r.workspace_id
      where r.id = pull_requests.repository_id
        and w.created_by = auth.uid()
    )
  );

-- Lets the app create a workspace the first time a user picks a repository.
drop policy if exists "Create own workspace" on workspaces;
create policy "Create own workspace" on workspaces
  for insert with check (created_by = auth.uid());
