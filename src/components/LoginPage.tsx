import React, { useState } from "react";
import { User } from "../types";
import { getDbUsers, addDbLog, hashPassword } from "../utils";
import { motion } from "motion/react";
import { LogIn, AlertCircle } from "lucide-react";

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
  onNavigateToRegister: () => void;
  onNavigateToWelcome: () => void;
  onNavigateToAdminLogin: () => void;
}

export default function LoginPage({ onLoginSuccess, onNavigateToRegister, onNavigateToWelcome, onNavigateToAdminLogin }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Silakan masukkan email dan kata sandi Anda.");
      return;
    }

    const users = getDbUsers();
    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!foundUser) {
      setError("Email tidak ditemukan. Silakan daftarkan akun baru jika belum terdaftar.");
      return;
    }

    const hashedInput = await hashPassword(password);
    if (foundUser.password && foundUser.password !== hashedInput) {
      setError("Kata sandi salah. Silakan coba lagi.");
      return;
    }

    if (foundUser.status === "banned") {
      setError("Akun Anda telah DIBLOKIR secara permanen oleh Admin karena pelanggaran berat.");
      return;
    }
    if (foundUser.status === "suspended") {
      setError(`Akun Anda sedang DITANGGUHKAN sementara oleh Admin.${foundUser.statusReason ? ` Alasan: ${foundUser.statusReason}` : ""}`);
      return;
    }

    // Success!
    if (foundUser.role === "admin") {
      addDbLog(foundUser.name, "Login Admin", "Administrator berhasil masuk sistem", "admin");
    } else {
      addDbLog(foundUser.name, "Login Berhasil", `${foundUser.name} berhasil melakukan login sebagai ${foundUser.role.toUpperCase()}`, foundUser.role);
    }
    onLoginSuccess(foundUser);
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="absolute top-4 left-4 flex items-center gap-3">
        <button 
          onClick={onNavigateToWelcome}
          className="flex items-center gap-1 px-3 py-1.5 bg-brand-white border border-brand-sand rounded-xl text-xs font-bold text-brand-text hover:bg-brand-bg transition-colors cursor-pointer"
        >
          ← Beranda
        </button>
        <span className="font-serif font-bold text-lg text-brand-text hidden sm:inline-block">InfluMatch</span>
        <span className="bg-brand-blush/60 text-brand-blush-dark font-mono text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wider hidden sm:inline-block">MLP</span>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="text-center">
          <h2 className="mt-6 text-center font-serif text-4xl text-brand-text tracking-tight font-bold">
            Selamat Datang Kembali
          </h2>
          <p className="mt-2 text-center text-sm text-brand-text-soft">
            Hubungkan UMKM Lokal dengan Mahasiswa Berpengaruh
          </p>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="bg-brand-white py-8 px-6 shadow-sm border border-brand-sand/80 rounded-3xl sm:px-10">
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl p-3 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-bold tracking-wider text-brand-text-soft uppercase">
                Alamat Email
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-2xl border border-brand-sand px-4 py-3 bg-brand-bg/50 text-brand-text placeholder-brand-text-light focus:outline-none focus:ring-1 focus:ring-brand-blush-dark/40 focus:border-brand-blush-dark/40 text-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-bold tracking-wider text-brand-text-soft uppercase">
                  Kata Sandi
                </label>
              </div>
              <div className="mt-2">
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="******"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-2xl border border-brand-sand px-4 py-3 bg-brand-bg/50 text-brand-text placeholder-brand-text-light focus:outline-none focus:ring-1 focus:ring-brand-blush-dark/40 focus:border-brand-blush-dark/40 text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-2xl bg-brand-text text-brand-white font-bold hover:opacity-90 active:scale-[0.99] transition-all text-sm shadow-md"
              >
                <LogIn className="w-4 h-4" /> Masuk ke Platform
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <span className="text-xs text-brand-text-soft">Belum terdaftar? </span>
            <button
              onClick={onNavigateToRegister}
              className="text-xs text-brand-blush-dark font-bold hover:underline cursor-pointer"
            >
              Daftar Sekarang
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-brand-sand/45 text-center">
            <button
              type="button"
              onClick={onNavigateToAdminLogin}
              className="text-xs text-brand-text-soft hover:text-brand-text font-bold uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer"
            >
              🛡️ Masuk sebagai Admin
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
