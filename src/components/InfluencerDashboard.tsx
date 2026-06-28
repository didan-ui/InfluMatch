import React, { useState, useEffect } from "react";
import { User, Campaign, EscrowTx } from "../types";
import {
  getDbCampaigns,
  saveDbCampaign,
  getDbEscrow,
  saveDbEscrow,
  getDbUsers,
  saveDbUser,
  addDbLog,
} from "../utils";
import { motion, AnimatePresence } from "motion/react";
import { 
  Inbox, Check, X, FileText, Send, DollarSign, Wallet, 
  Award, TrendingUp, Settings, MapPin, RefreshCw, Star, ExternalLink, HelpCircle 
} from "lucide-react";

interface InfluencerDashboardProps {
  currentUser: User;
  onLogout?: () => void;
}

export default function InfluencerDashboard({ currentUser, onLogout }: InfluencerDashboardProps) {
  const [activeTab, setActiveTab] = useState<"invites" | "active" | "browse" | "escrow" | "settings">("invites");
  
  // Storage states
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([]);
  const [escrows, setEscrows] = useState<EscrowTx[]>([]);

  // Submissions state
  const [submissionUrls, setSubmissionUrls] = useState<{ [campId: string]: string }>({});

  // Settings states
  const [price, setPrice] = useState(currentUser.pricePerPost || "");
  const [followers, setFollowers] = useState(currentUser.followers || "");
  const [handle, setHandle] = useState(currentUser.handle || "");
  const [city, setCity] = useState(currentUser.city || "");
  const [niche, setNiche] = useState<string[]>(currentUser.niche || []);
  const [showSettingsSuccess, setShowSettingsSuccess] = useState(false);

  const forceRefresh = async () => {
    try {
      const [allCampaigns, allEscrows] = await Promise.all([getDbCampaigns(), getDbEscrow()]);
      const myCamps = allCampaigns.filter(c => (c.influencers || []).some(i => (i.influencer_id ?? i.influencerId) === currentUser.id));
      const myEscrows = allEscrows.filter(e => (e.influencer_id ?? e.influencerId) === currentUser.id);
      setCampaigns(myCamps);
      setAllCampaigns(allCampaigns);
      setEscrows(myEscrows);
    } catch (error) {
      console.error("Failed to refresh influencer dashboard", error);
    }
  };

  useEffect(() => {
    void forceRefresh();
  }, [currentUser]);

  // Handle accepting brand invitations
  const acceptInvitation = async (campaignId: string) => {
    try {
      const allCampaigns = await getDbCampaigns();
      const camp = allCampaigns.find(c => c.id === campaignId);
      if (camp) {
        const influencers = camp.influencers || [];
        const index = influencers.findIndex(i => (i.influencer_id ?? i.influencerId) === currentUser.id);
        if (index > -1) {
          influencers[index].status = "brief_ready";
          await saveDbCampaign(camp);
          await addDbLog(currentUser.name, "Menerima Kampanye", `${currentUser.name} menyetujui undangan brand dari kampanye "${camp.name}"`, "influencer");
          await forceRefresh();
          alert("Undangan diterima! Silakan baca Brief Kampanye untuk memulai pengerjaan konten.");
        }
      }
    } catch (error) {
      console.error("Failed to accept invitation", error);
    }
  };

  // Handle declining brand invitations
  const declineInvitation = async (campaignId: string) => {
    try {
      const allCampaigns = await getDbCampaigns();
      const camp = allCampaigns.find(c => c.id === campaignId);
      if (camp) {
        const nextInfluencers = (camp.influencers || []).filter(i => (i.influencer_id ?? i.influencerId) !== currentUser.id);
        camp.influencers = nextInfluencers;
        if (nextInfluencers.length === 0) {
          camp.status = "waiting";
        }
        await saveDbCampaign(camp);
        await addDbLog(currentUser.name, "Menolak Kampanye", `${currentUser.name} menolak undangan kampanye "${camp.name}"`, "influencer");
        await forceRefresh();
        alert("Undangan ditolak.");
      }
    } catch (error) {
      console.error("Failed to decline invitation", error);
    }
  };

  // Handle uploading completed content URL
  const submitContent = async (campaignId: string) => {
    const url = submissionUrls[campaignId];
    if (!url) {
      alert("Mohon masukkan tautan video/postingan sosial Anda terlebih dahulu.");
      return;
    }

    try {
      const allCampaigns = await getDbCampaigns();
      const camp = allCampaigns.find(c => c.id === campaignId);
      if (camp) {
        const influencers = camp.influencers || [];
        const index = influencers.findIndex(i => (i.influencer_id ?? i.influencerId) === currentUser.id);
        if (index > -1) {
          influencers[index].status = "content_uploaded";
          influencers[index].submissionUrl = url;
          influencers[index].submission_url = url;
          await saveDbCampaign(camp);

          const allEscrows = await getDbEscrow();
          const tx = allEscrows.find(e => (e.campaign_id ?? e.campaignId) === campaignId && (e.influencer_id ?? e.influencerId) === currentUser.id);
          if (tx) {
            await saveDbEscrow({ ...tx, status: "pending" });
          }

          await addDbLog(currentUser.name, "Menyerahkan Konten", `${currentUser.name} mengunggah posting video konten untuk "${camp.name}"`, "influencer");
          setSubmissionUrls(prev => ({ ...prev, [campaignId]: "" }));
          await forceRefresh();
          alert("Konten Anda berhasil dikirim ke partner UMKM! Dana Escrow Anda kini berstatus 'Pending Approval' menunggu pelepasan dana dari pemilik UMKM.");
        }
      }
    } catch (error) {
      console.error("Failed to submit content", error);
    }
  };

  // Update settings info
  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const allUsers = await getDbUsers();
      const idx = allUsers.findIndex(u => u.id === currentUser.id);
      if (idx > -1) {
        const updatedUser = {
          ...allUsers[idx],
          pricePerPost: price,
          price_per_post: Number(String(price).replace(/[^0-9]/g, "")),
          followers,
          followersNum: Number(String(followers).replace(/[^0-9]/g, "")) || 0,
          handle,
          city,
          niche,
        };
        await saveDbUser(updatedUser);
        await addDbLog(currentUser.name, "Update Setelan", "Memperbarui metrik penawaran creator", "influencer");
        setShowSettingsSuccess(true);
        setTimeout(() => setShowSettingsSuccess(false), 2000);
      }
    } catch (error) {
      console.error("Failed to update influencer settings", error);
    }
  };

  // Toggle niche tags
  const handleNicheTagToggle = (tag: string) => {
    if (niche.includes(tag)) {
      setNiche(niche.filter(t => t !== tag));
    } else {
      setNiche([...niche, tag]);
    }
  };

  const incomingInvites = campaigns.filter(c => 
    (c.influencers || []).some(i => i.influencerId === currentUser.id && i.status === "invited")
  );

  const activeCamps = campaigns.filter(c => 
    (c.influencers || []).some(i => i.influencerId === currentUser.id && i.status !== "invited" && i.status !== "completed")
  );

  const completedCamps = campaigns.filter(c => 
    (c.influencers || []).some(i => i.influencerId === currentUser.id && i.status === "completed")
  );

  const availableCampaigns = allCampaigns.filter(c => c.status === "waiting" || c.status === "active");

  // Calculate earnings
  const earnedReleased = escrows.filter(e => e.status === "released").reduce((sum, current) => sum + current.amount, 0);
  const earnedLocked = escrows.filter(e => e.status === "locked" || e.status === "pending").reduce((sum, current) => sum + current.amount, 0);

  return (
    <div className="flex bg-brand-bg min-h-[calc(100vh-64px)] font-sans flex-col md:flex-row">
      
      {/* INFLUENCER SIDEBAR */}
      <aside className="w-full md:w-64 bg-brand-white border-r border-brand-sand shrink-0 py-6">
        <div className="px-6 pb-6 border-b border-brand-sand">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-brand-sage rounded-full flex items-center justify-center font-bold text-brand-sage-dark shadow-inner text-base">
              {currentUser.avatarUrl}
            </div>
            <div>
              <h3 className="font-serif font-bold text-brand-text truncate leading-tight">{currentUser.name}</h3>
              <p className="text-[11px] text-brand-text-light font-bold font-mono tracking-wide mt-0.5">{currentUser.handle}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <p className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-sage text-brand-sage-dark text-[10px] font-bold">
              <Award className="w-3.5 h-3.5" /> Akun Kreator Terverifikasi
            </p>
            {onLogout && (
              <button
                onClick={onLogout}
                className="ml-2 px-3 py-1 text-xs font-bold border border-brand-sand rounded-lg hover:bg-brand-bg transition-colors"
                title="Keluar dari akun"
              >
                Logout
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 px-4 space-y-1">
          <p className="px-3 text-xs tracking-widest font-bold text-brand-text-light uppercase mb-2 select-none">Menu Utama</p>
          {[
            { id: "invites", label: "Tawaran Kerjasama", icon: Inbox, badge: incomingInvites.length },
            { id: "active", label: "Tugas Berjalan", icon: FileText, badge: activeCamps.length },
            { id: "browse", label: "Jelajah Campaign", icon: TrendingUp, badge: availableCampaigns.length },
            { id: "escrow", label: "Dompet Saya", icon: Wallet },
            { id: "settings", label: "Atur Profil", icon: Settings }
          ].map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as any);
                  forceRefresh();
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  isActive 
                    ? "bg-brand-sage/55 border-l-4 border-brand-sage-dark text-brand-text shadow-sm" 
                    : "text-brand-text-soft hover:bg-brand-bg/50 hover:text-brand-text"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-brand-sage-dark' : 'text-brand-text-light'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="bg-brand-blush-dark/95 text-brand-white text-[9px] font-mono font-bold px-2 py-0.5 rounded-full select-none">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </aside>

      {/* BODY CONTENT */}
      <main className="flex-1 p-6 lg:p-10 max-w-7xl">
        
        {/* TAB 1: NEW BRAND INVITATIONS */}
        {activeTab === "invites" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div>
              <h2 className="font-serif text-3xl font-bold tracking-tight text-brand-text">Tawaran Kerjasama Masuk</h2>
              <p className="mt-1 text-sm text-brand-text-soft">
                Tinjau tawaran promosi dan kerjasama dari pemilik usaha yang sesuai dengan profil Anda.
              </p>
            </div>

            <div className="space-y-4">
              {incomingInvites.map((camp) => (
                <div 
                  key={camp.id} 
                  className="bg-brand-white border border-brand-sand rounded-3xl p-6 shadow-sm hover:border-brand-sage-dark/30 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-5"
                >
                  <div className="space-y-2.5 flex-1 select-text">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-blush text-brand-blush-dark text-[10px] font-bold uppercase tracking-wider">
                      kategori {camp.category}
                    </span>
                    <h3 className="font-serif text-2xl font-bold text-brand-text">{camp.name}</h3>
                    <p className="text-xs text-brand-text-soft leading-relaxed max-w-2xl">{camp.description}</p>
                    <div className="flex items-center gap-4 text-[11px] text-brand-text-light font-bold flex-wrap">
                      <span>Usaha: {camp.umkmName}</span>
                      <span>•</span>
                      <span>Target: {camp.audience}</span>
                      <span>•</span>
                      <span>Sosial Media: {camp.platform}</span>
                    </div>
                  </div>

                  <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch md:items-center gap-4 shrink-0 border-t md:border-t-0 border-brand-sand/40 pt-4 md:pt-0">
                    <div className="text-left md:text-right shrink-0">
                      <p className="text-[10px] font-bold text-brand-text-light uppercase tracking-wider">Dana Kerjasama</p>
                      <p className="font-serif text-2xl font-black text-brand-sage-dark">Rp{camp.budget.toLocaleString()}</p>
                      <p className="text-[9px] text-brand-text-soft">Dibayar setelah tugas selesai</p>
                    </div>

                    <div className="flex gap-2 font-sans font-bold">
                      <button 
                        onClick={() => declineInvitation(camp.id)}
                        className="px-4 py-2.5 border border-brand-sand hover:bg-brand-bg rounded-xl text-brand-text-soft text-xs cursor-pointer select-none"
                      >
                        Tolak
                      </button>
                      <button 
                        onClick={() => acceptInvitation(camp.id)}
                        className="px-5 py-2.5 bg-brand-text text-brand-white hover:opacity-90 rounded-xl text-xs flex items-center gap-1 cursor-pointer select-none active:scale-[0.98] transition-all"
                      >
                        <Check className="w-4 h-4 text-brand-sage-dark" /> Terima Kerjasama
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {incomingInvites.length === 0 && (
                <div className="bg-brand-white border border-brand-sand rounded-3xl p-12 text-center text-brand-text-soft text-xs flex flex-col items-center justify-center space-y-3">
                  <Inbox className="w-10 h-10 text-brand-text-light" />
                  <p>Saat ini tidak ada tawaran kerjasama baru untuk Anda.</p>
                  <p className="text-[11px] text-brand-text-light">Lengkapi data kategori bidang di profil Anda agar lebih mudah dicari pemilik usaha!</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 2: ACTIVE CAMPAIGNS & SUBMISSIONS */}
        {activeTab === "active" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div>
              <h2 className="font-serif text-3xl font-bold tracking-tight text-brand-text">Tugas Kerjasama Berjalan</h2>
              <p className="mt-1 text-sm text-brand-text-soft">
                Baca petunjuk arahan konten, buat video kreasi Anda, lalu masukkan link postingan sosial media Anda di bawah ini setelah selesai diunggah.
              </p>
            </div>

            <div className="space-y-6">
              {activeCamps.map((camp) => {
                const myMilestone = (camp.influencers || []).find(i => i.influencerId === currentUser.id);
                return (
                  <div key={camp.id} className="bg-brand-white border border-brand-sand rounded-3xl p-6 shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-brand-sand/50">
                      <div>
                        <h3 className="font-serif text-2xl font-bold text-brand-text">{camp.name}</h3>
                        <p className="text-xs text-brand-text-soft mt-1">Pemilik usaha: <span className="font-bold text-brand-text">{camp.umkmName}</span></p>
                      </div>

                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold font-mono uppercase tracking-wide inline-block ${
                          myMilestone?.status === "content_uploaded" ? "bg-brand-sky text-brand-sky-dark border border-brand-sky-dark/20" :
                          myMilestone?.status === "escrow_locked" ? "bg-brand-sage text-brand-sage-dark" : "bg-[#FBEED7] text-[#8C5D12]"
                        }`}>
                          {myMilestone?.status === "brief_ready" ? "MENUNGGU JAMINAN DANA" :
                           myMilestone?.status === "escrow_locked" ? "ANGGARAN SUDAH AMAN / BISA MULAI BUAT VIDEO" : "MENUNGGU PERSETUJUAN UMKM"}
                        </span>
                        <p className="text-[10px] text-brand-text-light font-bold mt-1.5">Platform: {camp.platform}</p>
                      </div>
                    </div>

                    {myMilestone?.status === "brief_ready" && (
                      <div className="p-4 rounded-2xl bg-[#FFF6EB] border border-[#ECD9C5] text-xs text-[#9B6F3E] flex gap-2">
                        <HelpCircle className="w-5 shrink-0" />
                        <div>
                          <p className="font-bold">Informasi Kunci Pembayaran:</p>
                          <p className="mt-1 leading-normal">
                            Anda sudah menyetujui kampanye ini. Mohon menunggu pihak UMKM (<span className="font-sans font-bold">{camp.umkmName}</span>) mengunci dana anggaran kampanye (Lock Escrow) sebesar <span className="font-sans font-bold">Rp{camp.budget.toLocaleString()}</span> ke rekening simpanan bersama. Setelah terkunci, instruksi produksi konten akan aktif secara penuh bagi Anda.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-brand-text">
                        <FileText className="w-4 h-4 text-brand-blush-dark animate-pulse" />
                        <h4 className="text-xs font-black tracking-widest uppercase">KREATIF BRIEF INDEPTH (GENERASI AI):</h4>
                      </div>
                      <div className="p-4 rounded-2xl bg-brand-bg text-xs font-serif text-brand-text leading-relaxed whitespace-pre-line border border-brand-sand block shadow-inner max-h-55 overflow-y-auto select-text scrollbar-thin">
                        {camp.briefText || "Belum ada brief yang dimasukkan oleh pemilik brand."}
                      </div>
                    </div>

                    {myMilestone?.status === "escrow_locked" && (
                      <div className="p-5 border border-dashed border-brand-sage-dark/50 bg-brand-sage/10 rounded-2xl space-y-4">
                        <div>
                          <h4 className="text-xs font-black uppercase text-brand-sage-dark">KIRIM LINK POSTINGAN KONTEN ANDA</h4>
                          <p className="text-[11px] text-brand-text-soft mt-1 leading-normal">Tunjukkan bukti komitmen kerja Anda. Salin tautan postingan live dari kanal {camp.platform} Anda di bawah untuk diverifikasi partner UMKM.</p>
                        </div>

                        <div className="flex gap-2">
                          <input
                            type="url"
                            placeholder={`https://${camp.platform.toLowerCase()}.com/username/post/...`}
                            value={submissionUrls[camp.id] || ""}
                            onChange={(e) => setSubmissionUrls(prev => ({ ...prev, [camp.id]: e.target.value }))}
                            className="bg-brand-white border border-brand-sand rounded-xl px-4 py-3 text-xs w-full focus:outline-none focus:ring-1 focus:ring-brand-sage-dark text-brand-text"
                          />
                          <button
                            onClick={() => submitContent(camp.id)}
                            className="px-4 py-3 bg-brand-sage-dark text-brand-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap active:scale-95 transition-transform"
                          >
                            <Send className="w-4 h-4" /> Kumpulkan Konten
                          </button>
                        </div>
                      </div>
                    )}

                    {myMilestone?.status === "content_uploaded" && (
                      <div className="p-5 rounded-2xl bg-brand-sky/15 border border-brand-sky-dark/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs select-text">
                        <div className="space-y-1">
                          <p className="font-bold text-brand-sky-dark uppercase tracking-wide">POSTING VIDEO SELESAI DIKUMPULKAN</p>
                          <p className="text-[11px] text-brand-text-soft leading-normal">Link Penugasan Anda: <a href={myMilestone.submissionUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-brand-blush-dark underline inline-flex items-center gap-1 select-all">{myMilestone.submissionUrl} <ExternalLink className="w-3" /></a></p>
                          <p className="text-[10px] text-brand-text-light font-medium mt-1">Sistem sedang menganalisis keaktifan penugasan. Partner UMKM akan segera memproses pencairan dana Escrow ke rekening Anda.</p>
                        </div>

                        <span className="px-3 py-1 bg-brand-sky text-brand-sky-dark font-sans font-bold uppercase rounded-lg">
                          MENUNGGU APPROVAL CAIR
                        </span>
                      </div>
                    )}

                  </div>
                );
              })}

              {activeCamps.length === 0 && (
                <div className="bg-brand-white border border-brand-sand rounded-3xl p-12 text-center text-brand-text-soft text-xs leading-relaxed max-w-xl">
                  Tidak ada kampanye aktif berstatus sedang diproduksi. Tinjau Undangan Masuk Anda untuk mengaktifkannya!
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 3: CAMPAIGNS FOR BROWSE */}
        {activeTab === "browse" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div>
              <h2 className="font-serif text-3xl font-bold tracking-tight text-brand-text">Jelajah Kampanye Terbuka</h2>
              <p className="mt-1 text-sm text-brand-text-soft">
                Temukan campaign yang tersedia tanpa perlu diundang. Pilih peluang brand yang cocok dengan gaya konten Anda.
              </p>
            </div>

            <div className="space-y-6">
              {availableCampaigns.map((camp) => {
                const isInvited = (camp.influencers || []).some(i => i.influencerId === currentUser.id);
                return (
                  <div key={camp.id} className="bg-brand-white border border-brand-sand rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between gap-6">
                    <div className="space-y-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-blush text-brand-blush-dark text-[10px] font-bold uppercase tracking-wider">
                        {camp.category}
                      </span>
                      <h3 className="font-serif text-2xl font-bold text-brand-text">{camp.name}</h3>
                      <p className="text-xs text-brand-text-soft max-w-2xl leading-relaxed">{camp.description}</p>
                      <div className="flex flex-wrap gap-3 text-[11px] text-brand-text-light font-bold mt-2">
                        <span>UMKM: {camp.umkmName}</span>
                        <span>Platform: {camp.platform}</span>
                        <span>Target: {camp.audience}</span>
                      </div>
                    </div>

                    <div className="flex flex-col justify-between items-start md:items-end gap-4 shrink-0">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${camp.status === "active" ? "bg-brand-sage text-brand-sage-dark" : "bg-[#FBEED7] text-[#8C5D12]"}`}>
                        {camp.status === "active" ? "Terbuka untuk Creator" : "Menunggu Undangan"}
                      </span>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-brand-text-light uppercase tracking-widest">Budget</p>
                        <p className="font-serif text-2xl font-black text-brand-sage-dark">Rp{camp.budget.toLocaleString()}</p>
                      </div>
                      <div className="text-xs text-brand-text-light">
                        {isInvited ? "Anda telah diundang ke campaign ini" : "Bisa dipelajari tanpa undangan"}
                      </div>
                    </div>
                  </div>
                );
              })}

              {availableCampaigns.length === 0 && (
                <div className="bg-brand-white border border-brand-sand rounded-3xl p-12 text-center text-brand-text-soft text-xs leading-relaxed max-w-xl">
                  Belum ada campaign terbuka untuk dilihat. Coba lagi nanti atau lengkapi profil agar UMKM lebih mudah menemukan Anda.
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 4: SMART ESCROW WALLET */}
        {activeTab === "escrow" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div>
              <h2 className="font-serif text-3xl font-bold tracking-tight text-brand-text">Pencairan Dana Escrow & Wallet</h2>
              <p className="mt-1 text-sm text-brand-text-soft">
                Saldo tabungan hasil karya konten kreator Anda terlindungi oleh regulasi escrow digital multi-pihak InfluMatch.
              </p>
            </div>

            {/* Balances indicators */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <div className="bg-brand-white border border-brand-sand rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-bold text-brand-text-light tracking-widest uppercase">SALDO SIAP DICAIRKAN (DANA BERHASIL)</p>
                  <h4 className="font-serif text-4xl font-black text-brand-sage-dark mt-2.5">Rp{earnedReleased.toLocaleString()}</h4>
                  <p className="text-xs text-brand-text-soft mt-1 leading-normal">Telah disetujui penuh oleh masing-masing pemilik brand partner Anda.</p>
                </div>
                <button
                  disabled={earnedReleased === 0}
                  className="w-full mt-6 py-3 rounded-xl bg-brand-text text-brand-white font-bold text-xs hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 select-none cursor-pointer"
                >
                  Ajukan Penarikan Dana Ke Rekening Bank
                </button>
              </div>

              <div className="bg-brand-white border border-brand-sand rounded-3xl p-6 shadow-sm">
                <p className="text-[10px] font-bold text-brand-text-light tracking-widest uppercase">DANA SEDANG TERIKAT (ESCROW DRAFT)</p>
                <h4 className="font-serif text-4xl font-black text-brand-text-soft mt-2.5">Rp{earnedLocked.toLocaleString()}</h4>
                <p className="text-xs text-brand-text-soft mt-2 leading-relaxed">Dana terikat dalam penampungan aman. Akan otomatis cair setelah konten Anda diserahkan dan disetujui partner UMKM.</p>
              </div>

              <div className="bg-brand-white border border-brand-sand rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="font-serif text-lg font-bold text-brand-text">Kepuasan Partner</h4>
                  <div className="flex items-center gap-1 flex-row mt-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-4 h-4 fill-brand-blush-dark/95 text-transparent shrink-0" />
                    ))}
                    <span className="text-xs font-bold text-brand-text ml-1">(4.9/5.0)</span>
                  </div>
                  <p className="text-xs text-brand-text-soft leading-normal mt-2">Reputasi Anda sangat prima. Layanan brief andal dan pengerjaan tepat waktu.</p>
                </div>

                <div className="text-[10px] bg-brand-sage text-brand-sage-dark font-bold rounded-lg p-2.5 text-center uppercase tracking-wide">
                  {currentUser.handle ? `Profil ${currentUser.handle}` : "Profil Aktif"}
                </div>
              </div>

            </div>

            {/* Completed campaigns log summary table */}
            <div className="bg-brand-white border border-brand-sand rounded-3xl p-6 shadow-sm overflow-hidden">
              <h3 className="font-serif text-xl font-bold text-brand-text mb-4">Riwayat Kemitraan Selesai</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-brand-text select-text">
                  <thead className="bg-brand-bg text-brand-text-soft uppercase tracking-wider font-bold">
                    <tr>
                      <th className="py-3 px-4 border-b border-brand-sand">KAMPANYE</th>
                      <th className="py-3 px-4 border-b border-brand-sand">PARTNER UMKM</th>
                      <th className="py-3 px-4 border-b border-brand-sand">NOMINAL CAIR</th>
                      <th className="py-3 px-4 border-b border-brand-sand">LINK BUKTI</th>
                      <th className="py-3 px-4 border-b border-brand-sand">STATUS ESCROW</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-sand/50">
                    {completedCamps.map(camp => {
                      const me = (camp.influencers || []).find(i => i.influencerId === currentUser.id);
                      return (
                        <tr key={camp.id} className="hover:bg-brand-bg/10">
                          <td className="py-3.5 px-4 font-bold">{camp.name}</td>
                          <td className="py-3.5 px-4 text-brand-text-soft">{camp.umkmName}</td>
                          <td className="py-3.5 px-4 font-mono font-bold text-brand-sage-dark">Rp{camp.budget.toLocaleString()}</td>
                          <td className="py-3.5 px-4 text-brand-text-light underline truncate max-w-37.5">
                            <a href={me?.submissionUrl} target="_blank" rel="noopener noreferrer" className="hover:text-brand-blush-dark inline-flex items-center gap-1">{me?.submissionUrl ? "Lihat Post" : "—"} <ExternalLink className="w-3" /></a>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-0.5 rounded-full bg-brand-sage text-brand-sage-dark font-mono font-bold uppercase text-[9px] tracking-wide">
                              Selesai (Cair)
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {completedCamps.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-brand-text-soft">Belum menyelesaikan kampanye kerjasama apapun.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 4: SETTINGS & METRICS UPDATE */}
        {activeTab === "settings" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div>
              <h2 className="font-serif text-3xl font-bold tracking-tight text-brand-text">Akun Profil Kreator</h2>
              <p className="mt-1 text-sm text-brand-text-soft">
                Tingkatkan detail kredibilitas data metrik channel Anda di hadapan brand partner untuk memancing undangan kampanye.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              <div className="bg-brand-white border border-brand-sand rounded-3xl p-6 shadow-sm">
                
                {showSettingsSuccess && (
                  <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-3.5 text-xs flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>Perubahan seteran metrik kreator Anda telah sukses disimpan!</span>
                  </div>
                )}

                <form onSubmit={handleUpdateSettings} className="space-y-4 text-xs font-bold uppercase tracking-wider text-brand-text-soft">
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1.5">Social Media Handle (Username)</label>
                      <input
                        type="text"
                        value={handle}
                        onChange={(e) => setHandle(e.target.value)}
                        className="w-full border border-brand-sand bg-brand-bg/40 rounded-2xl px-4 py-2.5 font-medium text-brand-text focus:outline-none text-xs"
                      />
                    </div>

                    <div>
                      <label className="block mb-1.5">Domisili Kota Kreator</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full border border-brand-sand bg-brand-bg/40 rounded-2xl px-4 py-2.5 font-medium text-brand-text focus:outline-none text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1.5">Followers Metrik</label>
                      <select
                        value={followers}
                        onChange={(e) => setFollowers(e.target.value)}
                        className="w-full border border-brand-sand bg-brand-bg/40 rounded-2xl px-4 py-2.5 font-medium text-brand-text focus:outline-none text-xs cursor-pointer"
                      >
                        <option value="5.1K">5.1K - Micro</option>
                        <option value="7.8K">7.8K - Micro</option>
                        <option value="9.4K">9.4K - Micro Star</option>
                        <option value="12K">12K - Rising Star</option>
                        <option value="25K">25K - Macro Creator</option>
                      </select>
                    </div>

                    <div>
                      <label className="block mb-1.5">Tarif Kerjasama per Post</label>
                      <select
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full border border-brand-sand bg-brand-bg/40 rounded-2xl px-4 py-2.5 font-medium text-brand-text focus:outline-none text-xs cursor-pointer"
                      >
                        <option value="Rp150.000">Rp150.000 / Post</option>
                        <option value="Rp250.000">Rp250.000 / Post</option>
                        <option value="Rp400.000">Rp400.000 / Post</option>
                        <option value="Rp750.000">Rp750.000 / Post</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block mb-2">Fokus Niche Konten Utama Anda (Bisa multi pilihan)</label>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {["Kuliner", "Fashion", "Lifestyle", "Kecantikan"].map((tag) => {
                        const active = niche.includes(tag);
                        return (
                          <button
                            type="button"
                            key={tag}
                            onClick={() => handleNicheTagToggle(tag)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                              active
                                ? "bg-brand-sage-dark text-brand-white shadow-sm/15"
                                : "bg-brand-bg text-brand-text-soft border border-brand-sand/60 hover:bg-brand-bg/85"
                            }`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-2xl bg-brand-text text-brand-white font-bold text-xs hover:opacity-90 active:scale-95 transition-all shadow-md cursor-pointer"
                  >
                    Simpan Perubahan Metrik
                  </button>

                </form>
              </div>

              {/* Verified badges details display card */}
              <div className="bg-brand-white border border-brand-sand rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="font-serif text-xl font-bold text-brand-text">Kredensial Influencer Terverifikasi</h3>
                  <p className="text-xs text-brand-text-soft mt-1 leading-normal">Kanal sosial Anda dianalisis oleh validator eksternal dan dinilai layak berkolaborasi dengan standar jaminan reputasi.</p>
                  
                  <div className="space-y-4 pt-6">
                    <div className="flex items-start gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-brand-sage-dark shrink-0 mt-1.5" />
                      <div>
                        <h4 className="text-xs font-bold text-brand-text leading-tight">Keaslian Audiens Tertinggi (Genuine Audit)</h4>
                        <p className="text-[11px] text-brand-text-light leading-snug mt-0.5">Audiens dinilai 94.2% otentik, bebas dari bot pasif atau spam eksternal.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-brand-sage-dark shrink-0 mt-1.5" />
                      <div>
                        <h4 className="text-xs font-bold text-brand-text leading-tight">Ketaatan Waktu Konten (Punctual Creator)</h4>
                        <p className="text-[11px] text-brand-text-light leading-snug mt-0.5">Rata-rata pengerjaan Anda berada di bawah batas waktu s/d 1.5 hari lebih dini.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-brand-blush/25 border border-brand-blush-dark/15 rounded-xl text-xs text-brand-text-soft leading-relaxed mt-6">
                  Akun Anda saat ini memiliki reputasi <span className="font-bold text-brand-blush-dark">{currentUser.rating > 0 ? `${currentUser.rating.toFixed(1)} / 5.0` : "baru"}</span>. Brand mitra dapat melihat profil Anda berdasarkan data yang sudah Anda lengkapi.
                </div>
              </div>

            </div>
          </motion.div>
        )}

      </main>

    </div>
  );
}
