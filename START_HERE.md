# 🚀 Smart Wanderer - Complete Setup Guide

## What You've Built
A complete tourist safety platform with:
- **Tourist Mobile App** - Real-time location tracking, digital ID, SOS alerts
- **Admin Dashboard** - Live monitoring, emergency management, tourist tracking
- **Real-time Backend** - Location sync, alert management, admin authentication

## 📋 Prerequisites
1. **Install Node.js**: Download from https://nodejs.org/ (LTS version)
2. **Set up Database**: Run the SQL schema in Supabase (see DATABASE_SETUP.md)

## 🎯 Quick Start (After Node.js Installation)

### Method 1: Use Setup Scripts (Easiest)

#### Step 1: Set up Database
1. Follow instructions in `DATABASE_SETUP.md`
2. Run the SQL schema in Supabase SQL Editor

#### Step 2: Run Applications
```bash
# In the main directory, double-click:
setup-and-run.bat

# In a new terminal, navigate to backend and double-click:
backend/setup-backend.bat
```

### Method 2: Manual Setup

#### Terminal 1 - Frontend
```bash
npm install
npm run dev
```

#### Terminal 2 - Backend  
```bash
cd backend
npm install
npm run dev
```

## 🌐 Access Your Applications

### Tourist App
- **URL**: http://localhost:8080/
- **Features**: Location tracking, digital ID, SOS alerts
- **Optimized**: Mobile devices

### Admin Dashboard
- **Login**: http://localhost:8080/admin/login
- **Dashboard**: http://localhost:8080/admin/dashboard
- **Credentials**: 
  - Email: admin@smartwanderer.com
  - Password: admin123456

### Backend API
- **Base URL**: http://localhost:5000/api/
- **Health Check**: http://localhost:5000/health

## 🎮 How to Test the Complete System

### 1. Tourist Flow
1. Open http://localhost:8080/ on your phone or browser
2. Create a tourist account (or use existing)
3. Allow location permissions
4. See your location update in real-time
5. Press the SOS button to create an emergency alert

### 2. Admin Flow
1. Open http://localhost:8080/admin/login on a desktop/tablet
2. Login with admin@smartwanderer.com / admin123456
3. View live tourist locations on the map
4. Monitor emergency alerts and update their status
5. See real-time updates as tourists move

### 3. Real-time Features
- Tourist locations automatically appear on admin dashboard
- SOS alerts instantly notify admin users
- Location updates happen every 30 seconds
- Admin actions update in real-time

## 🔧 Configuration

### Environment Variables
Your `.env` files should already be configured, but verify:

**Frontend (.env)**:
- `VITE_ADMIN_API_URL=http://localhost:5000`
- `VITE_MAPBOX_ACCESS_TOKEN` (for maps)

**Backend (backend/.env)**:
- `JWT_SECRET` (for admin authentication)
- `SUPABASE_SERVICE_ROLE_KEY` (from Supabase dashboard)

## 📱 Features Demonstration

### Tourist App Features:
- ✅ Real-time GPS location tracking
- ✅ Safety score based on location and activity
- ✅ Digital ID card with QR code
- ✅ Emergency SOS button
- ✅ Travel itinerary management
- ✅ Safety zone notifications

### Admin Dashboard Features:
- ✅ Live map with all tourist locations
- ✅ Emergency alerts management system
- ✅ Real-time notifications
- ✅ Tourist safety scoring
- ✅ Activity logging and monitoring
- ✅ Role-based access control

## 🛠️ Troubleshooting

### Common Issues:

**Frontend won't start:**
- Make sure Node.js is installed
- Run `npm install` first
- Check if port 8080 is available

**Backend won't start:**
- Make sure you've created `backend/.env`
- Run the database schema first
- Check if port 5000 is available

**Admin login doesn't work:**
- Make sure backend is running
- Verify database schema was executed
- Check default credentials: admin@smartwanderer.com / admin123456

**No real-time updates:**
- Ensure both frontend and backend are running
- Check browser console for Socket.IO connection errors
- Verify CORS configuration in backend

## 🎯 Demo Scenarios

### Scenario 1: Tourist Emergency
1. Open tourist app, allow location access
2. Press SOS button
3. Check admin dashboard - alert appears instantly
4. Admin can update alert status and add notes

### Scenario 2: Live Tracking
1. Open admin dashboard on desktop
2. Open tourist app on mobile
3. Move around with mobile device
4. Watch location update on admin map in real-time

### Scenario 3: Multi-Tourist Monitoring
1. Open tourist app in multiple browser tabs/devices
2. Each shows different tourist accounts
3. Admin dashboard shows all locations simultaneously
4. Color-coded by safety score (green=safe, yellow=caution, red=alert)

## 📞 System URLs Summary

| Service | URL | Purpose |
|---------|-----|---------|
| Tourist App | http://localhost:8080/ | Main tourist interface |
| Admin Login | http://localhost:8080/admin/login | Admin authentication |
| Admin Dashboard | http://localhost:8080/admin/dashboard | Control center |
| Backend API | http://localhost:5000/api/ | REST API |
| Health Check | http://localhost:5000/health | System status |

## 🎉 Success Indicators

You'll know everything is working when:
1. ✅ Tourist app loads and shows location
2. ✅ Admin dashboard shows live map with tourists
3. ✅ SOS alerts appear instantly on admin dashboard  
4. ✅ Location updates happen automatically every 30 seconds
5. ✅ Real-time notifications work via Socket.IO

## 📧 Default Admin Accounts

| Role | Email | Password | Permissions |
|------|-------|----------|-------------|
| Super Admin | admin@smartwanderer.com | admin123456 | Full access |
| Alert Manager | alerts@smartwanderer.com | admin123456 | Alert management |
| Operator | operator@smartwanderer.com | admin123456 | View only |

---

**Ready to see your tourist safety platform in action? Follow the setup steps above!** 🚀