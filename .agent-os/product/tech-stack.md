# Technical Stack

> Last Updated: 2025-07-25
> Version: 1.0.0

## Core Technologies

### Application Framework
- **Framework:** Flask
- **Version:** 3.1.1
- **Language:** Python 3.11

### Database
- **Primary:** PostgreSQL (Production) / SQLite (Development)
- **Version:** SQLAlchemy 2.0.41
- **ORM:** SQLAlchemy with Flask-SQLAlchemy
- **Migrations:** Alembic 1.14.0 with Flask-Migrate 4.0.7

## Frontend Stack

### JavaScript Framework
- **Framework:** React
- **Version:** 19.1.0
- **Build Tool:** Vite 6.3.5

### Import Strategy
- **Strategy:** Node.js modules
- **Package Manager:** pnpm
- **Node Version:** Latest LTS (as per pnpm@10.4.1)

### CSS Framework
- **Framework:** TailwindCSS
- **Version:** 4.1.7
- **PostCSS:** Yes via @tailwindcss/vite 4.1.7

### UI Components
- **Library:** Radix UI Components
- **Version:** Latest stable (complete Radix UI ecosystem)
- **Additional:** Shadcn/ui component system
- **Charts:** Recharts 2.15.3

## Additional Frontend Dependencies

### State Management
- **Library:** Zustand
- **Version:** 5.0.6

### Routing
- **Library:** React Router DOM
- **Version:** 7.6.1

### Form Handling
- **Library:** React Hook Form
- **Version:** 7.56.3
- **Validation:** Zod 3.24.4

### Animations
- **Library:** Framer Motion
- **Version:** 12.15.0

## Backend Dependencies

### Security & Authentication
- **JWT:** Flask-JWT-Extended 4.7.1
- **Password Hashing:** bcrypt 4.3.0
- **Rate Limiting:** Flask-Limiter 3.12
- **CORS:** flask-cors 6.0.0

### API & Data Processing
- **HTTP Requests:** requests 2.32.4
- **Async Processing:** aiohttp 3.9.1, aiofiles 23.2.0
- **Data Validation:** marshmallow 4.0.0, marshmallow-sqlalchemy 1.4.2

### Task Processing
- **Background Tasks:** Celery 5.5.3 with Redis
- **Caching:** flask_caching 2.3.1
- **WebSockets:** Flask-SocketIO 5.3.6

### Visual Processing
- **Browser Automation:** Playwright 1.40.0
- **Image Processing:** Pillow 10.1.0, opencv-python 4.8.1.78
- **Color Analysis:** colorthief 0.2.1, webcolors 1.13
- **Web Scraping:** beautifulsoup4 4.12.2, lxml 4.9.3

### Report Generation
- **PDF Generation:** reportlab 4.0.9
- **PowerPoint Generation:** python-pptx 0.6.23
- **Charts & Visualization:** matplotlib 3.8.2, seaborn 0.13.0

### Testing
- **Frontend Testing:** Vitest 3.2.4, Playwright (E2E)
- **Backend Testing:** pytest (via testing infrastructure)
- **Integration Testing:** Custom test suites with real API validation

## Assets & Media

### Fonts
- **Provider:** System fonts and Google Fonts
- **Loading Strategy:** Optimized loading via CSS

### Icons
- **Library:** Lucide React
- **Version:** 0.510.0
- **Implementation:** React components

## External APIs & Services

### AI/LLM Service
- **Provider:** OpenRouter
- **Model:** Claude 3 Haiku
- **Purpose:** Strategic analysis and report generation

### News Data
- **Provider:** NewsAPI
- **Purpose:** Real-time news aggregation and sentiment analysis

### Brand Data
- **Provider:** Brandfetch
- **Purpose:** Brand asset discovery and company information
- **Additional:** OpenCorporates for corporate data

## Infrastructure

### Application Hosting
- **Platform:** Railway (Primary) / Local Docker (Development)
- **Containerization:** Docker with multi-stage builds
- **Load Balancing:** Railway managed

### Database Hosting
- **Provider:** Railway Managed PostgreSQL (Production)
- **Local Development:** SQLite
- **Backups:** Railway automated backups

### Asset Storage
- **Provider:** Local filesystem with static serving
- **CDN:** Railway edge network
- **File Management:** Flask static file serving

### Monitoring & Analytics
- **Application Monitoring:** Prometheus metrics
- **Visualization:** Grafana dashboards
- **Error Tracking:** Custom error management service
- **Logging:** Python logging with structured output

## Deployment

### CI/CD Pipeline
- **Platform:** Railway automatic deployment
- **Trigger:** Push to main branch
- **Build Process:** Railway buildpacks with Docker support

### Environments
- **Production:** Railway deployment from main branch
- **Development:** Local Docker with ngrok tunneling
- **Testing:** Automated test suites with real API integration

### Performance Optimization
- **Caching:** Redis-based intelligent caching system
- **Database:** Connection pooling and query optimization
- **Frontend:** Vite build optimization and code splitting
- **API:** Circuit breakers and retry mechanisms

### Security
- **API Keys:** Environment variable management
- **Rate Limiting:** Flask-Limiter with Redis backend  
- **Authentication:** JWT with refresh token rotation
- **CORS:** Properly configured origins and headers

## Code Repository
- **Repository URL:** Private GitHub repository
- **Branch Strategy:** Main branch for production deployment
- **Version Control:** Git with conventional commits