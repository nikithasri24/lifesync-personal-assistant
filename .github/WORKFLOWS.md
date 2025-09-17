# LifeSync GitHub Workflows Documentation

## Overview

This repository uses automated GitHub workflows to ensure code quality, prevent regressions, and monitor critical functionality. All workflows are designed to catch issues that previously caused the Focus API 404 errors.

## 🔄 Workflow Summary

### 1. **Regression Tests** (`regression-tests.yml`)
**Trigger:** Every push, PR, daily at 6 AM UTC  
**Duration:** ~5 minutes  
**Purpose:** Quick smoke tests to catch breaking changes

**What it tests:**
- ✅ All API endpoints respond with 200
- ✅ **Focus endpoints** (profile, achievements, analytics, sessions)
- ✅ Database connectivity
- ✅ Frontend accessibility
- ✅ Critical files exist

**Key protection:** Prevents Focus API endpoints from going missing again

### 2. **Full Test Suite** (`full-test-suite.yml`)
**Trigger:** Push to main, PRs to main, manual dispatch  
**Duration:** ~15-30 minutes  
**Purpose:** Comprehensive testing of all functionality

**What it tests:**
- ✅ Complete database schema setup
- ✅ CRUD operations (Create, Read, Update, Delete)
- ✅ All API endpoints with data validation
- ✅ TypeScript compilation
- ✅ Drag & drop dependencies
- ✅ Database integrity

**Advanced features:**
- Manual trigger with test level selection
- Comprehensive test reporting
- Performance validation

### 3. **Focus Endpoint Monitor** (`focus-endpoint-monitor.yml`)
**Trigger:** Changes to Focus files, every 6 hours, manual  
**Duration:** ~3-5 minutes  
**Purpose:** Dedicated monitoring of Focus functionality

**What it monitors:**
- ✅ All 4 Focus API endpoints specifically
- ✅ Response structure validation
- ✅ Performance testing (response times)
- ✅ Frontend integration verification
- ✅ Achievement system functionality

**Special alerts:** Immediately flags if Focus 404 errors return

### 4. **API Connectivity Check** (`api-connectivity-check.yml`)
**Trigger:** Env/config changes, every 2 hours, manual  
**Duration:** ~3-8 minutes  
**Purpose:** Prevent environment configuration issues

**What it checks:**
- ✅ Environment file precedence (.env vs .env.local)
- ✅ CORS configuration
- ✅ API response formats
- ✅ Database connectivity through API
- ✅ Frontend-to-API communication
- ✅ Common failure scenarios

**Critical protection:** Catches the exact .env.local override issue that caused original problems

## 🚨 Workflow Alerts

### When workflows fail:
1. **Regression Tests** → Basic functionality broken
2. **Full Test Suite** → Major system issues  
3. **Focus Monitor** → Focus functionality compromised
4. **Connectivity Check** → Environment/networking issues

### Common failure patterns:
- **Focus 404 errors returning** → Check Focus Monitor workflow
- **Environment conflicts** → Check Connectivity workflow  
- **Database issues** → Check Full Test Suite logs
- **Frontend build issues** → Check Regression Tests

## 📊 Monitoring Schedule

| Workflow | Frequency | Purpose |
|----------|-----------|---------|
| Regression Tests | Every push + Daily | Catch immediate issues |
| Full Test Suite | Major changes only | Comprehensive validation |
| Focus Monitor | Every 6 hours | Prevent Focus regressions |
| Connectivity Check | Every 2 hours | Early issue detection |

## 🔧 Manual Workflow Triggers

All workflows can be manually triggered via GitHub Actions UI:

1. Go to **Actions** tab in GitHub
2. Select desired workflow
3. Click **Run workflow**
4. Choose branch and options (if available)

### When to manually trigger:
- **Before major releases** → Run Full Test Suite
- **After environment changes** → Run Connectivity Check
- **Suspected Focus issues** → Run Focus Monitor
- **Quick validation** → Run Regression Tests

## 📈 Workflow Artifacts

Each workflow generates artifacts for debugging:

### Regression Tests:
- `regression-test-results` (7 days retention)
- Log files and test outputs

### Full Test Suite:
- `full-test-results` (30 days retention)
- Comprehensive test report
- Performance metrics

### Focus Monitor:
- `focus-monitoring-report` (90 days retention)
- Endpoint status history
- Performance trends

### Connectivity Check:
- `connectivity-report` (30 days retention)
- Environment diagnostics
- CORS validation results

## 🛡️ Protection Against Historical Issues

### Original Problem: Focus API 404 Errors
**Root Cause:** Missing `/api/focus/profile`, `/api/focus/achievements`, `/api/focus/analytics` endpoints

**Current Protection:**
1. **Focus Monitor** runs every 6 hours testing all 4 endpoints
2. **Regression Tests** check Focus endpoints on every commit
3. **Full Test Suite** validates Focus integration comprehensively
4. **Connectivity Check** ensures environment doesn't break API access

### Original Problem: Environment File Conflicts  
**Root Cause:** `.env.local` overriding `.env` with localhost URLs

**Current Protection:**
1. **Connectivity Check** specifically tests for .env.local overrides
2. **Regression Tests** validate API accessibility  
3. Alerts trigger when localhost detected in wrong context

## 🚀 Workflow Best Practices

### For Developers:
1. **Before pushing:** Ensure local regression tests pass
2. **Creating PRs:** Wait for workflow completion before merging
3. **Environment changes:** Always trigger Connectivity Check manually
4. **Focus modifications:** Monitor Focus-specific workflow results

### For Maintenance:
1. **Weekly:** Review workflow failure patterns
2. **Monthly:** Check artifact storage and cleanup
3. **Quarterly:** Update workflow dependency versions
4. **Annually:** Review and optimize workflow logic

## 🔍 Debugging Failed Workflows

### Step 1: Identify the failing workflow
- Check GitHub Actions tab for red X indicators
- Note which specific job/step failed

### Step 2: Download artifacts
- Click on failed workflow run
- Scroll down to "Artifacts" section
- Download relevant report/logs

### Step 3: Common failure resolutions
- **Database issues:** Check PostgreSQL service health
- **Timeout errors:** Increase timeout values in workflow
- **Environment issues:** Verify .env file contents
- **Dependency errors:** Update package versions

### Step 4: Local reproduction
- Use the same commands from failing workflow
- Run tests in identical environment
- Fix issues locally before re-triggering

## 📞 Emergency Procedures

### If All Workflows Start Failing:
1. Check GitHub Actions service status
2. Verify repository permissions
3. Review recent commits for breaking changes
4. Contact repository maintainers

### If Focus Endpoints Return:
1. Immediately check `start-with-db.js` for missing routes
2. Run local regression test: `./regression-test.sh`
3. Verify all 4 Focus endpoints manually
4. Check Focus Monitor workflow artifacts for history

### If Environment Issues Detected:
1. Run Connectivity Check workflow manually
2. Examine .env.local file for conflicts
3. Use health-check script: `./health-check.sh`
4. Restart development servers with correct environment

---

**Remember:** These workflows are your first line of defense against the exact issues that caused problems before. Pay attention to their results and act on failures quickly.