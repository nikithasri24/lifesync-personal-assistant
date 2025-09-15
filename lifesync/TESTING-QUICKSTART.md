# ProjectTracking Testing - Quick Start Guide

## 🚀 Quick Commands

```bash
# Run all ProjectTracking tests
npm run test:project-tracking

# Run tests in watch mode (auto-rerun on changes)
npm run test:project-tracking:watch

# Run with coverage report
npm run test:project-tracking:coverage

# Run with interactive UI
npm run test:project-tracking:ui

# Use the helper script (alternative)
./scripts/test-project-tracking.sh --coverage
```

## 📋 What Gets Tested

✅ **Feature Management** - Create, edit, delete features  
✅ **Subtask Operations** - Add, complete, assign subtasks  
✅ **Drag & Drop** - Move features between columns  
✅ **Auto-save** - Notes and data persistence  
✅ **File Uploads** - Attachment handling  
✅ **Collaboration** - Team member assignments  
✅ **Error Recovery** - Undo operations  
✅ **Accessibility** - Keyboard navigation, screen readers  
✅ **Performance** - Large datasets, rapid interactions  

## 🎯 Coverage Goals

- **ProjectTracking.tsx**: 80% coverage required
- **Global**: 70% coverage required

## 📁 Test Files

- `ProjectTracking.test.tsx` - Main functionality
- `ProjectTracking.dragdrop.test.tsx` - Drag & drop specific
- `ProjectTracking.advanced.test.tsx` - Edge cases & performance
- `ProjectTracking.e2e.test.tsx` - User workflows
- `test-utils.tsx` - Shared utilities

## 🔧 Quick Debugging

If tests fail:
1. Check if actual functionality broke
2. Run with coverage to see untested areas
3. Use `--ui` flag for interactive debugging
4. Check browser console for errors

## 📖 Full Documentation

See [README-TESTING.md](./README-TESTING.md) for complete documentation.