# LifeSync Troubleshooting Guide

## 🚨 Common Issues & Solutions

### 1. API Connection Issues

**Problem**: `ERR_CONNECTION_REFUSED` or `Cannot connect to API`

**Diagnostics**:
```bash
npm run diagnose:api
```

**Solutions**:
- **Local access**: Use `npm run start:local` 
- **External access**: Use `npm run start:external`
- **Quick fix**: `npm run api:restart`

### 2. Calendar/Todos Not Syncing

**Problem**: Changes in one tab don't appear in the other

**Cause**: API not running or different data sources

**Solution**:
```bash
npm run diagnose:sync
npm run fix:sync
```

### 3. Database Connection Issues

**Problem**: API returns empty arrays or errors

**Diagnostics**:
```bash
npm run diagnose:db
```

**Solutions**:
```bash
npm run db:restart
npm run api:restart
```

### 4. Port Already in Use

**Problem**: `EADDRINUSE: address already in use :::3001`

**Solution**:
```bash
npm run cleanup:ports
npm run start:local
```

### 5. External IP Not Accessible

**Problem**: Can't access via `10.247.209.223`

**Diagnosis**: Network configuration issue
**Solution**: Always use `npm run start:local` for same-machine access

---

## 🔧 Quick Diagnostic Commands

| Command | Purpose |
|---------|---------|
| `npm run diagnose:full` | Complete system health check |
| `npm run diagnose:api` | Check API connectivity |
| `npm run diagnose:db` | Check database connection |
| `npm run diagnose:sync` | Check tab synchronization |
| `npm run fix:all` | Auto-fix common issues |

---

## 📊 System Status Dashboard

Run `npm run status` to see:
- ✅/❌ API Server status
- ✅/❌ Database connectivity  
- ✅/❌ Port availability
- ✅/❌ Frontend configuration
- 📈 Response times

---

## 🎯 Recommended Workflow

1. **Always start with diagnostics**:
   ```bash
   npm run diagnose:full
   ```

2. **Use appropriate startup**:
   - Same machine: `npm run start:local`
   - Different machines: `npm run start:external`

3. **If issues persist**:
   ```bash
   npm run fix:all
   npm run start:local
   ```

---

## 📝 Issue Tracking

The system automatically logs issues to `troubleshooting.log`:
- Timestamps
- Error descriptions  
- Solutions attempted
- Resolution status

---

## 🔄 Never Repeat These Steps

**Instead of manual troubleshooting**:
❌ Manually checking ports
❌ Restarting services individually  
❌ Changing configuration files
❌ Testing connectivity manually

**Use automation**:
✅ `npm run fix:all`
✅ `npm run diagnose:full`
✅ `npm run start:local` (default safe option)