<#
.SYNOPSIS
    Refreshes the local Docker Postgres copy (footbolski-db-local) from the live prod database.

.DESCRIPTION
    Runs pg_dump against prod (read-only) and pg_restore --clean into the local
    footbolski-db-local container, both executed inside that container so no
    pg_dump/pg_restore install is required on the host. Mirrors the workflow
    documented in CLAUDE.md.

    The prod connection string is read from .mcp.json's `postgres` MCP server
    entry by default, so no credentials need to live in this (tracked) script.

.PARAMETER ProdUrl
    Override the prod Postgres connection string instead of reading it from .mcp.json.

.PARAMETER Force
    Skip the confirmation prompt.

.EXAMPLE
    ./scripts/refresh-local-db.ps1

.EXAMPLE
    ./scripts/refresh-local-db.ps1 -Force
#>
param(
    [string]$ProdUrl,
    [switch]$Force
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$containerName = "footbolski-db-local"
$localUser = "footbolski"
$localDb = "footbolski"
$localPassword = "footbolski"

if (-not $ProdUrl) {
    $mcpPath = Join-Path $repoRoot ".mcp.json"
    if (-not (Test-Path $mcpPath)) {
        throw ".mcp.json not found at $mcpPath. Pass -ProdUrl explicitly, or recreate .mcp.json per CLAUDE.md's Deployment section."
    }
    $mcpConfig = Get-Content $mcpPath -Raw | ConvertFrom-Json
    $ProdUrl = $mcpConfig.mcpServers.postgres.env.DATABASE_URI
    if (-not $ProdUrl) {
        throw "Could not find mcpServers.postgres.env.DATABASE_URI in .mcp.json. Pass -ProdUrl explicitly."
    }
}

$running = docker ps --filter "name=^/$containerName`$" --format "{{.Names}}"
if (-not $running) {
    throw "$containerName is not running. Start it first: docker compose up -d db"
}

if (-not $Force) {
    Write-Host "This will REPLACE all data in the local '$localDb' database ($containerName) with a fresh copy of prod." -ForegroundColor Yellow
    $confirm = Read-Host "Type 'yes' to continue"
    if ($confirm -ne "yes") {
        Write-Host "Aborted."
        exit 1
    }
}

Write-Host "Dumping prod database into the container..." -ForegroundColor Cyan
docker exec $containerName sh -c "pg_dump --no-owner --no-privileges -Fc -f /tmp/prod.dump '$ProdUrl'"
if ($LASTEXITCODE -ne 0) {
    throw "pg_dump failed (exit $LASTEXITCODE)"
}

Write-Host "Restoring into local database..." -ForegroundColor Cyan
docker exec -e PGPASSWORD=$localPassword $containerName sh -c "pg_restore --no-owner --clean --if-exists -h 127.0.0.1 -U $localUser -d $localDb /tmp/prod.dump"
if ($LASTEXITCODE -ne 0) {
    throw "pg_restore failed (exit $LASTEXITCODE)"
}

docker exec $containerName sh -c "rm -f /tmp/prod.dump"

Write-Host "Local database refreshed from prod." -ForegroundColor Green
Write-Host "Run migrations if needed: cd backend; uv run alembic upgrade head" -ForegroundColor DarkGray
