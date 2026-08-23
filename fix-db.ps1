# Sutaara database recovery — run this ONCE from D:\sutaara\server
# It resolves the "migration missing locally but applied in DB" state and
# gets you to a working seeded database in one go.
#
# Usage:
#   cd D:\sutaara\server
#   powershell -ExecutionPolicy Bypass -File ..\fix-db.ps1
#
# It exits at the first error so you can see exactly which step failed
# instead of a wall of red text.

$ErrorActionPreference = 'Stop'
$PSDefaultParameterValues['*:Encoding'] = 'utf8'

function Step($msg) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  $msg" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
}

# --- 0. Sanity check that we're in the right folder ------------------------
if (-not (Test-Path 'prisma\schema.prisma')) {
    Write-Host "ERROR: run this from D:\sutaara\server (schema.prisma not found here)" -ForegroundColor Red
    exit 1
}

# --- 1. Clean any half-created migration folder from previous attempts -----
Step "1. Cleaning any partial migration folder"
$migDir = 'prisma\migrations\20260822061914_init'
if (Test-Path $migDir) {
    Remove-Item -Recurse -Force $migDir
    Write-Host "   removed old $migDir"
} else {
    Write-Host "   nothing to clean"
}

# --- 2. Regenerate the missing migration SQL file --------------------------
Step "2. Generating migration SQL (using -o so PowerShell can't corrupt it)"
New-Item -ItemType Directory -Force -Path $migDir | Out-Null

# Prisma 5+ supports -o directly, which sidesteps PowerShell's UTF-16-with-BOM
# redirect problem that broke earlier attempts. If -o isn't supported on this
# Prisma version we fall back to captured output written explicitly as UTF-8.
$sqlPath = Join-Path $migDir 'migration.sql'
try {
    npx --yes prisma migrate diff `
        --from-empty `
        --to-schema-datamodel prisma\schema.prisma `
        --script `
        -o $sqlPath
    if (-not (Test-Path $sqlPath) -or (Get-Item $sqlPath).Length -lt 100) {
        throw "output file too small"
    }
} catch {
    Write-Host "   -o path failed, falling back to captured output" -ForegroundColor Yellow
    $sql = & npx --yes prisma migrate diff `
        --from-empty `
        --to-schema-datamodel prisma\schema.prisma `
        --script 2>&1 | Out-String
    [System.IO.File]::WriteAllText((Resolve-Path -LiteralPath $migDir).Path + '\migration.sql', $sql, [System.Text.UTF8Encoding]::new($false))
}

$size = (Get-Item $sqlPath).Length
Write-Host "   wrote $sqlPath ($size bytes)"
if ($size -lt 500) {
    Write-Host "ERROR: migration.sql looks empty. Aborting." -ForegroundColor Red
    exit 1
}

# --- 3. Mark that migration as already applied on the live database --------
Step "3. Telling Prisma the init migration is already applied"
npx --yes prisma migrate resolve --applied 20260822061914_init
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# --- 4. Create + apply the email verification migration --------------------
Step "4. Adding the email verification migration"
# --create-only would just write the file; --name applies it too. Use
# --skip-generate so it doesn't waste time regenerating the client here —
# npm run seed will do that.
npx --yes prisma migrate dev --name email_verification --skip-seed
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# --- 5. Seed products + coupons + admin ------------------------------------
Step "5. Seeding products, coupons and admin"
npm run seed
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# --- 6. Done ---------------------------------------------------------------
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  All done." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Local dev is ready. To push the new migration to production:" -ForegroundColor Green
Write-Host ""
Write-Host "  cd .."
Write-Host "  git add server/prisma/migrations"
Write-Host "  git commit -m 'add email verification migration'"
Write-Host "  git push"
Write-Host ""
Write-Host "Then, from server/, run against the production DB (same command):"
Write-Host ""
Write-Host "  npx prisma migrate deploy"
Write-Host ""