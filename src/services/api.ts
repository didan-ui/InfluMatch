/**
 * API Service Layer
 * Handle semua komunikasi dengan backend
 */

import { User, Campaign, EscrowTx, CampaignInfluencer, UmkmUser, InfluencerUser } from '../types';

const API_BASE = '/api';

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

const apiFetch = async (endpoint: string, options: FetchOptions = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `API Error: ${response.statusText}`);
  }

  return response.json();
};

// ============================================================
// AUTH ENDPOINTS
// ============================================================
export const authAPI = {
  login: async (email: string, password: string) => {
    return apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  register: async (data: {
    email: string;
    password: string;
    name: string;
    role: 'umkm' | 'influencer';
    brandName?: string;
    brandCategory?: string;
    handle?: string;
    city?: string;
  }) => {
    return apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  logout: async () => {
    return apiFetch('/auth/logout', {
      method: 'POST',
    });
  },

  getCurrentUser: async () => {
    return apiFetch('/auth/me', {
      method: 'GET',
    });
  },

  updateProfile: async (userId: string, data: Partial<User>) => {
    return apiFetch(`/auth/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

// ============================================================
// USER ENDPOINTS
// ============================================================
export const userAPI = {
  getAll: async (role?: string) => {
    const query = role ? `?role=${role}` : '';
    return apiFetch(`/users${query}`, {
      method: 'GET',
    });
  },

  getById: async (userId: string) => {
    return apiFetch(`/users/${userId}`, {
      method: 'GET',
    });
  },

  getInfluencers: async () => {
    return apiFetch('/users?role=influencer', {
      method: 'GET',
    });
  },

  getUmkms: async () => {
    return apiFetch('/users?role=umkm', {
      method: 'GET',
    });
  },

  approveInfluencer: async (influencerId: string) => {
    return apiFetch(`/users/${influencerId}/approve`, {
      method: 'POST',
    });
  },

  rejectInfluencer: async (influencerId: string) => {
    return apiFetch(`/users/${influencerId}/reject`, {
      method: 'POST',
    });
  },
};

// ============================================================
// CAMPAIGN ENDPOINTS
// ============================================================
export const campaignAPI = {
  getAll: async () => {
    return apiFetch('/campaigns', {
      method: 'GET',
    });
  },

  getById: async (campaignId: string) => {
    return apiFetch(`/campaigns/${campaignId}`, {
      method: 'GET',
    });
  },

  getByUmkmId: async (umkmId: string) => {
    return apiFetch(`/campaigns?umkm_id=${umkmId}`, {
      method: 'GET',
    });
  },

  create: async (data: {
    name: string;
    category: string;
    description: string;
    objective: string;
    audience: string;
    platform: string;
    tone: string;
    budget: number;
  }) => {
    return apiFetch('/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (campaignId: string, data: Partial<Campaign>) => {
    return apiFetch(`/campaigns/${campaignId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (campaignId: string) => {
    return apiFetch(`/campaigns/${campaignId}`, {
      method: 'DELETE',
    });
  },

  addInfluencer: async (campaignId: string, influencerId: string) => {
    return apiFetch(`/campaigns/${campaignId}/influencers`, {
      method: 'POST',
      body: JSON.stringify({ influencerId }),
    });
  },

  removeInfluencer: async (campaignId: string, influencerId: string) => {
    return apiFetch(`/campaigns/${campaignId}/influencers/${influencerId}`, {
      method: 'DELETE',
    });
  },

  updateInfluencerStatus: async (
    campaignId: string,
    influencerId: string,
    status: string
  ) => {
    return apiFetch(
      `/campaigns/${campaignId}/influencers/${influencerId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }
    );
  },

  submitContent: async (
    campaignId: string,
    influencerId: string,
    submissionUrl: string
  ) => {
    return apiFetch(
      `/campaigns/${campaignId}/influencers/${influencerId}/submit`,
      {
        method: 'POST',
        body: JSON.stringify({ submissionUrl }),
      }
    );
  },
};

// ============================================================
// ESCROW ENDPOINTS
// ============================================================
export const escrowAPI = {
  getAll: async () => {
    return apiFetch('/escrow', {
      method: 'GET',
    });
  },

  getById: async (escrowId: string) => {
    return apiFetch(`/escrow/${escrowId}`, {
      method: 'GET',
    });
  },

  getByCampaignId: async (campaignId: string) => {
    return apiFetch(`/escrow?campaign_id=${campaignId}`, {
      method: 'GET',
    });
  },

  lock: async (campaignId: string, influencerId: string, amount: number) => {
    return apiFetch('/escrow/lock', {
      method: 'POST',
      body: JSON.stringify({
        campaignId,
        influencerId,
        amount,
      }),
    });
  },

  release: async (escrowId: string) => {
    return apiFetch(`/escrow/${escrowId}/release`, {
      method: 'POST',
    });
  },

  dispute: async (escrowId: string, reason: string) => {
    return apiFetch(`/escrow/${escrowId}/dispute`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },
};

// ============================================================
// AI BRIEF GENERATOR
// ============================================================
export const aiAPI = {
  generateBrief: async (data: {
    campaignName: string;
    objective: string;
    audience: string;
    platform: string;
    tone: string;
    brandName: string;
    brandCategory: string;
  }) => {
    return apiFetch('/generate-brief', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// ============================================================
// SYSTEM LOGS ENDPOINTS
// ============================================================
export const systemLogsAPI = {
  getAll: async () => {
    return apiFetch('/logs', {
      method: 'GET',
    });
  },

  getByActor: async (actorId: string) => {
    return apiFetch(`/logs?actor_id=${actorId}`, {
      method: 'GET',
    });
  },

  create: async (data: {
    action: string;
    details: string;
    actorType: 'umkm' | 'influencer' | 'admin';
  }) => {
    return apiFetch('/logs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
