#!/usr/bin/env python3
"""
Brand DNA Analyzer - Web API
Flask backend with WebSocket support for real-time progress
"""

import asyncio
import logging
import os
from pathlib import Path
from datetime import datetime
from typing import List, Dict
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import threading

from main import BrandDNAAnalyzer
from config import config

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Store active analysis jobs
active_jobs = {}


class ProgressLogger:
    """Custom logger that emits progress to WebSocket"""

    def __init__(self, job_id: str):
        self.job_id = job_id
        self.messages = []

    def log(self, message: str, level: str = 'info'):
        """Log a message and emit to WebSocket"""
        timestamp = datetime.now().isoformat()
        log_entry = {
            'timestamp': timestamp,
            'level': level,
            'message': message
        }
        self.messages.append(log_entry)

        # Emit to WebSocket
        socketio.emit('analysis_progress', {
            'job_id': self.job_id,
            'log': log_entry
        })

        # Also log to console
        logger.info(f"[{self.job_id}] {message}")


async def run_analysis_async(job_id: str, brand_configs: List[Dict], progress_logger: ProgressLogger):
    """Run brand analysis with progress logging"""
    try:
        progress_logger.log(f"Starting analysis for {len(brand_configs)} brands", 'info')

        # Update job status
        active_jobs[job_id]['status'] = 'running'
        socketio.emit('job_status', {'job_id': job_id, 'status': 'running'})

        # Initialize analyzer
        analyzer = BrandDNAAnalyzer()

        # Collect data for each brand
        for i, brand in enumerate(brand_configs, 1):
            brand_name = brand['name']
            progress_logger.log(f"[{i}/{len(brand_configs)}] Processing {brand_name}...", 'info')
            socketio.emit('job_progress', {
                'job_id': job_id,
                'current': i,
                'total': len(brand_configs),
                'brand': brand_name
            })

        # Run the full analysis
        progress_logger.log("Running full brand DNA analysis...", 'info')
        result = await analyzer.analyze_brands(brand_configs)

        # Success
        progress_logger.log(f"Analysis complete! Report: {result['report_path']}", 'success')
        active_jobs[job_id]['status'] = 'completed'
        active_jobs[job_id]['report_path'] = result['report_path']
        active_jobs[job_id]['brands_data'] = result['brands_data']
        active_jobs[job_id]['strategic_insights'] = result['strategic_insights']
        active_jobs[job_id]['duration'] = result['duration']
        active_jobs[job_id]['completed_at'] = datetime.now().isoformat()

        socketio.emit('job_status', {
            'job_id': job_id,
            'status': 'completed',
            'report_path': str(result['report_path'])
        })

    except Exception as e:
        error_msg = f"Analysis failed: {str(e)}"
        progress_logger.log(error_msg, 'error')
        active_jobs[job_id]['status'] = 'failed'
        active_jobs[job_id]['error'] = str(e)

        socketio.emit('job_status', {
            'job_id': job_id,
            'status': 'failed',
            'error': str(e)
        })


def run_analysis_thread(job_id: str, brand_configs: List[Dict], progress_logger: ProgressLogger):
    """Thread wrapper to run async analysis"""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(run_analysis_async(job_id, brand_configs, progress_logger))
    loop.close()


# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Brand DNA Analyzer API',
        'version': '1.0.0'
    })


@app.route('/api/config/validate', methods=['POST'])
def validate_config():
    """Validate API configuration"""
    try:
        config.validate()
        return jsonify({
            'valid': True,
            'message': 'Configuration is valid'
        })
    except ValueError as e:
        return jsonify({
            'valid': False,
            'error': str(e)
        }), 400


