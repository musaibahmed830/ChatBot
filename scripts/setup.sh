#!/bin/bash

# Social Chatbot Application Setup Script
echo "🚀 Setting up Social Chatbot Application..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm and try again."
    exit 1
fi

echo "✅ npm $(npm -v) detected"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
npm install

# Install mobile dependencies
echo "📦 Installing mobile dependencies..."
cd mobile && npm install && cd ..

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating environment file..."
    cp env.example .env
    echo "⚠️  Please update .env file with your API keys and configuration"
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p server/logs
mkdir -p server/uploads
mkdir -p nginx/ssl

# Set up MongoDB (if using Docker)
if command -v docker &> /dev/null; then
    echo "🐳 Docker detected. Setting up MongoDB with Docker..."
    docker-compose up -d mongodb redis
    
    echo "⏳ Waiting for MongoDB to start..."
    sleep 10
else
    echo "⚠️  Docker not detected. Please install and run MongoDB manually."
fi

# Check if MongoDB is running
if command -v mongo &> /dev/null; then
    echo "✅ MongoDB connection available"
elif command -v mongosh &> /dev/null; then
    echo "✅ MongoDB shell available"
else
    echo "⚠️  MongoDB client not found. Please ensure MongoDB is installed and running."
fi

echo ""
echo "🎉 Setup completed!"
echo ""
echo "Next steps:"
echo "1. Update .env file with your API keys:"
echo "   - WhatsApp Business API token"
echo "   - Instagram App ID and Secret"
echo "   - Snapchat Client ID and Secret"
echo "   - OpenAI API key (optional)"
echo ""
echo "2. Start the backend server:"
echo "   npm run dev"
echo ""
echo "3. Start the mobile development server:"
echo "   npm run mobile:start"
echo ""
echo "4. Run the mobile app:"
echo "   npm run mobile:android  # for Android"
echo "   npm run mobile:ios      # for iOS"
echo ""
echo "5. For production deployment:"
echo "   docker-compose up -d"
echo ""
echo "📚 Check README.md for detailed setup instructions and API integration guides."
