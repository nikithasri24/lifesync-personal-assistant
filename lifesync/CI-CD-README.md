# LifeSync CI/CD Documentation

## 🚀 Overview

This document describes the comprehensive CI/CD pipeline setup for the LifeSync project, including automated testing, quality gates, deployment, and version management.

## 📋 Pipeline Components

### 1. Continuous Integration (CI)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Manual workflow dispatch

**Stages:**
1. **Quality Checks** - Linting, type checking, unit tests
2. **Security Scan** - Vulnerability scanning, code analysis
3. **Build** - Application build for multiple environments
4. **E2E Tests** - End-to-end testing with Playwright
5. **Quality Gates** - Comprehensive quality validation

### 2. Continuous Deployment (CD)

**Environments:**
- **Staging** - Auto-deploy from `develop` branch
- **Production** - Auto-deploy from `main` branch (after approval)

**Deployment Targets:**
- Netlify (primary)
- Vercel (alternative)
- AWS S3 + CloudFront (enterprise)

## 🔧 Local Version Tracking

### Quick Commands

```bash
# Show version information
npm run version

# Bump version locally
npm run version:bump:patch    # 1.0.0 → 1.0.1
npm run version:bump:minor    # 1.0.0 → 1.1.0
npm run version:bump:major    # 1.0.0 → 2.0.0

# Generate version file
npm run version:generate

# Show version history
npm run version:history

# Prepare for release
npm run release:prepare
```

### Version Information Available

The version tracking system provides:
- **Current version** from package.json
- **Git commit** SHA and short SHA
- **Branch name** and last tag
- **Build date** and environment
- **Development build detection**

Example version output:
```
📦 LifeSync Version Information
================================
Version: 1.2.3
Name: lifesync
Description: Personal productivity suite

🔀 Git Information
==================
Branch: feature/new-dashboard
Commit: a1b2c3d (a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0)
Last Tag: v1.2.2
Commits since tag: 5

🏷️ Build Information
====================
Type: Development
Build Date: 2024-01-15T10:30:00Z
Full Version: 1.2.3+5(a1b2c3d)[feature/new-dashboard]
```

## 🛠️ Deployment

### Automated Deployment

**Staging:**
- Auto-deploys on push to `develop`
- Auto-deploys on PR creation
- Available at staging URL

**Production:**
- Auto-deploys on push to `main`
- Requires passing quality gates
- Manual approval for critical releases

### Manual Deployment

```bash
# Deploy to staging
./scripts/deploy.sh --env staging --target netlify

# Deploy to production
./scripts/deploy.sh --env production --target netlify

# Build only (no deployment)
./scripts/deploy.sh --build-only

# Skip tests (for hotfixes)
./scripts/deploy.sh --skip-tests --env production
```

### Deployment Options

**Netlify (Default):**
```bash
./scripts/deploy.sh --target netlify
```

**Vercel:**
```bash
./scripts/deploy.sh --target vercel
```

**AWS S3:**
```bash
./scripts/deploy.sh --target aws
```

**Local Preview:**
```bash
./scripts/deploy.sh --target local
```

## ✅ Quality Gates

### Code Quality Standards

| Check | Threshold | Action on Failure |
|-------|-----------|-------------------|
| ESLint | Zero errors | Block PR |
| TypeScript | Zero type errors | Block PR |
| Test Coverage | 70% global, 80% ProjectTracking | Block PR |
| Bundle Size | < 500KB gzipped | Warning |
| Performance | Lighthouse > 80 | Warning |
| Accessibility | Lighthouse > 90 | Block PR |
| Security | No high/critical vulns | Block PR |

### Test Requirements

**Unit Tests:**
- Minimum 70% coverage globally
- Minimum 80% coverage for ProjectTracking component
- All tests must pass

**Integration Tests:**
- E2E tests must pass
- ProjectTracking functionality tests must pass
- Cross-browser compatibility verified

**Performance Tests:**
- Lighthouse performance score > 80
- Bundle size under limits
- Core Web Vitals within thresholds

## 🔐 Security & Compliance

### Security Scanning

1. **Dependency Scanning** - npm audit
2. **Code Analysis** - CodeQL
3. **Container Scanning** - Snyk
4. **OWASP ZAP** - Web application security

### Compliance Checks

- **Accessibility** - WCAG 2.1 AA compliance
- **Performance** - Core Web Vitals
- **Security** - OWASP Top 10
- **Privacy** - Data handling audit

## 📊 Monitoring & Alerts

### Build Status

- GitHub status checks on PRs
- Slack/Teams notifications (configurable)
- Email alerts for failed deployments

### Performance Monitoring

