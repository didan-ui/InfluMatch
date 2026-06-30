import React, { useState, useEffect } from "react";
import { User, Campaign, EscrowTx, SystemLog, WithdrawalTx, Report } from "../types";
import { 
  getDbUsers, 
  getDbCampaigns, 
  getDbEscrow, 
  getDbLogs, 
  saveDbUser, 
  saveDbEscrow, 
  saveDbCampaign, 
  addDbLog,
  resetDatabase,
  db
} from "../utils";
import { motion } from "motion/react";
import { 
  ShieldCheck, Users, Wallet, FileText, Check, X, 
  AlertTriangle, Hammer, RefreshCw, Trash2, Database, Award, ClipboardList, Search,
  MapPin, ExternalLink, ShieldAlert
} from "lucide-react";

interface AdminDashboardProps {
  currentUser: User;
}

export default function AdminDashboard({ currentUser }: AdminDashboardProps) {
  const [activeSubTab, setActiveSubTab] = useState<"users" | "campaigns" | "escrows" | "logs" | "reports">("users");

  // Database lists
  const [users, setUsers] = useState<User[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [escrows, setEscrows] = useState<EscrowTx[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalTx[]>([]);
  const [reports, setReports] = useState<Report[]>([]);

  // Report resolution modal states
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [investigationNotes, setInvestigationNotes] = useState("");
  const [sanctionType, setSanctionType] = useState<'none' | 'warning' | 'suspend' | 'ban'>('none');
  const [suspendReason, setSuspendReason] = useState("");

  // Campaigns monitoring search and status filters
  const [campSearch, setCampSearch] = useState("");
  const [campFilterStatus, setCampFilterStatus] = useState("all");
  const [campFilterCategory, setCampFilterCategory] = useState("");

  const forceRefresh = () => {
    setUsers(getDbUsers());
    setCampaigns(getDbCampaigns());
    setEscrows(getDbEscrow());
    setLogs(getDbLogs());
    setWithdrawals(db.withdrawals.list());
    setReports(db.reports.list());
  };

  useEffect(() => {
    forceRefresh();
  }, [currentUser]);

  // Handle approving pending user accounts
  const handleApproveUser = (userId: string, userName: string) => {
    const allUsers = getDbUsers();
    const user = allUsers.find(u => u.id === userId);
    if (user) {
      user.isApproved = true;
      saveDbUser(user);
      addDbLog(currentUser.name, "Persetujuan User", `Admin Utama menyetujui akun ${userName}`, "admin");
      forceRefresh();
      alert(`User ${userName} berhasil disetujui untuk go-live di InfluMatch.`);
    }
  };

  const handleApproveWithdrawal = (wId: string) => {
    const updated = db.withdrawals.update(wId, { status: "completed" });
    if (updated) {
      addDbLog("Admin", "Persetujuan Tarik Dana", `Mentransfer Rp${updated.amount.toLocaleString()} ke rekening ${updated.bankName} (${updated.influencerName})`, "admin");
      forceRefresh();
      alert(`Pencairan dana ${updated.influencerName} sebesar Rp${updated.amount.toLocaleString()} telah berhasil disetujui dan ditransfer.`);
    }
  };

  const handleRejectWithdrawal = (wId: string) => {
    const reason = window.prompt("Masukkan alasan penolakan pencairan dana:");
    if (reason === null) return; // user cancelled
    const updated = db.withdrawals.update(wId, { status: "rejected", reason: reason || "Data rekening tidak valid" } as any);
    if (updated) {
      addDbLog("Admin", "Penolakan Tarik Dana", `Menolak pengajuan pencairan dana Rp${updated.amount.toLocaleString()} milik ${updated.influencerName}. Alasan: ${reason || "Data rekening tidak valid"}`, "admin");
      forceRefresh();
      alert(`Pencairan dana ${updated.influencerName} ditolak. Alasan: ${reason || "Data rekening tidak valid"}`);
    }
  };

  // Handle deleting/suspending user accounts
  const handleRejectUser = (userId: string, userName: string) => {
    db.users.delete(userId);
    addDbLog(currentUser.name, "Penolakan User", `Admin menolak/menghapus akun ${userName}`, "admin");
    forceRefresh();
    alert(`Akun ${userName} ditolak & dihapus.`);
  };

  // Sanksi & Pemblokiran Pengguna
  const handleSuspendUser = (userId: string, userName: string, reason: string) => {
    const freshUser = db.users.find(userId);
    if (freshUser) {
      db.users.update(userId, { status: "suspended", statusReason: reason });
      addDbLog(currentUser.name, "Sanksi Suspend", `Membekukan sementara akun ${userName}. Alasan: ${reason}`, "admin");
      forceRefresh();
      alert(`Akun ${userName} berhasil DITANGGUHKAN sementara.`);
    }
  };

  const handleBanUser = (userId: string, userName: string) => {
    const freshUser = db.users.find(userId);
    if (freshUser) {
      db.users.update(userId, { status: "banned", statusReason: "Pelanggaran berat regulasi platform." });
      addDbLog(currentUser.name, "Sanksi Banned", `Memblokir permanen akun ${userName}`, "admin");
      forceRefresh();
      alert(`Akun ${userName} berhasil DIBLOKIR secara permanen.`);
    }
  };

  const handleRestoreUser = (userId: string, userName: string) => {
    const freshUser = db.users.find(userId);
    if (freshUser) {
      db.users.update(userId, { status: "active", statusReason: "" });
      addDbLog(currentUser.name, "Unban Pengguna", `Mengaktifkan kembali akun ${userName}`, "admin");
      forceRefresh();
      alert(`Akun ${userName} berhasil diaktifkan kembali.`);
    }
  };

  const handleWarnUser = (userId: string, userName: string) => {
    const reason = window.prompt(`Masukkan alasan Peringatan (Warning) untuk ${userName}:`);
    if (reason === null) return;
    const freshUser = db.users.find(userId);
    if (freshUser) {
      const nextCount = (freshUser.warningsCount || 0) + 1;
      db.users.update(userId, { warningsCount: nextCount });
      addDbLog(currentUser.name, "Sanksi Peringatan", `Memberikan peringatan ke-${nextCount} kepada ${userName}. Alasan: ${reason || "Pelanggaran ringan"}`, "admin");
      forceRefresh();
      alert(`Peringatan ke-${nextCount} berhasil dikirim kepada ${userName}.`);
    }
  };

  // Handle forcing release of escrow in dispute scenario
  const handleAdminForceRelease = (txId: string) => {
    const allEscrows = getDbEscrow();
    const tx = allEscrows.find(e => e.id === txId);
    if (tx) {
      tx.status = "released";
      saveDbEscrow(tx);

      // set campaign status in db
      const allCampaigns = getDbCampaigns();
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
        saveDbCampaign(camp);
      }

      addDbLog(currentUser.name, "Bantuan Dana Selesai", `Admin Utama membantu mengirimkan dana pembayaran sebesar Rp${tx.amount.toLocaleString()} ke influencer ${tx.influencerName}`, "admin");
      forceRefresh();
      alert("Penyelesaian Selesai! Pembayaran berhasil diteruskan langsung ke influencer.");
    }
  };

  // Handle cancelling a campaign
  const handleCancelCampaign = (campaignId: string, campaignName: string) => {
    if (window.confirm(`Apakah Anda yakin ingin membatalkan/menghapus tawaran kampanye "${campaignName}"?`)) {
      const allCampaigns = getDbCampaigns();
      const camp = allCampaigns.find(c => c.id === campaignId);
      if (camp) {
        camp.status = "cancelled";
        saveDbCampaign(camp);
        addDbLog(currentUser.name, "Membatalkan Kampanye", `Admin membatalkan kampanye "${campaignName}"`, "admin");
        forceRefresh();
        alert(`Kampanye "${campaignName}" berhasil dibatalkan.`);
      }
    }
  };

  // Reset database back to default seed for testing
  const handleResetDb = () => {
    if (window.confirm("Apakah Anda yakin ingin memulihkan database lokal ke data bawaan awal? Semua campaign dan user baru akan terhapus.")) {
      resetDatabase();
      forceRefresh();
      addDbLog(currentUser.name, "Reset Database", "Memulihkan data system seed bawaan", "admin");
      alert("Database platform berhasil dipulihkan.");
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
            { id: "reports", label: "Kelola Laporan", icon: ShieldAlert, badge: reports.filter(r => r.status === 'pending').length },
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
                  <Icon className={`w-4 h-4 shrink-0 ${isSubActive ? 'text-red-650' : 'text-brand-text-light'}`} />
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
            <div className="relative z-10-lav">
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
                        <td className="py-3.5 px-4 font-bold">
                          <div className="flex items-center gap-2.5">
                            {u.avatarUrl && (u.avatarUrl.startsWith("http") || u.avatarUrl.startsWith("/") || u.avatarUrl.startsWith("data:")) ? (
                              <img 
                                src={u.avatarUrl} 
                                alt={u.name} 
                                className="w-8 h-8 rounded-full object-cover border border-brand-sand shadow-xs shrink-0" 
                                referrerPolicy="no-referrer" 
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-brand-bg text-brand-text-soft flex items-center justify-center font-bold text-[10px] border border-brand-sand shrink-0">
                                {u.name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <span>{u.name}</span>
                              <br />
                              <span className="text-[10px] text-brand-text-light font-normal">{u.email}</span>
                            </div>
                          </div>
                        </td>
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
                          <div className="flex flex-col gap-1">
                            <span className={`px-2.5 py-0.5 rounded-full font-mono font-bold uppercase text-[9px] w-fit ${
                              u.status === "banned" ? "bg-red-100 text-red-800" :
                              u.status === "suspended" ? "bg-orange-100 text-orange-800" :
                              u.isApproved ? "bg-brand-sage text-brand-sage-dark" : "bg-yellow-105 bg-[#FDF2CB] text-[#907010]"
                            }`}>
                              {u.status === "banned" ? "DIBLOKIR" :
                               u.status === "suspended" ? "DITANGGUHKAN" :
                               u.isApproved ? "Aktif" : "Menunggu Approval"}
                            </span>
                            {u.warningsCount !== undefined && u.warningsCount > 0 && (
                              <span className="text-[10px] text-orange-700 font-bold font-mono">
                                ⚠️ Warning: {u.warningsCount}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right flex flex-wrap gap-1.5 justify-end items-center">
                          {!u.isApproved && (
                            <button
                              onClick={() => handleApproveUser(u.id, u.name)}
                              className="px-2 py-1 bg-brand-text text-brand-white font-bold rounded-lg hover:opacity-90 transition-all text-[10px] flex items-center gap-0.5 cursor-pointer"
                            >
                              <Check className="w-3 h-3 text-brand-sage-dark" /> Setujui
                            </button>
                          )}
                          {u.id !== currentUser.id && (
                            <>
                              {u.status === "suspended" || u.status === "banned" ? (
                                <button
                                  onClick={() => handleRestoreUser(u.id, u.name)}
                                  className="px-2 py-1 bg-brand-sage text-brand-sage-dark hover:opacity-95 font-bold rounded-lg transition-all text-[10px] cursor-pointer"
                                >
                                  Aktifkan Kembali
                                </button>
                              ) : (
                                <div className="flex gap-1.5 flex-wrap">
                                  <button
                                    onClick={() => handleWarnUser(u.id, u.name)}
                                    className="px-2 py-1 bg-yellow-100 text-[#907010] hover:bg-yellow-200 font-bold rounded-lg transition-all text-[10px] cursor-pointer"
                                  >
                                    Beri Warning
                                  </button>
                                  <button
                                    onClick={() => {
                                      const reason = window.prompt(`Masukkan alasan suspend untuk ${u.name}:`);
                                      if (reason !== null) {
                                        handleSuspendUser(u.id, u.name, reason || "Pelanggaran pedoman komunitas");
                                      }
                                    }}
                                    className="px-2 py-1 bg-orange-100 text-orange-700 hover:bg-orange-200 font-bold rounded-lg transition-all text-[10px] cursor-pointer"
                                  >
                                    Suspend
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (window.confirm(`Yakin ingin memblokir permanen (Ban) ${u.name}?`)) {
                                        handleBanUser(u.id, u.name);
                                      }
                                    }}
                                    className="px-2 py-1 bg-red-100 text-red-700 hover:bg-red-200 font-bold rounded-lg transition-all text-[10px] cursor-pointer"
                                  >
                                    Ban
                                  </button>
                                </div>
                              )}
                              <button
                                onClick={() => handleRejectUser(u.id, u.name)}
                                className="px-2 py-1 border border-brand-sand text-brand-text-soft hover:bg-brand-bg rounded-lg transition-all text-[10px] cursor-pointer"
                              >
                                Hapus
                              </button>
                            </>
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
                        <td className="py-3.5 px-4 font-mono font-bold text-brand-sage-dark border-b-grey">Rp{ex.amount.toLocaleString()}</td>
                        <td className="py-3.5 px-4 font-mono text-brand-text mb-0.5">{ex.date}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full font-mono font-bold uppercase text-[9px] tracking-wide ${
                            ex.status === "released" ? "bg-brand-sage text-brand-sage-dark font-sans font-bold" :
                            ex.status === "locked" ? "bg-red-50 text-red-700 bg-[#FFF0F0] border border-red-250/20" : "bg-brand-sky text-brand-sky-dark font-sans"
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
                    {withdrawals.map(w => (
                      <tr key={w.id} className="hover:bg-brand-bg/10">
                        <td className="py-3.5 px-4 font-bold">{w.influencerName}</td>
                        <td className="py-3.5 px-4 text-brand-text-soft font-bold">{w.bankName}</td>
                        <td className="py-3.5 px-4 font-mono">{w.accountNo}</td>
                        <td className="py-3.5 px-4 font-medium">{w.accountHolder}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-brand-sage-dark">Rp{w.amount.toLocaleString()}</td>
                        <td className="py-3.5 px-4 font-mono">{w.date}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full font-mono font-bold uppercase text-[9px] tracking-wide ${
                            w.status === "completed" ? "bg-brand-sage text-brand-sage-dark font-sans font-bold" :
                            w.status === "rejected" ? "bg-red-50 text-red-700 bg-[#FFF0F0] border border-red-250/20" : "bg-brand-sky text-brand-sky-dark font-sans"
                          }`}>
                            {w.status === "completed" ? "Selesai" : w.status === "rejected" ? "Ditolak" : "Tertunda"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          {w.status === "pending" ? (
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
                    {withdrawals.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-10 text-center text-brand-text-soft">Tidak ada pengajuan penarikan dana saat ini.</td>
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

        {activeSubTab === "reports" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 animate-fadeIn">
            <div className="bg-brand-white border border-brand-sand rounded-3xl p-6 shadow-sm overflow-hidden space-y-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-brand-text">Manajemen Laporan Pengguna</h3>
                <p className="text-xs text-brand-text-soft leading-relaxed">Tinjau laporan pelanggaran yang diajukan oleh UMKM maupun Influencer terhadap aktivitas mencurigakan atau wanprestasi.</p>
              </div>

              <div className="overflow-x-auto pt-2">
                <table className="w-full text-left text-xs text-brand-text select-text">
                  <thead className="bg-brand-bg text-brand-text-soft uppercase tracking-wider font-bold">
                    <tr>
                      <th className="py-3 px-4 border-b border-brand-sand">PELAPOR</th>
                      <th className="py-3 px-4 border-b border-brand-sand">TERLAPOR</th>
                      <th className="py-3 px-4 border-b border-brand-sand">ALASAN</th>
                      <th className="py-3 px-4 border-b border-brand-sand">DESKRIPSI</th>
                      <th className="py-3 px-4 border-b border-brand-sand">TANGGAL</th>
                      <th className="py-3 px-4 border-b border-brand-sand">STATUS</th>
                      <th className="py-3 px-4 border-b border-brand-sand text-right">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-sand/50">
                    {reports.map(r => (
                      <tr key={r.id} className="hover:bg-brand-bg/10">
                        <td className="py-3.5 px-4 font-bold">
                          <div>
                            <span>{r.reporterName}</span>
                            <span className="text-[9px] block text-brand-text-light uppercase font-mono">{r.reporterRole}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-red-750">
                          <div>
                            <span>{r.reportedName}</span>
                            <span className="text-[9px] block text-brand-text-light uppercase font-mono">{r.reportedRole}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-medium">{r.reason}</td>
                        <td className="py-3.5 px-4 text-brand-text-soft truncate max-w-xs">{r.description}</td>
                        <td className="py-3.5 px-4 font-mono">{new Date(r.createdAt).toLocaleDateString("id-ID", { hour: "2-digit", minute: "2-digit" })}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full font-mono font-bold uppercase text-[9px] ${
                            r.status === 'resolved' ? 'bg-brand-sage text-brand-sage-dark' :
                            r.status === 'under_review' ? 'bg-amber-100 text-amber-800' :
                            r.status === 'rejected' ? 'bg-red-50 text-red-700 bg-red-100/60' : 'bg-brand-sky text-brand-sky-dark'
                          }`}>
                            {r.status === 'resolved' ? 'Selesai' :
                             r.status === 'under_review' ? 'Diproses' :
                             r.status === 'rejected' ? 'Ditolak' : 'Pending'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedReport(r);
                              setInvestigationNotes(r.notes || "");
                              setSanctionType(r.sanctionType || "none");
                              setSuspendReason("");
                            }}
                            className="px-3 py-1.5 bg-brand-text text-brand-white font-bold rounded-lg hover:opacity-95 text-[11px] cursor-pointer"
                          >
                            Tinjau Laporan
                          </button>
                        </td>
                      </tr>
                    ))}
                    {reports.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-brand-text-soft">Tidak ada laporan yang masuk saat ini.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
                      {/* Selected Report Detail & Investigation Modal */}
            {selectedReport && (() => {
              const reportedUser = db.users.find(selectedReport.reportedId);
              const isSuspended = reportedUser?.status === "suspended";
              const isBanned = reportedUser?.status === "banned";
              const userStatusLabel = isBanned ? "DIBLOKIR PERMANEN" : isSuspended ? "DITANGGUHKAN" : "AKTIF / NORMAL";
              const userStatusColor = isBanned ? "bg-red-100 text-red-800 border-red-200" : isSuspended ? "bg-orange-100 text-orange-800 border-orange-200" : "bg-emerald-100 text-emerald-800 border-emerald-200";

              return (
                <div className="fixed inset-0 bg-brand-text/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn select-none">
                  <div className="bg-brand-white border border-brand-sand rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between border-b border-brand-sand pb-3">
                      <div>
                        <h4 className="font-serif text-lg font-bold text-brand-text">Review Laporan #{selectedReport.id}</h4>
                        <p className="text-[10px] text-brand-text-soft mt-0.5">Sistem Laporan Cepat & Solusi Instan Satu Klik</p>
                      </div>
                      <button 
                        onClick={() => setSelectedReport(null)}
                        className="text-brand-text-soft hover:text-brand-text text-lg cursor-pointer font-bold w-8 h-8 rounded-full hover:bg-brand-bg flex items-center justify-center transition-colors"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                      {/* Left Side: Case Details */}
                      <div className="space-y-4">
                        <div className="bg-brand-bg/40 p-4 rounded-2xl border border-brand-sand/30 space-y-3">
                          <h5 className="font-bold text-brand-text text-xs border-b border-brand-sand/40 pb-1.5 uppercase tracking-wider">Informasi Pihak</h5>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <p className="text-[9px] font-bold text-brand-text-light uppercase tracking-wider">Pelapor</p>
                              <p className="font-bold text-brand-text mt-0.5">{selectedReport.reporterName}</p>
                              <p className="text-[9px] text-brand-text-soft uppercase font-mono mt-0.5">{selectedReport.reporterRole}</p>
                            </div>
                            <div>
                              <p className="text-[9px] font-bold text-brand-text-light uppercase tracking-wider">Terlapor</p>
                              <p className="font-bold text-red-650 mt-0.5">{selectedReport.reportedName}</p>
                              <p className="text-[9px] text-brand-text-soft uppercase font-mono mt-0.5">{selectedReport.reportedRole}</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <p className="font-bold text-brand-text-light uppercase tracking-wider text-[9px]">Alasan Utama</p>
                            <p className="font-semibold text-brand-text bg-brand-bg/50 px-3 py-2 rounded-xl mt-1">{selectedReport.reason}</p>
                          </div>

                          <div>
                            <p className="font-bold text-brand-text-light uppercase tracking-wider text-[9px]">Kronologi Kejadian</p>
                            <div className="bg-brand-bg/50 px-3 py-2 rounded-xl text-brand-text whitespace-pre-wrap mt-1 border border-brand-sand/10 max-h-36 overflow-y-auto leading-relaxed">{selectedReport.description}</div>
                          </div>

                          {selectedReport.evidenceUrl && (
                            <div>
                              <p className="font-bold text-brand-text-light uppercase tracking-wider text-[9px] mb-1">Bukti Pendukung</p>
                              <div className="border border-brand-sand/40 rounded-2xl overflow-hidden bg-brand-bg/10 p-2 max-w-xs">
                                {selectedReport.evidenceUrl.startsWith("data:image") || selectedReport.evidenceUrl.startsWith("http") ? (
                                  <img 
                                    src={selectedReport.evidenceUrl} 
                                    alt="Bukti Laporan" 
                                    className="max-h-32 rounded-xl object-contain mx-auto" 
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <a 
                                    href={selectedReport.evidenceUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-brand-blush-dark hover:underline font-bold flex items-center justify-center gap-1 p-2"
                                  >
                                    📎 Buka Dokumen Bukti
                                  </a>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Side: Instant Actions */}
                      <div className="space-y-4 flex flex-col justify-between">
                        <div className="space-y-4">
                          {/* User Moderation Quick Panel */}
                          <div className="bg-brand-bg/40 p-4 rounded-2xl border border-brand-sand/30 space-y-3">
                            <div className="flex items-center justify-between border-b border-brand-sand/40 pb-2">
                              <h5 className="font-bold text-brand-text text-xs uppercase tracking-wider">Status Terlapor</h5>
                              <span className={`px-2 py-0.5 rounded-full font-mono font-bold uppercase text-[8px] border ${userStatusColor}`}>
                                {userStatusLabel}
                              </span>
                            </div>
                            
                            {reportedUser?.statusReason && (
                              <div className="bg-orange-50 border border-orange-100 p-2 rounded-xl text-[10px] text-orange-850 leading-relaxed font-medium">
                                <span className="font-bold">Alasan Sanksi Aktif:</span> {reportedUser.statusReason}
                              </div>
                            )}

                            <div className="space-y-2">
                              {/* If user is suspended or banned, show Unfreeze action */}
                              {isSuspended || isBanned ? (
                                <div className="space-y-2 p-1 bg-brand-white rounded-xl border border-brand-sand/20 text-center">
                                  <p className="text-[10px] text-brand-text-soft font-medium p-1">Akun terlapor sedang dibekukan/diblokir. Anda dapat memulihkannya dalam 1 klik.</p>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (window.confirm(`Aktifkan kembali akun ${selectedReport.reportedName}?`)) {
                                        db.users.update(selectedReport.reportedId, { status: "active", statusReason: "" });
                                        db.reports.update(selectedReport.id, { status: "resolved", notes: investigationNotes || "Akun diaktifkan kembali oleh admin." });
                                        addDbLog(currentUser.name, "Unban Pengguna", `Mengaktifkan kembali akun ${selectedReport.reportedName} melalui Laporan #${selectedReport.id}`, "admin");
                                        alert(`Akun ${selectedReport.reportedName} berhasil diaktifkan kembali.`);
                                        setSelectedReport(null);
                                        forceRefresh();
                                      }
                                    }}
                                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-brand-white font-bold rounded-xl transition-all shadow-sm text-xs cursor-pointer flex items-center justify-center gap-1.5"
                                  >
                                    🟢 Batalkan Pembekuan (Aktifkan Kembali)
                                  </button>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <p className="text-[9px] font-bold text-brand-text-light uppercase tracking-wider">Tindakan Sanksi Cepat (Satu Klik):</p>
                                  <div className="grid grid-cols-1 gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const note = investigationNotes || `Pelanggaran ringan terkait Laporan #${selectedReport.id}`;
                                        const nextCount = (reportedUser?.warningsCount || 0) + 1;
                                        db.users.update(selectedReport.reportedId, { warningsCount: nextCount });
                                        db.reports.update(selectedReport.id, { status: "resolved", notes: investigationNotes || "Diberikan peringatan." });
                                        addDbLog(currentUser.name, "Sanksi Peringatan", `Memberikan peringatan ke-${nextCount} kepada ${selectedReport.reportedName} atas laporan #${selectedReport.id}`, "admin");
                                        alert(`Peringatan ke-${nextCount} sukses dikirim ke ${selectedReport.reportedName}. Laporan ditandai selesai.`);
                                        setSelectedReport(null);
                                        forceRefresh();
                                      }}
                                      className="py-2 px-3 bg-yellow-100 hover:bg-yellow-200 text-[#907010] font-bold rounded-xl transition-all text-left text-xs cursor-pointer flex items-center gap-2"
                                    >
                                      <span>⚠️</span>
                                      <div className="text-left">
                                        <p className="leading-none">Peringatkan (+1 Warning)</p>
                                        <p className="text-[9px] font-normal text-brand-text-soft mt-0.5">Beri surat peringatan platform.</p>
                                      </div>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        const duration = window.prompt(`Durasi / Alasan Pembekuan akun ${selectedReport.reportedName}:`, `Pembekuan akibat Laporan #${selectedReport.id}: ${selectedReport.reason}`);
                                        if (duration === null) return;
                                        db.users.update(selectedReport.reportedId, { status: "suspended", statusReason: duration || "Wanprestasi campaign" });
                                        db.reports.update(selectedReport.id, { status: "resolved", notes: investigationNotes || duration });
                                        addDbLog(currentUser.name, "Sanksi Suspend", `Membekukan sementara akun ${selectedReport.reportedName}. Alasan: ${duration}`, "admin");
                                        alert(`Akun ${selectedReport.reportedName} berhasil ditangguhkan.`);
                                        setSelectedReport(null);
                                        forceRefresh();
                                      }}
                                      className="py-2 px-3 bg-orange-100 hover:bg-orange-200 text-orange-850 font-bold rounded-xl transition-all text-left text-xs cursor-pointer flex items-center gap-2"
                                    >
                                      <span>❄️</span>
                                      <div className="text-left">
                                        <p className="leading-none">Bekukan Akun (Suspend)</p>
                                        <p className="text-[9px] font-normal text-brand-text-soft mt-0.5">Tangguhkan akses untuk investigasi.</p>
                                      </div>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (window.confirm(`Apakah Anda yakin ingin memblokir permanen akun ${selectedReport.reportedName}? Tindakan ini tidak dapat dibatalkan.`)) {
                                          db.users.update(selectedReport.reportedId, { status: "banned", statusReason: investigationNotes || `Pelanggaran berat laporan #${selectedReport.id}` });
                                          db.reports.update(selectedReport.id, { status: "resolved", notes: investigationNotes || "Banned permanen" });
                                          addDbLog(currentUser.name, "Sanksi Banned", `Memblokir permanen akun ${selectedReport.reportedName}`, "admin");
                                          alert(`Akun ${selectedReport.reportedName} telah diblokir permanen.`);
                                          setSelectedReport(null);
                                          forceRefresh();
                                        }
                                      }}
                                      className="py-2 px-3 bg-red-100 hover:bg-red-200 text-red-800 font-bold rounded-xl transition-all text-left text-xs cursor-pointer flex items-center gap-2"
                                    >
                                      <span>🚫</span>
                                      <div className="text-left">
                                        <p className="leading-none">Blokir Platform (Ban)</p>
                                        <p className="text-[9px] font-normal text-brand-text-soft mt-0.5">Blokir permanen seluruh akses akun.</p>
                                      </div>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Report Status Quick Action Panel */}
                          <div className="space-y-2">
                            <p className="font-bold text-brand-text-light uppercase tracking-wider text-[9px]">Ubah Status Laporan Saja:</p>
                            <div className="grid grid-cols-3 gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = db.reports.update(selectedReport.id, { status: "under_review", notes: investigationNotes });
                                  if (updated) setSelectedReport(updated);
                                  forceRefresh();
                                  alert(`Status laporan diubah menjadi Diproses.`);
                                }}
                                className={`py-2 px-1 rounded-xl font-bold transition-all text-center text-[10px] cursor-pointer ${
                                  selectedReport.status === 'under_review' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-brand-bg text-brand-text-soft hover:bg-brand-bg/80'
                                }`}
                              >
                                ⏳ Proses (Review)
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  db.reports.update(selectedReport.id, { status: "rejected", notes: investigationNotes || "Ditolak oleh admin." });
                                  addDbLog(currentUser.name, "Investigasi Laporan", `Menolak Laporan #${selectedReport.id}. Catatan: ${investigationNotes}`, "admin");
                                  alert(`Laporan #${selectedReport.id} berhasil Ditolak.`);
                                  setSelectedReport(null);
                                  forceRefresh();
                                }}
                                className={`py-2 px-1 rounded-xl font-bold transition-all text-center text-[10px] cursor-pointer ${
                                  selectedReport.status === 'rejected' ? 'bg-red-100 text-red-800 border border-red-300' : 'bg-brand-bg text-brand-text-soft hover:bg-brand-bg/80'
                                }`}
                              >
                                ✕ Tolak Laporan
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  db.reports.update(selectedReport.id, { status: "resolved", notes: investigationNotes || "Selesai tanpa sanksi." });
                                  addDbLog(currentUser.name, "Investigasi Laporan", `Menyelesaikan Laporan #${selectedReport.id} tanpa sanksi. Catatan: ${investigationNotes}`, "admin");
                                  alert(`Laporan #${selectedReport.id} berhasil ditandai Selesai.`);
                                  setSelectedReport(null);
                                  forceRefresh();
                                }}
                                className={`py-2 px-1 rounded-xl font-bold transition-all text-center text-[10px] cursor-pointer ${
                                  selectedReport.status === 'resolved' ? 'bg-brand-sage text-brand-sage-dark border border-brand-sand' : 'bg-brand-bg text-brand-text-soft hover:bg-brand-bg/80'
                                }`}
                              >
                                ✓ Selesaikan
                              </button>
                            </div>
                          </div>

                          {/* Notes Textarea */}
                          <div>
                            <label className="block text-[9px] font-bold text-brand-text-light uppercase tracking-wider mb-1">Catatan Investigasi / Tanggapan Tambahan (Opsional)</label>
                            <textarea
                              value={investigationNotes}
                              onChange={(e) => setInvestigationNotes(e.target.value)}
                              placeholder="Ketik catatan di sini sebelum memilih aksi cepat..."
                              rows={2}
                              className="w-full bg-brand-bg border border-brand-sand rounded-xl p-2.5 text-xs text-brand-text outline-none focus:border-brand-text"
                            />
                          </div>
                        </div>

                        <div className="pt-3 border-t border-brand-sand/40">
                          <button
                            onClick={() => setSelectedReport(null)}
                            className="w-full py-2.5 border border-brand-sand rounded-xl text-xs font-bold text-brand-text-soft hover:bg-brand-bg transition-all cursor-pointer text-center"
                          >
                            Tutup Jendela
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}

      </main>

    </div>
  );
}
