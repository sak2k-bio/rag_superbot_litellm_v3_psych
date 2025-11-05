#!/usr/bin/env pwsh
# Start all RAG Superbot services (LiteLLM proxy + Next.js)

Write-Host "🚀 Starting RAG Superbot with LiteLLM Integration..." -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "🔍 Checking Docker status..." -ForegroundColor Yellow
try {
    docker info | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Check if .env.local exists
if (-not (Test-Path ".env.local")) {
    Write-Host "⚠️  .env.local not found. Copying from config.env..." -ForegroundColor Yellow
    Copy-Item "config.env" ".env.local"
    Write-Host "⚠️  Please update .env.local with your API keys!" -ForegroundColor Yellow
    Write-Host ""
}

# Start Docker Compose services (FastAPI LiteLLM proxy)
Write-Host "🐳 Starting LiteLLM proxy server..." -ForegroundColor Cyan
docker-compose up -d fastapi-litellm

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start Docker services" -ForegroundColor Red
    exit 1
}

# Wait for service to be healthy
Write-Host "⏳ Waiting for LiteLLM proxy to be healthy..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0

while ($attempt -lt $maxAttempts) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -TimeoutSec 2 -UseBasicParsing 2>$null
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ LiteLLM proxy is healthy!" -ForegroundColor Green
            break
        }
    } catch {
        # Service not ready yet
    }
    
    $attempt++
    if ($attempt -eq $maxAttempts) {
        Write-Host "❌ LiteLLM proxy failed to become healthy" -ForegroundColor Red
        Write-Host "   Check logs with: docker-compose logs fastapi-litellm" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "   Attempt $attempt/$maxAttempts..." -ForegroundColor Gray
    Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "🌐 Starting Next.js development server..." -ForegroundColor Cyan
Write-Host "   Navigate to http://localhost:3000 when ready" -ForegroundColor Gray
Write-Host ""

# Start Next.js in a new terminal window (optional - user can run npm run dev manually)
Write-Host "📝 To start the frontend, run:" -ForegroundColor Yellow
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""

Write-Host "✅ Services started successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Service Status:" -ForegroundColor Cyan
Write-Host "   - LiteLLM Proxy: http://localhost:8000" -ForegroundColor White
Write-Host "   - Health Check: http://localhost:8000/health" -ForegroundColor White
Write-Host "   - Models List: http://localhost:8000/v1/models" -ForegroundColor White
Write-Host "   - Next.js App: http://localhost:3000 (after running npm run dev)" -ForegroundColor White
Write-Host ""
Write-Host "🛑 To stop services, run:" -ForegroundColor Yellow
Write-Host "   .\stop-services.ps1" -ForegroundColor White
Write-Host ""
