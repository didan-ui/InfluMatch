import { User, Campaign, EscrowTx, SystemLog } from "./types";

// Seed data
export const DEFAULT_USERS: User[] = [
  {
    id: "umkm-1",
    email: "budi@umkm.com",
    name: "Pak Budi",
    role: "umkm",
    brandName: "Ayam Geprek Pak Budi",
    brandCategory: "Kuliner",
    city: "Malang",
    isApproved: true,
    avatarUrl: "PB"
  },
  {
    id: "inf-1",
    email: "siska@influencer.com",
    name: "Siska Rahayu",
    role: "influencer",
    handle: "@siskarahayu",
    followers: "5.1K",
    followersNum: 5100,
    pricePerPost: "Rp250.000",
    niche: ["Kuliner", "Lifestyle"],
    city: "Malang",
    isApproved: true,
    avatarUrl: "SR",
    engagement: "8.2%",
    rating: 4.9
  },
  {
    id: "inf-2",
    email: "andi@influencer.com",
    name: "Andi Pratama",
    role: "influencer",
    handle: "@andipratama",
    followers: "7.8K",
    followersNum: 7800,
    pricePerPost: "Rp350.000",
    niche: ["Fashion", "Lifestyle"],
    city: "Malang",
    isApproved: true,
    avatarUrl: "AP",
    engagement: "6.5%",
    rating: 4.7
  },
  {
    id: "inf-3",
    email: "nadia@influencer.com",
    name: "Nadia Kirana",
    role: "influencer",
    handle: "@nadiakirana",
    followers: "12K",
    followersNum: 12000,
    pricePerPost: "Rp500.000",
    niche: ["Kecantikan"],
    city: "Surabaya",
    isApproved: true,
    avatarUrl: "NK",
    engagement: "7.9%",
    rating: 4.8
  },
  {
    id: "inf-4",
    email: "dimas@influencer.com",
    name: "Dimas Kurniawan",
    role: "influencer",
    handle: "@dimaskurnia",
    followers: "9.4K",
    followersNum: 9400,
    pricePerPost: "Rp400.000",
    niche: ["Kuliner"],
    city: "Malang",
    isApproved: true,
    avatarUrl: "DK",
    engagement: "9.1%",
    rating: 4.9
  },
  {
    id: "admin-1",
    email: "admin@influmatch.com",
    name: "Admin Utama",
    role: "admin",
    isApproved: true,
    avatarUrl: "AD"
  }
];

export const DEFAULT_CAMPAIGNS: Campaign[] = [
  {
    id: "camp-1",
    name: "Promo Geprek Lava",
    umkmId: "umkm-1",
    umkmName: "Ayam Geprek Pak Budi",
    category: "Kuliner",
    description: "Memperkenalkan menu andalan super pedas Geprek Lava kepada mahasiswa lokal.",
    budget: 450000,
    platform: "TikTok",
    objective: "Brand Awareness",
    audience: "Mahasiswa",
    tone: "Fun & Casual",
    status: "active",
    createdAt: "2026-05-10",
    briefText: `### 🌟 BRIEF: Promo Geprek Lava\n\n**Do's:** Tampilkan keju leleh di atas ayam geprek secara estetik dan dramatis.\n\n**Don'ts:** Jangan membandingkan kepedasan geprek kita dengan kompetitor.`,
    influencers: [
      {
        influencerId: "inf-1",
        influencerName: "Siska Rahayu",
        status: "escrow_locked"
      },
      {
        influencerId: "inf-4",
        influencerName: "Dimas Kurniawan",
        status: "content_uploaded",
        submissionUrl: "https://tiktok.com/@dimaskurnia/video/73821092812"
      }
    ]
  },
  {
    id: "camp-2",
    name: "Menu Pedas Baru",
    umkmId: "umkm-1",
    umkmName: "Ayam Geprek Pak Budi",
    category: "Kuliner",
    description: "Meningkatkan penjualan menu geprek sambal matah.",
    budget: 700000,
    platform: "Instagram",
    objective: "Penjualan",
    audience: "Mahasiswa",
    tone: "Friendly",
    status: "waiting",
    createdAt: "2026-05-20",
    influencers: [
      {
        influencerId: "inf-1",
        influencerName: "Siska Rahayu",
        status: "invited"
      }
    ]
  },
  {
    id: "camp-3",
    name: "Midnight Combo",
    umkmId: "umkm-1",
    umkmName: "Ayam Geprek Pak Budi",
    category: "Kuliner",
    description: "Promo akhir bulan khusus mahasiswa diskon 30% setelah jam 9 malam.",
    budget: 300000,
    platform: "TikTok",
    objective: "Engagement",
    audience: "Mahasiswa",
    tone: "Friendly",
    status: "completed",
    createdAt: "2026-04-28",
    briefText: "Review jajanan hemat malam hari.",
    influencers: [
      {
        influencerId: "inf-4",
        influencerName: "Dimas Kurniawan",
        status: "completed",
        submissionUrl: "https://tiktok.com/@dimaskurnia/video/72120381023",
        escrowReleased: true
      }
    ]
  }
];

