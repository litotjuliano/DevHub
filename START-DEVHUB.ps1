# Nexus DevHub - Unified Service Manager
# PowerShell version for Windows

Write-Host "`n" -ForegroundColor White
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   Nexus DevHub - Unified Service Management           ║" -ForegroundColor Cyan
Write-Host "║   📁 Location: C:\Nexus Systems\DevHub                ║" -ForegroundColor Cyan
Write-Host "║   🎯 Manage: NexusTravel, NexusCount & More           ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host "`n" -ForegroundColor White

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to continue"
    exit 1
}

Write-Host ""

# Check if npm dependencies are installed
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing npm dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

Write-Host "🚀 Starting Nexus DevHub..." -ForegroundColor Green
Write-Host ""
Write-Host "📊 Dashboard will open at: http://localhost:8080" -ForegroundColor Cyan
Write-Host "🎯 Manage your Nexus Systems projects from one place" -ForegroundColor Cyan
Write-Host ""
Write-Host "To stop the server, press Ctrl+C" -ForegroundColor Yellow
Write-Host ""

# Start the server
node dev-server.js

Read-Host "Press Enter to continue"
