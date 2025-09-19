# Vercel Admin Portal Setup

## Environment Variables for Vercel

To ensure the admin portal works correctly on Vercel deployment, make sure the following environment variables are set in your Vercel dashboard:

### Required Environment Variables

1. **VITE_MAPBOX_ACCESS_TOKEN**
   ```
   pk.eyJ1IjoienByYXRoYW14IiwiYSI6ImNtZnIyd2xoYzA0Ymwya3NkejFqemhkMW0ifQ.Da77w6Dyml0JEuHHc_RQsA
   ```

2. **VITE_API_URL** (Backend API)
   ```
   https://smart-wanderer-backend.onrender.com
   ```

3. **VITE_WS_URL** (WebSocket URL)
   ```
   wss://smart-wanderer-backend.onrender.com
   ```

4. **VITE_FALLBACK_TO_DEMO** (Hybrid Mode)
   ```
   true
   ```

## Admin Login Credentials

For the demo/production deployment, use these credentials:

```
Email: admin@smartwanderer.com
Password: admin123456
```

## How It Works

- **Real Backend Integration**: Admin portal connects to the live backend at https://smart-wanderer-backend.onrender.com
- **Hybrid Mode**: If backend is unavailable, automatically falls back to demo mode with same credentials
- **Live Data**: Real-time tourist locations, alerts, and system data when backend is connected
- **Robust Fallback**: Seamless fallback to demo mode if backend is sleeping or unavailable

## Troubleshooting

If admin login doesn't work on Vercel:

1. **Check Environment Variables**: Ensure `VITE_API_URL` is set to the backend URL in Vercel
2. **Backend Status**: Check if https://smart-wanderer-backend.onrender.com/health returns OK
3. **Clear Browser Cache**: Clear localStorage and try again
4. **Check Console**: Open browser DevTools and check for any errors
5. **Use Exact Credentials**: Make sure you're using the exact credentials listed above
6. **Backend Sleep**: Render backends sleep after inactivity - first request may take 30+ seconds

## Admin Features Available

### With Backend Connected:
- ✅ Admin Dashboard with live statistics
- ✅ Real-time tourist location map with blue dot markers
- ✅ Live system status monitoring
- ✅ Real activity logs and alerts
- ✅ Live tourist data and emergency alerts
- ✅ WebSocket real-time updates
- ✅ Full CRUD operations

### Fallback Demo Mode:
- ✅ Admin Dashboard with mock statistics
- ✅ Tourist location map with blue dot markers  
- ✅ System status monitoring
- ✅ Activity logs with mock data
- ✅ All UI components and navigation
- ✅ Authentication state persistence

The admin portal provides a hybrid experience with live backend data when available, and seamless fallback to demo mode.
