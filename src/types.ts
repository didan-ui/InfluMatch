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
  avatarUrl?: string;
  city?: string;
  is_approved: boolean;
  isApproved?: boolean;
  rating: number;
  created_at: string;
  createdAt?: string;
  updated_at: string;
  updatedAt?: string;
  brand_name?: string;
  brandName?: string;
  brand_category?: string;
  brandCategory?: string;
  handle?: string;
  followers?: string;
  followersNum?: number;
  price_per_post?: number;
  pricePerPost?: string | number;
  niche?: string[];
  engagement?: number;
  briefText?: string;
  influencers?: any[];
  createdAtDate?: string;
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
  campaignId?: string;
  influencer_id: string;
  influencerId?: string;
  influencer_name: string;
  influencerName?: string;
  status: 'invited' | 'brief_ready' | 'escrow_locked' | 'content_uploaded' | 'completed' | 'disputed';
  submission_url?: string;
  submissionUrl?: string;
  escrow_released: boolean;
  escrowReleased?: boolean;
  created_at: string;
  createdAt?: string;
  updated_at: string;
  updatedAt?: string;
}

export interface Campaign {
  id: string;
  name: string;
  umkm_id: string;
  umkmId?: string;
  umkm_name: string;
  umkmName?: string;
  category: string;
  description: string;
  budget: number;
  platform: string;
  brief_text?: string;
  briefText?: string;
  objective: string;
  audience: string;
  tone: string;
  status: 'active' | 'completed' | 'waiting' | 'cancelled';
  campaign_influencers?: CampaignInfluencer[];
  influencers?: CampaignInfluencer[];
  created_at: string;
  createdAt?: string;
  updated_at: string;
  updatedAt?: string;
}

export interface EscrowTx {
  id: string;
  campaign_id: string;
  campaignId?: string;
  campaign_name: string;
  campaignName?: string;
  influencer_id: string;
  influencerId?: string;
  influencer_name: string;
  influencerName?: string;
  umkm_id: string;
  umkmId?: string;
  amount: number;
  status: 'released' | 'locked' | 'pending';
  created_at: string;
  createdAt?: string;
  updated_at: string;
  updatedAt?: string;
  date?: string;
}

export interface SystemLog {
  id: string;
  actor_id?: string;
  actorId?: string;
  actor_name: string;
  actorName?: string;
  actor?: string;
  action: string;
  details: string;
  actor_type: 'umkm' | 'influencer' | 'admin';
  actorType?: 'umkm' | 'influencer' | 'admin';
  type?: 'umkm' | 'influencer' | 'admin';
  created_at: string;
  createdAt?: string;
  date?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  error?: string;
}
