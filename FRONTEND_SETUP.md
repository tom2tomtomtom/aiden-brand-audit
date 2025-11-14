# Brand DNA Analyzer - Web Frontend Setup

A modern, real-time web interface for the Brand DNA Analyzer with live progress tracking and instant report downloads.

## Features

- **Modern React UI** - Clean, responsive interface built with React + Vite
- **Real-time Progress** - WebSocket-powered live updates during analysis
- **Multiple Brands** - Analyze up to 10 brands simultaneously
- **Instant Downloads** - Download PDF reports as soon as analysis completes
- **Dark Theme** - Professional dark mode interface with Tailwind CSS
- **Live Logs** - See exactly what's happening during the analysis

## Architecture

```
Brand DNA Analyzer
├── Backend (Flask API)
│   ├── WebSocket support (Socket.IO)
│   ├── RESTful endpoints
│   └── Async job processing
└── Frontend (React + Vite)
    ├── Brand input form
    ├── Real-time progress tracker
    └── Report download manager
```

## Quick Start

### 1. Install Backend Dependencies

```bash
# Install Python dependencies (including Flask, Socket.IO)
pip install -r requirements.txt

# Install Playwright browsers
playwright install chromium
```

### 2. Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env and add your API keys:
# - APIFY_API_KEY (from https://console.apify.com)
# - ANTHROPIC_API_KEY (from https://console.anthropic.com)
```

### 3. Start Backend Server

```bash
# Start Flask API server (runs on http://localhost:5000)
python app.py
```

You should see:
```
🚀 Starting Brand DNA Analyzer API
📊 Output directory: /path/to/output
 * Running on http://0.0.0.0:5000
```

### 4. Install Frontend Dependencies

```bash
# Navigate to frontend directory
cd frontend

# Install npm dependencies
npm install
```

### 5. Start Frontend Development Server

```bash
# Start Vite dev server (runs on http://localhost:3000)
npm run dev
```

You should see:
```
  VITE v5.0.0  ready in 500 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

### 6. Open in Browser

Navigate to **http://localhost:3000**

## Usage

### Starting an Analysis

1. **Add Brands**
   - Click "Add Another Brand" to add multiple brands
   - Fill in:
     - **Brand Name** (required) - e.g., "Nike"
     - **Website** (required) - e.g., "https://nike.com"
     - **Facebook Page** (optional) - e.g., "nike"

2. **Load Example**
   - Click "Load Example" to populate with Nike, Adidas, Under Armour

3. **Start Analysis**
   - Click "Start Brand DNA Analysis"
   - Watch real-time progress in the activity log
   - See live updates as each brand is processed

4. **Download Report**
   - Click "Download Report" when analysis completes
   - PDF will be saved to your downloads folder

### What Happens During Analysis

The progress tracker shows live updates:

```
✓ Starting analysis for 3 brands
✓ [1/3] Processing Nike...
✓ Collecting logos...
✓ Collecting Facebook ads...
✓ Capturing ad screenshots...
✓ Analyzing color palette...
✓ [2/3] Processing Adidas...
...
✓ Running full brand DNA analysis...
✓ Analysis complete! Report: output/reports/brand_dna_report_20241114.pdf
```

## API Endpoints

The backend provides these REST endpoints:

### Health Check
```http
GET /health
```

### Validate Configuration
```http
POST /api/config/validate
```

### Start Analysis
```http
POST /api/analyze
Content-Type: application/json

{
  "brands": [
    {
      "name": "Nike",
      "website": "https://nike.com",
      "facebook_page": "nike"
    }
  ]
}
```

### Get Job Status
```http
GET /api/jobs/{job_id}
```

### Download Report
```http
GET /api/reports/{job_id}/download
```

## WebSocket Events

The frontend connects to Socket.IO for real-time updates:

### Client → Server
- `subscribe_job` - Subscribe to job updates

### Server → Client
- `connected` - Connection established
- `analysis_progress` - Log messages during analysis
- `job_status` - Status updates (queued, running, completed, failed)
- `job_progress` - Progress percentage updates

## Development

### Frontend Development

```bash
cd frontend

# Start dev server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

### Backend Development

```bash
# Run with debug mode
python app.py

# The Flask server runs with hot reload enabled by default
```

## Project Structure

```
brand-dna-analyzer/
├── app.py                      # Flask backend API
├── main.py                     # Core analyzer logic
├── config.py                   # Configuration
├── requirements.txt            # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── BrandForm.jsx       # Brand input form
│   │   │   └── ProgressTracker.jsx # Real-time progress
│   │   ├── hooks/
│   │   │   └── useSocket.js        # WebSocket hook
│   │   ├── utils/
│   │   │   └── api.js              # API client
│   │   ├── App.jsx                 # Main app
│   │   ├── main.jsx                # Entry point
│   │   └── index.css               # Tailwind CSS
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
└── output/
    ├── screenshots/            # Captured ad images
    └── reports/                # Generated PDFs
```

## Troubleshooting

### Backend Issues

**Port 5000 already in use:**
```bash
# Change port in app.py:
socketio.run(app, port=5001)

# Update frontend/vite.config.js proxy target
```

**API key errors:**
```bash
# Validate configuration
python -c "from config import config; config.validate()"
```

**WebSocket not connecting:**
- Check that Flask server is running
- Check browser console for errors
- Verify CORS is enabled

### Frontend Issues

**Dependencies not installing:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Vite not starting:**
```bash
# Check port 3000 is available
lsof -i :3000

# Or change port in vite.config.js
```

**Build errors:**
```bash
# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

## Production Deployment

### Backend

```bash
# Use production WSGI server
pip install gunicorn

# Run with gunicorn
gunicorn --worker-class eventlet -w 1 app:app --bind 0.0.0.0:5000
```

### Frontend

```bash
cd frontend

# Build for production
npm run build

# Serve with nginx/apache or use:
npm run preview
```

### Environment Variables

Create production `.env`:
```bash
SECRET_KEY=your-secret-key-here
APIFY_API_KEY=your-apify-key
ANTHROPIC_API_KEY=your-anthropic-key
FLASK_ENV=production
```

## Performance

- **3-brand analysis:** 3-4 minutes
- **Report generation:** 30-45 seconds
- **Cost per report:** $0.60 - $1.00
- **WebSocket latency:** <100ms
- **Frontend bundle size:** ~150KB gzipped

## Tech Stack

### Backend
- Flask 3.0 - Web framework
- Flask-SocketIO - WebSocket support
- Python asyncio - Async job processing

### Frontend
- React 18 - UI framework
- Vite 5 - Build tool
- Tailwind CSS - Styling
- Socket.IO Client - Real-time updates
- Axios - HTTP client
- Lucide React - Icons

## Support

**Issues:** Create an issue on GitHub
**Questions:** Check the main README.md

---

**Built with modern web technologies. Production-ready.** 🚀
