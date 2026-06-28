import React, { useState, useEffect } from "react";
import { User, Campaign, EscrowTx, SystemLog } from "../types";
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
} from "../utils";
import { motion } from "motion/react";
import { 
  ShieldCheck, Users, Wallet, FileText, Check, X, 
  AlertTriangle, Hammer, RefreshCw, Trash2, Database, Award, ClipboardList 
} from "lucide-react";

interface AdminDashboardProps {
  currentUser: User;
}

export default function AdminDashboard({ currentUser }: AdminDashboardProps) {
  const [activeSubTab, setActiveSubTab] = useState<"users" | "escrows" | "logs">("users");

  // Database lists
  const [users, setUsers] = useState<User[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [escrows, setEscrows] = useState<EscrowTx[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);

  const forceRefresh = async () => {
    try {
      const [userData, campaignData, escrowData, logData] = await Promise.all([
        getDbUsers(),
        getDbCampaigns(),
        getDbEscrow(),
        getDbLogs(),
      ]);
      setUsers(userData);
      setCampaigns(campaignData);
      setEscrows(escrowData);
      setLogs(logData);
    } catch (error) {
      console.error("Failed to refresh admin dashboard", error);
    }
  };

  useEffect(() => {
    void forceRefresh();
  }, [currentUser]);

  // Handle approving pending user accounts
  const handleApproveUser = async (userId: string, userName: string) => {
    try {
      const allUsers = await getDbUsers();
      const user = allUsers.find(u => u.id === userId);
      if (user) {
        user.is_approved = true;
        user.isApproved = true;
        await saveDbUser(user);
        await addDbLog(currentUser.name, "Persetujuan User", `Admin Utama menyetujui akun ${userName}`, "admin");
        await forceRefresh();
        alert(`User ${userName} berhasil disetujui untuk go-live di InfluMatch.`);
      }
    } catch (error) {
      console.error("Failed to approve user", error);
    }
  };

  // Handle deleting/suspending user accounts
  const handleRejectUser = async (userId: string, userName: string) => {
    try {
      const allUsers = await getDbUsers();
      const target = allUsers.find(u => u.id === userId);
      if (target) {
        await saveDbUser({ ...target, is_approved: false, isApproved: false });
      }
      await addDbLog(currentUser.name, "Penolakan User", `Admin menolak/menghapus akun ${userName}`, "admin");
      await forceRefresh();
      alert(`Akun ${userName} ditolak & dihapus.`);
    } catch (error) {
      console.error("Failed to reject user", error);
    }
  };

  // Handle forcing release of escrow in dispute scenario
  const handleAdminForceRelease = async (txId: string) => {
    try {
      const allEscrows = await getDbEscrow();
      const tx = allEscrows.find(e => e.id === txId);
      if (tx) {
        const updatedTx = { ...tx, status: "released" as const };
        await saveDbEscrow(updatedTx);

        const allCampaigns = await getDbCampaigns();
        const camp = allCampaigns.find(c => c.id === (tx.campaign_id ?? tx.campaignId));
        if (camp) {
          const influencers = camp.influencers || [];
          const infCandidate = influencers.find(i => (i.influencer_id ?? i.influencerId) === (tx.influencer_id ?? tx.influencerId));
          if (infCandidate) {
            infCandidate.status = "completed";
            infCandidate.escrowReleased = true;
            infCandidate.escrow_released = true;
          }
          if (influencers.every(i => i.status === "completed")) {
            camp.status = "completed";
          }
          await saveDbCampaign(camp);
        }

        await addDbLog(currentUser.name, "Bantuan Dana Selesai", `Admin Utama membantu mengirimkan dana pembayaran sebesar Rp${tx.amount.toLocaleString()} ke influencer ${tx.influencer_name ?? tx.influencerName}`, "admin");
        await forceRefresh();
        alert("Penyelesaian Selesai! Pembayaran berhasil diteruskan langsung ke influencer.");
      }
    } catch (error) {
      console.error("Failed to force release", error);
    }
  };

  // Reset database back to default seed for testing
  const handleResetDb = async () => {
    if (window.confirm("Apakah Anda yakin ingin memulihkan data aplikasi?")) {
      try {
        await resetDatabase();
        await forceRefresh();
        await addDbLog(currentUser.name, "Reset Database", "Memulihkan data system seed bawaan", "admin");
        alert("Database platform berhasil dipulihkan.");
      } catch (error) {
        console.error("Failed to reset database", error);
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

        {/* Database diagnostic panel */}
        <div className="mt-12 px-4 pt-6 border-t border-brand-sand/65 space-y-3">
          <p className="px-3 text-[10px] font-bold text-brand-text-light uppercase select-none tracking-wider">DIAGNOSTIK TEKNIS</p>
          
          <button
            onClick={handleResetDb}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 text-red-700 bg-red-50/40 hover:bg-red-50 text-[11px] font-bold transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4" /> Reset DB Platform
          </button>
        </div>
      </aside>

      {/* ADMIN CONTENT BODY */}
      <main className="flex-1 p-6 lg:p-10 max-w-7xl space-y-6">
        
        {/* Bento Grid Header Layout */}
        <div className="grid grid-cols-12 gap-5">
          
          {/* Bento Hero - Admin Lavender Pastel Insight Box */}
          <div className="col-span-12 lg:col-span-8 bg-brand-lav text-brand-text rounded-4xl p-8 relative overflow-hidden flex flex-col justify-between shadow-xs border border-brand-sand min-h-62.5">
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
          <div className="col-span-12 lg:col-span-4 bg-brand-blush border border-brand-sand rounded-4xl p-6 flex flex-col justify-between shadow-xs">
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
                            u.isApproved ? "bg-brand-sage text-brand-sage-dark" : "bg-yellow-105 bg-[#FDF2CB] text-[#907010]"
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
                            ex.status === "locked" ? "bg-[#FFF0F0] text-red-700 border border-red-250/20" : "bg-brand-sky text-brand-sky-dark font-sans"
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
          </motion.div>
        )}

        {activeSubTab === "logs" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            
            {/* Raw activity logs display */}
            <div className="bg-brand-white border border-brand-sand rounded-3xl p-6 shadow-sm space-y-4 overflow-hidden">
              <h3 className="font-serif text-xl font-bold text-brand-text">Platform Core Activity Log</h3>
              <p className="text-xs text-brand-text-soft leading-relaxed font-sans">Diagnosis sirkulasi database logging secara real-time. Memantau setiap tindakan login, registrasi, pembuatan AI Brief, dan pelepasan dana.</p>

              <div className="space-y-3.5 mt-4 max-h-125 overflow-y-auto pr-2">
                {logs.map((log) => (
                  <div key={log.id} className="p-3.5 border border-brand-sand/65 rounded-2xl flex items-start gap-3.5 bg-brand-bg/30 text-xs">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold select-none text-[11px] ${
                      (log.type ?? "admin") === "admin" ? "bg-red-50 text-red-700" :
                      (log.type ?? "admin") === "umkm" ? "bg-brand-blush text-brand-blush-dark" : "bg-brand-sage text-brand-sage-dark"
                    }`}>
                      {(log.type ?? "admin").toUpperCase().slice(0, 2)}
                    </div>

                    <div className="space-y-1 select-text">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-brand-text font-serif">{log.actor}</span>
                        <span className="bg-brand-sand/50 text-[9px] font-bold px-1.5 py-0.5 rounded font-mono uppercase text-brand-text-soft">{log.action}</span>
                        <span className="text-[10px] text-brand-text-light font-mono ml-auto">{new Date(log.date ?? log.created_at).toLocaleString()}</span>
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

    </div>
  );
}
