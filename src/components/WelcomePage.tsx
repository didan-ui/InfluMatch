import React, { useState, useEffect } from "react";
import { User, Campaign } from "../types";
import { getDbUsers, getDbCampaigns } from "../utils";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  ArrowRight, 
  Tv, 
  TrendingUp, 
  ShieldCheck, 
  Compass, 
  MapPin, 
  DollarSign, 
  Check, 
  Star,
  Users,
  Search,
  LogIn,
  UserPlus,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Calculator,
  Award,
  HeartHandshake,
  BookOpen,
  Clock,
  Shield,
  Zap,
  Target
} from "lucide-react";

interface WelcomePageProps {
  onNavigateToLogin: () => void;
  onNavigateToRegister: () => void;
}

export default function WelcomePage({ onNavigateToLogin, onNavigateToRegister }: WelcomePageProps) {
  // Load data async from Supabase
  const [users, setUsers] = useState<User[]>([]);
  const [campaigns, setCampaignsState] = useState<Campaign[]>([]);

  useEffect(() => {
    getDbUsers().then(setUsers).catch(console.error);
    getDbCampaigns().then(data => setCampaignsState(data.filter(c => c.status !== "cancelled"))).catch(console.error);
  }, []);

  const influencers = users.filter(u => u.role === "influencer");

  // Filter state for creators preview
  const [selectedNiche, setSelectedNiche] = useState<string>("Semua");
  const niches = ["Semua", "Kuliner", "Fashion", "Lifestyle", "Kecantikan"];

  const filteredInfluencers = selectedNiche === "Semua" 
    ? influencers 
    : influencers.filter(i => i.niche?.includes(selectedNiche));

  // Count active campaigns budget volume
  const totalBudgetCirculated = campaigns.reduce((sum, c) => sum + c.budget, 0);

  // Landing Page Interactive states
  const [activeGuideRole, setActiveGuideRole] = useState<"umkm" | "influencer">("umkm");
  const [calcRole, setCalcRole] = useState<"umkm" | "influencer">("umkm");
  
  // Calculator values
  const [umkmBudgetOption, setUmkmBudgetOption] = useState<number>(250000);
  const [influencerPostCount, setInfluencerPostCount] = useState<number>(3);
  const [influencerPricePerPost, setInfluencerPricePerPost] = useState<number>(250000);

  // FAQ states
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setFaqOpenIndex(faqOpenIndex === index ? null : index);
  };

  // Estimate formulas for Calculator Widget
  const getUmkmEstimates = (budget: number) => {
    const videoPosts = Math.max(1, Math.round(budget / 200000));
    const minViews = Math.round(budget * 15);
    const maxViews = Math.round(budget * 45);
    const ctrValue = "3.2% - 5.8%";
    return { videoPosts, minViews, maxViews, ctrValue };
  };

  const getInfluencerEstimates = (posts: number, price: number) => {
    const weeklyIncome = posts * price;
    const monthlyIncome = weeklyIncome * 4;
    const starsEarned = Math.round(posts * 1.5);
    return { weeklyIncome, monthlyIncome, starsEarned };
  };

  const umkmEst = getUmkmEstimates(umkmBudgetOption);
  const infEst = getInfluencerEstimates(influencerPostCount, influencerPricePerPost);

  const faqItems = [
    {
      q: "Bagaimana platform menjamin keamanan transaksi UMKM dan Influencer?",
      a: "Kami menggunakan sistem Rekening Bersama (Escrow) yang aman. Mitra UMKM menyetor dana kampanye di awal kerja sama. Sistem mengunci dana tersebut, dan dana baru akan dicairkan ke saldo influencer setelah mereka menyerahkan bukti link postingan media sosial yang sah, ditinjau oleh pihak UMKM, serta divalidasi oleh sistem."
    },
    {
      q: "Siapa saja mahasiswa yang boleh mendaftar sebagai influencer?",
      a: "Seluruh mahasiswa aktif di area Malang Raya (seperti Universitas Brawijaya, Universitas Negeri Malang, UMM, UIN, Polinema, dll.) yang memiliki akun media sosial aktif (TikTok, Instagram, atau YouTube) dengan pengikut riil/organik dan berminat membantu kemajuan UMKM lokal."
    },
    {
      q: "Apakah ada biaya pendaftaran atau komisi tersembunyi?",
      a: "Pendaftaran akun di InfluMatch 100% GRATIS baik bagi pemilik bisnis UMKM maupun mahasiswa kreator. Kami tidak memotong biaya pendaftaran bulanan. Platform hanya memungut biaya operasional pemeliharaan sistem yang sangat ringan saat transaksi disetujui."
    },
    {
      q: "Bagaimana asisten kecerdasan buatan (AI) membantu menyusun brief?",
      a: "Saat UMKM membuat kampanye, asisten AI kami akan otomatis mengolah data kategori produk, target audiens, dan referensi konsep dari UMKM untuk melahirkan dokumen 'AI Brief' terstruktur. Isinya meliputi pedoman visual, nada bicara (tone of voice), tagar wajib, hingga draf naskah video kreatif."
    }
  ];

  return (
    <div className="min-h-screen bg-brand-bg font-sans text-brand-text flex flex-col selection:bg-brand-blush/60">
      
      {/* HEADER NAVBAR WITH RICH DETAILED NAV LINKS */}
      <header className="sticky top-0 z-40 w-full bg-brand-white/90 backdrop-blur-md border-b border-brand-sand/65 shadow-xs select-none">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-brand-sage text-brand-sage-dark rounded-2xl flex items-center justify-center font-serif text-xl font-black shadow-inner border border-brand-sage-dark/10">
              iM
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-2xl font-black tracking-tight text-brand-text leading-none">InfluMatch</span>
              <span className="text-[9px] text-[#58816E] font-extrabold uppercase tracking-widest mt-1">Malang Synergy Portal</span>
            </div>
          </div>

          {/* Nav Links for first-time visitors */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-bold text-brand-text-soft">
            <a href="#tentang" className="hover:text-brand-text transition-colors">Tentang</a>
            <a href="#keunggulan" className="hover:text-brand-text transition-colors">Keunggulan</a>
            <a href="#panduan" className="hover:text-brand-text transition-colors">Cara Kerja</a>
            <a href="#katalog" className="hover:text-brand-text transition-colors">Katalog & Proyek</a>
            <a href="#kalkulator" className="hover:text-brand-text transition-colors">Simulasi Hasil</a>
            <a href="#faq" className="hover:text-brand-text transition-colors">F.A.Q</a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button 
              onClick={onNavigateToLogin}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-brand-text-soft hover:text-brand-text hover:bg-brand-sand/30 rounded-xl transition-all cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-brand-text-light" /> Masuk Akun
            </button>
            <button 
              onClick={onNavigateToRegister}
              className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-black text-brand-white bg-brand-text hover:bg-brand-text/90 rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
            >
              <UserPlus className="w-3.5 h-3.5" /> Gabung Sekarang
            </button>
          </div>

        </div>
      </header>

      {/* MAIN LAYOUT */}
      <main className="w-full max-w-7xl mx-auto px-6 py-8 flex-grow space-y-16">
        
        {/* SECTION 1: HERO & REGISTRATION TRIGGERS (ID: tentang) */}
        <div id="tentang" className="grid grid-cols-12 gap-6 items-stretch scroll-mt-24">
          
          {/* Main Hero Bento Block - Col 8 */}
          <section className="col-span-12 lg:col-span-8 bg-brand-sage border border-brand-sand/80 rounded-[2.5rem] p-8 lg:p-10 relative overflow-hidden flex flex-col justify-between min-h-[380px] shadow-sm">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
            
            <div className="space-y-4 relative z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-white text-brand-sage-dark text-[10px] font-black rounded-full uppercase tracking-wider border border-brand-sage-dark/10">
                <Sparkles className="w-3 h-3 text-[#58816E] animate-pulse" /> Sinergi Usaha Lokal & Kreator Mahasiswa Malang
              </span>
              
              <h1 className="font-serif text-[#2D2825] text-4xl lg:text-5xl font-black leading-tight tracking-tight max-w-2xl">
                Jangkau Lebih Banyak. <br />
                Aman 100% Lewat <span className="underline underline-offset-4 decoration-wavy decoration-[#58816E] text-brand-sage-dark">Escrow Dana</span>.
              </h1>
              
              <p className="text-brand-text-soft text-xs md:text-sm max-w-xl leading-relaxed font-medium">
                Satu-satunya wadah kolaborasi pintar yang dirancang khusus untuk mempertemukan UMKM potensial di Malang dengan ribuan mahasiswa kreatif. Diperlengkapi asisten AI pembuat brief instan serta sistem jaminan dana aman.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-brand-sand/50 mt-8 select-text">
              <div className="space-y-1">
                <span className="text-[9px] font-black text-brand-text-light uppercase tracking-widest block">Dana Terjamin Aman</span>
                <p className="font-serif text-lg md:text-2xl font-extrabold text-brand-text leading-none">Rp {totalBudgetCirculated.toLocaleString()}</p>
                <span className="text-[10px] text-brand-text-light font-bold">Volume Kampanye</span>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-black text-brand-text-light uppercase tracking-widest block">Kreator Mahasiswa</span>
                <p className="font-serif text-lg md:text-2xl font-extrabold text-brand-text leading-none">{influencers.length} Kreator</p>
                <span className="text-[10px] text-brand-text-light font-bold">Aktif & Terdokumentasi</span>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-black text-[#58816E] uppercase tracking-widest block">Kualitas Penonton</span>
                <p className="font-serif text-lg md:text-2xl font-extrabold text-brand-sage-dark leading-none">100% Organik</p>
                <span className="text-[10px] text-[#58816E] font-bold">Bebas Bot / Fake Fans</span>
              </div>
            </div>
          </section>

          {/* Welcome Action Selector - Col 4 */}
          <section className="col-span-12 lg:col-span-4 bg-brand-blush border border-brand-sand/80 rounded-[2.5rem] p-8 flex flex-col justify-between relative overflow-hidden shadow-sm">
            <div className="absolute -bottom-10 -right-10 w-44 h-44 bg-brand-white/15 rounded-full blur-2xl pointer-events-none" />
            
            <div className="space-y-4 relative z-10">
              <div className="w-12 h-12 bg-brand-white text-brand-blush-dark rounded-2xl flex items-center justify-center shadow-md border border-brand-sand/50">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-2xl font-extrabold text-brand-text leading-tight">Mulai Perjalanan</h3>
              <p className="text-xs text-brand-text-soft font-medium leading-relaxed">
                Menjadi partner penyalur produk berkualitas dari UMKM setempat, atau gunakan kreativitas media sosialmu sebagai wadah penghasilan saku tambahan di sela-sela perkuliahan.
              </p>
            </div>

            <div className="space-y-3.5 mt-8 relative z-10">
              <div className="p-3 bg-brand-white/60 rounded-2xl border border-brand-sand/30 text-[10px] text-brand-text-soft font-bold leading-normal flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#C16D6D] shrink-0" />
                <span>Tanpa biaya bulanan atau administrasi pendaftaran tersembunyi.</span>
              </div>

              <div className="space-y-2">
                <button 
                  onClick={onNavigateToRegister}
                  className="w-full py-3.5 bg-brand-text text-brand-white text-xs font-black rounded-xl shadow-md hover:opacity-95 text-center cursor-pointer transition-all active:scale-[0.98] flex items-center justify-center gap-1"
                >
                  Registrasi Akun Baru <ArrowRight className="w-4 h-4" />
                </button>
                
                <button 
                  onClick={onNavigateToLogin}
                  className="w-full py-3 border border-brand-sand bg-brand-white hover:bg-brand-bg text-brand-text-soft text-[10.5px] font-black rounded-xl text-center cursor-pointer transition-all"
                >
                  Masuk ke Dashboard Anda
                </button>
              </div>
            </div>
          </section>

        </div>

        {/* CAMPUS PARTNERS LOGO STRIP (MALANG SPECIFIC) */}
        <section className="bg-brand-white border border-brand-sand/65 rounded-3xl p-6 shadow-xs">
          <p className="text-center text-[10px] font-black text-brand-text-light tracking-widest uppercase mb-4">
            KOLABORASI AKTIF MAHASISWA DARI KAMPUS-KAMPUS TERKEMUKA MALANG
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12 text-xs font-extrabold text-brand-text-soft">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-bg rounded-xl border border-brand-sand/40">
              <GraduationCap className="w-4 h-4 text-brand-sage-dark" />
              <span>Universitas Brawijaya (UB)</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-bg rounded-xl border border-brand-sand/40">
              <GraduationCap className="w-4 h-4 text-brand-blush-dark" />
              <span>Universitas Negeri Malang (UM)</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-bg rounded-xl border border-brand-sand/40">
              <GraduationCap className="w-4 h-4 text-brand-sky-dark" />
              <span>UIN Maulana Malik Ibrahim</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-bg rounded-xl border border-brand-sand/40">
              <GraduationCap className="w-4 h-4 text-brand-lav-dark" />
              <span>Univ. Muhammadiyah Malang (UMM)</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-bg rounded-xl border border-brand-sand/40">
              <GraduationCap className="w-4 h-4 text-[#A67E4E]" />
              <span>Politeknik Negeri Malang</span>
            </div>
          </div>
        </section>

        {/* SECTION 2: WHY US? THREE UNIQUE VALUE PILLARS (ID: keunggulan) */}
        <div id="keunggulan" className="space-y-8 scroll-mt-24">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-[10px] font-black tracking-widest text-[#58816E] uppercase bg-brand-sage/45 px-3 py-1 rounded-full">
              KAMI BERBEDA DENGAN AGENSI BIASA
            </span>
            <h2 className="font-serif text-3xl font-extrabold tracking-tight text-brand-text">Mengapa Memilih InfluMatch?</h2>
            <p className="text-xs text-brand-text-soft font-medium leading-normal">
              Kami memadukan asisten kecerdasan buatan, sistem pendanaan transparan, dan jangkauan audiens mahasiswa riil untuk pertumbuhan usaha lokal Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-brand-white border border-brand-sand rounded-[2rem] p-6 space-y-4 hover:border-brand-sage-dark/35 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-brand-sage/35 text-brand-sage-dark flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-brand-text">1. Transaksi Aman (Escrow)</h3>
              <p className="text-xs text-brand-text-soft font-medium leading-relaxed">
                UMKM tidak perlu takut kreator kabur tanpa memposting video. Influencer pun merasa tenang karena dana kerja sama mereka sudah dikunci di sistem. Pembayaran dicairkan otomatis setelah konten diposting secara valid.
              </p>
              <div className="text-[10px] text-brand-sage-dark font-extrabold bg-brand-sage/20 px-2.5 py-1 rounded-lg inline-block">
                Saling Percaya 100%
              </div>
            </div>

            <div className="bg-brand-white border border-brand-sand rounded-[2rem] p-6 space-y-4 hover:border-brand-blush-dark/35 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-brand-blush/35 text-brand-blush-dark flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-brand-text">2. Dokumen AI Brief Otomatis</h3>
              <p className="text-xs text-brand-text-soft font-medium leading-relaxed">
                Tidak tahu cara membuat arahan video iklan yang menarik? Cukup tulis ide kasarmu, asisten kecerdasan buatan (AI) kami akan langsung menerjemahkannya menjadi brief konten teknis yang lengkap dengan draf skrip verbal.
              </p>
              <div className="text-[10px] text-brand-blush-dark font-extrabold bg-brand-blush/30 px-2.5 py-1 rounded-lg inline-block">
                Hemat Waktu & Tenaga
              </div>
            </div>

            <div className="bg-brand-white border border-brand-sand rounded-[2rem] p-6 space-y-4 hover:border-brand-sky-dark/35 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-brand-sky text-brand-sky-dark flex items-center justify-center">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-brand-text">3. 100% Organik Mahasiswa</h3>
              <p className="text-xs text-brand-text-soft font-medium leading-relaxed">
                Seluruh influencer mahasiswa yang bergabung wajib melewati proses validasi data kemahasiswaan. Pengikut mereka didominasi oleh anak muda Malang yang aktif dan gemar mencoba kuliner atau produk fashion baru.
              </p>
              <div className="text-[10px] text-brand-sky-dark font-extrabold bg-brand-sky/60 px-2.5 py-1 rounded-lg inline-block">
                Bebas Akun Palsu / Bot
              </div>
            </div>

          </div>
        </div>

        {/* SECTION 3: CARA KERJA / INTERACTIVE STEP-BY-STEP SIMULATOR (ID: panduan) */}
        <div id="panduan" className="bg-brand-white border border-brand-sand rounded-[2.5rem] p-8 lg:p-10 space-y-8 scroll-mt-24 shadow-sm">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-brand-sand/55 pb-6">
            <div>
              <span className="text-[10px] font-black tracking-widest text-[#58816E] uppercase">
                ALUR PERJALANAN PRODUKTIF
              </span>
              <h2 className="font-serif text-3xl font-extrabold tracking-tight text-brand-text mt-1">Sederhana & Mudah Diikuti</h2>
              <p className="text-xs text-brand-text-soft font-medium mt-1">Pilih peran Anda untuk melihat bagaimana sistem mendukung kolaborasi impian.</p>
            </div>

            {/* Role guide selector button tab */}
            <div className="flex bg-brand-bg p-1 rounded-xl border border-brand-sand select-none self-start md:self-auto">
              <button
                onClick={() => setActiveGuideRole("umkm")}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
                  activeGuideRole === "umkm"
                    ? "bg-brand-text text-brand-white shadow-md"
                    : "text-brand-text-soft hover:text-brand-text"
                }`}
              >
                <Users className="w-3.5 h-3.5" /> Untuk Mitra UMKM
              </button>
              <button
                onClick={() => setActiveGuideRole("influencer")}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
                  activeGuideRole === "influencer"
                    ? "bg-brand-text text-brand-white shadow-md"
                    : "text-brand-text-soft hover:text-brand-text"
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" /> Untuk Mahasiswa
              </button>
            </div>
          </div>

          {/* Workflow Steps Display */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 select-text">
            {activeGuideRole === "umkm" ? (
              <>
                {/* UMKM Steps */}
                <div className="space-y-3 relative">
                  <div className="w-10 h-10 rounded-xl bg-brand-sage text-brand-sage-dark flex items-center justify-center font-serif text-lg font-black shadow-xs">
                    1
                  </div>
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-brand-text">Posting Campaign</h4>
                  <p className="text-[11px] text-brand-text-soft leading-relaxed font-medium">
                    Tulis kebutuhan promosi Anda, jenis produk, rentang pengikut influencer yang dicari, serta target platform sosial.
                  </p>
                </div>
                
                <div className="space-y-3 relative">
                  <div className="w-10 h-10 rounded-xl bg-brand-sage text-brand-sage-dark flex items-center justify-center font-serif text-lg font-black shadow-xs">
                    2
                  </div>
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-brand-text">Bantuan Pintar AI</h4>
                  <p className="text-[11px] text-brand-text-soft leading-relaxed font-medium">
                    Asisten cerdas AI menyusun draf arahan konten (AI Brief) instan yang memandu kreativitas influencer agar sesuai target bisnis Anda.
                  </p>
                </div>

                <div className="space-y-3 relative">
                  <div className="w-10 h-10 rounded-xl bg-brand-sage text-brand-sage-dark flex items-center justify-center font-serif text-lg font-black shadow-xs">
                    3
                  </div>
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-brand-text">Kunci Dana (Escrow)</h4>
                  <p className="text-[11px] text-brand-text-soft leading-relaxed font-medium">
                    Pilih pelamar influencer terbaik dan lakukan penguncian dana di rekening bersama platform agar pengerjaan video dapat dimulai.
                  </p>
                </div>

                <div className="space-y-3 relative">
                  <div className="w-10 h-10 rounded-xl bg-brand-sage text-brand-sage-dark flex items-center justify-center font-serif text-lg font-black shadow-xs">
                    4
                  </div>
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-brand-text">Tinjau & Selesai</h4>
                  <p className="text-[11px] text-brand-text-soft leading-relaxed font-medium">
                    Periksa tautan video konten yang diunggah influencer. Setelah puas dan disetujui, cairkan dana ke rekening influencer dalam 1 klik.
                  </p>
                </div>
              </>
            ) : (
              <>
                {/* Influencer Steps */}
                <div className="space-y-3 relative">
                  <div className="w-10 h-10 rounded-xl bg-brand-blush text-brand-blush-dark flex items-center justify-center font-serif text-lg font-black shadow-xs">
                    1
                  </div>
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-brand-text">Cari Kampanye Promosi</h4>
                  <p className="text-[11px] text-brand-text-soft leading-relaxed font-medium">
                    Masuk ke dashboard pencarian untuk menemukan berbagai proyek kuliner, tempat nongkrong, atau butik fashion lokal di Malang yang sesuai minatmu.
                  </p>
                </div>

                <div className="space-y-3 relative">
                  <div className="w-10 h-10 rounded-xl bg-brand-blush text-brand-blush-dark flex items-center justify-center font-serif text-lg font-black shadow-xs">
                    2
                  </div>
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-brand-text">Ajukan Lamaran Kerja</h4>
                  <p className="text-[11px] text-brand-text-soft leading-relaxed font-medium">
                    Kirim lamaran sesuai tarif jasamu. Begitu terpilih, pastikan UMKM mengunci dana anggaran di sistem agar hak pembayaranmu terlindungi penuh.
                  </p>
                </div>

                <div className="space-y-3 relative">
                  <div className="w-10 h-10 rounded-xl bg-brand-blush text-brand-blush-dark flex items-center justify-center font-serif text-lg font-black shadow-xs">
                    3
                  </div>
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-brand-text">Kerjakan Sesuai AI Brief</h4>
                  <p className="text-[11px] text-brand-text-soft leading-relaxed font-medium">
                    Ikuti arahan konsep kreatif, visualisasi, dan kalimat kunci promosi dari dokumen AI Brief yang telah disediakan sistem untuk hasil terbaik.
                  </p>
                </div>

                <div className="space-y-3 relative">
                  <div className="w-10 h-10 rounded-xl bg-brand-blush text-brand-blush-dark flex items-center justify-center font-serif text-lg font-black shadow-xs">
                    4
                  </div>
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-brand-text">Terima Saldo & Ulasan</h4>
                  <p className="text-[11px] text-brand-text-soft leading-relaxed font-medium">
                    Masukkan link video bukti penayangan kontenmu. Setelah disetujui, dana aman langsung cair ke akunmu dan reputasi bintangmu otomatis meningkat!
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="p-4.5 bg-brand-bg rounded-2xl border border-brand-sand/60 text-xs text-brand-text-soft font-medium leading-relaxed flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-brand-sage-dark" />
              <span>Ada kebingungan atau perselisihan saat kerja sama? Tenang, admin profesional kami siap menengahi seadil-adilnya.</span>
            </div>
            <button
              onClick={onNavigateToRegister}
              className="px-4 py-2 bg-brand-text text-brand-white text-[11px] font-bold rounded-lg hover:opacity-95 cursor-pointer shrink-0 transition-all select-none"
            >
              Mulai Gabung Sekarang
            </button>
          </div>

        </div>

        {/* SECTION 4: INTERACTIVE INCOME & COST CALCULATOR (ID: kalkulator) */}
        <div id="kalkulator" className="grid grid-cols-12 gap-6 items-stretch scroll-mt-24">
          
          {/* Calculator Control Panel */}
          <section className="col-span-12 lg:col-span-6 bg-[#FAF9F6] border border-brand-sand/80 rounded-[2.5rem] p-8 space-y-6 flex flex-col justify-between shadow-sm">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-brand-text text-brand-white rounded-xl flex items-center justify-center shadow-xs">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-2xl font-extrabold text-brand-text leading-tight">Simulasi & Estimasi Hasil</h3>
                  <p className="text-xs text-brand-text-soft mt-0.5">Kalkulasikan potensi jangkauan iklan UMKM maupun penghasilan bulanan influencer.</p>
                </div>
              </div>

              {/* Slider calculator selector tabs */}
              <div className="flex bg-brand-white p-1 rounded-xl border border-brand-sand select-none w-full max-w-sm">
                <button
                  onClick={() => setCalcRole("umkm")}
                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-[11px] font-black rounded-lg transition-all cursor-pointer ${
                    calcRole === "umkm"
                      ? "bg-brand-sage text-brand-sage-dark"
                      : "text-brand-text-soft hover:text-brand-text"
                  }`}
                >
                  <Users className="w-3 h-3" /> Untuk Mitra UMKM
                </button>
                <button
                  onClick={() => setCalcRole("influencer")}
                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-[11px] font-black rounded-lg transition-all cursor-pointer ${
                    calcRole === "influencer"
                      ? "bg-brand-blush text-brand-blush-dark"
                      : "text-brand-text-soft hover:text-brand-text"
                  }`}
                >
                  <GraduationCap className="w-3 h-3" /> Untuk Mahasiswa
                </button>
              </div>

              {calcRole === "umkm" ? (
                // UMKM inputs
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-wider text-brand-text-light block">Berapa Anggaran Kampanye Anda?</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[150000, 250000, 400000, 750000].map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setUmkmBudgetOption(option)}
                          className={`py-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            umkmBudgetOption === option
                              ? "bg-brand-sage-dark text-white border-brand-sage-dark shadow-md"
                              : "bg-brand-white text-brand-text-soft border-brand-sand hover:bg-brand-bg"
                          }`}
                        >
                          Rp{(option / 1000).toFixed(0)}K
                        </button>
                      ))}
                    </div>
                  </div>

                  <p className="text-[10px] text-brand-text-light font-medium leading-relaxed bg-brand-white p-3 rounded-xl border border-brand-sand/55">
                    💡 <strong>Tips UMKM:</strong> Anggaran Rp250K s/d Rp400K adalah budget paling populer di Malang untuk menggaet mahasiswa kreator berdedikasi tinggi dengan ulasan rating bintang 4.9+.
                  </p>
                </div>
              ) : (
                // Influencer inputs
                <div className="space-y-4 pt-2 select-none">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-wider text-brand-text-light block">Berapa target posting video per minggu?</label>
                    <div className="grid grid-cols-5 gap-2">
                      {[1, 2, 3, 4, 5].map((count) => (
                        <button
                          key={count}
                          type="button"
                          onClick={() => setInfluencerPostCount(count)}
                          className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            influencerPostCount === count
                              ? "bg-brand-blush-dark text-white border-brand-blush-dark shadow-md"
                              : "bg-brand-white text-brand-text-soft border-brand-sand hover:bg-brand-bg"
                          }`}
                        >
                          {count} Post
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-wider text-brand-text-light block">Berapa biaya jasa per postingan Anda?</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[150000, 250000, 400000].map((price) => (
                        <button
                          key={price}
                          type="button"
                          onClick={() => setInfluencerPricePerPost(price)}
                          className={`py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            influencerPricePerPost === price
                              ? "bg-brand-blush-dark text-white border-brand-blush-dark shadow-md"
                              : "bg-brand-white text-brand-text-soft border-brand-sand hover:bg-brand-bg"
                          }`}
                        >
                          Rp{(price / 1000).toFixed(0)}K
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="text-[10.5px] text-brand-text-light font-medium border-t border-brand-sand/60 pt-4 mt-6">
              * Angka simulasi berdasarkan data riil kerja sama UMKM dan mahasiswa Malang Raya di platform InfluMatch.
            </div>
          </section>

          {/* Calculator Output Panel */}
          <section className="col-span-12 lg:col-span-6 bg-brand-white border border-brand-sand rounded-[2.5rem] p-8 flex flex-col justify-between shadow-xs">
            {calcRole === "umkm" ? (
              // UMKM Output
              <div className="space-y-6 flex-1 flex flex-col justify-between select-text">
                <div className="space-y-4">
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#58816E] bg-brand-sage px-2.5 py-1 rounded-md inline-block">
                    ESTIMASI PERFORMA IKLAN UMKM
                  </span>
                  
                  <div className="space-y-1">
                    <span className="text-[10px] text-brand-text-light uppercase tracking-wider font-bold">Total Pengeluaran Promosi</span>
                    <p className="font-serif text-3xl font-black text-brand-text font-mono">
                      Rp{umkmBudgetOption.toLocaleString()}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="p-4 rounded-2xl bg-brand-bg/40 border border-brand-sand/30 space-y-1">
                      <span className="text-[9px] uppercase tracking-wider text-brand-text-light font-bold block">Video Kreatif Didapatkan</span>
                      <span className="text-brand-text font-black text-sm block font-mono">
                        {umkmEst.videoPosts} Post Video Iklan
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-brand-bg/40 border border-brand-sand/30 space-y-1">
                      <span className="text-[9px] uppercase tracking-wider text-brand-text-light font-bold block">Rata-rata Click-Through Rate</span>
                      <span className="text-brand-sage-dark font-black text-sm block font-mono">
                        {umkmEst.ctrValue}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-brand-sage/10 border border-brand-sage-dark/15 space-y-1">
                    <span className="text-[9px] uppercase tracking-wider text-[#58816E] font-bold block">Estimasi Tayangan Organik (Views)</span>
                    <span className="text-brand-sage-dark font-black text-lg block font-mono">
                      {umkmEst.minViews.toLocaleString()} - {umkmEst.maxViews.toLocaleString()} Penonton
                    </span>
                    <span className="text-[10px] text-[#58816E] font-medium block">Berfokus pada mahasiswa & pemuda lokal Malang Raya yang aktif jajan dan belanja.</span>
                  </div>
                </div>

                <div className="space-y-3 pt-6 border-t border-brand-sand/50">
                  <p className="text-xs text-brand-text-soft font-medium leading-relaxed">
                    Dapatkan jaminan penonton organik sekarang juga. Buat campaign pertamamu dan saksikan asisten AI kami menyulap promosi produk Anda.
                  </p>
                  <button
                    onClick={onNavigateToRegister}
                    className="w-full py-3 bg-brand-sage-dark text-white font-black text-xs rounded-xl shadow-md hover:opacity-95 text-center cursor-pointer transition-all flex items-center justify-center gap-1.5"
                  >
                    Daftar UMKM & Mulai Pasang Iklan <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              // Influencer Output
              <div className="space-y-6 flex-1 flex flex-col justify-between select-text">
                <div className="space-y-4">
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#C16D6D] bg-brand-blush px-2.5 py-1 rounded-md inline-block">
                    ESTIMASI PENGHASILAN MAHASISWA
                  </span>
                  
                  <div className="space-y-1">
                    <span className="text-[10px] text-brand-text-light uppercase tracking-wider font-bold">Simulasi Pendapatan per Bulan</span>
                    <p className="font-serif text-3xl font-black text-brand-text font-mono">
                      Rp{infEst.monthlyIncome.toLocaleString()}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="p-4 rounded-2xl bg-brand-bg/40 border border-brand-sand/30 space-y-1">
                      <span className="text-[9px] uppercase tracking-wider text-brand-text-light font-bold block">Pendapatan per Minggu</span>
                      <span className="text-brand-text font-black text-sm block font-mono">
                        Rp{infEst.weeklyIncome.toLocaleString()}
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-brand-bg/40 border border-brand-sand/30 space-y-1">
                      <span className="text-[9px] uppercase tracking-wider text-brand-text-light font-bold block">Peningkatan Reputasi</span>
                      <span className="text-brand-blush-dark font-black text-sm block font-mono">
                        +{infEst.starsEarned} Bintang Gold
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-brand-blush/10 border border-brand-blush-dark/15 space-y-1">
                    <span className="text-[9px] uppercase tracking-wider text-brand-blush-dark font-bold block">Keuntungan Ekstra Anggota Terverifikasi</span>
                    <span className="text-brand-text font-bold text-xs block leading-normal">
                      ✅ Pembayaran Terjamin Aman (Sistem Escrow / Rekening Bersama)<br />
                      ✅ Mendapatkan Portofolio Review Bintang Riil dari UMKM Malang<br />
                      ✅ Fleksibilitas Waktu Kerja Tinggi (bisa disesuaikan jadwal kuliah)
                    </span>
                  </div>
                </div>

                <div className="space-y-3 pt-6 border-t border-brand-sand/50">
                  <p className="text-xs text-brand-text-soft font-medium leading-relaxed">
                    Uang saku tambahan menantimu dari hobi bermain media sosial. Daftarkan dirimu sebagai influencer dan pilih kampanye yang kamu sukai!
                  </p>
                  <button
                    onClick={onNavigateToRegister}
                    className="w-full py-3 bg-[#2D2825] text-brand-white font-black text-xs rounded-xl shadow-md hover:opacity-95 text-center cursor-pointer transition-all flex items-center justify-center gap-1.5"
                  >
                    Daftar Sebagai Influencer <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </section>

        </div>

        {/* SECTION 5: INTERACTIVE INFLUENCER & CAMPAIGN CATALOGUE SHOWCASE (ID: katalog) */}
        <div id="katalog" className="grid grid-cols-12 gap-6 scroll-mt-24">
          
          {/* CATALOGUE INFLUENCERS */}
          <section className="col-span-12 lg:col-span-7 bg-brand-white border border-brand-sand rounded-[2.5rem] p-8 space-y-6 shadow-xs">
            
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-brand-sand/40 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-sky-dark/80"></span>
                  <h3 className="font-serif text-2xl font-bold text-brand-text">Katalog Mahasiswa Berbakat</h3>
                </div>
                <p className="text-xs text-brand-text-soft mt-1">Audit real penonton organik dari kampus-kampus besar Malang.</p>
              </div>

              {/* Niche filtration tabs */}
              <div className="flex flex-wrap gap-1 bg-brand-bg p-1 rounded-xl border border-brand-sand/55 self-start select-none">
                {niches.map(n => (
                  <button
                    key={n}
                    onClick={() => setSelectedNiche(n)}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                      selectedNiche === n 
                        ? "bg-brand-white text-brand-text shadow-xs border border-brand-sand/40" 
                        : "text-brand-text-light hover:text-brand-text-soft"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Spill Influencer Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredInfluencers.map(inf => (
                <div 
                  key={inf.id} 
                  className="bg-brand-bg/40 border border-brand-sand/60 hover:border-brand-sky-dark/40 rounded-2xl p-4 space-y-3.5 transition-all select-text"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-sky rounded-full flex items-center justify-center font-bold text-brand-sky-dark text-xs select-none">
                        {inf.avatarUrl}
                      </div>
                      <div>
                        <h4 className="font-serif text-sm font-bold text-brand-text leading-tight">{inf.name}</h4>
                        <p className="text-[10px] text-brand-text-light font-mono leading-none mt-1">{inf.handle}</p>
                      </div>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-lg bg-brand-sky text-brand-sky-dark text-[9px] font-black uppercase tracking-wider border border-brand-sky-dark/15">
                      AKTIF / LIVE
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-brand-white/85 p-2.5 rounded-xl border border-brand-sand/40 text-[11px]">
                    <div>
                      <span className="text-[9px] font-bold text-brand-text-light block uppercase leading-none">Jumlah Pengikut</span>
                      <strong className="text-brand-text font-serif block mt-1">{inf.followers} Fans</strong>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-brand-text-light block uppercase leading-none">Biaya Jasa</span>
                      <strong className="text-brand-sage-dark block mt-1">{inf.pricePerPost}</strong>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {inf.niche?.map((nTag, idx) => (
                      <span 
                        key={idx} 
                        className="px-2 py-0.5 bg-brand-white border border-brand-sand text-brand-text-soft text-[9px] font-bold rounded-md"
                      >
                        {nTag}
                      </span>
                    ))}
                    <span className="px-2 py-0.5 bg-brand-sage text-brand-sage-dark text-[9px] font-bold rounded-md ml-auto flex items-center gap-0.5">
                      <MapPin className="w-2.5 h-2.5" /> {inf.city || "Malang"}
                    </span>
                  </div>

                  {/* CTA link to login */}
                  <button
                    onClick={onNavigateToLogin}
                    className="w-full py-2 bg-brand-white hover:bg-brand-sage/20 border border-brand-sand rounded-xl text-[10.5px] text-brand-sage-dark font-black cursor-pointer transition-colors shadow-xs"
                  >
                    Ajukan Undangan Kerjasama
                  </button>
                </div>
              ))}

              {filteredInfluencers.length === 0 && (
                <div className="col-span-2 py-12 text-center text-brand-text-light text-xs font-serif italic">
                  Belum ada influencer aktif terdaftar untuk kategori "{selectedNiche}" di Malang.
                </div>
              )}
            </div>

          </section>

          {/* CURATED PROYEK UMKM */}
          <section className="col-span-12 lg:col-span-5 bg-brand-white border border-brand-sand rounded-[2.5rem] p-8 space-y-6 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-blush-dark/80"></span>
                <h3 className="font-serif text-2xl font-bold text-brand-text">Proyek UMKM Malang</h3>
              </div>
              <p className="text-xs text-brand-text-soft mt-1">Daftar usaha lokal yang sedang mencari bantuan promosi dari mahasiswa.</p>
            </div>

            <div className="space-y-4">
              {campaigns.map(camp => (
                <div 
                  key={camp.id} 
                  className="p-4 border border-brand-sand/70 rounded-2xl bg-brand-bg/25 space-y-3 hover:border-brand-blush-dark/30 transition-all select-text"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <span className="px-2.5 py-0.5 bg-brand-blush text-brand-blush-dark text-[8.5px] font-black uppercase tracking-wider rounded border border-brand-blush-dark/10">
                        KATEGORI {camp.category}
                      </span>
                      <h4 className="font-serif text-base font-bold text-brand-text mt-1 leading-snug">{camp.name}</h4>
                      <p className="text-[10px] text-brand-text-light font-bold">UMKM: {camp.umkmName}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-[8px] font-black text-brand-text-light uppercase tracking-wider">Anggaran Bersama</p>
                      <strong className="text-brand-blush-dark text-xs block font-mono mt-0.5">Rp {camp.budget.toLocaleString()}</strong>
                      <span className="text-[9px] text-[#58816E] font-black uppercase flex items-center justify-end gap-0.5">
                        <ShieldCheck className="w-3 h-3" /> PASTI AMAN
                      </span>
                    </div>
                  </div>

                  <p className="text-[11.5px] text-brand-text-soft leading-normal font-medium">
                    {camp.description}
                  </p>

                  <div className="pt-2.5 border-t border-brand-sand/55 flex items-center justify-between text-[10px] font-bold text-brand-text-soft">
                    <span>Target: {camp.audience || "Mahasiswa"} ({camp.platform})</span>
                    
                    <button
                      onClick={onNavigateToLogin}
                      className="px-3 py-1.5 bg-brand-white hover:bg-brand-blush hover:text-brand-blush-dark text-brand-text-soft border border-brand-sand rounded-lg cursor-pointer text-[9.5px] font-black transition-all"
                    >
                      Ajukan Lamaran Kerja
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Secure Pledge box */}
            <div className="flex items-center gap-2.5 p-3.5 bg-[#fdfaf5] border border-brand-sand rounded-xl text-[10px] text-[#A67E4E] leading-relaxed font-medium">
              <ShieldCheck className="w-5 h-5 text-brand-blush-dark shrink-0" />
              <span>Seluruh dana anggaran wajib disetor UMKM di awal pengerjaan. Influencer terjamin terbayar penuh setelah video selesai tayang tanpa penipuan.</span>
            </div>

          </section>

        </div>

        {/* SECTION 6: ACCORDION F.A.Q. DROPDOWNS (ID: faq) */}
        <div id="faq" className="max-w-4xl mx-auto space-y-6 scroll-mt-24">
          <div className="text-center space-y-2">
            <span className="text-[10px] font-black tracking-widest text-[#58816E] uppercase bg-brand-sage/45 px-3 py-1 rounded-full">
              PANDUAN INFORMASI LENGKAP
            </span>
            <h2 className="font-serif text-3xl font-extrabold tracking-tight text-brand-text">F.A.Q (Tanya Jawab Pintar)</h2>
            <p className="text-xs text-brand-text-soft font-medium leading-normal">
              Masih ragu atau memiliki pertanyaan? Temukan penjelasan terperinci seputar sistem kerja kami di bawah.
            </p>
          </div>

          <div className="bg-brand-white border border-brand-sand rounded-3xl p-4 lg:p-6 space-y-3 shadow-xs select-text">
            {faqItems.map((item, index) => {
              const isOpen = faqOpenIndex === index;
              return (
                <div 
                  key={index} 
                  className={`border rounded-2xl transition-all overflow-hidden ${
                    isOpen 
                      ? "bg-brand-bg/20 border-brand-sand/80" 
                      : "bg-brand-white border-brand-sand/40 hover:border-brand-sand/80"
                  }`}
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full px-5 py-4 flex items-center justify-between text-left font-serif text-sm font-bold text-brand-text cursor-pointer transition-colors"
                  >
                    <span className="flex items-center gap-2.5">
                      <HelpCircle className="w-4.5 h-4.5 text-brand-text-light shrink-0" />
                      {item.q}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-brand-text-light shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-brand-text-light shrink-0" />
                    )}
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="px-5 pb-5 pt-1 text-xs text-brand-text-soft font-medium leading-relaxed font-sans border-t border-brand-sand/35">
                          {item.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

      </main>

      {/* FOOTER BAR */}
      <footer className="w-full bg-brand-white border-t border-brand-sand/65 mt-16 py-8 text-center select-none">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-bold text-brand-text-light">
          <div>© 2026 InfluMatch Platform Jatim. Built with 💖 to support Malang's Local Micro-Businesses.</div>
          <div className="flex gap-6">
            <a href="#tentang" className="hover:text-brand-text-soft">Panduan Keamanan</a>
            <a href="#keunggulan" className="hover:text-brand-text-soft">Syarat & Ketentuan</a>
            <a href="#faq" className="hover:text-brand-text-soft">Hubungi Layanan Pengaduan</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