@app.route('/api/analyze', methods=['POST'])
def start_analysis():
    """Start a new brand analysis job"""
    try:
        data = request.get_json()

        if not data or 'brands' not in data:
            return jsonify({'error': 'Missing brands configuration'}), 400

        brand_configs = data['brands']

        if not brand_configs or len(brand_configs) == 0:
            return jsonify({'error': 'At least one brand is required'}), 400

        # Validate brand configs
        for brand in brand_configs:
            if 'name' not in brand or 'website' not in brand:
                return jsonify({'error': 'Each brand must have name and website'}), 400

        # Generate job ID
        job_id = f"job_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        # Initialize job
        active_jobs[job_id] = {
            'id': job_id,
            'status': 'queued',
            'brands': brand_configs,
            'created_at': datetime.now().isoformat(),
            'logs': []
        }

        # Create progress logger
        progress_logger = ProgressLogger(job_id)
        active_jobs[job_id]['logger'] = progress_logger

        # Start analysis in background thread
        thread = threading.Thread(
            target=run_analysis_thread,
            args=(job_id, brand_configs, progress_logger)
        )
        thread.daemon = True
        thread.start()

        return jsonify({
            'job_id': job_id,
            'status': 'queued',
            'message': 'Analysis started'
        }), 202

    except Exception as e:
        logger.error(f"Error starting analysis: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/jobs/<job_id>', methods=['GET'])
def get_job_status(job_id: str):
    """Get status of an analysis job"""
    if job_id not in active_jobs:
        return jsonify({'error': 'Job not found'}), 404

    job = active_jobs[job_id]

    return jsonify({
        'job_id': job_id,
        'status': job['status'],
        'brands': [b['name'] for b in job['brands']],
        'created_at': job['created_at'],
        'completed_at': job.get('completed_at'),
        'report_path': job.get('report_path'),
        'error': job.get('error'),
        'logs': job.get('logger', ProgressLogger(job_id)).messages
    })


@app.route('/api/jobs', methods=['GET'])
def list_jobs():
    """List all analysis jobs"""
    jobs = []
    for job_id, job in active_jobs.items():
        jobs.append({
            'job_id': job_id,
            'status': job['status'],
            'brands': [b['name'] for b in job['brands']],
            'created_at': job['created_at'],
            'completed_at': job.get('completed_at')
        })

    return jsonify({'jobs': jobs})


@app.route('/api/reports/<job_id>/download', methods=['GET'])
def download_report(job_id: str):
    """Download the generated PDF report"""
    if job_id not in active_jobs:
        return jsonify({'error': 'Job not found'}), 404

    job = active_jobs[job_id]

    if job['status'] != 'completed':
        return jsonify({'error': 'Report not ready yet'}), 400

    report_path = job.get('report_path')
    if not report_path or not Path(report_path).exists():
        return jsonify({'error': 'Report file not found'}), 404

    return send_file(
        report_path,
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f"brand_dna_report_{job_id}.pdf"
    )


@app.route('/api/jobs/<job_id>/comparison', methods=['GET'])
def get_comparison_data(job_id: str):
    """Get comparison data for multi-brand analysis"""
    if job_id not in active_jobs:
        return jsonify({'error': 'Job not found'}), 404

    job = active_jobs[job_id]

    if job['status'] != 'completed':
        return jsonify({'error': 'Analysis not complete yet'}), 400

    brands_data = job.get('brands_data', [])
    strategic_insights = job.get('strategic_insights', {})

    # Build comparison grid data
    comparison = {
        'brands': [],
        'insights': strategic_insights
    }

    for brand in brands_data:
        brand_summary = {
            'name': brand['name'],
            'logo': brand.get('logos', {}).get('primary_logo'),
            'colors': brand.get('colors', {}).get('primary_colors', []),
            'ad_count': len(brand.get('ads', [])),
            'screenshot_count': len(brand.get('screenshots', [])),
            'visual_identity': {
                'dominant_color': brand.get('colors', {}).get('primary_colors', [{}])[0] if brand.get('colors', {}).get('primary_colors') else None,
                'color_palette': brand.get('colors', {}).get('primary_colors', [])[:6]
            }
        }
        comparison['brands'].append(brand_summary)

    return jsonify(comparison)


# ============================================================================
# WEBSOCKET EVENTS
# ============================================================================

@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    logger.info("Client connected")
    emit('connected', {'message': 'Connected to Brand DNA Analyzer'})


@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    logger.info("Client disconnected")


@socketio.on('subscribe_job')
def handle_subscribe(data):
    """Subscribe to job updates"""
    job_id = data.get('job_id')
    if job_id and job_id in active_jobs:
        emit('subscribed', {'job_id': job_id})
    else:
        emit('error', {'message': 'Job not found'})


# ============================================================================
# MAIN
# ============================================================================

if __name__ == '__main__':
    # Ensure output directories exist
    config.ensure_directories()

    # Run server
    logger.info("🚀 Starting Brand DNA Analyzer API")
    logger.info(f"📊 Output directory: {config.OUTPUT_DIR}")
    socketio.run(app, debug=True, host='0.0.0.0', port=5000, allow_unsafe_werkzeug=True)
