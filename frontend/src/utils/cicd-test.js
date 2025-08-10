/**
 * CI/CD Pipeline Test Utilities
 * Simple utility functions to validate CI/CD pipeline functionality
 */

/**
 * Validates that the application is ready for deployment
 * @param {Object} appConfig - Application configuration
 * @returns {boolean} True if ready for deployment
 */
export const isReadyForDeployment = (appConfig = {}) => {
  const requiredFields = ['apiUrl', 'version'];
  
  return requiredFields.every(field => {
    const hasField = field in appConfig && appConfig[field];
    if (!hasField) {
      console.warn(`Missing required field: ${field}`);
    }
    return hasField;
  });
};

/**
 * Performs basic health checks
 * @returns {Object} Health check results
 */
export const performHealthCheck = () => {
  const startTime = performance.now();
  
  const checks = {
    timestamp: new Date().toISOString(),
    environment: import.meta.env.MODE || 'development',
    nodeEnv: typeof window !== 'undefined' ? 'browser' : 'node',
    performanceSupported: typeof performance !== 'undefined',
  };
  
  const endTime = performance.now();
  checks.executionTime = endTime - startTime;
  checks.healthy = checks.executionTime < 100; // Should complete in under 100ms
  
  return checks;
};

/**
 * Validates environment configuration
 * @returns {Object} Environment validation results
 */
export const validateEnvironment = () => {
  const env = import.meta.env || {};
  
  return {
    hasApiUrl: !!env.VITE_API_BASE_URL,
    hasAppName: !!env.VITE_APP_NAME,
    mode: env.MODE || 'development',
    isDevelopment: env.MODE === 'development',
    isProduction: env.MODE === 'production',
    isTest: env.MODE === 'test',
  };
};

/**
 * Gets CI/CD pipeline metadata
 * @returns {Object} Pipeline metadata
 */
export const getPipelineMetadata = () => {
  return {
    version: '1.0.0',
    buildDate: new Date().toISOString(),
    testFramework: 'vitest',
    bundler: 'vite',
    cicdImplemented: true,
  };
};