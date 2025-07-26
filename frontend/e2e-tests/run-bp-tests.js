#!/usr/bin/env node

/**
 * BP Brand Audit Test Runner
 * CLI utility to run BP brand audit tests with various options
 */

import { spawn } from 'child_process'
import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'

// Configuration
const TEST_CONFIG = {
  testDir: './e2e-tests',
  resultsDir: './test-results',
  playwrightConfig: './playwright.config.js',
  
  tests: {
    'bp-basic': './e2e-tests/bp-brand-audit.spec.js',
    'bp-optimized': './e2e-tests/bp-brand-audit-optimized.spec.js',
    'all-bp': './e2e-tests/bp-*.spec.js',
    'existing': './e2e-tests/end-to-end-data-flow.spec.js'
  },
  
  browsers: ['chromium', 'firefox', 'webkit'],
  devices: ['Desktop Chrome', 'iPhone 12', 'Pixel 5']
}

// CLI Colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`
}

function printHeader() {
  console.log(colorize('\n🏢 BP Brand Audit Test Runner', 'cyan'))
  console.log(colorize('================================', 'cyan'))
}

function printUsage() {
  console.log(colorize('\nUsage:', 'bright'))
  console.log('  node run-bp-tests.js [options] [test-suite]')
  
  console.log(colorize('\nTest Suites:', 'bright'))
  Object.entries(TEST_CONFIG.tests).forEach(([name, path]) => {
    console.log(`  ${colorize(name.padEnd(12), 'green')} - ${path}`)
  })
  
  console.log(colorize('\nOptions:', 'bright'))
  console.log(`  ${colorize('--browser', 'yellow')}      - Browser to use (${TEST_CONFIG.browsers.join(', ')})`)
  console.log(`  ${colorize('--headed', 'yellow')}       - Run in headed mode (visible browser)`)
  console.log(`  ${colorize('--debug', 'yellow')}        - Run with debug output`)
  console.log(`  ${colorize('--timeout', 'yellow')}      - Set test timeout (default: 300000ms)`)
  console.log(`  ${colorize('--workers', 'yellow')}      - Number of parallel workers (default: 1)`)
  console.log(`  ${colorize('--record', 'yellow')}       - Record test execution`)
  console.log(`  ${colorize('--mobile', 'yellow')}       - Run mobile tests only`)
  console.log(`  ${colorize('--quick', 'yellow')}        - Run quick smoke test`)
  console.log(`  ${colorize('--report', 'yellow')}       - Generate HTML report`)
  console.log(`  ${colorize('--help', 'yellow')}         - Show this help message`)
  
  console.log(colorize('\nExamples:', 'bright'))
  console.log('  node run-bp-tests.js bp-optimized --headed --debug')
  console.log('  node run-bp-tests.js all-bp --browser firefox --timeout 600000')
  console.log('  node run-bp-tests.js bp-basic --mobile --record')
  console.log('  node run-bp-tests.js --quick --report')
}

function parseArgs(args) {
  const options = {
    testSuite: 'bp-optimized',
    browser: 'chromium',
    headed: false,
    debug: false,
    timeout: 300000,
    workers: 1,
    record: false,
    mobile: false,
    quick: false,
    report: false,
    help: false
  }
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    
    switch (arg) {
      case '--help':
      case '-h':
        options.help = true
        break
      case '--browser':
        options.browser = args[++i]
        break
      case '--headed':
        options.headed = true
        break
      case '--debug':
        options.debug = true
        break
      case '--timeout':
        options.timeout = parseInt(args[++i])
        break
      case '--workers':
        options.workers = parseInt(args[++i])
        break
      case '--record':
        options.record = true
        break
      case '--mobile':
        options.mobile = true
        break
      case '--quick':
        options.quick = true
        break
      case '--report':
        options.report = true
        break
      default:
        if (!arg.startsWith('--') && TEST_CONFIG.tests[arg]) {
          options.testSuite = arg
        }
        break
    }
  }
  
  return options
}

function setupEnvironment() {
  // Ensure test results directory exists
  if (!existsSync(TEST_CONFIG.resultsDir)) {
    mkdirSync(TEST_CONFIG.resultsDir, { recursive: true })
    console.log(colorize('✅ Created test results directory', 'green'))
  }
  
  // Set environment variables
  process.env.PLAYWRIGHT_BROWSERS_PATH = process.env.PLAYWRIGHT_BROWSERS_PATH || '0'
  
  console.log(colorize('✅ Environment setup complete', 'green'))
}

function buildPlaywrightCommand(options) {
  const cmd = 'npx'
  const args = ['playwright', 'test']
  
  // Test file/pattern
  if (options.quick) {
    args.push('--grep', 'BP Complete Brand Audit Journey|BP Mobile Experience')
  } else {
    const testPath = TEST_CONFIG.tests[options.testSuite]
    if (testPath) {
      args.push(testPath)
    }
  }
  
  // Browser selection
  if (options.mobile) {
    args.push('--project', 'Mobile Chrome')
  } else {
    args.push('--project', options.browser)
  }
  
  // Execution options
  if (options.headed) {
    args.push('--headed')
  }
  
  if (options.debug) {
    args.push('--debug')
  }
  
  args.push('--timeout', options.timeout.toString())
  args.push('--workers', options.workers.toString())
  
  // Recording and reporting
  if (options.record) {
    args.push('--video', 'on')
    args.push('--screenshot', 'on')
  }
  
  if (options.report) {
    args.push('--reporter', 'html')
  }
  
  // Configuration
  args.push('--config', TEST_CONFIG.playwrightConfig)
  
  return { cmd, args }
}

