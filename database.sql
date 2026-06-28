-- ============================================================
-- UMKM & Influencer Marketing Platform - Database Schema
-- Paste this SQL into Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('umkm', 'influencer', 'admin')),
  avatar_url VARCHAR(500),
  city VARCHAR(100),
  is_approved BOOLEAN DEFAULT FALSE,
  rating NUMERIC(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  
  -- UMKM specific fields
  brand_name VARCHAR(255),
  brand_category VARCHAR(100),
  
  -- Influencer specific fields
  handle VARCHAR(255),
  followers_num INTEGER,
  price_per_post NUMERIC(12,2),
  niche TEXT[],
  engagement NUMERIC(5,2),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index untuk faster queries
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_approved ON users(is_approved);

-- ============================================================
-- 2. CAMPAIGNS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  umkm_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  umkm_name VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  objective VARCHAR(255),
  audience TEXT,
  platform VARCHAR(100),
  tone VARCHAR(100),
  budget NUMERIC(12,2) NOT NULL,
  brief_text TEXT,
  status VARCHAR(50) DEFAULT 'waiting' CHECK (status IN ('active', 'completed', 'waiting', 'cancelled')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_campaigns_umkm_id ON campaigns(umkm_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_created_at ON campaigns(created_at);

-- ============================================================
-- 3. CAMPAIGN_INFLUENCERS TABLE (Many-to-Many)
-- ============================================================
CREATE TABLE IF NOT EXISTS campaign_influencers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  influencer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  influencer_name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'invited' CHECK (
    status IN ('invited', 'brief_ready', 'escrow_locked', 'content_uploaded', 'completed', 'disputed')
  ),
  submission_url VARCHAR(500),
  escrow_released BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(campaign_id, influencer_id)
);

-- Create indexes
CREATE INDEX idx_campaign_influencers_campaign_id ON campaign_influencers(campaign_id);
CREATE INDEX idx_campaign_influencers_influencer_id ON campaign_influencers(influencer_id);
CREATE INDEX idx_campaign_influencers_status ON campaign_influencers(status);

-- ============================================================
-- 4. ESCROW_TRANSACTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS escrow_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  campaign_name VARCHAR(255) NOT NULL,
  influencer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  influencer_name VARCHAR(255) NOT NULL,
  umkm_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('released', 'locked', 'pending')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_escrow_campaign_id ON escrow_transactions(campaign_id);
CREATE INDEX idx_escrow_influencer_id ON escrow_transactions(influencer_id);
CREATE INDEX idx_escrow_umkm_id ON escrow_transactions(umkm_id);
CREATE INDEX idx_escrow_status ON escrow_transactions(status);

-- ============================================================
-- 5. SYSTEM_LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS system_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_name VARCHAR(255),
  action VARCHAR(255) NOT NULL,
  details TEXT,
  actor_type VARCHAR(50) CHECK (actor_type IN ('umkm', 'influencer', 'admin')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_system_logs_actor_id ON system_logs(actor_id);
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at);
CREATE INDEX idx_system_logs_action ON system_logs(action);

-- ============================================================
-- SAMPLE DATA (OPTIONAL - Uncomment untuk testing)
-- ============================================================
/*
-- Insert sample UMKM user
INSERT INTO users (email, name, role, brand_name, brand_category, city, is_approved, rating)
VALUES 
  ('umkm1@example.com', 'Ayam Geprek Pak Budi', 'umkm', 'Ayam Geprek Pak Budi', 'Kuliner', 'Jakarta', true, 4.5),
  ('influencer1@example.com', 'Fatima Lifestyle', 'influencer', '', '', 'Jakarta', true, 4.8);

-- Insert sample Influencer user
INSERT INTO users (email, name, role, handle, followers_num, price_per_post, niche, engagement, city, is_approved, rating)
VALUES 
  ('influencer2@example.com', 'Rina Travel', 'influencer', '@rinatravel', 50000, 2000000, ARRAY['travel', 'lifestyle'], 8.5, 'Surabaya', true, 4.6);

-- Insert sample Campaign
INSERT INTO campaigns (umkm_id, umkm_name, name, category, description, objective, audience, platform, tone, budget, status)
SELECT id, name, 'Promo Menu Baru', 'Marketing', 'Promosi menu geprek spesial', 'Brand Awareness', 'Milenial Indonesia 18-35', 'Instagram', 'casual', 5000000, 'active'
FROM users WHERE email = 'umkm1@example.com';
*/

-- ============================================================
-- ENABLE ROW LEVEL SECURITY (Recommended)
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Note: Configure RLS policies sesuai kebutuhan autentikasi Anda
-- Ini akan dikonfigurasi di aplikasi atau melalui Auth settings Supabase
