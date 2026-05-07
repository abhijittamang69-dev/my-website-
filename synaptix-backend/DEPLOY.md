# 🚀 Deployment Guide - Synaptix Backend

## Option 1: Render (Recommended - FREE)

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial backend commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/synaptix-backend.git
git push -u origin main
```

### Step 2: Deploy on Render
1. Go to [render.com](https://render.com) and sign up
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `synaptix-api`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

5. Add Environment Variables:
   ```
   PORT=10000
   NODE_ENV=production
   MONGODB_URI=your_mongodb_atlas_uri
   JWT_SECRET=your_random_secret
   ADMIN_PASSWORD=Abhijit@2
   KHALTI_SECRET_KEY=your_khalti_key
   KHALTI_PUBLIC_KEY=your_khalti_public
   KHALTI_API_URL=https://dev.khalti.com/api/v2
   ESEWA_MERCHANT_ID=EPAYTEST
   ESEWA_SECRET_KEY=8gBm/:&EnhH.1/q
   ESEWA_API_URL=https://rc-epay.esewa.com.np
   FRONTEND_URL=https://synaptixsolutions.com
   ```

6. Click "Create Web Service"
7. Your API will be at: `https://synaptix-api.onrender.com`

### Step 3: Seed Database (One-time)
```bash
# In Render dashboard, open Shell
npm run seed
```

---

## Option 2: VPS (DigitalOcean, AWS, etc.)

### Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install MongoDB (or use Atlas)
# ... MongoDB installation steps ...

# Clone repository
git clone https://github.com/YOUR_USERNAME/synaptix-backend.git
cd synaptix-backend

# Install dependencies
npm install

# Create .env file
nano .env

# Seed database
npm run seed

# Start with PM2
pm2 start server.js --name synaptix-api
pm2 startup
pm2 save
```

### Nginx Reverse Proxy
```nginx
server {
    listen 80;
    server_name api.synaptixsolutions.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Option 3: MongoDB Atlas Setup

1. Go to [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create free cluster (M0)
3. Create database user
4. Whitelist IP: `0.0.0.0/0` (for development) or specific IPs
5. Get connection string:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/synaptix?retryWrites=true&w=majority
   ```
6. Add to `.env` file

---

## 🔧 Post-Deployment Checklist

- [ ] MongoDB connected and seeded
- [ ] Environment variables set correctly
- [ ] Khalti test payment works
- [ ] eSewa test payment works
- [ ] Admin panel accessible
- [ ] CORS configured for your domain
- [ ] SSL/HTTPS enabled
- [ ] Rate limiting working
- [ ] Error logging configured

---

## 🧪 Testing the API

```bash
# Health check
curl https://your-api.com/api/health

# Get products
curl https://your-api.com/api/products

# Create booking
curl -X POST https://your-api.com/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "phone": "9800000000",
    "address": "Kathmandu",
    "service": "cctv",
    "property": "home",
    "date": "2026-05-15",
    "time": "morning"
  }'
```

---

## 🔄 Updating After Deployment

```bash
# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Restart server
pm2 restart synaptix-api
# OR on Render: Deploy latest commit
```
