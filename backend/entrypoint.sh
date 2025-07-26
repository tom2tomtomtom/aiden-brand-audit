#!/bin/bash
# AI Brand Audit Tool - Production Entrypoint Script

set -e

echo "🚀 Starting AI Brand Audit Tool Backend (Production)"
echo "📅 Date: $(date)"
echo "🌍 Environment: ${FLASK_ENV:-production}"

# Create necessary directories
mkdir -p /app/logs /app/instance

# Initialize database if needed
echo "📊 Initializing database..."
python -c "
from app import app
from src.extensions import db
with app.app_context():
    try:
        db.create_all()
        print('✅ Database initialized successfully')
    except Exception as e:
        print(f'⚠️ Database initialization warning: {e}')
"

# Check API keys
echo "🔑 Checking API key configuration..."
python -c "
import os
api_keys = {
    'OPENROUTER_API_KEY': bool(os.environ.get('OPENROUTER_API_KEY')),
    'NEWS_API_KEY': bool(os.environ.get('NEWS_API_KEY')),
    'BRANDFETCH_API_KEY': bool(os.environ.get('BRANDFETCH_API_KEY')),
    'OPENCORPORATES_API_KEY': bool(os.environ.get('OPENCORPORATES_API_KEY'))
}
for key, exists in api_keys.items():
    status = '✅ Set' if exists else '❌ Missing'
    print(f'{key}: {status}')
"

# Start the application with Gunicorn for production
echo "🚀 Starting application server..."
exec gunicorn --bind 0.0.0.0:8000 \
    --workers 4 \
    --threads 2 \
    --timeout 120 \
    --keepalive 2 \
    --max-requests 1000 \
    --max-requests-jitter 50 \
    --access-logfile /app/logs/access.log \
    --error-logfile /app/logs/error.log \
    --log-level info \
    --capture-output \
    app:app