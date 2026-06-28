/**
 * React Hooks for API calls
 * Simplify data fetching and state management
 */

import { useState, useCallback, useEffect } from 'react';
import { User, Campaign, EscrowTx, CampaignInfluencer } from '../types';
import * as api from './api';

// ============================================================
// useAuth Hook
// ============================================================
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.authAPI.getCurrentUser();
        if (response.user) {
          setUser(response.user);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.authAPI.login(email, password);
      if (response.user) {
        setUser(response.user);
        return response;
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(
    async (data: Parameters<typeof api.authAPI.register>[0]) => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.authAPI.register(data);
        if (response.user) {
          setUser(response.user);
          return response;
        }
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await api.authAPI.logout();
      setUser(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (data: Partial<User>) => {
    if (!user) throw new Error('No user logged in');
    setLoading(true);
    setError(null);
    try {
      const response = await api.authAPI.updateProfile(user.id, data);
      if (response.user) {
        setUser(response.user);
      }
      return response;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  return { user, loading, error, login, register, logout, updateProfile };
};

// ============================================================
// useCampaigns Hook
// ============================================================
export const useCampaigns = (umkmId?: string) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = umkmId
        ? await api.campaignAPI.getByUmkmId(umkmId)
        : await api.campaignAPI.getAll();
      setCampaigns(response.campaigns || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [umkmId]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const createCampaign = useCallback(
    async (data: Parameters<typeof api.campaignAPI.create>[0]) => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.campaignAPI.create(data);
        setCampaigns((prev) => [...prev, response.campaign]);
        return response;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateCampaign = useCallback(
    async (campaignId: string, data: Partial<Campaign>) => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.campaignAPI.update(campaignId, data);
        setCampaigns((prev) =>
          prev.map((c) => (c.id === campaignId ? response.campaign : c))
        );
        return response;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteCampaign = useCallback(async (campaignId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.campaignAPI.delete(campaignId);
      setCampaigns((prev) => prev.filter((c) => c.id !== campaignId));
      return response;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    campaigns,
    loading,
    error,
    fetchCampaigns,
    createCampaign,
    updateCampaign,
    deleteCampaign,
  };
};

// ============================================================
// useCampaignInfluencers Hook
// ============================================================
export const useCampaignInfluencers = (campaignId?: string) => {
  const [influencers, setInfluencers] = useState<CampaignInfluencer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addInfluencer = useCallback(async (influencerId: string) => {
    if (!campaignId) throw new Error('Campaign ID required');
    setLoading(true);
    setError(null);
    try {
      const response = await api.campaignAPI.addInfluencer(
        campaignId,
        influencerId
      );
      setInfluencers((prev) => [...prev, response.campaignInfluencer]);
      return response;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  const removeInfluencer = useCallback(async (influencerId: string) => {
    if (!campaignId) throw new Error('Campaign ID required');
    setLoading(true);
    setError(null);
    try {
      await api.campaignAPI.removeInfluencer(campaignId, influencerId);
      setInfluencers((prev) =>
        prev.filter((inf) => inf.influencer_id !== influencerId)
      );
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  const updateInfluencerStatus = useCallback(
    async (influencerId: string, status: string) => {
      if (!campaignId) throw new Error('Campaign ID required');
      setLoading(true);
      setError(null);
      try {
        const response = await api.campaignAPI.updateInfluencerStatus(
          campaignId,
          influencerId,
          status
        );
        setInfluencers((prev) =>
          prev.map((inf) =>
            inf.influencer_id === influencerId
              ? response.campaignInfluencer
              : inf
          )
        );
        return response;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [campaignId]
  );

  const submitContent = useCallback(
    async (influencerId: string, submissionUrl: string) => {
      if (!campaignId) throw new Error('Campaign ID required');
      setLoading(true);
      setError(null);
      try {
        const response = await api.campaignAPI.submitContent(
          campaignId,
          influencerId,
          submissionUrl
        );
        setInfluencers((prev) =>
          prev.map((inf) =>
            inf.influencer_id === influencerId
              ? response.campaignInfluencer
              : inf
          )
        );
        return response;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [campaignId]
  );

  return {
    influencers,
    loading,
    error,
    addInfluencer,
    removeInfluencer,
    updateInfluencerStatus,
    submitContent,
  };
};

// ============================================================
// useEscrow Hook
// ============================================================
export const useEscrow = () => {
  const [escrows, setEscrows] = useState<EscrowTx[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lock = useCallback(
    async (campaignId: string, influencerId: string, amount: number) => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.escrowAPI.lock(
          campaignId,
          influencerId,
          amount
        );
        setEscrows((prev) => [...prev, response.escrow]);
        return response;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const release = useCallback(async (escrowId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.escrowAPI.release(escrowId);
      setEscrows((prev) =>
        prev.map((e) => (e.id === escrowId ? response.escrow : e))
      );
      return response;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const dispute = useCallback(async (escrowId: string, reason: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.escrowAPI.dispute(escrowId, reason);
      setEscrows((prev) =>
        prev.map((e) => (e.id === escrowId ? response.escrow : e))
      );
      return response;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { escrows, loading, error, lock, release, dispute };
};

// ============================================================
// useUsers Hook
// ============================================================
export const useUsers = (role?: string) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.userAPI.getAll(role);
        setUsers(response.users || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [role]);

  const approveInfluencer = useCallback(async (influencerId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.userAPI.approveInfluencer(influencerId);
      setUsers((prev) =>
        prev.map((u) => (u.id === influencerId ? response.user : u))
      );
      return response;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const rejectInfluencer = useCallback(async (influencerId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.userAPI.rejectInfluencer(influencerId);
      setUsers((prev) =>
        prev.map((u) => (u.id === influencerId ? response.user : u))
      );
      return response;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    users,
    loading,
    error,
    approveInfluencer,
    rejectInfluencer,
  };
};

// ============================================================
// useAI Hook
// ============================================================
export const useAI = () => {
  const [brief, setBrief] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateBrief = useCallback(
    async (data: Parameters<typeof api.aiAPI.generateBrief>[0]) => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.aiAPI.generateBrief(data);
        setBrief(response.brief);
        return response;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { brief, loading, error, generateBrief };
};
