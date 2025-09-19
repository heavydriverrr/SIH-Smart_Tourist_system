# Vercel Admin Portal Setup

## Environment Variables for Vercel

To ensure the admin portal works correctly on Vercel deployment, make sure the following environment variables are set in your Vercel dashboard:

### Required Environment Variables

1. **VITE_MAPBOX_ACCESS_TOKEN**
   ```
   pk.eyJ1IjoienByYXRoYW14IiwiYSI6ImNtZnIyd2xoYzA0Ymwya3NkejFqemhkMW0ifQ.Da77w6Dyml0JEuHHc_RQsA
   ```

2. **VITE_DEMO_MODE** (Optional)
   ```
   true
   ```

### Environment Variables NOT to Set

Do **NOT** set these variables in Vercel (to enable demo mode):
- `VITE_API_URL` - Leave unset to enable demo mode
- `VITE_WS_URL` - Leave unset to enable demo mode

## Admin Login Credentials

For the demo/production deployment, use these credentials:

```
Email: admin@smartwanderer.com
Password: admin123456
```

## How It Works

- **Demo Mode**: When `VITE_API_URL` is not set or contains placeholder values, the admin system automatically switches to demo mode
- **No Backend Required**: The admin portal works entirely client-side with mock data
- **Offline Functionality**: All admin features work without internet connectivity to backend services

## Troubleshooting

If admin login doesn't work on Vercel:

1. **Check Environment Variables**: Ensure `VITE_API_URL` is NOT set in Vercel
2. **Clear Browser Cache**: Clear localStorage and try again
3. **Check Console**: Open browser DevTools and check for any errors
4. **Use Exact Credentials**: Make sure you're using the exact demo credentials listed above

## Admin Features Available in Demo Mode

- ✅ Admin Dashboard with mock statistics
- ✅ Tourist location map with blue dot markers  
- ✅ System status monitoring
- ✅ Activity logs with mock data
- ✅ All UI components and navigation
- ✅ Authentication state persistence

The admin portal provides a fully functional demo experience without requiring any backend infrastructure.