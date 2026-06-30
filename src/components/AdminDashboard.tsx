import React, { useState, useEffect } from "react";
import { User, Campaign, EscrowTx, SystemLog, WithdrawalTx } from "../types";
import { 
  getDbUsers, 
  getDbCampaigns, 
  getDbEscrow, 
  getDbLogs, 
  saveDbUser, 
  saveDbEscrow, 
  saveDbCampaign, 
  addDbLog,
  db
} from "../utils";
import { motion } from "motion/react";
import { 
  ShieldCheck, Users, Wallet, FileText, Check, X, 
  AlertTriangle, Hammer, RefreshCw, Trash2, Database, Award, ClipboardList, Search,
  MapPin, ExternalLink 
} from "lucide-react";
import CustomAlert from "./CustomAlert";

interface AdminDashboardProps {
  currentUser: User;
}

export default function AdminDashboard({ currentUser }: AdminDashboardProps) {
  const [activeSubTab, setActiveSubTab] = useState<"users" | "campaigns" | "escrows" | "logs">("users");

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

  // Database lists
  const [users, setUsers] = useState<User[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [escrows, setEscrows] = useState<EscrowTx[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalTx[]>([]);

  // Campaigns monitoring search and status filters
  const [campSearch, setCampSearch] = useState("");
  const [campFilterStatus, setCampFilterStatus] = useState("all");
  const [campFilterCategory, setCampFilterCategory] = useState("");

  const forceRefresh = async () => {
    const [u, c, e, l, w] = await Promise.all([
      getDbUsers(),
      getDbCampaigns(),
      getDbEscrow(),
      getDbLogs(),
      db.withdrawals.list()
    ]);
    // Sort logs newest first
    const sortedLogs = l.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setUsers(u);
    setCampaigns(c);
    setEscrows(e);
    setLogs(sortedLogs);
    setWithdrawals(w);
  };

  useEffect(() => {
    forceRefresh();
  }, [currentUser]);

  // Handle approving pending user accounts
  const handleApproveUser = async (userId: string, userName: string) => {
    const allUsers = await getDbUsers();
    const user = allUsers.find(u => u.id === userId);
    if (user) {
      user.isApproved = true;
      await saveDbUser(user);
      await addDbLog(currentUser.name, "Persetujuan User", `Admin Utama menyetujui akun ${userName}`, "admin");
      await forceRefresh();
      setAlertInfo({
        isOpen: true,
        title: "Persetujuan Berhasil",
        message: `Akun ${userName} berhasil disetujui untuk go-live di InfluMatch.`,
        type: "success"
      });
    }
  };

  const handleApproveWithdrawal = async (wId: string) => {
    const updated = await db.withdrawals.update(wId, { status: "completed" });
    if (updated) {
      await addDbLog("Admin", "Persetujuan Tarik Dana", `Mentransfer Rp${updated.amount.toLocaleString()} ke rekening ${updated.bankName} (${updated.influencerName})`, "admin");
      await forceRefresh();
      setAlertInfo({
        isOpen: true,
        title: "Pencairan Disetujui",
        message: `Pencairan dana ${updated.influencerName} sebesar Rp${updated.amount.toLocaleString()} telah berhasil disetujui dan ditransfer.`,
        type: "success"
      });
    }
  };

  const handleRejectWithdrawal = async (wId: string) => {
    const updated = await db.withdrawals.update(wId, { status: "rejected" });
    if (updated) {
      await addDbLog("Admin", "Penolakan Tarik Dana", `Menolak pengajuan pencairan dana Rp${updated.amount.toLocaleString()} milik ${updated.influencerName}`, "admin");
      await forceRefresh();
      setAlertInfo({
        isOpen: true,
        title: "Pencairan Ditolak",
        message: `Pencairan dana ${updated.influencerName} ditolak.`,
        type: "info"
      });
    }
  };

  // Handle deleting/suspending user accounts
  const handleRejectUser = async (userId: string, userName: string) => {
    await db.users.delete(userId);
    await addDbLog(currentUser.name, "Penolakan User", `Admin menolak/menghapus akun ${userName}`, "admin");
    await forceRefresh();
    setAlertInfo({
      isOpen: true,
      title: "Akun Ditolak",
      message: `Akun ${userName} berhasil ditolak & dihapus dari sistem.`,
      type: "warning"
    });
  };

  // Handle forcing release of escrow in dispute scenario
  const handleAdminForceRelease = async (txId: string) => {
    const allEscrows = await getDbEscrow();
    const tx = allEscrows.find(e => e.id === txId);
    if (tx) {
      tx.status = "released";
      await saveDbEscrow(tx);

      // set campaign status in db
      const allCampaigns = await getDbCampaigns();
      const camp = allCampaigns.find(c => c.id === tx.campaignId);
      if (camp) {
        const infCandidate = camp.influencers.find(i => i.influencerId === tx.influencerId);
        if (infCandidate) {
          infCandidate.status = "completed";
          infCandidate.escrowReleased = true;
        }
        if (camp.influencers.every(i => i.status === "completed")) {
          camp.status = "completed";
        }
        await saveDbCampaign(camp);
      }

      await addDbLog(currentUser.name, "Bantuan Dana Selesai", `Admin Utama membantu mengirimkan dana pembayaran sebesar Rp${tx.amount.toLocaleString()} ke influencer ${tx.influencerName}`, "admin");
      await forceRefresh();
      setAlertInfo({
        isOpen: true,
        title: "Dana Dicairkan (Escrow)",
        message: "Penyelesaian Selesai! Pembayaran berhasil diteruskan langsung ke saldo dompet influencer.",
        type: "success"
      });
    }
  };

  // Handle cancelling a campaign
  const handleCancelCampaign = async (campaignId: string, campaignName: string) => {
    if (window.confirm(`Apakah Anda yakin ingin membatalkan/menghapus tawaran kampanye "${campaignName}"?`)) {
      const allCampaigns = await getDbCampaigns();
      const camp = allCampaigns.find(c => c.id === campaignId);
      if (camp) {
        camp.status = "cancelled";
        await saveDbCampaign(camp);
        await addDbLog(currentUser.name, "Membatalkan Kampanye", `Admin membatalkan kampanye "${campaignName}"`, "admin");
        await forceRefresh();
        setAlertInfo({
          isOpen: true,
          title: "Kampanye Dibatalkan",
          message: `Kampanye "${campaignName}" berhasil dibatalkan secara permanen.`,
          type: "warning"
        });
      }
    }
  };

  // Stats calculation
  const totalUMKM = users.filter(u => u.role === "umkm").length;
  const totalInfluencers = users.filter(u => u.role === "influencer").length;
  const totalEscrowVolume = escrows.reduce((sum, curr) => sum + curr.amount, 0);
  const pendingApprovals = users.filter(u => !u.isApproved);

  return (
    <div className="flex bg-brand-bg min-h-[calc(100vh-64px)] font-sans flex-col md:flex-row">
      
      {/* ADMIN CONTROL PANEL NAVIGATION */}
      <aside className="w-full md:w-64 bg-brand-white border-r border-brand-sand shrink-0 py-6">
        <div className="px-6 pb-6 border-b border-brand-sand">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center font-bold text-red-700 shadow-inner text-base">
              AD
            </div>
            <div>
              <h3 className="font-serif font-bold text-brand-text truncate leading-tight">Pengelola Sistem</h3>
              <p className="text-[11px] text-brand-text-light font-bold uppercase tracking-wider mt-0.5">InfluMatch HQ</p>
            </div>
          </div>
          <span className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-800 text-[10px] font-bold">
            <ShieldCheck className="w-3.5 h-3.5" /> Pengelola Sistem Utama
          </span>
        </div>

        <div className="mt-6 px-4 space-y-1">
          <p className="px-3 text-xs tracking-widest font-bold text-brand-text-light uppercase mb-2 select-none font-sans">Menu Kontrol</p>
          {[
            { id: "users", label: "Kelola Pendaftar", icon: Users, badge: pendingApprovals.length },
            { id: "campaigns", label: "Pantau Kampanye", icon: FileText },
            { id: "escrows", label: "Verifikasi Pembayaran", icon: Wallet },
            { id: "logs", label: "Catatan Aktivitas", icon: ClipboardList }
          ].map(subTab => {
            const Icon = subTab.icon;
            const isSubActive = activeSubTab === subTab.id;
            return (
              <button
                key={subTab.id}
                onClick={() => {
                  setActiveSubTab(subTab.id as any);
                  forceRefresh();
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  isSubActive 
                    ? "bg-red-50 border-l-4 border-red-600 text-brand-text shadow-sm" 
                    : "text-brand-text-soft hover:bg-brand-bg/50 hover:text-brand-text"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 shrink-0 ${isSubActive ? 'text-red-600' : 'text-brand-text-light'}`} />
                  <span>{subTab.label}</span>
                </div>
                {subTab.badge !== undefined && subTab.badge > 0 && (
                  <span className="bg-red-600 text-brand-white text-[9px] font-mono font-bold px-2 py-0.5 rounded-full select-none ml-2">
                    {subTab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </aside>

      {/* ADMIN CONTENT BODY */}
      <main className="flex-1 p-6 lg:p-10 max-w-7xl space-y-6">
        
        {/* Bento Grid Header Layout */}
        <div className="grid grid-cols-12 gap-5">
          
          {/* Bento Hero - Admin Lavender Pastel Insight Box */}
          <div className="col-span-12 lg:col-span-8 bg-brand-lav text-brand-text rounded-[2rem] p-8 relative overflow-hidden flex flex-col justify-between shadow-xs border border-brand-sand min-h-[250px]">
            <div className="relative z-10">
              <span className="px-3 py-1 bg-brand-lav-dark/15 text-brand-lav-dark text-[10px] font-black rounded-full uppercase tracking-wider">
                Platform Admin Console
              </span>
              <h1 className="font-serif text-3xl lg:text-4xl font-normal mt-4 mb-2 tracking-tight text-brand-text">
                Empowering {users.length}+ Accounts
              </h1>
              <p className="text-brand-text-soft text-xs max-w-lg leading-relaxed font-sans">
                Hubungkan UMKM lokal regional Jawa Timur dengan mahasiswa influencer terverifikasi. Transaksi aman, pelepasan escrow andal, dan audit aktivitas log.
              </p>
              
              <div className="mt-6 flex flex-wrap gap-8">
                <div>
                  <div className="text-2xl lg:text-3xl font-black text-brand-lav-dark">{campaigns.length}</div>
                  <div className="text-[10px] text-brand-text-soft font-mono">Active Campaigns</div>
                </div>
                <div className="w-px h-10 bg-brand-sand hidden sm:block"></div>
                <div>
                  <div className="text-2xl lg:text-3xl font-black text-brand-lav-dark">Rp {(totalEscrowVolume).toLocaleString()}</div>
                  <div className="text-[10px] text-brand-text-soft font-mono">Total Growth Circulated</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats Bento Alert Column (Warm Pastel Blush design style) */}
          <div className="col-span-12 lg:col-span-4 bg-brand-blush border border-brand-sand rounded-[2rem] p-6 flex flex-col justify-between shadow-xs">
            <div className="space-y-2">
              <div className="w-10 h-10 bg-brand-white text-brand-blush-dark rounded-full flex items-center justify-center mb-1 shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-brand-text text-sm">Actionable Security Insights</h4>
              <p className="text-[11px] text-brand-text-soft leading-relaxed font-sans">
                Ada <span className="font-bold text-brand-blush-dark">{pendingApprovals.length} pendaftar baru</span> menunggu tinjauan operasional Anda di tab Kelola Registrasi.
              </p>
            </div>
            
            <div className="text-[11px] font-bold text-brand-blush-dark flex items-center gap-1 mt-3">
              ● Sistem Pengawasan Aktif 
            </div>
          </div>

        </div>

        {/* Metrics counters cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "MITRA UMKM", value: totalUMKM, desc: "Usaha Terdaftar" },
            { label: "CREATOR MAHASISWA", value: totalInfluencers, desc: "Influencer Terverifikasi" },
            { label: "TRANSAKSI AKTIF", value: campaigns.length, desc: "Kampanye berjalan" },
            { label: "VOLUME ESCROW", value: `Rp${totalEscrowVolume.toLocaleString()}`, desc: "Kontribusi Finansial" }
          ].map((card, idx0) => (
            <div key={idx0} className="bg-brand-white border border-brand-sand rounded-2xl p-5 shadow-xs">
              <p className="text-[10px] font-bold text-brand-text-light tracking-widest uppercase">{card.label}</p>
              <h4 className="font-serif text-2xl font-black text-brand-text mt-2">{card.value}</h4>
              <p className="text-xs text-brand-text-soft mt-1">{card.desc}</p>
            </div>
          ))}
        </div>

        {/* TAB SUB-PAGES */}
        {activeSubTab === "users" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            
            {/* Approved Users List */}
            <div className="bg-brand-white border border-brand-sand rounded-3xl p-6 shadow-sm overflow-hidden space-y-4">
              <h3 className="font-serif text-xl font-bold text-brand-text">Persetujuan & Moderasi Pengguna Baru</h3>
              <p className="text-xs text-brand-text-soft leading-relaxed">Tinjau saksama kelayakan akun pendaftar baru sebelum resmi dionlinekan.</p>
              
              <div className="overflow-x-auto pt-2">
                <table className="w-full text-left text-xs text-brand-text select-text">
                  <thead className="bg-brand-bg text-brand-text-soft uppercase tracking-wider font-bold">
                    <tr>
                      <th className="py-3 px-4 border-b border-brand-sand">NAMA USER</th>
                      <th className="py-3 px-4 border-b border-brand-sand">ROLE PENGGUNA</th>
                      <th className="py-3 px-4 border-b border-brand-sand">BRAND / HANDLE</th>
                      <th className="py-3 px-4 border-b border-brand-sand">DOMISILI</th>
                      <th className="py-3 px-4 border-b border-brand-sand">STATUS REGISTER</th>
                      <th className="py-3 px-4 border-b border-brand-sand text-right">TINDAKAN MODERASI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-sand/50">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-brand-bg/10">
                        <td className="py-3.5 px-4 font-bold">{u.name}<br /><span className="text-[10px] text-brand-text-light font-normal">{u.email}</span></td>
                        <td className="py-3.5 px-4 uppercase font-mono font-medium tracking-wide">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${
                            u.role === "umkm" ? "bg-brand-blush text-brand-blush-dark font-sans font-bold" :
                            u.role === "admin" ? "bg-red-50 text-red-700" : "bg-brand-sage text-brand-sage-dark font-sans font-bold"
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono select-all">
                          {u.role === "umkm" ? (u.brandName || "—") : (u.handle || "—")}
                        </td>
                        <td className="py-3.5 px-4 text-brand-text-soft">{u.city || "Malang, Jatim"}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full font-mono font-bold uppercase text-[9px] ${
                            u.isApproved ? "bg-brand-sage text-brand-sage-dark" : "bg-[#FDF2CB] text-[#907010]"
                          }`}>
                            {u.isApproved ? "Aktif" : "Menunggu Approval"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right flex gap-1.5 justify-end">
                          {!u.isApproved && (
                            <button
                              onClick={() => handleApproveUser(u.id, u.name)}
                              className="px-2.5 py-1.5 bg-brand-text text-brand-white font-bold rounded-lg hover:opacity-90 transition-all text-[11px] flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3 h-3 text-brand-sage-dark" /> Setujui
                            </button>
                          )}
                          {u.id !== currentUser.id && (
                            <button
                              onClick={() => handleRejectUser(u.id, u.name)}
                              className="px-2.5 py-1.5 border border-brand-sand text-brand-text-soft hover:bg-brand-bg rounded-lg transition-all text-[11px] cursor-pointer"
                            >
                              Hapus
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeSubTab === "campaigns" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            
            {/* Realtime Stats Summary specifically for campaigns */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { label: "Total Kampanye", value: campaigns.length, desc: "Tercatat di sistem", color: "border-brand-sand" },
                { label: "Belum Diambil", value: campaigns.filter(c => c.status === "waiting" || c.influencers.length === 0).length, desc: "Menunggu influencer", color: "border-amber-200 bg-amber-50/10 text-amber-800" },
                { label: "Sedang Berjalan", value: campaigns.filter(c => c.status === "active").length, desc: "Proses pembuatan konten", color: "border-brand-sky-dark/20 bg-brand-sky/10 text-brand-sky-dark" },
                { label: "Telah Selesai", value: campaigns.filter(c => c.status === "completed").length, desc: "Kerjasama selesai & cair", color: "border-brand-sage-dark/20 bg-brand-sage/10 text-brand-sage-dark" },
                { label: "Dibatalkan", value: campaigns.filter(c => c.status === "cancelled").length, desc: "Dihapus/dihentikan", color: "border-red-200 bg-red-50/10 text-red-700" }
              ].map((stat, idx) => (
                <div key={idx} className={`bg-brand-white border rounded-2xl p-4 shadow-xs ${stat.color}`}>
                  <p className="text-[10px] font-bold tracking-wider uppercase opacity-80">{stat.label}</p>
                  <h4 className="font-serif text-2xl font-black mt-1">{stat.value}</h4>
                  <p className="text-[10px] opacity-70 mt-0.5">{stat.desc}</p>
                </div>
              ))}
            </div>

            {/* Campaign Dashboard Controls (Search & Filters) */}
            <div className="bg-brand-white border border-brand-sand rounded-3xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-serif text-xl font-bold text-brand-text">Pusat Pemantauan Kampanye</h3>
                  <p className="text-xs text-brand-text-soft">Kelola, tinjau, dan evaluasi seluruh tawaran kerjasama UMKM Malang.</p>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {/* Category Filter */}
                  <select
                    value={campFilterCategory}
                    onChange={(e) => setCampFilterCategory(e.target.value)}
                    className="font-bold border border-brand-sand rounded-xl py-2 px-3 bg-brand-bg/30 text-xs text-brand-text-soft focus:outline-none cursor-pointer"
                  >
                    <option value="">Semua Kategori</option>
                    <option value="Kuliner">Kuliner</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Lifestyle">Lifestyle</option>
                    <option value="Kecantikan">Kecantikan</option>
                  </select>

                  {/* Status Filter */}
                  <select
                    value={campFilterStatus}
                    onChange={(e) => setCampFilterStatus(e.target.value)}
                    className="font-bold border border-brand-sand rounded-xl py-2 px-3 bg-brand-bg/30 text-xs text-brand-text-soft focus:outline-none cursor-pointer"
                  >
                    <option value="all">Semua Status</option>
                    <option value="waiting">Belum Diambil</option>
                    <option value="active">Sedang Berjalan</option>
                    <option value="completed">Telah Selesai</option>
                    <option value="cancelled">Dibatalkan</option>
                  </select>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-brand-text-light absolute left-4 top-3" />
                <input
                  type="text"
                  placeholder="Cari judul kampanye, pemilik usaha, deskripsi, atau nama influencer..."
                  value={campSearch}
                  onChange={(e) => setCampSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 border border-brand-sand rounded-2xl bg-brand-bg/20 text-xs text-brand-text focus:outline-none"
                />
              </div>
            </div>

            {/* Campaign Table Display */}
            <div className="bg-brand-white border border-brand-sand rounded-3xl p-6 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-brand-text select-text">
                  <thead className="bg-brand-bg text-brand-text-soft uppercase tracking-wider font-bold">
                    <tr>
                      <th className="py-3 px-4 border-b border-brand-sand">KAMPANYE</th>
                      <th className="py-3 px-4 border-b border-brand-sand">PEMILIK USAHA (UMKM)</th>
                      <th className="py-3 px-4 border-b border-brand-sand">ANGGARAN</th>
                      <th className="py-3 px-4 border-b border-brand-sand">STATUS KAMPANYE</th>
                      <th className="py-3 px-4 border-b border-brand-sand">KREATOR TERLIBAT & STATUS</th>
                      <th className="py-3 px-4 border-b border-brand-sand text-right">TINDAKAN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-sand/50">
                    {campaigns
                      .filter(camp => {
                        const q = campSearch.toLowerCase();
                        const nameMatch = camp.name.toLowerCase().includes(q);
                        const brandMatch = camp.umkmName.toLowerCase().includes(q);
                        const descMatch = camp.description.toLowerCase().includes(q);
                        const infMatch = camp.influencers.some(i => i.influencerName.toLowerCase().includes(q));
                        const searchMatch = !campSearch || nameMatch || brandMatch || descMatch || infMatch;

                        let statusMatch = true;
                        if (campFilterStatus === "waiting") {
                          statusMatch = camp.status === "waiting" || camp.influencers.length === 0;
                        } else if (campFilterStatus === "active") {
                          statusMatch = camp.status === "active";
                        } else if (campFilterStatus === "completed") {
                          statusMatch = camp.status === "completed";
                        } else if (campFilterStatus === "cancelled") {
                          statusMatch = camp.status === "cancelled";
                        }

                        const categoryMatch = !campFilterCategory || camp.category === campFilterCategory;

                        return searchMatch && statusMatch && categoryMatch;
                      })
                      .map(camp => {
                        const umkm = users.find(u => u.id === camp.umkmId);
                        const umkmCity = umkm?.city || "Malang";

                        return (
                          <tr key={camp.id} className="hover:bg-brand-bg/10">
                            <td className="py-3.5 px-4 font-bold">
                              <span className="text-brand-text font-serif text-sm block">{camp.name}</span>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="px-1.5 py-0.5 rounded bg-brand-blush text-brand-blush-dark text-[9px] font-bold uppercase">
                                  {camp.category}
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-brand-sand text-brand-text-soft text-[9px] font-bold font-mono">
                                  {camp.platform}
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="font-bold text-brand-text block">{camp.umkmName}</span>
                              <span className="text-[10px] text-brand-text-light flex items-center gap-0.5 mt-0.5">
                                <MapPin className="w-3 h-3" /> {umkmCity}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-mono font-bold text-brand-sage-dark text-sm">
                              Rp{camp.budget.toLocaleString()}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wide ${
                                camp.status === "completed" ? "bg-brand-sage text-brand-sage-dark" :
                                camp.status === "cancelled" ? "bg-red-50 text-red-700" :
                                camp.status === "active" ? "bg-brand-sky text-brand-sky-dark" :
                                "bg-[#FFF8E7] text-[#907010] border border-[#F5E1C0]"
                              }`}>
                                {camp.status === "waiting" ? "Menunggu Kreator" :
                                 camp.status === "active" ? "Sedang Berjalan" :
                                 camp.status === "completed" ? "Selesai" : "Dibatalkan"}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              {camp.influencers.length > 0 ? (
                                <div className="space-y-1 max-w-xs">
                                  {camp.influencers.map((inf, idx) => (
                                    <div key={idx} className="flex flex-col bg-brand-bg/40 p-1.5 rounded-lg border border-brand-sand/30">
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="font-bold text-[11px] text-brand-text truncate">{inf.influencerName}</span>
                                        <span className={`text-[8px] font-black uppercase px-1 rounded ${
                                          inf.status === "completed" ? "bg-brand-sage text-brand-sage-dark" :
                                          inf.status === "content_uploaded" ? "bg-brand-sky text-brand-sky-dark animate-pulse" :
                                          "bg-brand-sand text-brand-text-soft"
                                        }`}>
                                          {inf.status === "completed" ? "Selesai" :
                                           inf.status === "content_uploaded" ? "Unggah Video" :
                                           inf.status === "brief_ready" ? "Mulai Buat" : "Diundang"}
                                        </span>
                                      </div>
                                      {inf.contentUrl && (
                                        <a
                                          href={inf.contentUrl}
                                          target="_blank"
                                          referrerPolicy="no-referrer"
                                          className="text-[10px] text-brand-sky-dark underline mt-0.5 truncate flex items-center gap-0.5 font-mono"
                                        >
                                          Link Video <ExternalLink className="w-2.5 h-2.5 inline" />
                                        </a>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-brand-text-light text-[11px]">Belum ada influencer</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              {camp.status !== "cancelled" && camp.status !== "completed" ? (
                                <button
                                  onClick={() => handleCancelCampaign(camp.id, camp.name)}
                                  className="px-2.5 py-1.5 border border-red-200 text-red-700 bg-red-50/20 hover:bg-red-50 rounded-lg transition-all text-[11px] font-bold cursor-pointer inline-flex items-center gap-1"
                                >
                                  <X className="w-3 h-3" /> Batalkan
                                </button>
                              ) : (
                                <span className="text-brand-text-light text-[10px]">Arsip / Selesai</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    {campaigns.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-brand-text-soft">Tidak ada kampanye yang dibuat dalam sistem saat ini.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeSubTab === "escrows" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            
            {/* Audit Escrow Funds actions */}
            <div className="bg-brand-white border border-brand-sand rounded-3xl p-6 shadow-sm space-y-4 overflow-hidden">
              <h3 className="font-serif text-xl font-bold text-brand-text">Audit Penampungan Transaksi Escrow</h3>
              <p className="text-xs text-brand-text-soft leading-relaxed">Pantau secara berdaulat jaminan uang dalam platform. Selesaikan sengketa pengerjaan konten kreator menggunakan hak pelepasan paksa.</p>

              <div className="overflow-x-auto pt-2">
                <table className="w-full text-left text-xs text-brand-text select-text animate-fade-in">
                  <thead className="bg-brand-bg text-brand-text-soft uppercase tracking-wider font-bold">
                    <tr>
                      <th className="py-3 px-4 border-b border-brand-sand">KAMPANYE</th>
                      <th className="py-3 px-4 border-b border-brand-sand">INFLUENCER</th>
                      <th className="py-3 px-4 border-b border-brand-sand">NOMINAL JAMINAN</th>
                      <th className="py-3 px-4 border-b border-brand-sand">TANGGAL KONTRAK</th>
                      <th className="py-3 px-4 border-b border-brand-sand">STATUS ESCROW</th>
                      <th className="py-3 px-4 border-b border-brand-sand text-right">ARBITRASE MODERASI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-sand/50">
                    {escrows.map(ex => (
                      <tr key={ex.id} className="hover:bg-brand-bg/10">
                        <td className="py-3.5 px-4 font-bold">{ex.campaignName}</td>
                        <td className="py-3.5 px-4 text-brand-text-soft">{ex.influencerName}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-brand-sage-dark border-b border-brand-sand/50">Rp{ex.amount.toLocaleString()}</td>
                        <td className="py-3.5 px-4 font-mono text-brand-text mb-0.5">{ex.date}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full font-mono font-bold uppercase text-[9px] tracking-wide ${
                            ex.status === "released" ? "bg-brand-sage text-brand-sage-dark font-sans font-bold" :
                            ex.status === "locked" ? "bg-red-50 text-red-700 bg-[#FFF0F0] border border-red-200" : "bg-brand-sky text-brand-sky-dark font-sans"
                          }`}>
                            {ex.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {ex.status === "locked" && (
                            <button
                              onClick={() => handleAdminForceRelease(ex.id)}
                              className="px-3 py-1.5 bg-brand-text text-brand-white font-bold rounded-lg hover:opacity-90 hover:scale-[0.99] transition-all text-[11px] inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <Hammer className="w-3.5 h-3.5 text-brand-blush-dark" /> Lepas Paksa (Cairkan)
                            </button>
                          )}
                          {ex.status !== "locked" && <span className="text-brand-text-light text-[10px] font-medium font-sans">Aman / Archive</span>}
                        </td>
                      </tr>
                    ))}
                    {escrows.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-brand-text-soft">Tidak ada perputaran dana terdeteksi saat ini.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Verify Influencer Withdrawal Requests */}
            <div className="bg-brand-white border border-brand-sand rounded-3xl p-6 shadow-sm space-y-4 overflow-hidden mt-6">
              <h3 className="font-serif text-xl font-bold text-brand-text">Persetujuan & Verifikasi Penarikan Dana</h3>
              <p className="text-xs text-brand-text-soft leading-relaxed">Verifikasi bukti transfer manual atau hubungkan ke API perbankan. Setujui permintaan penarikan dana influencer terverifikasi setelah mencocokkan nomor rekening tujuan.</p>

              <div className="overflow-x-auto pt-2">
                <table className="w-full text-left text-xs text-brand-text select-text animate-fade-in">
                  <thead className="bg-brand-bg text-brand-text-soft uppercase tracking-wider font-bold">
                    <tr>
                      <th className="py-3 px-4 border-b border-brand-sand">KREATOR</th>
                      <th className="py-3 px-4 border-b border-brand-sand">BANK TUJUAN</th>
                      <th className="py-3 px-4 border-b border-brand-sand">NOMOR REKENING</th>
                      <th className="py-3 px-4 border-b border-brand-sand">NAMA PENERIMA</th>
                      <th className="py-3 px-4 border-b border-brand-sand">NOMINAL CAIR</th>
                      <th className="py-3 px-4 border-b border-brand-sand">TANGGAL PENGAJUAN</th>
                      <th className="py-3 px-4 border-b border-brand-sand">STATUS PENGIRIMAN</th>
                      <th className="py-3 px-4 border-b border-brand-sand text-right">AKSI VERIFIKASI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-sand/50">
                    {withdrawals.filter(w => w.status !== "pending" || !w.umkmId).map(w => (
                      <tr key={w.id} className="hover:bg-brand-bg/10">
                        <td className="py-3.5 px-4 font-bold">{w.influencerName}</td>
                        <td className="py-3.5 px-4 text-brand-text-soft font-bold">{w.bankName}</td>
                        <td className="py-3.5 px-4 font-mono">{w.accountNo}</td>
                        <td className="py-3.5 px-4 font-medium">{w.accountHolder}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-brand-sage-dark">Rp{w.amount.toLocaleString()}</td>
                        <td className="py-3.5 px-4 font-mono">{w.date}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full font-mono font-bold uppercase text-[9px] tracking-wide border ${
                            w.status === "completed" ? "bg-brand-sage text-brand-sage-dark border-brand-sage-dark/20" :
                            w.status === "rejected" ? "bg-red-100 text-red-700 border-red-200" : 
                            w.status === "approved_by_umkm" ? "bg-indigo-100 text-indigo-800 border-indigo-200" :
                            "bg-amber-100 text-amber-800 border-amber-200"
                          }`}>
                            {w.status === "completed" ? "Selesai" : 
                             w.status === "rejected" ? "Ditolak" : 
                             w.status === "approved_by_umkm" ? "Disetujui UMKM" :
                             "Tertunda Admin"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          {(w.status === "approved_by_umkm" || (w.status === "pending" && !w.umkmId)) ? (
                            <>
                              <button
                                onClick={() => handleApproveWithdrawal(w.id)}
                                className="px-2.5 py-1.5 bg-brand-text text-brand-white font-bold rounded-lg hover:opacity-90 hover:scale-[0.99] transition-all text-[11px] inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5 text-brand-sage" /> Selesai Transfer
                              </button>
                              <button
                                onClick={() => handleRejectWithdrawal(w.id)}
                                className="px-2.5 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 font-bold rounded-lg transition-all text-[11px] inline-flex items-center gap-1 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" /> Tolak
                              </button>
                            </>
                          ) : (
                            <span className="text-brand-text-light text-[10px] font-medium font-sans">Selesai Moderasi</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {withdrawals.filter(w => w.status !== "pending" || !w.umkmId).length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-10 text-center text-brand-text-soft">Tidak ada pengajuan penarikan dana aktif saat ini.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeSubTab === "logs" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            
            {/* Raw activity logs display */}
            <div className="bg-brand-white border border-brand-sand rounded-3xl p-6 shadow-sm space-y-4 overflow-hidden">
              <h3 className="font-serif text-xl font-bold text-brand-text">Platform Core Activity Log</h3>
              <p className="text-xs text-brand-text-soft leading-relaxed font-sans">Diagnosis sirkulasi database logging secara real-time. Memantau setiap tindakan login, registrasi, pembuatan AI Brief, dan pelepasan dana.</p>

              <div className="space-y-3.5 mt-4 max-h-[500px] overflow-y-auto pr-2">
                {logs.map((log) => (
                  <div key={log.id} className="p-3.5 border border-brand-sand/65 rounded-2xl flex items-start gap-3.5 bg-brand-bg/30 text-xs">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold select-none text-[11px] ${
                      log.type === "admin" ? "bg-red-50 text-red-700" :
                      log.type === "umkm" ? "bg-brand-blush text-brand-blush-dark" : "bg-brand-sage text-brand-sage-dark"
                    }`}>
                      {log.type.toUpperCase().slice(0, 2)}
                    </div>

                    <div className="space-y-1 select-text">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-brand-text font-serif">{log.actor}</span>
                        <span className="bg-brand-sand/50 text-[9px] font-bold px-1.5 py-0.5 rounded font-mono uppercase text-brand-text-soft">{log.action}</span>
                        <span className="text-[10px] text-brand-text-light font-mono ml-auto">{new Date(log.date).toLocaleString()}</span>
                      </div>
                      <p className="text-brand-text-soft leading-relaxed font-mono text-[10.5px] bg-brand-white border border-brand-sand/40 p-2 rounded-xl mt-1.5 shadow-inner">
                        {log.details}
                      </p>
                    </div>
                  </div>
                ))}

                {logs.length === 0 && (
                  <div className="text-center py-10 text-brand-text-light text-xs font-sans">
                    Logs kosong. Hubungi backend atau segarkan halaman.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

      </main>

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
