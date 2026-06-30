import { User, Campaign, EscrowTx, SystemLog, WithdrawalTx } from "./types";
import { supabaseDb } from "./lib/supabase";

// Hash helper for secure password storage using browser Crypto API
export async function hashPassword(password: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

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
 * Sinkronisasi awal — selalu mengembalikan true karena kita full Supabase.
 * Fungsi ini dipertahankan agar kompatibel dengan App.tsx.
 */
export async function syncFromSupabase(): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    console.error("Supabase TIDAK dikonfigurasi. Aplikasi tidak bisa berjalan tanpa Supabase.");
    return false;
  }
  try {
    // Tes koneksi ringan
    await supabaseDb.users.list();
    console.log("Koneksi Supabase berhasil.");
    return true;
  } catch (err) {
    console.error("Gagal terkoneksi ke Supabase:", err);
    return false;
  }
}

// =====================================================================
// USER OPERATIONS — Semua baca/tulis langsung ke Supabase
// =====================================================================

export async function getDbUsers(): Promise<User[]> {
  return supabaseDb.users.list();
}

export async function saveDbUser(user: User): Promise<void> {
  try {
    await supabaseDb.users.save(user);
  } catch (err: any) {
    // Jika sudah ada (duplicate), coba update
    if (err?.code === "23505") {
      await supabaseDb.users.update(user.id, user);
    } else {
      throw err;
    }
  }
}

// =====================================================================
// CAMPAIGN OPERATIONS
// =====================================================================

export async function getDbCampaigns(): Promise<Campaign[]> {
  return supabaseDb.campaigns.list();
}

export async function saveDbCampaign(campaign: Campaign): Promise<void> {
  try {
    await supabaseDb.campaigns.save(campaign);
  } catch (err: any) {
    if (err?.code === "23505") {
      await supabaseDb.campaigns.update(campaign.id, campaign);
    } else {
      throw err;
    }
  }
}

// =====================================================================
// ESCROW OPERATIONS
// =====================================================================

export async function getDbEscrow(): Promise<EscrowTx[]> {
  return supabaseDb.escrows.list();
}

export async function saveDbEscrow(tx: EscrowTx): Promise<void> {
  try {
    await supabaseDb.escrows.save(tx);
  } catch (err: any) {
    if (err?.code === "23505") {
      await supabaseDb.escrows.update(tx.id, tx);
    } else {
      throw err;
    }
  }
}

// =====================================================================
// LOG OPERATIONS
// =====================================================================

export async function getDbLogs(): Promise<SystemLog[]> {
  return supabaseDb.logs.list();
}

export async function addDbLog(
  actor: string,
  action: string,
  details: string,
  type: 'umkm' | 'influencer' | 'admin'
): Promise<void> {
  await supabaseDb.logs.add(actor, action, details, type);
}

// =====================================================================
// WITHDRAWAL OPERATIONS
// =====================================================================

export async function getDbWithdrawals(): Promise<WithdrawalTx[]> {
  return supabaseDb.withdrawals.list();
}

export async function saveDbWithdrawal(w: WithdrawalTx): Promise<void> {
  try {
    await supabaseDb.withdrawals.save(w);
  } catch (err: any) {
    if (err?.code === "23505") {
      await supabaseDb.withdrawals.update(w.id, w);
    } else {
      throw err;
    }
  }
}

// =====================================================================
// Unified Async Database Service (Full Supabase)
// =====================================================================
export const db = {
  users: {
    list: (): Promise<User[]> => supabaseDb.users.list(),
    find: (id: string): Promise<User | null> => supabaseDb.users.find(id),
    save: (user: User) => saveDbUser(user),
    update: (id: string, updates: Partial<User>) => supabaseDb.users.update(id, updates),
    delete: (id: string) => supabaseDb.users.delete(id)
  },
  campaigns: {
    list: (): Promise<Campaign[]> => supabaseDb.campaigns.list(),
    find: (id: string): Promise<Campaign | null> =>
      supabaseDb.campaigns.list().then(list => list.find(c => c.id === id) ?? null),
    save: (campaign: Campaign) => saveDbCampaign(campaign),
    update: (id: string, updates: Partial<Campaign>) => supabaseDb.campaigns.update(id, updates),
    delete: (id: string) => supabaseDb.campaigns.delete(id)
  },
  escrows: {
    list: (): Promise<EscrowTx[]> => supabaseDb.escrows.list(),
    find: (id: string): Promise<EscrowTx | null> =>
      supabaseDb.escrows.list().then(list => list.find(e => e.id === id) ?? null),
    save: (tx: EscrowTx) => saveDbEscrow(tx),
    update: (id: string, updates: Partial<EscrowTx>) => supabaseDb.escrows.update(id, updates),
    delete: (id: string) => supabaseDb.escrows.delete(id)
  },
  logs: {
    list: (): Promise<SystemLog[]> => supabaseDb.logs.list(),
    add: addDbLog
  },
  withdrawals: {
    list: (): Promise<WithdrawalTx[]> => supabaseDb.withdrawals.list(),
    save: (w: WithdrawalTx) => saveDbWithdrawal(w),
    update: (id: string, updates: Partial<WithdrawalTx>) => supabaseDb.withdrawals.update(id, updates)
  }
};
