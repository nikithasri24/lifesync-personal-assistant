#!/usr/bin/env node

import { spawn, exec } from 'child_process';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

class ApiMonitor {
  constructor() {
    this.apiProcess = null;
    this.isRunning = false;
    this.restartCount = 0;
    this.maxRestarts = 10;
    this.healthCheckInterval = 15000; // 15 seconds
    this.restartDelay = 5000; // 5 seconds
    this.logFile = path.join(process.cwd(), 'api-monitor.log');
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    
    // Also write to log file
    fs.appendFileSync(this.logFile, logMessage + '\n');
  }

  async checkHealth() {
    try {
      const response = await fetch('http://10.247.209.223:3001/api/health', {
        timeout: 5000
      });
      
      if (response.ok) {
        const data = await response.json();
        return { healthy: true, data };
      } else {
        return { healthy: false, error: `HTTP ${response.status}` };
      }
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }

  async checkDatabase() {
    try {
      const response = await fetch('http://10.247.209.223:3001/api/tasks?limit=1', {
        timeout: 10000
      });
      
      if (response.ok) {
        await response.json();
        return { healthy: true };
      } else {
        return { healthy: false, error: `Database check failed: HTTP ${response.status}` };
      }
    } catch (error) {
      return { healthy: false, error: `Database check failed: ${error.message}` };
    }
  }

  startApi() {
    if (this.apiProcess) {
      this.log('🛑 Stopping existing API process...');
      this.apiProcess.kill('SIGTERM');
      this.apiProcess = null;
    }

    this.log('🚀 Starting API server...');
    
    // Start the API server
    this.apiProcess = spawn('node', ['start-with-db.js'], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        PORT: '3001'
      },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    this.apiProcess.stdout.on('data', (data) => {
      this.log(`API STDOUT: ${data.toString().trim()}`);
    });

    this.apiProcess.stderr.on('data', (data) => {
      this.log(`API STDERR: ${data.toString().trim()}`);
    });

    this.apiProcess.on('exit', (code, signal) => {
      this.log(`🔴 API process exited with code ${code}, signal ${signal}`);
      this.apiProcess = null;
      
      if (this.isRunning) {
        this.scheduleRestart();
      }
    });

    this.apiProcess.on('error', (error) => {
      this.log(`❌ API process error: ${error.message}`);
      this.apiProcess = null;
      
      if (this.isRunning) {
        this.scheduleRestart();
      }
    });
  }

  scheduleRestart() {
    if (this.restartCount >= this.maxRestarts) {
      this.log(`❌ Max restart attempts (${this.maxRestarts}) reached. Stopping monitor.`);
      this.stop();
      return;
    }

    this.restartCount++;
    this.log(`⏳ Scheduling restart attempt ${this.restartCount}/${this.maxRestarts} in ${this.restartDelay}ms...`);
    
    setTimeout(() => {
      if (this.isRunning) {
        this.startApi();
      }
    }, this.restartDelay);
  }

  async performHealthCheck() {
    if (!this.isRunning) return;

    // Check if process is still running
    if (!this.apiProcess || this.apiProcess.killed) {
      this.log('⚠️ API process not running, attempting restart...');
      this.scheduleRestart();
      return;
    }

    // Check API health endpoint
    const healthStatus = await this.checkHealth();
    
    if (!healthStatus.healthy) {
      this.log(`❌ API health check failed: ${healthStatus.error}`);
      this.scheduleRestart();
      return;
    }

    // Check database connectivity
    const dbStatus = await this.checkDatabase();
    
    if (!dbStatus.healthy) {
      this.log(`❌ Database connectivity check failed: ${dbStatus.error}`);
      this.scheduleRestart();
      return;
    }

    // Reset restart count on successful health check
    if (this.restartCount > 0) {
      this.log('✅ API fully recovered, resetting restart counter');
      this.restartCount = 0;
    }

    this.log('✅ API health check passed');
  }

  start() {
    this.log('🎯 Starting API Monitor...');
    this.isRunning = true;
    this.restartCount = 0;
    
    // Start the API server
    this.startApi();
    
    // Set up periodic health checks
    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.healthCheckInterval);

    // Initial health check after a short delay
    setTimeout(() => {
      this.performHealthCheck();
    }, 10000);

    this.log(`🔄 Health checks scheduled every ${this.healthCheckInterval}ms`);
  }

  stop() {
    this.log('🛑 Stopping API Monitor...');
    this.isRunning = false;
    
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
    
    if (this.apiProcess) {
      this.apiProcess.kill('SIGTERM');
      this.apiProcess = null;
    }
    
    this.log('✅ API Monitor stopped');
  }

  // Graceful shutdown on process signals
  setupSignalHandlers() {
    process.on('SIGTERM', () => {
      this.log('📨 Received SIGTERM, shutting down gracefully...');
      this.stop();
      process.exit(0);
    });

    process.on('SIGINT', () => {
      this.log('📨 Received SIGINT, shutting down gracefully...');
      this.stop();
      process.exit(0);
    });

    process.on('uncaughtException', (error) => {
      this.log(`💥 Uncaught exception: ${error.message}`);
      this.log(error.stack);
      this.stop();
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.log(`💥 Unhandled rejection at: ${promise}, reason: ${reason}`);
      this.stop();
      process.exit(1);
    });
  }
}

// Start the monitor
const monitor = new ApiMonitor();
monitor.setupSignalHandlers();
monitor.start();

export default ApiMonitor;