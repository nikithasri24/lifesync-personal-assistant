# How to Create Pull Requests

You have two branches ready for PRs. Follow these steps to create them on GitHub.

## Prerequisites
You've already pushed both branches:
- ✅ `feature/skincare-tracking` - Pushed
- ✅ `refactor/optimize-migrations` - Pushed

## Option 1: Via GitHub Web Interface (Recommended)

### PR #1: Week 1 Cleanup

1. Go to: https://github.com/nikithasri24/lifesync-personal-assistant/pull/new/feature/skincare-tracking

2. Fill in the PR details:
   - **Title**: `Week 1 Cleanup: Remove Dead Code, Complete Supabase Migration, Consolidate Docs`
   - **Description**: Copy/paste content from `PR_WEEK1_CLEANUP.md`

3. Click "Create Pull Request"

### PR #2: Migration Optimization

1. Go to: https://github.com/nikithasri24/lifesync-personal-assistant/pull/new/refactor/optimize-migrations

2. Fill in the PR details:
   - **Title**: `Optimize Migrations - Remove from App Load, Add Database Tracking`
   - **Description**: Copy/paste content from `PR_MIGRATION_OPTIMIZATION.md`

3. Click "Create Pull Request"

## Option 2: Via GitHub CLI

If you install GitHub CLI (`brew install gh`), you can run:

```bash
# Authenticate first
gh auth login

# Create PR #1
git checkout feature/skincare-tracking
gh pr create --title "Week 1 Cleanup: Remove Dead Code, Complete Supabase Migration, Consolidate Docs" --body-file PR_WEEK1_CLEANUP.md

# Create PR #2
git checkout refactor/optimize-migrations
gh pr create --title "Optimize Migrations - Remove from App Load, Add Database Tracking" --body-file PR_MIGRATION_OPTIMIZATION.md
```

## PR Summary

### PR #1: Week 1 Cleanup
**Branch**: `feature/skincare-tracking`
**Changes**:
- Deleted 12 backup/test files
- Removed 170+ lines of deprecated code
- Completed Supabase migration (Notes, Journal, Goals, Dreams)
- Cleaned up localStorage usage
- Consolidated 70+ docs to 9 files
- **Net**: -205,867 lines

### PR #2: Migration Optimization
**Branch**: `refactor/optimize-migrations`
**Changes**:
- Created migration tracking table in Supabase
- Built centralized migration manager
- Removed migrations from app load
- Created standalone migration script
- Added `npm run migrate` command
- **Performance**: ~200-500ms faster login

## After Creating PRs

1. Review the PRs yourself
2. Run tests if you have CI/CD setup
3. Merge PR #1 first (Week 1 cleanup)
4. Then merge PR #2 (Migration optimization)
5. Delete the feature branches after merging

## Questions?

Both PR description files (`PR_WEEK1_CLEANUP.md` and `PR_MIGRATION_OPTIMIZATION.md`) contain complete details about the changes, impact, and testing.
