/// <reference types="vite/client" />
import { createClient } from "@supabase/supabase-js";
import { User, Campaign, EscrowTx, SystemLog, WithdrawalTx } from "../types";

// Ambil variabel lingkungan Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://your-supabase-project.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "your-anon-key";

/**
 * Supabase Client yang siap digunakan untuk integrasi database riil.
 * Cukup tambahkan VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY di file .env Anda.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * BACKEND SERVICE INTEGRATION GUIDE (Supabase Ready)
 * 
 * Di bawah ini adalah fungsi adapter 1-to-1 untuk mengganti penyimpanan LocalStorage ke Supabase secara instan.
 * Anda tinggal merefaktorkan pemanggilan di `src/utils.ts` atau komponen dashboard langsung ke fungsi-fungsi di bawah ini:
 */

export function mapDbRowToUser(row: any): User {
  if (!row) return row;
  return {
    id: row.id,
    email: row.email,
    password: row.password,
    name: row.name,
    role: row.role,
    city: row.city,
    brandName: row.brand_name !== undefined ? row.brand_name : row.brandName,
    brandCategory: row.brand_category !== undefined ? row.brand_category : row.brandCategory,
    brandDescription: row.brand_description !== undefined ? row.brand_description : row.brandDescription,
    handle: row.handle,
    followers: row.followers,
    followersNum: row.followers_num !== undefined ? row.followers_num : row.followersNum,
    pricePerPost: row.price_per_post !== undefined ? row.price_per_post : row.pricePerPost,
    niche: row.niche,
    avatarUrl: row.avatar_url !== undefined ? row.avatar_url : row.avatarUrl,
    isApproved: row.is_approved !== undefined ? row.is_approved : row.isApproved,
    engagement: row.engagement,
    rating: row.rating !== undefined ? Number(row.rating) : row.rating,
    status: row.status,
    statusReason: row.status_reason !== undefined ? row.status_reason : row.statusReason,
    warningsCount: row.warnings_count !== undefined ? row.warnings_count : row.warningsCount
  };
}

