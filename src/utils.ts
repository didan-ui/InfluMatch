import { User, Campaign, EscrowTx, SystemLog, WithdrawalTx, Report, ChatMessage } from "./types";
import { supabaseDb, uploadAvatarToSupabase } from "./lib/supabase";

// Seed data
export const DEFAULT_USERS: User[] = [
  {
    id: "admin-1",
    email: "admin@influmatch.com",
    password: "2407364911aa2437c9a1a4bf71b3e85215003923e55ec0e91a970e20f4e3c835", // "admin123"
    name: "Admin InfluMatch",
    role: "admin",
    city: "Malang",
    isApproved: true,
    avatarUrl: "AD"
  },
  {
    id: "umkm-1",
    email: "kedai@influmatch.com",
    password: "f1604a1879c293786f1f237f8fa3f80c2f823298d0224df020084c8a29a032d8", // "umkm123"
    name: "Siti Lestari",
    role: "umkm",
    city: "Malang",
    brandName: "Kedai Kopi Kampus",
    brandCategory: "Kuliner",
    brandDescription: "Warung kopi estetik di dekat kampus Universitas Brawijaya Malang.",
    isApproved: true,
    avatarUrl: "SL"
  },
  {
    id: "umkm-2",
    email: "hijab@influmatch.com",
    password: "f1604a1879c293786f1f237f8fa3f80c2f823298d0224df020084c8a29a032d8", // "umkm123"
    name: "Anisa Hijab",
    role: "umkm",
    city: "Malang",
    brandName: "Hijab Modern Malang",
    brandCategory: "Fashion",
    brandDescription: "Penyedia jilbab modern kualitas premium dengan harga mahasiswa.",
    isApproved: true,
    avatarUrl: "AH"
  },
  {
    id: "influencer-1",
    email: "siska@influmatch.com",
    password: "a510f885f81f4f5f543df516109dfb67be30b05b38d689b78fe23023e9a5beee", // "influencer123"
    name: "Siska Amelia (UB)",
    role: "influencer",
    city: "Malang",
    handle: "@siskarahayu",
    followers: "10K",
    followersNum: 10000,
    pricePerPost: "Rp250.000",
    niche: ["Kuliner", "Lifestyle"],
    isApproved: true,
    engagement: "8.2%",
    rating: 4.9,
    avatarUrl: "SA"
  },
  {
    id: "influencer-2",
    email: "budi@influmatch.com",
    password: "a510f885f81f4f5f543df516109dfb67be30b05b38d689b78fe23023e9a5beee", // "influencer123"
    name: "Budi Santoso (UM)",
    role: "influencer",
    city: "Malang",
    handle: "@budi.kuliner",
    followers: "25K",
    followersNum: 25000,
    pricePerPost: "Rp400.000",
    niche: ["Kuliner"],
    isApproved: true,
    engagement: "6.5%",
    rating: 4.8,
    avatarUrl: "BS"
  },
  {
    id: "influencer-3",
    email: "diana@influmatch.com",
    password: "a510f885f81f4f5f543df516109dfb67be30b05b38d689b78fe23023e9a5beee", // "influencer123"
    name: "Diana Safitri (UMM)",
    role: "influencer",
    city: "Malang",
    handle: "@diana_ootd",
    followers: "5K",
    followersNum: 5000,
    pricePerPost: "Rp150.000",
    niche: ["Fashion", "Kecantikan"],
    isApproved: true,
    engagement: "9.1%",
    rating: 4.7,
    avatarUrl: "DS"
  }
];

