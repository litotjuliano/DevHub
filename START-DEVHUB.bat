@echo off
REM Nexus DevHub - Development Manager
REM Windows Batch Version

echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║   Nexus DevHub - Unified Service Management           ║
echo ║   Location: C:\Nexus Systems\DevHub                   ║
echo ╚════════════════════════════════════════════════════════╝
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✓ Node.js found: %NODE_VERSION%
echo.

REM Check if npm dependencies are installed
if not exist "node_modules" (
    echo 📦 Installing npm dependencies...
    call npm install
    echo.
)

echo 🚀 Starting Nexus DevHub...
echo.
echo 📊 Dashboard will open at: http://localhost:8080
echo 🎯 Manage your Nexus Systems projects from one place
echo.
echo To stop the server, press Ctrl+C
echo.

REM Start the server
node dev-server.js

pause
