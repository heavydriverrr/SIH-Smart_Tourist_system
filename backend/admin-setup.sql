-- COPY AND PASTE THIS INTO YOUR SUPABASE SQL EDITOR
-- Go to: https://supabase.com/dashboard → Your Project → SQL Editor

-- Create the admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(50) DEFAULT 'operator' CHECK (role IN ('super_admin', 'admin', 'alert_manager', 'operator')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

-- Insert the admin user (password: admin123456)
INSERT INTO admin_users (name, email, password_hash, role) 
VALUES (
    'System Administrator',
    'admin@smartwanderer.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'super_admin'
) ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    updated_at = NOW();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);

-- Create tourist_locations table for admin tracking
CREATE TABLE IF NOT EXISTS tourist_locations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    address TEXT,
    accuracy DECIMAL(8, 2),
    altitude DECIMAL(10, 2),
    speed DECIMAL(8, 2),
    heading DECIMAL(6, 2),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for tourist_locations
CREATE INDEX IF NOT EXISTS idx_tourist_locations_user_id ON tourist_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_tourist_locations_updated_at ON tourist_locations(updated_at DESC);

-- Verify the admin user was created
SELECT id, name, email, role, is_active, created_at 
FROM admin_users 
WHERE email = 'admin@smartwanderer.com';