export const supabaseDb = {
  users: {
    // Mendapatkan semua pengguna atau filter berdasarkan kriteria
    list: async (): Promise<User[]> => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return (data || []).map(mapDbRowToUser);
    },

    // Cari pengguna berdasarkan ID
    find: async (id: string): Promise<User | null> => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error) return null;
      return mapDbRowToUser(data);
    },

    // Menyimpan pengguna baru (Register)
    save: async (user: User): Promise<User> => {
      const { data, error } = await supabase
        .from("users")
        .insert([{
          id: user.id,
          email: user.email,
          password: user.password,
          name: user.name,
          role: user.role,
          brand_name: user.brandName,
          brand_category: user.brandCategory,
          brand_description: user.brandDescription,
          handle: user.handle,
          followers: user.followers,
          followers_num: user.followersNum,
          price_per_post: user.pricePerPost,
          niche: user.niche,
          city: user.city,
          avatar_url: user.avatarUrl,
          is_approved: user.isApproved,
          engagement: user.engagement,
          rating: user.rating
        }])
        .select()
        .single();

      if (error) throw error;
      return mapDbRowToUser(data);
    },

    // Memperbarui profil pengguna
    update: async (id: string, updates: Partial<User>): Promise<User | null> => {
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.brandName !== undefined) dbUpdates.brand_name = updates.brandName;
      if (updates.brandCategory !== undefined) dbUpdates.brand_category = updates.brandCategory;
      if (updates.brandDescription !== undefined) dbUpdates.brand_description = updates.brandDescription;
      if (updates.city !== undefined) dbUpdates.city = updates.city;
      if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
      if (updates.rating !== undefined) dbUpdates.rating = updates.rating;
      if (updates.handle !== undefined) dbUpdates.handle = updates.handle;
      if (updates.followers !== undefined) dbUpdates.followers = updates.followers;
      if (updates.followersNum !== undefined) dbUpdates.followers_num = updates.followersNum;
      if (updates.pricePerPost !== undefined) dbUpdates.price_per_post = updates.pricePerPost;
      if (updates.niche !== undefined) dbUpdates.niche = updates.niche;
      if (updates.isApproved !== undefined) dbUpdates.is_approved = updates.isApproved;
      if (updates.engagement !== undefined) dbUpdates.engagement = updates.engagement;

      const { data, error } = await supabase
        .from("users")
        .update(dbUpdates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return mapDbRowToUser(data);
    },

    // Menghapus pengguna
    delete: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", id);
      if (error) throw error;
    }
  },

  campaigns: {
    // Mendapatkan daftar kampanye
    list: async (): Promise<Campaign[]> => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map(item => ({
        id: item.id,
        name: item.name,
        umkmId: item.umkm_id,
        umkmName: item.umkm_name,
        category: item.category,
        description: item.description,
        budget: Number(item.budget),
        platform: item.platform,
        briefText: item.brief_text,
        objective: item.objective,
        audience: item.audience,
        tone: item.tone,
        status: item.status,
        influencers: item.influencers || [],
        createdAt: item.created_at
      }));
    },

    // Simpan kampanye baru
    save: async (campaign: Campaign): Promise<Campaign> => {
      const { data, error } = await supabase
        .from("campaigns")
        .insert([{
          id: campaign.id,
          name: campaign.name,
          umkm_id: campaign.umkmId,
          umkm_name: campaign.umkmName,
          category: campaign.category,
          description: campaign.description,
          budget: campaign.budget,
          platform: campaign.platform,
          brief_text: campaign.briefText,
          objective: campaign.objective,
          audience: campaign.audience,
          tone: campaign.tone,
          status: campaign.status,
          influencers: campaign.influencers
        }])
        .select()
        .single();

      if (error) throw error;
      return data as unknown as Campaign;
    },

    // Update status kampanye atau daftar influencer terpilih
    update: async (id: string, updates: Partial<Campaign>): Promise<Campaign | null> => {
      const dbUpdates: any = {};
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.influencers !== undefined) dbUpdates.influencers = updates.influencers;
      if (updates.briefText !== undefined) dbUpdates.brief_text = updates.briefText;

      const { data, error } = await supabase
        .from("campaigns")
        .update(dbUpdates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as Campaign;
    },

    // Hapus kampanye
    delete: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from("campaigns")
        .delete()
        .eq("id", id);
      if (error) throw error;
    }
  },

  escrows: {
    // Daftar transaksi Escrow
    list: async (): Promise<EscrowTx[]> => {
      const { data, error } = await supabase
        .from("escrow_tx")
        .select("*")
        .order("date", { ascending: false });

      if (error) throw error;
      return (data || []).map(item => ({
        id: item.id,
        date: item.date,
        campaignId: item.campaign_id,
        campaignName: item.campaign_name,
        influencerId: item.influencer_id,
        influencerName: item.influencer_name,
        amount: Number(item.amount),
        status: item.status
      }));
    },

    // Buat/kunci escrow baru
    save: async (tx: EscrowTx): Promise<EscrowTx> => {
      const { data, error } = await supabase
        .from("escrow_tx")
        .insert([{
          id: tx.id,
          date: tx.date,
          campaign_id: tx.campaignId,
          campaign_name: tx.campaignName,
          influencer_id: tx.influencerId,
          influencer_name: tx.influencerName,
          amount: tx.amount,
          status: tx.status
        }])
        .select()
        .single();

      if (error) throw error;
      return data as unknown as EscrowTx;
    },

    // Update status escrow (release / dispute / lock)
    update: async (id: string, updates: Partial<EscrowTx>): Promise<EscrowTx | null> => {
      const { data, error } = await supabase
        .from("escrow_tx")
        .update({ status: updates.status })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as EscrowTx;
    },

    // Hapus transaksi escrow
    delete: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from("escrow_tx")
        .delete()
        .eq("id", id);
      if (error) throw error;
    }
  },

  logs: {
    // Mendapatkan daftar log
    list: async (): Promise<SystemLog[]> => {
      const { data, error } = await supabase
        .from("system_logs")
        .select("*")
        .order("date", { ascending: false });

      if (error) throw error;
      return (data || []).map(item => ({
        id: item.id,
        date: item.date,
        actor: item.actor,
        action: item.action,
        details: item.details,
        type: item.type as 'umkm' | 'influencer' | 'admin'
      }));
    },

    // Simpan log sistem baru
    add: async (actor: string, action: string, details: string, type: 'umkm' | 'influencer' | 'admin'): Promise<SystemLog> => {
      const { data, error } = await supabase
        .from("system_logs")
        .insert([{
          id: Math.random().toString(36).substring(2, 11),
          date: new Date().toISOString(),
          actor,
          action,
          details,
          type
        }])
        .select()
        .single();

      if (error) throw error;
      return data as unknown as SystemLog;
    }
  },

  withdrawals: {
    // Mendapatkan daftar penarikan dana
    list: async (): Promise<WithdrawalTx[]> => {
      const { data, error } = await supabase
        .from("withdrawals")
        .select("*")
        .order("date", { ascending: false });

      if (error) throw error;
      return (data || []).map(item => ({
        id: item.id,
        influencerId: item.influencer_id,
        influencerName: item.influencer_name,
        amount: Number(item.amount),
        bankName: item.bank_name,
        accountNo: item.account_no,
        accountHolder: item.account_holder,
        status: item.status,
        date: item.date
      }));
    },

    // Ajukan penarikan dana baru
    save: async (w: WithdrawalTx): Promise<WithdrawalTx> => {
      const { data, error } = await supabase
        .from("withdrawals")
        .insert([{
          id: w.id,
          influencer_id: w.influencerId,
          influencer_name: w.influencerName,
          amount: w.amount,
          bank_name: w.bankName,
          account_no: w.accountNo,
          account_holder: w.accountHolder,
          status: w.status,
          date: w.date
        }])
        .select()
        .single();

      if (error) throw error;
      return data as unknown as WithdrawalTx;
    },

    // Update status penarikan dana
    update: async (id: string, updates: Partial<WithdrawalTx>): Promise<WithdrawalTx | null> => {
      const dbUpdates: any = {};
      if (updates.status !== undefined) dbUpdates.status = updates.status;

      const { data, error } = await supabase
        .from("withdrawals")
        .update(dbUpdates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as WithdrawalTx;
    }
  }
};

/**
 * Mengunggah file gambar ke Supabase Storage (bucket: avatars)
 * Jika bucket belum ada, akan mencoba membuat bucket terlebih dahulu.
 * Mengembalikan string URL publik dari gambar yang diunggah.
 */
export const uploadAvatarToSupabase = async (userId: string, file: File): Promise<string> => {
  const fileExt = file.name.split(".").pop() || "jpg";
  const fileName = `${userId}-${Date.now()}.${fileExt}`;

  // Coba buat bucket 'avatars' jika belum ada (abaikan jika gagal karena keterbatasan hak akses)
  try {
    await supabase.storage.createBucket("avatars", {
      public: true,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    });
  } catch (err) {
    console.log("Bucket 'avatars' check/creation bypassed:", err);
  }

  const { data, error } = await supabase.storage
    .from("avatars")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: true
    });

  if (error) throw error;

  const { data: publicUrlData } = supabase.storage
    .from("avatars")
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
};
;
