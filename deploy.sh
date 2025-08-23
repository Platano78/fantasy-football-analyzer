#!/bin/bash

# Fantasy Football Analyzer - Netlify Deployment Script
# Atomic deployment with verification steps

echo "🚀 Starting Fantasy Football Analyzer Deployment..."

# Task 1: Pre-deployment verification
echo "📋 Task 1: Pre-deployment verification..."

# Check if all required files exist
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found!"
    exit 1
fi

if [ ! -f "netlify.toml" ]; then
    echo "❌ netlify.toml not found! Creating..."
    echo "Please run the configuration setup first."
    exit 1
fi

# Check Node.js version
node_version=$(node -v)
echo "✅ Node.js version: $node_version"

# Task 2: Install dependencies and build
echo "📦 Task 2: Installing dependencies..."
npm ci --production=false

echo "🔧 Task 3: Running production build..."
npm run build:prod

# Verify build output
if [ ! -d "dist" ]; then
    echo "❌ Build failed - dist folder not created!"
    exit 1
fi

echo "✅ Build successful - dist folder created"

# Task 4: Install Netlify CLI (if not already installed)
echo "🌐 Task 4: Setting up Netlify CLI..."

if ! command -v netlify &> /dev/null; then
    echo "Installing Netlify CLI..."
    npm install -g netlify-cli
else
    echo "✅ Netlify CLI already installed"
fi

# Task 5: Deploy to Netlify
echo "🚀 Task 5: Deploying to Netlify..."

# First deploy to preview
echo "Deploying to preview URL first..."
netlify deploy --dir=dist

echo ""
echo "🎯 Preview deployment complete!"
echo "Please test the preview URL and run the following for production:"
echo "netlify deploy --prod --dir=dist"
echo ""
echo "✅ Deployment script complete!"
echo "Next steps:"
echo "1. Test your preview deployment"
echo "2. Configure environment variables in Netlify dashboard"
echo "3. Deploy to production with: netlify deploy --prod --dir=dist"