import React, { useState, useEffect } from "react";
import { User, Campaign, EscrowTx, SystemLog } from "../types";
import { 
  getDbCampaigns, 
  getDbUsers, 
  saveDbCampaign, 
  getDbEscrow, 
  saveDbEscrow, 
  getDbLogs, 
  addDbLog,
  db
} from "../utils";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, Search, SlidersHorizontal, Sparkles, Send, 
  CheckCircle, FileText, Wallet, BarChart3, Settings, 
  ArrowRight, ExternalLink, RefreshCw, Star, Info, AlertTriangle, Users, MapPin
} from "lucide-react";
import CustomAlert from "./CustomAlert";

interface UmkmDashboardProps {
  currentUser: User;
  onUserUpdate?: (user: User) => void;
}

export default function UmkmDashboard({ currentUser, onUserUpdate }: UmkmDashboardProps) {
  const [activeTab, setActiveTab] = useState<"dashboard" | "discover" | "campaigns" | "brief" | "escrow" | "analytics" | "profile">("dashboard");
  
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
  const [newCampaignDeadline, setNewCampaignDeadline] = useState("");
  const [newCampaignKriteria, setNewCampaignKriteria] = useState("");

  // Edit Campaign form states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [editCampaignName, setEditCampaignName] = useState("");
  const [editCampaignCategory, setEditCampaignCategory] = useState("Kuliner");
  const [editCampaignDesc, setEditCampaignDesc] = useState("");
  const [editCampaignBudget, setEditCampaignBudget] = useState(300000);
  const [editCampaignPlatform, setEditCampaignPlatform] = useState("TikTok");
  const [editCampaignObjective, setEditCampaignObjective] = useState("Brand Awareness");
  const [editCampaignAudience, setEditCampaignAudience] = useState("Mahasiswa");
  const [editCampaignTone, setEditCampaignTone] = useState("Fun & Casual");
  const [editCampaignDeadline, setEditCampaignDeadline] = useState("");
  const [editCampaignKriteria, setEditCampaignKriteria] = useState("");

  // Influencer profile modal states
  const [selectedInfluencerProfile, setSelectedInfluencerProfile] = useState<User | null>(null);
  const [showInfluencerProfileModal, setShowInfluencerProfileModal] = useState(false);

  // Invite Influencer Modal states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [targetInfluencerToInvite, setTargetInfluencerToInvite] = useState<User | null>(null);
  const [selectedCampaignForInvite, setSelectedCampaignForInvite] = useState("");

  // Profile forms
  const [profileName, setProfileName] = useState(currentUser.name);
  const [profileBrand, setProfileBrand] = useState(currentUser.brandName || "");
  const [profileCategory, setProfileCategory] = useState(currentUser.brandCategory || "Kuliner");
  const [profileCity, setProfileCity] = useState(currentUser.city || "Malang");
  const [profileDesc, setProfileDesc] = useState(currentUser.brandDescription || "");
  const [showProfileSuccess, setShowProfileSuccess] = useState(false);

  // Sync details from Supabase
  const forceRefresh = async () => {
    const [allCampaignsRaw, allUsersRaw, allEscrowsRaw, allLogsRaw] = await Promise.all([
      getDbCampaigns(),
      getDbUsers(),
      getDbEscrow(),
      getDbLogs()
    ]);
    const allCampaigns = allCampaignsRaw.filter(c => c.umkmId === currentUser.id);
    const allUsers = allUsersRaw.filter(u => u.role === "influencer" && u.isApproved);
    const allEscrows = allEscrowsRaw.filter(e => allCampaigns.some(c => c.id === e.campaignId));
    const allLogs = allLogsRaw.filter(l => l.type === "umkm" || l.type === "admin");
    setCampaigns(allCampaigns);
    setInfluencers(allUsers);
    setEscrows(allEscrows);
    setLogs(allLogs);
  };

  useEffect(() => {
    forceRefresh();
    setProfileName(currentUser.name);
    setProfileBrand(currentUser.brandName || "");
    setProfileCategory(currentUser.brandCategory || "Kuliner");
    setProfileCity(currentUser.city || "Malang");
    setProfileDesc(currentUser.brandDescription || "");
  }, [currentUser]);

  // Handle building dynamic Brief via Express server Gemini route
  const handleGenerateBrief = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingBrief(true);
    setGeneratedBriefOutput("");
    setGenerationWarning("");

    try {
      const token = sessionStorage.getItem("im_jwt_token") || "";
      const response = await fetch("/api/generate-brief", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
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
            target.briefText = data.brief;
            await saveDbCampaign(target);
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

    const newCamp: Campaign = {
      id: "camp-" + Date.now(),
      name: newCampaignName,
      umkmId: currentUser.id,
      umkmName: currentUser.brandName || currentUser.name,
      category: newCampaignCategory,
      description: newCampaignDesc || "Tidak ada deskripsi rinci.",
      budget: Number(newCampaignBudget),
      platform: newCampaignPlatform,
      objective: "Brand Awareness",
      audience: "Mahasiswa",
      tone: "Fun & Casual",
      status: "waiting",
      createdAt: new Date().toISOString().split('T')[0],
      influencers: [],
      deadline: newCampaignDeadline || undefined,
      kriteria: newCampaignKriteria || undefined
    };

    await saveDbCampaign(newCamp);
    await addDbLog(currentUser.name, "Membuat Campaign", `UMKM membuat campaign baru "${newCampaignName}"`, "umkm");
    
    setNewCampaignName("");
    setNewCampaignDesc("");
    setNewCampaignDeadline("");
    setNewCampaignKriteria("");
    setShowCreateModal(false);
    await forceRefresh();
  };

  // Save edited campaign details
  const handleOpenEdit = (camp: Campaign) => {
    setEditingCampaignId(camp.id);
    setEditCampaignName(camp.name);
    setEditCampaignCategory(camp.category);
    setEditCampaignDesc(camp.description);
    setEditCampaignBudget(camp.budget);
    setEditCampaignPlatform(camp.platform);
    setEditCampaignObjective(camp.objective || "Brand Awareness");
    setEditCampaignAudience(camp.audience || "Mahasiswa");
    setEditCampaignTone(camp.tone || "Fun & Casual");
    setEditCampaignDeadline(camp.deadline || "");
    setEditCampaignKriteria(camp.kriteria || "");
    setShowEditModal(true);
  };

  const handleSaveCampaignEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCampaignId) return;

    const allCampaigns = await getDbCampaigns();
    const idx = allCampaigns.findIndex(c => c.id === editingCampaignId);
    if (idx > -1) {
      allCampaigns[idx] = {
        ...allCampaigns[idx],
        name: editCampaignName,
        category: editCampaignCategory,
        description: editCampaignDesc,
        budget: Number(editCampaignBudget),
        platform: editCampaignPlatform,
        objective: editCampaignObjective,
        audience: editCampaignAudience,
        tone: editCampaignTone,
        deadline: editCampaignDeadline || undefined,
        kriteria: editCampaignKriteria || undefined,
      };
      
      await saveDbCampaign(allCampaigns[idx]);
      await addDbLog(currentUser.name, "Mengedit Campaign", `UMKM mengupdate informasi campaign "${editCampaignName}"`, "umkm");
      setShowEditModal(false);
      await forceRefresh();
      setAlertInfo({
        isOpen: true,
        title: "Pembaruan Berhasil",
        message: "Data campaign Anda telah sukses diperbarui!",
        type: "success"
      });
    }
  };

  // Manage Influencer Applications (Pengajuan Influencer)
  const handleAcceptApplication = async (campaignId: string, influencerId: string, influencerName: string) => {
    const allCampaigns = await getDbCampaigns();
    const camp = allCampaigns.find(c => c.id === campaignId);
    if (camp) {
      const idx = camp.influencers.findIndex(i => i.influencerId === influencerId);
      if (idx > -1) {
        camp.influencers[idx].status = "brief_ready";
        await saveDbCampaign(camp);

        const newEscrowDraft: EscrowTx = {
          id: "tx-" + Date.now(),
          date: new Date().toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' }),
          campaignId: camp.id,
          campaignName: camp.name,
          influencerId: influencerId,
          influencerName: influencerName,
          amount: camp.budget,
          status: "pending"
        };
        await saveDbEscrow(newEscrowDraft);

        await addDbLog(currentUser.name, "Menerima Pelamar", `UMKM menerima pelamar ${influencerName} untuk campaign "${camp.name}"`, "umkm");
        await forceRefresh();
        setAlertInfo({
          isOpen: true,
          title: "Pelamar Diterima",
          message: `Berhasil menerima pelamar! Pengajuan ${influencerName} telah disetujui. Silakan kunci dana kampanye Anda di tab "Pembayaran Aman (Escrow)" agar kreator dapat mulai memposting konten.`,
          type: "success"
        });
      }
    }
  };

  const handleDenyApplication = async (campaignId: string, influencerId: string, influencerName: string) => {
    const allCampaigns = await getDbCampaigns();
    const camp = allCampaigns.find(c => c.id === campaignId);
    if (camp) {
      camp.influencers = camp.influencers.filter(i => i.influencerId !== influencerId);
      await saveDbCampaign(camp);
      await addDbLog(currentUser.name, "Menolak Pelamar", `UMKM menolak lamaran ${influencerName} untuk campaign "${camp.name}"`, "umkm");
      await forceRefresh();
      setAlertInfo({
        isOpen: true,
        title: "Pelamar Ditolak",
        message: `Berhasil menolak pengajuan kolaborasi dari ${influencerName}.`,
        type: "info"
      });
    }
  };

  const handleViewInfluencerProfile = async (influencerId: string) => {
    const allUsers = await getDbUsers();
    const found = allUsers.find(u => u.id === influencerId && u.role === "influencer");
    if (found) {
      setSelectedInfluencerProfile(found);
      setShowInfluencerProfileModal(true);
    } else {
      setSelectedInfluencerProfile({
        id: influencerId,
        name: "Kreator Berbakat",
        email: "influencer@example.com",
        role: "influencer",
        handle: "@kreator_lokal",
        followers: "12K",
        followersNum: 12000,
        pricePerPost: "Rp400.000",
        niche: ["Kuliner", "Lifestyle"],
        city: "Malang",
        isApproved: true,
        engagement: "4.8%",
        rating: 4.9
      });
      setShowInfluencerProfileModal(true);
    }
  };

  // Execute Invitation
  const triggerInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetInfluencerToInvite || !selectedCampaignForInvite) return;

    const allCampaigns = await getDbCampaigns();
    const camp = allCampaigns.find(c => c.id === selectedCampaignForInvite);
    if (camp) {
      if (camp.influencers.some(i => i.influencerId === targetInfluencerToInvite.id)) {
        setAlertInfo({
          isOpen: true,
          title: "Sudah Diundang",
          message: `${targetInfluencerToInvite.name} sudah tergabung atau diundang dalam campaign ini.`,
          type: "warning"
        });
        return;
      }

      camp.influencers.push({
        influencerId: targetInfluencerToInvite.id,
        influencerName: targetInfluencerToInvite.name,
        status: "invited"
      });

      if (camp.status === "waiting") {
        camp.status = "active";
      }

      await saveDbCampaign(camp);

      const newEscrowDraft: EscrowTx = {
        id: "tx-" + Date.now(),
        date: new Date().toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' }),
        campaignId: camp.id,
        campaignName: camp.name,
        influencerId: targetInfluencerToInvite.id,
        influencerName: targetInfluencerToInvite.name,
        amount: camp.budget,
        status: "pending"
      };
      await saveDbEscrow(newEscrowDraft);

      await addDbLog(currentUser.name, "Undangan Influencer", `Mengundang ${targetInfluencerToInvite.name} ke campaign "${camp.name}"`, "umkm");
      
      setShowInviteModal(false);
      setTargetInfluencerToInvite(null);
      setSelectedCampaignForInvite("");
      await forceRefresh();
      setAlertInfo({
        isOpen: true,
        title: "Undangan Terkirim",
        message: `Undangan berhasil dikirim ke ${targetInfluencerToInvite.name}! Status: Menunggu respon.`,
        type: "success"
      });
    }
  };

  // Release Escrow payment
  const handleReleaseEscrow = async (txId: string, campaignId: string, influencerId: string) => {
    const allEscrows = await getDbEscrow();
    const tx = allEscrows.find(e => e.id === txId);
    if (tx) {
      tx.status = "released";
      await saveDbEscrow(tx);

      const allCampaigns = await getDbCampaigns();
      const camp = allCampaigns.find(c => c.id === campaignId);
      if (camp) {
        const inf = camp.influencers.find(i => i.influencerId === influencerId);
        if (inf) {
          inf.status = "completed";
          inf.escrowReleased = true;
        }
        if (camp.influencers.every(i => i.status === "completed")) {
          camp.status = "completed";
        }
        await saveDbCampaign(camp);
      }

      await addDbLog(currentUser.name, "Persetujuan Escrow", `Melepaskan dana escrow Rp${tx.amount.toLocaleString()} ke ${tx.influencerName}`, "umkm");
      await forceRefresh();
      setAlertInfo({
        isOpen: true,
        title: "Pembayaran Berhasil",
        message: "Pembayaran berhasil dicairkan! Terimakasih telah bekerja sama dengan pihak kreator.",
        type: "success"
      });
    }
  };

  // Lock Escrow / Bayar Ke Rekening Escrow Pertama
  const handleLockEscrow = async (txId: string, campaignId: string, influencerId: string) => {
    const allEscrows = await getDbEscrow();
    const tx = allEscrows.find(e => e.id === txId);
    if (tx) {
      tx.status = "locked";
      await saveDbEscrow(tx);

      const allCampaigns = await getDbCampaigns();
      const camp = allCampaigns.find(c => c.id === campaignId);
      if (camp) {
        const inf = camp.influencers.find(i => i.influencerId === influencerId);
        if (inf) {
          inf.status = "escrow_locked";
        }
        await saveDbCampaign(camp);
      }

      await addDbLog(currentUser.name, "Escrow Terkunci", `Mengirim dana iklan Rp${tx.amount.toLocaleString()} ke penampungan Escrow Sistem`, "umkm");
      await forceRefresh();
      setAlertInfo({
        isOpen: true,
        title: "Dana Escrow Dititipkan",
        message: "Dana telah berhasil diamankan di rekening Escrow InfluMatch! Influencer telah diberitahu untuk segera mengunggah/membuat konten.",
        type: "success"
      });
    }
  };

  // Update Profile Info
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated = await db.users.update(currentUser.id, {
      name: profileName,
      brandName: profileBrand,
      brandCategory: profileCategory,
      city: profileCity,
      brandDescription: profileDesc
    });
    
    if (updated) {
      await addDbLog(currentUser.name, "Update Profil", "Mengubah informasi profil UMKM", "umkm");
      if (onUserUpdate) {
        onUserUpdate(updated);
      }
      setShowProfileSuccess(true);
      setTimeout(() => setShowProfileSuccess(false), 2500);
    }
  };

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

  // Dynamic metrics calculation for dashboard / analytics
  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter(c => c.status === "active").length;
  const completedCampaigns = campaigns.filter(c => c.status === "completed").length;

  const joinedInfluencers = campaigns.flatMap(c => c.influencers || []);
  const totalAudience = joinedInfluencers.reduce((acc, curr) => {
    const inf = influencers.find(i => i.id === curr.influencerId);
    return acc + (inf?.followersNum || 5000); // 5000 is default fallback
  }, 0);

  const formattedAudience = totalAudience > 0 
    ? (totalAudience >= 1000 ? `${(totalAudience / 1000).toFixed(1)}K` : totalAudience.toString())
    : "—";

  const totalInvitations = joinedInfluencers.length;
  const acceptedInvitations = joinedInfluencers.filter(i => i.status !== "invited").length;
  const matchRate = totalInvitations > 0 
    ? `${Math.round((acceptedInvitations / totalInvitations) * 100)}%`
    : "—";

  const totalEscrowBudget = escrows.reduce((acc, curr) => acc + curr.amount, 0);

  const getCampReachEst = (camp: Campaign) => {
    if (!camp.influencers || camp.influencers.length === 0) return "—";
    const sum = camp.influencers.reduce((acc, ci) => {
      const inf = influencers.find(i => i.id === ci.influencerId);
      return acc + (inf?.followersNum || 5000);
    }, 0);
    return sum >= 1000 ? `${(sum / 1000).toFixed(1)}K` : sum.toString();
  };

  // Dynamic Weekly Engagement Chart Data (5 days: Sen, Sel, Rab, Kam, Jum)
  const getWeeklyEngagementPoints = () => {
    // Determine total engagement from hired / completed influencer campaigns
    const acceptedInfluencersList = campaigns.flatMap(c => c.influencers || []).filter(i => i.status !== "invited");
    const baseVal = acceptedInfluencersList.reduce((sum, ci) => {
      const inf = influencers.find(i => i.id === ci.influencerId);
      return sum + (inf?.followersNum || 2500);
    }, 0);

    // If there is no hired influencer yet, we can use 500 * number of campaigns as estimation to show a projection or we can show flat if they literally have nothing
    const displayMetric = baseVal > 0 ? baseVal : campaigns.length * 1200;

    const baseFactors = [0.15, 0.38, 0.62, 0.95, 0.72]; // Beautiful growing then descending curve
    const rawData = baseFactors.map(f => Math.round(displayMetric * f));
    
    // Convert to SVG points (width: 600, height: 240)
    // padding x from 40 to 560 (diff = 520, step = 130)
    // height range for data: 190 (bottom/0) to 50 (top/max)
    const maxVal = Math.max(...rawData, 1);
    
    const points = rawData.map((val, idx) => {
      const x = 40 + idx * 130;
      // If no campaigns exist, keep it completely flat at 190 (0)
      const y = campaigns.length === 0 ? 190 : 190 - (val / maxVal) * 130;
      return { x, y, value: val };
    });

    return points;
  };

  const engagementPoints = getWeeklyEngagementPoints();
  const pointsPathD = engagementPoints.map((p, idx) => (idx === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ");
  const areaPathD = campaigns.length === 0 
    ? "M 40 190 L 560 190 L 560 190 L 40 190 Z" 
    : `M 40 190 L ${engagementPoints.map(p => `${p.x} ${p.y}`).join(" L ")} L 560 190 Z`;

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
              <h3 className="font-serif font-bold text-brand-text truncate leading-tight">{currentUser.brandName || currentUser.name}</h3>
              <p className="text-[11px] text-brand-text-light font-medium tracking-tight uppercase mt-0.5">Kategori {profileCategory}</p>
            </div>
          </div>
          <span className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-sage text-brand-sage-dark text-[10px] font-bold">
            <CheckCircle className="w-3 h-3" /> Rekanan Terpercaya
          </span>
        </div>

        <div className="mt-6 px-4 space-y-1">
          <p className="px-3 text-xs tracking-widest font-bold text-brand-text-light uppercase mb-2 select-none">Menu Utama</p>
          {[
            { id: "dashboard", label: "Halaman Utama", icon: Sparkles },
            { id: "campaigns", label: "Campaign", icon: Users },
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
              <div className="col-span-12 lg:col-span-8 bg-brand-sage text-brand-text rounded-[2rem] p-8 relative overflow-hidden flex flex-col justify-between shadow-xs border border-brand-sand min-h-[240px]">
                <div className="relative z-10 space-y-3">
                  <span className="px-3 py-1 bg-brand-sage-dark/15 text-brand-sage-dark text-[10px] font-black rounded-full uppercase tracking-wider">
                    🚀 Halaman Pemilik Usaha
                  </span>
                  <h1 className="font-serif text-3xl lg:text-4xl font-normal tracking-tight mt-3 text-brand-text">
                    Membantu Maju {currentUser.brandName || currentUser.name}
                  </h1>
                  <p className="text-brand-text-soft text-xs max-w-lg leading-relaxed">
                    Hubungkan usaha {profileCategory.toLowerCase()} Anda dengan influencer mahasiswa kreatif di {profileCity}. Gunakan bantuan AI pintar untuk membuat arahan promosi Anda secara otomatis.
                  </p>
                </div>

                <div className="relative z-10 flex gap-8 pt-6 border-t border-brand-sage-dark/20 mt-4">
                  <div>
                    <div className="text-2xl font-black text-brand-sage-dark">{campaigns.length}</div>
                    <div className="text-[10px] text-brand-text-soft uppercase tracking-wide font-medium">Promosi Aktif</div>
                  </div>
                  <div className="w-px h-8 bg-brand-sand"></div>
                  <div>
                    <div className="text-2xl font-black text-brand-sage-dark">{matchRate !== "—" ? matchRate : "100%"}</div>
                    <div className="text-[10px] text-brand-text-soft uppercase tracking-wide font-medium">Respon Penerimaan</div>
                  </div>
                </div>
              </div>

              {/* Bento Quick Action - Warm Blush Pink Pastel */}
              <div className="col-span-12 lg:col-span-4 bg-brand-blush border border-brand-sand rounded-[2rem] p-7 flex flex-col justify-between shadow-xs text-brand-text">
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
            <div className="bg-brand-white border border-brand-sand rounded-[1.5rem] p-6 shadow-sm/10 flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="space-y-2 flex-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-sage text-brand-sage-dark text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-sage-dark animate-pulse"></span>
                  Saran Pintar AI Hari Ini
                </span>
                <p className="text-xs text-brand-text-soft leading-relaxed">
                  <strong className="text-brand-text">Peluang Ramai Hari Ini:</strong> Target audiens mahasiswa lokal sangat responsif terhadap promosi kreatif di kota {profileCity}. Cobalah bekerjasama dengan influencer bertema "{profileCategory}" atau "Lifestyle" agar promosi brand {profileBrand || "Anda"} tepat sasaran.
                </p>
              </div>
            </div>

            {/* Platform summary stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "KAMPANYE ANDA", value: totalCampaigns, sub: `${activeCampaigns} Sedang Berjalan` },
                { label: "POTENSI PENONTON", value: formattedAudience !== "—" ? formattedAudience : "0", sub: "Estimasi Pengikut" },
                { label: "TINGKAT MATCHING", value: matchRate !== "—" ? matchRate : "100%", sub: "Penerimaan Undangan" },
                { label: "DANA TERKOMIT", value: `Rp${totalEscrowBudget.toLocaleString()}`, sub: "Rekening Escrow Aman" }
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
                  {logs.slice(0, 4).map((log) => (
                    <div key={log.id} className="py-3.5 flex items-start gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-brand-sage-dark shrink-0 mt-1.5" />
                      <div>
                        <p className="text-xs text-brand-text-soft">
                          <span className="font-bold text-brand-text">{log.actor}</span>: {log.details}
                        </p>
                        <span className="text-[10px] text-brand-text-light font-mono block mt-0.5">
                          {new Date(log.date).toLocaleTimeString()}
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

              {/* Direct Quick Campaign Dashboard view with Manage Button */}
              <div className="bg-brand-white border border-brand-sand rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-xl font-bold text-brand-text">Kampanye Saat Ini</h3>
                  <button 
                    onClick={() => setActiveTab("campaigns")}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-brand-bg hover:bg-brand-sand/70 transition text-xs text-brand-text-soft font-bold cursor-pointer"
                  >
                    Kelola Semua <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3 overflow-y-auto max-h-[280px] pr-1">
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
                        <p className="text-[10px] text-brand-text-light mt-1">{camp.influencers.length} influencer</p>
                      </div>
                    </div>
                  ))}

                  {campaigns.length === 0 && (
                    <div className="text-center py-10">
                      <p className="text-xs text-brand-text-light">Belum ada kampanye terdaftar.</p>
                      <button 
                        onClick={() => setActiveTab("campaigns")}
                        className="text-xs text-brand-blush-dark font-bold underline mt-2 cursor-pointer"
                      >
                        Bikin Sekarang di Menu Campaign
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>

          </motion.div>
        )}

        {/* TAB: CAMPAIGNS MANAGEMENT */}
        {activeTab === "campaigns" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 select-text">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="font-serif text-3xl font-bold tracking-tight text-brand-text">Daftar Kampanye Promosi</h2>
                <p className="mt-1 text-sm text-brand-text-soft">
                  Kelola seluruh program kampanye promosi Anda, ubah detail kriteria, serta setujui atau tolak pengajuan dari influencer pelamar.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-1.5 px-5 py-3 rounded-2xl bg-brand-text text-brand-white text-xs font-bold hover:opacity-95 active:scale-95 transition-all cursor-pointer shadow-md select-none shrink-0"
              >
                <Plus className="w-4 h-4" /> Buat Campaign Baru
              </button>
            </div>

            <div className="space-y-6">
              {campaigns.map((camp) => {
                const applicants = camp.influencers.filter(inf => inf.status === "applied");
                const acceptedOrWorking = camp.influencers.filter(inf => inf.status !== "applied" && inf.status !== "invited");
                const invitedOnly = camp.influencers.filter(inf => inf.status === "invited");

                return (
                  <div key={camp.id} className="bg-brand-white border border-brand-sand rounded-[2rem] p-6 shadow-sm space-y-6 relative overflow-hidden">
                    
                    {/* Campaign core info header */}
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-brand-sand/50">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-brand-bg text-brand-text-soft text-[10px] font-bold border border-brand-sand/40">
                            {camp.category}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-brand-blush/40 text-brand-blush-dark text-[10px] font-bold">
                            {camp.platform}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-brand-sage text-brand-sage-dark text-[10px] font-bold font-mono uppercase">
                            {camp.status.toUpperCase()}
                          </span>
                        </div>
                        <h3 className="font-serif text-2xl font-bold text-brand-text mt-2">{camp.name}</h3>
                        <p className="text-xs text-brand-text-soft mt-1 max-w-2xl font-medium leading-relaxed">
                          {camp.description}
                        </p>
                      </div>

                      <div className="text-left lg:text-right shrink-0">
                        <span className="text-[10px] text-brand-text-light font-bold block uppercase tracking-wider">Anggaran Bersama (Escrow)</span>
                        <span className="text-xl font-mono font-black text-brand-sage-dark block mt-1">
                          Rp{camp.budget.toLocaleString()}
                        </span>
                        <div className="flex gap-2 mt-3 justify-start lg:justify-end">
                          <button
                            onClick={() => handleOpenEdit(camp)}
                            className="px-3.5 py-1.5 rounded-xl border border-brand-sand hover:bg-brand-bg text-brand-text font-bold text-[11px] cursor-pointer transition-all select-none"
                          >
                            Edit Campaign
                          </button>
                          <button
                            onClick={() => {
                              setBriefCampName(camp.name);
                              setBriefPlatform(camp.platform);
                              setSelectedCampaignForBrief(camp.id);
                              setActiveTab("brief");
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-brand-bg hover:bg-brand-sand text-brand-text-soft font-bold text-[11px] cursor-pointer transition-all select-none inline-flex items-center gap-1"
                          >
                            <Sparkles className="w-3 h-3 text-brand-blush-dark" /> AI Brief
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Metadata boxes: deadline & criteria */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-brand-bg/40 border border-brand-sand/30 space-y-1">
                        <span className="text-[9px] uppercase tracking-wider text-brand-text-light font-bold block">Tenggat Waktu Konten (Deadline)</span>
                        <span className="text-brand-text font-bold text-xs block">
                          {camp.deadline ? new Date(camp.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "Belum Ditentukan"}
                        </span>
                      </div>
                      <div className="p-4 rounded-2xl bg-brand-bg/40 border border-brand-sand/30 space-y-1">
                        <span className="text-[9px] uppercase tracking-wider text-brand-text-light font-bold block">Kriteria Khusus Influencer</span>
                        <span className="text-brand-text font-bold text-xs block truncate" title={camp.kriteria || "Terbuka untuk semua influencer kreatif"}>
                          {camp.kriteria || "Terbuka untuk semua influencer kreatif"}
                        </span>
                      </div>
                    </div>

                    {/* Section: Pengajuan Influencer (Applied) */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-1.5 text-brand-text">
                        <Users className="w-4 h-4 text-brand-blush-dark" />
                        <h4 className="text-xs font-black tracking-widest uppercase">Pengajuan Influencer Baru ({applicants.length})</h4>
                      </div>

                      {applicants.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {applicants.map((app) => (
                            <div key={app.influencerId} className="p-4 border border-brand-sand/70 bg-brand-white rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-brand-blush-dark/30 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-brand-blush-dark/10 flex items-center justify-center font-bold text-brand-blush-dark uppercase">
                                  {app.influencerName.charAt(0)}
                                </div>
                                <div>
                                  <h5 className="text-xs font-bold text-brand-text leading-tight">{app.influencerName}</h5>
                                  <button
                                    onClick={() => handleViewInfluencerProfile(app.influencerId)}
                                    className="text-[11px] text-brand-blush-dark hover:underline font-bold mt-1 inline-flex items-center gap-0.5 cursor-pointer"
                                  >
                                    Lihat Profil Kreator <ArrowRight className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                              <div className="flex gap-1.5 w-full sm:w-auto">
                                <button
                                  onClick={() => handleAcceptApplication(camp.id, app.influencerId, app.influencerName)}
                                  className="flex-1 sm:flex-none px-3.5 py-1.5 bg-brand-sage text-brand-sage-dark font-sans font-bold rounded-xl text-[11px] hover:opacity-95 cursor-pointer transition-all select-none shadow-xs"
                                >
                                  Terima (Accept)
                                </button>
                                <button
                                  onClick={() => handleDenyApplication(camp.id, app.influencerId, app.influencerName)}
                                  className="flex-1 sm:flex-none px-3.5 py-1.5 bg-[#FFF0F0] text-red-700 font-sans font-bold rounded-xl text-[11px] hover:bg-red-100 cursor-pointer transition-all select-none"
                                >
                                  Tolak (Deny)
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 rounded-2xl bg-brand-bg/15 border border-dashed border-brand-sand text-center text-xs text-brand-text-light">
                          Belum ada pengajuan influencer baru untuk kampanye ini.
                        </div>
                      )}
                    </div>

                    {/* Section: Kolaborator Kreator Terpilih (Active Collaborators) */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center gap-1.5 text-brand-text">
                        <CheckCircle className="w-4 h-4 text-brand-sage-dark" />
                        <h4 className="text-xs font-black tracking-widest uppercase">Kreator Terpilih & Progress Kerja ({acceptedOrWorking.length})</h4>
                      </div>

                      {acceptedOrWorking.length > 0 ? (
                        <div className="space-y-2">
                          {acceptedOrWorking.map((col) => {
                            const milestoneColor = 
                              col.status === "brief_ready" ? "bg-amber-100 text-amber-800 border-amber-200" :
                              col.status === "escrow_locked" ? "bg-indigo-100 text-indigo-800 border-indigo-200" :
                              col.status === "in_progress" ? "bg-purple-100 text-purple-800 border-purple-200" :
                              col.status === "content_uploaded" ? "bg-brand-sky text-brand-sky-dark border-brand-sky-dark/20" :
                              "bg-brand-sage text-brand-sage-dark border-brand-sage-dark/25";

                            const milestoneLabel =
                              col.status === "brief_ready" ? "Menunggu Escrow Terkunci (SME)" :
                              col.status === "escrow_locked" ? "Dana Escrow Terkunci" :
                              col.status === "in_progress" ? "Kreator Sedang Produksi" :
                              col.status === "content_uploaded" ? "Konten Selesai - Butuh Approval Pencairan" :
                              "Selesai & Dana Cair";

                            return (
                              <div key={col.influencerId} className="p-4 border border-brand-sand/40 bg-brand-bg/10 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-brand-text text-xs">{col.influencerName}</span>
                                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-sans font-black uppercase tracking-wider border ${milestoneColor}`}>
                                      {milestoneLabel}
                                    </span>
                                  </div>
                                  
                                  {col.status === "content_uploaded" && col.submissionUrl && (
                                    <div className="mt-2 text-[11px] text-brand-text-soft leading-normal">
                                      🔗 Bukti Live Konten: <a href={col.submissionUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-brand-blush-dark underline select-all">{col.submissionUrl}</a>
                                      <p className="text-[10px] text-brand-text-light font-medium mt-0.5">Silakan tinjau link konten di atas, lalu rilis dana di tab "Pembayaran Aman (Escrow)" untuk mencairkan pembayaran.</p>
                                    </div>
                                  )}
                                </div>

                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleViewInfluencerProfile(col.influencerId)}
                                    className="px-3.5 py-1.5 rounded-xl border border-brand-sand hover:bg-brand-bg text-brand-text font-bold text-[11px] cursor-pointer"
                                  >
                                    Lihat Profil
                                  </button>
                                  {(col.status === "brief_ready" || col.status === "content_uploaded") && (
                                    <button
                                      onClick={() => setActiveTab("escrow")}
                                      className="px-3.5 py-1.5 rounded-xl bg-brand-text text-brand-white font-bold text-[11px] cursor-pointer shadow-xs hover:opacity-95"
                                    >
                                      Proses di Escrow
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-4 rounded-2xl bg-brand-bg/15 border border-dashed border-brand-sand text-center text-xs text-brand-text-light">
                          Belum ada kolaborator kreatif terpilih untuk kampanye ini. Cari influencer potensial di tab "Cari Influencer"!
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}

              {campaigns.length === 0 && (
                <div className="bg-brand-white border border-brand-sand rounded-[2rem] p-12 text-center text-brand-text-soft text-xs max-w-xl mx-auto space-y-4">
                  <p className="leading-relaxed">Anda belum memiliki kampanye promosi aktif. Buat draf kampanye pertama Anda dan undang influencer terbaik sekarang juga!</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-5 py-2.5 bg-brand-text text-brand-white font-bold text-xs rounded-xl hover:opacity-95 cursor-pointer shadow-md"
                  >
                    Bikin Campaign Pertama
                  </button>
                </div>
              )}
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
                      d={areaPathD}
                      fill="rgba(184,109,94,0.12)"
                    />

                    {/* Border Line */}
                    <path
                      d={pointsPathD}
                      fill="none"
                      stroke="#B86D5E"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />

                    {/* Nodes & Data Labels */}
                    {engagementPoints.map((pt, index) => (
                      <g key={index}>
                        <circle cx={pt.x} cy={pt.y} r="6" fill="#B86D5E" stroke="#FFFFFF" strokeWidth="2" />
                        {campaigns.length > 0 && (
                          <text 
                            x={pt.x} 
                            y={pt.y - 12} 
                            fontSize="10" 
                            textAnchor="middle" 
                            fontWeight="bold" 
                            className="fill-brand-text-dark font-mono bg-white"
                          >
                            {pt.value >= 1000 ? `${(pt.value / 1000).toFixed(1)}K` : pt.value}
                          </text>
                        )}
                      </g>
                    ))}

                    {/* Day Text Labels */}
                    <text x="35" y="230" fontSize="12" className="fill-brand-text-light font-bold">Sen</text>
                    <text x="165" y="230" fontSize="12" className="fill-brand-text-light font-bold">Sel</text>
                    <text x="295" y="230" fontSize="12" className="fill-brand-text-light font-bold">Rab</text>
                    <text x="425" y="230" fontSize="12" className="fill-brand-text-light font-bold">Kam</text>
                    <text x="555" y="230" fontSize="12" className="fill-brand-text-light font-bold">Jum</text>

                    {/* Guidance placeholder for empty state */}
                    {campaigns.length === 0 && (
                      <g>
                        <rect x="120" y="80" width="360" height="65" rx="16" fill="#FFFFFF" stroke="#E8DED2" strokeWidth="1" />
                        <text x="300" y="105" textAnchor="middle" fontSize="11" fontWeight="bold" className="fill-brand-text">Belum ada kampanye aktif</text>
                        <text x="300" y="125" textAnchor="middle" fontSize="10" className="fill-brand-text-soft">Buat kampanye & undang influencer untuk memantau performa</text>
                      </g>
                    )}
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
                          {camp.influencers.length > 0 
                            ? camp.influencers.map(i => i.influencerName).join(", ") 
                            : "Belum ada undangan"
                          }
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold">
                          {getCampReachEst(camp)}
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

                <div className="space-y-3 overflow-y-auto max-h-[340px] pr-1">
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
                            onClick={() => handleLockEscrow(tx.id, tx.campaignId, tx.influencerId)}
                            className="px-3 py-1.5 bg-brand-text text-brand-white font-bold rounded-xl hover:opacity-90 transition-all text-[11px] cursor-pointer cursor-pointer whitespace-nowrap"
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
                          const associatedCamp = campaigns.find(c => c.id === tx.campaignId);
                          const member = associatedCamp?.influencers.find(i => i.influencerId === tx.influencerId);
                          if (member?.status === "content_uploaded") {
                            return (
                              <button
                                onClick={() => handleReleaseEscrow(tx.id, tx.campaignId, tx.influencerId)}
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
              <div className="bg-brand-white border border-brand-sand rounded-3xl p-6 shadow-sm flex flex-col h-[520px]">
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
                      className="w-full min-h-[90px] border border-brand-sand bg-brand-bg/50 rounded-2xl px-4 py-3 font-medium text-brand-text text-xs focus:outline-none leading-relaxed mt-1 border-solid"
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
                      <p className="font-serif text-3xl font-black text-brand-text mt-1">{currentUser.rating || 5.0} ★</p>
                      <p className="text-[10px] text-brand-text-soft mt-1">Sangat komunikatif</p>
                    </div>

                    <div className="bg-brand-bg/40 border border-brand-sand/50 rounded-2xl p-4 text-center">
                      <p className="text-[10px] text-brand-text-light font-bold">KAMPANYE LOKAL</p>
                      <p className="font-serif text-3xl font-black text-brand-text mt-1">{campaigns.length} Total</p>
                      <p className="text-[10px] text-brand-text-soft mt-1">Selesai teratur</p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-brand-text-soft font-medium">Kecepatan Pembayaran (Lock Escrow):</span>
                      <span className="font-bold text-brand-sage-dark font-mono">
                        {escrows.filter(e => e.status !== "pending").length > 0 ? "100% Tepat Waktu" : "Belum Ada Transaksi"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-brand-text-soft font-medium">Indepth Brief Rating:</span>
                      <span className="font-bold text-brand-text font-mono">
                        {campaigns.some(c => c.briefText) ? "5.0 / 5.0" : "— (Belum buat brief)"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-brand-text-soft font-medium">Rekomendasi Ulang Influencer:</span>
                      <span className="font-bold text-[#8A6A11] font-mono">
                        {completedCampaigns > 0 ? "100% Puas" : "— (Belum selesai)"}
                      </span>
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
                      <label className="block mb-1.5">Anggaran / Tarif</label>
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
                        <option value="YouTube Shorts">YouTube Shorts</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1.5">Tenggat Waktu (Deadline)</label>
                      <input
                        type="date"
                        required
                        value={newCampaignDeadline}
                        onChange={(e) => setNewCampaignDeadline(e.target.value)}
                        className="w-full border border-brand-sand bg-brand-bg/40 rounded-2xl px-4 py-2.5 font-medium text-brand-text focus:outline-none text-[11px]"
                      />
                    </div>

                    <div>
                      <label className="block mb-1.5">Kategori Bidang</label>
                      <select
                        value={newCampaignCategory}
                        onChange={(e) => setNewCampaignCategory(e.target.value)}
                        className="w-full border border-brand-sand bg-brand-bg/40 rounded-2xl px-4 py-2.5 font-medium text-brand-text focus:outline-none cursor-pointer text-[11px]"
                      >
                        <option value="Kuliner">Kuliner</option>
                        <option value="Fashion">Fashion</option>
                        <option value="Lifestyle">Lifestyle</option>
                        <option value="Kecantikan">Kecantikan</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1.5">Kriteria Khusus Pelamar</label>
                    <input
                      type="text"
                      placeholder="Contoh: Mahasiswa Malang, Followers minimal 5K"
                      value={newCampaignKriteria}
                      onChange={(e) => setNewCampaignKriteria(e.target.value)}
                      className="w-full border border-brand-sand bg-brand-bg/40 rounded-2xl px-4 py-2.5 font-medium text-brand-text focus:outline-none text-xs"
                    />
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

      {/* EDIT CAMPAIGN DIALOG MODAL */}
      <AnimatePresence>
        {showEditModal && editingCampaignId && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
              <div className="fixed inset-0 bg-brand-text/50 transition-opacity" onClick={() => setShowEditModal(false)}></div>
              
              <motion.div 
                initial={{ transform: "scale(0.95)", opacity: 0 }}
                animate={{ transform: "scale(1)", opacity: 1 }}
                exit={{ transform: "scale(0.95)", opacity: 0 }}
                className="bg-brand-white rounded-3xl overflow-hidden shadow-xl max-w-md w-full p-6 z-10 border border-brand-sand relative font-sans"
              >
                <h3 className="font-serif text-2xl font-bold text-brand-text mb-4">Ubah Data Campaign</h3>
                
                <form onSubmit={handleSaveCampaignEdit} className="space-y-4 text-xs font-bold uppercase tracking-wider text-brand-text-soft">
                  <div>
                    <label className="block mb-1.5">Nama Campaign</label>
                    <input
                      type="text"
                      required
                      value={editCampaignName}
                      onChange={(e) => setEditCampaignName(e.target.value)}
                      className="w-full border border-brand-sand bg-brand-bg/40 rounded-2xl px-4 py-2.5 font-medium text-brand-text focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5">Deskripsi Singkat</label>
                    <textarea
                      value={editCampaignDesc}
                      onChange={(e) => setEditCampaignDesc(e.target.value)}
                      className="w-full h-16 border border-brand-sand bg-brand-bg/40 rounded-2xl px-4 py-2 font-medium text-brand-text focus:outline-none border-solid mt-1 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1.5">Anggaran / Tarif</label>
                      <select
                        value={editCampaignBudget}
                        onChange={(e) => setEditCampaignBudget(Number(e.target.value))}
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
                        value={editCampaignPlatform}
                        onChange={(e) => setEditCampaignPlatform(e.target.value)}
                        className="w-full border border-brand-sand bg-brand-bg/40 rounded-2xl px-4 py-2.5 font-medium text-brand-text focus:outline-none cursor-pointer"
                      >
                        <option value="TikTok">TikTok Video</option>
                        <option value="Instagram">Instagram Story/Reels</option>
                        <option value="YouTube Shorts">YouTube Shorts</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1.5">Tenggat Waktu (Deadline)</label>
                      <input
                        type="date"
                        required
                        value={editCampaignDeadline}
                        onChange={(e) => setEditCampaignDeadline(e.target.value)}
                        className="w-full border border-brand-sand bg-brand-bg/40 rounded-2xl px-4 py-2.5 font-medium text-brand-text focus:outline-none text-[11px]"
                      />
                    </div>

                    <div>
                      <label className="block mb-1.5">Kategori Bidang</label>
                      <select
                        value={editCampaignCategory}
                        onChange={(e) => setEditCampaignCategory(e.target.value)}
                        className="w-full border border-brand-sand bg-brand-bg/40 rounded-2xl px-4 py-2.5 font-medium text-brand-text focus:outline-none cursor-pointer text-[11px]"
                      >
                        <option value="Kuliner">Kuliner</option>
                        <option value="Fashion">Fashion</option>
                        <option value="Lifestyle">Lifestyle</option>
                        <option value="Kecantikan">Kecantikan</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1.5">Kriteria Khusus Pelamar</label>
                    <input
                      type="text"
                      placeholder="Contoh: Mahasiswa Malang, Followers minimal 5K"
                      value={editCampaignKriteria}
                      onChange={(e) => setEditCampaignKriteria(e.target.value)}
                      className="w-full border border-brand-sand bg-brand-bg/40 rounded-2xl px-4 py-2.5 font-medium text-brand-text focus:outline-none text-xs"
                    />
                  </div>

                  <div className="flex gap-2 pt-3 justify-end font-sans">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="px-4 py-2.5 rounded-xl border border-brand-sand text-brand-text-soft hover:bg-brand-bg text-xs font-bold transition-all cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-brand-text text-brand-white text-xs font-bold hover:opacity-90 transition-all cursor-pointer"
                    >
                      Simpan Perubahan
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* VIEW INFLUENCER PUBLIC PROFILE DIALOG MODAL */}
      <AnimatePresence>
        {showInfluencerProfileModal && selectedInfluencerProfile && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
              <div className="fixed inset-0 bg-brand-text/50 transition-opacity" onClick={() => setShowInfluencerProfileModal(false)}></div>
              
              <motion.div 
                initial={{ transform: "scale(0.95)", opacity: 0 }}
                animate={{ transform: "scale(1)", opacity: 1 }}
                exit={{ transform: "scale(0.95)", opacity: 0 }}
                className="bg-brand-white rounded-3xl overflow-hidden shadow-xl max-w-md w-full p-6 z-10 border border-brand-sand relative font-sans text-brand-text"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-sage/25 rounded-full blur-2xl -mr-6 -mt-6" />

                <div className="flex items-center gap-4 border-b border-brand-sand pb-4 mb-4">
                  <div className="w-14 h-14 rounded-full bg-brand-blush flex items-center justify-center font-serif text-2xl font-black text-brand-blush-dark border border-brand-sand shadow-inner shrink-0">
                    {selectedInfluencerProfile.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-brand-text leading-tight">{selectedInfluencerProfile.name}</h3>
                    <p className="font-mono text-xs text-brand-blush-dark font-bold mt-0.5">{selectedInfluencerProfile.handle || "@kreator_lokal"}</p>
                  </div>
                </div>

                <div className="space-y-4 text-xs font-medium text-brand-text-soft">
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase tracking-wider text-brand-text-light font-bold block">Biodata Kreator</span>
                    <p className="text-brand-text leading-relaxed font-sans font-medium text-[11px] italic bg-brand-bg/40 p-3 rounded-2xl border border-brand-sand/30">
                      "Saya adalah kreator konten mahasiswa aktif di kota {selectedInfluencerProfile.city || "Malang"} yang fokus membuat konten kreatif bergenre {selectedInfluencerProfile.niche ? selectedInfluencerProfile.niche.join(', ') : 'Umum'}. Sangat senang berkolaborasi dengan brand lokal berkualitas."
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase tracking-wider text-brand-text-light font-bold block">Pengikut (Followers)</span>
                      <span className="text-brand-text font-bold block text-sm font-mono">{selectedInfluencerProfile.followers}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase tracking-wider text-brand-text-light font-bold block">Tarif Per Post</span>
                      <span className="text-brand-sage-dark font-bold block text-sm font-mono">{selectedInfluencerProfile.pricePerPost}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase tracking-wider text-brand-text-light font-bold block">Kota Domisili</span>
                      <span className="text-brand-text font-bold block flex items-center gap-0.5"><MapPin className="w-3.5 h-3.5 text-brand-text-light" /> {selectedInfluencerProfile.city || "Malang"}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase tracking-wider text-brand-text-light font-bold block">Interaksi (Engagement)</span>
                      <span className="text-brand-text font-mono font-bold block">{selectedInfluencerProfile.engagement || "4.5%"}</span>
                    </div>
                  </div>

                  <div className="space-y-1 pt-1">
                    <span className="text-[9px] uppercase tracking-wider text-brand-text-light font-bold block">Kategori Niche</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedInfluencerProfile.niche && selectedInfluencerProfile.niche.map(n => (
                        <span key={n} className="px-2 py-0.5 bg-brand-bg text-[10px] rounded-md font-sans font-bold text-brand-text-soft border border-brand-sand/45">{n}</span>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-brand-sage/10 border border-brand-sage-dark/10 rounded-xl text-[10px] leading-relaxed text-brand-text-soft">
                    🏆 <span className="font-bold text-brand-sage-dark">Kreator Berprestasi:</span> Kreator ini memiliki tingkat ketaatan deadline yang tinggi dan penilaian bintang {selectedInfluencerProfile.rating || 5.0} dari mitra UMKM di Malang.
                  </div>
                </div>

                <div className="flex gap-2 mt-5">
                  <button
                    onClick={() => setShowInfluencerProfileModal(false)}
                    className="w-full py-3 rounded-2xl bg-brand-text text-brand-white font-bold text-xs hover:opacity-95 transition-all cursor-pointer text-center"
                  >
                    Tutup Profil
                  </button>
                </div>
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