function runTests(options) {
  return new Promise((resolve, reject) => {
    const { cmd, args } = buildPlaywrightCommand(options)
    
    console.log(colorize('\n🚀 Starting BP Brand Audit Tests', 'bright'))
    console.log(colorize(`Command: ${cmd} ${args.join(' ')}`, 'blue'))
    console.log(colorize(`Test Suite: ${options.testSuite}`, 'blue'))
    console.log(colorize(`Browser: ${options.browser}`, 'blue'))
    console.log(colorize(`Timeout: ${options.timeout}ms`, 'blue'))
    
    if (options.mobile) {
      console.log(colorize('📱 Running mobile tests', 'magenta'))
    }
    
    if (options.quick) {
      console.log(colorize('⚡ Quick test mode', 'yellow'))
    }
    
    console.log(colorize('\n' + '='.repeat(50), 'cyan'))
    
    const process = spawn(cmd, args, {
      stdio: 'inherit',
      shell: true
    })
    
    process.on('close', (code) => {
      console.log(colorize('\n' + '='.repeat(50), 'cyan'))
      
      if (code === 0) {
        console.log(colorize('✅ All tests passed!', 'green'))
        
        if (options.report) {
          console.log(colorize('📊 HTML report generated: playwright-report/index.html', 'blue'))
        }
        
        resolve(code)
      } else {
        console.log(colorize(`❌ Tests failed with exit code: ${code}`, 'red'))
        reject(new Error(`Tests failed with exit code: ${code}`))
      }
    })
    
    process.on('error', (error) => {
      console.log(colorize(`❌ Error running tests: ${error.message}`, 'red'))
      reject(error)
    })
  })
}

function checkPrerequisites() {
  console.log(colorize('🔍 Checking prerequisites...', 'blue'))
  
  // Check if we're in the right directory
  if (!existsSync('package.json')) {
    console.log(colorize('❌ package.json not found. Are you in the frontend directory?', 'red'))
    return false
  }
  
  // Check if Playwright config exists
  if (!existsSync(TEST_CONFIG.playwrightConfig)) {
    console.log(colorize(`❌ Playwright config not found: ${TEST_CONFIG.playwrightConfig}`, 'red'))
    return false
  }
  
  // Check if test files exist
  const testExists = Object.values(TEST_CONFIG.tests).some(testPath => 
    existsSync(testPath)
  )
  
  if (!testExists) {
    console.log(colorize('❌ No test files found in e2e-tests directory', 'red'))
    return false
  }
  
  console.log(colorize('✅ Prerequisites check passed', 'green'))
  return true
}

function showTestSummary(options) {
  console.log(colorize('\n📋 Test Summary', 'bright'))
  console.log(colorize('================', 'cyan'))
  console.log(`Test Suite: ${colorize(options.testSuite, 'green')}`)
  console.log(`Browser: ${colorize(options.browser, 'green')}`)
  console.log(`Mode: ${colorize(options.headed ? 'Headed' : 'Headless', 'green')}`)
  console.log(`Workers: ${colorize(options.workers, 'green')}`)
  console.log(`Timeout: ${colorize(`${options.timeout}ms`, 'green')}`)
  
  if (options.mobile) {
    console.log(`Device: ${colorize('Mobile', 'magenta')}`)
  }
  
  if (options.record) {
    console.log(`Recording: ${colorize('Enabled', 'yellow')}`)
  }
  
  if (options.debug) {
    console.log(`Debug: ${colorize('Enabled', 'yellow')}`)
  }
  
  console.log(colorize('\n⏱️ Estimated Duration: 3-8 minutes per test', 'blue'))
  console.log(colorize('📊 Results will be saved to: test-results/', 'blue'))
}

// Main execution
async function main() {
  const args = process.argv.slice(2)
  const options = parseArgs(args)
  
  printHeader()
  
  if (options.help || args.length === 0) {
    printUsage()
    return
  }
  
  if (!checkPrerequisites()) {
    process.exit(1)
  }
  
  showTestSummary(options)
  setupEnvironment()
  
  try {
    await runTests(options)
    
    console.log(colorize('\n🎉 BP Brand Audit Tests Completed Successfully!', 'green'))
    console.log(colorize('📁 Check test-results/ for screenshots and recordings', 'blue'))
    
    if (options.report) {
      console.log(colorize('🌐 Open playwright-report/index.html for detailed results', 'blue'))
    }
    
  } catch (error) {
    console.log(colorize(`\n💥 Tests failed: ${error.message}`, 'red'))
    process.exit(1)
  }
}

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', () => {
  console.log(colorize('\n\n⚠️ Tests interrupted by user', 'yellow'))
  process.exit(0)
})

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(colorize(`Fatal error: ${error.message}`, 'red'))
    process.exit(1)
  })
}

export { main, TEST_CONFIG }