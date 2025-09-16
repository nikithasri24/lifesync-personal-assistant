# 🚀 LifeSync Quick Reference

## 🆘 Having Issues? Start Here:

```bash
npm run status      # See what's wrong
npm run fix:all     # Fix everything  
npm run start:local # Start safely
```

## 📋 Most Used Commands

| Need | Command |
|------|---------|
| 🚀 **Start app** | `npm run start:local` |
| 🔍 **Check health** | `npm run status` |
| 🛠️ **Fix issues** | `npm run fix:all` |
| 🧹 **Clean up** | `npm run cleanup:ports` |
| 📊 **Full report** | `npm run diagnose:full` |

## 🔧 Troubleshooting Workflow

1. **Something broken?** → `npm run status`
2. **See red X's?** → `npm run fix:all`  
3. **Still broken?** → Check `troubleshooting.log`
4. **Need to start?** → `npm run start:local`

## 🎯 Access Points

- **Frontend**: `http://localhost:5173`
- **API**: `http://localhost:3001`
- **API Info**: `http://localhost:3001/`

## 🔄 Calendar/Todos Sync

After running `npm run fix:all`:
- ✅ Guaranteed to work
- ✅ Real-time updates
- ✅ Same data source

## 📝 Files to Check

- `troubleshooting.log` → What went wrong
- `LIFESYNC-WORKFLOW.md` → Detailed guide
- `TROUBLESHOOTING.md` → Issue solutions