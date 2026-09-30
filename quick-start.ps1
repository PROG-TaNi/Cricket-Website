# VJTI Cricket Registration - Quick Start Script
# This script helps verify your setup and run tests

param(
    [switch]$Setup,
    [switch]$Test,
    [switch]$Dev,
    [switch]$All
)

$ErrorActionPreference = "Continue"

# Colors for output
function Write-Success { Write-Host "✓ $args" -ForegroundColor Green }
function Write-Error-Custom { Write-Host "✗ $args" -ForegroundColor Red }
function Write-Info { Write-Host "ℹ $args" -ForegroundColor Cyan }
function Write-Warning-Custom { Write-Host "⚠ $args" -ForegroundColor Yellow }
function Write-Section { Write-Host "`n=== $args ===" -ForegroundColor Blue }

# Banner
Write-Host @"

╔═══════════════════════════════════════════════════════╗
║   🏏 VJTI Cricket Registration - Quick Start   🏏    ║
╚═══════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

# Check if .env exists
function Test-EnvFile {
    Write-Section "Checking Environment Configuration"
    
    if (-not (Test-Path ".env")) {
        Write-Error-Custom ".env file not found!"
        Write-Info "Please copy .env.example to .env and fill in your Supabase credentials"
        return $false
    }
    
    Write-Success ".env file exists"
    
    # Read and check .env
    $envContent = Get-Content ".env" -Raw
    
    $checks = @(
        @{ Pattern = "VITE_SUPABASE_URL=https://.*\.supabase\.co"; Name = "Supabase URL" }
        @{ Pattern = "VITE_SUPABASE_ANON_KEY=eyJ"; Name = "Anon Key" }
        @{ Pattern = "SUPABASE_SERVICE_ROLE_KEY=eyJ"; Name = "Service Role Key" }
    )
    
    $allValid = $true
    foreach ($check in $checks) {
        if ($envContent -match $check.Pattern -and $envContent -notmatch "mock-") {
            Write-Success "$($check.Name) configured"
        } else {
            Write-Warning-Custom "$($check.Name) not configured or using mock values"
            $allValid = $false
        }
    }
    
    if (-not $allValid) {
        Write-Info "Please update .env with your real Supabase credentials"
        Write-Info "See SUPABASE_SETUP_GUIDE.md for instructions"
    }
    
    return $allValid
}

# Check Node modules
function Test-Dependencies {
    Write-Section "Checking Dependencies"
    
    if (-not (Test-Path "node_modules")) {
        Write-Warning-Custom "node_modules not found"
        Write-Info "Installing dependencies..."
        npm install
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Dependencies installed"
            return $true
        } else {
            Write-Error-Custom "Failed to install dependencies"
            return $false
        }
    }
    
    Write-Success "Dependencies installed"
    return $true
}

# Check database files
function Test-DatabaseFiles {
    Write-Section "Checking Database Setup Files"
    
    $files = @(
        "supabase-setup.sql",
        "test-database.mjs",
        "SUPABASE_SETUP_GUIDE.md",
        "DATABASE_REFERENCE.md"
    )
    
    $allExist = $true
    foreach ($file in $files) {
        if (Test-Path $file) {
            Write-Success "$file exists"
        } else {
            Write-Error-Custom "$file missing"
            $allExist = $false
        }
    }
    
    return $allExist
}

# Run database tests
function Invoke-DatabaseTest {
    Write-Section "Running Database Tests"
    
    Write-Info "Testing database connection and schema..."
    npm run test:db
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n"
        Write-Success "All database tests passed!"
        Write-Info "Your database is ready to use"
        return $true
    } else {
        Write-Host "`n"
        Write-Error-Custom "Some database tests failed"
        Write-Info "Please check the errors above and refer to SUPABASE_SETUP_GUIDE.md"
        return $false
    }
}

# Start dev server
function Start-DevServer {
    Write-Section "Starting Development Server"
    
    Write-Info "Starting Vite dev server..."
    Write-Info "Press Ctrl+C to stop"
    Write-Host ""
    
    npm run dev
}

# Show setup instructions
function Show-SetupInstructions {
    Write-Section "Setup Instructions"
    
    Write-Host @"

To set up your database, follow these steps:

1. Create a Supabase project at https://supabase.com

2. Run the SQL setup script:
   - Open Supabase Dashboard → SQL Editor
   - Copy contents of supabase-setup.sql
   - Paste and click "Run"

3. Get your credentials:
   - Dashboard → Settings → API
   - Copy Project URL and API keys

4. Update .env file:
   - Replace VITE_SUPABASE_URL with your Project URL
   - Replace VITE_SUPABASE_ANON_KEY with your anon key
   - Replace SUPABASE_SERVICE_ROLE_KEY with your service role key

5. Test the setup:
   .\quick-start.ps1 -Test

For detailed instructions, see: SUPABASE_SETUP_GUIDE.md

"@ -ForegroundColor White
}

# Main execution
if ($Setup -or $All) {
    Show-SetupInstructions
}

if ($Test -or $All) {
    $envOk = Test-EnvFile
    $depsOk = Test-Dependencies
    $filesOk = Test-DatabaseFiles
    
    if ($envOk -and $depsOk -and $filesOk) {
        Write-Host ""
        Invoke-DatabaseTest
    } else {
        Write-Host "`n"
        Write-Error-Custom "Setup incomplete. Please fix the issues above first."
        Write-Info "Run: .\quick-start.ps1 -Setup for instructions"
        exit 1
    }
}

if ($Dev) {
    $envOk = Test-EnvFile
    $depsOk = Test-Dependencies
    
    if ($envOk -and $depsOk) {
        Start-DevServer
    } else {
        Write-Error-Custom "Cannot start dev server - setup incomplete"
        exit 1
    }
}

# If no parameters, show help
if (-not ($Setup -or $Test -or $Dev -or $All)) {
    Write-Host @"

Usage: .\quick-start.ps1 [options]

Options:
  -Setup    Show setup instructions
  -Test     Run database tests and verify setup
  -Dev      Start development server
  -All      Run all checks and tests

Examples:
  .\quick-start.ps1 -Setup    # First time setup
  .\quick-start.ps1 -Test     # Test database connection
  .\quick-start.ps1 -Dev      # Start dev server
  .\quick-start.ps1 -All      # Run everything

For detailed guides, see:
  - SUPABASE_SETUP_GUIDE.md
  - SETUP_CHECKLIST.md
  - DATABASE_REFERENCE.md

"@ -ForegroundColor White
}
