#!/usr/bin/env node

import { spawn, exec } from 'child_process';
import fs from 'fs';

class LifeSyncAutoFix {
  constructor() {
    this.logFile = 'troubleshooting.log';
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${level}: ${message}`;
    console.log(logEntry);
    fs.appendFileSync(this.logFile, logEntry + '\n');
  }

  async runCommand(command, description) {
    return new Promise((resolve, reject) => {
      this.log(`🔧 ${description}...`);
      exec(command, (error, stdout, stderr) => {
        if (error) {
          this.log(`❌ Failed: ${error.message}`, 'ERROR');
          resolve({ success: false, error: error.message, stderr, stdout });
        } else {
          this.log(`✅ ${description} completed`);
          resolve({ success: true, stdout, stderr });
        }
      });
    });
  }

  async cleanupPorts() {
    this.log('🧹 Cleaning up ports...');
    
    // Kill processes on common ports
    await this.runCommand('lsof -ti:3001 | xargs kill -9 2>/dev/null || true', 'Freeing port 3001');
    await this.runCommand('lsof -ti:5173 | xargs kill -9 2>/dev/null || true', 'Freeing port 5173');
    
    // Wait for cleanup
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  async fixConfiguration() {
    this.log('⚙️ Fixing configuration...');

    // Ensure .env.local exists and is set as default
    if (!fs.existsSync('.env.local')) {
      const envLocal = `# Local development configuration
VITE_API_BASE_URL=http://localhost:3001/api
REACT_APP_API_BASE_URL=http://localhost:3001/api

# Database Configuration
REACT_APP_DATABASE_URL=postgresql://postgres:lifesync123@localhost:5432/lifesync
REACT_APP_DB_HOST=localhost
REACT_APP_DB_PORT=5432
REACT_APP_DB_NAME=lifesync
REACT_APP_DB_USER=postgres
REACT_APP_DB_PASSWORD=lifesync123`;
      
      fs.writeFileSync('.env.local', envLocal);
      this.log('✅ Created .env.local');
    }

    // Copy .env.local to .env for safe defaults
    fs.copyFileSync('.env.local', '.env');
    this.log('✅ Updated .env with local configuration');

    // Fix API client configurations
    const apiFiles = [
      'src/services/api.ts',
      'src/services/apiClient.ts',
      'src/hooks/useApiFocus.ts'
    ];

    for (const file of apiFiles) {
      if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        
        // Replace hardcoded URLs with environment variables
        content = content.replace(
          /const API_BASE[_URL]* = ['"][^'"]*['"];?/g,
          "const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';"
        );
        
        fs.writeFileSync(file, content);
        this.log(`✅ Fixed ${file}`);
      }
    }

    // Fix useApiHealth hook
    const healthFile = 'src/hooks/useApiHealth.ts';
    if (fs.existsSync(healthFile)) {
      let content = fs.readFileSync(healthFile, 'utf8');
      
      // Ensure it uses environment variable
      if (!content.includes('import.meta.env.VITE_API_BASE_URL')) {
        content = content.replace(
          /const response = await fetch\(['"][^'"]*['"],/g,
          `const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
      const response = await fetch(\`\${apiUrl}/health\`,`
        );
        fs.writeFileSync(healthFile, content);
        this.log(`✅ Fixed ${healthFile}`);
      }
    }
  }

  async restartServices() {
    this.log('🔄 Restarting services...');

    // Start API monitor in background
    const apiProcess = spawn('./start-api-with-monitor.sh', [], {
      detached: true,
      stdio: 'ignore'
    });
    
    apiProcess.unref();
    this.log('✅ API server started with monitoring');

    // Wait for API to be ready
    this.log('⏳ Waiting for API to start...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Test API
    try {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch('http://localhost:3001/api/health', { timeout: 5000 });
      if (response.ok) {
        this.log('✅ API is responding');
        return true;
      }
    } catch (error) {
      this.log(`❌ API not responding: ${error.message}`, 'ERROR');
      return false;
    }
  }

  async fixAll() {
    this.log('🚀 Starting automated fix process...');

    try {
      await this.cleanupPorts();
      await this.fixConfiguration();
      const apiStarted = await this.restartServices();

      if (apiStarted) {
        this.log('🎉 All issues fixed! System is ready.');
        console.log('\n✅ System Fixed Successfully!');
        console.log('🎯 Next steps:');
        console.log('   npm run start:local    # Start with local configuration');
        console.log('   npm run diagnose:full  # Verify everything is working');
      } else {
        this.log('⚠️ Some issues remain. Check the logs.', 'WARN');
        console.log('\n⚠️ Partial Fix Completed');
        console.log('🔍 Run: npm run diagnose:full');
      }
    } catch (error) {
      this.log(`💥 Fix process failed: ${error.message}`, 'ERROR');
      console.log('\n❌ Auto-fix failed. Manual intervention required.');
      console.log('📖 Check: TROUBLESHOOTING.md');
    }
  }
}

// Command line interface
const autoFix = new LifeSyncAutoFix();

const command = process.argv[2] || 'all';

switch (command) {
  case 'ports':
    await autoFix.cleanupPorts();
    break;
  case 'config':
    await autoFix.fixConfiguration();
    break;
  case 'services':
    await autoFix.restartServices();
    break;
  case 'all':
  default:
    await autoFix.fixAll();
    break;
}

export default LifeSyncAutoFix;