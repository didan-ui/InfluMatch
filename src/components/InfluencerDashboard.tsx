import React, { useState, useEffect } from "react";
import { User, Campaign, EscrowTx, SystemLog, WithdrawalTx } from "../types";
import { 
  getDbCampaigns, 
  saveDbCampaign, 
  getDbEscrow, 
  saveDbEscrow, 
  getDbUsers, 
  addDbLog,
  db
} from "../utils";
import { motion, AnimatePresence } from "motion/react";
import { 
  Inbox, Check, X, FileText, Send, DollarSign, Wallet, 
  Award, TrendingUp, Settings, MapPin, RefreshCw, Star, ExternalLink, HelpCircle, Search 
} from "lucide-react";
import CustomAlert from "./CustomAlert";

interface InfluencerDashboardProps {
  currentUser: User;
  onUserUpdate?: (user: User) => void;
}

export default function InfluencerDashboard({ currentUser, onUserUpdate }: InfluencerDashboardProps) {
  const [activeTab, setActiveTab] = useState<"discover" | "invites" | "active" | "escrow" | "settings">("discover");

  // Custom Alert state
  const [alertInfo, setAlertInfo] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "info" | "warning";
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info"
  });
  
  // Storage states
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [allDbCampaigns, setAllDbCampaigns] = useState<Campaign[]>([]);
  const [escrows, setEscrows] = useState<EscrowTx[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalTx[]>([]);

  // Submissions state
  const [submissionUrls, setSubmissionUrls] = useState<{ [campId: string]: string }>({});

  // Discover campaigns search & filters
  const [discoverSearch, setDiscoverSearch] = useState("");
  const [discoverCategory, setDiscoverCategory] = useState("");
  const [discoverPlatform, setDiscoverPlatform] = useState("");
  const [discoverStatus, setDiscoverStatus] = useState("all");
  const [discoverSort, setDiscoverSort] = useState("newest");

  // Settings states
  const [profileName, setProfileName] = useState(currentUser.name);
  const [price, setPrice] = useState(currentUser.pricePerPost || "Rp250.000");
  const [followers, setFollowers] = useState(currentUser.followers || "5.1K");
  const [handle, setHandle] = useState(currentUser.handle || "@siska");
  const [city, setCity] = useState(currentUser.city || "Malang");
  const [niche, setNiche] = useState<string[]>(currentUser.niche || []);
  const [showSettingsSuccess, setShowSettingsSuccess] = useState(false);

  // Withdraw states
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawBank, setWithdrawBank] = useState("BCA");
  const [withdrawAccountNo, setWithdrawAccountNo] = useState("");
  const [withdrawAccountHolder, setWithdrawAccountHolder] = useState(currentUser.name);

  // UMKM Profile & Status update states
  const [selectedUmkm, setSelectedUmkm] = useState<User | null>(null);
  const [showUmkmProfileModal, setShowUmkmProfileModal] = useState(false);

  const handleViewUmkmProfile = async (umkmId: string) => {
    const allUsers = await getDbUsers();
    const found = allUsers.find(u => u.id === umkmId);
    if (found) {
      setSelectedUmkm(found);
      setShowUmkmProfileModal(true);
    } else {
      setSelectedUmkm({
        id: umkmId,
        name: "Pemilik Brand Mitra",
        brandName: "Brand Lokal UMKM",
        role: "umkm",
        brandCategory: "Fashion & Lifestyle",
        brandDescription: "Mitra bisnis UMKM terpercaya yang berdedikasi tinggi mengembangkan ekonomi lokal kreatif.",
        city: "Malang",
        isApproved: true,
        rating: 5.0,
        email: "sme@example.com"
      });
      setShowUmkmProfileModal(true);
    }
  };

  const handleUpdateStatus = async (campaignId: string, newStatus: 'in_progress' | 'brief_ready') => {
    const allCampaigns = await getDbCampaigns();
    const camp = allCampaigns.find(c => c.id === campaignId);
    if (camp) {
      const idx = camp.influencers.findIndex(i => i.influencerId === currentUser.id);
      if (idx > -1) {
        camp.influencers[idx].status = newStatus;
        await saveDbCampaign(camp);
        await addDbLog(currentUser.name, "Update Progress", `${currentUser.name} mengubah status pengerjaan campaign "${camp.name}" menjadi "${newStatus === 'in_progress' ? 'In Progress' : 'Pending'}"`, "influencer");
        await forceRefresh();
        setAlertInfo({
          isOpen: true,
          title: "Progress Diperbarui",
          message: `Status pengerjaan berhasil diubah menjadi: ${newStatus === 'in_progress' ? 'In Progress (Sedang Dikerjakan)' : 'Pending'}`,
          type: "success"
        });
      }
    }
  };

  const forceRefresh = async () => {
    const [allCampaigns, allEscrowsFull, allWithdrawals] = await Promise.all([
      getDbCampaigns(),
      getDbEscrow(),
      db.withdrawals.list()
    ]);
    setAllDbCampaigns(allCampaigns);
    const myCamps = allCampaigns.filter(c => c.influencers.some(i => i.influencerId === currentUser.id));
    const allEscrows = allEscrowsFull.filter(e => e.influencerId === currentUser.id);
    const myWithdrawals = allWithdrawals.filter(w => w.influencerId === currentUser.id);
    setCampaigns(myCamps);
    setEscrows(allEscrows);
    setWithdrawals(myWithdrawals);
  };

  useEffect(() => {
    forceRefresh();
    setProfileName(currentUser.name);
    setPrice(currentUser.pricePerPost || "Rp250.000");
    setFollowers(currentUser.followers || "5.1K");
    setHandle(currentUser.handle || "@siska");
    setCity(currentUser.city || "Malang");
    setNiche(currentUser.niche || []);
    setWithdrawAccountHolder(currentUser.name);
  }, [currentUser]);

  // Handle proactive campaign application (Tawaran UMKM)
  const applyForCampaign = async (campaignId: string) => {
    const allCampaigns = await getDbCampaigns();
    const camp = allCampaigns.find(c => c.id === campaignId);
    if (camp) {
      if (camp.influencers.some(i => i.influencerId === currentUser.id)) {
        setAlertInfo({
          isOpen: true,
          title: "Sudah Terdaftar",
          message: "Anda sudah mengirimkan lamaran atau tergabung dalam proyek campaign ini.",
          type: "warning"
        });
        return;
      }

      camp.influencers.push({
        influencerId: currentUser.id,
        influencerName: currentUser.name,
        status: "applied"
      });

      if (camp.status === "waiting") {
        camp.status = "active";
      }
      await saveDbCampaign(camp);

      await addDbLog(currentUser.name, "Melamar Kerjasama", `${currentUser.name} melamar bergabung ke campaign "${camp.name}"`, "influencer");
      await forceRefresh();
      setAlertInfo({
        isOpen: true,
        title: "Lamaran Terkirim",
        message: `Pengajuan berhasil dikirim! Pengajuan Anda ke campaign "${camp.name}" sedang menunggu persetujuan dari pihak pemilik UMKM.`,
        type: "success"
      });
    }
  };

  // Handle accepting brand invitations
  const acceptInvitation = async (campaignId: string) => {
    const allCampaigns = await getDbCampaigns();
    const camp = allCampaigns.find(c => c.id === campaignId);
    if (camp) {
      const index = camp.influencers.findIndex(i => i.influencerId === currentUser.id);
      if (index > -1) {
        camp.influencers[index].status = "brief_ready";
        await saveDbCampaign(camp);
        await addDbLog(currentUser.name, "Menerima Kampanye", `${currentUser.name} menyetujui undangan brand dari kampanye "${camp.name}"`, "influencer");
        await forceRefresh();
        setAlertInfo({
          isOpen: true,
          title: "Undangan Diterima",
          message: "Undangan berhasil disetujui! Silakan baca instruksi Brief Kampanye untuk memulai pengerjaan konten Anda.",
          type: "success"
        });
      }
    }
  };

  // Handle declining brand invitations
  const declineInvitation = async (campaignId: string) => {
    const allCampaigns = await getDbCampaigns();
    const camp = allCampaigns.find(c => c.id === campaignId);
    if (camp) {
      camp.influencers = camp.influencers.filter(i => i.influencerId !== currentUser.id);
      if (camp.influencers.length === 0) {
        camp.status = "waiting";
      }
      await saveDbCampaign(camp);
      await addDbLog(currentUser.name, "Menolak Kampanye", `${currentUser.name} menolak undangan kampanye "${camp.name}"`, "influencer");
      await forceRefresh();
      setAlertInfo({
        isOpen: true,
        title: "Undangan Ditolak",
        message: `Anda telah menolak undangan kolaborasi dari campaign "${camp.name}".`,
        type: "info"
      });
    }
  };

  // Handle uploading completed content URL
  const submitContent = async (campaignId: string) => {
    const url = submissionUrls[campaignId];
    if (!url) {
      setAlertInfo({
        isOpen: true,
        title: "Tautan Kosong",
        message: "Mohon masukkan tautan video/postingan sosial Anda terlebih dahulu.",
        type: "warning"
      });
      return;
    }

    const allCampaigns = await getDbCampaigns();
    const camp = allCampaigns.find(c => c.id === campaignId);
    if (camp) {
      const index = camp.influencers.findIndex(i => i.influencerId === currentUser.id);
      if (index > -1) {
        camp.influencers[index].status = "content_uploaded";
        camp.influencers[index].submissionUrl = url;
        await saveDbCampaign(camp);

        const allEscrows = await getDbEscrow();
        const tx = allEscrows.find(e => e.campaignId === campaignId && e.influencerId === currentUser.id);
        if (tx) {
          tx.status = "pending";
          await saveDbEscrow(tx);
        }

        await addDbLog(currentUser.name, "Menyerahkan Konten", `${currentUser.name} mengunggah posting video konten untuk "${camp.name}"`, "influencer");
        setSubmissionUrls(prev => ({ ...prev, [campaignId]: "" }));
        await forceRefresh();
        setAlertInfo({
          isOpen: true,
          title: "Konten Diserahkan",
          message: "Konten Anda berhasil dikirim ke partner UMKM! Dana Escrow Anda kini berstatus 'Pending Approval' menunggu persetujuan dan pelepasan dana dari pemilik UMKM.",
          type: "success"
        });
      }
    }
  };

  // Update settings info
  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();

    let followersNum = 5100;
    if (followers === "5.1K") followersNum = 5100;
    else if (followers === "7.8K") followersNum = 7800;
    else if (followers === "9.4K") followersNum = 9400;
    else if (followers === "12K") followersNum = 12000;
    else if (followers === "25K") followersNum = 25000;

    const updated = await db.users.update(currentUser.id, {
      name: profileName,
      pricePerPost: price,
      followers: followers,
      followersNum: followersNum,
      handle: handle,
      city: city,
      niche: niche
    });

    if (updated) {
      await addDbLog(profileName, "Update Setelan", "Memperbarui metrik penawaran creator", "influencer");
      if (onUserUpdate) {
        onUserUpdate(updated);
      }
      setShowSettingsSuccess(true);
      setTimeout(() => setShowSettingsSuccess(false), 2000);
    }
  };

  const handleRequestWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (earnedReleased <= 0) {
      setAlertInfo({
        isOpen: true,
        title: "Saldo Tidak Cukup",
        message: "Anda tidak memiliki saldo yang siap dicairkan saat ini.",
        type: "warning"
      });
      return;
    }

    if (!withdrawAccountNo.trim()) {
      setAlertInfo({
        isOpen: true,
        title: "Informasi Bank",
        message: "Mohon masukkan nomor rekening bank Anda terlebih dahulu.",
        type: "warning"
      });
      return;
    }

    // Identify which released escrows are being withdrawn
    const releasedEscrows = escrows.filter(ev => ev.status === "released");
    const unwithdrawnEscrows = releasedEscrows.filter(ev => {
      return !withdrawals.some(w => w.campaignId === ev.campaignId && w.status !== "rejected");
    });

    if (unwithdrawnEscrows.length > 0) {
      // Create a separate withdrawal transaction for each campaign's escrow earnings
      for (let i = 0; i < unwithdrawnEscrows.length; i++) {
        const esc = unwithdrawnEscrows[i];
        const camp = campaigns.find(c => c.id === esc.campaignId);
        const umkmId = camp ? camp.umkmId : "";
        const campaignName = camp ? camp.name : esc.campaignName;

        const newW: WithdrawalTx = {
          id: `w-${Date.now()}-${i}`,
          influencerId: currentUser.id,
          influencerName: currentUser.name,
          amount: esc.amount,
          bankName: withdrawBank,
          accountNo: withdrawAccountNo,
          accountHolder: withdrawAccountHolder,
          status: "pending",
          date: new Date().toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' }),
          umkmId: umkmId,
          campaignId: esc.campaignId,
          campaignName: campaignName
        };
        await db.withdrawals.save(newW);
        await addDbLog(currentUser.name, "Tarik Dana", `Mengajukan penarikan Rp${esc.amount.toLocaleString()} untuk campaign "${campaignName}" ke rekening ${withdrawBank} ${withdrawAccountNo}`, "influencer");
      }
    } else {
      // Fallback: create a single withdrawal for the remaining amount
      const newW: WithdrawalTx = {
        id: "w-" + Date.now(),
        influencerId: currentUser.id,
        influencerName: currentUser.name,
        amount: earnedReleased,
        bankName: withdrawBank,
        accountNo: withdrawAccountNo,
        accountHolder: withdrawAccountHolder,
        status: "pending",
        date: new Date().toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })
      };
      await db.withdrawals.save(newW);
      await addDbLog(currentUser.name, "Tarik Dana", `Mengajukan penarikan Rp${earnedReleased.toLocaleString()} ke rekening ${withdrawBank} ${withdrawAccountNo}`, "influencer");
    }
    
    setIsWithdrawModalOpen(false);
    setWithdrawAccountNo("");
    await forceRefresh();

    setAlertInfo({
      isOpen: true,
      title: "Penarikan Diajukan",
      message: `Berhasil mengajukan penarikan! Permintaan penarikan Anda telah dikirim dan kini menunggu approval dari partner UMKM.`,
      type: "success"
    });
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
    c.influencers.some(i => i.influencerId === currentUser.id && i.status === "invited")
  );

  const activeCamps = campaigns.filter(c => 
    c.influencers.some(i => i.influencerId === currentUser.id && i.status !== "invited" && i.status !== "completed")
  );

  const completedCamps = campaigns.filter(c => 
    c.influencers.some(i => i.influencerId === currentUser.id && i.status === "completed")
  );

  // Calculate earnings and withdrawals
  const rawEarnedReleased = escrows.filter(e => e.status === "released").reduce((sum, current) => sum + current.amount, 0);
  const withdrawnTotal = withdrawals.filter(w => w.status === 'completed' || w.status === 'pending' || w.status === 'approved_by_umkm').reduce((sum, current) => sum + current.amount, 0);
  const earnedReleased = Math.max(0, rawEarnedReleased - withdrawnTotal);

  const earnedLocked = escrows.filter(e => e.status === "locked" || e.status === "pending").reduce((sum, current) => sum + current.amount, 0);

  // Helper to get UMKM's city location (uses already-loaded users from state)
  const getUmkmCity = (umkmId: string) => {
    // use allDbCampaigns indirectly — look up from in-memory state would need users state
    // fallback to Malang as we don't hold users state here
    return "Malang";
  };

  // Filter and sort discoverable campaigns
  const filteredDiscoverCampaigns = allDbCampaigns
    .filter(camp => {
      // search match
      const query = discoverSearch.toLowerCase();
      const nameMatch = camp.name.toLowerCase().includes(query);
      const descMatch = camp.description.toLowerCase().includes(query);
      const brandMatch = camp.umkmName.toLowerCase().includes(query);
      const searchMatch = !discoverSearch || nameMatch || descMatch || brandMatch;

      // category filter
      const categoryMatch = !discoverCategory || camp.category === discoverCategory;

      // platform filter
      const platformMatch = !discoverPlatform || camp.platform === discoverPlatform;

      // status filter (unapplied vs applied)
      const isJoined = camp.influencers.some(i => i.influencerId === currentUser.id);
      const statusMatch = 
        discoverStatus === "all" ||
        (discoverStatus === "applied" && isJoined) ||
        (discoverStatus === "unapplied" && !isJoined);

      return searchMatch && categoryMatch && platformMatch && statusMatch;
    })
    .sort((a, b) => {
      if (discoverSort === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (discoverSort === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (discoverSort === "highest_budget") {
        return b.budget - a.budget;
      }
      if (discoverSort === "lowest_budget") {
        return a.budget - b.budget;
      }
      return 0;
    });

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
          <p className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-sage text-brand-sage-dark text-[10px] font-bold">
            <Award className="w-3.5 h-3.5" /> Akun Kreator Terverifikasi
          </p>
        </div>

        <div className="mt-6 px-4 space-y-1">
          <p className="px-3 text-xs tracking-widest font-bold text-brand-text-light uppercase mb-2 select-none">Menu Utama</p>
          {[
            { id: "discover", label: "Tawaran UMKM (Cari Kerja)", icon: Search },
            { id: "invites", label: "Undangan Kerjasama", icon: Inbox, badge: incomingInvites.length },
            { id: "active", label: "Tugas Berjalan", icon: FileText, badge: activeCamps.length },
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
        
        {/* TAB 0: DISCOVER ALL UMKM CAMPAIGNS (Tawaran UMKM) */}
        {activeTab === "discover" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div>
              <h2 className="font-serif text-3xl font-bold tracking-tight text-brand-text font-serif">Peluang Kerjasama UMKM</h2>
              <p className="mt-1 text-sm text-brand-text-soft">
                Cari dan temukan tawaran promosi dari pemilik usaha lokal di Malang. Silakan ajukan diri secara langsung tanpa harus menunggu diundang!
              </p>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-brand-white border border-brand-sand rounded-3xl p-5 shadow-xs space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                
                {/* Search query input */}
                <div className="md:col-span-4 relative">
                  <Search className="w-4 h-4 text-brand-text-light absolute left-4 top-3.5" />
                  <input
                    type="text"
                    placeholder="Cari kata kunci, nama UMKM atau judul..."
                    value={discoverSearch}
                    onChange={(e) => setDiscoverSearch(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-brand-sand rounded-2xl bg-brand-bg/30 text-xs text-brand-text focus:outline-none"
                  />
                </div>

                {/* Filter Category */}
                <div className="md:col-span-2">
                  <select
                    value={discoverCategory}
                    onChange={(e) => setDiscoverCategory(e.target.value)}
                    className="w-full font-bold border border-brand-sand rounded-2xl py-3 px-4 bg-brand-bg/30 text-xs text-brand-text-soft focus:outline-none cursor-pointer"
                  >
                    <option value="">Semua Kategori</option>
                    <option value="Kuliner">Kuliner</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Lifestyle">Lifestyle</option>
                    <option value="Kecantikan">Kecantikan</option>
                  </select>
                </div>

                {/* Filter Platform */}
                <div className="md:col-span-2">
                  <select
                    value={discoverPlatform}
                    onChange={(e) => setDiscoverPlatform(e.target.value)}
                    className="w-full font-bold border border-brand-sand rounded-2xl py-3 px-4 bg-brand-bg/30 text-xs text-brand-text-soft focus:outline-none cursor-pointer"
                  >
                    <option value="">Semua Sosmed</option>
                    <option value="Instagram">Instagram</option>
                    <option value="TikTok">TikTok</option>
                    <option value="YouTube">YouTube</option>
                  </select>
                </div>

                {/* Filter Status */}
                <div className="md:col-span-2">
                  <select
                    value={discoverStatus}
                    onChange={(e) => setDiscoverStatus(e.target.value)}
                    className="w-full font-bold border border-brand-sand rounded-2xl py-3 px-4 bg-brand-bg/30 text-xs text-brand-text-soft focus:outline-none cursor-pointer"
                  >
                    <option value="all">Hubungan Status</option>
                    <option value="unapplied">Belum Bergabung</option>
                    <option value="applied">Sudah Bergabung</option>
                  </select>
                </div>

                {/* Sorting */}
                <div className="md:col-span-2">
                  <select
                    value={discoverSort}
                    onChange={(e) => setDiscoverSort(e.target.value)}
                    className="w-full font-bold border border-brand-sand rounded-2xl py-3 px-4 bg-brand-bg/30 text-xs text-brand-text-soft focus:outline-none cursor-pointer"
                  >
                    <option value="newest">Terbaru</option>
                    <option value="oldest">Terlama</option>
                    <option value="highest_budget">Budget Terbanyak</option>
                    <option value="lowest_budget">Budget Terendah</option>
                  </select>
                </div>

              </div>
            </div>

            {/* Campaign Grid List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDiscoverCampaigns.map((camp) => {
                const isJoined = camp.influencers.some(i => i.influencerId === currentUser.id);
                const myMemberInfo = camp.influencers.find(i => i.influencerId === currentUser.id);
                const umkmCity = getUmkmCity(camp.umkmId);

                return (
                  <div key={camp.id} className="bg-brand-white border border-brand-sand rounded-3xl p-6 shadow-sm hover:border-brand-sage-dark/30 transition-all flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center gap-2">
                        <span className="px-2.5 py-1 bg-brand-blush text-brand-blush-dark text-[10px] font-bold rounded-lg uppercase tracking-wider">
                          Kategori {camp.category}
                        </span>
                        
                        {isJoined ? (
                          myMemberInfo?.status === "applied" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FFF9E6] text-[#A67C1E] text-[10px] font-bold border border-[#F5E2B3]">
                              ⌛ Sedang Melamar
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-sage text-brand-sage-dark text-[10px] font-bold">
                              <Check className="w-3 h-3" /> Sudah Bergabung
                            </span>
                          )
                        ) : camp.status === "completed" ? (
                          <span className="px-2.5 py-1 rounded-full bg-brand-text-light/20 text-brand-text-soft text-[10px] font-bold">
                            Selesai
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-brand-sage/40 text-brand-sage-dark text-[10px] font-bold uppercase tracking-wide">
                            Tersedia
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="font-serif text-xl font-bold text-brand-text line-clamp-1">{camp.name}</h3>
                        <p className="text-[11px] text-brand-text-light font-bold mt-1.5 flex items-center justify-between">
                          <span>Pemilik Usaha: <span className="text-brand-text">{camp.umkmName}</span></span>
                          <button 
                            onClick={() => handleViewUmkmProfile(camp.umkmId)}
                            className="text-[10px] text-brand-blush-dark hover:underline font-bold cursor-pointer"
                          >
                            Lihat Profil Usaha
                          </button>
                        </p>
                      </div>

                      <p className="text-xs text-brand-text-soft line-clamp-3 leading-relaxed">
                        {camp.description}
                      </p>

                      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-brand-sand/40 text-[11px] font-medium text-brand-text-soft">
                        <div className="space-y-1">
                          <span className="text-[9px] text-brand-text-light block uppercase font-bold tracking-wider">Dana Kerjasama</span>
                          <span className="text-brand-sage-dark font-mono font-bold text-sm block">
                            Rp{camp.budget.toLocaleString()}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] text-brand-text-light block uppercase font-bold tracking-wider">Sosial Media</span>
                          <span className="text-brand-text font-bold block font-mono">
                            {camp.platform}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] text-brand-text-light block uppercase font-bold tracking-wider">Lokasi</span>
                          <span className="text-brand-text font-bold block flex items-center gap-0.5">
                            <MapPin className="w-3 h-3 text-brand-text-light" /> {umkmCity}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] text-brand-text-light block uppercase font-bold tracking-wider">Tanggal Rilis</span>
                          <span className="text-brand-text font-bold block">
                            {camp.createdAt}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-brand-sand/40">
                      {isJoined ? (
                        myMemberInfo?.status === "applied" ? (
                          <button
                            disabled
                            className="w-full py-2.5 bg-brand-bg text-brand-text-light border border-brand-sand text-xs font-bold rounded-xl text-center cursor-not-allowed"
                          >
                            Menunggu Persetujuan UMKM
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              if (myMemberInfo?.status === "invited") {
                                setActiveTab("invites");
                              } else {
                                setActiveTab("active");
                              }
                              forceRefresh();
                            }}
                            className="w-full py-2.5 bg-brand-sage text-brand-sage-dark border border-brand-sage-dark/25 hover:bg-brand-sage/80 text-xs font-bold rounded-xl text-center transition-all cursor-pointer active:scale-[0.98]"
                          >
                            Buka Detail Pengerjaan →
                          </button>
                        )
                      ) : camp.status === "completed" || camp.status === "cancelled" ? (
                        <button
                          disabled
                          className="w-full py-2.5 bg-brand-bg text-brand-text-light text-xs font-bold rounded-xl text-center cursor-not-allowed border border-brand-sand"
                        >
                          Peluang Ditutup
                        </button>
                      ) : (
                        <button
                          onClick={() => applyForCampaign(camp.id)}
                          className="w-full py-2.5 bg-brand-text hover:opacity-90 text-brand-white text-xs font-bold rounded-xl text-center transition-all cursor-pointer shadow-sm active:scale-[0.98]"
                        >
                          Ikut Kerjasama Sekarang
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredDiscoverCampaigns.length === 0 && (
                <div className="col-span-full bg-brand-white border border-brand-sand rounded-3xl p-12 text-center text-brand-text-soft text-xs flex flex-col items-center justify-center space-y-3">
                  <Search className="w-10 h-10 text-brand-text-light animate-pulse" />
                  <p>Tidak menemukan tawaran UMKM yang sesuai dengan kriteria pencarian Anda.</p>
                  <p className="text-[11px] text-brand-text-light">Coba ubah filter atau kata kunci pencarian Anda.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 1: NEW BRAND INVITATIONS */}
        {activeTab === "invites" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div>
              <h2 className="font-serif text-3xl font-bold tracking-tight text-brand-text">Tawaran Kerjasama Masuk</h2>
              <p className="mt-1 text-sm text-brand-text-soft">
                Tinjau tawaran promosi dan kerjasama dari pemilik usaha lokal di Malang yang pas dengan profil Anda.
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
                const myMilestone = camp.influencers.find(i => i.influencerId === currentUser.id);
                return (
                  <div key={camp.id} className="bg-brand-white border border-brand-sand rounded-3xl p-6 shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-brand-sand/50">
                      <div>
                        <h3 className="font-serif text-2xl font-bold text-brand-text">{camp.name}</h3>
                        <p className="text-xs text-brand-text-soft mt-1 flex items-center gap-2">
                          <span>Pemilik usaha: <span className="font-bold text-brand-text">{camp.umkmName}</span></span>
                          <button 
                            onClick={() => handleViewUmkmProfile(camp.umkmId)}
                            className="text-[10px] text-brand-blush-dark hover:underline font-bold cursor-pointer"
                          >
                            • Lihat Profil UMKM
                          </button>
                        </p>
                      </div>

                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold font-mono uppercase tracking-wide inline-block ${
                          myMilestone?.status === "content_uploaded" ? "bg-brand-sky text-brand-sky-dark border border-brand-sky-dark/20" :
                          myMilestone?.status === "completed" ? "bg-brand-sage text-brand-sage-dark" :
                          myMilestone?.status === "in_progress" ? "bg-purple-100 text-purple-800 border border-purple-200" :
                          myMilestone?.status === "escrow_locked" ? "bg-blue-100 text-blue-800 border border-blue-200" : "bg-[#FBEED7] text-[#8C5D12]"
                        }`}>
                          {myMilestone?.status === "brief_ready" ? "PENDING: MENUNGGU DANA" :
                           myMilestone?.status === "escrow_locked" ? "DANA AMAN (ESCROW) / SIAP MULAI" :
                           myMilestone?.status === "in_progress" ? "SEDANG DIKERJAKAN (IN PROGRESS)" :
                           myMilestone?.status === "content_uploaded" ? "KONTEN TELAH DISERAHKAN" : "SELESAI (COMPLETED)"}
                        </span>
                        <p className="text-[10px] text-brand-text-light font-bold mt-1.5">Platform: {camp.platform}</p>
                      </div>
                    </div>

                    {/* Interactive 5-step Progress Tracker */}
                    <div className="py-4 bg-brand-bg/40 px-5 rounded-2xl border border-brand-sand/60 flex items-center justify-between gap-4 overflow-x-auto text-xs scrollbar-none">
                      {[
                        { id: "brief_ready", label: "Pending" },
                        { id: "escrow_locked", label: "Escrow" },
                        { id: "in_progress", label: "In Progress" },
                        { id: "content_uploaded", label: "Submitted" },
                        { id: "completed", label: "Completed" }
                      ].map((step, idx, arr) => {
                        const order = ["brief_ready", "escrow_locked", "in_progress", "content_uploaded", "completed"];
                        const currentIdx = order.indexOf(myMilestone?.status || "brief_ready");
                        const stepIdx = order.indexOf(step.id);
                        const isPastOrCurrent = stepIdx <= currentIdx;
                        const isCurrent = myMilestone?.status === step.id;

                        return (
                          <React.Fragment key={step.id}>
                            <div className="flex items-center gap-2 shrink-0">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                                isCurrent ? "bg-brand-blush-dark text-brand-white animate-pulse" :
                                isPastOrCurrent ? "bg-brand-sage-dark text-brand-white" : "bg-brand-sand/50 text-brand-text-soft"
                              }`}>
                                {idx + 1}
                              </div>
                              <span className={`font-semibold ${isCurrent ? "text-brand-text font-black" : "text-brand-text-soft"}`}>
                                {step.label}
                              </span>
                            </div>
                            {idx < arr.length - 1 && <span className="text-brand-text-light/50 font-bold">→</span>}
                          </React.Fragment>
                        );
                      })}
                    </div>

                    {/* Milestone contextual helper notice & update progress button */}
                    {myMilestone?.status === "brief_ready" && (
                      <div className="p-4 rounded-2xl bg-[#FFF6EB] border border-[#ECD9C5] text-xs text-[#9B6F3E] flex gap-2">
                        <HelpCircle className="w-5 shrink-0" />
                        <div>
                          <p className="font-bold">Informasi Kunci Pembayaran:</p>
                          <p className="mt-1 leading-normal">
                            Anda sudah menyetujui kampanye ini. Mohon menunggu pihak UMKM (<span className="font-sans font-bold">{camp.umkmName}</span>) mengunci dana anggaran kampanye (Lock Escrow) sebesar <span className="font-sans font-bold">Rp{camp.budget.toLocaleString()}</span> ke rekening bersama. Setelah terkunci, Anda dapat mengupdate progress ke "In Progress" dan memulai pengerjaan!
                          </p>
                        </div>
                      </div>
                    )}

                    {myMilestone?.status === "escrow_locked" && (
                      <div className="p-4 rounded-2xl bg-brand-sage/10 border border-brand-sage-dark/20 text-xs text-brand-sage-dark flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="space-y-1">
                          <p className="font-bold">🎉 Dana Anggaran Telah Dikunci (Escrow Secured):</p>
                          <p className="text-brand-text-soft leading-normal">Pihak UMKM telah mendepositkan dana sebesar <span className="font-sans font-bold">Rp{camp.budget.toLocaleString()}</span>. Silakan ubah status pengerjaan Anda ke "In Progress" untuk menandai bahwa Anda sedang memproduksi konten iklan!</p>
                        </div>
                        <button
                          onClick={() => handleUpdateStatus(camp.id, "in_progress")}
                          className="px-4 py-2 bg-brand-text text-brand-white font-bold hover:opacity-95 rounded-xl text-[11px] cursor-pointer shrink-0 transition-all select-none shadow-sm active:scale-95"
                        >
                          Tandai "In Progress" (Sedang Dibuat)
                        </button>
                      </div>
                    )}

                    {myMilestone?.status === "in_progress" && (
                      <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-xs text-purple-900 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="space-y-1">
                          <p className="font-bold">🎬 Sedang Memproduksi Konten (In Progress):</p>
                          <p className="text-brand-text-soft leading-normal">Silakan upload link postingan sosial media Anda di bawah ini setelah selesai diposting di {camp.platform} untuk mendapatkan pencairan dana escrow.</p>
                        </div>
                        <button
                          onClick={() => handleUpdateStatus(camp.id, "brief_ready")}
                          className="px-4 py-2 border border-purple-300 text-purple-700 hover:bg-purple-100 font-bold rounded-xl text-[11px] cursor-pointer shrink-0 transition-all select-none"
                        >
                          Kembalikan ke Pending
                        </button>
                      </div>
                    )}

                    {/* AI Generated briefs displaying area */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-brand-text">
                        <FileText className="w-4 h-4 text-brand-blush-dark animate-pulse" />
                        <h4 className="text-xs font-black tracking-widest uppercase">KREATIF BRIEF INDEPTH (GENERASI AI):</h4>
                      </div>
                      <div className="p-4 rounded-2xl bg-brand-bg text-xs font-serif text-brand-text leading-relaxed whitespace-pre-line border border-brand-sand block shadow-inner max-h-[220px] overflow-y-auto select-text scrollbar-thin">
                        {camp.briefText || "Belum ada brief yang dimasukkan oleh pemilik brand."}
                      </div>
                    </div>

                    {/* Active Upload panel */}
                    {(myMilestone?.status === "escrow_locked" || myMilestone?.status === "in_progress") && (
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

                    {/* Upload pending approval state of milestone */}
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

        {/* TAB 3: SMART ESCROW WALLET */}
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
                  onClick={() => setIsWithdrawModalOpen(true)}
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
                  Top tier Malang Influencer
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
                      const me = camp.influencers.find(i => i.influencerId === currentUser.id);
                      return (
                        <tr key={camp.id} className="hover:bg-brand-bg/10">
                          <td className="py-3.5 px-4 font-bold">{camp.name}</td>
                          <td className="py-3.5 px-4 text-brand-text-soft">{camp.umkmName}</td>
                          <td className="py-3.5 px-4 font-mono font-bold text-brand-sage-dark">Rp{camp.budget.toLocaleString()}</td>
                          <td className="py-3.5 px-4 text-brand-text-light underline truncate max-w-[150px]">
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

            {/* Withdrawal requests log table */}
            <div className="bg-brand-white border border-brand-sand rounded-3xl p-6 shadow-sm overflow-hidden mt-6">
              <h3 className="font-serif text-xl font-bold text-brand-text mb-4">Riwayat Penarikan Dana Bank</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-brand-text select-text">
                  <thead className="bg-brand-bg text-brand-text-soft uppercase tracking-wider font-bold">
                    <tr>
                      <th className="py-3 px-4 border-b border-brand-sand">TANGGAL</th>
                      <th className="py-3 px-4 border-b border-brand-sand">BANK TUJUAN</th>
                      <th className="py-3 px-4 border-b border-brand-sand">NOMOR REKENING</th>
                      <th className="py-3 px-4 border-b border-brand-sand">NAMA PENERIMA</th>
                      <th className="py-3 px-4 border-b border-brand-sand">NOMINAL</th>
                      <th className="py-3 px-4 border-b border-brand-sand">STATUS PENGIRIMAN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-sand/50">
                    {withdrawals.map(w => (
                      <tr key={w.id} className="hover:bg-brand-bg/10">
                        <td className="py-3.5 px-4 font-mono">{w.date}</td>
                        <td className="py-3.5 px-4 font-bold text-brand-text">{w.bankName}</td>
                        <td className="py-3.5 px-4 font-mono text-brand-text-soft">{w.accountNo}</td>
                        <td className="py-3.5 px-4 font-semibold text-brand-text">{w.accountHolder}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-brand-sage-dark">Rp{w.amount.toLocaleString()}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full font-mono font-bold uppercase text-[9px] tracking-wide ${
                            w.status === "completed" ? "bg-brand-sage text-brand-sage-dark" :
                            w.status === "rejected" ? "bg-red-50 text-red-700 bg-[#FFF0F0]" : "bg-[#FBEED7] text-[#8C5D12]"
                          }`}>
                            {w.status === "completed" ? "Selesai ditransfer" :
                             w.status === "rejected" ? "Ditolak / Gagal" : "Menunggu Transfer"}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {withdrawals.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-brand-text-soft">Belum ada riwayat penarikan dana ke rekening bank.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Withdrawal request modal */}
            <AnimatePresence>
              {isWithdrawModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-text/45 backdrop-blur-xs">
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-brand-white border border-brand-sand rounded-3xl max-w-md w-full p-6 shadow-xl relative"
                  >
                    <button 
                      onClick={() => setIsWithdrawModalOpen(false)}
                      className="absolute top-4 right-4 text-brand-text-light hover:text-brand-text"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <h3 className="font-serif text-2xl font-bold text-brand-text flex items-center gap-2">
                      <Wallet className="w-6 h-6 text-brand-sage-dark" /> Ajukan Pencairan Saldo
                    </h3>
                    <p className="text-xs text-brand-text-soft mt-1 leading-normal">
                      Kirimkan saldo aman Anda dari rekening bersama (escrow) ke rekening bank pribadi Anda secara instan.
                    </p>

                    <form onSubmit={handleRequestWithdrawal} className="space-y-4 mt-6 text-xs text-brand-text-soft font-bold uppercase tracking-wider">
                      <div className="p-3 bg-brand-bg rounded-2xl flex justify-between items-center">
                        <div>
                          <p className="text-[10px] text-brand-text-light font-bold">SALDO DISETUJUI & DICAIRKAN</p>
                          <p className="font-serif text-2xl font-black text-brand-sage-dark mt-0.5">Rp{earnedReleased.toLocaleString()}</p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-1 bg-brand-sage text-brand-sage-dark rounded-lg">SIAP CAIR</span>
                      </div>

                      <div>
                        <label className="block mb-1.5 font-bold">Bank Tujuan</label>
                        <select
                          value={withdrawBank}
                          onChange={(e) => setWithdrawBank(e.target.value)}
                          className="w-full border border-brand-sand bg-brand-bg/40 rounded-2xl px-4 py-2.5 font-medium text-brand-text focus:outline-none text-xs cursor-pointer"
                        >
                          <option value="BCA">Bank Central Asia (BCA)</option>
                          <option value="Mandiri">Bank Mandiri</option>
                          <option value="BRI">Bank Rakyat Indonesia (BRI)</option>
                          <option value="BNI">Bank Negara Indonesia (BNI)</option>
                          <option value="CIMB Niaga">CIMB Niaga</option>
                          <option value="Jago">Bank Jago</option>
                        </select>
                      </div>

                      <div>
                        <label className="block mb-1.5 font-bold">Nomor Rekening</label>
                        <input
                          type="text"
                          placeholder="Contoh: 0113847291"
                          value={withdrawAccountNo}
                          onChange={(e) => setWithdrawAccountNo(e.target.value)}
                          className="w-full border border-brand-sand bg-brand-bg/40 rounded-2xl px-4 py-2.5 font-medium text-brand-text focus:outline-none text-xs"
                          required
                        />
                      </div>

                      <div>
                        <label className="block mb-1.5 font-bold">Nama Pemilik Rekening</label>
                        <input
                          type="text"
                          placeholder="Harus sesuai dengan nama di buku tabungan"
                          value={withdrawAccountHolder}
                          onChange={(e) => setWithdrawAccountHolder(e.target.value)}
                          className="w-full border border-brand-sand bg-brand-bg/40 rounded-2xl px-4 py-2.5 font-medium text-brand-text focus:outline-none text-xs"
                          required
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsWithdrawModalOpen(false)}
                          className="w-1/2 py-3 rounded-xl border border-brand-sand font-bold text-xs hover:bg-brand-bg active:scale-95 transition-all text-center text-brand-text-soft cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="w-1/2 py-3 rounded-xl bg-brand-text text-brand-white font-bold text-xs hover:opacity-90 active:scale-95 transition-all text-center cursor-pointer shadow-md"
                        >
                          Kirim Pengajuan
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

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
                  
                  <div>
                    <label className="block mb-1.5 font-bold text-brand-text-soft">Nama Lengkap Kreator</label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full border border-brand-sand bg-brand-bg/40 rounded-2xl px-4 py-2.5 font-medium text-brand-text focus:outline-none text-xs"
                      required
                    />
                  </div>

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

              {/* Profile Preview Card & Credentials */}
              <div className="space-y-6">
                
                {/* PUBLIC PROFILE PREVIEW */}
                <div className="bg-brand-white border border-brand-sand rounded-3xl p-6 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-brand-sage/20 rounded-full blur-2xl -mr-8 -mt-8" />
                  <div className="flex items-center gap-4 border-b border-brand-sand/50 pb-4 mb-4">
                    <div className="w-14 h-14 rounded-full bg-brand-blush flex items-center justify-center font-serif text-2xl font-black text-brand-blush-dark border-2 border-brand-white shadow-md">
                      {profileName ? profileName.charAt(0).toUpperCase() : "I"}
                    </div>
                    <div>
                      <h3 className="font-serif text-xl font-bold text-brand-text flex items-center gap-1.5">
                        {profileName} <span className="text-[10px] bg-brand-sage text-brand-sage-dark font-sans font-black px-2 py-0.5 rounded-md uppercase tracking-wide">CREATOR</span>
                      </h3>
                      <p className="font-mono text-xs text-brand-blush-dark font-bold mt-0.5">{handle}</p>
                    </div>
                  </div>

                  <div className="space-y-3.5 text-xs text-brand-text-soft">
                    <p className="leading-relaxed text-[11px] font-sans italic text-brand-text-light">
                      "Saya adalah kreator konten mahasiswa aktif di kota {city} yang fokus membuat konten kreatif bergenre {niche.length > 0 ? niche.join(', ') : 'Umum'}. Sangat senang berkolaborasi dengan brand lokal berkualitas."
                    </p>

                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-brand-sand/40 font-medium">
                      <div className="space-y-0.5">
                        <span className="text-[9px] text-brand-text-light block uppercase font-bold tracking-wider">Metrik Pengikut</span>
                        <span className="text-brand-text font-bold block text-sm font-mono">{followers} Fans</span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[9px] text-brand-text-light block uppercase font-bold tracking-wider">Tarif Kerja</span>
                        <span className="text-brand-sage-dark font-bold block text-sm font-mono">{price} / Post</span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[9px] text-brand-text-light block uppercase font-bold tracking-wider">Domisili</span>
                        <span className="text-brand-text font-bold block flex items-center gap-0.5"><MapPin className="w-3.5 h-3.5 text-brand-text-light" /> {city}</span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[9px] text-brand-text-light block uppercase font-bold tracking-wider">Bidang Niche</span>
                        <span className="text-brand-text font-bold block flex flex-wrap gap-1 mt-0.5">
                          {niche.length > 0 ? niche.map(n => (
                            <span key={n} className="px-1.5 py-0.5 bg-brand-bg text-[10px] rounded-md font-sans font-bold text-brand-text-soft">{n}</span>
                          )) : <span className="text-brand-text-light text-[10px]">-</span>}
                        </span>
                      </div>
                    </div>
                  </div>
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
                    Akun Anda saat ini memiliki reputasi <span className="font-bold text-brand-blush-dark">Gold Star Elite</span>. Brand mitra akan melihat profil Anda direkomendasikan pada halaman pencarian utama mereka!
                  </div>
                </div>

              </div>

            </div>
          </motion.div>
        )}

      </main>

      {/* SME PROFILE VIEW MODAL */}
      <AnimatePresence>
        {showUmkmProfileModal && selectedUmkm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-text/45 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-brand-white border border-brand-sand rounded-3xl p-6 shadow-xl max-w-md w-full relative overflow-hidden select-text"
            >
              <button 
                onClick={() => setShowUmkmProfileModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-brand-bg transition-colors text-brand-text-soft cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="absolute top-0 left-0 w-24 h-24 bg-brand-blush/20 rounded-full blur-2xl -ml-6 -mt-6" />

              <div className="space-y-5 pt-2">
                <div className="flex items-center gap-4 border-b border-brand-sand/40 pb-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-blush-dark/10 flex items-center justify-center text-brand-blush-dark font-serif text-xl font-bold border border-brand-blush-dark/10 shrink-0">
                    {selectedUmkm.brandName ? selectedUmkm.brandName.charAt(0).toUpperCase() : "B"}
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-brand-text leading-tight">{selectedUmkm.brandName || "Nama Usaha"}</h3>
                    <p className="text-[11px] text-brand-text-soft mt-0.5 font-bold uppercase tracking-wider bg-brand-bg px-2 py-0.5 rounded inline-block">
                      Kategori {selectedUmkm.brandCategory || "General"}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 text-xs font-medium text-brand-text-soft">
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase tracking-wider text-brand-text-light font-bold block">Tentang Bisnis & Usaha</span>
                    <p className="text-brand-text leading-relaxed font-sans font-medium text-[11px] italic bg-brand-bg/40 p-3 rounded-2xl border border-brand-sand/30">
                      "{selectedUmkm.brandDescription || "Mitra bisnis UMKM terpercaya dan berkomitmen tinggi mengembangkan brand lokal Indonesia."}"
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase tracking-wider text-brand-text-light font-bold block">Pemilik / CP</span>
                      <span className="text-brand-text font-bold block text-[11px]">{selectedUmkm.name}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase tracking-wider text-brand-text-light font-bold block">Kota Domisili</span>
                      <span className="text-brand-text font-bold block flex items-center gap-1 text-[11px]">
                        <MapPin className="w-3.5 h-3.5 text-brand-text-light" /> {selectedUmkm.city || "Malang"}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase tracking-wider text-brand-text-light font-bold block">Reputasi Penyalur</span>
                      <span className="text-brand-sage-dark font-bold block flex items-center gap-0.5 text-[11px]">
                        <Star className="w-3.5 h-3.5 fill-brand-sage text-brand-sage" /> {selectedUmkm.rating || 5.0} / 5.0 (Sangat Terpercaya)
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase tracking-wider text-brand-text-light font-bold block">Kontak Email</span>
                      <span className="text-brand-text font-mono text-[10px] truncate block select-all">{selectedUmkm.email}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-brand-sage/10 border border-brand-sage-dark/10 rounded-xl text-[11px] leading-relaxed text-brand-text-soft mt-4">
                    📢 <span className="font-bold text-brand-sage-dark">Partner Terverifikasi:</span> Partner ini memiliki track-record penguncian Escrow dana kampanye secara tepat waktu dan transparan di ekosistem InfluMatch.
                  </div>
                </div>

                <button
                  onClick={() => setShowUmkmProfileModal(false)}
                  className="w-full py-3 rounded-2xl bg-brand-text text-brand-white font-bold text-xs hover:opacity-95 transition-all cursor-pointer shadow-md mt-2"
                >
                  Tutup Profil Partner
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <CustomAlert
        isOpen={alertInfo.isOpen}
        title={alertInfo.title}
        message={alertInfo.message}
        type={alertInfo.type}
        onClose={() => setAlertInfo(prev => ({ ...prev, isOpen: false }))}
      />

    </div>
  );
}