export const DEFAULT_ESCROW: EscrowTx[] = [
  {
    id: "tx-1",
    date: "12 Mei 2026",
    campaignId: "camp-3",
    campaignName: "Midnight Combo",
    influencerId: "inf-4",
    influencerName: "Dimas Kurniawan",
    amount: 300000,
    status: "released"
  },
  {
    id: "tx-2",
    date: "15 Mei 2026",
    campaignId: "camp-1",
    campaignName: "Promo Geprek Lava",
    influencerId: "inf-1",
    influencerName: "Siska Rahayu",
    amount: 450000,
    status: "locked"
  },
  {
    id: "tx-3",
    date: "22 Mei 2026",
    campaignId: "camp-1",
    campaignName: "Promo Geprek Lava",
    influencerId: "inf-4",
    influencerName: "Dimas Kurniawan",
    amount: 450000,
    status: "pending"
  }
];

export const DEFAULT_LOGS: SystemLog[] = [
  {
    id: "log-1",
    date: "2026-06-01T10:30:12Z",
    actor: "Pak Budi",
    action: "Membuat Campaign",
    details: "Membuat campaign 'Promo Geprek Lava' dengan budget Rp450.000",
    type: "umkm"
  },
  {
    id: "log-2",
    date: "2026-06-01T12:00:24Z",
    actor: "Siska Rahayu",
    action: "Menerima Undangan",
    details: "Siska menyetujui invitation dari Ayam Geprek Pak Budi",
    type: "influencer"
  },
  {
    id: "log-3",
    date: "2026-06-02T03:15:00Z",
    actor: "Admin Utama",
    action: "Pelepasan Escrow",
    details: "Dana escrow sebesar Rp300.000 dilepaskan ke Dimas Kurniawan",
    type: "admin"
  }
];

export function getDbUsers(): User[] {
  const users = localStorage.getItem("im_users");
  if (!users) {
    localStorage.setItem("im_users", JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
  }
  return JSON.parse(users);
}

export function saveDbUser(user: User) {
  const users = getDbUsers();
  const existingIndex = users.findIndex(u => u.id === user.id);
  if (existingIndex > -1) {
    users[existingIndex] = user;
  } else {
    users.push(user);
  }
  localStorage.setItem("im_users", JSON.stringify(users));
}

export function getDbCampaigns(): Campaign[] {
  const camps = localStorage.getItem("im_campaigns");
  if (!camps) {
    localStorage.setItem("im_campaigns", JSON.stringify(DEFAULT_CAMPAIGNS));
    return DEFAULT_CAMPAIGNS;
  }
  return JSON.parse(camps);
}

export function saveDbCampaign(campaign: Campaign) {
  const camps = getDbCampaigns();
  const existingIndex = camps.findIndex(c => c.id === campaign.id);
  if (existingIndex > -1) {
    camps[existingIndex] = campaign;
  } else {
    camps.push(campaign);
  }
  localStorage.setItem("im_campaigns", JSON.stringify(camps));
}

export function getDbEscrow(): EscrowTx[] {
  const esc = localStorage.getItem("im_escrow");
  if (!esc) {
    localStorage.setItem("im_escrow", JSON.stringify(DEFAULT_ESCROW));
    return DEFAULT_ESCROW;
  }
  return JSON.parse(esc);
}

export function saveDbEscrow(tx: EscrowTx) {
  const escRows = getDbEscrow();
  const existingIdx = escRows.findIndex(e => e.id === tx.id);
  if (existingIdx > -1) {
    escRows[existingIdx] = tx;
  } else {
    escRows.push(tx);
  }
  localStorage.setItem("im_escrow", JSON.stringify(escRows));
}

export function getDbLogs(): SystemLog[] {
  const logs = localStorage.getItem("im_logs");
  if (!logs) {
    localStorage.setItem("im_logs", JSON.stringify(DEFAULT_LOGS));
    return DEFAULT_LOGS;
  }
  return JSON.parse(logs);
}

export function addDbLog(actor: string, action: string, details: string, type: 'umkm' | 'influencer' | 'admin') {
  const logs = getDbLogs();
  const newLog: SystemLog = {
    id: "log-" + Date.now(),
    date: new Date().toISOString(),
    actor,
    action,
    details,
    type
  };
  logs.unshift(newLog);
  localStorage.setItem("im_logs", JSON.stringify(logs));
}

// Reset LocalStorage back to pristine seed (utility to let users test from scratch)
export function resetDatabase() {
  localStorage.removeItem("im_users");
  localStorage.removeItem("im_campaigns");
  localStorage.removeItem("im_escrow");
  localStorage.removeItem("im_logs");
  getDbUsers();
  getDbCampaigns();
  getDbEscrow();
  getDbLogs();
}
