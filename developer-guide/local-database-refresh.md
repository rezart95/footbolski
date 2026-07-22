# Refreshing the local database from production

`/CLAUDE.md` documents the basic `pg_dump` / `pg_restore` pair for pulling a
read-only copy of production into the local Docker Postgres. That command
now silently produces an **incomplete** restore, because the messaging
migrations (`0011`–`0013`) added tables with foreign keys into `events` and
`players`.

## Why the simple version breaks

`pg_restore --clean --if-exists` drops and recreates objects in dependency
order, but it can't drop `events` or `players` while `action_tokens`,
`motm_votes`, or `consent_records` still reference them via foreign key.
The restore proceeds anyway, logs a batch of "errors ignored on restore"
warnings, and leaves you with a mix of old and new rows — no crash, no
obvious signal, just quietly wrong data.

We hit this directly: a `--clean` restore against a 10-event, 41-player
production snapshot came back with 7 events and 30 players. The warning
count (21 ignored errors) was the only clue.

## The fix: drop the schema, don't clean it

```bash
# 1. Read-only dump from prod (unchanged from CLAUDE.md)
docker exec footbolski-db-local sh -c \
  "pg_dump --no-owner --no-privileges -Fc -f /tmp/prod.dump '<PROD_DATABASE_URL>'"

# 2. Nuke the local schema entirely rather than --clean restoring over it
docker exec -e PGPASSWORD=footbolski footbolski-db-local \
  psql -h 127.0.0.1 -U footbolski -d footbolski -c \
  "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO footbolski; GRANT ALL ON SCHEMA public TO public;"

# 3. Restore into the now-empty schema — no --clean needed, nothing to conflict with
docker exec -e PGPASSWORD=footbolski footbolski-db-local sh -c \
  "pg_restore --no-owner --no-privileges -h 127.0.0.1 -U footbolski -d footbolski /tmp/prod.dump"
```

Verify the counts match prod before trusting the copy:

```bash
docker exec -e PGPASSWORD=footbolski footbolski-db-local \
  psql -h 127.0.0.1 -U footbolski -d footbolski -tAc \
  "select 'events=' || (select count(*) from events)
        || ' registrations=' || (select count(*) from registrations)
        || ' players=' || (select count(*) from players)
        || ' schema=' || (select version_num from alembic_version);"
```

The dump captures whatever schema version production is on — expect the
local copy to land a few migrations behind `head`. Bring it current the
normal way:

```bash
cd backend
uv run alembic upgrade head
```

This is also the cheapest way to rehearse a migration against real data
before it goes anywhere near production: restore, upgrade, check nothing
threw and the row counts didn't drop.

## Step 2 is destructive — say so out loud

`DROP SCHEMA public CASCADE` deletes every table in the target database.
It is scoped to the **local** Docker container
(`footbolski-db-local`, port 5435) and does not touch production, but
confirm you're pointed at the local container before running it — the same
command against the wrong host has no undo.
