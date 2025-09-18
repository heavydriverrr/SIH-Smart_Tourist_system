-- Smart Wanderer Admin Backend Schema Setup
-- This script creates the necessary tables for the admin system

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create admin users table
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(50) DEFAULT 'operator' CHECK (role IN ('super_admin', 'admin', 'alert_manager', 'operator')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

-- Create tourist locations table for real-time tracking
CREATE TABLE IF NOT EXISTS tourist_locations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    address TEXT,
    accuracy DECIMAL(8, 2),
    altitude DECIMAL(10, 2),
    speed DECIMAL(8, 2),
    heading DECIMAL(6, 2),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Foreign key constraint to profiles table
    CONSTRAINT fk_tourist_locations_user_id 
        FOREIGN KEY (user_id) 
        REFERENCES profiles(id) 
        ON DELETE CASCADE
);

-- Update emergency_alerts table to include additional admin fields
ALTER TABLE emergency_alerts 
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical'));

ALTER TABLE emergency_alerts 
ADD COLUMN IF NOT EXISTS assigned_admin_id UUID;

ALTER TABLE emergency_alerts 
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

ALTER TABLE emergency_alerts 
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

-- Add foreign key constraint for assigned admin (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_emergency_alerts_assigned_admin') THEN
        ALTER TABLE emergency_alerts 
        ADD CONSTRAINT fk_emergency_alerts_assigned_admin 
            FOREIGN KEY (assigned_admin_id) 
            REFERENCES admin_users(id) 
            ON DELETE SET NULL;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tourist_locations_user_id ON tourist_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_tourist_locations_updated_at ON tourist_locations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_tourist_locations_coordinates ON tourist_locations(latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_emergency_alerts_status ON emergency_alerts(status);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_priority ON emergency_alerts(priority);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_created_at ON emergency_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_assigned_admin ON emergency_alerts(assigned_admin_id);

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at timestamps
DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
CREATE TRIGGER update_admin_users_updated_at 
    BEFORE UPDATE ON admin_users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tourist_locations_updated_at ON tourist_locations;
CREATE TRIGGER update_tourist_locations_updated_at 
    BEFORE UPDATE ON tourist_locations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) for admin tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tourist_locations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin users (only super admins can manage other admins)
CREATE POLICY "Admin users can view all admin users" ON admin_users
    FOR SELECT USING (true);

CREATE POLICY "Super admins can insert admin users" ON admin_users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id = auth.uid() AND role = 'super_admin' AND is_active = true
        )
    );

CREATE POLICY "Super admins can update admin users" ON admin_users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id = auth.uid() AND role = 'super_admin' AND is_active = true
        )
    );

-- Create RLS policies for tourist locations (admins can view all)
CREATE POLICY "Admins can view all tourist locations" ON tourist_locations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Admins can insert tourist locations" ON tourist_locations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Admins can update tourist locations" ON tourist_locations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id = auth.uid() AND is_active = true
        )
    );

-- Update emergency_alerts RLS policies to allow admin management
CREATE POLICY "Admins can update emergency alerts" ON emergency_alerts
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id = auth.uid() AND is_active = true
        )
    );

-- Create a view for admin dashboard statistics
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM profiles) as total_tourists,
    (SELECT COUNT(DISTINCT user_id) FROM tourist_locations 
     WHERE updated_at > NOW() - INTERVAL '1 hour') as active_tourists,
    (SELECT COUNT(*) FROM emergency_alerts WHERE status = 'active') as active_alerts,
    (SELECT COUNT(*) FROM emergency_alerts 
     WHERE status = 'resolved' AND resolved_at::date = CURRENT_DATE) as alerts_resolved_today,
    (SELECT COALESCE(AVG(safety_score), 0) FROM profiles WHERE safety_score IS NOT NULL) as avg_safety_score;

-- Grant necessary permissions
GRANT SELECT ON admin_dashboard_stats TO authenticated;
GRANT ALL ON admin_users TO service_role;
GRANT ALL ON tourist_locations TO service_role;

-- Insert default super admin (password: admin123456)
-- Note: In production, this should be done securely with a proper password
INSERT INTO admin_users (name, email, password_hash, role) 
VALUES (
    'System Administrator',
    'admin@smartwanderer.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- bcrypt hash for 'admin123456'
    'super_admin'
) ON CONFLICT (email) DO NOTHING;

-- Add some sample data for testing (optional)
-- This can be removed in production
INSERT INTO admin_users (name, email, password_hash, role) 
VALUES 
    ('Alert Manager', 'alerts@smartwanderer.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'alert_manager'),
    ('System Operator', 'operator@smartwanderer.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'operator')
ON CONFLICT (email) DO NOTHING;