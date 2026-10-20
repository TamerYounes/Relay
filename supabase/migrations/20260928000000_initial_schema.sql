-- Initial schema: workspaces, repositories, reviews and findings, plus the
-- encrypted GitHub connection. Every table has row-level security; users
-- only see rows for workspaces they're a member of.
--
-- Written to match the hosted database so a fresh project can be set up
-- from these migrations alone.

-- workspaces ---------------------------------------------------------------

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  -- foreign key to repositories added below, once that table exists
  selected_repository_id uuid
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'owner',
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create index workspace_members_user_id_idx on public.workspace_members (user_id);

-- repositories -------------------------------------------------------------

create table public.repositories (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  provider text not null default 'github',
  owner text not null,
  name text not null,
  full_name text not null,
  default_branch text not null default 'main',
  created_at timestamptz not null default now(),
  unique (workspace_id, full_name)
);

create index repositories_workspace_id_idx on public.repositories (workspace_id);

alter table public.workspaces
  add constraint workspaces_selected_repository_id_fkey
  foreign key (selected_repository_id)
  references public.repositories (id) on delete set null;

-- reviews ------------------------------------------------------------------

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  repository_id uuid not null references public.repositories (id) on delete cascade,
  github_pr_number integer not null,
  status text not null default 'pending'
    check (status in ('pending', 'running', 'completed', 'failed')),
  title text,
  -- head commit the review ran against, so new pushes can be detected
  commit_sha text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (repository_id, github_pr_number)
);

create index reviews_workspace_id_idx on public.reviews (workspace_id);
create index reviews_repository_id_idx on public.reviews (repository_id);

create table public.review_findings (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews (id) on delete cascade,
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  category text not null,
  title text not null,
  file_path text not null,
  line integer,
  explanation text not null,
  suggestion text,
  code_snippet text,
  created_at timestamptz not null default now()
);

create index review_findings_review_id_idx on public.review_findings (review_id);

-- github_connections -------------------------------------------------------

create table public.github_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  github_user_id bigint not null,
  github_login text not null,
  -- AES-256-GCM, "iv:authTag:ciphertext" in hex (see src/lib/github/encryption.ts)
  access_token_encrypted text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index github_connections_user_id_idx on public.github_connections (user_id);

-- row-level security -------------------------------------------------------

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.repositories enable row level security;
alter table public.reviews enable row level security;
alter table public.review_findings enable row level security;
alter table public.github_connections enable row level security;

create policy "Users can read their own workspaces"
  on public.workspaces for select to authenticated
  using ((select auth.uid()) = created_by);

create policy "Users can update their own workspaces"
  on public.workspaces for update to authenticated
  using ((select auth.uid()) = created_by)
  with check ((select auth.uid()) = created_by);

create policy "Users can read their own memberships"
  on public.workspace_members for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can read their workspace repositories"
  on public.repositories for select to authenticated
  using (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = repositories.workspace_id
        and wm.user_id = (select auth.uid())
    )
  );

create policy "Workspace members can insert repositories"
  on public.repositories for insert to authenticated
  with check (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = repositories.workspace_id
        and wm.user_id = (select auth.uid())
    )
  );

create policy "Workspace members can update repositories"
  on public.repositories for update to authenticated
  using (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = repositories.workspace_id
        and wm.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = repositories.workspace_id
        and wm.user_id = (select auth.uid())
    )
  );

create policy "Workspace members can view reviews"
  on public.reviews for select to authenticated
  using (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = reviews.workspace_id
        and wm.user_id = (select auth.uid())
    )
  );

create policy "Workspace members can insert reviews"
  on public.reviews for insert to authenticated
  with check (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = reviews.workspace_id
        and wm.user_id = (select auth.uid())
    )
  );

create policy "Workspace members can update reviews"
  on public.reviews for update to authenticated
  using (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = reviews.workspace_id
        and wm.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = reviews.workspace_id
        and wm.user_id = (select auth.uid())
    )
  );

create policy "Workspace members can view review findings"
  on public.review_findings for select to authenticated
  using (
    exists (
      select 1 from public.reviews r
      join public.workspace_members wm on wm.workspace_id = r.workspace_id
      where r.id = review_findings.review_id
        and wm.user_id = (select auth.uid())
    )
  );

create policy "Workspace members can insert review findings"
  on public.review_findings for insert to authenticated
  with check (
    exists (
      select 1 from public.reviews r
      join public.workspace_members wm on wm.workspace_id = r.workspace_id
      where r.id = review_findings.review_id
        and wm.user_id = (select auth.uid())
    )
  );

create policy "Users can manage their own GitHub connection"
  on public.github_connections for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
