#!/bin/bash

echo "🎯 Starting Pegboard in development mode..."

# Kill any existing processes on ports 5173-5176
echo "🧹 Cleaning up existing processes..."
lsof -ti:5173,5174,5175,5176 | xargs kill -9 2>/dev/null || true

# Wait a moment for ports to be freed
sleep 1

echo "🚀 Launching Electron app..."
npm run electron:dev
