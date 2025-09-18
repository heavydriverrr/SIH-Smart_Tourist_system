#!/usr/bin/env pwsh

# Smart Wanderer Frontend Setup Script
Write-Host "🚀 Smart Wanderer Frontend Setup" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Ensure we're in the right directory
$projectDir = "C:\Users\KIIT0001\Documents\smart-wanderer-app"
Set-Location $projectDir
Write-Host "📂 Working directory: $(Get-Location)" -ForegroundColor Blue

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install it from https://nodejs.org/" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Install dependencies
Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
try {
    npm install
    Write-Host "✅ Dependencies installed successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Start the development server
Write-Host ""
Write-Host "🌐 Starting frontend development server..." -ForegroundColor Yellow
Write-Host "   Tourist App: http://localhost:8080/" -ForegroundColor Cyan
Write-Host "   Admin Login: http://localhost:8080/admin/login" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Make sure to run the backend server in another terminal:" -ForegroundColor Yellow
Write-Host "   cd backend && npm install && npm run dev" -ForegroundColor Gray
Write-Host ""

# Start the server
npm run dev