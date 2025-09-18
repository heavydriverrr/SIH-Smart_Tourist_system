#!/usr/bin/env pwsh

# Smart Wanderer Backend Setup Script
Write-Host "🔧 Smart Wanderer Backend Setup" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

# Ensure we're in the right directory
$backendDir = "C:\Users\KIIT0001\Documents\smart-wanderer-app\backend"
Set-Location $backendDir
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

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  Creating backend .env file..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env" -ErrorAction SilentlyContinue
    Write-Host "📝 Please update backend/.env with your Supabase service role key" -ForegroundColor Yellow
}

# Install dependencies
Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
try {
    npm install
    Write-Host "✅ Dependencies installed successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Seed admin users
Write-Host "🌱 Setting up admin users..." -ForegroundColor Yellow
try {
    npm run seed
    Write-Host "✅ Admin users created successfully!" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Could not seed admin users (database may not be ready)" -ForegroundColor Yellow
    Write-Host "   Make sure you've run the SQL schema in Supabase first" -ForegroundColor Gray
}

# Start the development server
Write-Host ""
Write-Host "🚀 Starting backend development server..." -ForegroundColor Yellow
Write-Host "   API Base: http://localhost:5000/api/" -ForegroundColor Cyan
Write-Host "   Health Check: http://localhost:5000/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔐 Default Admin Login:" -ForegroundColor Yellow
Write-Host "   Email: admin@smartwanderer.com" -ForegroundColor Gray
Write-Host "   Password: admin123456" -ForegroundColor Gray
Write-Host ""

# Start the server
npm run dev