# Docker Compose to Render Migration Guide

This document explains how your `docker-compose.yml` configuration translates to Render deployment.

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

### Render Equivalent (render.yaml)
```yaml
services:
  - type: web
    name: psychiatry-therapy-superbot-api
    env: docker
    dockerfilePath: ./Dockerfile.fastapi
    healthCheckPath: /health
    envVars:
      - key: ONEMINAI_API_KEY
        sync: false  # Secret
      - key: FASTAPI_HOST
        value: "0.0.0.0"
      - key: FASTAPI_PORT
        value: "10000"  # Render default
      # ... other environment variables
```

## 🔧 Key Differences

| Docker Compose | Render | Notes |
|----------------|--------|-------|
| `ports: "8000:8000"` | Uses `PORT=10000` | Render uses port 10000 by default |
| `container_name` | `name` in render.yaml | Render manages container naming |
| `volumes` | Not needed | Render builds from git source |
| `networks` | Auto-managed | Render handles networking + SSL |
| `restart: unless-stopped` | Built-in | Render auto-restarts on failure |
| Manual SSL setup | Automatic HTTPS | Render provides free SSL certificates |

## 🌐 Environment Variables

All your docker-compose environment variables work in Render:

### Via render.yaml (Public Variables)
```yaml
envVars:
  - key: FASTAPI_HOST
    value: "0.0.0.0"
  - key: FASTAPI_PORT
    value: "10000"
  - key: LITELLM_BASE_URL
    value: "https://api.1min.ai"
  - key: DEFAULT_MODEL
    value: "gemini-2.0-flash-lite"
  - key: MAX_TOKENS
    value: "4096"
  - key: TEMPERATURE
    value: "0.7"
  - key: CORS_ORIGINS
    value: "*"
  - key: CORS_ALLOW_CREDENTIALS
    value: "true"
```

### Via Render Dashboard (Secrets)
```bash
# Set in Render dashboard as environment variables
ONEMINAI_API_KEY=your_secret_key_here
```

## 🚀 Deployment Process

### Docker Compose (Local)
```bash
docker-compose up --build
```

### Render (Cloud)
```bash
# Method 1: Blueprint deployment
render blueprint launch

# Method 2: Git-based deployment (automatic)
git push origin main  # Auto-deploys if connected to GitHub
```

Both approaches:
1. Build the Docker image using `Dockerfile.fastapi`
2. Set environment variables
3. Start the FastAPI server on the correct port
4. Enable health checks at `/health`
5. Handle automatic restarts and scaling

## 📊 Monitoring & Logs

### Docker Compose
```bash
docker-compose logs -f fastapi-litellm
docker stats
```

### Render
```bash
# Via CLI
render logs -s psychiatry-therapy-superbot-api --tail

# Via Dashboard
# Visit https://dashboard.render.com
# Click on your service → Logs tab
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

### Render Development
```bash
# Deploy changes (if using CLI)
render blueprint launch

# Or just push to git (if connected to GitHub)
git add .
git commit -m "Update API"
git push origin main  # Auto-deploys
```

## 🎯 Benefits of Render vs Local Docker Compose

| Feature | Docker Compose | Render |
|---------|----------------|--------|
| **Deployment** | Manual server setup | Git-based auto-deployment |
| **Scaling** | Manual container management | Auto-scaling based on traffic |
| **Monitoring** | Basic Docker stats | Built-in metrics, alerts & logs |
| **SSL/HTTPS** | Manual setup required | Automatic SSL certificates |
| **Domain** | Manual DNS setup | Free .onrender.com + custom domains |
| **Logs** | Local only | Persistent cloud logs with search |
| **Backups** | Manual | Automatic |
| **Updates** | Manual rebuild | Git push = auto-deploy |
| **Health Checks** | Basic Docker health | Advanced health monitoring |
| **Zero Downtime** | Manual blue-green | Built-in zero-downtime deployments |

## 🔧 Migration Checklist

- [x] ✅ Same Dockerfile (`Dockerfile.fastapi`)
- [x] ✅ Same environment variables (with PORT=10000 for Render)
- [x] ✅ Same health check endpoint (`/health`)
- [x] ✅ Same FastAPI application code
- [x] ✅ Same restart policies (automatic)
- [x] ✅ Same CORS configuration
- [x] ✅ **Plus** automatic HTTPS, custom domains, auto-scaling

## 🚀 Quick Migration Steps

1. **Keep your docker-compose.yml** (for local development)
2. **Create render.yaml** (defines cloud deployment)
3. **Deploy to Render** using Blueprint
4. **Set secrets** in Render dashboard
5. **Test both environments** to ensure consistency

```bash
# Local testing (same as before)
docker-compose up

# Render deployment (new)
render blueprint launch

# Both environments work identically!
```

## 🌟 Render-Specific Benefits

### Automatic Features
- ✅ **Free SSL certificates** for all domains
- ✅ **Auto-scaling** based on CPU/memory usage
- ✅ **Zero-downtime deployments** with health checks
- ✅ **Git integration** - push to deploy
- ✅ **Environment management** with secrets
- ✅ **Custom domains** with automatic SSL
- ✅ **Global CDN** for static assets
- ✅ **DDoS protection** included

### Developer Experience
- ✅ **Real-time logs** with search and filtering
- ✅ **Metrics dashboard** with CPU, memory, response times
- ✅ **Deployment history** with rollback capability
- ✅ **Preview deployments** for pull requests
- ✅ **Team collaboration** with role-based access

## 🔗 URLs and Endpoints

### Local (Docker Compose)
```
http://localhost:8000/health
http://localhost:8000/v1/models
http://localhost:8000/v1/chat/completions
```

### Render (Cloud)
```
https://psychiatry-therapy-superbot-api.onrender.com/health
https://psychiatry-therapy-superbot-api.onrender.com/v1/models
https://psychiatry-therapy-superbot-api.onrender.com/v1/chat/completions
```

Your Docker Compose setup is now running in the cloud with Render's enterprise-grade infrastructure! 🎉

## 🚀 Next Steps

1. **Deploy**: `./deploy-render.sh`
2. **Set API Key**: Add `ONEMINAI_API_KEY` in Render dashboard
3. **Test**: Verify all endpoints work
4. **Update Frontend**: Point Vercel to your new Render URL
5. **Monitor**: Use Render dashboard for logs and metrics