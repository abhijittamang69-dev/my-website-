# 🚀 Render Deployment Guide - Synaptix Backend

## Common Render Errors & Fixes

### Error: "Cannot find module 'express'"
**Cause:** package-lock.json missing or node_modules not installed
**Fix:** Ensure package.json is at root, build command is `npm install`

### Error: "PORT not found" or "EACCES permission denied"
**Cause:** Hardcoded PORT instead of using process.env.PORT
**Fix:** Already fixed - server.js uses `process.env.PORT || 10000`

### Error: "MongoDB connection failed"
**Cause:** MONGODB_URI not set in environment variables
**Fix:** Add your MongoDB Atlas connection string in Render dashboard

### Error: "Module not found" for crypto
**Cause:** crypto is built-in to Node.js, shouldn't be in package.json
**Fix:** Already removed from dependencies

## Step-by-Step Render Deploy

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Ready for Render"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/synaptix-backend.git
git push -u origin main
```

### 2. Create Web Service on Render
1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repo
4. Settings:
   - **Name:** synaptix-api
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free

### 3. Add Environment Variables
In Render dashboard → Your Service → Environment:

| Variable | Value | Required |
|----------|-------|----------|
| `NODE_ENV` | `production` | ✅ Yes |
| `PORT` | `10000` | ✅ Yes |
| `MONGODB_URI` | *your atlas connection* | ✅ Yes |
| `JWT_SECRET` | *random string* | ✅ Yes |
| `ADMIN_PASSWORD` | `Abhijit@2` | ✅ Yes |
| `KHALTI_SECRET_KEY` | *from Khalti* | ❌ Optional |
| `KHALTI_PUBLIC_KEY` | *from Khalti* | ❌ Optional |
| `ESEWA_MERCHANT_ID` | `EPAYTEST` | ❌ Optional |
| `ESEWA_SECRET_KEY` | `8gBm/:&EnhH.1/q` | ❌ Optional |
| `FRONTEND_URL` | `https://synaptix-api.onrender.com` | ✅ Yes |

### 4. Deploy
Click "Create Web Service"

### 5. Seed Database (One-time)
After first deploy:
1. Go to Render dashboard → Your Service → Shell
2. Run: `npm run seed`

### 6. Check Logs
If deploy fails:
1. Go to Render dashboard → Your Service → Logs
2. Look for red error messages
3. Common fixes above

## Test Your Deploy

```bash
# Health check
curl https://synaptix-api.onrender.com/api/health

# Get products
curl https://synaptix-api.onrender.com/api/products
```

## Support

If still failing, check Render logs and share the error message.
