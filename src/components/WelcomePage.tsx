import React, { useEffect, useState } from "react";
import { User, Campaign } from "../types";
import { getDbUsers, getDbCampaigns } from "../utils";
import { motion } from "motion/react";
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
  UserPlus
} from "lucide-react";

interface WelcomePageProps {
  onNavigateToLogin: () => void;
  onNavigateToRegister: () => void;
}

export default function WelcomePage({ onNavigateToLogin, onNavigateToRegister }: WelcomePageProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedNiche, setSelectedNiche] = useState<string>("Semua");
  const allNiches = Array.from(new Set([
    ...users.flatMap(user => user.niche ?? []),
    ...campaigns.map(campaign => campaign.category).filter(Boolean),
  ]));
  const niches = ["Semua", ...allNiches];

  useEffect(() => {
    const loadData = async () => {
      try {
        const [userData, campaignData] = await Promise.all([getDbUsers(), getDbCampaigns()]);
        setUsers(userData);
        setCampaigns(campaignData.filter(c => c.status !== "cancelled"));
      } catch (error) {
        console.error("Failed to load welcome data", error);
      }
    };

    loadData();
  }, []);

  const influencers = users.filter(u => u.role === "influencer");
  const filteredInfluencers = selectedNiche === "Semua"
    ? influencers
    : influencers.filter(i => i.niche?.includes(selectedNiche));

  const totalBudgetCirculated = campaigns.reduce((sum, c) => sum + c.budget, 0);

  return (
    <div className="min-h-screen bg-brand-bg font-sans text-brand-text flex flex-col">
      
      {/* MINIMAL NAV BAR */}
      <header className="w-full max-w-7xl mx-auto px-6 py-5 flex justify-between items-center bg-brand-white border-b border-brand-sand/60 rounded-b-2xl shadow-xs">
        <div className="flex items-center gap-2.5 select-none">
          <div className="w-9 h-9 bg-brand-sage text-brand-sage-dark rounded-full flex items-center justify-center font-serif text-lg font-bold">
            iM
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-xl font-bold tracking-tight text-brand-text leading-none">InfluMatch</span>
            <span className="text-[9px] text-brand-sage-dark font-bold uppercase tracking-wider mt-1">InfluMatch</span>
          </div>
        </div>

        {/* Action triggers */}
        <div className="flex items-center gap-3">
          <button 
            onClick={onNavigateToLogin}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-brand-text-soft hover:text-brand-text hover:bg-brand-sand/30 rounded-xl transition-all cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" /> Masuk
          </button>
          <button 
            onClick={onNavigateToRegister}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-brand-white bg-brand-sage-dark rounded-xl shadow-xs hover:opacity-95 transition-all cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" /> Daftar Sekarang
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="w-full max-w-7xl mx-auto p-6 flex-1 space-y-6">
        
        {/* TOP ROW: BENTO HERO & PLATFORM CALL TO ACTION */}
        <div className="grid grid-cols-12 gap-5">
          
          {/* Hero Bento (Lavender/Sage Fusion block) - Col 8 */}
          <section className="col-span-12 lg:col-span-8 bg-brand-sage border border-brand-sand rounded-[2rem] p-8 relative overflow-hidden flex flex-col justify-between min-h-[300px]">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-white/80 border border-brand-sand/40 text-brand-sage-dark text-[10px] font-black rounded-full uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-brand-sage-dark animate-pulse" /> Platform Kerjasama UMKM & Influencer Terverifikasi
              </span>
              
              <h1 className="font-serif text-[#2D2825] text-3xl lg:text-5xl font-normal leading-tight tracking-tight max-w-2xl">
                Tumbuh Bersama. <br />
                Transaksi Aman lewat <span className="text-brand-sage-dark underline underline-offset-4 decoration-wavy">Rekening Bersama (Escrow)</span>.
              </h1>
              
              <p className="text-brand-text-soft text-xs max-w-lg leading-relaxed">
                Platform yang menghubungkan usaha dengan influencer yang sesuai untuk kolaborasi promosi yang aman dan terukur.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-brand-sand/50 mt-6 md:mt-0 select-text">
              <div>
                <p className="text-[9px] font-bold text-brand-text-light uppercase tracking-wider">Total Pembayaran Aman</p>
                <p className="font-serif text-lg md:text-xl font-bold text-brand-text">Rp {totalBudgetCirculated.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-brand-text-light uppercase tracking-wider">Influencer Terdaftar</p>
                <p className="font-serif text-lg md:text-xl font-bold text-brand-text">{influencers.length} Profil</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-brand-text-light uppercase tracking-wider">Akun Aktif</p>
                <p className="font-serif text-lg md:text-xl font-bold text-brand-sage-dark">{users.filter(user => user.isApproved).length} akun</p>
              </div>
            </div>
          </section>

          {/* Quick Sign In Hub (Blush Pastel Pink) - Col 4 */}
          <section className="col-span-12 lg:col-span-4 bg-brand-blush border border-brand-sand rounded-[2rem] p-8 flex flex-col justify-between relative overflow-hidden">
            <div className="space-y-3">
              <div className="w-11 h-11 bg-brand-white text-brand-blush-dark rounded-full flex items-center justify-center shadow-xs">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-2xl font-normal text-brand-text">Gabung Gerakan</h3>
              <p className="text-xs text-brand-text-soft leading-relaxed">
                Butuh memperluas jangkauan brand Anda atau ingin menampilkan konten Anda kepada mitra yang sesuai? Klik opsi di bawah.
              </p>
            </div>

            <div className="space-y-2 mt-6">
              <button 
                onClick={onNavigateToRegister}
                className="w-full py-3 bg-brand-blush-dark text-white text-xs font-bold rounded-xl shadow-xs hover:opacity-95 text-center cursor-pointer transition-all active:scale-[0.99]"
              >
                Registrasi Akun Baru
              </button>
              
              <button 
                onClick={onNavigateToLogin}
                className="w-full py-2.5 border border-brand-sand/65 bg-brand-white hover:bg-brand-bg text-brand-text-soft text-[10.5px] font-bold rounded-xl text-center cursor-pointer transition-all"
              >
                Sudah Punya Akun? Masuk di Sini
              </button>
            </div>
          </section>

        </div>

        {/* INTERACTIVE INFLUENCER SHOWCASE BENTO ("Spill Influencer") */}
        <div className="grid grid-cols-12 gap-5">
          
          <section className="col-span-12 lg:col-span-7 bg-brand-white border border-brand-sand rounded-[2rem] p-7 space-y-6">
            
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-sky-dark/80"></span>
                  <h3 className="font-serif text-2xl font-normal text-brand-text"> Influencer Mahasiswa</h3>
                </div>
                <p className="text-xs text-brand-text-soft mt-1">Profil influencer yang sudah terdaftar dan siap dikolaborasikan</p>
              </div>

              {/* Niche filtration tabs */}
              <div className="flex flex-wrap gap-1 bg-brand-bg p-1 rounded-xl border border-brand-sand/55 self-start">
                {niches.map(n => (
                  <button
                    key={n}
                    onClick={() => setSelectedNiche(n)}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                      selectedNiche === n 
                        ? "bg-brand-white text-brand-text shadow-xs" 
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
                        <h4 className="font-serif text-sm font-bold text-brand-text">{inf.name}</h4>
                        <p className="text-[10px] text-brand-text-light font-mono leading-none mt-1">{inf.handle}</p>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-lg bg-brand-sky text-brand-sky-dark text-[9px] font-bold uppercase">
                      Nilai Aktif
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-brand-white/80 p-2.5 rounded-xl border border-brand-sand/40 text-[11px]">
                    <div>
                      <span className="text-[9px] font-bold text-brand-text-light block uppercase leading-none">Jumlah Pengikut</span>
                      <strong className="text-brand-text font-serif block mt-1">{inf.followers} Followers</strong>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-brand-text-light block uppercase leading-none">Biaya Jasa</span>
                      <strong className="text-brand-sage-dark block mt-1">{inf.pricePerPost}</strong>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {inf.niche?.map((nTag, idx) => (
                      <span 
                        key={idx} 
                        className="px-2 py-0.5 bg-brand-white border border-brand-sand text-brand-text-soft text-[9px] font-bold rounded-md"
                      >
                        {nTag}
                      </span>
                    ))}
                    <span className="px-2 py-0.5 bg-brand-sage text-brand-sage-dark text-[9px] font-bold rounded-md ml-auto">
                      {inf.city || "—"}
                    </span>
                  </div>

                  {/* CTA link to login */}
                  <button
                    onClick={onNavigateToLogin}
                    className="w-full py-1.5 bg-brand-white hover:bg-brand-sage/20 border border-brand-sand rounded-lg text-[10px] text-brand-sage-dark font-bold cursor-pointer transition-colors"
                  >
                    Undang Kolaborasi
                  </button>
                </div>
              ))}

              {filteredInfluencers.length === 0 && (
                <div className="col-span-2 py-8 text-center text-brand-text-light text-xs font-serif">
                  Belum ada influencer dengan kategori "{selectedNiche}" saat ini.
                </div>
              )}
            </div>

          </section>

          {/* CURATED ON-GOING CAMPAIGNS ("Spill UMKM") - Col 5 */}
          <section className="col-span-12 lg:col-span-5 bg-brand-white border border-brand-sand rounded-[2rem] p-7 space-y-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-blush-dark/80"></span>
                <h3 className="font-serif text-2xl font-normal text-brand-text">Proyek UMKM Aktif</h3>
              </div>
              <p className="text-xs text-brand-text-soft mt-1">Daftar usaha yang sedang mencari mitra promosi sesuai kebutuhan mereka</p>
            </div>

            <div className="space-y-3.5">
              {campaigns.map(camp => (
                <div 
                  key={camp.id} 
                  className="p-4 border border-brand-sand/70 rounded-2xl bg-brand-bg/25 space-y-3 hover:border-brand-blush-dark/30 transition-all select-text"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <span className="px-2 py-0.5 bg-brand-blush text-brand-blush-dark text-[8px] font-bold uppercase tracking-wider rounded">
                        Kategori {camp.category}
                      </span>
                      <h4 className="font-serif text-base font-bold text-brand-text mt-1">{camp.name}</h4>
                      <p className="text-[10px] text-brand-text-light font-bold">Usaha: {camp.umkmName}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-[8px] font-bold text-brand-text-light uppercase font-sans">Anggaran</p>
                      <strong className="text-brand-blush-dark text-xs block font-mono">Rp {camp.budget.toLocaleString()}</strong>
                      <span className="text-[8.5px] text-brand-text-light font-bold">Pasti Terbayar</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-brand-text-soft leading-normal font-sans">
                    {camp.description}
                  </p>

                  <div className="pt-2.5 border-t border-brand-sand/55 flex items-center justify-between text-[10px] font-bold text-brand-text-soft">
                    <span>Target: {camp.audience} ({camp.platform})</span>
                    
                    <button
                      onClick={onNavigateToLogin}
                      className="px-2.5 py-1 bg-brand-white hover:bg-brand-blush text-brand-blush-dark border border-brand-sand rounded-lg cursor-pointer text-[9px] transition-all"
                    >
                      Ikut Kerjasama
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom secure pledge pill (Minimal & non-distracting) */}
            <div className="flex items-center gap-2 p-3 bg-[#fdfaf5] border border-brand-sand rounded-xl text-[10px] text-[#A67E4E] leading-normal font-sans">
              <ShieldCheck className="w-4 h-4 text-brand-blush-dark shrink-0" />
              <span>Seluruh dana pembayaran dibayarkan oleh pemilik usaha di awal dan disimpan sistem dengan aman agar kerja keras Anda terjamin dihargai.</span>
            </div>

          </section>

        </div>

        {/* BOTTOM SECTION: SECURE AUDIT & INFO BENTO ACCENTS */}
        <div className="grid grid-cols-12 gap-5">
          
          <section className="col-span-12 md:col-span-4 bg-brand-sky border border-brand-sand rounded-2xl p-6 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-brand-sky-dark uppercase tracking-wider">Jaminan Aman</span>
              <h4 className="font-serif text-lg font-normal text-brand-text leading-tight">Saling Percaya & Nyaman</h4>
              <p className="text-xs text-brand-text-soft leading-normal mt-1">
                Uang pembayaran dari UMKM disimpan dlu dengan aman di sistem. Dana ini baru akan diteruskan ke influencer setelah video promosi yang disepakati selesai diunggah.
              </p>
            </div>
            <div className="mt-4 text-[10px] font-bold text-brand-sky-dark font-mono">
              ★ Terjamin Aman & Transparan
            </div>
          </section>

          <section className="col-span-12 md:col-span-4 bg-brand-lav border border-brand-sand rounded-2xl p-6 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-brand-lav-dark uppercase tracking-wider">Solusi Adil</span>
              <h4 className="font-serif text-lg font-normal text-brand-text leading-tight">Bantuan Masalah Kerja</h4>
              <p className="text-xs text-brand-text-soft leading-normal mt-1">
                Jika ada kendala komunikasi atau ketidaksesuaian tugas, tim Admin kami yang netral dan ramah siap membantu mencarikan keputusan terbaik yang adil.
              </p>
            </div>
            <div className="mt-4 text-[10px] font-bold text-brand-lav-dark font-mono">
              ⚖ Saling Menghargai & Terlindungi
            </div>
          </section>

          <section className="col-span-12 md:col-span-4 bg-[#FAF9F6] border border-brand-sand rounded-2xl p-6 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-brand-text-light uppercase tracking-wider">Teknologi Pintar AI</span>
              <h4 className="font-serif text-lg font-normal text-brand-text leading-tight">Pembuat Rencana Promosi</h4>
              <p className="text-xs text-brand-text-soft leading-normal mt-1">
                Gunakan asisten kecerdasan buatan (AI) kami untuk menyusun contoh kalimat promosi dan arahan konten kreatif tanpa perlu pusing merangkai kata.
              </p>
            </div>
            <div className="mt-4 text-[10px] font-bold text-brand-text-soft font-mono">
              ⚡ Proses Praktis & Cepat
            </div>
          </section>

        </div>

      </main>

      {/* FOOTER BAR */}
      <footer className="w-full bg-brand-white border-t border-brand-sand/65 mt-12 py-6 text-center select-none">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] font-medium text-brand-text-light">
          <div>© 2026 InfluMatch. Platform kolaborasi UMKM dan influencer berbasis data.</div>
          <div className="flex gap-4">
            <span className="hover:text-brand-text-soft cursor-pointer">Panduan Keamanan</span>
            <span className="hover:text-brand-text-soft cursor-pointer">Syarat & Ketentuan</span>
            <span className="hover:text-brand-text-soft cursor-pointer">Layanan Pengaduan UMKM</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
