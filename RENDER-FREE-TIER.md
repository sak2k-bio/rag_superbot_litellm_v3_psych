# Render Free Tier Deployment Guide

This guide explains how to deploy your Psychiatry Therapy SuperBot to Render's **free tier** without compilation issues.

## 🆓 Free Tier Optimizations

### Issue: Docker Compilation Errors
The original Docker approach failed because:
- `pydantic-core` requires Rust compilation
- Render's free tier has limited build resources
- Read-only filesystem restrictions

### Solution: Python Runtime
Instead of Docker, we use Render's **Python 3 runtime**:
- ✅ No Docker compilation needed
- ✅ Pre-compiled Python packages
- ✅ Faster builds on free tier
- ✅ Same functionality

## 📋 Configuration Changes

### Before (Docker Runtime)
```yaml
# render.yaml (Docker - caused compilation issues)
services:
  - type: web
    env: docker
    dockerfilePath: ./Dockerfile.fastapi
```

### After (Python Runtime - Free Tier Compatible)
```yaml
# render.yaml (Python - works on free tier)
services:
  - type: web
    env: python3
    buildCommand: "pip install -r requirements-render.txt"
    startCommand: "python fastapi_server.py"
    plan: free
```

## 📦 Dependencies

### Original Requirements (Compilation Issues)
```txt
# requirements.txt (caused Rust compilation errors)
fastapi==0.104.1
pydantic==2.5.0  # ❌ Requires Rust compilation
```

### Free Tier Requirements (Pre-compiled)
```txt
# requirements-render.txt (free tier compatible)
fastapi==0.100.1
pydantic==1.10.12  # ✅ Pre-compiled wheels available
```

## 🚀 Deployment Process

### 1. Files Used
- `render.yaml` - Python runtime configuration
- `requirements-render.txt` - Free tier compatible dependencies
- `fastapi_server.py` - Same FastAPI server (no changes needed)

### 2. Build Process
```bash
# Render automatically runs:
pip install -r requirements-render.txt
python fastapi_server.py
```

### 3. Environment Variables
Same as before - set in Render dashboard:
- `ONEMINAI_API_KEY` (secret)
- All other vars defined in `render.yaml`

## 🔄 Local vs Render

### Local Development (Docker Compose)
```bash
# Use full requirements for local development
docker-compose up  # Uses requirements.txt
```

### Render Deployment (Python Runtime)
```bash
# Uses optimized requirements for free tier
render blueprint launch  # Uses requirements-render.txt
```

## 🎯 Benefits of Python Runtime

| Feature | Docker Runtime | Python Runtime |
|---------|----------------|----------------|
| **Build Speed** | Slower (compilation) | Faster (pre-compiled) |
| **Free Tier** | ❌ Compilation issues | ✅ Works perfectly |
| **Dependencies** | Full versions | Optimized versions |
| **Functionality** | Same | Same |
| **Performance** | Same | Same |
| **Deployment** | Complex | Simple |

## 🔧 Troubleshooting Free Tier

### Common Issues & Solutions

#### 1. Build Timeout
```
Error: Build timed out
```
**Solution**: Use `requirements-render.txt` with lighter dependencies

#### 2. Memory Limit
```
Error: Build killed (out of memory)
```
**Solution**: Remove unnecessary dependencies or upgrade plan

#### 3. Package Not Found
```
Error: Could not find a version that satisfies the requirement
```
**Solution**: Use older, stable versions in `requirements-render.txt`

### Free Tier Limits
- **Build Time**: 15 minutes max
- **Memory**: 512MB during build
- **Runtime Memory**: 512MB
- **Sleep**: Services sleep after 15 minutes of inactivity

## 🚀 Quick Deploy

```bash
# Deploy to Render free tier
./deploy-render.sh

# Your API will be available at:
# https://psychiatry-therapy-superbot-api.onrender.com
```

## 📈 Upgrade Path

When ready to upgrade:

1. **Starter Plan ($7/month)**:
   - No sleep
   - More build resources
   - Can use Docker runtime if preferred

2. **Standard Plan ($25/month)**:
   - More memory and CPU
   - Faster builds
   - Priority support

## ✅ Free Tier Checklist

- [x] ✅ Use `render.yaml` with `env: python3`
- [x] ✅ Use `requirements-render.txt` for dependencies
- [x] ✅ Set `plan: free` in render.yaml
- [x] ✅ Keep build command simple
- [x] ✅ Set secrets in Render dashboard
- [x] ✅ Test locally first

Your FastAPI server now deploys perfectly on Render's free tier! 🎉