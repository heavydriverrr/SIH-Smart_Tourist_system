# 🚨 Fix Alert Stats Endpoint Issue

## Problem
The admin portal shows this error:
```
GET https://smart-wanderer-backend.onrender.com/api/alerts/stats 500 (Internal Server Error)
⚠️ Alert stats API error: 500 Request failed with status code 500
🔄 Using mock alert stats for demo
```

## Root Cause
The `/api/alerts/stats` endpoint exists in the backend code, but the `emergency_alerts` table is missing from your Supabase database.

## ✅ Solution Options

### Option 1: Automatic Fix (Recommended)
Run the automated script to create the table and test data:

```bash
cd backend
npm run test-alerts
```

This will:
- ✅ Check if `emergency_alerts` table exists
- ✅ Create the table automatically if missing  
- ✅ Add sample alert data for testing
- ✅ Verify the stats endpoint works

### Option 2: Manual Database Setup
If the automated script doesn't work, manually create the table:

1. **Go to Supabase Dashboard** → Your Project → SQL Editor
2. **Run this SQL**:

```sql
-- Create emergency_alerts table
CREATE TABLE emergency_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  message TEXT,
  priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  status VARCHAR(20) CHECK (status IN ('active', 'acknowledged', 'resolved', 'false_alarm')) DEFAULT 'active',
  assigned_admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX idx_emergency_alerts_user_id ON emergency_alerts(user_id);
CREATE INDEX idx_emergency_alerts_status ON emergency_alerts(status);
CREATE INDEX idx_emergency_alerts_priority ON emergency_alerts(priority);
CREATE INDEX idx_emergency_alerts_created_at ON emergency_alerts(created_at);
CREATE INDEX idx_emergency_alerts_assigned_admin ON emergency_alerts(assigned_admin_id);

-- Enable Row Level Security
ALTER TABLE emergency_alerts ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access
CREATE POLICY "Admin can access all alerts" ON emergency_alerts
  FOR ALL USING (true);
```

3. **Add sample data** (optional):

```sql
-- Insert sample alert data (replace USER_ID with actual user ID from profiles table)
INSERT INTO emergency_alerts (user_id, latitude, longitude, message, priority, status) VALUES
('YOUR_USER_ID_HERE', 40.7128, -74.0060, 'Lost in Times Square', 'medium', 'active'),
('YOUR_USER_ID_HERE', 40.7589, -73.9851, 'Medical emergency in Central Park', 'high', 'resolved'),
('YOUR_USER_ID_HERE', 40.6892, -74.0445, 'Minor incident at Statue of Liberty', 'low', 'false_alarm');
```

## 🧪 Testing

After running either option, test the endpoint:

```bash
# Test the stats endpoint directly
curl -X GET "https://smart-wanderer-backend.onrender.com/api/alerts/stats" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📊 Expected Result

After fixing, the admin portal should:
- ✅ **No more 500 errors** from alert stats endpoint
- ✅ **Display real alert statistics** instead of mock data
- ✅ **Show alert breakdown by priority** (low, medium, high, critical)
- ✅ **Display resolved alerts count** for today
- ✅ **Show total and active alert counts**

## 🔍 Verification

1. **Login to admin portal**: Use `admin@smartwanderer.com` / `admin123456`
2. **Check console**: Should see `✅ Alert stats loaded from backend` instead of error
3. **Dashboard stats**: Should show real numbers instead of mock data

## 📝 Database Schema

The `emergency_alerts` table structure:
- `id` - UUID primary key
- `user_id` - References profiles table  
- `latitude`, `longitude` - Alert location
- `message` - Alert description
- `priority` - low, medium, high, critical
- `status` - active, acknowledged, resolved, false_alarm
- `assigned_admin_id` - Admin handling the alert
- `admin_notes` - Admin comments
- `created_at`, `updated_at`, `resolved_at` - Timestamps

## 🚀 After Fix

Your admin portal will have:
- **Real-time alert statistics** 📊
- **Priority breakdown charts** 📈  
- **Alert resolution tracking** ✅
- **Full emergency management system** 🚨

The alert system will be fully operational with live backend data!