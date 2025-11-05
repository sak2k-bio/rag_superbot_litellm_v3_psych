#!/bin/bash

# Quick setup script for Psychiatry Therapy SuperBot deployment

echo "🧠 Psychiatry Therapy SuperBot - Deployment Setup"
echo "=================================================="
echo ""

# Check prerequisites
echo "🔍 Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+ first."
    exit 1
fi

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm found"

# Install CLI tools
echo ""
echo "📦 Installing deployment tools..."

# Install Render CLI (optional - can use web dashboard)
if ! command -v render &> /dev/null; then
    echo "Installing Render CLI..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install render
        else
            echo "⚠️  Homebrew not found. You can install Render CLI manually or use the web dashboard."
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        curl -fsSL https://cli.render.com/install | sh
    else
        echo "⚠️  Please install Render CLI manually from: https://render.com/docs/cli"
        echo "    Or use the web dashboard at: https://dashboard.render.com"
    fi
else
    echo "✅ Render CLI already installed"
fi

# Install Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
else
    echo "✅ Vercel CLI already installed"
fi

# Make deployment scripts executable
echo ""
echo "🔧 Setting up deployment scripts..."
chmod +x deploy-render.sh
chmod +x deploy-vercel.sh
echo "✅ Deployment scripts are now executable"

# Create directories if they don't exist
mkdir -p src

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Login to Railway: railway login"
echo "2. Login to Vercel: vercel login"
echo "3. Deploy backend: ./deploy-railway.sh"
echo "4. Update Vercel environment variables with your Railway URL"
echo "5. Deploy frontend: ./deploy-vercel.sh"
echo ""
echo "📖 For detailed instructions, see DEPLOYMENT.md"