- Lighthouse CI reports
- Bundle size tracking
- Core Web Vitals monitoring

### Error Tracking

- Sentry integration (configurable)
- Error rate monitoring
- Performance degradation alerts

## 🔄 Release Management

### Semantic Versioning

The project uses [Semantic Versioning](https://semver.org/) with conventional commits:

**Version Bumps:**
- `feat:` → Minor version bump
- `fix:` → Patch version bump
- `BREAKING CHANGE:` → Major version bump

**Commit Types:**
```
feat: ✨ New feature
fix: 🐛 Bug fix
docs: 📚 Documentation
style: 💎 Code style
refactor: ♻️ Code refactoring
perf: ⚡ Performance improvement
test: ✅ Tests
build: 🔨 Build system
ci: 👷 CI/CD
chore: 🔧 Maintenance
security: 🔒 Security fix
```

### Release Process

**Automatic (Recommended):**
1. Merge PR to `main`
2. Semantic Release analyzes commits
3. Generates changelog and version bump
4. Creates GitHub release
5. Triggers production deployment

**Manual:**
1. Run `npm run version:bump:minor`
2. Update changelog manually
3. Commit and push changes
4. Create GitHub release
5. Deploy manually

## 🚨 Troubleshooting

### Common Issues

**Build Failures:**
1. Check ESLint errors
2. Verify TypeScript compilation
3. Review test failures
4. Check dependency issues

**Deployment Failures:**
1. Verify environment variables
2. Check deployment target credentials
3. Review build artifacts
4. Validate configuration files

**Quality Gate Failures:**
1. Review coverage reports
2. Fix accessibility issues
3. Optimize bundle size
4. Address security vulnerabilities

### Debug Commands

```bash
# Run quality checks locally
npm run lint
npm run test:coverage
npm run test:project-tracking:coverage

# Build and test locally
npm run build
npm run preview

# Check version information
npm run version

# Validate deployment
./scripts/deploy.sh --build-only --verbose
```

## 📈 Metrics & KPIs

### Development Metrics

- **Build Success Rate** - Target: > 95%
- **Test Coverage** - Target: > 80%
- **Deployment Frequency** - Target: Daily
- **Lead Time** - Target: < 2 hours

### Quality Metrics

- **Bug Rate** - Target: < 1% of features
- **Performance Score** - Target: > 80
- **Accessibility Score** - Target: > 90
- **Security Vulnerabilities** - Target: 0 high/critical

## 🔧 Configuration Files

### Key Configuration Files

- `.github/workflows/ci-cd.yml` - Main CI/CD pipeline
- `.github/workflows/quality-gates.yml` - Quality validation
- `.github/workflows/release.yml` - Release management
- `.releaserc.json` - Semantic release configuration
- `.lighthouserc.json` - Performance audit configuration
- `.commitlintrc.json` - Commit message validation
- `scripts/deploy.sh` - Deployment automation
- `scripts/version.js` - Version management

### Environment Variables

**Required for CI/CD:**
```env
NETLIFY_AUTH_TOKEN
NETLIFY_SITE_ID_STAGING
NETLIFY_SITE_ID_PRODUCTION
GITHUB_TOKEN
```

**Optional:**
```env
CODECOV_TOKEN
SNYK_TOKEN
LHCI_GITHUB_APP_TOKEN
VERCEL_TOKEN
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
```

## 🎯 Best Practices

### Development Workflow

1. **Feature Development:**
   - Create feature branch from `develop`
   - Write tests first (TDD)
   - Follow conventional commit messages
   - Run tests locally before pushing

2. **Pull Request Process:**
   - Fill out PR template completely
   - Ensure all quality gates pass
   - Request appropriate reviewers
   - Update documentation if needed

3. **Release Process:**
   - Merge to `develop` for staging
   - Test thoroughly in staging
   - Merge to `main` for production
   - Monitor deployment and metrics

### Code Quality

1. **Write Comprehensive Tests:**
   - Unit tests for business logic
   - Integration tests for workflows
   - E2E tests for critical paths

2. **Follow Coding Standards:**
   - Use ESLint configuration
   - Follow TypeScript best practices
   - Maintain consistent code style

3. **Performance Optimization:**
   - Monitor bundle size
   - Optimize images and assets
   - Use lazy loading where appropriate

## 📞 Support & Contact

For issues with the CI/CD pipeline:

1. **Check GitHub Actions logs**
2. **Review quality gate reports**
3. **Consult this documentation**
4. **Create issue with [CI-CD] label**

---

**Remember:** The CI/CD pipeline is designed to catch issues early and ensure high-quality releases. Embrace the automation and let it help you deliver better software faster! 🚀