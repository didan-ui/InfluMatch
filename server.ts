import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded GoogleGenAI client to avoid crashes on startup if secret is missing
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY_MISSING");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// ============================================================
// AUTH ENDPOINTS
// ============================================================
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !data) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // TODO: Implement proper password hashing and verification
    res.json({
      success: true,
      message: "Login successful",
      user: data,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/auth/register", async (req, res) => {
  const { email, password, name, role, brandName, brandCategory, handle, city } = req.body;
  try {
    // Validate required fields
    if (!email || !password || !name || !role) {
      return res.status(400).json({ 
        success: false, 
        error: "Email, password, name, dan role harus diisi" 
      });
    }

    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          email,
          name,
          role,
          brand_name: brandName || null,
          brand_category: brandCategory || null,
          handle: handle || null,
          city: city || null,
          is_approved: false,
          rating: 0,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      throw error;
    }

    res.json({
      success: true,
      message: "Registration successful",
      user: data,
    });
  } catch (error: any) {
    console.error("Register endpoint error:", error);
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post("/api/auth/logout", (req, res) => {
  res.json({ success: true, message: "Logout successful" });
});

app.get("/api/auth/me", async (req, res) => {
  // TODO: Extract user from JWT token in request headers
  res.json({ success: true, message: "User fetched" });
});

app.put("/api/auth/users/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const { data, error } = await supabase
      .from("users")
      .update(req.body)
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: "Profile updated",
      user: data,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ============================================================
// USER ENDPOINTS
// ============================================================
app.get("/api/users", async (req, res) => {
  try {
    const { role } = req.query;
    let query = supabase.from("users").select("*");

    if (role) {
      query = query.eq("role", role);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json({ success: true, users: data });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get("/api/users/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw error;

    res.json({ success: true, user: data });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post("/api/users/:influencerId/approve", async (req, res) => {
  const { influencerId } = req.params;
  try {
    const { data, error } = await supabase
      .from("users")
      .update({ is_approved: true })
      .eq("id", influencerId)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, message: "Influencer approved", user: data });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post("/api/users/:influencerId/reject", async (req, res) => {
  const { influencerId } = req.params;
  try {
    const { data, error } = await supabase
      .from("users")
      .update({ is_approved: false })
      .eq("id", influencerId)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, message: "Influencer rejected", user: data });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ============================================================
// CAMPAIGN ENDPOINTS
// ============================================================
app.get("/api/campaigns", async (req, res) => {
  try {
    const { umkm_id, status } = req.query;
    let query = supabase
      .from("campaigns")
      .select("*, campaign_influencers(*)");

    if (umkm_id) {
      query = query.eq("umkm_id", umkm_id);
    }
    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json({ success: true, campaigns: data });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get("/api/campaigns/:campaignId", async (req, res) => {
  const { campaignId } = req.params;
  try {
    const { data, error } = await supabase
      .from("campaigns")
      .select("*, campaign_influencers(*)")
      .eq("id", campaignId)
      .single();

    if (error) throw error;

    res.json({ success: true, campaign: data });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post("/api/campaigns", async (req, res) => {
  try {
    const umkmId = req.body.umkm_id ?? req.body.umkmId ?? null;
    const umkmName = req.body.umkm_name ?? req.body.umkmName ?? req.body.brand_name ?? req.body.brandName ?? null;

    const { data, error } = await supabase
      .from("campaigns")
      .insert([
        {
          ...req.body,
          umkm_id: umkmId,
          umkm_name: umkmName,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: "Campaign created",
      campaign: data,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.put("/api/campaigns/:campaignId", async (req, res) => {
  const { campaignId } = req.params;
  try {
    const { data, error } = await supabase
      .from("campaigns")
      .update(req.body)
      .eq("id", campaignId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: "Campaign updated",
      campaign: data,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.delete("/api/campaigns/:campaignId", async (req, res) => {
  const { campaignId } = req.params;
  try {
    const { error } = await supabase
      .from("campaigns")
      .delete()
      .eq("id", campaignId);

    if (error) throw error;

    res.json({ success: true, message: "Campaign deleted" });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post("/api/campaigns/:campaignId/influencers", async (req, res) => {
  const { campaignId } = req.params;
  const { influencerId } = req.body;

  try {
    const { data: campaign } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", campaignId)
      .single();

    const { data: influencer } = await supabase
      .from("users")
      .select("*")
      .eq("id", influencerId)
      .single();

    const { data, error } = await supabase
      .from("campaign_influencers")
      .insert([
        {
          campaign_id: campaignId,
          influencer_id: influencerId,
          influencer_name: influencer?.name,
          status: "invited",
        },
      ])
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: "Influencer added to campaign",
      campaignInfluencer: data,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.delete("/api/campaigns/:campaignId/influencers/:influencerId", async (req, res) => {
  const { campaignId, influencerId } = req.params;

  try {
    const { error } = await supabase
      .from("campaign_influencers")
      .delete()
      .eq("campaign_id", campaignId)
      .eq("influencer_id", influencerId);

    if (error) throw error;

    res.json({ success: true, message: "Influencer removed from campaign" });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.patch("/api/campaigns/:campaignId/influencers/:influencerId", async (req, res) => {
  const { campaignId, influencerId } = req.params;
  const { status } = req.body;

  try {
    const { data, error } = await supabase
      .from("campaign_influencers")
      .update({ status })
      .eq("campaign_id", campaignId)
      .eq("influencer_id", influencerId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: "Status updated",
      campaignInfluencer: data,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post("/api/campaigns/:campaignId/influencers/:influencerId/submit", async (req, res) => {
  const { campaignId, influencerId } = req.params;
  const { submissionUrl } = req.body;

  try {
    const { data, error } = await supabase
      .from("campaign_influencers")
      .update({
        submission_url: submissionUrl,
        status: "content_uploaded",
      })
      .eq("campaign_id", campaignId)
      .eq("influencer_id", influencerId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: "Content submitted",
      campaignInfluencer: data,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ============================================================
// ESCROW ENDPOINTS
// ============================================================
app.get("/api/escrow", async (req, res) => {
  try {
    const { campaign_id } = req.query;
    let query = supabase.from("escrow_transactions").select("*");

    if (campaign_id) {
      query = query.eq("campaign_id", campaign_id);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json({ success: true, escrows: data });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get("/api/escrow/:escrowId", async (req, res) => {
  const { escrowId } = req.params;
  try {
    const { data, error } = await supabase
      .from("escrow_transactions")
      .select("*")
      .eq("id", escrowId)
      .single();

    if (error) throw error;

    res.json({ success: true, escrow: data });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.put("/api/escrow/:escrowId", async (req, res) => {
  const { escrowId } = req.params;
  try {
    const { data, error } = await supabase
      .from("escrow_transactions")
      .update(req.body)
      .eq("id", escrowId)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, message: "Escrow updated", escrow: data });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post("/api/escrow/lock", async (req, res) => {
  const { campaignId, influencerId, amount } = req.body;

  try {
    const { data: campaign } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", campaignId)
      .single();

    const { data: influencer } = await supabase
      .from("users")
      .select("*")
      .eq("id", influencerId)
      .single();

    const { data, error } = await supabase
      .from("escrow_transactions")
      .insert([
        {
          campaign_id: campaignId,
          campaign_name: campaign?.name,
          influencer_id: influencerId,
          influencer_name: influencer?.name,
          umkm_id: campaign?.umkm_id,
          amount,
          status: "locked",
        },
      ])
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: "Escrow locked",
      escrow: data,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post("/api/escrow/:escrowId/release", async (req, res) => {
  const { escrowId } = req.params;

  try {
    const { data, error } = await supabase
      .from("escrow_transactions")
      .update({ status: "released" })
      .eq("id", escrowId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: "Escrow released",
      escrow: data,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post("/api/escrow/:escrowId/dispute", async (req, res) => {
  const { escrowId } = req.params;
  const { reason } = req.body;

  try {
    const { data, error } = await supabase
      .from("escrow_transactions")
      .update({ status: "pending" })
      .eq("id", escrowId)
      .select()
      .single();

    if (error) throw error;

    // Log the dispute
    await supabase.from("system_logs").insert([
      {
        action: "ESCROW_DISPUTED",
        details: `Escrow ${escrowId} disputed: ${reason}`,
        actor_type: "system",
      },
    ]);

    res.json({
      success: true,
      message: "Dispute filed",
      escrow: data,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ============================================================
// SYSTEM LOGS ENDPOINTS
// ============================================================
app.get("/api/logs", async (req, res) => {
  try {
    const { actor_id } = req.query;
    let query = supabase.from("system_logs").select("*");

    if (actor_id) {
      query = query.eq("actor_id", actor_id);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json({ success: true, logs: data });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post("/api/logs", async (req, res) => {
  try {
    const { action, details, actorType } = req.body;

    const { data, error } = await supabase
      .from("system_logs")
      .insert([
        {
          action,
          details,
          actor_type: actorType,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: "Log created",
      log: data,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// REST route for AI Brief Generator
app.post("/api/generate-brief", async (req, res) => {
  const { campaignName, objective, audience, platform, tone, brandName, brandCategory } = req.body;

  try {
    const resolvedBrandName = brandName || "brand Anda";
    const resolvedBrandCategory = brandCategory || "kategori usaha";
    const resolvedCampaignName = campaignName || "kampanye Anda";
    const resolvedObjective = objective || "tujuan kampanye";
    const resolvedAudience = audience || "audiens target";
    const resolvedPlatform = platform || "platform utama";
    const resolvedTone = tone || "tone konten";

    const prompt = `
      Buatkan sebuah brief pemasaran influencer yang detail, profesional, dan sangat menarik untuk kampanye UMKM lokal berikut:
      - Nama Brand: ${resolvedBrandName}
      - Kategori Bisnis: ${resolvedBrandCategory}
      - Nama Kampanye: ${resolvedCampaignName}
      - Tujuan/Objective Kampanye: ${resolvedObjective}
      - Target Audiens utama: ${resolvedAudience}
      - Platform Konten: ${resolvedPlatform}
      - Karakter Konten / Tone: ${resolvedTone}

      Persyaratan output brief harus menggunakan bahasa Indonesia yang santai tapi profesional, informatif, dan terstruktur rapi menggunakan format Markdown. Sertakan poin-poin berikut:
      1. Ringkasan Kampanye (deskripsi singkat yang menggugah semangat).
      2. Key Message & Hook Konten (bagaimana influencer harus membuka video/postingan mereka dalam 3 detik pertama).
      3. Aturan Do's & Don'ts yang jelas dan spesifik.
      4. Contoh Caption & Inspirasi Hashtag lokal yang populer.
      5. Rekomendasi Waktu Unggah terbaik & metrik keberhasilan kampanye.

      Buat konten brief ini seakan-akan ditulis oleh seorang Social Media Director handal.
    `;

    try {
      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      res.json({
        success: true,
        brief: response.text,
        isMock: false
      });
    } catch (apiError: any) {
      if (apiError.message === "GEMINI_API_KEY_MISSING" || (apiError.status && apiError.status === 400)) {
        console.warn("GEMINI_API_KEY is missing or invalid. Falling back to local template response.");
        // Generate a high-fidelity preset response when API key is missing
        const fallbackBrief = `### 🌟 COLLABORATION BRIEF: ${resolvedCampaignName}

> **Brand:** ${resolvedBrandName} (${resolvedBrandCategory})  
> **Platform Utama:** **${resolvedPlatform}** | **Tone:** *${resolvedTone}*  
> **Target Audiens:** ${resolvedAudience}

---

#### 1. 📌 Ringkasan Kampanye
Halo! Selamat bergabung dalam kampanye **"${resolvedCampaignName}"**. Kami ingin memperkenalkan **${resolvedBrandName}** kepada audiens yang sesuai dengan kebutuhan promosi saat ini, dengan fokus pada pesan yang jelas dan meyakinkan.

#### 2. 🎬 Hook Video & Ide Konten
*   **3 Detik Pertama (Hook Maut):** Buka video dengan visual menarik, fokus pada produk atau value utama yang ingin disampaikan.
*   **Kalimat Hook:** *"Coba lihat bagaimana brand ini menghadirkan solusi yang relevan dan menarik untuk kebutuhan sehari-hari."*
*   **Alur Rekomendasi:** 
    1. Tampilkan produk atau layanan dengan visual yang jelas dan autentik.
    2. Jelaskan nilai utama yang paling relevan bagi audiens target.
    3. Soroti manfaat atau momen promosi secara ringkas dan meyakinkan.

#### 3. ✅ Aturan Do's & Don'ts
| **Do's (Lakukan)** | **Don'ts (Hindari)** |
| :--- | :--- |
| Tampilkan produk secara jelas dan menarik | Membandingkan dengan kompetitor secara negatif |
| Sampaikan pesan dengan suara yang natural dan jujur | Membuat klaim yang tidak sesuai fakta |
| Sesuaikan konten dengan ${resolvedPlatform} | Mengabaikan konteks audiens yang dituju |
| Cantumkan informasi penting pada caption atau bio | Menggunakan bahasa yang terlalu promosi dan tidak relevan |

#### 4. ✍️ Rekomendasi Caption & Hashtags
**Opsi Caption:**
> "Konten yang menyampaikan nilai nyata dari **${resolvedBrandName}** bisa menjadi cara yang efektif untuk membangun kepercayaan dan mendorong minat audiens. Mari lihat bagaimana brand ini hadir di tengah kebutuhan sehari-hari."

**Hashtags Terpilih:**
'#brandstory' '#kolaborasi' '#kontenrelevan' '#promosimudah'

#### 5. ⏰ Best Upload Time & Metrik
*   **Waktu Posting Terbaik:** Sesuaikan dengan jam aktivitas audiens Anda.
*   **Target KPI:** Fokus pada engagement, keterlibatan komentar, dan jumlah share untuk memperluas jangkauan.
*   **Catatan Escrow:** Pembayaran akan dicairkan setelah konten disetujui dan divalidasi sesuai alur platform.

---
*Catatan: Brief ini digenerate secara responsif oleh asisten AI internal InfluMatch.*`;

        res.json({
          success: true,
          brief: fallbackBrief,
          isMock: true,
          warning: "Menampilkan brief rekomendasi (GEMINI_API_KEY belum di-config secara valid di Secrets, silakan atur GEMINI_API_KEY di Settings > Secrets untuk live AI!)."
        });
      } else {
        throw apiError;
      }
    }
  } catch (error: any) {
    console.error("Endpoint error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Gagal mengolah brief menggunakan AI."
    });
  }
});

// Serve frontend assets based on environment
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
