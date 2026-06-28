import { User, Campaign, EscrowTx, SystemLog, CampaignInfluencer } from "./types";

const API_BASE = "/api";

const requestJson = async (path: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || data?.message || "Request failed");
  }

  return data;
};

const toUser = (row: any): User => ({
  id: row.id,
  email: row.email,
  name: row.name,
  role: row.role,
  avatar_url: row.avatar_url ?? row.avatarUrl,
  avatarUrl: row.avatar_url ?? row.avatarUrl,
  city: row.city,
  is_approved: row.is_approved ?? row.isApproved ?? false,
  isApproved: row.is_approved ?? row.isApproved ?? false,
  rating: Number(row.rating ?? 0),
  created_at: row.created_at ?? row.createdAt ?? new Date().toISOString(),
  createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString(),
  updated_at: row.updated_at ?? row.updatedAt ?? new Date().toISOString(),
  updatedAt: row.updated_at ?? row.updatedAt ?? new Date().toISOString(),
  brand_name: row.brand_name ?? row.brandName,
  brandName: row.brand_name ?? row.brandName,
  brand_category: row.brand_category ?? row.brandCategory,
  brandCategory: row.brand_category ?? row.brandCategory,
  handle: row.handle,
  followers: row.followers_num ? `${(Number(row.followers_num) / 1000).toFixed(Number(row.followers_num) >= 10000 ? 0 : 1)}K` : row.followers,
  followersNum: Number(row.followers_num ?? row.followersNum ?? 0),
  price_per_post: Number(row.price_per_post ?? row.pricePerPost ?? 0),
  pricePerPost: row.price_per_post ?? row.pricePerPost,
  niche: Array.isArray(row.niche) ? row.niche : [],
  engagement: Number(row.engagement ?? 0),
  briefText: row.brief_text ?? row.briefText,
  influencers: row.influencers ?? [],
});

const toCampaignInfluencer = (row: any): CampaignInfluencer => ({
  id: row.id,
  campaign_id: row.campaign_id ?? row.campaignId,
  campaignId: row.campaign_id ?? row.campaignId,
  influencer_id: row.influencer_id ?? row.influencerId,
  influencerId: row.influencer_id ?? row.influencerId,
  influencer_name: row.influencer_name ?? row.influencerName ?? "",
  influencerName: row.influencer_name ?? row.influencerName ?? "",
  status: row.status ?? "invited",
  submission_url: row.submission_url ?? row.submissionUrl,
  submissionUrl: row.submission_url ?? row.submissionUrl,
  escrow_released: Boolean(row.escrow_released ?? row.escrowReleased ?? false),
  escrowReleased: Boolean(row.escrow_released ?? row.escrowReleased ?? false),
  created_at: row.created_at ?? row.createdAt ?? new Date().toISOString(),
  createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString(),
  updated_at: row.updated_at ?? row.updatedAt ?? new Date().toISOString(),
  updatedAt: row.updated_at ?? row.updatedAt ?? new Date().toISOString(),
});

const toCampaign = (row: any): Campaign => ({
  id: row.id,
  name: row.name,
  umkm_id: row.umkm_id ?? row.umkmId,
  umkmId: row.umkm_id ?? row.umkmId,
  umkm_name: row.umkm_name ?? row.umkmName ?? "",
  umkmName: row.umkm_name ?? row.umkmName ?? "",
  category: row.category,
  description: row.description ?? "",
  budget: Number(row.budget ?? 0),
  platform: row.platform ?? "",
  brief_text: row.brief_text ?? row.briefText,
  briefText: row.brief_text ?? row.briefText,
  objective: row.objective ?? "",
  audience: row.audience ?? "",
  tone: row.tone ?? "",
  status: row.status ?? "waiting",
  campaign_influencers: Array.isArray(row.campaign_influencers) ? row.campaign_influencers.map(toCampaignInfluencer) : [],
  influencers: Array.isArray(row.campaign_influencers) ? row.campaign_influencers.map(toCampaignInfluencer) : [],
  created_at: row.created_at ?? row.createdAt ?? new Date().toISOString(),
  createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString(),
  updated_at: row.updated_at ?? row.updatedAt ?? new Date().toISOString(),
  updatedAt: row.updated_at ?? row.updatedAt ?? new Date().toISOString(),
});

