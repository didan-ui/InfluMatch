import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

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

// REST route for AI Brief Generator
app.post("/api/generate-brief", async (req, res) => {
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
