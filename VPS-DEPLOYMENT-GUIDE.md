# VPS Deployment Guide for RAG Superbot

This guide provides step-by-step instructions for deploying the RAG Superbot application on a Virtual Private Server (VPS).

## Overview

The RAG Superbot is a full-stack application consisting of:
- **Frontend**: Next.js 15 with React 19 (TypeScript)
- **Backend**: FastAPI server for LiteLLM 1minAI proxy
- **Vector Database**: Qdrant Cloud (external service)
- **AI Models**: 1minAI API integration

## Prerequisites

### VPS Requirements
- **OS**: Ubuntu 20.04 LTS or newer (recommended)
- **RAM**: Minimum 2GB, recommended 4GB+
- **Storage**: Minimum 20GB SSD
- **CPU**: 2+ cores recommended
- **Network**: Public IP with ports 80, 443, 3000, 8000 accessible

### Required Accounts & API Keys
- 1minAI API key (for AI models)
- Qdrant Cloud account and API key
- Domain name (optional but recommended)
- SSL certificate (Let's Encrypt recommended)

## Step 1: Server Setup

### 1.1 Initial Server Configuration

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git unzip software-properties-common

# Install Node.js 18+ (required for Next.js)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify Node.js installation
node --version  # Should be 18.0.0 or higher
npm --version   # Should be 8.0.0 or higher

# Install Python 3.9+ (required for FastAPI)
sudo apt install -y python3 python3-pip python3-venv

# Install Docker and Docker Compose (recommended)
sudo apt install -y docker.io docker-compose
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER

# Install Nginx (for reverse proxy)
sudo apt install -y nginx

# Install Certbot (for SSL certificates)
sudo apt install -y certbot python3-certbot-nginx
```

### 1.2 Create Application User

```bash
# Create dedicated user for the application
sudo useradd -m -s /bin/bash ragbot
sudo usermod -aG docker ragbot

# Switch to application user
sudo su - ragbot
```

## Step 2: Application Deployment

### 2.1 Clone and Setup Repository

```bash
# Clone the repository
cd /home/ragbot
git clone <your-repository-url> rag-superbot
cd rag-superbot

# Create environment file
cp .env.example .env
```

### 2.2 Configure Environment Variables

Edit the `.env` file with your production values:

```bash
nano .env
```

```env
# Google Gemini Configuration (Fallback/Embeddings only)
NEXT_PUBLIC_GOOGLE_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_GEMINI_MODEL=gemini-1.5-flash
NEXT_PUBLIC_GEMINI_TEMPERATURE=0.7
NEXT_PUBLIC_GEMINI_MAX_TOKENS=2048
NEXT_PUBLIC_EMBEDDING_MODEL=gemini-embedding-001
NEXT_PUBLIC_EMBEDDING_DIM=3072

# LiteLLM / 1minAI Configuration (Primary)
NEXT_PUBLIC_USE_LITELLM=true
NEXT_PUBLIC_LITELLM_API_URL=https://yourdomain.com/api
NEXT_PUBLIC_LITELLM_MODEL=gemini-2.0-flash-lite
NEXT_PUBLIC_LITELLM_TEMPERATURE=0.7
NEXT_PUBLIC_LITELLM_MAX_TOKENS=2048
ONEMINAI_API_KEY=your_1minai_api_key_here

# Qdrant Cloud Configuration
NEXT_PUBLIC_QDRANT_CLOUD_URL=https://your-cluster-id.eu-central.aws.cloud.qdrant.io
NEXT_PUBLIC_QDRANT_CLOUD_API_KEY=your_qdrant_cloud_api_key_here

# Vector Store Configuration
NEXT_PUBLIC_VECTOR_STORE=qdrant
NEXT_PUBLIC_COLLECTION_NAME=rag_a2a_collection

# Production Configuration
NODE_ENV=production
FASTAPI_HOST=0.0.0.0
FASTAPI_PORT=8000
FASTAPI_RELOAD=false
FASTAPI_LOG_LEVEL=info
```

## Step 3: Docker Deployment (Recommended)

### 3.1 Build and Run with Docker Compose

```bash
# Build and start services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### 3.2 Alternative: Manual Deployment

If you prefer not to use Docker:

#### Backend (FastAPI) Setup

```bash
# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Start FastAPI server
python fastapi_server.py
```

#### Frontend (Next.js) Setup

```bash
# Install Node.js dependencies
npm install

# Build the application
npm run build

# Start the production server
npm start
```

## Step 4: Nginx Configuration

### 4.1 Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/ragbot
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration (will be configured by Certbot)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API (FastAPI)
    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:8000/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 4.2 Enable Site and Configure SSL

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/ragbot /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test SSL renewal
sudo certbot renew --dry-run
```

## Step 5: Process Management with Systemd

### 5.1 Create Systemd Service for FastAPI

```bash
sudo nano /etc/systemd/system/ragbot-api.service
```

```ini
[Unit]
Description=RAG Superbot FastAPI Server
After=network.target

[Service]
Type=simple
User=ragbot
WorkingDirectory=/home/ragbot/rag-superbot
Environment=PATH=/home/ragbot/rag-superbot/venv/bin
ExecStart=/home/ragbot/rag-superbot/venv/bin/python fastapi_server.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 5.2 Create Systemd Service for Next.js

```bash
sudo nano /etc/systemd/system/ragbot-frontend.service
```

```ini
[Unit]
Description=RAG Superbot Next.js Frontend
After=network.target

[Service]
Type=simple
User=ragbot
WorkingDirectory=/home/ragbot/rag-superbot
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 5.3 Enable and Start Services

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable services to start on boot
sudo systemctl enable ragbot-api
sudo systemctl enable ragbot-frontend

# Start services
sudo systemctl start ragbot-api
sudo systemctl start ragbot-frontend

# Check service status
sudo systemctl status ragbot-api
sudo systemctl status ragbot-frontend
```

## Step 6: Firewall Configuration

```bash
# Enable UFW firewall
sudo ufw enable

# Allow SSH (adjust port if needed)
sudo ufw allow 22

# Allow HTTP and HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Check firewall status
sudo ufw status
```

## Step 7: Monitoring and Logging

### 7.1 Setup Log Rotation

```bash
sudo nano /etc/logrotate.d/ragbot
```

```
/home/ragbot/rag-superbot/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 ragbot ragbot
    postrotate
        systemctl reload ragbot-api
        systemctl reload ragbot-frontend
    endscript
}
```

### 7.2 Create Log Directory

```bash
sudo mkdir -p /home/ragbot/rag-superbot/logs
sudo chown ragbot:ragbot /home/ragbot/rag-superbot/logs
```

## Step 8: Backup Strategy

### 8.1 Create Backup Script

```bash
nano /home/ragbot/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/home/ragbot/backups"
DATE=$(date +%Y%m%d_%H%M%S)
APP_DIR="/home/ragbot/rag-superbot"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup application files
tar -czf $BACKUP_DIR/ragbot_$DATE.tar.gz -C /home/ragbot rag-superbot

# Keep only last 7 backups
find $BACKUP_DIR -name "ragbot_*.tar.gz" -mtime +7 -delete

echo "Backup completed: ragbot_$DATE.tar.gz"
```

```bash
chmod +x /home/ragbot/backup.sh

# Add to crontab for daily backups
crontab -e
# Add: 0 2 * * * /home/ragbot/backup.sh
```

## Step 9: Security Hardening

### 9.1 Update Environment Variables for Production

Ensure your `.env` file has production-ready values:
- Use strong, unique API keys
- Set `NODE_ENV=production`
- Configure proper CORS origins
- Use HTTPS URLs for all external services

### 9.2 Regular Updates

```bash
# Create update script
nano /home/ragbot/update.sh
```

```bash
#!/bin/bash
cd /home/ragbot/rag-superbot

# Pull latest changes
git pull origin main

# Update dependencies
npm install
pip install -r requirements.txt

# Rebuild frontend
npm run build

# Restart services
sudo systemctl restart ragbot-api
sudo systemctl restart ragbot-frontend

echo "Update completed"
```

## Step 10: Testing and Verification

### 10.1 Health Checks

```bash
# Test FastAPI health endpoint
curl https://yourdomain.com/health

# Test frontend
curl https://yourdomain.com

# Check service logs
sudo journalctl -u ragbot-api -f
sudo journalctl -u ragbot-frontend -f
```

### 10.2 Performance Testing

```bash
# Install Apache Bench for load testing
sudo apt install apache2-utils

# Test API performance
ab -n 100 -c 10 https://yourdomain.com/health

# Test frontend performance
ab -n 100 -c 10 https://yourdomain.com/
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3000 and 8000 are not used by other services
2. **Permission issues**: Check file ownership and permissions
3. **Environment variables**: Verify all required API keys are set
4. **SSL issues**: Check certificate validity and Nginx configuration
5. **Service failures**: Check systemd logs for error details

### Useful Commands

```bash
# Check service status
sudo systemctl status ragbot-api ragbot-frontend

# View logs
sudo journalctl -u ragbot-api -n 50
sudo journalctl -u ragbot-frontend -n 50

# Restart services
sudo systemctl restart ragbot-api ragbot-frontend

# Check port usage
sudo netstat -tlnp | grep :3000
sudo netstat -tlnp | grep :8000

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## Maintenance

### Regular Tasks

1. **Weekly**: Check service status and logs
2. **Monthly**: Update system packages and dependencies
3. **Quarterly**: Review and rotate API keys
4. **As needed**: Update application code and restart services

### Monitoring Recommendations

Consider implementing:
- Uptime monitoring (UptimeRobot, Pingdom)
- Log aggregation (ELK stack, Grafana)
- Performance monitoring (New Relic, DataDog)
- Automated backups to cloud storage

## Alternative Deployment Methods

### Option A: Coolify Deployment

Coolify is a self-hosted alternative to Heroku/Netlify that simplifies application deployment with a web UI.

#### A.1 Install Coolify on Your VPS

```bash
# Install Coolify (requires Docker)
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash

# Access Coolify web interface
# Navigate to http://your-vps-ip:8000
```

#### A.2 Prepare Application for Coolify

Create a `coolify.yaml` configuration file:

```bash
nano coolify.yaml
```

```yaml
# Coolify configuration for RAG Superbot
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_USE_LITELLM=true
      - NEXT_PUBLIC_LITELLM_API_URL=https://yourdomain.com/api
      - NEXT_PUBLIC_LITELLM_MODEL=gemini-2.0-flash-lite
      - NEXT_PUBLIC_QDRANT_CLOUD_URL=${QDRANT_CLOUD_URL}
      - NEXT_PUBLIC_QDRANT_CLOUD_API_KEY=${QDRANT_CLOUD_API_KEY}
      - NEXT_PUBLIC_VECTOR_STORE=qdrant
      - NEXT_PUBLIC_COLLECTION_NAME=rag_a2a_collection
    depends_on:
      - backend
    restart: unless-stopped

  backend:
    build:
      context: .
      dockerfile: Dockerfile.fastapi
    ports:
      - "8000:8000"
    environment:
      - ONEMINAI_API_KEY=${ONEMINAI_API_KEY}
      - FASTAPI_HOST=0.0.0.0
      - FASTAPI_PORT=8000
      - FASTAPI_RELOAD=false
      - FASTAPI_LOG_LEVEL=info
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

#### A.3 Create Frontend Dockerfile

```bash
nano Dockerfile.frontend
```

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### A.4 Deploy with Coolify

1. **Access Coolify Dashboard**: Navigate to `http://your-vps-ip:8000`
2. **Create New Project**: Click "New Project" and select "Docker Compose"
3. **Connect Repository**: Link your Git repository
4. **Configure Environment Variables**:
   ```
   ONEMINAI_API_KEY=your_1minai_api_key
   QDRANT_CLOUD_URL=your_qdrant_url
   QDRANT_CLOUD_API_KEY=your_qdrant_key
   ```
5. **Set Domain**: Configure your custom domain
6. **Deploy**: Click "Deploy" to start the deployment

#### A.5 Coolify Configuration Benefits

- **Automatic SSL**: Coolify handles Let's Encrypt certificates
- **Git Integration**: Auto-deploy on git push
- **Environment Management**: Easy environment variable management
- **Monitoring**: Built-in application monitoring
- **Backup**: Automated backup capabilities

### Option B: Dokploy Deployment

Dokploy is a modern, Docker-based PaaS that provides Heroku-like experience on your own infrastructure.

#### B.1 Install Dokploy on Your VPS

```bash
# Install Dokploy (requires Ubuntu 20.04+ with Docker)
curl -sSL https://dokploy.com/install.sh | sh

# Access Dokploy web interface
# Navigate to http://your-vps-ip:3000
```

#### B.2 Prepare Application for Dokploy

Create a `dokploy.json` configuration file:

```bash
nano dokploy.json
```

```json
{
  "name": "rag-superbot",
  "type": "docker-compose",
  "repository": {
    "url": "https://github.com/yourusername/rag-superbot.git",
    "branch": "main"
  },
  "buildPath": "./",
  "dockerCompose": {
    "file": "docker-compose.dokploy.yml"
  },
  "domains": [
    {
      "host": "yourdomain.com",
      "port": 3000,
      "https": true
    }
  ],
  "environment": {
    "NODE_ENV": "production",
    "ONEMINAI_API_KEY": "${ONEMINAI_API_KEY}",
    "NEXT_PUBLIC_LITELLM_API_URL": "https://yourdomain.com/api",
    "QDRANT_CLOUD_URL": "${QDRANT_CLOUD_URL}",
    "QDRANT_CLOUD_API_KEY": "${QDRANT_CLOUD_API_KEY}"
  }
}
```

#### B.3 Create Dokploy Docker Compose

```bash
nano docker-compose.dokploy.yml
```

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_USE_LITELLM=true
      - NEXT_PUBLIC_LITELLM_API_URL=https://yourdomain.com/api
      - NEXT_PUBLIC_LITELLM_MODEL=gemini-2.0-flash-lite
      - NEXT_PUBLIC_QDRANT_CLOUD_URL=${QDRANT_CLOUD_URL}
      - NEXT_PUBLIC_QDRANT_CLOUD_API_KEY=${QDRANT_CLOUD_API_KEY}
      - NEXT_PUBLIC_VECTOR_STORE=qdrant
      - NEXT_PUBLIC_COLLECTION_NAME=rag_a2a_collection
    depends_on:
      - backend
    restart: unless-stopped
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.frontend.rule=Host(`yourdomain.com`)"
      - "traefik.http.routers.frontend.tls=true"
      - "traefik.http.routers.frontend.tls.certresolver=letsencrypt"

  backend:
    build:
      context: .
      dockerfile: Dockerfile.fastapi
    ports:
      - "8000:8000"
    environment:
      - ONEMINAI_API_KEY=${ONEMINAI_API_KEY}
      - FASTAPI_HOST=0.0.0.0
      - FASTAPI_PORT=8000
      - FASTAPI_RELOAD=false
      - FASTAPI_LOG_LEVEL=info
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.backend.rule=Host(`yourdomain.com`) && PathPrefix(`/api`)"
      - "traefik.http.routers.backend.tls=true"
      - "traefik.http.routers.backend.tls.certresolver=letsencrypt"

networks:
  default:
    external:
      name: dokploy
```

#### B.4 Deploy with Dokploy

1. **Access Dokploy Dashboard**: Navigate to `http://your-vps-ip:3000`
2. **Create New Application**: Click "New Application"
3. **Select Source**: Choose "Git Repository" and enter your repo URL
4. **Configure Build Settings**:
   - Build Type: Docker Compose
   - Compose File: `docker-compose.dokploy.yml`
5. **Set Environment Variables**:
   ```
   ONEMINAI_API_KEY=your_1minai_api_key
   QDRANT_CLOUD_URL=your_qdrant_url
   QDRANT_CLOUD_API_KEY=your_qdrant_key
   ```
6. **Configure Domain**: Add your custom domain
7. **Deploy**: Click "Deploy" to start the deployment

#### B.5 Dokploy Advanced Configuration

Create a `dokploy.config.js` for advanced settings:

```javascript
module.exports = {
  apps: [
    {
      name: 'rag-superbot-frontend',
      type: 'docker-compose',
      compose: './docker-compose.dokploy.yml',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      domains: ['yourdomain.com'],
      ssl: {
        enabled: true,
        forceHttps: true
      },
      monitoring: {
        enabled: true,
        healthCheck: '/health'
      },
      scaling: {
        min: 1,
        max: 3,
        cpu: 80,
        memory: 80
      }
    }
  ],
  database: {
    // If you need a database
    postgres: {
      enabled: false
    },
    redis: {
      enabled: false
    }
  },
  monitoring: {
    enabled: true,
    retention: '30d'
  }
};
```

### Comparison: Manual vs Coolify vs Dokploy

| Feature | Manual Deployment | Coolify | Dokploy |
|---------|------------------|---------|---------|
| **Setup Complexity** | High | Medium | Low |
| **Web Interface** | None | Yes | Yes |
| **Auto SSL** | Manual (Certbot) | Automatic | Automatic |
| **Git Integration** | Manual | Yes | Yes |
| **Monitoring** | Manual setup | Built-in | Built-in |
| **Scaling** | Manual | UI-based | UI-based |
| **Backup** | Manual scripts | Built-in | Built-in |
| **Resource Usage** | Minimal | Medium | Medium |
| **Learning Curve** | Steep | Moderate | Easy |

### Recommended Deployment Strategy

**For Beginners**: Use Dokploy for its simplicity and modern interface
**For Advanced Users**: Use Coolify for more control and features
**For Maximum Control**: Use manual deployment for complete customization

### Post-Deployment Steps (All Methods)

1. **Verify Deployment**:
   ```bash
   curl https://yourdomain.com/health
   curl https://yourdomain.com
   ```

2. **Monitor Logs**:
   - Coolify: Check logs in the web interface
   - Dokploy: View logs in the dashboard
   - Manual: Use `journalctl` or Docker logs

3. **Set Up Monitoring**:
   - Configure uptime monitoring
   - Set up log aggregation
   - Monitor resource usage

4. **Configure Backups**:
   - Database backups (if applicable)
   - Application code backups
   - Environment configuration backups

## Scaling Considerations

For high-traffic deployments:
- Use a load balancer (HAProxy, AWS ALB)
- Implement horizontal scaling with multiple instances
- Use a managed database service
- Consider CDN for static assets
- Implement caching (Redis, Memcached)

---

This guide provides multiple deployment options for your RAG Superbot on a VPS. Choose the method that best fits your technical expertise and requirements:

- **Manual Deployment**: Maximum control and customization
- **Coolify**: Balance of features and simplicity
- **Dokploy**: Modern, user-friendly deployment platform

All methods will result in a production-ready deployment with proper SSL, monitoring, and scaling capabilities.