/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'umkm' | 'influencer' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar_url?: string;
  city?: string;
  is_approved: boolean;
  rating: number;
  created_at: string;
  updated_at: string;
}

export interface UmkmUser extends User {
  role: 'umkm';
  brand_name: string;
  brand_category: string;
}

export interface InfluencerUser extends User {
  role: 'influencer';
  handle: string;
  followers_num: number;
  price_per_post: number;
  niche: string[];
  engagement: number;
}

export interface AdminUser extends User {
  role: 'admin';
}

export interface CampaignInfluencer {
  id: string;
  campaign_id: string;
  influencer_id: string;
  influencer_name: string;
  status: 'invited' | 'brief_ready' | 'escrow_locked' | 'content_uploaded' | 'completed' | 'disputed';
  submission_url?: string;
  escrow_released: boolean;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  name: string;
  umkm_id: string;
  umkm_name: string;
  category: string;
  description: string;
  budget: number;
  platform: string;
  brief_text?: string;
  objective: string;
  audience: string;
  tone: string;
  status: 'active' | 'completed' | 'waiting' | 'cancelled';
  campaign_influencers?: CampaignInfluencer[];
  created_at: string;
  updated_at: string;
}

export interface EscrowTx {
  id: string;
  campaign_id: string;
  campaign_name: string;
  influencer_id: string;
  influencer_name: string;
  umkm_id: string;
  amount: number;
  status: 'released' | 'locked' | 'pending';
  created_at: string;
  updated_at: string;
}

export interface SystemLog {
  id: string;
  actor_id?: string;
  actor_name: string;
  action: string;
  details: string;
  actor_type: 'umkm' | 'influencer' | 'admin';
  created_at: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  error?: string;
}
