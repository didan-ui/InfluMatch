/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'umkm' | 'influencer' | 'admin';

export interface User {
  id: string;
  email: string;
  password?: string;
  name: string;
  role: UserRole;
  brandName?: string;
  brandCategory?: string;
  brandDescription?: string;
  handle?: string;
  followers?: string;
  followersNum?: number;
  pricePerPost?: string;
  niche?: string[];
  city?: string;
  avatarUrl?: string;
  isApproved: boolean;
  engagement?: string;
  rating?: number;
  status?: 'active' | 'suspended' | 'banned';
  warningsCount?: number;
  statusReason?: string;
}

export interface CampaignInfluencer {
  influencerId: string;
  influencerName: string;
  status: 'applied' | 'invited' | 'brief_ready' | 'in_progress' | 'escrow_locked' | 'content_uploaded' | 'completed' | 'disputed';
  submissionUrl?: string;
  escrowReleased?: boolean;
}

export interface Campaign {
  id: string;
  name: string;
  umkmId: string;
  umkmName: string;
  category: string;
  description: string;
  budget: number;
  platform: string;
  briefText?: string;
  objective: string;
  audience: string;
  tone: string;
  status: 'active' | 'completed' | 'waiting' | 'cancelled';
  influencers: CampaignInfluencer[];
  createdAt: string;
  deadline?: string;
  kriteria?: string;
}

export interface EscrowTx {
  id: string;
  date: string;
  campaignId: string;
  campaignName: string;
  influencerId: string;
  influencerName: string;
  amount: number;
  status: 'released' | 'locked' | 'pending';
}

export interface SystemLog {
  id: string;
  date: string;
  actor: string;
  action: string;
  details: string;
  type: 'umkm' | 'influencer' | 'admin';
}

export interface WithdrawalTx {
  id: string;
  influencerId: string;
  influencerName: string;
  amount: number;
  bankName: string;
  accountNo: string;
  accountHolder: string;
  status: 'pending' | 'completed' | 'rejected';
  date: string;
}

export interface Report {
  id: string;
  reporterId: string;
  reporterName: string;
  reporterRole: UserRole;
  reportedId: string;
  reportedName: string;
  reportedRole: UserRole;
  reason: string;
  description: string;
  evidenceUrl?: string;
  status: 'pending' | 'under_review' | 'resolved' | 'rejected';
  notes?: string;
  sanctionType?: 'none' | 'warning' | 'suspend' | 'ban';
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  campaignId: string;
  senderId: string;
  receiverId: string;
  message: string;
  timestamp: string;
  read: boolean;
}

