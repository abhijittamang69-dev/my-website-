# 🚀 Synaptix Frontend - Netlify Deployment

Ready-to-deploy frontend for Netlify. Connects to your Render backend API.

---

## 📦 What's Included

| File | Purpose |
|------|---------|
| `index.html` | Homepage |
| `products.html` | Product catalog with cart & checkout |
| `booking.html` | Installation booking form |
| `admin.html` | Admin dashboard |
| `script.js` | Shared JavaScript |
| `style.css` | Shared styles |
| `assets/` | Images & logos |
| `netlify.toml` | Netlify configuration |
| `_redirects` | URL redirects |

---

## 🚀 Deploy to Netlify (2 Methods)

### Method 1: Drag & Drop (Easiest)

1. Go to [netlify.com](https://netlify.com) and sign up
2. In dashboard, drag this entire folder to the deploy area
3. Done! You'll get a URL like `https://synaptix-solutions-abc123.netlify.app`

### Method 2: GitHub Integration

1. Push this folder to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Ready for Netlify"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/synaptix-frontend.git
   git push -u origin main
   ```

2. In Netlify dashboard:
   - Click **"Add new site"** → **"Import an existing project"**
   - Select your GitHub repo
   - **Build command:** (leave empty)
   - **Publish directory:** `.`
   - Click **"Deploy site"**

---

## 🔗 Important: Update Your Render Backend

After getting your Netlify URL, update your Render backend:

### 1. Update CORS in Render

Go to [Render Dashboard](https://dashboard.render.com) → Your Service → Environment:

Add/update:
| Key | Value |
|-----|-------|
| `FRONTEND_URL` | `https://your-netlify-url.netlify.app` |

### 2. Update server.js (if needed)

In your Render backend, make sure `server.js` allows your Netlify domain:

```javascript
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://your-netlify-url.netlify.app',  // <-- Add this
  'http://localhost:3000',
  'http://localhost:5000'
];
```

---

## ⚙️ Configuration

### API URL

All frontend files are already configured to use:
```javascript
const API_BASE = 'https://synaptix-api.onrender.com/api';
```

If your Render URL is different, update this in:
- `index.html`
- `products.html`
- `booking.html`
- `admin.html`

### Payment Redirects

After Khalti/eSewa payment, users redirect back to:
- Success: `/payment/success` → `products.html`
- Failed: `/payment/failed` → `products.html`

Configured in `netlify.toml` and `_redirects`.

---

## 🌐 Your URLs After Deploy

| Service | URL | Purpose |
|---------|-----|---------|
| **Netlify** | `https://synaptix-solutions-abc123.netlify.app` | Frontend website |
| **Render** | `https://synaptix-api.onrender.com` | Backend API |
| **MongoDB** | `cluster0.xxxxx.mongodb.net` | Database |

---

## 🆘 Troubleshooting

| Problem | Fix |
|---------|-----|
| "Cannot connect to API" | Check Render backend is running |
| "CORS error" | Add Netlify URL to Render CORS settings |
| "Payment not working" | Check Khalti/eSewa keys in Render env vars |
| "Images not loading" | Check `assets/` folder is in deploy |

---

## 📞 Support

**Abhijit Tamang**  
Synaptix Solutions Ltd, Nepal  
📞 +977-9865057546
