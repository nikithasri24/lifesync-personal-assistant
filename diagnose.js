#!/usr/bin/env node

import { spawn, exec } from 'child_process';
import fs from 'fs';
import fetch from 'node-fetch';

class LifeSyncDiagnostics {
  constructor() {
    this.logFile = 'troubleshooting.log';
    this.results = {
      api: { status: 'unknown', details: [] },
      database: { status: 'unknown', details: [] },
      ports: { status: 'unknown', details: [] },
      sync: { status: 'unknown', details: [] },
      network: { status: 'unknown', details: [] }
    };
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${level}: ${message}`;
    console.log(logEntry);
    fs.appendFileSync(this.logFile, logEntry + '\n');
  }

  async runCommand(command) {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          resolve({ success: false, error: error.message, stderr, stdout });
        } else {
          resolve({ success: true, stdout, stderr });
        }
      });
    });
  }

  async checkPorts() {
    this.log('🔍 Checking port availability...');
    
    const port3001 = await this.runCommand('lsof -ti:3001');
    const port5173 = await this.runCommand('lsof -ti:5173');

    if (port3001.success && port3001.stdout.trim()) {
      this.results.ports.details.push('✅ Port 3001: In use (API server running)');
      this.results.ports.apiRunning = true;
    } else {
      this.results.ports.details.push('❌ Port 3001: Available (API server not running)');
      this.results.ports.apiRunning = false;
    }

    if (port5173.success && port5173.stdout.trim()) {
      this.results.ports.details.push('⚠️  Port 5173: In use (Frontend may be running)');
    } else {
      this.results.ports.details.push('✅ Port 5173: Available');
    }

    this.results.ports.status = this.results.ports.apiRunning ? 'good' : 'needs_fix';
  }

  async checkApiConnectivity() {
    this.log('🔍 Checking API connectivity...');

    // Test localhost
    try {
      const response = await fetch('http://localhost:3001/api/health', { timeout: 5000 });
      if (response.ok) {
        const data = await response.json();
        this.results.api.details.push('✅ Localhost API: Connected');
        this.results.api.localhost = true;
        this.results.api.responseTime = Date.now();
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      this.results.api.details.push(`❌ Localhost API: ${error.message}`);
      this.results.api.localhost = false;
    }

    // Test external IP
    try {
      const response = await fetch('http://10.247.209.223:3001/api/health', { timeout: 5000 });
      if (response.ok) {
        this.results.api.details.push('✅ External IP API: Connected');
        this.results.api.external = true;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      this.results.api.details.push(`❌ External IP API: ${error.message}`);
      this.results.api.external = false;
    }

    this.results.api.status = this.results.api.localhost ? 'good' : 'needs_fix';
  }

  async checkDatabase() {
    this.log('🔍 Checking database connectivity...');

    if (!this.results.api.localhost) {
      this.results.database.details.push('❌ Cannot check database: API not accessible');
      this.results.database.status = 'needs_fix';
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/tasks', { timeout: 10000 });
      if (response.ok) {
        const tasks = await response.json();
        this.results.database.details.push(`✅ Database: Connected (${tasks.length} tasks found)`);
        this.results.database.status = 'good';
        this.results.database.taskCount = tasks.length;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      this.results.database.details.push(`❌ Database: ${error.message}`);
      this.results.database.status = 'needs_fix';
    }
  }

  async checkSync() {
    this.log('🔍 Checking synchronization configuration...');

    // Check if API clients are configured consistently
    const apiFile = 'src/services/api.ts';
    const clientFile = 'src/services/apiClient.ts';

    try {
      const apiContent = fs.readFileSync(apiFile, 'utf8');
      const clientContent = fs.readFileSync(clientFile, 'utf8');

      if (apiContent.includes('import.meta.env.VITE_API_BASE_URL') && 
          clientContent.includes('import.meta.env.VITE_API_BASE_URL')) {
        this.results.sync.details.push('✅ API clients: Using environment variables');
        this.results.sync.configConsistent = true;
      } else {
        this.results.sync.details.push('⚠️  API clients: Hardcoded URLs detected');
        this.results.sync.configConsistent = false;
      }

      // Check .env file
      if (fs.existsSync('.env')) {
        const envContent = fs.readFileSync('.env', 'utf8');
        if (envContent.includes('VITE_API_BASE_URL')) {
          this.results.sync.details.push('✅ Environment: API URL configured');
          this.results.sync.envConfigured = true;
        } else {
          this.results.sync.details.push('❌ Environment: API URL not configured');
          this.results.sync.envConfigured = false;
        }
      }

      this.results.sync.status = (this.results.sync.configConsistent && this.results.sync.envConfigured) ? 'good' : 'needs_fix';

    } catch (error) {
      this.results.sync.details.push(`❌ Configuration check failed: ${error.message}`);
      this.results.sync.status = 'needs_fix';
    }
  }

  async generateReport() {
    this.log('📊 Generating diagnostic report...');

    console.log('\n🔧 LifeSync System Diagnostics Report');
    console.log('=====================================\n');

    // Overall status
    const overallStatus = Object.values(this.results).every(r => r.status === 'good') ? '✅ HEALTHY' : '⚠️  NEEDS ATTENTION';
    console.log(`Overall Status: ${overallStatus}\n`);

    // Detailed results
    for (const [category, result] of Object.entries(this.results)) {
      const statusIcon = result.status === 'good' ? '✅' : result.status === 'needs_fix' ? '❌' : '⚠️';
      console.log(`${statusIcon} ${category.toUpperCase()}:`);
      result.details.forEach(detail => console.log(`  ${detail}`));
      console.log('');
    }

    // Recommendations
    console.log('🎯 Recommendations:');
    if (this.results.api.status !== 'good') {
      console.log('  • Run: npm run api:restart');
    }
    if (this.results.database.status !== 'good') {
      console.log('  • Run: npm run db:restart');
    }
    if (this.results.sync.status !== 'good') {
      console.log('  • Run: npm run fix:sync');
    }
    if (overallStatus.includes('HEALTHY')) {
      console.log('  • System is healthy! Use: npm run start:local');
    } else {
      console.log('  • Quick fix: npm run fix:all');
    }
    console.log('');
  }

  async runFullDiagnostics() {
    this.log('🚀 Starting full system diagnostics...');
    
    await this.checkPorts();
    await this.checkApiConnectivity();
    await this.checkDatabase();
    await this.checkSync();
    await this.generateReport();

    this.log('✅ Diagnostics completed');
  }
}

// Command line interface
const diagnostics = new LifeSyncDiagnostics();

const command = process.argv[2] || 'full';

switch (command) {
  case 'api':
    await diagnostics.checkApiConnectivity();
    break;
  case 'db':
    await diagnostics.checkDatabase();
    break;
  case 'sync':
    await diagnostics.checkSync();
    break;
  case 'ports':
    await diagnostics.checkPorts();
    break;
  case 'full':
  default:
    await diagnostics.runFullDiagnostics();
    break;
}

export default LifeSyncDiagnostics;