export const DEFAULT_CAMPAIGNS: Campaign[] = [
  {
    id: "camp-1",
    name: "Video Review Es Kopi Latte Gula Aren",
    umkmId: "umkm-1",
    umkmName: "Kedai Kopi Kampus",
    category: "Kuliner",
    description: "Mencari mahasiswa kreatif Malang untuk mereview varian es kopi latte gula aren andalan kami dengan konsep estetik dan sinematik berdurasi 30-60 detik.",
    budget: 250000,
    platform: "TikTok",
    objective: "Meningkatkan brand awareness warung kopi kami di kalangan mahasiswa baru UB.",
    audience: "Mahasiswa aktif Malang",
    tone: "Ceria, Santai, Estetik",
    status: "active",
    briefText: "Buat video transisi estetik menunjukkan pembuatan es kopi latte lalu reaksimu saat meminumnya di area outdoor kedai kami. Gunakan sound viral.",
    influencers: [
      {
        influencerId: "influencer-1",
        influencerName: "Siska Amelia (UB)",
        status: "brief_ready"
      }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: "camp-2",
    name: "OOTD Hijab Pashmina Kaos Malang",
    umkmId: "umkm-2",
    umkmName: "Hijab Modern Malang",
    category: "Fashion",
    description: "Kolaborasi konten padu padan (OOTD) menggunakan produk hijab pashmina kaos berkualitas tinggi dari butik kami untuk jalan-jalan sore di Kota Batu.",
    budget: 150000,
    platform: "Instagram Reel",
    objective: "Mengenalkan bahan hijab pashmina kaos anti-lecek terbaru.",
    audience: "Hijabers Muda Malang Raya",
    tone: "Trendy, Casual, Syar'i Modern",
    status: "active",
    briefText: "Tunjukkan minimal 3 outfit kombinasi pashmina kaos kami dengan style pakaian kasual mahasiswa. Cantumkan lokasi butik kami di Malang.",
    influencers: [
      {
        influencerId: "influencer-3",
        influencerName: "Diana Safitri (UMM)",
        status: "applied"
      }
    ],
    createdAt: new Date().toISOString()
  }
];

export const DEFAULT_ESCROW: EscrowTx[] = [
  {
    id: "esc-1",
    date: new Date(Date.now() - 3600000 * 12).toISOString(),
    campaignId: "camp-1",
    campaignName: "Video Review Es Kopi Latte Gula Aren",
    influencerId: "influencer-1",
    influencerName: "Siska Amelia (UB)",
    amount: 250000,
    status: "locked"
  }
];

export const DEFAULT_LOGS: SystemLog[] = [
  {
    id: "log-seed-1",
    date: new Date(Date.now() - 3600000 * 24).toISOString(),
    actor: "System Auto-Sync",
    action: "Platform Initialized",
    details: "Sistem sinergi UMKM dan mahasiswa Malang Raya aktif.",
    type: "admin"
  },
  {
    id: "log-seed-2",
    date: new Date(Date.now() - 3600000 * 12).toISOString(),
    actor: "Siti Lestari",
    action: "Membuat Kampanye",
    details: "Mempublikasikan proyek baru: 'Video Review Es Kopi Latte Gula Aren'",
    type: "umkm"
  }
];

export const DEFAULT_WITHDRAWALS: WithdrawalTx[] = [
  {
    id: "wd-1",
    influencerId: "influencer-1",
    influencerName: "Siska Amelia (UB)",
    amount: 500000,
    bankName: "Bank Central Asia (BCA)",
    accountNo: "3150998811",
    accountHolder: "Siska Amelia",
    status: "pending",
    date: new Date(Date.now() - 3600000 * 4).toISOString() // 4 jam yang lalu
  }
];

/**
 * Memeriksa apakah Supabase dikonfigurasi dengan benar di .env.
 */
export function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return !!(
    url &&
    key &&
    url !== "https://your-supabase-project.supabase.co" &&
    key !== "your-anon-key" &&
    url.trim().length > 0 &&
    key.trim().length > 0
  );
}

/**
 * Sinkronisasi data dari Supabase ke LocalStorage saat aplikasi pertama kali dimuat.
 */
