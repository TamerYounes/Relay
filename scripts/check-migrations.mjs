// Applies every migration in supabase/migrations to an in-memory Postgres
// (PGlite) with a minimal stand-in for Supabase's auth schema, then checks
// that new users get a workspace and that row-level security holds.
//
// Run with: npm run check:migrations

import { readdirSync, readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

const dir = new URL("../supabase/migrations/", import.meta.url);
const db = new PGlite();

function check(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`ok: ${message}`);
}

async function asUser(id, fn) {
  await db.exec(`select set_config('request.jwt.claim.sub', '${id}', false); set role authenticated;`);
  try {
    return await fn();
  } finally {
    await db.exec("reset role;");
  }
}

async function fails(sql) {
  try {
    await db.exec(sql);
    return false;
  } catch {
    return true;
  }
}

await db.exec(`
  create role anon;
  create role authenticated;
  create schema auth;
  create table auth.users (id uuid primary key default gen_random_uuid(), email text);
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  grant usage on schema public, auth to authenticated;
  grant execute on function auth.uid() to authenticated;
  insert into auth.users (email) values ('before-migrations@example.com');
`);

for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
  await db.exec(readFileSync(new URL(file, dir), "utf8"));
  console.log(`applied ${file}`);
}

await db.exec(`
  insert into auth.users (email) values ('owner@example.com'), ('demo@example.com');
  grant select, insert, update, delete on all tables in schema public to authenticated;
`);

const users = Object.fromEntries(
  (await db.query("select email, id from auth.users")).rows.map((r) => [r.email, r.id]),
);
const workspaces = Object.fromEntries(
  (await db.query("select created_by, id from public.workspaces")).rows.map((r) => [
    r.created_by,
    r.id,
  ]),
);

check(Object.keys(users).every((id) => workspaces[users[id]]), "every user has a workspace");

const owner = users["owner@example.com"];
const demo = users["demo@example.com"];
await db.exec(`update public.workspaces set read_only = true where created_by = '${demo}'`);

await asUser(owner, async () => {
  const visible = (await db.query("select id from public.workspaces")).rows;
  check(visible.length === 1 && visible[0].id === workspaces[owner], "users only see their own workspace");

  check(
    !(await fails(
      `insert into public.repositories (workspace_id, owner, name, full_name)
       values ('${workspaces[owner]}', 'o', 'n', 'o/n')`,
    )),
    "owners can add repositories to their workspace",
  );

  check(
    await fails(
      `insert into public.repositories (workspace_id, owner, name, full_name)
       values ('${workspaces[demo]}', 'o', 'n', 'o/n')`,
    ),
    "users can't add repositories to someone else's workspace",
  );
});

await asUser(demo, async () => {
  check(
    await fails(
      `insert into public.repositories (workspace_id, owner, name, full_name)
       values ('${workspaces[demo]}', 'o', 'n', 'o/n')`,
    ),
    "read-only workspaces can't add repositories",
  );
});

console.log("migrations ok");
