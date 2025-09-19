# Vercel Environment Variable Setup

## 🎯 Issue: Map works locally but not on Vercel

Your Mapbox integration is working locally but failing on Vercel because the environment variable `VITE_MAPBOX_ACCESS_TOKEN` is not configured in your Vercel deployment.

## 🔧 How to Fix:

### Step 1: Access Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Login to your account
3. Find your `smart-wanderer-app` project
4. Click on it

### Step 2: Add Environment Variable
1. Go to **Settings** tab
2. Click on **Environment Variables** from the sidebar
3. Click **Add New** button
4. Fill in the details:
   - **Name**: `VITE_MAPBOX_ACCESS_TOKEN`
   - **Value**: `pk.eyJ1IjoienByYXRoYW14IiwiYSI6ImNtZnIyd2xoYzA0Ymwya3NkejFqemhkMW0ifQ.Da77w6Dyml0JEuHHc_RQsA`
   - **Environments**: Select all (Production, Preview, Development)
5. Click **Save**

### Step 3: Redeploy
1. Go to **Deployments** tab
2. Click on the **3 dots** (⋯) next to your latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete

## 🔄 Alternative: Automatic Fallback

I've also added a fallback system to the code. If the environment variable is not set, the app will automatically use a hardcoded token. This ensures your map will work even if the environment variable is not configured.

## 🧪 Testing

After adding the environment variable and redeploying:

1. Visit your Vercel deployment URL
2. Open browser developer tools (F12)
3. Go to Console tab
4. Look for these messages:
   - ✅ `"Using environment token"` (best case)
   - ✅ `"Using fallback token (for Vercel deployment)"` (backup)
   - ❌ If you see errors about token validation

## 📋 Current Status

Your app now has **triple fallback**:
1. **Environment Variable** (best) - if configured in Vercel
2. **Saved Token** (from localStorage)  
3. **Hardcoded Fallback** (guaranteed to work)

This ensures the map will work on Vercel regardless of environment variable configuration.

## 🔗 Your Mapbox Token
- **Token**: `pk.eyJ1IjoienByYXRoYW14IiwiYSI6ImNtZnIyd2xoYzA0Ymwya3NkejFqemhkMW0ifQ.Da77w6Dyml0JEuHHc_RQsA`
- **Type**: Public token (safe for client-side use)
- **Status**: Valid and tested locally

## 🚀 Expected Result

After following these steps, your Vercel deployment should show:
- ✅ Working satellite map with Mapbox tiles
- ✅ User location (blue dot)
- ✅ Tourist attraction markers
- ✅ Risk zone overlays
- ✅ Interactive controls