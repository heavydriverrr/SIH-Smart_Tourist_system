# 🚀 Manual Setup Guide (Step by Step)

## The Directory Issue
The error you're seeing happens because npm is trying to write to Warp's installation directory instead of your project directory. Let's fix this with manual commands.

## ✅ Step-by-Step Setup

### Step 1: Open Two Terminal Windows

**Terminal 1 (Frontend):**
```powershell
# Navigate to project directory
cd C:\Users\KIIT0001\Documents\smart-wanderer-app

# Verify you're in the right place
pwd

# Install frontend dependencies
npm install

# Start frontend server
npm run dev
```

**Terminal 2 (Backend):**
```powershell
# Navigate to backend directory
cd C:\Users\KIIT0001\Documents\smart-wanderer-app\backend

# Verify you're in the right place
pwd

# Install backend dependencies
npm install

# Start backend server
npm run dev
```

## 🔧 Alternative: Use PowerShell Scripts

If you prefer to use scripts, run these commands:

**For Frontend:**
```powershell
# Run this command in Warp terminal:
powershell -ExecutionPolicy Bypass -File "C:\Users\KIIT0001\Documents\smart-wanderer-app\setup-frontend.ps1"
```

**For Backend:**
```powershell
# In a new terminal:
powershell -ExecutionPolicy Bypass -File "C:\Users\KIIT0001\Documents\smart-wanderer-app\backend\setup-backend.ps1"
```

## 🌐 Expected URLs After Setup

Once both are running:

| Service | URL | Status |
|---------|-----|---------|
| **Frontend** | http://localhost:8080/ | Tourist app |
| **Admin Login** | http://localhost:8080/admin/login | Admin panel |
| **Backend API** | http://localhost:5000/health | Health check |

## 🔐 Default Admin Credentials

- **Email**: admin@smartwanderer.com
- **Password**: admin123456

## ⚠️ Troubleshooting

**If npm install fails:**
1. Make sure you're in the correct directory (`pwd` command)
2. Close any antivirus that might be blocking file writes
3. Try running as Administrator

**If ports are already in use:**
- Frontend (8080): The app will ask to use a different port
- Backend (5000): Edit `backend/.env` and change `PORT=5000` to `PORT=5001`

**If the backend can't connect to Supabase:**
1. Make sure you've run the SQL schema in Supabase
2. Update `SUPABASE_SERVICE_ROLE_KEY` in `backend/.env`

## 🎯 Testing the System

1. **Frontend Test**: Open http://localhost:8080/ - should show Smart Wanderer tourist app
2. **Backend Test**: Open http://localhost:5000/health - should show `{"status":"OK"}`
3. **Admin Test**: Go to http://localhost:8080/admin/login and login with default credentials
4. **Integration Test**: 
   - Open tourist app on mobile/browser
   - Allow location permissions
   - Open admin dashboard on another device
   - Watch real-time location updates

## 📞 Success Indicators

✅ Frontend shows "Smart Wanderer" tourist interface  
✅ Backend health check returns status OK  
✅ Admin login works with default credentials  
✅ Admin dashboard shows live map  
✅ Tourist locations appear on admin map in real-time  

---

**Once both terminals are running, you'll have the complete tourist safety platform online!** 🎉