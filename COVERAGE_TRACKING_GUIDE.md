# Coverage Tracking Guide

**Last Updated**: 2026-02-16
**Status**: ✅ Fully Configured

This guide explains how to use the test coverage tracking system for LifeSync.

---

## 📊 Quick Start

### **Run Tests with Coverage**
```bash
# Run tests with coverage report
npm run test:coverage

# Run coverage and generate badges
npm run coverage:full

# View coverage report in browser
npm run coverage:report

# Watch mode with coverage
npm run test:coverage:watch

# Coverage with UI
npm run test:coverage:ui
```

---

## 🎯 Coverage Thresholds

The project has the following coverage thresholds:

| Metric | Threshold | Status |
|--------|-----------|--------|
| **Lines** | 60% | ⚠️ Minimum |
| **Statements** | 60% | ⚠️ Minimum |
| **Functions** | 55% | ⚠️ Minimum |
| **Branches** | 50% | ⚠️ Minimum |

**Note**: These are starting thresholds. As coverage improves, we'll increase them.

### **Goal Thresholds** (Target in 3 months)
- Lines: **80%**
- Statements: **80%**
- Functions: **75%**
- Branches: **70%**

---

## 📁 Coverage Reports

After running `npm run test:coverage`, you'll find:

```
coverage/
├── index.html              # Full HTML report (open in browser)
├── lcov.info               # LCOV format (for CI/CD)
├── coverage-summary.json   # JSON summary
├── coverage-final.json     # Detailed JSON
├── badges.json             # Generated badge URLs
└── COVERAGE_BADGE.md       # Markdown badges for README
```

### **View HTML Report**
```bash
npm run coverage:report
```

This opens `coverage/index.html` in your browser showing:
- Overall coverage percentages
- File-by-file coverage breakdown
- Line-by-line coverage highlighting
- Uncovered lines highlighted in red

---

## 🔧 Configuration

### **Vitest Config** (`vitest.config.ts`)

Coverage is configured with:
- **Provider**: V8 (fast, accurate)
- **Reporters**: text, html, json-summary, lcov
- **Include**: `src/**/*.{ts,tsx}`
- **Exclude**: test files, type definitions, config files

### **What's Excluded from Coverage**
- `src/test/**` - Test utilities
- `**/__tests__/**` - Test files
- `**/*.d.ts` - Type definitions
- `**/*.config.{ts,js}` - Config files
- `**/types/**` - Type-only files
- `**/*.stories.{ts,tsx}` - Storybook stories
- `src/main.tsx` - Entry point

---

## 🤖 CI/CD Coverage Tracking

### **GitHub Actions Workflow**

Coverage runs automatically on:
- ✅ **Pull Requests** - Shows coverage diff in PR comments
- ✅ **Push to main** - Updates coverage badge
- ✅ **Manual trigger** - Can run manually from Actions tab

**Workflow file**: `.github/workflows/coverage.yml`

### **What Happens in CI**

1. **Runs tests with coverage**
2. **Uploads to Codecov** (if configured)
3. **Generates coverage summary**
4. **Comments on PR** with coverage metrics
5. **Creates coverage badge** (on main branch)
6. **Uploads HTML report** as artifact

### **PR Comments**

On every PR, you'll see a comment like:

```markdown
## 📊 Test Coverage Report

| Metric | Coverage |
|--------|----------|
| Lines | 62.5% |
| Statements | 61.8% |
| Functions | 58.2% |
| Branches | 52.3% |

⚠️ Coverage is acceptable but could be improved.
```

---

## 📈 Coverage Badges

### **Generate Badges Locally**
```bash
npm run coverage:badge
```

This creates:
- `coverage/badges.json` - Badge URLs
- `coverage/COVERAGE_BADGE.md` - Markdown to copy to README

### **Add to README**

Copy from `coverage/COVERAGE_BADGE.md` to your `README.md`:

```markdown
## Test Coverage

![Coverage](https://img.shields.io/badge/coverage-62.5%25-yellow)
![Lines](https://img.shields.io/badge/lines-62.5%25-yellow)
![Statements](https://img.shields.io/badge/statements-61.8%25-yellow)
![Functions](https://img.shields.io/badge/functions-58.2%25-yellow)
![Branches](https://img.shields.io/badge/branches-52.3%25-yellow)
```

### **Badge Colors**
- **Green** (≥80%): Excellent coverage
- **Yellow** (60-79%): Acceptable coverage
- **Orange** (40-59%): Poor coverage
- **Red** (<40%): Critical - needs attention

---

## 🎯 Improving Coverage

### **Find Uncovered Code**
```bash
# Run coverage
npm run test:coverage

# Open HTML report
npm run coverage:report

# Look for red-highlighted lines in the HTML report
```

### **Coverage by Module**

The HTML report shows coverage for each module. Focus on:

1. **Critical business logic** (finance calculations, auth)
2. **API layers** (error handling)
3. **Complex components** (merged mode logic)

### **Writing Tests for Coverage**

**Good coverage targets**:
- ✅ Happy path (normal flow)
- ✅ Error cases (API failures, validation errors)
- ✅ Edge cases (empty data, max values)
- ✅ User interactions (clicks, form submissions)
- ✅ State management (loading, error, success states)

