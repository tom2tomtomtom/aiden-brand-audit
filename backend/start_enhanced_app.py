#!/usr/bin/env python3
"""
Start the Enhanced Brand Audit Application
With McKinsey-level prompting and fixed visual analysis
"""
import os
import sys
import threading
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO
from datetime import datetime

# Set up the path
sys.path.append(os.path.dirname(__file__))
os.chdir(os.path.dirname(__file__))

# Load environment variables
try:
    from dotenv import load_dotenv
    load_dotenv()
    print("✅ Environment variables loaded from .env file")
except ImportError:
    print("⚠️  python-dotenv not installed, loading from environment")

from src.extensions import db
from src.services.database_service import DatabaseService
from src.services.api_validation_service import api_validator
from src.services.websocket_service import init_websocket_service, get_websocket_service

# Create Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'enhanced-brand-audit-2025')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///instance/app.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize extensions
CORS(app, origins=["http://localhost:5173", "http://localhost:3000", "*"])
db.init_app(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Initialize services
with app.app_context():
    try:
        db.create_all()
        print("✅ Database tables initialized")
    except Exception as e:
        print(f"⚠️  Database initialization: {e}")

    # Initialize WebSocket service
    init_websocket_service(socketio)
    print("✅ WebSocket service initialized")

# Import and register routes
from src.routes.health import health_bp
from src.routes.brand_audit import brand_audit_bp

app.register_blueprint(health_bp)
app.register_blueprint(brand_audit_bp)

@app.route('/')
def home():
    return jsonify({
        "message": "🚀 Enhanced AI Brand Audit Tool API",
        "version": "2.0 - McKinsey Level",
        "status": "operational",
        "enhancements": [
            "✅ McKinsey-level executive summaries",
            "✅ BCG-level competitive analysis", 
            "✅ Strategic recommendations with ROI",
            "✅ Fixed visual asset capture",
            "✅ Enhanced LLM prompting system"
        ],
        "timestamp": datetime.utcnow().isoformat()
    })

@app.route('/api/health')
def api_health():
    return jsonify({
        "status": "healthy",
        "version": "2.0-enhanced",
        "enhancements_active": True,
        "visual_processing": True,
        "llm_enhanced": True,
        "timestamp": datetime.utcnow().isoformat()
    })

if __name__ == "__main__":
    port = int(os.getenv('PORT', 8000))
    print(f"""
🚀 Starting Enhanced AI Brand Audit Tool API with McKinsey-level capabilities
📍 Frontend: http://localhost:5173
📍 Backend: http://localhost:{port}
📍 API Health: http://localhost:{port}/api/health
📍 Enhanced Features: Executive summaries, competitive analysis, visual assets
""")
    
    socketio.run(app, host='0.0.0.0', port=port, debug=False, allow_unsafe_werkzeug=True)