const toEscrow = (row: any): EscrowTx => ({
  id: row.id,
  campaign_id: row.campaign_id ?? row.campaignId,
  campaignId: row.campaign_id ?? row.campaignId,
  campaign_name: row.campaign_name ?? row.campaignName ?? "",
  campaignName: row.campaign_name ?? row.campaignName ?? "",
  influencer_id: row.influencer_id ?? row.influencerId,
  influencerId: row.influencer_id ?? row.influencerId,
  influencer_name: row.influencer_name ?? row.influencerName ?? "",
  influencerName: row.influencer_name ?? row.influencerName ?? "",
  umkm_id: row.umkm_id ?? row.umkmId,
  umkmId: row.umkm_id ?? row.umkmId,
  amount: Number(row.amount ?? 0),
  status: row.status ?? "pending",
  created_at: row.created_at ?? row.createdAt ?? new Date().toISOString(),
  createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString(),
  updated_at: row.updated_at ?? row.updatedAt ?? new Date().toISOString(),
  updatedAt: row.updated_at ?? row.updatedAt ?? new Date().toISOString(),
  date: row.date ?? (row.created_at ? new Date(row.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : ""),
});

const toLog = (row: any): SystemLog => ({
  id: row.id,
  actor_id: row.actor_id ?? row.actorId,
  actorId: row.actor_id ?? row.actorId,
  actor_name: row.actor_name ?? row.actorName ?? "",
  actorName: row.actor_name ?? row.actorName ?? "",
  actor: row.actor_name ?? row.actorName ?? "",
  action: row.action ?? "",
  details: row.details ?? "",
  actor_type: row.actor_type ?? row.actorType ?? "admin",
  actorType: row.actor_type ?? row.actorType ?? "admin",
  type: row.actor_type ?? row.actorType ?? "admin",
  created_at: row.created_at ?? row.createdAt ?? new Date().toISOString(),
  createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString(),
  date: row.date ?? row.created_at ?? new Date().toISOString(),
});

const toSnakeUser = (row: Partial<User> | any) => ({
  id: row.id,
  email: row.email,
  name: row.name,
  role: row.role,
  avatar_url: row.avatar_url ?? row.avatarUrl,
  city: row.city,
  is_approved: row.is_approved ?? row.isApproved,
  rating: row.rating,
  brand_name: row.brand_name ?? row.brandName,
  brand_category: row.brand_category ?? row.brandCategory,
  handle: row.handle,
  followers_num: row.followers_num ?? row.followersNum,
  price_per_post: row.price_per_post ?? row.pricePerPost,
  niche: row.niche,
  engagement: row.engagement,
});

const toSnakeCampaign = (row: Partial<Campaign> | any) => ({
  id: row.id,
  name: row.name,
  umkm_id: row.umkm_id ?? row.umkmId,
  umkm_name: row.umkm_name ?? row.umkmName,
  category: row.category,
  description: row.description,
  objective: row.objective,
  audience: row.audience,
  platform: row.platform,
  tone: row.tone,
  budget: row.budget,
  brief_text: row.brief_text ?? row.briefText,
  status: row.status,
});

const toSnakeEscrow = (row: Partial<EscrowTx> | any) => ({
  id: row.id,
  campaign_id: row.campaign_id ?? row.campaignId,
  campaign_name: row.campaign_name ?? row.campaignName,
  influencer_id: row.influencer_id ?? row.influencerId,
  influencer_name: row.influencer_name ?? row.influencerName,
  umkm_id: row.umkm_id ?? row.umkmId,
  amount: row.amount,
  status: row.status,
});

export const getDbUsers = async (): Promise<User[]> => {
  const response = await requestJson("/users", { method: "GET" });
  return (response.users || []).map(toUser);
};

export const saveDbUser = async (user: User): Promise<User> => {
  const payload = toSnakeUser(user);
  const endpoint = user.id && !String(user.id).startsWith("temp-") ? `/auth/users/${user.id}` : "/auth/register";
  const method = user.id && !String(user.id).startsWith("temp-") ? "PUT" : "POST";
  const response = await requestJson(endpoint, {
    method,
    body: JSON.stringify(payload),
  });
  return toUser(response.user);
};

export const getDbCampaigns = async (): Promise<Campaign[]> => {
  const response = await requestJson("/campaigns", { method: "GET" });
  return (response.campaigns || []).map(toCampaign);
};

export const saveDbCampaign = async (campaign: Campaign): Promise<Campaign> => {
  const payload = toSnakeCampaign(campaign);
  const isNewCampaign = typeof campaign.id === "string" && campaign.id.startsWith("camp-");
  const response = await requestJson(isNewCampaign ? "/campaigns" : `/campaigns/${campaign.id}`, {
    method: isNewCampaign ? "POST" : "PUT",
    body: JSON.stringify(payload),
  });
  return toCampaign(response.campaign);
};

export const getDbEscrow = async (): Promise<EscrowTx[]> => {
  const response = await requestJson("/escrow", { method: "GET" });
  return (response.escrows || []).map(toEscrow);
};

export const saveDbEscrow = async (tx: EscrowTx): Promise<EscrowTx> => {
  if (tx.status === "released") {
    const response = await requestJson(`/escrow/${tx.id}/release`, { method: "POST" });
    return toEscrow(response.escrow);
  }

  if (tx.id && !String(tx.id).startsWith("tx-")) {
    const response = await requestJson(`/escrow/${tx.id}`, {
      method: "PUT",
      body: JSON.stringify(toSnakeEscrow(tx)),
    });
    return toEscrow(response.escrow);
  }

  const response = await requestJson("/escrow/lock", {
    method: "POST",
    body: JSON.stringify({
      campaignId: tx.campaign_id ?? tx.campaignId,
      influencerId: tx.influencer_id ?? tx.influencerId,
      amount: tx.amount,
    }),
  });
  return toEscrow(response.escrow);
};

export const getDbLogs = async (): Promise<SystemLog[]> => {
  const response = await requestJson("/logs", { method: "GET" });
  return (response.logs || []).map(toLog);
};

export const addDbLog = async (actor: string, action: string, details: string, type: "umkm" | "influencer" | "admin") => {
  const response = await requestJson("/logs", {
    method: "POST",
    body: JSON.stringify({ action, details, actorType: type, actorName: actor }),
  });
  return toLog(response.log);
};

export const resetDatabase = async () => true;

export const DEFAULT_USERS: User[] = [];
export const DEFAULT_CAMPAIGNS: Campaign[] = [];
export const DEFAULT_ESCROW: EscrowTx[] = [];
export const DEFAULT_LOGS: SystemLog[] = [];
