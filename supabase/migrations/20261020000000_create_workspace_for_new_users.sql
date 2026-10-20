-- Gives every new user a workspace they own. Without this, a user added in a
-- fresh project lands on "No workspace found", since nothing in the app or
-- the policies lets a user create one.

create or replace function public.create_workspace_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_workspace_id uuid;
begin
  insert into public.workspaces (name, created_by)
  values ('My workspace', new.id)
  returning id into new_workspace_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (new_workspace_id, new.id, 'owner');

  return new;
end;
$$;

revoke execute on function public.create_workspace_for_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.create_workspace_for_new_user();

-- Existing users without a workspace get one too.
with missing as (
  select u.id as user_id
  from auth.users u
  where not exists (
    select 1 from public.workspaces w where w.created_by = u.id
  )
),
created as (
  insert into public.workspaces (name, created_by)
  select 'My workspace', user_id from missing
  returning id, created_by
)
insert into public.workspace_members (workspace_id, user_id, role)
select id, created_by, 'owner' from created;
