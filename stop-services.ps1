#!/usr/bin/env pwsh
# Stop all RAG Superbot services

Write-Host "🛑 Stopping RAG Superbot services..." -ForegroundColor Cyan
Write-Host ""

# Stop Docker Compose services
Write-Host "🐳 Stopping Docker containers..." -ForegroundColor Yellow
docker-compose down

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ All services stopped successfully!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Some services may not have stopped cleanly" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📝 Note: If Next.js is running in another terminal, stop it with Ctrl+C" -ForegroundColor Gray
Write-Host ""
