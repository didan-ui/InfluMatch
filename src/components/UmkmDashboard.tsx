import React, { useState, useEffect } from "react";
import { User, Campaign, EscrowTx, SystemLog } from "../types";
import {
  getDbCampaigns,
  getDbUsers,
  saveDbCampaign,
  saveDbUser,
  getDbEscrow,
  saveDbEscrow,
  getDbLogs,
  addDbLog,
} from "../utils";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, Search, SlidersHorizontal, Sparkles, Send, 
  CheckCircle, FileText, Wallet, BarChart3, Settings, 
  ArrowRight, ExternalLink, RefreshCw, Star, Info, AlertTriangle, Users
} from "lucide-react";

interface UmkmDashboardProps {
  currentUser: User;
  onLogout?: () => void;
}

export default function UmkmDashboard({ currentUser, onLogout }: UmkmDashboardProps) {
  const [activeTab, setActiveTab] = useState<"dashboard" | "discover" | "brief" | "escrow" | "analytics" | "profile">("dashboard");
  
  // Storage states
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [influencers, setInfluencers] = useState<User[]>([]);
  const [escrows, setEscrows] = useState<EscrowTx[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);

  // Search & Filter state for Discover
  const [searchQuery, setSearchQuery] = useState("");
  const [filterNiche, setFilterNiche] = useState("");
  const [filterFollowers, setFilterFollowers] = useState("");

  // AI Brief Form states
  const [selectedCampaignForBrief, setSelectedCampaignForBrief] = useState("");
  const [briefCampName, setBriefCampName] = useState("");
  const [briefObjective, setBriefObjective] = useState("Brand Awareness");
  const [briefAudience, setBriefAudience] = useState("Mahasiswa");
  const [briefPlatform, setBriefPlatform] = useState("TikTok");
  const [briefTone, setBriefTone] = useState("Fun & Casual");
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
  const [generatedBriefOutput, setGeneratedBriefOutput] = useState("");
  const [generationWarning, setGenerationWarning] = useState("");

  // Create Campaign form states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState("");
  const [newCampaignCategory, setNewCampaignCategory] = useState("Kuliner");
  const [newCampaignDesc, setNewCampaignDesc] = useState("");
  const [newCampaignBudget, setNewCampaignBudget] = useState(300000);
  const [newCampaignPlatform, setNewCampaignPlatform] = useState("TikTok");

  // Invite Influencer Modal states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [targetInfluencerToInvite, setTargetInfluencerToInvite] = useState<User | null>(null);
  const [selectedCampaignForInvite, setSelectedCampaignForInvite] = useState("");

  // Profile forms
  const [profileName, setProfileName] = useState(currentUser.name);
  const [profileBrand, setProfileBrand] = useState(currentUser.brandName || "");
  const [profileCategory, setProfileCategory] = useState(currentUser.brandCategory || "Kuliner");
  const [profileCity, setProfileCity] = useState(currentUser.city || "Malang");
  const [profileDesc, setProfileDesc] = useState("Warung lokal khas Nusantara dengan rasa berani & bumbu melimpah.");
  const [showProfileSuccess, setShowProfileSuccess] = useState(false);
  const [activeProfile, setActiveProfile] = useState<User>(currentUser);

  const forceRefresh = async () => {
    try {
      const [allCampaigns, allUsers, allEscrows, allLogs] = await Promise.all([
        getDbCampaigns(),
        getDbUsers(),
        getDbEscrow(),
        getDbLogs(),
      ]);
      const filteredCampaigns = allCampaigns.filter(c => (c.umkm_id ?? c.umkmId) === currentUser.id);
      const filteredUsers = allUsers.filter(u => u.role === "influencer" && u.id !== currentUser.id);
      const filteredEscrows = allEscrows.filter(e => filteredCampaigns.some(c => (c.id) === (e.campaign_id ?? e.campaignId)));
      const filteredLogs = allLogs.filter(l => l.actor_type === "umkm" || l.actor_type === "admin");
      const profileMatch = allUsers.find(u => u.id === currentUser.id) ?? currentUser;
      setActiveProfile(profileMatch);
      setProfileName(profileMatch.name || currentUser.name);
      setProfileBrand(profileMatch.brandName || "");
      setProfileCategory(profileMatch.brandCategory || "Kuliner");
      setProfileCity(profileMatch.city || "Malang");
      setCampaigns(filteredCampaigns);
      setInfluencers(filteredUsers);
      setEscrows(filteredEscrows);
      setLogs(filteredLogs);
    } catch (error) {
      console.error("Failed to refresh UMKM dashboard", error);
    }
  };

  useEffect(() => {
    void forceRefresh();
  }, [currentUser]);

  // Handle building dynamic Brief via Express server Gemini route
  const handleGenerateBrief = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingBrief(true);
    setGeneratedBriefOutput("");
    setGenerationWarning("");

    try {
      const response = await fetch("/api/generate-brief", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          campaignName: briefCampName || "Promo Menu Spesial",
          objective: briefObjective,
          audience: briefAudience,
          platform: briefPlatform,
          tone: briefTone,
          brandName: currentUser.brandName,
          brandCategory: currentUser.brandCategory,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setGeneratedBriefOutput(data.brief);
        if (data.warning) {
          setGenerationWarning(data.warning);
        }

        // Auto attach the brief if a campaign was selected
        if (selectedCampaignForBrief) {
          const allCampaigns = await getDbCampaigns();
          const target = allCampaigns.find(c => c.id === selectedCampaignForBrief);
          if (target) {
            const updatedTarget = { ...target, briefText: data.brief, brief_text: data.brief };
            await saveDbCampaign(updatedTarget);
            await addDbLog(currentUser.name, "AI Brief", `AI Brief ditautkan ke campaign ${target.name}`, "umkm");
            await forceRefresh();
          }
        }
      } else {
        setGeneratedBriefOutput("## Error\nGagal mengolah AI Brief: " + (data.error || "Unknown server response"));
      }
    } catch (err: any) {
      console.error(err);
      setGeneratedBriefOutput("## System Offline\nGagal menghubungi server Express: " + err.message);
    } finally {
      setIsGeneratingBrief(false);
    }
  };

  // Handle adding new custom campaigns
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaignName) return;

    try {
      const newCamp: Campaign = {
        id: "camp-" + Date.now(),
        name: newCampaignName,
        umkm_id: currentUser.id,
        umkmId: currentUser.id,
        umkm_name: currentUser.brandName || currentUser.name,
        umkmName: currentUser.brandName || currentUser.name,
        category: newCampaignCategory,
        description: newCampaignDesc || "Tidak ada deskripsi rinci.",
        budget: Number(newCampaignBudget),
        platform: newCampaignPlatform,
        objective: "Brand Awareness",
        audience: "Mahasiswa",
        tone: "Fun & Casual",
        status: "waiting",
        created_at: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        influencers: [],
      };

      await saveDbCampaign(newCamp);
      await addDbLog(currentUser.name, "Membuat Campaign", `UMKM membuat campaign baru "${newCampaignName}"`, "umkm");
      setNewCampaignName("");
      setNewCampaignDesc("");
      setShowCreateModal(false);
      await forceRefresh();
    } catch (error) {
      console.error("Failed to create campaign", error);
    }
  };

  // Execute Invitation
  const triggerInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetInfluencerToInvite || !selectedCampaignForInvite) return;

    try {
      const allCampaigns = await getDbCampaigns();
      const camp = allCampaigns.find(c => c.id === selectedCampaignForInvite);
      if (camp) {
        const influencers = camp.influencers || [];
        if (influencers.some(i => (i.influencer_id ?? i.influencerId) === targetInfluencerToInvite.id)) {
          alert(`${targetInfluencerToInvite.name} sudah tergabung/diundang dalam campaign ini.`);
          return;
        }

        influencers.push({
          id: `ci-${Date.now()}`,
          campaign_id: camp.id,
          campaignId: camp.id,
          influencer_id: targetInfluencerToInvite.id,
          influencerId: targetInfluencerToInvite.id,
          influencer_name: targetInfluencerToInvite.name,
          influencerName: targetInfluencerToInvite.name,
          status: "invited",
          escrow_released: false,
          escrowReleased: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        camp.influencers = influencers;
        if (camp.status === "waiting") {
          camp.status = "active";
        }

        await saveDbCampaign(camp);

        const newEscrowDraft: EscrowTx = {
          id: "tx-" + Date.now(),
          campaign_id: camp.id,
          campaignId: camp.id,
          campaign_name: camp.name,
          campaignName: camp.name,
          influencer_id: targetInfluencerToInvite.id,
          influencerId: targetInfluencerToInvite.id,
          influencer_name: targetInfluencerToInvite.name,
          influencerName: targetInfluencerToInvite.name,
          umkm_id: currentUser.id,
          umkmId: currentUser.id,
          amount: camp.budget,
          status: "pending",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        await saveDbEscrow(newEscrowDraft);
        await addDbLog(currentUser.name, "Undangan Influencer", `Mengundang ${targetInfluencerToInvite.name} ke campaign "${camp.name}"`, "umkm");
        setShowInviteModal(false);
        setTargetInfluencerToInvite(null);
        setSelectedCampaignForInvite("");
        await forceRefresh();
        alert(`Undangan berhasil dikirim ke ${targetInfluencerToInvite.name}! Status: Menunggu respon.`);
      }
    } catch (error) {
      console.error("Failed to invite influencer", error);
    }
  };

  // Release Escrow payment
  const handleReleaseEscrow = async (txId: string, campaignId?: string, influencerId?: string) => {
    try {
      if (!campaignId || !influencerId) return;

      const allEscrows = await getDbEscrow();
      const tx = allEscrows.find(e => e.id === txId);
      if (tx) {
        await saveDbEscrow({ ...tx, status: "released" });

        const allCampaigns = await getDbCampaigns();
        const camp = allCampaigns.find(c => c.id === campaignId);
        if (camp) {
          const influencers = camp.influencers || [];
          const inf = influencers.find(i => (i.influencer_id ?? i.influencerId) === influencerId);
          if (inf) {
            inf.status = "completed";
            inf.escrowReleased = true;
            inf.escrow_released = true;
          }
          if (influencers.every(i => i.status === "completed")) {
            camp.status = "completed";
          }
          await saveDbCampaign(camp);
        }

        await addDbLog(currentUser.name, "Persetujuan Escrow", `Melepaskan dana escrow Rp${tx.amount.toLocaleString()} ke ${tx.influencer_name ?? tx.influencerName}`, "umkm");
        await forceRefresh();
        alert("Pembayaran berhasil dicairkan! Terimakasih telah bekerja sama.");
      }
    } catch (error) {
      console.error("Failed to release escrow", error);
    }
  };

  // Lock Escrow / Bayar Ke Rekening Escrow Pertama
  const handleLockEscrow = async (txId: string, campaignId?: string, influencerId?: string) => {
    try {
      if (!campaignId || !influencerId) return;

      const allEscrows = await getDbEscrow();
      const tx = allEscrows.find(e => e.id === txId);
      if (tx) {
        await saveDbEscrow({ ...tx, status: "locked" });

        const allCampaigns = await getDbCampaigns();
        const camp = allCampaigns.find(c => c.id === campaignId);
        if (camp) {
          const influencers = camp.influencers || [];
          const inf = influencers.find(i => (i.influencer_id ?? i.influencerId) === influencerId);
          if (inf) {
            inf.status = "escrow_locked";
          }
          await saveDbCampaign(camp);
        }

        await addDbLog(currentUser.name, "Escrow Terkunci", `Mengirim dana iklan Rp${tx.amount.toLocaleString()} ke penampungan Escrow Sistem`, "umkm");
        await forceRefresh();
        alert("Dana telah berhasil diamankan di rekening Escrow InfluMatch! Influencer telah diberitahu untuk segera mengunggah/membuat konten.");
      }
    } catch (error) {
      console.error("Failed to lock escrow", error);
    }
  };

  // Update Profile Info
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const allUsers = await getDbUsers();
      const index = allUsers.findIndex(u => u.id === currentUser.id);
      if (index > -1) {
        const updatedUser = {
          ...allUsers[index],
          name: profileName,
          brandName: profileBrand,
          brand_name: profileBrand,
          brandCategory: profileCategory,
          brand_category: profileCategory,
          city: profileCity,
        };
        await saveDbUser(updatedUser);
        await addDbLog(currentUser.name, "Update Profil", "Mengubah informasi profil UMKM", "umkm");
        setShowProfileSuccess(true);
        setTimeout(() => setShowProfileSuccess(false), 2500);
      }
    } catch (error) {
      console.error("Failed to update profile", error);
    }
  };

  const totalAudience = influencers.reduce((sum, inf) => sum + (inf.followersNum || 0), 0);
  const audienceLabel = totalAudience >= 1000
    ? `${(totalAudience / 1000).toFixed(totalAudience >= 10000 ? 0 : 1)}K`
    : `${totalAudience}`;
  const activeCampaignCount = campaigns.filter(c => c.status === "active").length;
  const totalEscrowValue = escrows.reduce((sum, tx) => sum + tx.amount, 0);
  const releasedEscrowValue = escrows.filter(e => e.status === "released").reduce((sum, tx) => sum + tx.amount, 0);
  const matchScore = Math.min(99, 84 + campaigns.length * 2 + Math.max(0, influencers.length - 1) + (releasedEscrowValue > 0 ? 3 : 0));
  const recentLogs = logs.slice(0, 4);

  // Filter influencers for discover page
  const filteredInfluencers = influencers.filter(inf => {
    const matchesSearch = inf.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (inf.handle && inf.handle.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (inf.niche && inf.niche.join(" ").toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesNiche = !filterNiche || (inf.niche && inf.niche.includes(filterNiche));
    
    let matchesFollowers = true;
    if (filterFollowers === "1k-5k") {
      matchesFollowers = (inf.followersNum || 0) >= 1000 && (inf.followersNum || 0) <= 5000;
    } else if (filterFollowers === "5k-10k") {
      matchesFollowers = (inf.followersNum || 0) > 5000 && (inf.followersNum || 0) <= 10000;
    } else if (filterFollowers === "10k+") {
      matchesFollowers = (inf.followersNum || 0) > 10000;
    }

    return matchesSearch && matchesNiche && matchesFollowers;
  });

  return (
    <div className="flex bg-brand-bg min-h-[calc(100vh-64px)] font-sans flex-col md:flex-row">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 bg-brand-white border-r border-brand-sand shrink-0 py-6">
        <div className="px-6 pb-6 border-b border-brand-sand cursor-pointer hover:bg-brand-bg/10 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-brand-blush rounded-2xl flex items-center justify-center font-bold text-brand-blush-dark shadow-inner text-base">
              UM
            </div>
            <div>
              <h3 className="font-serif font-bold text-brand-text truncate leading-tight">{activeProfile.brandName || activeProfile.name || currentUser.brandName || "UMKM"}</h3>
              <p className="text-[11px] text-brand-text-light font-medium tracking-tight uppercase mt-0.5">Kategori {profileCategory || activeProfile.brandCategory || "Kuliner"}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-sage text-brand-sage-dark text-[10px] font-bold">
              <CheckCircle className="w-3 h-3" /> Rekanan Terpercaya
            </span>
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
            { id: "dashboard", label: "Halaman Utama", icon: Sparkles },
            { id: "discover", label: "Cari Influencer", icon: Search },
            { id: "analytics", label: "Laporan Hasil", icon: BarChart3 },
            { id: "escrow", label: "Pembayaran Aman", icon: Wallet },
            { id: "brief", label: "Asisten Naskah AI", icon: FileText },
            { id: "profile", label: "Profil Usaha", icon: Settings }
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
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  isActive 
                    ? "bg-brand-blush/50 border-l-4 border-brand-blush-dark text-brand-text shadow-sm" 
                    : "text-brand-brand-text-soft hover:bg-brand-bg/50 hover:text-brand-text"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-brand-blush-dark' : 'text-brand-text-light'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* DASHBOARD CONTENT BODY */}
      <main className="flex-1 p-6 lg:p-10 max-w-7xl">
        
        {/* TAB 1: DASHBOARD OVERVIEW */}
        {activeTab === "dashboard" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            
            {/* Page header and Bento Hero Banner block */}
            <div className="grid grid-cols-12 gap-5">
              
              {/* Bento Hero - Soft Sage Pastel Background with elegant dark-sage content */}
              <div className="col-span-12 lg:col-span-8 bg-brand-sage text-brand-text rounded-4xl p-8 relative overflow-hidden flex flex-col justify-between shadow-xs border border-brand-sand min-h-60">
                <div className="relative z-10 space-y-3">
                  <span className="px-3 py-1 bg-brand-sage-dark/15 text-brand-sage-dark text-[10px] font-black rounded-full uppercase tracking-wider">
                    🚀 Halaman Pemilik Usaha
                  </span>
                  <h1 className="font-serif text-3xl lg:text-4xl font-normal tracking-tight mt-3 text-brand-text">
                    Membantu Maju {activeProfile.brandName || activeProfile.name || currentUser.brandName || "UMKM Lokal"}
                  </h1>
                  <p className="text-brand-text-soft text-xs max-w-lg leading-relaxed">
                    Hubungkan usaha kuliner, fashion, atau gaya hidup Anda dengan influencer mahasiswa kreatif di Malang. Gunakan bantuan AI pintar untuk membuat arahan promosi Anda secara otomatis.
                  </p>
                </div>

                <div className="relative z-10 flex gap-8 pt-6 border-t border-brand-sage-dark/20 mt-4">
                  <div>
                    <div className="text-2xl font-black text-brand-sage-dark">{activeCampaignCount}</div>
                    <div className="text-[10px] text-brand-text-soft uppercase tracking-wide font-medium">Promosi Aktif</div>
                  </div>
                  <div className="w-px h-8 bg-brand-sand"></div>
                  <div>
                    <div className="text-2xl font-black text-brand-sage-dark">{matchScore}%</div>
                    <div className="text-[10px] text-brand-text-soft uppercase tracking-wide font-medium">Tingkat Kecocokan AI</div>
                  </div>
                </div>
              </div>

              {/* Bento Quick Action - Warm Blush Pink Pastel */}
              <div className="col-span-12 lg:col-span-4 bg-brand-blush border border-brand-sand rounded-3xl p-7 flex flex-col justify-between shadow-xs text-brand-text">
                <div className="space-y-2">
                  <div className="w-10 h-10 bg-brand-white text-brand-blush-dark rounded-full flex items-center justify-center mb-1 shadow-xs">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-base tracking-tight text-brand-text">Tulis Naskah Iklan (AI)</h4>
                  <p className="text-[11px] text-brand-text-soft leading-relaxed">
                    Belum punya ide tulisan promosi? Sampaikan ide pendek Anda, biar AI kami yang menyusun draf naskah yang menarik untuk influencer!
                  </p>
                </div>
                
                <button
                  onClick={() => setActiveTab("brief")}
                  className="w-full mt-4 py-2.5 bg-brand-blush-dark text-white text-xs font-bold rounded-xl hover:opacity-95 active:scale-95 transition-all cursor-pointer text-center"
                >
                  Buka Pembuat Draf
                </button>
              </div>

            </div>

            {/* Smart recommendation spotlight */}
            <div className="bg-brand-white border border-brand-sand rounded-3xl p-6 shadow-sm/10 flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="space-y-2 flex-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-sage text-brand-sage-dark text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-sage-dark animate-pulse"></span>
                  Saran Pintar AI Hari Ini
                </span>
                <p className="text-xs text-brand-text-soft leading-relaxed">
                  <strong className="text-brand-text">Peluang Ramai Malam Hari:</strong> Mahasiswa kos di Malang sangat aktif memesan makanan malam pukul 18:30 - 20:30 WIB. Cobalah bekerjasama dengan influencer bertema "Lifestyle" atau "Kuliner" agar promosi Anda tepat sasaran.
                </p>
              </div>
            </div>

            {/* Platform summary stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "KAMPANYE ANDA", value: campaigns.length, sub: `${activeCampaignCount} Sedang Berjalan` },
                { label: "POTENSI PENONTON", value: audienceLabel, sub: `${influencers.length} influencer terverifikasi` },
                { label: "AKURASI MATCHING", value: `${matchScore}%`, sub: "Berdasarkan kampanye & influencer" },
                { label: "DANA TERKUNCI", value: `Rp${totalEscrowValue.toLocaleString()}`, sub: "Total nilai escrow aktif" }
              ].map((stat, i) => (
                <div key={i} className="bg-brand-white border border-brand-sand rounded-2xl p-5 shadow-xs">
                  <p className="text-[9px] font-bold text-brand-text-light uppercase tracking-widest">{stat.label}</p>
                  <h4 className="font-serif text-2xl font-black text-brand-text mt-2">{stat.value}</h4>
                  <p className="text-[10px] text-brand-text-soft mt-1 leading-normal font-mono">{stat.sub}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Recent Activity Logs */}
              <div className="bg-brand-white border border-brand-sand rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif text-xl font-bold text-brand-text">Akivitas Terbaru</h3>
                  <button onClick={forceRefresh} className="text-xs text-brand-text-light hover:text-brand-text flex items-center gap-1 font-bold">
                    <RefreshCw className="w-3 h-3 hover:rotate-180 transition-transform duration-500" /> Segarkan
                  </button>
                </div>
                
                <div className="divide-y divide-brand-sand/50">
                  {recentLogs.map((log) => (
                    <div key={log.id} className="py-3.5 flex items-start gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-brand-sage-dark shrink-0 mt-1.5" />
                      <div>
                        <p className="text-xs text-brand-text-soft">
                          <span className="font-bold text-brand-text">{log.actor_name || log.actorName || log.actor || "Sistem"}</span>: {log.details}
                        </p>
                        <span className="text-[10px] text-brand-text-light font-mono block mt-0.5">
                          {new Date(log.date || log.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                  {logs.length === 0 && (
                    <div className="py-8 text-center text-xs text-brand-text-light">
                      Belum ada log aktivitas kampanye.
                    </div>
                  )}
                </div>
              </div>

              {/* Direct Quick Campaign Dashboard view with Create Button */}
              <div className="bg-brand-white border border-brand-sand rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-xl font-bold text-brand-text">Kampanye Saat Ini</h3>
                  <button 
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-blush text-brand-blush-dark text-xs font-bold hover:opacity-90 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Tambah
                  </button>
                </div>

                <div className="space-y-3 overflow-y-auto max-h-70 pr-1">
                  {campaigns.map((camp) => (
                    <div key={camp.id} className="p-3.5 border border-brand-sand/70 rounded-2xl hover:bg-brand-bg/15 transition-all flex items-center justify-between gap-4">
                      <div>
                        <h4 className="text-xs font-bold text-brand-text leading-tight">{camp.name}</h4>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="px-2 py-0.5 rounded-full bg-brand-bg text-brand-text-soft text-[9px] font-bold border border-brand-sand/40">
                            {camp.platform}
                          </span>
                          <span className="text-[10px] text-brand-text-light font-bold">
                            Budget: Rp{camp.budget.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold font-mono tracking-wide ${
                          camp.status === "active" ? "bg-brand-sage text-brand-sage-dark" :
                          camp.status === "waiting" ? "bg-brand-sky text-brand-sky-dark" : "bg-brand-blush text-brand-blush-dark"
                        }`}>
                          {camp.status.toUpperCase()}
                        </span>
                        <p className="text-[10px] text-brand-text-light mt-1">{(camp.influencers?.length ?? 0)} influencer</p>
                      </div>
                    </div>
                  ))}

                  {campaigns.length === 0 && (
                    <div className="text-center py-10">
                      <p className="text-xs text-brand-text-light">Belum ada kampanye terdaftar.</p>
                      <button 
                        onClick={() => setShowCreateModal(true)}
                        className="text-xs text-brand-blush-dark font-bold underline mt-2"
                      >
                        Bikin Sekarang
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>

          </motion.div>
        )}

        {/* TAB 2: DISCOVER INFLUENCERS */}
        {activeTab === "discover" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div>
              <h2 className="font-serif text-3xl font-bold tracking-tight text-brand-text">Cari Influencer yang Cocok</h2>
              <p className="mt-1 text-sm text-brand-text-soft">
                Temukan mahasiswa kreatif di Malang untuk menawarkan kerjasama promosi produk Anda dengan pengikut asli.
              </p>
            </div>

            {/* Filter controls */}
            <div className="bg-brand-white border border-brand-sand rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-brand-text-light absolute left-4 top-3.5" />
                  <input
                    type="text"
                    placeholder="Cari nama, username sosmed, atau jenis produk..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-brand-sand rounded-2xl bg-brand-bg/30 text-xs text-brand-text focus:outline-none"
                  />
                </div>

                <div className="flex gap-2">
                  <select
                    value={filterNiche}
                    onChange={(e) => setFilterNiche(e.target.value)}
                    className="font-bold border border-brand-sand rounded-2xl py-3 px-4 bg-brand-bg/30 text-xs text-brand-text-soft focus:outline-none cursor-pointer"
                  >
                    <option value="">Semua Kategori</option>
                    <option value="Kuliner">Kuliner (Makanan/Minuman)</option>
                    <option value="Fashion">Fashion (Baju/Aksesoris)</option>
                    <option value="Lifestyle">Lifestyle (Gaya Hidup/Hobi)</option>
                    <option value="Kecantikan">Kecantikan (Skincare/Make-up)</option>
                  </select>

                  <select
                    value={filterFollowers}
                    onChange={(e) => setFilterFollowers(e.target.value)}
                    className="font-bold border border-brand-sand rounded-2xl py-3 px-4 bg-brand-bg/30 text-xs text-brand-text-soft focus:outline-none cursor-pointer"
                  >
                    <option value="">Semua Jumlah Pengikut</option>
                    <option value="1k-5k">1K – 5K Pengikut</option>
                    <option value="5k-10k">5K – 10K Pengikut</option>
                    <option value="10k+">Di Atas 10K Pengikut</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Matching Influencer Rows */}
            <div className="space-y-4">
              {filteredInfluencers.map((inf) => (
                <div 
                  key={inf.id} 
                  className="bg-brand-white border border-brand-sand rounded-3xl p-5 shadow-sm hover:border-brand-blush-dark/30 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
                >
                  <div className="flex gap-4 items-center flex-1">
                    <div className="w-14 h-14 bg-brand-blush rounded-full flex items-center justify-center font-bold text-brand-blush-dark text-base border border-brand-sand shadow-inner shrink-0">
                      {inf.avatarUrl}
                    </div>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-serif font-black text-brand-text leading-none">{inf.name}</h4>
                        <span className="text-xs text-brand-text-light font-mono font-medium">{inf.handle}</span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F6E7B2] text-[#8A6A11] text-[10px] font-bold">
                          ★ {inf.rating || 4.8}
                        </span>
                      </div>

                      <p className="text-xs text-brand-text-soft">
                        📍 {inf.city} · Niche: {inf.niche?.join(" & ")}
                      </p>

                      <div className="flex gap-1.5 flex-wrap">
                        {inf.niche?.map(n => (
                          <span key={n} className="px-2.5 py-0.5 rounded-full bg-brand-blush/60 text-brand-blush-dark text-[9px] font-bold uppercase tracking-wider">
                            {n}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 shrink-0 justify-between w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-brand-sand/40">
                    <div className="flex gap-5">
                      <div>
                        <p className="text-[10px] font-bold text-brand-text-light tracking-wide uppercase">Pengikut</p>
                        <p className="font-serif text-lg font-bold text-brand-text mt-0.5">{inf.followers}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-brand-text-light tracking-wide uppercase">Kelekatan (Engagement)</p>
                        <p className="font-serif text-lg font-bold text-brand-text mt-0.5">{inf.engagement || "7.5%"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-brand-text-light tracking-wide uppercase">Biaya Jasa</p>
                        <p className="font-serif text-lg font-bold text-brand-text-soft mt-0.5">{inf.pricePerPost}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setTargetInfluencerToInvite(inf);
                        setShowInviteModal(true);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-brand-text text-brand-white text-xs font-bold hover:opacity-90 cursor-pointer text-center whitespace-nowrap active:scale-95 transition-all"
                    >
                      Hubungi / Undang
                    </button>
                  </div>
                </div>
              ))}

              {filteredInfluencers.length === 0 && (
                <div className="bg-brand-white border border-brand-sand rounded-3xl p-12 text-center text-brand-text-soft text-xs">
                  Tidak ada influencer yang memenuhi kriteria pencarian Anda.
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 3: CAMPAIGN ANALYTICS */}
        {activeTab === "analytics" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div>
              <h2 className="font-serif text-3xl font-bold tracking-tight text-brand-text">Analytics Performa Kampanye</h2>
              <p className="mt-1 text-sm text-brand-text-soft">
                Pantau total capaian, impresi, CTR, dan performa real-time mingguan.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Line chart widget */}
              <div className="bg-brand-white border border-brand-sand rounded-3xl p-6 shadow-sm col-span-1 lg:col-span-2 space-y-6">
                <div>
                  <h4 className="font-serif text-lg font-bold text-brand-text">Capaian Engagement Mingguan</h4>
                  <p className="text-xs text-brand-text-light mt-0.5">Metrik performa engagement campaign gabungan (7 Hari terakhir)</p>
                </div>

                <div className="w-full overflow-hidden justify-center items-center flex rounded-2xl bg-brand-bg/30 border border-brand-sand/50 p-4">
                  {/* Native precision SVG Area Graph */}
                  <svg viewBox="0 0 600 240" className="w-full h-auto select-none">
                    <line x1="40" y1="40" x2="560" y2="40" stroke="#E8DED2" strokeDasharray="4 4" />
                    <line x1="40" y1="90" x2="560" y2="90" stroke="#E8DED2" strokeDasharray="4 4" />
                    <line x1="40" y1="140" x2="560" y2="140" stroke="#E8DED2" strokeDasharray="4 4" />
                    <line x1="40" y1="190" x2="560" y2="190" stroke="#E8DED2" strokeDasharray="4 4" />

                    {/* Shading Area */}
                    <path
                      d="M40 180 C110 150, 180 145, 250 110 S390 85, 460 100 S520 60, 560 70 L560 210 L40 210 Z"
                      fill="rgba(184,109,94,0.12)"
                    />

                    {/* Border Line */}
                    <path
                      d="M40 180 C110 150, 180 145, 250 110 S390 85, 460 100 S520 60, 560 70"
                      fill="none"
                      stroke="#B86D5E"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />

                    {/* Nodes */}
                    <circle cx="40" cy="180" r="6" fill="#B86D5E" stroke="#FFFFFF" strokeWidth="2" />
                    <circle cx="160" cy="148" r="6" fill="#B86D5E" stroke="#FFFFFF" strokeWidth="2" />
                    <circle cx="280" cy="105" r="6" fill="#B86D5E" stroke="#FFFFFF" strokeWidth="2" />
                    <circle cx="420" cy="95" r="6" fill="#B86D5E" stroke="#FFFFFF" strokeWidth="2" />
                    <circle cx="560" cy="70" r="6" fill="#B86D5E" stroke="#FFFFFF" strokeWidth="2" />

                    {/* Day Text Labels */}
                    <text x="35" y="230" fontSize="12" className="fill-brand-text-light font-bold">Sen</text>
                    <text x="155" y="230" fontSize="12" className="fill-brand-text-light font-bold">Sel</text>
                    <text x="275" y="230" fontSize="12" className="fill-brand-text-light font-bold">Rab</text>
                    <text x="415" y="230" fontSize="12" className="fill-brand-text-light font-bold">Kam</text>
                    <text x="545" y="230" fontSize="12" className="fill-brand-text-light font-bold">Jum</text>
                  </svg>
                </div>
              </div>

              {/* AI system insights panel */}
              <div className="bg-brand-white border border-brand-sand rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-brand-blush-dark animate-spin-slow" />
                  <h3 className="font-serif text-lg font-bold text-brand-text">Smart AI Insight</h3>
                </div>

                <div className="space-y-4">
                  {[
                    "Konten berbentuk Shorts/TikTok Reels memperoleh CTR +18% lebih tinggi dibanding gambar statis.",
                    "Gen-Z & Mahasiswa Malang merespon positif konten berkonsep 'Makan Hemat Akhir Bulan'.",
                    "Aktivitas audiens puncak terdeteksi di hari Kamis malam, rekomendasikan posting terjadwal hari itu."
                  ].map((insight, j) => (
                    <div key={j} className="flex gap-2.5 items-start">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-blush-dark mt-1.5 shrink-0" />
                      <p className="text-xs text-brand-text-soft leading-relaxed">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Campaign details logs table */}
            <div className="bg-brand-white border border-brand-sand rounded-3xl p-6 shadow-sm overflow-hidden">
              <h3 className="font-serif text-xl font-bold text-brand-text mb-4">Daftar Kampanye Saya</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-brand-text">
                  <thead className="bg-brand-bg text-brand-text-soft uppercase tracking-wider font-bold">
                    <tr>
                      <th className="py-3 px-4 border-b border-brand-sand">KAMPANYE</th>
                      <th className="py-3 px-4 border-b border-brand-sand">PLATFORM</th>
                      <th className="py-3 px-4 border-b border-brand-sand">INFLUENCER</th>
                      <th className="py-3 px-4 border-b border-brand-sand">REACH EST.</th>
                      <th className="py-3 px-4 border-b border-brand-sand">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-sand/50">
                    {campaigns.map(camp => (
                      <tr key={camp.id} className="hover:bg-brand-bg/10">
                        <td className="py-3.5 px-4 font-bold">{camp.name}</td>
                        <td className="py-3.5 px-4"><span className="px-2 py-0.5 rounded-md bg-brand-bg border border-brand-sand/65 text-[10px] font-bold">{camp.platform}</span></td>
                        <td className="py-3.5 px-4 text-brand-text-soft">
                          {(camp.influencers?.length ?? 0) > 0
                            ? camp.influencers?.map(i => i.influencerName).join(", ")
                            : "Belum ada undangan"
                          }
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold">
                          {(camp.influencers?.length ?? 0) > 0 ? `${((camp.influencers?.length ?? 0) * 7.5).toFixed(1)}K` : "—"}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wide ${
                            camp.status === "active" ? "bg-brand-sage text-brand-sage-dark" :
                            camp.status === "waiting" ? "bg-brand-sky text-brand-sky-dark" : "bg-brand-blush text-brand-blush-dark"
                          }`}>
                            {camp.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {campaigns.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-brand-text-soft">Belum membuat kampanye apapun.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 4: SMART ESCROW & PAYMENTS */}
        {activeTab === "escrow" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div>
              <h2 className="font-serif text-3xl font-bold tracking-tight text-brand-text">Sistem Pembayaran Escrow</h2>
              <p className="mt-1 text-sm text-brand-text-soft">
                Pondasi keamanan finansial kerja sama digital. Bayar dengan tenang, dana dicairkan setelah divalidasi sistem.
              </p>
            </div>

            {/* Billing quick indicators */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {[
                { label: "DANA TERKUNCI", value: `Rp${escrows.filter(e => e.status === "locked").reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}`, desc: "Dana dalam penampungan" },
                { label: "MENUNGGU PERSETUJUAN", value: `Rp${escrows.filter(e => e.status === "pending").reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}`, desc: "Konten telah diserahkan" },
                { label: "TOTAL TERBAYAR", value: `Rp${escrows.filter(e => e.status === "released").reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}`, desc: "Sudah terbayar aman" },
                { label: "TRANSAKSI", value: escrows.length, desc: "Total riwayat escrow" }
              ].map((billingCard, k) => (
                <div key={k} className="bg-brand-white border border-brand-sand rounded-2xl p-5 shadow-xs">
                  <p className="text-[10px] font-bold text-brand-text-light tracking-widest">{billingCard.label}</p>
                  <h4 className="font-serif text-2xl font-black text-brand-text mt-2">{billingCard.value}</h4>
                  <p className="text-[11px] text-brand-text-soft mt-1">{billingCard.desc}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Timeline steps card */}
              <div className="bg-brand-white border border-brand-sand rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="font-serif text-xl font-bold text-brand-text">Bagaimana Escrow Melindungi Anda?</h3>
                
                <div className="space-y-4 pt-2">
                  {[
                    { step: "01", title: "Amankan Anggaran", text: "Anda mengunci dana pembayaran kampanye di sistem Escrow InfluMatch. Keamanan terjamin." },
                    { step: "02", title: "Konten Dibuat", text: "Influencer melihat jaminan dana, bersemangat memproduksi & mempublikasikan konten terbaik mereka." },
                    { step: "03", title: "Validasi & Pencairan", text: "Setelah postingan diverifikasi aktif dan sesuai brief, klik tombol persetujuan untuk meneruskan dana ke dompet mahasiswa." }
                  ].map((x, idx) => (
                    <div key={idx} className="flex gap-4 items-start">
                      <div className="w-8 h-8 rounded-full bg-brand-sage flex items-center justify-center font-bold text-xs text-brand-sage-dark shrink-0">
                        {x.step}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-brand-text leading-tight">{x.title}</h4>
                        <p className="text-[11px] text-brand-text-soft mt-1 leading-relaxed">{x.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transactions actions table */}
              <div className="bg-brand-white border border-brand-sand rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="font-serif text-xl font-bold text-brand-text">Tindakan Transaksi Aktif</h3>

                <div className="space-y-3 overflow-y-auto max-h-85 pr-1">
                  {escrows.map((tx) => (
                    <div key={tx.id} className="p-3.5 border border-brand-sand/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <p className="font-bold text-brand-text">{tx.campaignName}</p>
                        <p className="text-[11px] text-brand-text-soft mt-0.5">Kepada: {tx.influencerName} · Rp{tx.amount.toLocaleString()}</p>
                        <span className="text-[10px] text-brand-text-light">{tx.date}</span>
                      </div>

                      <div className="flex gap-2 self-end sm:self-center">
                        {tx.status === "pending" && (
                          <button
                            onClick={() => handleLockEscrow(tx.id, tx.campaign_id, tx.influencer_id)}
                            className="px-3 py-1.5 bg-brand-text text-brand-white font-bold rounded-xl hover:opacity-90 transition-all text-[11px] cursor-pointer whitespace-nowrap"
                          >
                            Kunci Dana Kemitraan (Bayar)
                          </button>
                        )}
                        {tx.status === "locked" && (
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 rounded bg-[#F8E8E8] text-[#9A2E2E] font-bold text-[10px] uppercase font-mono border border-[#9A2E2E]/20">
                              Dana Terkunci
                            </span>
                          </div>
                        )}
                        {tx.status === "released" && (
                          <span className="px-2 py-1 rounded bg-brand-sage text-brand-sage-dark font-bold text-[10px] uppercase font-mono">
                            BERHASIL CAIR
                          </span>
                        )}
                        
                        {/* If influencer has uploaded content and the user has locked funds, show Release button! */}
                        {tx.status === "locked" && (() => {
                          const associatedCamp = campaigns.find(c => c.id === tx.campaign_id);
                          const campaignInfluencers = associatedCamp?.influencers || [];
                          const member = campaignInfluencers.find(i => i.influencerId === tx.influencer_id);
                          if (member?.status === "content_uploaded") {
                            return (
                              <button
                                onClick={() => handleReleaseEscrow(tx.id, tx.campaign_id, tx.influencer_id)}
                                className="px-3 py-1.5 bg-brand-sage-dark text-brand-white font-bold rounded-xl hover:opacity-95 transition-all text-[11px] cursor-pointer"
                              >
                                Selesai & Cairkan Dana
                              </button>
                            );
                          }
                          return (
                            <span className="text-[10px] text-brand-text-light italic flex items-center gap-1">
                              <Info className="w-3" /> Menunggu Unggahan
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  ))}

                  {escrows.length === 0 && (
                    <div className="text-center py-10 text-brand-text-light text-xs">
                      Tidak ada riwayat pembukuan / escrow. Undang influencer untuk memulai!
                    </div>
                  )}
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* TAB 5: AUTO BRIEF AI GENERATOR */}
        {activeTab === "brief" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div>
              <h2 className="font-serif text-3xl font-bold tracking-tight text-brand-text">Auto AI Brief Generator</h2>
              <p className="mt-1 text-sm text-brand-text-soft">
                Gunakan asisten kecerdasan buatan Gemini 3.5 Flash untuk mengonstruksi brief kreatif berdaya pengaruh tinggi secara instan.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Interactive Generation Form */}
              <div className="bg-brand-white border border-brand-sand rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="font-serif text-xl font-bold text-brand-text">Rumusan Brief Baru</h3>
                
                <form onSubmit={handleGenerateBrief} className="space-y-4 text-xs font-bold uppercase tracking-wider text-brand-text-soft">
                  
                  {/* Option to link to an existing waitlisted campaign */}
                  <div>
                    <label className="block mb-2">Pilih Kampanye Saya (Tautkan Otomatis)</label>
                    <select
                      value={selectedCampaignForBrief}
                      onChange={(e) => {
                        setSelectedCampaignForBrief(e.target.value);
                        const c = campaigns.find(item => item.id === e.target.value);
                        if (c) {
                          setBriefCampName(c.name);
                        }
                      }}
                      className="w-full mt-1.5 border border-brand-sand bg-brand-bg/40 rounded-2xl px-4 py-3 font-medium text-brand-text focus:outline-none cursor-pointer"
                    >
                      <option value="">-- Buat tanpa ditautkan --</option>
                      {campaigns.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-2">Nama Kampanye Kreatif</label>
                    <input
                      type="text"
                      placeholder="Contoh: Promo Kuliner Geprek Level Lava"
                      value={briefCampName}
                      onChange={(e) => setBriefCampName(e.target.value)}
                      className="w-full mt-1.5 border border-brand-sand bg-brand-bg/40 rounded-2xl px-4 py-3 font-medium text-brand-text focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-2">Tujuan Kampanye</label>
                      <select
                        value={briefObjective}
                        onChange={(e) => setBriefObjective(e.target.value)}
                        className="w-full mt-1.5 border border-brand-sand bg-brand-bg/40 rounded-2xl px-4 py-3 font-medium text-brand-text focus:outline-none"
                      >
                        <option value="Brand Awareness">Brand Awareness</option>
                        <option value="Engagement">Social Engagement</option>
                        <option value="Penjualan">Peningkatan Penjualan</option>
                      </select>
                    </div>

                    <div>
                      <label className="block mb-2">Target Audiens</label>
                      <select
                        value={briefAudience}
                        onChange={(e) => setBriefAudience(e.target.value)}
                        className="w-full mt-1.5 border border-brand-sand bg-brand-bg/40 rounded-2xl px-4 py-3 font-medium text-brand-text focus:outline-none"
                      >
                        <option value="Mahasiswa">Mahasiswa Lokal</option>
                        <option value="Pekerja Muda">Karyawan & Pekerja Muda</option>
                        <option value="Gen Z">Masyarakat Umum Gen Z</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-2">Platform Media Utama</label>
                      <select
                        value={briefPlatform}
                        onChange={(e) => setBriefPlatform(e.target.value)}
                        className="w-full mt-1.5 border border-brand-sand bg-brand-bg/40 rounded-2xl px-4 py-3 font-medium text-brand-text focus:outline-none"
                      >
                        <option value="TikTok">TikTok Short Video</option>
                        <option value="Instagram">Instagram Reels/Story</option>
                        <option value="YouTube Shorts">YouTube Shorts</option>
                      </select>
                    </div>

                    <div>
                      <label className="block mb-2">Karakter Visual / Tone</label>
                      <select
                        value={briefTone}
                        onChange={(e) => setBriefTone(e.target.value)}
                        className="w-full mt-1.5 border border-brand-sand bg-brand-bg/40 rounded-2xl px-4 py-3 font-medium text-brand-text focus:outline-none"
                      >
                        <option value="Fun & Casual">Fun & Casual (Santai)</option>
                        <option value="Professional">Professional & Rinci</option>
                        <option value="Friendly">Friendly & Dekat (Hangat)</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isGeneratingBrief}
                    className="w-full py-4 rounded-2xl bg-brand-text text-brand-white font-bold text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-all select-none shadow-md disabled:opacity-50 cursor-pointer"
                  >
                    {isGeneratingBrief ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Merumuskan Ide Brief...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-brand-blush-dark" /> JALANKAN AI BRIEF GENERATOR
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Real-time Generated output */}
              <div className="bg-brand-white border border-brand-sand rounded-3xl p-6 shadow-sm flex flex-col h-130">
                <h3 className="font-serif text-xl font-bold text-brand-text shrink-0">Hasil AI Brief</h3>
                
                {generationWarning && (
                  <div className="bg-[#FAF3DC] border border-[#E8DAB0] text-[#916B16] rounded-xl p-2.5 mt-3 text-[10px] flex items-start gap-1.5 shrink-0 leading-normal">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{generationWarning}</span>
                  </div>
                )}

                <div className="flex-1 mt-4 overflow-y-auto border border-dashed border-brand-blush-dark rounded-2xl bg-brand-bg p-4 flex flex-col justify-between font-serif">
                  {isGeneratingBrief ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-3 shrink-0">
                      <div className="w-10 h-10 border-4 border-brand-blush-dark border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-xs font-sans text-brand-text-soft text-center animate-pulse">
                        Menganalisis demografi audiens ideal di Malang... <br />
                        Menyusun formula Do's & Don'ts khusus untuk menu {currentUser.brandName}!
                      </p>
                    </div>
                  ) : generatedBriefOutput ? (
                    <div className="prose prose-sm text-sm text-brand-text leading-relaxed whitespace-pre-line font-serif scrolling-touch select-text">
                      {generatedBriefOutput}
                    </div>
                  ) : (
                    <div className="text-center text-xs text-brand-text-light my-auto font-sans leading-relaxed">
                      Silakan isi rumusan di samping kiri, lalu klik tombol "Jalankan AI Brief" untuk mempermudah instruksi bagi influencer.
                    </div>
                  )}
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* TAB 6: BRAND PROFILE MANAGEMENT */}
        {activeTab === "profile" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div>
              <h2 className="font-serif text-3xl font-bold tracking-tight text-brand-text">Kelola Profil Usaha Anda</h2>
              <p className="mt-1 text-sm text-brand-text-soft">
                Selaraskan identitas brand Anda di platform untuk mengundang daya ketertarikan mahasiswa/influencer.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Identity Form */}
              <div className="bg-brand-white border border-brand-sand rounded-3xl p-6 shadow-sm">
                
                {showProfileSuccess && (
                  <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-3.5 text-xs flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>Informasi usaha berhasil diperbarui di server lokal.</span>
                  </div>
                )}

                <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs font-bold uppercase tracking-wider text-brand-text-soft">
                  
                  <div>
                    <label className="block mb-1.5">Nama Narahubung / Pemilik</label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full border border-brand-sand bg-brand-bg/40 rounded-2xl px-4 py-2.5 font-medium text-brand-text focus:outline-none text-xs"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5">Nama Brand Bisnis</label>
                    <input
                      type="text"
                      value={profileBrand}
                      onChange={(e) => setProfileBrand(e.target.value)}
                      className="w-full border border-brand-sand bg-brand-bg/40 rounded-2xl px-4 py-2.5 font-medium text-brand-text focus:outline-none text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1.5">Segmentasi Kategori</label>
                      <select
                        value={profileCategory}
                        onChange={(e) => setProfileCategory(e.target.value)}
                        className="w-full border border-brand-sand bg-brand-bg/40 rounded-2xl px-4 py-2.5 font-medium text-brand-text focus:outline-none text-xs"
                      >
                        <option value="Kuliner">Kuliner</option>
                        <option value="Fashion">Fashion</option>
                        <option value="Lifestyle">Lifestyle</option>
                        <option value="Kecantikan">Kecantikan</option>
                      </select>
                    </div>

                    <div>
                      <label className="block mb-1.5">Domisili Kota Utama</label>
                      <input
                        type="text"
                        value={profileCity}
                        onChange={(e) => setProfileCity(e.target.value)}
                        className="w-full border border-brand-sand bg-brand-bg/40 rounded-2xl px-4 py-2.5 font-medium text-brand-text focus:outline-none text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1.5">Ringkasan Deskripsi Brand</label>
                    <textarea
                      value={profileDesc}
                      onChange={(e) => setProfileDesc(e.target.value)}
                      className="w-full min-h-22.5 border border-brand-sand bg-brand-bg/50 rounded-2xl px-4 py-3 font-medium text-brand-text text-xs focus:outline-none leading-relaxed mt-1 border-solid"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-2xl bg-brand-text text-brand-white font-bold text-xs hover:opacity-90 active:scale-95 transition-all shadow-md cursor-pointer"
                  >
                    Simpan Perubahan Profil
                  </button>

                </form>
              </div>

              {/* Branding Reputations badge display */}
              <div className="bg-brand-white border border-brand-sand rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="font-serif text-xl font-bold text-brand-text mb-4">Skor & Reputasi Partner</h3>
                  
                  <div className="grid grid-cols-2 gap-4 my-4">
                    <div className="bg-brand-bg/40 border border-brand-sand/50 rounded-2xl p-4 text-center">
                      <p className="text-[10px] text-brand-text-light font-bold">RATING UMKM</p>
                      <p className="font-serif text-3xl font-black text-brand-text mt-1">4.9 ★</p>
                      <p className="text-[10px] text-brand-text-soft mt-1">Sangat komunikatif</p>
                    </div>

                    <div className="bg-brand-bg/40 border border-brand-sand/50 rounded-2xl p-4 text-center">
                      <p className="text-[10px] text-brand-text-light font-bold">KAMPANYE LOKAL</p>
                      <p className="font-serif text-3xl font-black text-brand-text mt-1">{campaigns.length} Sukses</p>
                      <p className="text-[10px] text-brand-text-soft mt-1">Selesai teratur</p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-brand-text-soft font-medium">Kecepatan Pembayaran (Lock Escrow):</span>
                      <span className="font-bold text-brand-sage-dark font-mono">98% Tepat Waktu</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-brand-text-soft font-medium">Indepth Brief Rating:</span>
                      <span className="font-bold text-brand-text font-mono">4.8 / 5.0</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-brand-text-soft font-medium">Rekomendasi Ulang Influencer:</span>
                      <span className="font-bold text-[#8A6A11] font-mono">100% Puas</span>
                    </div>
                  </div>
                </div>

                <div className="bg-brand-sage/20 border border-brand-sage-dark/15 rounded-2xl p-3.5 text-xs text-brand-sage-dark mt-6">
                  Profil Anda memiliki badge <span className="font-bold">"Fast Escrow release"</span>. Hal ini membuat influencer 2.5x lebih bersedia menerima undangan kerjasama Anda secara instan.
                </div>
              </div>

            </div>
          </motion.div>
        )}

      </main>

      {/* CREATE CAMPAIGN DIALOG MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
              <div className="fixed inset-0 bg-brand-text/50 transition-opacity" onClick={() => setShowCreateModal(false)}></div>
              
              <motion.div 
                initial={{ transform: "scale(0.95)", opacity: 0 }}
                animate={{ transform: "scale(1)", opacity: 1 }}
                exit={{ transform: "scale(0.95)", opacity: 0 }}
                className="bg-brand-white rounded-3xl overflow-hidden shadow-xl max-w-md w-full p-6 z-10 border border-brand-sand relative font-sans"
              >
                <h3 className="font-serif text-2xl font-bold text-brand-text mb-4">Bikin Campaign Baru</h3>
                
                <form onSubmit={handleCreateCampaign} className="space-y-4 text-xs font-bold uppercase tracking-wider text-brand-text-soft">
                  <div>
                    <label className="block mb-1.5">Nama Campaign</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Promo Kuliner Akhir Bulan"
                      value={newCampaignName}
                      onChange={(e) => setNewCampaignName(e.target.value)}
                      className="w-full border border-brand-sand bg-brand-bg/40 rounded-2xl px-4 py-2.5 font-medium text-brand-text focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5">Deskripsi Singkat</label>
                    <textarea
                      placeholder="Apa fokus utama kampanye?"
                      value={newCampaignDesc}
                      onChange={(e) => setNewCampaignDesc(e.target.value)}
                      className="w-full h-16 border border-brand-sand bg-brand-bg/40 rounded-2xl px-4 py-2 font-medium text-brand-text focus:outline-none border-solid mt-1 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1.5">Anggaran / Tarif Influencer</label>
                      <select
                        value={newCampaignBudget}
                        onChange={(e) => setNewCampaignBudget(Number(e.target.value))}
                        className="w-full border border-brand-sand bg-brand-bg/40 rounded-2xl px-4 py-2.5 font-medium text-brand-text focus:outline-none cursor-pointer"
                      >
                        <option value={150000}>Rp150.000</option>
                        <option value={250000}>Rp250.000</option>
                        <option value={400000}>Rp400.000</option>
                        <option value={750000}>Rp750.000</option>
                      </select>
                    </div>

                    <div>
                      <label className="block mb-1.5">Tipe Media Utama</label>
                      <select
                        value={newCampaignPlatform}
                        onChange={(e) => setNewCampaignPlatform(e.target.value)}
                        className="w-full border border-brand-sand bg-brand-bg/40 rounded-2xl px-4 py-2.5 font-medium text-brand-text focus:outline-none cursor-pointer"
                      >
                        <option value="TikTok">TikTok Video</option>
                        <option value="Instagram">Instagram Story/Reels</option>
                        <option value="YouTube-Shorts">YouTube Shorts</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3 justify-end font-sans">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2.5 rounded-xl border border-brand-sand text-brand-text-soft hover:bg-brand-bg text-xs font-bold transition-all cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-brand-text text-brand-white text-xs font-bold hover:opacity-90 transition-all cursor-pointer"
                    >
                      Bikin Campaign
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* INVITE INFLUENCER TRANSITIONAL DIALOG MODAL */}
      <AnimatePresence>
        {showInviteModal && targetInfluencerToInvite && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
              <div className="fixed inset-0 bg-brand-text/50 transition-opacity" onClick={() => {
                setShowInviteModal(false);
                setTargetInfluencerToInvite(null);
              }}></div>
              
              <motion.div 
                initial={{ transform: "scale(0.95)", opacity: 0 }}
                animate={{ transform: "scale(1)", opacity: 1 }}
                exit={{ transform: "scale(0.95)", opacity: 0 }}
                className="bg-brand-white rounded-3xl overflow-hidden shadow-xl max-w-md w-full p-6 z-10 border border-brand-sand relative font-sans"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-brand-blush text-brand-blush-dark font-bold font-sans flex items-center justify-center shrink-0">
                    {targetInfluencerToInvite.avatarUrl}
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-brand-text">Undang {targetInfluencerToInvite.name}</h3>
                    <p className="text-[10px] text-brand-text-light font-bold uppercase tracking-wider">{targetInfluencerToInvite.handle} · {targetInfluencerToInvite.followers} Followers</p>
                  </div>
                </div>

                <form onSubmit={triggerInvite} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-brand-text-soft mb-1.5">Pilih Campaign Anda</label>
                    <select
                      required
                      value={selectedCampaignForInvite}
                      onChange={(e) => setSelectedCampaignForInvite(e.target.value)}
                      className="w-full border border-brand-sand bg-brand-bg/40 rounded-2xl px-4 py-3 text-xs text-brand-text font-serif focus:outline-none cursor-pointer"
                    >
                      <option value="">-- Pilih Campaign --</option>
                      {campaigns.filter(c => c.status !== "completed").map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-brand-bg border border-brand-sand/50 rounded-2xl p-3.5 text-xs text-brand-text-soft leading-relaxed space-y-1.5">
                    <p>• Tarif standard {targetInfluencerToInvite.name} adalah <span className="font-bold">{targetInfluencerToInvite.pricePerPost}</span> per post.</p>
                    <p>• Setelah mengirim undangan, sistem akan membuka tagihan penampungan Escrow sebesar budget campaign tersebut.</p>
                  </div>

                  <div className="flex gap-2 pt-2 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setShowInviteModal(false);
                        setTargetInfluencerToInvite(null);
                      }}
                      className="px-4 py-2 border border-brand-sand rounded-xl text-brand-text-soft hover:bg-brand-bg text-xs font-bold transition-all cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={!selectedCampaignForInvite}
                      className="px-5 py-2 rounded-xl bg-brand-text text-brand-white text-xs font-bold hover:opacity-90 transition-all cursor-pointer disabled:opacity-40"
                    >
                      Kirim Undangan
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
