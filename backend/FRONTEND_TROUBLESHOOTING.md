# Admin Portal Troubleshooting Guide

## 🎯 Your Database Now Contains:

✅ **39 Emergency Alerts** around Bhubaneswar landmarks
✅ **5 Tourist Profiles** with realistic names (Rahul Kumar, Priya Sharma, etc.)  
✅ **Diverse Alert Types**: Medical emergencies, theft, accidents, harassment
✅ **Multiple Priorities**: Critical, High, Medium, Low
✅ **Different Statuses**: Active (32), Resolved (7)
✅ **GPS Coordinates**: Around actual Bhubaneswar landmarks

---

## 🔧 If You Don't See Data in Admin Portal:

### Step 1: Hard Refresh Browser
```
Windows: Ctrl + F5
Mac: Cmd + Shift + R
Or: Clear browser cache completely
```

### Step 2: Check Browser Console 
1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for any red errors
4. Share any errors you see

### Step 3: Verify Environment Variables
The admin portal console should show:
```
✅ Alert stats loaded from backend
✅ Dashboard data loaded from backend
```

If you see errors like:
```
❌ Alert stats API error: 500
🔄 Using mock alert stats for demo
```
This means environment variables aren't set correctly.

### Step 4: Check Network Tab
1. Open Developer Tools (F12)
2. Go to Network tab
3. Refresh page
4. Look for API calls to `smart-wanderer-backend.onrender.com`
5. Check if they return 200 (success) or errors

---

## 🗺️ What You Should See on the Map:

### Tourist Locations:
- **Rahul Kumar** (TUR001) - Safety Score 83
- **Priya Sharma** (TUR002) - Safety Score 77  
- **Amit Patel** (TUR003) - Safety Score 99
- **Sneha Singh** (TUR004) - Safety Score 84
- **Vikram Reddy** (TUR005) - Safety Score 85

### Emergency Alerts Around:
- 🏛️ **Lingaraj Temple** - "Lost near temple, need directions"
- 🏔️ **Khandagiri Caves** - "Medical emergency, tourist injured" 
- 🛒 **Ekamra Haat** - "Phone and wallet stolen"
- 🏟️ **Kalinga Stadium** - "Vehicle breakdown"
- ☮️ **Dhauli Peace Pagoda** - "CRITICAL: Serious accident"
- 🦁 **Nandankanan Zoo** - "Group member missing"

### Alert Priority Colors:
- 🔴 **Critical** (2 alerts)
- 🟠 **High** (multiple)
- 🟡 **Medium** (most common)
- 🟢 **Low** (few)

---

## 📱 Dashboard Statistics Should Show:

```
📊 Current Stats:
- Total Alerts: 39
- Active Alerts: 32  
- Resolved Today: 1+
- Priority Breakdown:
  - Critical: 2
  - High: Multiple
  - Medium: 21+
  - Low: Multiple
```

---

## 🚨 If Still No Data Visible:

### Option 1: Check Admin Portal URL
Make sure you're on the correct URL for your admin portal.

### Option 2: Test Direct API
Open this URL in browser (after logging in):
```
https://smart-wanderer-backend.onrender.com/api/alerts/stats
```

### Option 3: Check Vercel Environment Variables
1. Go to Vercel Dashboard
2. Find your admin portal project
3. Settings → Environment Variables
4. Verify these are set:
   - `VITE_API_URL`: `https://smart-wanderer-backend.onrender.com`
   - `VITE_WS_URL`: `wss://smart-wanderer-backend.onrender.com`

### Option 4: Redeploy Frontend
If environment variables were missing/wrong:
1. Update them in Vercel
2. Redeploy the admin portal
3. Wait 2-3 minutes for deployment

---

## ✅ Success Indicators:

When working correctly, you should see:
1. **Login successful** message
2. **Map with multiple markers** around Bhubaneswar
3. **Dashboard showing real numbers** (not zeros)
4. **Tourist list** with Indian names and phone numbers
5. **Alert list** with various priorities and messages
6. **No console errors** about API failures

---

## 🔄 Add Even More Data:

If you want more alerts and tourists:
```bash
cd backend
node add-more-data.js
```

This will add more diverse emergency scenarios around Bhubaneswar landmarks.

---

*If you're still not seeing data, please share:*
1. *Any browser console errors*
2. *What you see on the admin portal dashboard*
3. *Screenshot of the map area*

*The data is definitely in the database - we just need to ensure the frontend can access it!* 🎯