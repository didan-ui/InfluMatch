import React, { useState } from "react";
import { User, UserRole } from "../types";
import { saveDbUser, addDbLog, getDbUsers } from "../utils";
import { motion } from "motion/react";
import { Users, Store, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";

interface RegisterPageProps {
  onRegisterSuccess: () => void;
  onNavigateToLogin: () => void;
  onNavigateToWelcome: () => void;
}

export default function RegisterPage({ onRegisterSuccess, onNavigateToLogin, onNavigateToWelcome }: RegisterPageProps) {
  const [role, setRole] = useState<UserRole>("umkm");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // UMKM specific fields
  const [brandName, setBrandName] = useState("");
  const [brandCategory, setBrandCategory] = useState("Kuliner");

  // Influencer specific fields
  const [handle, setHandle] = useState("");
  const [followers, setFollowers] = useState("5K");
  const [niche, setNiche] = useState<string[]>(["Kuliner"]);
  const [pricePerPost, setPricePerPost] = useState("Rp250.000");

  // Common fields
  const [city, setCity] = useState("Malang");

  const [notification, setNotification] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleNicheToggle = (tag: string) => {
    if (niche.includes(tag)) {
      setNiche(niche.filter(n => n !== tag));
    } else {
      setNiche([...niche, tag]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);

    if (!name || !email || !password) {
      setNotification({ type: 'error', text: "Mohon isi semua data dasar (Nama, Email, dan Sandi)." });
      return;
    }

    if (role === "umkm" && !brandName) {
      setNotification({ type: 'error', text: "Mohon isi Nama Brand UMKM Anda." });
      return;
    }

    if (role === "influencer" && !handle) {
      setNotification({ type: 'error', text: "Mohon masukkan username media sosial Anda." });
      return;
    }

    const users = getDbUsers();
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      setNotification({ type: 'error', text: "Email ini sudah terdaftar. Silakan gunakan email lain." });
      return;
    }

    // Build the user object
    const newUser: User = {
      id: `${role}-${Date.now()}`,
      email,
      name,
      role,
      city,
      isApproved: true, // Auto approved for demo flow ease, but admin can inspect
      avatarUrl: name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    };

    if (role === "umkm") {
      newUser.brandName = brandName;
      newUser.brandCategory = brandCategory;
    } else if (role === "influencer") {
      newUser.handle = handle.startsWith("@") ? handle : `@${handle}`;
      newUser.followers = followers;
      // parse followersNum
      let num = 5000;
      if (followers.includes("K")) {
        num = parseFloat(followers.replace("K", "")) * 1000;
      }
      newUser.followersNum = num;
      newUser.niche = niche;
      newUser.pricePerPost = pricePerPost;
      newUser.engagement = (4 + Math.random() * 6).toFixed(1) + "%";
      newUser.rating = parseFloat((4.5 + Math.random() * 0.5).toFixed(1));
    }

    // Save in storage
    saveDbUser(newUser);
    addDbLog(newUser.name, "Registrasi User", `${newUser.name} melakukan registrasi untuk tipe ${role.toUpperCase()}`, role);

    setNotification({ type: 'success', text: "Registrasi berhasil! Mengalihkan ke laman login..." });
    setTimeout(() => {
      onRegisterSuccess();
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={onNavigateToWelcome}
            className="flex items-center gap-1 px-3 py-1.5 bg-brand-white border border-brand-sand rounded-xl text-xs font-bold text-brand-text hover:bg-brand-bg transition-colors cursor-pointer"
          >
            ← Beranda
          </button>
          
          <button 
            onClick={onNavigateToLogin}
            className="flex items-center gap-1 text-xs font-bold text-brand-text-soft hover:text-brand-blush-dark transition-colors cursor-pointer"
          >
            Masuk <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>

        <div className="text-center">
          <h2 className="font-serif text-4xl text-brand-text tracking-tight font-bold">
            Daftar Akun Baru
          </h2>
          <p className="mt-2 text-sm text-brand-text-soft">
            Gabung ekosistem InfluMatch dan rintis kolaborasi lokal hebat Anda
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-brand-white py-8 px-6 shadow-sm border border-brand-sand/80 rounded-3xl sm:px-10">
          
          {/* Notification Alert */}
          {notification && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 rounded-2xl p-4 text-xs flex items-center gap-2.5 ${
                notification.type === 'success' 
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}
            >
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-red-650" />
              )}
              <span>{notification.text}</span>
            </motion.div>
          )}

          {/* Role Choice Panel */}
          <div className="mb-8">
            <span className="block text-xs font-bold tracking-wider text-brand-text-soft uppercase mb-3 text-center">
              PILIH PERAN UTAMA ANDA
            </span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("umkm")}
                className={`flex items-center justify-center gap-2.5 py-4 border rounded-2xl transition-all cursor-pointer ${
                  role === "umkm"
                    ? "bg-brand-blush/40 border-brand-blush-dark text-brand-text font-bold shadow-sm"
                    : "border-brand-sand hover:bg-brand-bg/50 text-brand-text-soft"
                }`}
              >
                <Store className={`w-5 h-5 ${role === "umkm" ? "text-brand-blush-dark" : "text-brand-text-light"}`} />
                <span className="text-sm">Partner UMKM</span>
              </button>

              <button
                type="button"
                onClick={() => setRole("influencer")}
                className={`flex items-center justify-center gap-2.5 py-4 border rounded-2xl transition-all cursor-pointer ${
                  role === "influencer"
                    ? "bg-brand-sage/40 border-brand-sage-dark text-brand-text font-bold shadow-sm"
                    : "border-brand-sand hover:bg-brand-bg/50 text-brand-text-soft"
                }`}
              >
                <Users className={`w-5 h-5 ${role === "influencer" ? "text-brand-sage-dark" : "text-brand-text-light"}`} />
                <span className="text-sm">Influencer Konten</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Common basic fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold tracking-wider text-brand-text-soft uppercase">
                  Nama Lengkap Anda
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Prasetyo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-2 block w-full rounded-2xl border border-brand-sand px-4 py-2.5 bg-brand-bg/30 text-brand-text text-sm focus:outline-none focus:ring-1 focus:ring-brand-blush-dark/45"
                />
              </div>

              <div>
                <label className="block text-xs font-bold tracking-wider text-brand-text-soft uppercase">
                  Alamat Email Kontak
                </label>
                <input
                  type="email"
                  required
                  placeholder="budi@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 block w-full rounded-2xl border border-brand-sand px-4 py-2.5 bg-brand-bg/30 text-brand-text text-sm focus:outline-none focus:ring-1 focus:ring-brand-blush-dark/45"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold tracking-wider text-brand-text-soft uppercase">
                  Kata Sandi Baru
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-2 block w-full rounded-2xl border border-brand-sand px-4 py-2.5 bg-brand-bg/30 text-brand-text text-sm focus:outline-none focus:ring-1 focus:ring-brand-blush-dark/45"
                />
              </div>

              <div>
                <label className="block text-xs font-bold tracking-wider text-brand-text-soft uppercase">
                  Domisili Kota
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="mt-2 block w-full rounded-2xl border border-brand-sand px-4 py-2.5 bg-brand-bg/30 text-brand-text text-sm focus:outline-none focus:ring-1 focus:ring-brand-blush-dark/45"
                >
                  <option value="Malang">Malang, Jawa Timur</option>
                  <option value="Surabaya">Surabaya, Jawa Timur</option>
                  <option value="Sidoarjo">Sidoarjo, Jawa Timur</option>
                  <option value="Batu">Masyarakat Kota Batu</option>
                </select>
              </div>
            </div>

            <hr className="border-brand-sand/50 my-6" />

            {/* Role-specific fields */}
            {role === "umkm" ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                key="umkm-fields"
                className="space-y-4"
              >
                <h3 className="font-serif text-lg font-bold text-brand-text">Informasi Bisnis UMKM</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold tracking-wider text-brand-text-soft uppercase">
                      Nama Brand Utama
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Ayam Geprek Pak Budi"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      className="mt-2 block w-full rounded-2xl border border-brand-sand px-4 py-2.5 bg-brand-bg/30 text-brand-text text-sm focus:outline-none focus:ring-1"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold tracking-wider text-brand-text-soft uppercase">
                      Kategori Usaha
                    </label>
                    <select
                      value={brandCategory}
                      onChange={(e) => setBrandCategory(e.target.value)}
                      className="mt-2 block w-full rounded-2xl border border-brand-sand px-4 py-2.5 bg-brand-bg/30 text-brand-text text-sm focus:outline-none"
                    >
                      <option value="Kuliner">Kuliner Tradisional / Kontemporer</option>
                      <option value="Fashion">Fashion & Aksesoris Lokal</option>
                      <option value="Kecantikan">美容 Kecantikan & Kosmetik</option>
                      <option value="Lifestyle">Lifestyle, Kafe & Hobi</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                key="influencer-fields"
                className="space-y-4"
              >
                <h3 className="font-serif text-lg font-bold text-brand-text font-serif">Kanal Media Sosial & Tarif</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold tracking-wider text-brand-text-soft uppercase">
                      Username / Handle
                    </label>
                    <input
                      type="text"
                      placeholder="@siskarahayu"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value)}
                      className="mt-2 block w-full rounded-2xl border border-brand-sand px-4 py-2.5 bg-brand-bg/30 text-brand-text text-sm focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold tracking-wider text-brand-text-soft uppercase">
                      Jumlah Followers
                    </label>
                    <select
                      value={followers}
                      onChange={(e) => setFollowers(e.target.value)}
                      className="mt-2 block w-full rounded-2xl border border-brand-sand px-4 py-2.5 bg-brand-bg/30 text-brand-text text-sm focus:outline-none"
                    >
                      <option value="2K">2K – Mini Micro</option>
                      <option value="5K">5K – Micro</option>
                      <option value="10K">10K – Rising Star</option>
                      <option value="25K">25K – Macro Star</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold tracking-wider text-brand-text-soft uppercase">
                      Harga per Postingan
                    </label>
                    <select
                      value={pricePerPost}
                      onChange={(e) => setPricePerPost(e.target.value)}
                      className="mt-2 block w-full rounded-2xl border border-brand-sand px-4 py-2.5 bg-brand-bg/30 text-brand-text text-sm focus:outline-none"
                    >
                      <option value="Rp150.000">Rp150.000 / Post</option>
                      <option value="Rp250.000">Rp250.000 / Post</option>
                      <option value="Rp400.000">Rp400.000 / Post</option>
                      <option value="Rp750.000">Rp750.000 / Post</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold tracking-wider text-brand-text-soft uppercase mb-2">
                    Fokus Niche / Kategori Konten Anda
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["Kuliner", "Fashion", "Lifestyle", "Kecantikan"].map((tag) => {
                      const isActive = niche.includes(tag);
                      return (
                        <button
                          type="button"
                          key={tag}
                          onClick={() => handleNicheToggle(tag)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                            isActive
                              ? "bg-brand-text text-brand-white"
                              : "bg-brand-bg text-brand-text-soft border border-brand-sand/60"
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            <div className="pt-4">
              <button
                type="submit"
                className="w-full flex justify-center items-center gap-2 py-4 px-4 rounded-2xl bg-brand-text text-brand-white font-bold hover:opacity-90 active:scale-[0.99] transition-all text-sm shadow-md cursor-pointer"
              >
                Selesaikan Pendaftaran <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
