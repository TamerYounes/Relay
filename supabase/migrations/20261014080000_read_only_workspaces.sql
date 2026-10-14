-- Read-only workspaces (used for the public demo account) and the missing
-- delete permission on review findings, which re-running a review needs.

alter table public.workspaces
  add column if not exists read_only boolean not null default false;

-- True when the signed-in user owns a read-only workspace. Security definer so
-- policies can call it without granting extra access to workspaces.
create or replace function public.is_read_only_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspaces w
    where w.created_by = (select auth.uid())
      and w.read_only
  );
$$;

revoke execute on function public.is_read_only_user() from public, anon;
grant execute on function public.is_read_only_user() to authenticated;

-- workspaces
drop policy if exists "Users can update their own workspaces" on public.workspaces;
create policy "Users can update their own workspaces"
  on public.workspaces for update to authenticated
  using ((select auth.uid()) = created_by and not read_only)
  with check ((select auth.uid()) = created_by and not read_only);

-- repositories
drop policy if exists "Workspace members can insert repositories" on public.repositories;
create policy "Workspace members can insert repositories"
  on public.repositories for insert to authenticated
  with check (
    not public.is_read_only_user()
    and exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = repositories.workspace_id
        and wm.user_id = (select auth.uid())
    )
  );

drop policy if exists "Workspace members can update repositories" on public.repositories;
create policy "Workspace members can update repositories"
  on public.repositories for update to authenticated
  using (
    not public.is_read_only_user()
    and exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = repositories.workspace_id
        and wm.user_id = (select auth.uid())
    )
  )
  with check (
    not public.is_read_only_user()
    and exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = repositories.workspace_id
        and wm.user_id = (select auth.uid())
    )
  );

-- reviews
drop policy if exists "Workspace members can insert reviews" on public.reviews;
create policy "Workspace members can insert reviews"
  on public.reviews for insert to authenticated
  with check (
    not public.is_read_only_user()
    and exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = reviews.workspace_id
        and wm.user_id = (select auth.uid())
    )
  );

drop policy if exists "Workspace members can update reviews" on public.reviews;
create policy "Workspace members can update reviews"
  on public.reviews for update to authenticated
  using (
    not public.is_read_only_user()
    and exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = reviews.workspace_id
        and wm.user_id = (select auth.uid())
    )
  )
  with check (
    not public.is_read_only_user()
    and exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = reviews.workspace_id
        and wm.user_id = (select auth.uid())
    )
  );

-- review_findings
drop policy if exists "Workspace members can insert review findings" on public.review_findings;
create policy "Workspace members can insert review findings"
  on public.review_findings for insert to authenticated
  with check (
    not public.is_read_only_user()
    and exists (
      select 1 from public.reviews r
      join public.workspace_members wm on wm.workspace_id = r.workspace_id
      where r.id = review_findings.review_id
        and wm.user_id = (select auth.uid())
    )
  );

drop policy if exists "Workspace members can delete review findings" on public.review_findings;
create policy "Workspace members can delete review findings"
  on public.review_findings for delete to authenticated
  using (
    not public.is_read_only_user()
    and exists (
      select 1 from public.reviews r
      join public.workspace_members wm on wm.workspace_id = r.workspace_id
      where r.id = review_findings.review_id
        and wm.user_id = (select auth.uid())
    )
  );

-- github_connections: read your own row; writes only outside read-only mode
drop policy if exists "Users can manage their own GitHub connection" on public.github_connections;

create policy "Users can read their own GitHub connection"
  on public.github_connections for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own GitHub connection"
  on public.github_connections for insert to authenticated
  with check ((select auth.uid()) = user_id and not public.is_read_only_user());

create policy "Users can update their own GitHub connection"
  on public.github_connections for update to authenticated
  using ((select auth.uid()) = user_id and not public.is_read_only_user())
  with check ((select auth.uid()) = user_id and not public.is_read_only_user());

create policy "Users can delete their own GitHub connection"
  on public.github_connections for delete to authenticated
  using ((select auth.uid()) = user_id and not public.is_read_only_user());
