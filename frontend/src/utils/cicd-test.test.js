/**
 * CI/CD Pipeline Test Utilities - Test Suite
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  isReadyForDeployment, 
  performHealthCheck, 
  validateEnvironment, 
  getPipelineMetadata 
} from './cicd-test.js';

describe('CI/CD Test Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isReadyForDeployment', () => {
    it('returns true when all required fields are present', () => {
      const config = {
        apiUrl: 'https://api.example.com',
        version: '1.0.0'
      };
      
      expect(isReadyForDeployment(config)).toBe(true);
    });

    it('returns false when required fields are missing', () => {
      const config = {
        apiUrl: 'https://api.example.com'
        // version missing
      };
      
      expect(isReadyForDeployment(config)).toBe(false);
    });

    it('returns false when config is empty', () => {
      expect(isReadyForDeployment({})).toBe(false);
    });

    it('handles undefined config gracefully', () => {
      expect(isReadyForDeployment()).toBe(false);
    });
  });

  describe('performHealthCheck', () => {
    it('returns health check results with required fields', () => {
      const result = performHealthCheck();
      
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('environment');
      expect(result).toHaveProperty('nodeEnv');
      expect(result).toHaveProperty('performanceSupported');
      expect(result).toHaveProperty('executionTime');
      expect(result).toHaveProperty('healthy');
    });

    it('returns valid timestamp', () => {
      const result = performHealthCheck();
      const timestamp = new Date(result.timestamp);
      
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).not.toBeNaN();
    });

    it('measures execution time', () => {
      const result = performHealthCheck();
      
      expect(typeof result.executionTime).toBe('number');
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
    });

    it('determines health status based on execution time', () => {
      const result = performHealthCheck();
      
      if (result.executionTime < 100) {
        expect(result.healthy).toBe(true);
      } else {
        expect(result.healthy).toBe(false);
      }
    });
  });

  describe('validateEnvironment', () => {
    it('returns environment validation results', () => {
      const result = validateEnvironment();
      
      expect(result).toHaveProperty('hasApiUrl');
      expect(result).toHaveProperty('hasAppName');
      expect(result).toHaveProperty('mode');
      expect(result).toHaveProperty('isDevelopment');
      expect(result).toHaveProperty('isProduction');
      expect(result).toHaveProperty('isTest');
    });

    it('correctly identifies test environment', () => {
      const result = validateEnvironment();
      
      // In test environment, this should be true
      expect(result.isTest || result.isDevelopment).toBe(true);
      expect(result.isProduction).toBe(false);
    });

    it('returns boolean values for environment flags', () => {
      const result = validateEnvironment();
      
      expect(typeof result.hasApiUrl).toBe('boolean');
      expect(typeof result.hasAppName).toBe('boolean');
      expect(typeof result.isDevelopment).toBe('boolean');
      expect(typeof result.isProduction).toBe('boolean');
      expect(typeof result.isTest).toBe('boolean');
    });
  });

  describe('getPipelineMetadata', () => {
    it('returns pipeline metadata with required fields', () => {
      const metadata = getPipelineMetadata();
      
      expect(metadata).toHaveProperty('version');
      expect(metadata).toHaveProperty('buildDate');
      expect(metadata).toHaveProperty('testFramework');
      expect(metadata).toHaveProperty('bundler');
      expect(metadata).toHaveProperty('cicdImplemented');
    });

    it('returns correct static values', () => {
      const metadata = getPipelineMetadata();
      
      expect(metadata.version).toBe('1.0.0');
      expect(metadata.testFramework).toBe('vitest');
      expect(metadata.bundler).toBe('vite');
      expect(metadata.cicdImplemented).toBe(true);
    });

    it('returns valid build date', () => {
      const metadata = getPipelineMetadata();
      const buildDate = new Date(metadata.buildDate);
      
      expect(buildDate).toBeInstanceOf(Date);
      expect(buildDate.getTime()).not.toBeNaN();
    });

    it('build date should be recent (within last minute)', () => {
      const metadata = getPipelineMetadata();
      const buildDate = new Date(metadata.buildDate);
      const now = new Date();
      const timeDiff = now.getTime() - buildDate.getTime();
      
      // Should be within the last minute (60000ms)
      expect(timeDiff).toBeLessThan(60000);
      expect(timeDiff).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Integration Tests', () => {
    it('all utility functions work together', () => {
      const healthCheck = performHealthCheck();
      const envValidation = validateEnvironment();
      const metadata = getPipelineMetadata();
      const deploymentReady = isReadyForDeployment({
        apiUrl: 'http://localhost:5000',
        version: metadata.version
      });
      
      expect(healthCheck.healthy).toBeDefined();
      expect(envValidation.mode).toBeDefined();
      expect(metadata.cicdImplemented).toBe(true);
      expect(deploymentReady).toBe(true);
    });
  });
});