# Deployment Guide - Psychiatry Therapy SuperBot

This guide covers deploying the Psychiatry Therapy SuperBot with:
- **Backend**: Render (Docker Compose equivalent - FastAPI LiteLLM Proxy)
- **Frontend**: Vercel (Next.js Application)

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Vercel        │    │  Render          │    │   1minAI        │
│   (Frontend)    │───▶│  (Docker Compose │───▶│   API           │
│   Next.js App   │    │   equivalent)    │    │   (AI Models)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🐳 Docker Compose to Render

Render deploys your **exact docker-compose configuration** in the cloud:
- ✅ Same `Dockerfile.fastapi` 
- ✅ Same environment variables (with PORT=10000 for Render)
- ✅ Same FastAPI server
- ✅ Same health checks
- ✅ **Plus** auto-scaling, SSL, monitoring, and zero-downtime deployments

See [DOCKER-COMPOSE-TO-RENDER.md](./DOCKER-COMPOSE-TO-RENDER.md) for detailed comparison.

## 📋 Prerequisites

1. **Render Account** (sign up at https://render.com)
2. **Vercel Account** 
3. **1minAI API Key** (get from https://1min.ai)
4. **Google Gemini API Key** (for embeddings/fallback)
5. **Qdrant Cloud Account** (for vector database)
6. **Git Repository** (GitHub, GitLab, or Bitbucket)

## 🚀 Step 1: Deploy Docker Compose Backend to Render

Render will deploy your Docker Compose configuration using Blueprint (render.yaml) with the same Dockerfile and environment variables.

### 1.1 Install Render CLI (Optional)

```bash
# macOS
brew install render

# Linux
curl -fsSL https://cli.render.com/install | sh

# Or use web dashboard (no CLI needed)
```

### 1.2 Login to Render

```bash
render auth login
# Or use the web dashboard at https://dashboard.render.com
```

### 1.3 Prepare Git Repository

```bash
# Make sure your code is in a git repository
git init
git add .
git commit -m "Initial commit for Render deployment"

# Push to GitHub/GitLab (or connect via Render dashboard)
git remote add origin https://github.com/yourusername/your-repo.git
git push -u origin main
```

### 1.4 Deploy Using Blueprint

Render uses `render.yaml` (Blueprint) to deploy your docker-compose equivalent:

#### Method 1: Automated Script
```bash
chmod +x deploy-render.sh
./deploy-render.sh
```

#### Method 2: Manual Blueprint Deployment
```bash
render blueprint launch
```

#### Method 3: Web Dashboard
1. Go to https://dashboard.render.com
2. Click "New" → "Blueprint"
3. Connect your Git repository
4. Render will automatically detect `render.yaml`
5. Click "Apply" to deploy

### 1.5 Set Secret Environment Variables

After deployment, set your API key in the Render dashboard:

1. Go to your service in Render dashboard
2. Click "Environment" tab
3. Add secret variable:
   - `ONEMINAI_API_KEY`: Your 1minAI API key

All other environment variables are already set in `render.yaml`.

### 1.6 Deployment Process

**What happens during Render deployment:**
- Render reads your `render.yaml` Blueprint configuration
- Builds the Docker image using `Dockerfile.fastapi` (same as docker-compose)
- Sets up environment variables (same as your docker-compose.yml)
- Deploys with automatic HTTPS, scaling, and zero-downtime deployments

### 1.7 Get Your Render URL

After deployment, Render provides you with a URL like:
- `https://psychiatry-therapy-superbot-api.onrender.com`
- Plus free SSL certificate and optional custom domains

### 1.8 Test Your Render Deployment

```bash
# Test health endpoint
curl https://psychiatry-therapy-superbot-api.onrender.com/health

# Test models endpoint
curl https://psychiatry-therapy-superbot-api.onrender.com/v1/models

# Test chat completion
curl -X POST https://psychiatry-therapy-superbot-api.onrender.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gemini-2.0-flash-lite",
    "messages": [{"role": "user", "content": "Hello, how are you?"}]
  }'
```

## 🌐 Step 2: Deploy Frontend to Vercel

### 2.1 Install Vercel CLI

```bash
npm install -g vercel
```

### 2.2 Login to Vercel

```bash
vercel login
```

### 2.3 Set Environment Variables in Vercel

Go to your Vercel dashboard and add these environment variables:

```bash
# LiteLLM Configuration (Primary)
NEXT_PUBLIC_USE_LITELLM=true
NEXT_PUBLIC_LITELLM_API_URL=https://psychiatry-therapy-superbot-api.onrender.com
NEXT_PUBLIC_LITELLM_MODEL=gemini-2.0-flash-lite
NEXT_PUBLIC_LITELLM_TEMPERATURE=0.7
NEXT_PUBLIC_LITELLM_MAX_TOKENS=2048

# Google Gemini Configuration (Fallback/Embeddings)
NEXT_PUBLIC_GOOGLE_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_GEMINI_MODEL=gemini-2.5-flash
NEXT_PUBLIC_GEMINI_TEMPERATURE=0.7
NEXT_PUBLIC_GEMINI_MAX_TOKENS=2048
NEXT_PUBLIC_EMBEDDING_MODEL=gemini-embedding-001
NEXT_PUBLIC_EMBEDDING_DIM=3072

# Qdrant Cloud Configuration
NEXT_PUBLIC_QDRANT_CLOUD_URL=your_qdrant_cloud_url_here
NEXT_PUBLIC_QDRANT_CLOUD_API_KEY=your_qdrant_cloud_api_key_here

# Vector Store Configuration
NEXT_PUBLIC_VECTOR_STORE=qdrant
NEXT_PUBLIC_COLLECTION_NAME=psychiatry_therapy_v1_google-001

# App Configuration
NEXT_PUBLIC_APP_NAME=Psychiatry Therapy SuperBot
NEXT_PUBLIC_APP_VERSION=1.0.0

# Production Settings
NODE_ENV=production
```

### 2.4 Deploy to Vercel

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install --legacy-peer-deps

# Deploy to Vercel
vercel --prod
```

## 🔧 Step 3: Configuration & Testing

### 3.1 Update Frontend Configuration

Make sure your frontend is pointing to the correct Render URL:

```javascript
// In your frontend code, the NEXT_PUBLIC_LITELLM_API_URL should be:
const LITELLM_API_URL = process.env.NEXT_PUBLIC_LITELLM_API_URL || 'https://psychiatry-therapy-superbot-api.onrender.com';
```

### 3.2 Test End-to-End Flow

1. **Visit your Vercel app URL**
2. **Try a chat message** - it should go through this flow:
   - Frontend (Vercel) → Render (FastAPI) → 1minAI API → Response back
3. **Check browser network tab** to verify API calls are working
4. **Test different pipeline modes** to ensure all functionality works

### 3.3 Monitor and Debug

#### Render Logs
```bash
# View real-time logs
render logs -s psychiatry-therapy-superbot-api --tail

# Or use the web dashboard
# Visit https://dashboard.render.com → Your Service → Logs
```

#### Vercel Logs
- Check the Vercel dashboard for function logs
- Use browser developer tools for frontend debugging

## 🛠️ Automated Deployment Scripts

### Deploy Backend (Render)
```bash
chmod +x deploy-render.sh
./deploy-render.sh
```

### Deploy Frontend (Vercel)
```bash
chmod +x deploy-vercel.sh
./deploy-vercel.sh
```

## 🔒 Security Considerations

### Render Security
- ✅ Environment variables encrypted
- ✅ HTTPS by default with free SSL certificates
- ✅ Private networking available
- ✅ Automatic security headers
- ✅ Built-in DDoS protection
- ✅ SOC 2 Type II compliant

### Vercel Security
- ✅ Environment variables encrypted
- ✅ HTTPS by default
- ✅ Edge network for performance
- ✅ Automatic security headers

## 📊 Monitoring & Analytics

### Render Analytics
- Monitor CPU and memory usage with detailed metrics
- Track request volume and response times
- View application logs in real-time with search
- Set up alerts for downtime or errors
- Performance insights and recommendations

### Vercel Analytics
- Monitor frontend performance
- Track user interactions
- Monitor build and deployment status

## 🚨 Troubleshooting

### Common Issues

#### 1. CORS Errors
```
Error: CORS policy blocked
```
**Solution**: Verify CORS headers in Cloudflare Worker and Vercel configuration

#### 2. API Key Issues
```
Error: ONEMINAI_API_KEY not configured
```
**Solution**: Ensure environment variable is set in Render dashboard under Environment tab

#### 3. Environment Variables Not Loading
```
Error: NEXT_PUBLIC_LITELLM_API_URL not found
```
**Solution**: Check Vercel dashboard environment variables

#### 4. Build Failures
```
Error: Build failed
```
**Solution**: Check Node.js version compatibility and dependencies

### Debug Commands

```bash
# Test Render deployment locally (using Docker)
docker build -f Dockerfile.fastapi -t psychiatry-therapy-superbot .
docker run -p 10000:10000 --env-file .env psychiatry-therapy-superbot

# View Render logs
render logs -s psychiatry-therapy-superbot-api --tail

# Test Vercel build locally
cd frontend && npm run build

# Check environment variables
vercel env ls
# Check Render environment variables in dashboard

# View deployment logs
vercel logs YOUR_DEPLOYMENT_URL
render logs -s psychiatry-therapy-superbot-api
```

## 📈 Performance Optimization

### Render Optimization
- Use Render's auto-scaling features (automatic)
- Monitor resource usage and upgrade plan if needed
- Implement proper caching in FastAPI
- Use Render's built-in load balancing and CDN
- Enable zero-downtime deployments

### Vercel Optimization
- Enable Edge Functions for better performance
- Use Image Optimization for assets
- Implement proper caching headers

## 🔄 CI/CD Pipeline (Optional)

### GitHub Actions for Automated Deployment

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Psychiatry Therapy SuperBot

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install Render CLI
        run: |
          curl -fsSL https://cli.render.com/install | sh
          echo "$HOME/.local/bin" >> $GITHUB_PATH
      - name: Deploy to Render
        run: render blueprint launch --yes
        env:
          RENDER_API_KEY: ${{ secrets.RENDER_API_KEY }}

  deploy-frontend:
    runs-on: ubuntu-latest
    needs: deploy-backend
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Deploy to Vercel
        run: |
          cd frontend
          npm install --legacy-peer-deps
          vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review Cloudflare Worker and Vercel logs
3. Verify all environment variables are set correctly
4. Test API endpoints individually

---

🎉 **Congratulations!** Your Psychiatry Therapy SuperBot is now deployed on Render and Vercel, ready to help users with mental health questions using advanced AI capabilities!

## 🚀 Render Benefits

- **Easy Docker Deployment**: Your existing FastAPI server deploys seamlessly
- **Auto-scaling**: Render automatically scales based on demand
- **Built-in Monitoring**: Real-time logs, metrics, and performance insights
- **Zero-downtime Deployments**: Git-based deployments with health checks
- **Environment Management**: Secure environment variable handling
- **Free SSL Certificates**: Automatic HTTPS for all domains
- **Custom Domains**: Easy custom domain setup with automatic SSL
- **Database Integration**: Easy integration with PostgreSQL, Redis, etc.
- **Global CDN**: Built-in content delivery network

## 📱 Quick Render Commands

```bash
# View logs
render logs -s psychiatry-therapy-superbot-api --tail

# Check service status
render services list

# Open service in browser
render open -s psychiatry-therapy-superbot-api

# Deploy latest changes
render blueprint launch

# View service details
render services get psychiatry-therapy-superbot-api
```