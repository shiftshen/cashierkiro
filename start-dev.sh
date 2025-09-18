#!/bin/bash

echo "🚀 Starting DAMO Cashier Development Server..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Kill any existing server on port 8091
echo "🔍 Checking for existing server on port 8091..."
lsof -ti:8091 | xargs kill -9 2>/dev/null || true

# Start the development server
echo "🌐 Starting development server on http://localhost:8091"
echo ""
echo "📱 Access the application:"
echo "   Main App: http://localhost:8091/index.html"
echo "   API Test: http://localhost:8091/test-api.html"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run serve