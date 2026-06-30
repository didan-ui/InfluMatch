-- ==========================================
-- SUPABASE POSTGRESQL DATABASE SCHEMA
-- INFLUMATCH WEB APPLICATION
-- ==========================================

-- 1. Create enum types for safer status states (Optional, but highly recommended)
CREATE TYPE user_role AS ENUM ('umkm', 'influencer', 'admin');
CREATE TYPE campaign_status AS ENUM ('active', 'completed', 'waiting', 'cancelled');
CREATE TYPE escrow_status AS ENUM ('released', 'locked', 'pending');
CREATE TYPE log_type AS ENUM ('umkm', 'influencer', 'admin');

-- 2. CREATE USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'umkm',
    brand_name TEXT,
    brand_category TEXT,
    brand_description TEXT,
    handle TEXT,
    followers TEXT,
    followers_num INTEGER,
    price_per_post TEXT,
    niche TEXT[] DEFAULT '{}',
    city TEXT DEFAULT 'Malang',
    avatar_url TEXT,
    is_approved BOOLEAN NOT NULL DEFAULT FALSE,
    engagement TEXT,
    rating NUMERIC(3,2) DEFAULT 5.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. CREATE CAMPAIGNS TABLE
CREATE TABLE IF NOT EXISTS campaigns (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    umkm_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    umkm_name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    budget NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    platform TEXT NOT NULL,
    brief_text TEXT,
    objective TEXT NOT NULL,
    audience TEXT NOT NULL,
    tone TEXT NOT NULL,
    status campaign_status NOT NULL DEFAULT 'waiting',
    influencers JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. CREATE ESCROW TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS escrow_tx (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    campaign_name TEXT NOT NULL,
    influencer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    influencer_name TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    status escrow_status NOT NULL DEFAULT 'pending'
);

-- 5. CREATE SYSTEM LOGS TABLE
CREATE TABLE IF NOT EXISTS system_logs (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    actor TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT NOT NULL,
    type log_type NOT NULL DEFAULT 'umkm'
);

-- 5b. CREATE WITHDRAWALS TABLE
CREATE TYPE withdrawal_status AS ENUM ('pending', 'completed', 'rejected');
CREATE TABLE IF NOT EXISTS withdrawals (
    id TEXT PRIMARY KEY,
    influencer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    influencer_name TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    bank_name TEXT NOT NULL,
    account_no TEXT NOT NULL,
    account_holder TEXT NOT NULL,
    status withdrawal_status NOT NULL DEFAULT 'pending',
    date TEXT NOT NULL
);

-- 6. INDEXES FOR PERFORMANCE OPTIMIZATION
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_campaigns_umkm ON campaigns(umkm_id);
CREATE INDEX IF NOT EXISTS idx_escrow_campaign ON escrow_tx(campaign_id);
CREATE INDEX IF NOT EXISTS idx_escrow_influencer ON escrow_tx(influencer_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_influencer ON withdrawals(influencer_id);

-- 7. ENABLE ROW LEVEL SECURITY (RLS) FOR DATA PRIVACY (Optional)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_tx ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Create basic unrestricted access policies for easy setup (can be tightened up for production)
CREATE POLICY "Public Read Access to Users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can edit their own profiles" ON users FOR UPDATE USING (auth.uid()::text = id OR true);
CREATE POLICY "Allow All on Users for simplicity" ON users FOR ALL USING (true);

CREATE POLICY "Allow All on Campaigns" ON campaigns FOR ALL USING (true);
CREATE POLICY "Allow All on Escrow Tx" ON escrow_tx FOR ALL USING (true);
CREATE POLICY "Allow All on Withdrawals" ON withdrawals FOR ALL USING (true);
CREATE POLICY "Allow All on System Logs" ON system_logs FOR ALL USING (true);
