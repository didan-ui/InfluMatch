import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Supabase Client
const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://your-supabase-project.supabase.co";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || "your-anon-key";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || "influmatch-super-secret-key-2026-secure-auth-jwt";

// Password hashing function (SHA-256) matching the frontend Crypto implementation
function hashPasswordServer(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// JWT Token Authentication Middleware
function authenticateJWT(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: "Akses ditolak. Token autentikasi tidak ditemukan."
    });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      error: "Token tidak valid atau telah kedaluwarsa."
    });
  }
}

// REST route for User Registration (with secure password hashing and JWT issuance)
app.post("/api/auth/register", async (req, res) => {
  const user = req.body;
  
  if (!user.email || !user.password || !user.name || !user.role) {
    return res.status(400).json({
      success: false,
      error: "Data pendaftaran tidak lengkap. Pastikan email, kata sandi, nama, dan peran diisi."
    });
  }

  try {
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", user.email)
      .maybeSingle();

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "Email sudah terdaftar. Silakan gunakan email lain atau masuk."
      });
    }

    // Hash the password
    const hashedPassword = hashPasswordServer(user.password);

    const userPayload = {
      id: user.id || Math.random().toString(36).substring(2, 11),
      email: user.email,
      password: hashedPassword,
      name: user.name,
      role: user.role,
      brand_name: user.brandName || null,
      brand_category: user.brandCategory || null,
      brand_description: user.brandDescription || null,
      handle: user.handle || null,
      followers: user.followers || null,
      followers_num: user.followersNum || null,
      price_per_post: user.pricePerPost || null,
      niche: user.niche || null,
      city: user.city || null,
      avatar_url: user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.name)}`,
      is_approved: user.isApproved ?? true,
      engagement: user.engagement || null,
      rating: user.rating ?? 5.0
    };

    const { error } = await supabase
      .from("users")
      .insert([userPayload]);

    if (error) {
      throw error;
    }

    // Generate JWT Token
    const tokenPayload = {
      id: userPayload.id,
      email: userPayload.email,
      name: userPayload.name,
      role: userPayload.role
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      success: true,
      message: "Pendaftaran berhasil secara aman dengan JWT.",
      token,
      user: {
        id: userPayload.id,
        email: userPayload.email,
        name: userPayload.name,
        role: userPayload.role,
        brandName: userPayload.brand_name,
        brandCategory: userPayload.brand_category,
        brandDescription: userPayload.brand_description,
        handle: userPayload.handle,
        followers: userPayload.followers,
        followersNum: userPayload.followers_num,
        pricePerPost: userPayload.price_per_post,
        niche: userPayload.niche,
        city: userPayload.city,
        avatarUrl: userPayload.avatar_url,
        isApproved: userPayload.is_approved,
        engagement: userPayload.engagement,
        rating: userPayload.rating
      }
    });

  } catch (error: any) {
    console.error("Register API error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Gagal melakukan registrasi di backend."
    });
  }
});

// REST route for User Login (authenticating credentials and returning a secure JWT token)
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: "Silakan masukkan email dan kata sandi."
    });
  }

  try {
    const { data: dbUser, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!dbUser) {
      return res.status(404).json({
        success: false,
        error: "Email tidak ditemukan. Silakan daftarkan akun baru jika belum terdaftar."
      });
    }

    const hashedInput = hashPasswordServer(password);
    if (dbUser.password && dbUser.password !== hashedInput) {
      return res.status(401).json({
        success: false,
        error: "Kata sandi salah. Silakan coba lagi."
      });
    }

    // Create JWT Token
    const tokenPayload = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      success: true,
      message: "Login berhasil secara aman dengan JWT.",
      token,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        brandName: dbUser.brand_name,
        brandCategory: dbUser.brand_category,
        brandDescription: dbUser.brand_description,
        handle: dbUser.handle,
        followers: dbUser.followers,
        followersNum: dbUser.followers_num,
        pricePerPost: dbUser.price_per_post,
        niche: dbUser.niche,
        city: dbUser.city,
        avatarUrl: dbUser.avatar_url,
        isApproved: dbUser.is_approved,
        engagement: dbUser.engagement,
        rating: dbUser.rating
      }
    });

  } catch (error: any) {
    console.error("Login API error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Gagal memproses login di backend."
    });
  }
});

// REST route to Verify JWT Token and fetch live user details
app.get("/api/auth/verify", authenticateJWT, async (req: any, res) => {
  try {
    const { data: dbUser, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", req.user.id)
      .maybeSingle();

    if (error || !dbUser) {
      return res.status(404).json({
        success: false,
        error: "Pengguna tidak ditemukan dalam basis data."
      });
    }

    res.json({
      success: true,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        brandName: dbUser.brand_name,
        brandCategory: dbUser.brand_category,
        brandDescription: dbUser.brand_description,
        handle: dbUser.handle,
        followers: dbUser.followers,
        followersNum: dbUser.followers_num,
        pricePerPost: dbUser.price_per_post,
        niche: dbUser.niche,
        city: dbUser.city,
        avatarUrl: dbUser.avatar_url,
        isApproved: dbUser.is_approved,
        engagement: dbUser.engagement,
        rating: dbUser.rating
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Gagal memverifikasi token."
    });
  }
});

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

// REST route for AI Brief Generator (JWT Protected!)
app.post("/api/generate-brief", authenticateJWT, async (req, res) => {
  const { campaignName, objective, audience, platform, tone, brandName, brandCategory } = req.body;

  try {
    const prompt = `
      Buatkan sebuah brief pemasaran influencer yang detail, profesional, dan sangat menarik untuk kampanye UMKM lokal berikut:
      - Nama Brand: ${brandName || "Ayam Geprek Pak Budi"}
      - Kategori Bisnis: ${brandCategory || "Kuliner"}
      - Nama Kampanye: ${campaignName || "Promo Menu Baru"}
      - Tujuan/Objective Kampanye: ${objective || "Brand Awareness"}
      - Target Audiens utama: ${audience || "Mahasiswa"}
      - Platform Konten: ${platform || "TikTok"}
      - Karakter Konten / Tone: ${tone || "Fun & Casual"}

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
        const fallbackBrief = `### 🌟 COLLABORATION BRIEF: ${campaignName || "Kelezatan Lokal"}

> **Brand:** ${brandName || "Ayam Geprek Pak Budi"} (${brandCategory || "Kuliner"})  
> **Platform Utama:** **${platform || "TikTok"}** | **Tone:** *${tone || "Fun & Casual"}*  
> **Target Audiens:** ${audience || "Mahasiswa"}

---

#### 1. 📌 Ringkasan Kampanye
*Halo kak!* Selamat bergabung dalam kampanye **"${campaignName || "Promo Menu Baru"}"**. Di sini kita ingin mengenalkan menu andalan dari **${brandName || "Ayam Geprek Pak Budi"}** ke audiens lokal, terutama teman-teman *${audience || "Mahasiswa"}*. Kita ingin menunjukkan bahwa makan enak gak harus mahal, dan rasanya bikin nagih banget!

#### 2. 🎬 Hook Video & Ide Konten
*   **3 Detik Pertama (Hook Maut):** Buka video dengan ekspresi makan yang lahap atau tunjukkan visual close-up bumbu geprek yang masih panas dan berdesis!
*   **Kalimat Hook:** *"Beneran deh, ini dia porsi penyelamat akhir bulan anak kos Malang yang aslinya bikin keringetan!"* atau *"Pecinta pedas wajib merapat, nemu ayam geprek paling juara di dekat kampus!"*
*   **Alur Rekomendasi:** 
    1. Datang langsung ke outlet atau tunjukkan saat unboxing paket pengiriman dengan estetis.
    2. Review jujur rasa sambalnya, tekstur ayam yang renyah di luar tapi juicy di dalam.
    3. Tunjukkan harga paket promo akhir bulan yang super hemat untuk kantong ${audience || "mahasiswa"}.

#### 3. ✅ Aturan Do's & Don'ts
| **Do's (Lakukan)** | **Don'ts (Hindari)** |
| :--- | :--- |
| Tampilkan produk secara jelas & *close-up* menggiurkan | Menyebutkan atau membandingkan dengan kompetitor lain |
| Sebutkan harga promo dengan ceria & antusias | Menampilkan logo brand lain secara sengaja dalam video |
| Pasang lagu latar yang sedang trending di ${platform || "TikTok"} | Ekspresi wajah pasif atau tidak bersemangat saat review |
| Cantumkan alamat atau link pembelian di bio/caption | Membuat klaim berlebihan yang tidak sesuai fakta |

#### 4. ✍️ Rekomendasi Caption & Hashtags
**Opsi Caption:**
> "Udah masuk pertengahan bulan tapi pengen makan mewah? Tenang, cobain menu andalan rasa bintang lima dari **${brandName || "Ayam Geprek Pak Budi"}**! Porsinya melimpah, pedesnya nampol, harganya ramah dompet. Yuk mampir sekarang! 🔥🍗 #GeprekPakBudi #KulinerViral #AnakKosMalang"

**Hashtags Terpilih:**
'#umkmindonesia' '#localpride' '#kuliner' + (platform === "TikTok" ? "tiktok" : "viral") + ' #makanhemat'

#### 5. ⏰ Best Upload Time & Metrik
*   **Waktu Posting Terbaik:** Pukul **18.30 - 20.30 WIB** (saat jam santai mahasiswa makan malam).
*   **Target KPI:** Memaksimalkan komentar (Comment Engagement) dan jumlah share/repost untuk memperluas jangkauan ke teman seangkatan kampus.
*   **Catatan Escrow:** Pembayaran akan dicairkan otomatis setelah konten aktif selama minimal 24 jam dan link diposting serta divalidasi oleh sistem InfluMatch.

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
