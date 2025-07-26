/**
 * Environment Configuration and Validation
 * 
 * This module handles all environment variables and provides validation
 * to catch configuration issues early in development and deployment.
 */

// Environment variables with defaults and validation
const ENV_CONFIG = {
  // API Configuration
  API_BASE_URL: {
    key: 'VITE_API_BASE_URL',
    defaultValue: 'http://localhost:8000/api',
    required: true,
    validate: (value) => {
      try {
        new URL(value);
        return true;
      } catch {
        return 'Must be a valid URL';
      }
    }
  },
  
  API_TIMEOUT: {
    key: 'VITE_API_TIMEOUT',
    defaultValue: 30000,
    required: false,
    validate: (value) => {
      const num = parseInt(value);
      return num > 0 && num <= 300000 ? true : 'Must be between 1 and 300000 milliseconds';
    }
  },
  
  MAX_RETRY_ATTEMPTS: {
    key: 'VITE_MAX_RETRY_ATTEMPTS',
    defaultValue: 3,
    required: false,
    validate: (value) => {
      const num = parseInt(value);
      return num >= 0 && num <= 10 ? true : 'Must be between 0 and 10';
    }
  },
  
  // Application Configuration
  APP_ENV: {
    key: 'VITE_APP_ENV',
    defaultValue: 'development',
    required: false,
    validate: (value) => {
      const validEnvs = ['development', 'staging', 'production'];
      return validEnvs.includes(value) ? true : `Must be one of: ${validEnvs.join(', ')}`;
    }
  },
  
  APP_VERSION: {
    key: 'VITE_APP_VERSION',
    defaultValue: '1.0.0',
    required: false,
    validate: (value) => {
      const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/;
      return semverRegex.test(value) ? true : 'Must be a valid semantic version (e.g., 1.0.0)';
    }
  },
  
  APP_NAME: {
    key: 'VITE_APP_NAME',
    defaultValue: 'AI Brand Audit Tool',
    required: false,
    validate: (value) => {
      return value.length >= 1 && value.length <= 100 ? true : 'Must be between 1 and 100 characters';
    }
  },
  
  // Feature Flags
  ENABLE_ANALYTICS: {
    key: 'VITE_ENABLE_ANALYTICS',
    defaultValue: true,
    required: false,
    validate: (value) => {
      const boolValue = String(value).toLowerCase();
      return ['true', 'false'].includes(boolValue) ? true : 'Must be true or false';
    }
  },
  
  ENABLE_ERROR_REPORTING: {
    key: 'VITE_ENABLE_ERROR_REPORTING',
    defaultValue: true,
    required: false,
    validate: (value) => {
      const boolValue = String(value).toLowerCase();
      return ['true', 'false'].includes(boolValue) ? true : 'Must be true or false';
    }
  },
  
  ENABLE_PERFORMANCE_MONITORING: {
    key: 'VITE_ENABLE_PERFORMANCE_MONITORING',
    defaultValue: true,
    required: false,
    validate: (value) => {
      const boolValue = String(value).toLowerCase();
      return ['true', 'false'].includes(boolValue) ? true : 'Must be true or false';
    }
  },
  
  // External Services (optional)
  SENTRY_DSN: {
    key: 'VITE_SENTRY_DSN',
    defaultValue: '',
    required: false,
    validate: (value) => {
      if (!value) return true; // Optional
      try {
        new URL(value);
        return value.includes('sentry.io') || value.includes('sentry') ? true : 'Must be a valid Sentry DSN';
      } catch {
        return 'Must be a valid URL';
      }
    }
  },
  
  GA_TRACKING_ID: {
    key: 'VITE_GA_TRACKING_ID',
    defaultValue: '',
    required: false,
    validate: (value) => {
      if (!value) return true; // Optional
      const gaRegex = /^(G-[A-Z0-9]+|UA-\d+-\d+)$/;
      return gaRegex.test(value) ? true : 'Must be a valid Google Analytics tracking ID';
    }
  },
  
  // UI/UX Configuration
  DEFAULT_THEME: {
    key: 'VITE_DEFAULT_THEME',
    defaultValue: 'light',
    required: false,
    validate: (value) => {
      const validThemes = ['light', 'dark', 'system'];
      return validThemes.includes(value) ? true : `Must be one of: ${validThemes.join(', ')}`;
    }
  },
  
  TOAST_DURATION: {
    key: 'VITE_TOAST_DURATION',
    defaultValue: 5000,
    required: false,
    validate: (value) => {
      const num = parseInt(value);
      return num >= 1000 && num <= 30000 ? true : 'Must be between 1000 and 30000 milliseconds';
    }
  },
  
  // Performance Configuration
  MAX_FILE_SIZE: {
    key: 'VITE_MAX_FILE_SIZE',
    defaultValue: 16777216, // 16MB
    required: false,
    validate: (value) => {
      const num = parseInt(value);
      return num > 0 && num <= 104857600 ? true : 'Must be between 1 and 104857600 bytes (100MB)';
    }
  },
  
  // Debug Configuration
  DEBUG_LOGGING: {
    key: 'VITE_DEBUG_LOGGING',
    defaultValue: false,
    required: false,
    validate: (value) => {
      const boolValue = String(value).toLowerCase();
      return ['true', 'false'].includes(boolValue) ? true : 'Must be true or false';
    }
  },
  
  DEBUG_API_CALLS: {
    key: 'VITE_DEBUG_API_CALLS',
    defaultValue: false,
    required: false,
    validate: (value) => {
      const boolValue = String(value).toLowerCase();
      return ['true', 'false'].includes(boolValue) ? true : 'Must be true or false';
    }
  }
};