export async function syncFromSupabase(): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    console.log("Supabase is not configured yet. Running on LocalStorage fallback.");
    return false;
  }
  try {
    console.log("Supabase URL and Key found! Synchronizing local cache with Supabase...");
    
    // Ambil data dari Supabase
    let users = await supabaseDb.users.list();
    let campaigns = await supabaseDb.campaigns.list();
    let escrows = await supabaseDb.escrows.list();
    let logs = await supabaseDb.logs.list();
    let withdrawals = await supabaseDb.withdrawals.list();

    // Auto-Seeding jika Supabase terhubung tapi tabel Users masih kosong
    if (users.length === 0) {
      console.log("Supabase connected but 'users' table is empty. Seeding default demo data...");
      try {
        // Simpan berurutan sesuai relasi foreign-key:
        // 1. Users
        for (const user of DEFAULT_USERS) {
          await supabaseDb.users.save(user);
        }
        // 2. Campaigns
        for (const camp of DEFAULT_CAMPAIGNS) {
          await supabaseDb.campaigns.save(camp);
        }
        // 3. Escrows, Logs, Withdrawals
        for (const esc of DEFAULT_ESCROW) {
          await supabaseDb.escrows.save(esc);
        }
        for (const log of DEFAULT_LOGS) {
          await supabaseDb.logs.add(log.actor, log.action, log.details, log.type);
        }
        for (const wd of DEFAULT_WITHDRAWALS) {
          await supabaseDb.withdrawals.save(wd);
        }
        console.log("Auto-seeding Supabase completed successfully!");

        // Ambil ulang data ter-seeding
        users = await supabaseDb.users.list();
        campaigns = await supabaseDb.campaigns.list();
        escrows = await supabaseDb.escrows.list();
        logs = await supabaseDb.logs.list();
        withdrawals = await supabaseDb.withdrawals.list();
      } catch (seedErr) {
        console.error("Failed to auto-seed Supabase tables:", seedErr);
      }
    }

    localStorage.setItem("im_users", JSON.stringify(users));
    localStorage.setItem("im_campaigns", JSON.stringify(campaigns));
    localStorage.setItem("im_escrow", JSON.stringify(escrows));
    localStorage.setItem("im_logs", JSON.stringify(logs));
    localStorage.setItem("im_withdrawals", JSON.stringify(withdrawals));
    
    console.log("Supabase synchronization complete! Cache updated.");
    return true;
  } catch (err) {
    console.error("Warning: Could not fetch data from Supabase. It might be due to pending tables/schema setup. Running with LocalStorage. Error:", err);
    return false;
  }
}

