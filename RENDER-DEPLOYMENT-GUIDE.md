# Render Deployment Guide

## 🚀 Quick Deploy to Render

Your FastAPI backend is now configured to work perfectly with Render's free tier.

### 1. Port Configuration Summary

| Environment | Port | Configuration |
|-------------|------|---------------|
| **Local Development** | 8000 | Set in `.env.local` via `FASTAPI_PORT=8000` |
| **Render Production** | 10000 | Automatic via Render's `PORT` environment variable |
| **Frontend Local** | Points to `http://localhost:8000` | Via `NEXT_PUBLIC_LITELLM_API_URL` |
| **Frontend Production** | Points to `https://your-service.onrender.com` | Update after deployment |

### 2. Deployment Steps

#### Step 1: Push to GitHub
```bash
git add .
git commit -m "Configure for Render deployment"
git push origin main
```

#### Step 2: Deploy to Render
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub repository
4. Render will detect `render.yaml` automatically
5. Click **"Apply"**

#### Step 3: Set Secret Environment Variable
1. Go to your service in Render dashboard
2. Click **"Environment"** tab
3. Add environment variable:
   - **Key**: `ONEMINAI_API_KEY`
   - **Value**: `your_actual_1minai_api_key_here`
4. Click **"Save Changes"**

### 3. Your Service URLs

After deployment, your service will be available at:


### 4. Update Frontend Configuration

After successful deployment, update your frontend to use the production API:

**For Production Deployment** (Vercel/Netlify):
```env
NEXT_PUBLIC_LITELLM_API_URL=
```

**For Local Development** (keep as is):
```env
NEXT_PUBLIC_LITELLM_API_URL=http://localhost:8000
```

### 5. Test Your Deployment

```bash
# Test health endpoint
curl 

# Test chat endpoint
curl -X POST /v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gemini-2.0-flash-lite",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### 6. Configuration Files Used

- `render.yaml` - Render service configuration  
- `simple_server.py` - Lightweight server using only Python standard library (for Render)
- `fastapi_server.py` - Full FastAPI server (for local development)
- `runtime.txt` - Specifies Python 3.13.4 to match Render's default

### 7. How Port Handling Works

Both servers automatically handle different environments:

**Local Development** (`fastapi_server.py`):
```python
port = int(os.getenv("PORT", os.getenv("FASTAPI_PORT", "8000")))
# Uses FASTAPI_PORT=8000 from .env.local
```

**Render Production** (`simple_server.py`):
```python
PORT = int(os.getenv("PORT", "10000"))
# Uses Render's automatic PORT=10000
```

### 8. Free Tier Considerations

- **Cold Starts**: Service sleeps after 15 minutes of inactivity
- **Build Time**: 15 minutes maximum
- **Memory**: 512MB runtime limit
- **No Custom Domains**: Use `.onrender.com` subdomain

### 9. Troubleshooting

**Build Fails**:
- Check `requirements-render.txt` has compatible versions
- Ensure `ONEMINAI_API_KEY` is set in Render dashboard

**Service Won't Start**:
- Check logs in Render dashboard
- Verify health check endpoint `/health` works

**API Calls Fail**:
- Verify `ONEMINAI_API_KEY` is correctly set
- Check CORS settings in `fastapi_server.py`

### 10. Upgrade Path

When ready to upgrade from free tier:
- **Starter ($7/month)**: No sleep, faster builds
- **Standard ($25/month)**: More resources, priority support

## ✅ Ready to Deploy!

Your configuration is now optimized for both local development (port 8000) and Render production (port 10000). The FastAPI server automatically detects the environment and uses the correct port.