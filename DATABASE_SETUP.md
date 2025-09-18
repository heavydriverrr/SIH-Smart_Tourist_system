# Database Setup Instructions

## Prerequisites
Your Supabase project is already configured. You just need to run the admin system schema.

## Steps:

### 1. Open Supabase SQL Editor
1. Go to: https://supabase.com/dashboard
2. Navigate to your project: https://supabase.com/dashboard/project/mfdbfienscwfdthlmqkf
3. Click on "SQL Editor" in the left sidebar

### 2. Run the Schema Script
1. Copy the entire content of `backend/scripts/setup-admin-schema.sql`
2. Paste it into the SQL Editor
3. Click "Run" to execute the script

This will create:
- `admin_users` table for admin authentication
- `tourist_locations` table for location tracking
- Enhanced `emergency_alerts` with admin fields
- Indexes for better performance
- Row Level Security policies

### 3. Verify Tables Created
After running the script, you should see these new tables in your Database:
- admin_users
- tourist_locations

### 4. Default Admin Account
The script automatically creates:
- Email: admin@smartwanderer.com
- Password: admin123456

## Environment Variables
Make sure your `.env` files are configured:

### Frontend (.env)
```
VITE_SUPABASE_PROJECT_ID="mfdbfienscwfdthlmqkf"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mZGJmaWVuc2N3ZmR0aGxtcWtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMjAyNDMsImV4cCI6MjA3Mzc5NjI0M30.WwHjq1zLJy6gXNbLJo6c0vcWeYCTVuUuS4yh9rX7w7g"
VITE_SUPABASE_URL="https://mfdbfienscwfdthlmqkf.supabase.co"
VITE_ADMIN_API_URL=http://localhost:5000
VITE_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoiZGVmYXVsdCIsImEiOiJkZWZhdWx0In0.default
```

### Backend (.env)
Create `backend/.env` with:
```
PORT=5000
NODE_ENV=development

SUPABASE_URL=https://mfdbfienscwfdthlmqkf.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mZGJmaWVuc2N3ZmR0aGxtcWtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMjAyNDMsImV4cCI6MjA3Mzc5NjI0M30.WwHjq1zLJy6gXNbLJo6c0vcWeYCTVuUuS4yh9rX7w7g
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

JWT_SECRET=smart_wanderer_jwt_secret_key_2024
JWT_EXPIRES_IN=24h

ADMIN_DEFAULT_EMAIL=admin@smartwanderer.com
ADMIN_DEFAULT_PASSWORD=admin123456

FRONTEND_URL=http://localhost:8080
ADMIN_FRONTEND_URL=http://localhost:8080

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Next Steps
1. Run the SQL schema
2. Install Node.js
3. Run the setup scripts
4. Access the applications at the URLs provided