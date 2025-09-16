# LifeSync Troubleshooting Guide

## API Connection Issues

### Problem: Frontend shows "ERR_CONNECTION_REFUSED" to localhost API

**Root Cause Checklist (in order of priority):**

1. **Environment File Hierarchy** ⭐ MOST COMMON
   ```bash
   # Check ALL environment files
   find . -name ".env*" -type f
   
   # Vite priority order (highest to lowest):
   # .env.local (overrides everything!)
   # .env.development.local
   # .env.development
   # .env.local
   # .env
   ```

2. **Environment Variable Format**
   ```bash
   # CORRECT for Vite:
   VITE_API_BASE_URL=http://10.247.209.223:3001/api
   
   # WRONG (missing VITE_ prefix):
   API_BASE_URL=http://10.247.209.223:3001/api
   ```

3. **Network Context Mismatch**
   - Accessing via `10.247.209.223:5173` but API calls go to `localhost:3001`
   - Solution: Use external IP for both frontend access AND API calls

4. **Dev Server Restart Required**
   ```bash
   # Environment changes require restart
   pkill -f "vite"
   npm run dev
   ```

### Quick Fix Commands

```bash
# 1. Find the problem
find . -name ".env*" -type f | xargs grep -l "localhost:3001"

# 2. Fix all environment files
sed -i 's/localhost:3001/10.247.209.223:3001/g' .env*

# 3. Restart dev server
pkill -f "vite" && npm run dev

# 4. Test API connectivity
curl -s http://10.247.209.223:3001/api/health
```

## Database Connection Issues

### Problem: PostgreSQL connection failures

**Checklist:**
1. **Docker Container Status**
   ```bash
   docker ps | grep postgres
   docker exec lifesync-postgres psql -U postgres -d lifesync -c "SELECT NOW();"
   ```

2. **Port Conflicts**
   ```bash
   lsof -i:5432  # Check if port is in use
   lsof -i:5433  # Check Docker mapped port
   ```

3. **Environment Variables**
   ```bash
   # Check database connection string
   echo $REACT_APP_DATABASE_URL
   ```

## Frontend Build Issues

### Problem: Vite dev server not accessible externally

**Solution:**
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    host: '0.0.0.0',  // Listen on all interfaces
    port: 5173,
    strictPort: true,
  }
})
```

## CORS Issues

### Problem: Cross-origin requests blocked

**Backend Fix:**
```javascript
// CORS configuration must include all access methods
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://10.247.209.223:5173',
    'http://localhost:3000', 
    'http://10.247.209.223:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
```

## Environment File Best Practices

### File Structure
```
.env.example          # Template (commit to git)
.env                  # Default values (commit to git)
.env.local           # Local overrides (DO NOT commit)
.env.development     # Development defaults (commit to git)
.env.production      # Production values (DO NOT commit)
```

### Variable Naming
```bash
# Frontend (Vite)
VITE_API_BASE_URL=http://10.247.209.223:3001/api

# Backend (Node.js)
PORT=3001
DB_HOST=localhost
```

## Quick Diagnostic Commands

### Health Check Script
```bash
#!/bin/bash
echo "=== LifeSync Health Check ==="

echo "1. Environment Files:"
find . -name ".env*" -type f | while read file; do
  echo "  $file:"
  grep "API_BASE_URL" "$file" 2>/dev/null || echo "    No API_BASE_URL found"
done

echo -e "\n2. API Server:"
curl -s http://10.247.209.223:3001/api/health || echo "  API server not responding"

echo -e "\n3. Frontend Server:"
curl -s -I http://10.247.209.223:5173 | head -1 || echo "  Frontend server not responding"

echo -e "\n4. Database:"
docker exec lifesync-postgres psql -U postgres -d lifesync -c "SELECT NOW();" 2>/dev/null || echo "  Database not responding"

echo -e "\n5. Processes:"
echo "  Vite: $(pgrep -f vite | wc -l) processes"
echo "  Node: $(pgrep -f "node.*3001" | wc -l) processes"
```

### Save this as `health-check.sh` and run with:
```bash
chmod +x health-check.sh
./health-check.sh
```

## Common Gotchas

1. **Multiple API clients** - Check both `api.ts` and `apiClient.ts`
2. **Cached environment variables** - Always restart dev server after env changes
3. **Docker port mapping** - Database might be on 5433, not 5432
4. **File precedence** - `.env.local` always wins over `.env`
5. **Network interfaces** - `localhost` vs `0.0.0.0` vs external IP

## Emergency Reset Commands

```bash
# Nuclear option - reset everything
pkill -f "vite"
pkill -f "node.*3001"
docker restart lifesync-postgres
rm .env.local  # Remove override file
cp .env.example .env  # Reset to defaults
# Edit .env with correct values
npm run dev
```

## Prevention Checklist

Before starting development:
- [ ] Check all `.env*` files for consistency
- [ ] Verify API server responds on external IP
- [ ] Test frontend access from external IP
- [ ] Confirm database connectivity
- [ ] Run health check script

## Contact & Updates

Last updated: 2025-09-16
Issues resolved: Frontend API connection via environment file hierarchy

---

**Remember:** When in doubt, check `.env.local` first!