#!/bin/bash
set -e

echo "--- Cleaning up project ---"

# Clean root directories
echo "Removing root node_modules, dist, and build..."
rm -rf node_modules/ dist/ build/

# Clean frontend directories
echo "Removing frontend node_modules, dist, and build..."
rm -rf frontend/node_modules/ frontend/dist/ frontend/build/

# Clean backend artifacts
echo "Removing backend Python artifacts..."
find backend -type d -name "__pycache__" -exec rm -r {} +
find backend -type f -name "*.pyc" -delete

# Clean up Docker
echo "Pruning Docker system..."
if command -v docker &> /dev/null
then
    docker system prune -af
else
    echo "Docker not found, skipping prune."
fi

echo "--- Reinstalling dependencies ---"

# Install root npm dependencies
if [ -f "package.json" ]; then
    echo "Installing root npm dependencies..."
    npm install
fi

# Install frontend npm dependencies
if [ -f "frontend/package.json" ]; then
    echo "Installing frontend npm dependencies..."
    (cd frontend && npm install)
fi

# Install backend python dependencies
if [ -f "backend/requirements.txt" ]; then
    echo "Installing backend Python dependencies..."
    pip install -r backend/requirements.txt
fi

echo "--- Cleanup and reinstall complete! ---"
