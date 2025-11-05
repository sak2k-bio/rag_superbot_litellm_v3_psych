#!/bin/bash

# Deployment script for Psychiatry Therapy SuperBot Frontend to Vercel

echo "🚀 Deploying Psychiatry Therapy SuperBot Frontend to Vercel..."

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if logged in to Vercel
echo "🔐 Checking Vercel authentication..."
if ! vercel whoami &> /dev/null; then
    echo "❌ Not logged in to Vercel. Please run: vercel login"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Build the project
echo "🔨 Building the project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    # Deploy to Vercel
    echo "🚀 Deploying to Vercel..."
    vercel --prod
    
    if [ $? -eq 0 ]; then
        echo "✅ Vercel deployment successful!"
        echo ""
        echo "🎉 Deployment complete!"
        echo ""
        echo "📋 Important reminders:"
        echo "1. Make sure your Cloudflare Worker API URL is set in Vercel environment variables"
        echo "2. Update NEXT_PUBLIC_LITELLM_API_URL to point to your Cloudflare Worker"
        echo "3. Test the full application flow"
        echo ""
        echo "🔧 Environment variables to set in Vercel dashboard:"
        echo "  NEXT_PUBLIC_LITELLM_API_URL=https://your-project-name.up.railway.app"
        echo "  NEXT_PUBLIC_USE_LITELLM=true"
        echo "  (plus all other environment variables from .env.local)"
    else
        echo "❌ Vercel deployment failed!"
        exit 1
    fi
else
    echo "❌ Build failed!"
    exit 1
fi