**Example**:
```typescript
describe('useAuth', () => {
  it('should login successfully', async () => {
    // Happy path - covers normal flow
  });

  it('should handle login failure', async () => {
    // Error case - covers error handling
  });

  it('should handle network timeout', async () => {
    // Edge case - covers timeout scenario
  });

  it('should refresh token when expired', async () => {
    // Complex flow - covers refresh logic
  });
});
```

---

## 📊 Tracking Progress

### **Weekly Coverage Check**
```bash
# Run full coverage check
npm run coverage:full

# Check thresholds
npm run coverage:check
```

### **Coverage Trends**

Track coverage over time by:
1. Running `npm run coverage:full` weekly
2. Recording coverage % in project notes
3. Creating issues for modules below threshold

**Example tracking**:
```markdown
## Coverage Progress

| Date | Lines | Statements | Functions | Branches |
|------|-------|------------|-----------|----------|
| 2026-02-16 | 60.2% | 59.8% | 56.1% | 51.5% |
| 2026-02-23 | 62.5% | 61.8% | 58.2% | 52.3% |
| 2026-03-02 | 65.1% | 64.3% | 60.5% | 54.8% |
```

---

## 🚨 Coverage Failures

### **When Coverage Fails CI**

If coverage drops below threshold:

```
🚨 Coverage is below threshold! Add more tests.

❌ lines      59.2% (threshold: 60%)
✅ statements 61.1% (threshold: 60%)
✅ functions  56.8% (threshold: 55%)
✅ branches   51.2% (threshold: 50%)
```

**To fix**:
1. Run `npm run coverage:report` to see uncovered lines
2. Add tests for uncovered code
3. Run `npm run coverage:check` to verify
4. Commit and push

### **Exempting Files from Coverage**

If a file doesn't need coverage (e.g., config, types):

```typescript
// Add to vitest.config.ts exclude:
exclude: [
  // ... existing
  'src/path/to/file.ts',
]
```

---

## 🔌 Codecov Integration (Optional)

### **Setup Codecov**

1. Sign up at [codecov.io](https://codecov.io)
2. Add your repository
3. Get your `CODECOV_TOKEN`
4. Add to GitHub Secrets: `Settings > Secrets > Actions > New secret`
   - Name: `CODECOV_TOKEN`
   - Value: Your token

5. Enable in workflow (already configured in `.github/workflows/coverage.yml`)

### **Codecov Features**
- ✅ Coverage trends over time
- ✅ PR coverage diffs
- ✅ Coverage graphs
- ✅ File tree coverage view
- ✅ Commit-by-commit tracking

---

## 📝 Best Practices

### **1. Run Coverage Before Committing**
```bash
npm run coverage:full
```

### **2. Don't Chase 100% Coverage**
- Focus on **critical paths** first
- 80% coverage is excellent
- 100% coverage may mean over-testing

### **3. Test Behavior, Not Implementation**
```typescript
// ❌ Bad - tests implementation
expect(component.state.count).toBe(1);

// ✅ Good - tests behavior
expect(screen.getByText('Count: 1')).toBeInTheDocument();
```

### **4. Prioritize High-Value Tests**
- Auth flows (90%+ coverage)
- Finance calculations (95%+ coverage)
- API error handling (80%+ coverage)
- Merged mode logic (85%+ coverage)

### **5. Use Coverage to Find Gaps**
- Not to hit arbitrary numbers
- But to discover untested code paths
- Especially error handling and edge cases

---

## 🛠️ Troubleshooting

### **Coverage Not Generating**
```bash
# Clean coverage directory
rm -rf coverage

# Reinstall dependencies
npm ci

# Run coverage again
npm run test:coverage
```

### **Thresholds Too Strict**
Edit `vitest.config.ts`:
```typescript
thresholds: {
  lines: 50,  // Lower if needed temporarily
  // ...
}
```

### **Slow Coverage Generation**
```bash
# Run coverage on specific files only
vitest --coverage src/auth/**/*.test.ts
```

---

## 📚 Resources

- [Vitest Coverage Docs](https://vitest.dev/guide/coverage.html)
- [V8 Coverage Provider](https://v8.dev/blog/javascript-code-coverage)
- [Codecov Documentation](https://docs.codecov.com/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

## 🎯 Coverage Goals Roadmap

### **Phase 1: Foundation** (Month 1)
- ✅ Configure coverage tracking
- ✅ Set up CI/CD integration
- ✅ Establish baseline thresholds (current)
- ⏳ Fix failing tests (201 tests)

### **Phase 2: Critical Paths** (Month 2)
- ⏳ Auth module: 30% → 90%
- ⏳ API error handling: 55% → 85%
- ⏳ Overall: 60% → 70%

### **Phase 3: Comprehensive** (Month 3)
- ⏳ Mobile coverage: 0% → 70%
- ⏳ E2E coverage expansion
- ⏳ Overall: 70% → 85%

---

**Need Help?**
- Check `TEST_COVERAGE_ANALYSIS.md` for detailed gap analysis
- Review existing tests in `src/**/__tests__/`
- Ask in team chat or create an issue

**Happy Testing!** 🚀
