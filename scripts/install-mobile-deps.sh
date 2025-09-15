#!/bin/bash

# Mobile Dependencies Installation Script
echo "📱 Setting up React Native environment..."

# Check if React Native CLI is installed
if ! command -v react-native &> /dev/null; then
    echo "📦 Installing React Native CLI..."
    npm install -g react-native-cli
fi

# Check if React Native CLI is installed
if ! command -v npx &> /dev/null; then
    echo "❌ npx is not available. Please install npm and try again."
    exit 1
fi

echo "✅ React Native CLI available"

# Install mobile dependencies
echo "📦 Installing mobile dependencies..."
cd mobile

# Install React Native dependencies
npm install

# Install iOS dependencies (macOS only)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 macOS detected. Installing iOS dependencies..."
    cd ios && pod install && cd ..
    echo "✅ iOS dependencies installed"
else
    echo "⚠️  Non-macOS system detected. iOS dependencies not installed."
fi

cd ..

echo "✅ Mobile dependencies installed successfully!"
echo ""
echo "To run the mobile app:"
echo "1. Start Metro bundler: npm run mobile:start"
echo "2. Run on Android: npm run mobile:android"
echo "3. Run on iOS (macOS only): npm run mobile:ios"
