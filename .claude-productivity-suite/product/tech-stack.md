# Technical Stack

> Last Updated: 2025-01-25
> Version: 1.0.0

## Core Technologies

### Application Framework
- **Framework:** Flask
- **Version:** 3.1.1
- **Language:** Python 3.11+

### Database
- **Primary:** PostgreSQL
- **Version:** 15+
- **Development:** SQLite 3.x
- **ORM:** SQLAlchemy 2.0.41

## Frontend Stack

### JavaScript Framework
- **Framework:** React
- **Version:** 19.1.0
- **Build Tool:** Vite 6.3.5

### Import Strategy
- **Strategy:** ES6 modules
- **Package Manager:** pnpm
- **Node Version:** 20 LTS

### CSS Framework
- **Framework:** Tailwind CSS
- **Version:** 4.1.7
- **PostCSS:** Yes

### UI Components
- **Library:** Radix UI + shadcn/ui
- **Version:** Latest stable
- **Installation:** Via npm/pnpm

## Assets & Media

### Fonts
- **Provider:** Google Fonts
- **Loading Strategy:** Self-hosted for performance

### Icons
- **Library:** Lucide React
- **Implementation:** React components

## External Integrations

### AI/LLM Services
- **Provider:** OpenRouter
- **Model:** Claude 3 Haiku
- **Purpose:** Strategic analysis and report generation

### Data Sources
- **News Data:** NewsAPI
- **Brand Data:** Brandfetch API, OpenCorporates API
- **Visual Analysis:** Custom Playwright + OpenCV integration

## Infrastructure

### Application Hosting
- **Development:** Local Docker + ngrok
- **Production:** Docker containers
- **Deployment:** Docker Compose with multi-service architecture

### Database Hosting
- **Development:** SQLite local file
- **Production:** PostgreSQL container
- **Backups:** Automated daily snapshots

### Asset Storage
- **Local:** File system with organized directory structure
- **Production:** Local storage with potential S3 migration
- **Processing:** Pillow, OpenCV for image analysis

## Development Tools

### Testing Framework
- **Frontend:** Vitest + Playwright E2E
- **Backend:** pytest with comprehensive test coverage
- **Integration:** Custom test suites for API validation

### State Management
- **Frontend:** Zustand for global state
- **Backend:** Flask-Session with JWT authentication
- **Real-time:** WebSocket integration for progress tracking

### Background Processing
- **Task Queue:** Celery
- **Message Broker:** Redis
- **Async Processing:** Background analysis tasks

## Security & Authentication

### Authentication System
- **Method:** JWT with Flask-JWT-Extended
- **Password Hashing:** bcrypt
- **Session Management:** Stateless JWT tokens

### Rate Limiting
- **Implementation:** Flask-Limiter
- **API Protection:** Per-endpoint rate limiting
- **Security Headers:** Comprehensive CORS and security configurations

## Monitoring & Performance

### Application Monitoring
- **Metrics:** Prometheus integration
- **Dashboards:** Grafana with custom dashboards
- **Logging:** Structured logging with rotating files

### Performance Optimization
- **Caching:** Redis for API response caching
- **Database:** Connection pooling and query optimization
- **Frontend:** Lazy loading and code splitting

## Deployment

### CI/CD Pipeline
- **Platform:** Docker-based deployment
- **Environments:** Development, staging, production
- **Testing:** Automated test suites before deployment

### Container Architecture
- **Frontend:** Nginx + React build
- **Backend:** Flask + Gunicorn WSGI server
- **Database:** PostgreSQL container
- **Cache:** Redis container
- **Monitoring:** Prometheus + Grafana stack

### Environment Configuration
- **Development:** Docker Compose with local services
- **Production:** Multi-container deployment with environment variables
- **Secrets Management:** Environment-based configuration