# 🚀 Smart Wanderer Deployment Guide

## Quick Deployment Steps

### 1. Backend Deployment (Railway - Fastest)

1. **Go to Railway**: https://railway.app
2. **Sign up/Login** with GitHub
3. **Create New Project** → **Deploy from GitHub repo**
4. **Select your repository** and **backend folder**
5. **Environment Variables** (Add in Railway dashboard):
   ```
   NODE_ENV=production
   PORT=3001
   SUPABASE_URL=https://mfdbfienscwfdthlmqkf.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mZGJmaWVuc2N3ZmR0aGxtcWtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMjAyNDMsImV4cCI6MjA3Mzc5NjI0M30.WwHjq1zLJy6gXNbLJo6c0vcWeYCTVuUuS4yh9rX7w7g
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mZGJmaWVuc2N3ZmR0aGxtcWtmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODIyMDI0MywiZXhwIjoyMDczNzk2MjQzfQ.wG0YFABn71nx_CX3SnXWI6xJXwJtOVL8GzblRqG_Kyw
   JWT_SECRET=your_very_secure_jwt_secret_key_here_change_in_production
   JWT_EXPIRES_IN=24h
   ADMIN_DEFAULT_EMAIL=admin@smartwanderer.com
   ADMIN_DEFAULT_PASSWORD=admin123456
   ```

6. **Deploy** → Copy the deployment URL (e.g., `https://your-app.railway.app`)

### 2. Frontend Deployment (Vercel - Fastest)

1. **Go to Vercel**: https://vercel.com
2. **Import Project** from GitHub
3. **Select your repository** (root folder)
4. **Environment Variables** (Add in Vercel dashboard):
   ```
   VITE_API_URL=https://your-backend-url.railway.app
   ```
5. **Deploy** → Copy the deployment URL (e.g., `https://your-app.vercel.app`)

### 3. Update Backend CORS

After getting your frontend URL, update backend environment variables:
```
FRONTEND_URL=https://your-frontend.vercel.app
ADMIN_FRONTEND_URL=https://your-frontend.vercel.app
```

## Alternative Platforms

### Backend Options:
- **Railway**: Easiest, great for Node.js
- **Render**: Free tier, good performance  
- **Heroku**: Classic choice (paid)
- **DigitalOcean App Platform**: Full control

### Frontend Options:
- **Vercel**: Best for React/Vite
- **Netlify**: Great static hosting
- **GitHub Pages**: Free (if public repo)
- **Firebase Hosting**: Google ecosystem

## Manual Deployment Commands

### For Railway (Backend):
```bash
cd backend
npm install
npm start
```

### For Vercel (Frontend):
```bash
npm run build
# Upload dist/ folder
```

## Test Deployed System

1. **Backend Health Check**: 
   `https://your-backend.railway.app/health`

2. **Frontend Access**:
   `https://your-frontend.vercel.app/admin/login`

3. **Login Credentials**:
   - Email: admin@smartwanderer.com
   - Password: admin123456

## 🎯 Production Checklist

- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible  
- [ ] Environment variables configured
- [ ] CORS properly configured
- [ ] Admin login working
- [ ] Dashboard loads with data
- [ ] All admin features accessible

## 🚨 Quick Fixes

### CORS Issues
Update backend `.env`:
```
FRONTEND_URL=https://your-actual-frontend-url.vercel.app
```

### Build Errors
Frontend:
```bash
npm run build
# Fix any TypeScript/build errors
```

Backend:
```bash
cd backend
npm install --production
```

---

## 🎉 Live URLs (Update after deployment)

- **Frontend**: https://your-app.vercel.app
- **Backend**: https://your-app.railway.app  
- **Admin Login**: https://your-app.vercel.app/admin/login

**Deployment Status**: Ready for deployment! 🚀