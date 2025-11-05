# Docker Compose to Railway Migration Guide

This document explains how your `docker-compose.yml` configuration translates to Railway deployment.

## 🔄 Configuration Mapping

### Docker Compose Configuration
```yaml
# docker-compose.yml
services:
  fastapi-litellm:
    build:
      context: .
      dockerfile: Dockerfile.fastapi
    container_name: rag-superbot-litellm-proxy
    ports:
      - "8000:8000"
    environment:
      - ONEMINAI_API_KEY=${ONEMINAI_API_KEY}
      - FASTAPI_HOST=0.0.0.0
      - FASTAPI_PORT=8000
      # ... other environment variables
    volumes:
      - ./fastapi_server.py:/app/fastapi_server.py
      - ./requirements.txt:/app/requirements.txt
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
    restart: unless-stopped
```

### Railway Equivalent
```json
// railway.json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile.fastapi"
  },
  "deploy": {
    "healthcheckPath": "/health",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

## 🔧 Key Differences

| Docker Compose | Railway | Notes |
|----------------|---------|-------|
| `ports: "8000:8000"` | Uses `PORT` env var | Railway automatically assigns port |
| `container_name` | Auto-generated | Railway manages container naming |
| `volumes` | Not needed | Railway builds from source |
| `networks` | Auto-managed | Railway handles networking |
| `restart: unless-stopped` | Built-in | Railway auto-restarts on failure |

## 🌐 Environment Variables

All your docker-compose environment variables work the same way in Railway:

```bash
# Set via Railway CLI (same as docker-compose)
railway variables set ONEMINAI_API_KEY=your_key
railway variables set FASTAPI_HOST=0.0.0.0
railway variables set FASTAPI_PORT=8000
railway variables set LITELLM_BASE_URL=https://api.1min.ai
railway variables set DEFAULT_MODEL=gemini-2.0-flash-lite
railway variables set MAX_TOKENS=4096
railway variables set TEMPERATURE=0.7
railway variables set CORS_ORIGINS="*"
railway variables set CORS_ALLOW_CREDENTIALS=true
railway variables set HEALTH_CHECK_INTERVAL=30
```

## 🚀 Deployment Process

### Docker Compose (Local)
```bash
docker-compose up --build
```

### Railway (Cloud)
```bash
railway up
```

Both commands:
1. Build the Docker image using `Dockerfile.fastapi`
2. Set environment variables
3. Start the FastAPI server
4. Enable health checks
5. Handle automatic restarts

## 📊 Monitoring & Logs

### Docker Compose
```bash
docker-compose logs -f fastapi-litellm
docker stats
```

### Railway
```bash
railway logs --follow
railway status
```

## 🔄 Development Workflow

### Local Development (Docker Compose)
```bash
# Start services
docker-compose up

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Railway Development
```bash
# Deploy changes
railway up

# View logs
railway logs

# Check status
railway status
```

## 🎯 Benefits of Railway vs Local Docker Compose

| Feature | Docker Compose | Railway |
|---------|----------------|---------|
| **Deployment** | Manual server setup | Automatic cloud deployment |
| **Scaling** | Manual container management | Auto-scaling based on traffic |
| **Monitoring** | Basic Docker stats | Built-in metrics & alerts |
| **SSL/HTTPS** | Manual setup required | Automatic SSL certificates |
| **Domain** | Manual DNS setup | Automatic Railway domain + custom domains |
| **Logs** | Local only | Persistent cloud logs |
| **Backups** | Manual | Automatic |
| **Updates** | Manual rebuild | Git-based deployments |

## 🔧 Migration Checklist

- [x] ✅ Same Dockerfile (`Dockerfile.fastapi`)
- [x] ✅ Same environment variables
- [x] ✅ Same health check endpoint (`/health`)
- [x] ✅ Same FastAPI application code
- [x] ✅ Same port configuration (with Railway's PORT handling)
- [x] ✅ Same restart policies
- [x] ✅ Same CORS configuration

## 🚀 Quick Migration

1. **Keep your docker-compose.yml** (for local development)
2. **Deploy to Railway** using the same configuration
3. **Test both environments** to ensure consistency

```bash
# Local testing
docker-compose up

# Railway deployment
railway up

# Both should work identically!
```

Your Docker Compose setup is now running in the cloud with Railway's additional benefits like auto-scaling, monitoring, and automatic deployments! 🎉