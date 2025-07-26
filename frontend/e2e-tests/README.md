# BP Brand Audit - Playwright Test Suite

## Overview

This comprehensive test suite validates the UX journey for BP (British Petroleum) brand audits using Playwright. The tests cover the complete workflow from brand search through report generation, ensuring professional-quality results and optimal user experience.

## 🏗️ Architecture

### Test Structure

```
e2e-tests/
├── bp-brand-audit.spec.js           # Original comprehensive BP test
├── bp-brand-audit-optimized.spec.js # Optimized test using page objects
├── page-objects/                    # Page Object Models
│   ├── LandingPage.js              # Landing page interactions
│   ├── AnalysisProgressPage.js     # Progress monitoring
│   └── ResultsPage.js              # Results validation
├── utils/                          # Test utilities
│   └── TestHelpers.js              # Helper functions and utilities
├── run-bp-tests.js                 # CLI test runner
└── README.md                       # This file
```

### Page Object Models

- **LandingPage**: Handles brand search input and analysis initiation
- **AnalysisProgressPage**: Monitors analysis progress and WebSocket updates
- **ResultsPage**: Validates report sections, visual elements, and data quality

### Test Utilities

- **ScreenshotHelper**: Automated screenshot capture
- **WaitHelper**: Smart waiting and retry logic
- **APIHelper**: Backend API validation
- **ValidationHelper**: Data structure validation
- **PerformanceHelper**: Performance measurement
- **AccessibilityHelper**: Accessibility testing
- **ErrorHelper**: Error handling validation

## 🚀 Quick Start

### Prerequisites

1. Ensure frontend and backend are running:
   ```bash
   # Terminal 1: Frontend
   cd frontend
   pnpm run dev
   
   # Terminal 2: Backend
   cd backend
   python app.py
   ```

2. Install Playwright browsers (if not already done):
   ```bash
   npx playwright install
   ```

### Running Tests

#### Using npm scripts (recommended):

```bash
# Run optimized BP test suite
npm run test:bp

# Run basic BP test
npm run test:bp:basic

# Run mobile-specific tests
npm run test:bp:mobile

# Quick smoke test
npm run test:bp:quick

# Debug mode (visible browser)
npm run test:bp:debug

# All BP tests with HTML report
npm run test:bp:all
```

#### Using the CLI runner directly:

```bash
# Basic usage
node e2e-tests/run-bp-tests.js bp-optimized

# With options
node e2e-tests/run-bp-tests.js bp-optimized --headed --debug --timeout 600000

# Mobile testing
node e2e-tests/run-bp-tests.js bp-optimized --mobile --record

# Quick test
node e2e-tests/run-bp-tests.js --quick --report
```

#### Using Playwright directly:

```bash
# Run specific test file
npx playwright test e2e-tests/bp-brand-audit.spec.js

# Run with specific browser
npx playwright test e2e-tests/bp-brand-audit-optimized.spec.js --project=chromium

# Generate HTML report
npx playwright test e2e-tests/bp-*.spec.js --reporter=html
```

## 📋 Test Scenarios

### 1. Complete Brand Audit Journey (`bp-brand-audit.spec.js`)

**Duration**: 5-8 minutes  
**Coverage**: Full 5-step workflow

- ✅ Landing page interaction
- ✅ Analysis configuration (if available)
- ✅ File upload handling (if available)
- ✅ Progress monitoring with WebSocket
- ✅ Results validation and quality checks
- ✅ BP-specific content verification
- ✅ API data validation
- ✅ Export functionality testing

### 2. Optimized Test Suite (`bp-brand-audit-optimized.spec.js`)

**Duration**: 3-6 minutes per test  
**Coverage**: Multiple focused test scenarios

#### Test Cases:
- **Complete Journey**: Full workflow using page objects
- **Mobile Experience**: Mobile-specific UX validation
- **Error Handling**: Network errors and recovery
- **Performance Audit**: Load time and accessibility
- **Quality Validation**: Deep content analysis

### 3. Quality Validation Features

#### Report Sections Validated:
- Executive Summary (with content depth check)
- Strategic Context
- Visual Analysis
- Competitive Analysis
- Brand Health Score
- Recommendations

#### Visual Elements Checked:
- Color palette extraction
- Logo detection and display
- Charts and visualizations
- Metrics dashboard
- Interactive elements

#### BP-Specific Validations:
- Brand name mentions (expected: 10+ instances)
- Industry keywords: `energy`, `petroleum`, `sustainability`, `oil`, `gas`
- Competitor analysis: `Shell`, `ExxonMobil`, `Chevron`, `TotalEnergies`
- Brand colors: BP Green (`#00914B`), White, Black

## 🔧 Configuration

### Test Configuration (`utils/TestHelpers.js`)

```javascript
const TEST_CONFIG = {
  FRONTEND_URL: 'http://localhost:5175',
  BACKEND_URL: 'http://localhost:8081',
  DEFAULT_TIMEOUT: 30000,
  ANALYSIS_TIMEOUT: 300000, // 5 minutes
  
  BRANDS: {
    BP: {
      name: 'BP',
      website: 'bp.com',
      industry: 'Energy',
      colors: ['#00914B', '#FFFFFF', '#000000'],
      keywords: ['energy', 'petroleum', 'sustainability'],
      competitors: ['Shell', 'ExxonMobil', 'Chevron']
    }
  }
}
```

### Playwright Configuration (`playwright.config.js`)

