import React, { useState } from "react";
import { User } from "../types";
import { getDbUsers, addDbLog, hashPassword } from "../utils";
import { motion } from "motion/react";
import { Shield, AlertCircle, LogIn } from "lucide-react";

interface AdminLoginPageProps {
  onLoginSuccess: (user: User) => void;
  onNavigateToWelcome: () => void;
}

export default function AdminLoginPage({ onLoginSuccess, onNavigateToWelcome }: AdminLoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!email || !password) {
        setError("Silakan masukkan email dan kata sandi Administrator Anda.");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.error || "Kredensial salah atau Anda tidak memiliki akses Administrator.");
        setLoading(false);
        return;
      }

      if (data.user.role !== "admin") {
        setError("Akses Ditolak. Anda tidak memiliki akses Administrator.");
        setLoading(false);
        return;
      }

      // Store JWT token in sessionStorage
      sessionStorage.setItem("im_jwt_token", data.token);

      // Success
      await addDbLog(data.user.name, "Login Admin (JWT)", "Administrator berhasil masuk sistem secara aman dengan JWT Token", "admin");
      onLoginSuccess(data.user);
    } catch (err) {
      setError("Gagal menghubungi server autentikasi JWT. Pastikan server dev berjalan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="absolute top-4 left-4 flex items-center gap-3">
        <button 
          onClick={onNavigateToWelcome}
          className="flex items-center gap-1 px-3 py-1.5 bg-brand-white border border-brand-sand rounded-xl text-xs font-bold text-brand-text hover:bg-brand-bg transition-colors cursor-pointer"
        >
          ← Beranda Utama
        </button>
        <span className="font-serif font-bold text-lg text-brand-text">InfluMatch</span>
        <span className="bg-[#2D2825] text-brand-white font-mono text-[10px] px-2.5 py-0.5 rounded-full font-bold tracking-widest uppercase">
          SECURE PORTAL
        </span>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="text-center">
          <div className="mx-auto w-14 h-14 bg-[#2D2825] text-brand-white rounded-2xl flex items-center justify-center shadow-lg border border-brand-sand/50">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="mt-5 text-center font-serif text-3xl text-brand-text tracking-tight font-black">
            Portal Administrator
          </h2>
          <p className="mt-1.5 text-center text-xs text-brand-text-soft uppercase tracking-widest font-bold">
            Sistem Sinergi UMKM & Influencer Malang
          </p>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="bg-brand-white py-8 px-6 shadow-md border border-brand-sand rounded-3xl sm:px-10">
          <form className="space-y-6" onSubmit={handleAdminLogin}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl p-3.5 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="admin-email" className="block text-xs font-bold text-brand-text-soft uppercase tracking-wider">
                Email Administrator
              </label>
              <input
                id="admin-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@influmatch.com"
                className="block w-full px-4 py-3 rounded-xl bg-brand-bg border border-brand-sand/70 text-brand-text text-sm focus:outline-none focus:ring-2 focus:ring-[#2D2825] focus:border-transparent transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="admin-password" className="block text-xs font-bold text-brand-text-soft uppercase tracking-wider">
                Kata Sandi Secure
              </label>
              <input
                id="admin-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full px-4 py-3 rounded-xl bg-brand-bg border border-brand-sand/70 text-brand-text text-sm focus:outline-none focus:ring-2 focus:ring-[#2D2825] focus:border-transparent transition-all"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-2xl bg-[#2D2825] text-brand-white font-bold hover:bg-[#1C1816] active:scale-[0.99] transition-all text-sm shadow-md disabled:opacity-55 cursor-pointer"
              >
                <LogIn className="w-4 h-4" /> {loading ? "Memproses..." : "Masuk sebagai Admin"}
              </button>
            </div>
          </form>

          <div className="mt-6 p-4 bg-brand-bg rounded-2xl border border-brand-sand/60 text-center text-[11px] text-brand-text-soft font-medium leading-relaxed">
            🛡️ Akses ini terbatas hanya untuk pengelola utama sistem. Segala aktivitas login dan perubahan data dicatat secara real-time.
          </div>
        </div>
      </motion.div>
    </div>
  );
}
