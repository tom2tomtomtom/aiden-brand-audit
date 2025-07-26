#!/usr/bin/env python3
"""
AI Brand Audit Tool - Production Health Check
Validates deployment readiness and system health
"""

import os
import sys
import requests
import json
from datetime import datetime

def check_environment_variables():
    """Check all required environment variables are set"""
    print("🔍 Checking Environment Variables...")
    
    required_vars = [
        'SECRET_KEY',
        'JWT_SECRET_KEY',
        'OPENROUTER_API_KEY',
        'NEWS_API_KEY',
        'BRANDFETCH_API_KEY'
    ]
    
    optional_vars = [
        'OPENCORPORATES_API_KEY',
        'DATABASE_URL',
        'FLASK_ENV'
    ]
    
    results = {}
    for var in required_vars:
        value = os.getenv(var)
        results[var] = bool(value)
        status = "✅ Set" if value else "❌ Missing"
        print(f"  {var}: {status}")
    
    for var in optional_vars:
        value = os.getenv(var)
        results[var] = bool(value)
        status = "✅ Set" if value else "⚠️ Optional"
        print(f"  {var}: {status}")
    
    return results

def check_backend_health(base_url="http://localhost:8000"):
    """Check backend API health"""
    print(f"🏥 Checking Backend Health ({base_url})...")
    
    try:
        response = requests.get(f"{base_url}/api/health", timeout=10)
        if response.status_code == 200:
            health_data = response.json()
            print("  ✅ Backend health check passed")
            print(f"  📊 Status: {health_data.get('status', 'unknown')}")
            print(f"  🔧 Version: {health_data.get('version', 'unknown')}")
            
            # Check API connectivity if available
            system_health = health_data.get('system_health', {})
            if system_health:
                api_health = system_health.get('api_health', {})
                healthy_apis = system_health.get('healthy_apis', 0)
                total_apis = system_health.get('total_apis', 0)
                print(f"  🔌 API Connectivity: {healthy_apis}/{total_apis} healthy")
            
            return True
        else:
            print(f"  ❌ Backend health check failed: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"  ❌ Backend connection failed: {e}")
        return False

def check_frontend_build():
    """Check if frontend build exists"""
    print("🎨 Checking Frontend Build...")
    
    build_path = "frontend/dist"
    if os.path.exists(build_path):
        files = os.listdir(build_path)
        if "index.html" in files:
            print("  ✅ Frontend build exists")
            
            # Check build size
            total_size = 0
            for root, dirs, files in os.walk(build_path):
                for file in files:
                    file_path = os.path.join(root, file)
                    total_size += os.path.getsize(file_path)
            
            size_mb = total_size / (1024 * 1024)
            print(f"  📦 Build size: {size_mb:.1f} MB")
            
            return True
        else:
            print("  ❌ Frontend build incomplete (no index.html)")
            return False
    else:
        print("  ❌ Frontend build does not exist")
        return False

def check_docker_files():
    """Check if Docker files exist"""
    print("🐳 Checking Docker Configuration...")
    
    docker_files = [
        "docker-compose.production.yml",
        "frontend/Dockerfile.production", 
        "backend/Dockerfile.production",
        "backend/entrypoint.sh"
    ]
    
    all_exist = True
    for file_path in docker_files:
        if os.path.exists(file_path):
            print(f"  ✅ {file_path}")
        else:
            print(f"  ❌ {file_path} missing")
            all_exist = False
    
    return all_exist

def check_security():
    """Check security configuration"""
    print("🔒 Checking Security Configuration...")
    
    security_checks = []
    
    # Check secret keys are not default values
    secret_key = os.getenv('SECRET_KEY', '')
    if 'dev' in secret_key.lower() or 'test' in secret_key.lower():
        print("  ⚠️ SECRET_KEY appears to be a development key")
        security_checks.append(False)
    else:
        print("  ✅ SECRET_KEY appears secure")
        security_checks.append(True)
    
    # Check Flask environment
    flask_env = os.getenv('FLASK_ENV', 'development')
    if flask_env == 'production':
        print("  ✅ FLASK_ENV set to production")
        security_checks.append(True)
    else:
        print(f"  ⚠️ FLASK_ENV is '{flask_env}', should be 'production'")
        security_checks.append(False)
    
    # Check DEBUG setting
    debug = os.getenv('DEBUG', 'false').lower()
    if debug == 'false':
        print("  ✅ DEBUG disabled")
        security_checks.append(True)
    else:
        print("  ⚠️ DEBUG is enabled in production")
        security_checks.append(False)
    
    return all(security_checks)

def generate_deployment_report():
    """Generate comprehensive deployment readiness report"""
    print("\n" + "="*60)
    print("🚀 AI Brand Audit Tool - Production Deployment Report")
    print("="*60)
    print(f"📅 Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Run all checks
    env_results = check_environment_variables()
    print()
    
    frontend_ok = check_frontend_build()
    print()
    
    docker_ok = check_docker_files()
    print()
    
    security_ok = check_security()
    print()
    
    backend_ok = check_backend_health()
    print()
    
    # Calculate overall score
    checks = [
        all(env_results.values()),
        frontend_ok,
        docker_ok,
        security_ok,
        backend_ok
    ]
    
    passed_checks = sum(checks)
    total_checks = len(checks)
    score = (passed_checks / total_checks) * 100
    
    print("="*60)
    print("📊 DEPLOYMENT READINESS SUMMARY")
    print("="*60)
    print(f"✅ Passed Checks: {passed_checks}/{total_checks}")
    print(f"📈 Readiness Score: {score:.0f}%")
    
    if score >= 90:
        print("🎉 Status: READY FOR DEPLOYMENT")
        recommendation = "GO"
    elif score >= 70:
        print("⚠️ Status: CONDITIONAL DEPLOYMENT")
        recommendation = "GO WITH CONDITIONS"
    else:
        print("❌ Status: NOT READY FOR DEPLOYMENT")
        recommendation = "NO-GO"
    
    print(f"🎯 Recommendation: {recommendation}")
    
    if score < 100:
        print("\n🔧 Issues to Address:")
        if not all(env_results.values()):
            print("  - Configure missing environment variables")
        if not frontend_ok:
            print("  - Build frontend production assets")
        if not docker_ok:
            print("  - Complete Docker configuration")
        if not security_ok:
            print("  - Fix security configuration issues")
        if not backend_ok:
            print("  - Resolve backend health check issues")
    
    print("\n" + "="*60)
    
    return score >= 70

if __name__ == "__main__":
    try:
        is_ready = generate_deployment_report()
        sys.exit(0 if is_ready else 1)
    except KeyboardInterrupt:
        print("\n⚠️ Health check interrupted")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Health check failed: {e}")
        sys.exit(1)