export function getDbUsers(): User[] {
  const users = localStorage.getItem("im_users");
  if (!users) {
    localStorage.setItem("im_users", JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
  }
  const parsed = JSON.parse(users);
  if (parsed.length === 0) {
    return DEFAULT_USERS;
  }
  return parsed;
}

export function saveDbUser(user: User) {
  const users = getDbUsers();
  const existingIndex = users.findIndex(u => u.id === user.id);
  if (existingIndex > -1) {
    users[existingIndex] = user;
    if (isSupabaseConfigured()) {
      supabaseDb.users.update(user.id, user).catch(err => console.error("Error updating user in Supabase:", err));
    }
  } else {
    users.push(user);
    if (isSupabaseConfigured()) {
      supabaseDb.users.save(user).catch(err => console.error("Error saving user to Supabase:", err));
    }
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
    if (isSupabaseConfigured()) {
      supabaseDb.campaigns.update(campaign.id, campaign).catch(err => console.error("Error updating campaign in Supabase:", err));
    }
  } else {
    camps.push(campaign);
    if (isSupabaseConfigured()) {
      supabaseDb.campaigns.save(campaign).catch(err => console.error("Error saving campaign to Supabase:", err));
    }
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
    if (isSupabaseConfigured()) {
      supabaseDb.escrows.update(tx.id, tx).catch(err => console.error("Error updating escrow in Supabase:", err));
    }
  } else {
    escRows.push(tx);
    if (isSupabaseConfigured()) {
      supabaseDb.escrows.save(tx).catch(err => console.error("Error saving escrow to Supabase:", err));
    }
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
  if (isSupabaseConfigured()) {
    supabaseDb.logs.add(actor, action, details, type).catch(err => console.error("Error adding system log in Supabase:", err));
  }
}

export function getDbWithdrawals(): WithdrawalTx[] {
  const ws = localStorage.getItem("im_withdrawals");
  if (!ws) {
    localStorage.setItem("im_withdrawals", JSON.stringify(DEFAULT_WITHDRAWALS));
    return DEFAULT_WITHDRAWALS;
  }
  return JSON.parse(ws);
}

export function saveDbWithdrawal(w: WithdrawalTx) {
  const ws = getDbWithdrawals();
  const existingIdx = ws.findIndex(x => x.id === w.id);
  if (existingIdx > -1) {
    ws[existingIdx] = w;
    if (isSupabaseConfigured()) {
      supabaseDb.withdrawals.update(w.id, w).catch(err => console.error("Error updating withdrawal in Supabase:", err));
    }
  } else {
    ws.push(w);
    if (isSupabaseConfigured()) {
      supabaseDb.withdrawals.save(w).catch(err => console.error("Error saving withdrawal to Supabase:", err));
    }
  }
  localStorage.setItem("im_withdrawals", JSON.stringify(ws));
}

export function getDbReports(): Report[] {
  if (typeof window === "undefined") return [];
  const reports = localStorage.getItem("im_reports");
  return reports ? JSON.parse(reports) : [];
}

export function saveDbReport(r: Report) {
  const reports = getDbReports();
  const existingIdx = reports.findIndex(x => x.id === r.id);
  if (existingIdx > -1) {
    reports[existingIdx] = r;
  } else {
    reports.push(r);
  }
  localStorage.setItem("im_reports", JSON.stringify(reports));
  return r;
}

export function getDbChats(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  const chats = localStorage.getItem("im_chats");
  return chats ? JSON.parse(chats) : [];
}

export function saveDbChat(m: ChatMessage) {
  const chats = getDbChats();
  chats.push(m);
  localStorage.setItem("im_chats", JSON.stringify(chats));
  return m;
}

// Reset LocalStorage back to pristine seed (utility to let users test from scratch)
export function resetDatabase() {
  localStorage.removeItem("im_users");
  localStorage.removeItem("im_campaigns");
  localStorage.removeItem("im_escrow");
  localStorage.removeItem("im_withdrawals");
  localStorage.removeItem("im_logs");
  localStorage.removeItem("im_reports");
  localStorage.removeItem("im_chats");
  getDbUsers();
  getDbCampaigns();
  getDbEscrow();
  getDbWithdrawals();
  getDbLogs();
}

// Unified Local Database Service wrapper (Supabase-ready design)
export const db = {
  users: {
    list: getDbUsers,
    find: (id: string) => getDbUsers().find(u => u.id === id),
    save: saveDbUser,
    update: (id: string, updates: Partial<User>) => {
      const users = getDbUsers();
      const idx = users.findIndex(u => u.id === id);
      if (idx > -1) {
        users[idx] = { ...users[idx], ...updates };
        localStorage.setItem("im_users", JSON.stringify(users));
        if (isSupabaseConfigured()) {
          supabaseDb.users.update(id, updates).catch(err => console.error("Error updating user in Supabase:", err));
        }
        return users[idx];
      }
      return null;
    },
    delete: (id: string) => {
      const users = getDbUsers().filter(u => u.id !== id);
      localStorage.setItem("im_users", JSON.stringify(users));
      if (isSupabaseConfigured()) {
        supabaseDb.users.delete(id).catch(err => console.error("Error deleting user in Supabase:", err));
      }
    }
  },
  campaigns: {
    list: getDbCampaigns,
    find: (id: string) => getDbCampaigns().find(c => c.id === id),
    save: saveDbCampaign,
    update: (id: string, updates: Partial<Campaign>) => {
      const camps = getDbCampaigns();
      const idx = camps.findIndex(c => c.id === id);
      if (idx > -1) {
        camps[idx] = { ...camps[idx], ...updates };
        localStorage.setItem("im_campaigns", JSON.stringify(camps));
        if (isSupabaseConfigured()) {
          supabaseDb.campaigns.update(id, updates).catch(err => console.error("Error updating campaign in Supabase:", err));
        }
        return camps[idx];
      }
      return null;
    },
    delete: (id: string) => {
      const camps = getDbCampaigns().filter(c => c.id !== id);
      localStorage.setItem("im_campaigns", JSON.stringify(camps));
      if (isSupabaseConfigured()) {
        supabaseDb.campaigns.delete(id).catch(err => console.error("Error deleting campaign in Supabase:", err));
      }
    }
  },
  escrows: {
    list: getDbEscrow,
    find: (id: string) => getDbEscrow().find(e => e.id === id),
    save: saveDbEscrow,
    update: (id: string, updates: Partial<EscrowTx>) => {
      const escrows = getDbEscrow();
      const idx = escrows.findIndex(e => e.id === id);
      if (idx > -1) {
        escrows[idx] = { ...escrows[idx], ...updates };
        localStorage.setItem("im_escrow", JSON.stringify(escrows));
        if (isSupabaseConfigured()) {
          supabaseDb.escrows.update(id, updates).catch(err => console.error("Error updating escrow in Supabase:", err));
        }
        return escrows[idx];
      }
      return null;
    },
    delete: (id: string) => {
      const escrows = getDbEscrow().filter(e => e.id !== id);
      localStorage.setItem("im_escrow", JSON.stringify(escrows));
      if (isSupabaseConfigured()) {
        supabaseDb.escrows.delete(id).catch(err => console.error("Error deleting escrow in Supabase:", err));
      }
    }
  },
  logs: {
    list: getDbLogs,
    add: addDbLog
  },
  withdrawals: {
    list: getDbWithdrawals,
    save: saveDbWithdrawal,
    update: (id: string, updates: Partial<WithdrawalTx>) => {
      const ws = getDbWithdrawals();
      const idx = ws.findIndex(x => x.id === id);
      if (idx > -1) {
        ws[idx] = { ...ws[idx], ...updates };
        localStorage.setItem("im_withdrawals", JSON.stringify(ws));
        if (isSupabaseConfigured()) {
          supabaseDb.withdrawals.update(id, updates).catch(err => console.error("Error updating withdrawal in Supabase:", err));
        }
        return ws[idx];
      }
      return null;
    }
  },
  reports: {
    list: getDbReports,
    save: saveDbReport,
    update: (id: string, updates: Partial<Report>) => {
      const rs = getDbReports();
      const idx = rs.findIndex(x => x.id === id);
      if (idx > -1) {
        rs[idx] = { ...rs[idx], ...updates };
        localStorage.setItem("im_reports", JSON.stringify(rs));
        return rs[idx];
      }
      return null;
    }
  },
  chats: {
    list: getDbChats,
    save: saveDbChat,
    unreadCount: (userId: string) => {
      return getDbChats().filter(m => m.receiverId === userId && !m.read).length;
    },
    markAsRead: (campaignId: string, userId: string) => {
      const chats = getDbChats();
      let changed = false;
      chats.forEach(m => {
        if (m.campaignId === campaignId && m.receiverId === userId && !m.read) {
          m.read = true;
          changed = true;
        }
      });
      if (changed) {
        localStorage.setItem("im_chats", JSON.stringify(chats));
      }
    }
  }
};

// Hash helper for secure local password storage using browser Crypto API
export async function hashPassword(password: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Auto-migration/cleanup logic for old local storage versions
if (typeof window !== "undefined") {
  const CURRENT_VERSION = "v6_seeded_and_admin";
  const storedVersion = localStorage.getItem("im_db_version");
  if (storedVersion !== CURRENT_VERSION) {
    localStorage.removeItem("im_users");
    localStorage.removeItem("im_campaigns");
    localStorage.removeItem("im_escrow");
    localStorage.removeItem("im_logs");
    localStorage.removeItem("im_withdrawals");
    localStorage.setItem("im_db_version", CURRENT_VERSION);
  }
}

/**
 * Update foto profil dengan mengunggah gambar ke Supabase Storage (bila terkonfigurasi)
 * atau mengonversi ke Base64 (bila offline) lalu menyimpannya ke database pengguna.
 */
export async function updateProfilePicture(userId: string, file: File): Promise<string> {
  let url = "";
  if (isSupabaseConfigured()) {
    try {
      url = await uploadAvatarToSupabase(userId, file);
    } catch (err) {
      console.warn("Supabase storage upload failed, falling back to base64 encoding", err);
      url = await fileToBase64(file);
    }
  } else {
    url = await fileToBase64(file);
  }

  // Update ke database pengguna
  const updatedUser = db.users.update(userId, { avatarUrl: url });
  if (!updatedUser) {
    throw new Error("Pengguna tidak ditemukan");
  }

  return url;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}
