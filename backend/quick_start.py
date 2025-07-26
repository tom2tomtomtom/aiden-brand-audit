#!/usr/bin/env python3
import os
import sys

# Fix the current directory and path
backend_dir = '/Users/thomasdowuona-hyde/brand-audit-app/backend'
os.chdir(backend_dir)
sys.path.insert(0, backend_dir)

# Set required globals for app.py
__file__ = os.path.join(backend_dir, 'app.py')

# Load the app content
with open('app.py', 'r') as f:
    app_content = f.read()

# Fix the socketio run call for development
app_content = app_content.replace(
    "socketio.run(app, host='0.0.0.0', port=port, debug=False)",
    "socketio.run(app, host='0.0.0.0', port=port, debug=False, allow_unsafe_werkzeug=True)"
)

print("🚀 Starting Enhanced Brand Audit Backend...")
exec(app_content)