/**
 * Validates and parses environment variables
 */
class EnvironmentConfig {
  constructor() {
    this.config = {};
    this.errors = [];
    this.warnings = [];
    
    this.loadAndValidate();
  }
  
  loadAndValidate() {
    for (const [configKey, options] of Object.entries(ENV_CONFIG)) {
      const envValue = import.meta.env[options.key];
      let finalValue = envValue !== undefined ? envValue : options.defaultValue;
      
      // Convert string boolean values
      if (typeof options.defaultValue === 'boolean') {
        finalValue = String(finalValue).toLowerCase() === 'true';
      }
      
      // Convert string numbers
      if (typeof options.defaultValue === 'number' && typeof finalValue === 'string') {
        finalValue = parseInt(finalValue) || options.defaultValue;
      }
      
      // Validate required fields
      if (options.required && (finalValue === undefined || finalValue === '')) {
        this.errors.push(`${options.key} is required but not provided`);
        continue;
      }
      
      // Validate value if validator exists
      if (options.validate && finalValue !== undefined && finalValue !== '') {
        const validationResult = options.validate(finalValue);
        if (validationResult !== true) {
          this.errors.push(`${options.key}: ${validationResult}`);
          continue;
        }
      }
      
      // Warn about default values in production
      if (envValue === undefined && options.required === false && this.isProduction()) {
        this.warnings.push(`${options.key} is using default value in production: ${finalValue}`);
      }
      
      this.config[configKey] = finalValue;
    }
    
    // Log configuration status
    this.logConfigurationStatus();
  }
  
  logConfigurationStatus() {
    const isDev = this.isDevelopment();
    
    if (this.errors.length > 0) {
      console.error('❌ Environment Configuration Errors:');
      this.errors.forEach(error => console.error(`  - ${error}`));
      
      if (this.isProduction()) {
        throw new Error(`Environment configuration failed with ${this.errors.length} errors. Check console for details.`);
      }
    }
    
    if (this.warnings.length > 0 && isDev) {
      console.warn('⚠️ Environment Configuration Warnings:');
      this.warnings.forEach(warning => console.warn(`  - ${warning}`));
    }
    
    if (isDev && this.errors.length === 0) {
      console.log('✅ Environment configuration loaded successfully');
      console.log(`🌍 Environment: ${this.config.APP_ENV}`);
      console.log(`🔗 API Base URL: ${this.config.API_BASE_URL}`);
      console.log(`📱 App Name: ${this.config.APP_NAME}`);
      console.log(`📊 Analytics: ${this.config.ENABLE_ANALYTICS ? 'Enabled' : 'Disabled'}`);
    }
  }
  
  // Helper methods
  isDevelopment() {
    return this.config.APP_ENV === 'development' || import.meta.env.DEV;
  }
  
  isProduction() {
    return this.config.APP_ENV === 'production' || import.meta.env.PROD;
  }
  
  isStaging() {
    return this.config.APP_ENV === 'staging';
  }
  
  // Getters for configuration values
  get(key) {
    if (!this.config.hasOwnProperty(key)) {
      console.warn(`Configuration key '${key}' not found`);
      return undefined;
    }
    return this.config[key];
  }
  
  // Typed getters for common configurations
  getApiConfig() {
    return {
      baseURL: this.config.API_BASE_URL,
      timeout: this.config.API_TIMEOUT,
      maxRetryAttempts: this.config.MAX_RETRY_ATTEMPTS
    };
  }
  
  getAppConfig() {
    return {
      name: this.config.APP_NAME,
      version: this.config.APP_VERSION,
      environment: this.config.APP_ENV
    };
  }
  
  getFeatureFlags() {
    return {
      analytics: this.config.ENABLE_ANALYTICS,
      errorReporting: this.config.ENABLE_ERROR_REPORTING,
      performanceMonitoring: this.config.ENABLE_PERFORMANCE_MONITORING
    };
  }
  
  getDebugConfig() {
    return {
      logging: this.config.DEBUG_LOGGING,
      apiCalls: this.config.DEBUG_API_CALLS
    };
  }
  
  // Validation helpers
  hasValidConfiguration() {
    return this.errors.length === 0;
  }
  
  getConfigurationErrors() {
    return this.errors;
  }
  
  getConfigurationWarnings() {
    return this.warnings;
  }
}

// Create and export singleton instance
const envConfig = new EnvironmentConfig();

// Export both the instance and the class for testing
export default envConfig;
export { EnvironmentConfig };

// Helper function to get configuration values
export const getConfig = (key) => envConfig.get(key);

// Export typed configuration getters
export const getApiConfig = () => envConfig.getApiConfig();
export const getAppConfig = () => envConfig.getAppConfig();
export const getFeatureFlags = () => envConfig.getFeatureFlags();
export const getDebugConfig = () => envConfig.getDebugConfig();

// Export environment helpers
export const isDevelopment = () => envConfig.isDevelopment();
export const isProduction = () => envConfig.isProduction();
export const isStaging = () => envConfig.isStaging();