- **Base URL**: `http://localhost:5175`
- **Timeout**: 5 minutes for analysis tests
- **Browsers**: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- **Output**: Screenshots, videos, traces on failure
- **Web Server**: Auto-starts frontend and backend

## 📊 Quality Thresholds

### Minimum Requirements for Passing Tests:

#### Content Quality:
- ✅ At least 3 report sections with meaningful content
- ✅ Executive summary with 50+ words
- ✅ At least 2 visual elements (charts, color palettes, etc.)
- ✅ Brand health score between 0-100
- ✅ 10+ data points (numbers, percentages, metrics)

#### BP-Specific Requirements:
- ✅ Brand name mentioned 1+ times
- ✅ At least 1 industry keyword found
- ✅ Visual analysis with captured assets
- ✅ Competitive analysis with competitor data

#### Performance Requirements:
- ✅ Page load under 10 seconds
- ✅ First paint under 3 seconds
- ✅ Analysis completion within 5 minutes

#### Accessibility Requirements:
- ✅ Proper input labels
- ✅ Keyboard navigation support
- ✅ Alt text for images
- ✅ Semantic heading structure

## 🐛 Debugging

### Common Issues:

#### 1. Analysis Timeout
```bash
# Increase timeout
node e2e-tests/run-bp-tests.js bp-optimized --timeout 600000

# Check backend logs
tail -f ../backend/backend.log
```

#### 2. Backend Connection Issues
```bash
# Verify backend health
curl http://localhost:8081/api/health

# Check if services are running
lsof -i :5175  # Frontend
lsof -i :8081  # Backend
```

#### 3. Test Failures
```bash
# Run in debug mode
npm run test:bp:debug

# Generate detailed report
npx playwright test e2e-tests/bp-*.spec.js --reporter=html
```

### Debug Screenshots

Tests automatically capture screenshots at key points:
- `test-results/bp-audit-01-landing.png` - Landing page
- `test-results/bp-audit-02-progress.png` - Analysis progress
- `test-results/bp-audit-03-results.png` - Final results
- `test-results/bp-audit-error.png` - Error states
- `test-results/bp-audit-timeout.png` - Timeout scenarios

### Logs and Monitoring

Tests provide detailed console output:
```
🏢 Starting BP Brand Audit - Complete UX Journey
📍 STEP 1: Landing Page Interaction
✅ Landing page verified
⚡ STEP 2: Analysis Progress Monitoring  
📊 Progress: 25% - Visual Analysis
📊 Progress: 50% - Competitive Research
📊 Progress: 75% - News Analysis
📊 Progress: 100% - Report Generation
📊 STEP 3: Results Validation
✅ Found section: Executive Summary
🎨 Visual elements found: 3/5
🏢 Brand mentions: 15
```

## 📈 Continuous Integration

### GitHub Actions Integration

```yaml
name: BP Brand Audit Tests
on: [push, pull_request]

jobs:
  bp-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: |
          cd frontend
          pnpm install
          npx playwright install
      - name: Start services
        run: |
          cd backend && python app.py &
          cd frontend && pnpm run dev &
          sleep 30
      - name: Run BP tests
        run: |
          cd frontend
          npm run test:bp:all
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: frontend/playwright-report/
```

## 🎯 Best Practices

### Test Development:
1. **Use Page Objects**: Maintain reusable, organized code
2. **Add Screenshots**: Capture key states for debugging
3. **Validate Data**: Don't just check UI, validate actual data
4. **Test Real Scenarios**: Use actual brand data (BP)
5. **Monitor Performance**: Track load times and responsiveness

### Test Execution:
1. **Run Locally First**: Ensure tests pass before CI
2. **Use Appropriate Timeouts**: Allow enough time for analysis
3. **Check Prerequisites**: Verify backend and frontend are running
4. **Review Screenshots**: Examine captured images for issues
5. **Monitor Logs**: Watch console output for insights

### Maintenance:
1. **Update Selectors**: Maintain selectors as UI changes
2. **Refresh Test Data**: Update BP expectations as needed
3. **Add New Scenarios**: Cover new features and edge cases
4. **Regular Health Checks**: Run tests periodically
5. **Document Changes**: Update README for modifications

## 📚 Resources

- [Playwright Documentation](https://playwright.dev/)
- [Page Object Model Pattern](https://playwright.dev/docs/pom)
- [BP Brand Guidelines](https://www.bp.com/en/global/corporate/who-we-are/our-brand.html)
- [Frontend Test Structure](../tests/README.md)
- [Backend API Documentation](../../backend/README.md)

## 🤝 Contributing

To add new BP test scenarios:

1. Create test in appropriate spec file
2. Use existing page objects when possible
3. Add utility functions to `TestHelpers.js` if needed
4. Update this README with new test documentation
5. Add npm script for easy execution

Example new test:
```javascript
test('BP Sustainability Focus Analysis', async ({ page }) => {
  const landingPage = new LandingPage(page)
  const resultsPage = new ResultsPage(page)
  
  await landingPage.goto()
  await landingPage.startBrandAnalysis('BP')
  
  // ... test implementation
  
  const sustainabilityKeywords = await resultsPage.validateBrandContent(
    'BP', 
    ['sustainability', 'renewable', 'green', 'carbon', 'environment']
  )
  
  expect(sustainabilityKeywords.foundKeywords.length).toBeGreaterThan(2)
})
```

---

**Last Updated**: July 25, 2025  
**Version**: 1.0.0  
**Maintainer**: Brand Audit Development Team