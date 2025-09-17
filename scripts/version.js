#!/usr/bin/env node

/**
 * Local Version Management Script
 * 
 * This script provides local version tracking and management capabilities:
 * - Display current version info
 * - Bump version locally
 * - Generate version tracking files
 * - Show version history
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorize(text, color) {
  return `${colors[color] || ''}${text}${colors.reset}`;
}

function getPackageInfo() {
  const packagePath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packagePath)) {
    throw new Error('package.json not found in current directory');
  }
  return JSON.parse(fs.readFileSync(packagePath, 'utf8'));
}

function getGitInfo() {
  try {
    const sha = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    const shortSha = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    const lastTag = execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim();
    const commitsSinceTag = execSync(`git rev-list ${lastTag}..HEAD --count`, { encoding: 'utf8' }).trim();
    return { sha, shortSha, branch, lastTag, commitsSinceTag };
  } catch (error) {
    return { sha: 'unknown', shortSha: 'unknown', branch: 'unknown', lastTag: 'none', commitsSinceTag: '0' };
  }
}

function generateVersionFile() {
  const pkg = getPackageInfo();
  const git = getGitInfo();
  const buildDate = new Date().toISOString();
  
  const versionContent = `// Auto-generated version file
// This file is automatically updated by the version management system

export const VERSION = '${pkg.version}';
export const BUILD_DATE = '${buildDate}';
export const COMMIT_SHA = '${git.sha}';
export const COMMIT_SHORT_SHA = '${git.shortSha}';
export const BRANCH = '${git.branch}';
export const LAST_TAG = '${git.lastTag}';
export const COMMITS_SINCE_TAG = ${git.commitsSinceTag};

export const VERSION_INFO = {
  version: VERSION,
  buildDate: BUILD_DATE,
  commit: {
    sha: COMMIT_SHA,
    shortSha: COMMIT_SHORT_SHA,
    branch: BRANCH
  },
  release: {
    lastTag: LAST_TAG,
    commitsSinceTag: COMMITS_SINCE_TAG
  }
} as const;

// Helper function to get full version string
export function getFullVersion(): string {
  const base = VERSION;
  const commits = COMMITS_SINCE_TAG > 0 ? \`+\${COMMITS_SINCE_TAG}\` : '';
  const sha = \`(\${COMMIT_SHORT_SHA})\`;
  const branch = BRANCH !== 'main' ? \`[\${BRANCH}]\` : '';
  
  return \`\${base}\${commits}\${sha}\${branch}\`;
}

// Helper function to check if this is a development build
export function isDevelopmentBuild(): boolean {
  return COMMITS_SINCE_TAG > 0 || BRANCH !== 'main';
}
`;

  const versionPath = path.join(process.cwd(), 'src', 'version.ts');
  fs.writeFileSync(versionPath, versionContent);
  
  return versionPath;
}

function showVersionInfo() {
  const pkg = getPackageInfo();
  const git = getGitInfo();
  
  console.log(colorize('📦 LifeSync Version Information', 'cyan'));
  console.log('================================');
  console.log(`${colorize('Version:', 'yellow')} ${colorize(pkg.version, 'green')}`);
  console.log(`${colorize('Name:', 'yellow')} ${pkg.name}`);
  console.log(`${colorize('Description:', 'yellow')} ${pkg.description || 'No description'}`);
  console.log();
  
  console.log(colorize('🔀 Git Information', 'cyan'));
  console.log('==================');
  console.log(`${colorize('Branch:', 'yellow')} ${colorize(git.branch, 'green')}`);
  console.log(`${colorize('Commit:', 'yellow')} ${git.shortSha} (${git.sha})`);
  console.log(`${colorize('Last Tag:', 'yellow')} ${git.lastTag}`);
  console.log(`${colorize('Commits since tag:', 'yellow')} ${git.commitsSinceTag}`);
  console.log();
  
  const isDev = git.commitsSinceTag > 0 || git.branch !== 'main';
  console.log(colorize('🏷️  Build Information', 'cyan'));
  console.log('====================');
  console.log(`${colorize('Type:', 'yellow')} ${isDev ? colorize('Development', 'yellow') : colorize('Release', 'green')}`);
  console.log(`${colorize('Build Date:', 'yellow')} ${new Date().toISOString()}`);
  
  // Full version string
  const base = pkg.version;
  const commits = git.commitsSinceTag > 0 ? `+${git.commitsSinceTag}` : '';
  const sha = `(${git.shortSha})`;
  const branch = git.branch !== 'main' ? `[${git.branch}]` : '';
  const fullVersion = `${base}${commits}${sha}${branch}`;
  
  console.log(`${colorize('Full Version:', 'yellow')} ${colorize(fullVersion, 'magenta')}`);
}

function bumpVersion(type = 'patch') {
  const validTypes = ['major', 'minor', 'patch', 'prerelease'];
  
  if (!validTypes.includes(type)) {
    throw new Error(`Invalid version type. Must be one of: ${validTypes.join(', ')}`);
  }
  
  console.log(colorize(`🚀 Bumping ${type} version...`, 'cyan'));
  
  try {
    execSync(`npm version ${type} --no-git-tag-version`, { stdio: 'inherit' });
    
    const pkg = getPackageInfo();
    console.log(colorize(`✅ Version bumped to ${pkg.version}`, 'green'));
    
    // Generate updated version file
    const versionFile = generateVersionFile();
    console.log(colorize(`📝 Updated version file: ${versionFile}`, 'blue'));
    
    return pkg.version;
  } catch (error) {
    throw new Error(`Failed to bump version: ${error.message}`);
  }
}

function showVersionHistory() {
  console.log(colorize('📜 Version History', 'cyan'));
  console.log('=================');
  
  try {
    const gitLog = execSync('git tag --sort=-version:refname', { encoding: 'utf8' }).trim();
    const tags = gitLog.split('\n').filter(Boolean).slice(0, 10);
    
    if (tags.length === 0) {
      console.log(colorize('No version tags found', 'yellow'));
      return;
    }
    
    for (const tag of tags) {
      try {
        const date = execSync(`git log -1 --format=%ai ${tag}`, { encoding: 'utf8' }).trim();
        const message = execSync(`git tag -l --format='%(contents:subject)' ${tag}`, { encoding: 'utf8' }).trim();
        
        console.log(`${colorize(tag, 'green')} - ${date.split(' ')[0]}`);
        if (message) {
          console.log(`  ${colorize(message, 'blue')}`);
        }
      } catch (e) {
        console.log(`${colorize(tag, 'green')} - Date unknown`);
      }
    }
  } catch (error) {
    console.log(colorize('No git history available', 'yellow'));
  }
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  try {
    switch (command) {
      case 'info':
      case undefined:
        showVersionInfo();
        break;
        
      case 'bump':
        const type = args[1] || 'patch';
        bumpVersion(type);
        break;
        
      case 'generate':
        const file = generateVersionFile();
        console.log(colorize(`✅ Generated version file: ${file}`, 'green'));
        break;
        
      case 'history':
        showVersionHistory();
        break;
        
      case 'help':
        console.log(colorize('📖 Version Management Commands', 'cyan'));
        console.log('==============================');
        console.log(`${colorize('node scripts/version.js', 'green')} or ${colorize('npm run version', 'green')}`);
        console.log('  Show current version information');
        console.log();
        console.log(`${colorize('node scripts/version.js bump [major|minor|patch]', 'green')}`);
        console.log('  Bump version locally (default: patch)');
        console.log();
        console.log(`${colorize('node scripts/version.js generate', 'green')}`);
        console.log('  Generate version.ts file');
        console.log();
        console.log(`${colorize('node scripts/version.js history', 'green')}`);
        console.log('  Show version history from git tags');
        console.log();
        console.log(`${colorize('node scripts/version.js help', 'green')}`);
        console.log('  Show this help message');
        break;
        
      default:
        console.error(colorize(`❌ Unknown command: ${command}`, 'red'));
        console.log(colorize('Run "node scripts/version.js help" for available commands', 'yellow'));
        process.exit(1);
    }
  } catch (error) {
    console.error(colorize(`❌ Error: ${error.message}`, 'red'));
    process.exit(1);
  }
}

// Run main function if this is the entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  getPackageInfo,
  getGitInfo,
  generateVersionFile,
  showVersionInfo,
  bumpVersion,
  showVersionHistory
};