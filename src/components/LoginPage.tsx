import React, { useState } from "react";
import { User } from "../types";
import { useAuth } from "../services/hooks";
import { motion } from "motion/react";
import { LogIn, AlertCircle, Eye, EyeOff } from "lucide-react";

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
  onNavigateToRegister: () => void;
}

export default function LoginPage({ onLoginSuccess, onNavigateToRegister }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Email dan password harus diisi");
      return;
    }

    try {
      const response = await login(email, password);
      if (response.user) {
        onLoginSuccess(response.user);
      }
    } catch (err: any) {
      setError(err.message || "Login gagal. Cek email dan password Anda");
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute top-4 left-4">
        <button
          onClick={onNavigateToRegister}
          className="px-3 py-1.5 text-xs font-bold text-brand-text-soft hover:text-brand-text"
        >
          ← Daftar
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="text-center">
          <h2 className="text-4xl font-serif font-bold text-brand-text">Selamat Datang</h2>
          <p className="mt-2 text-sm text-brand-text-soft">
            Masuk ke akun Anda untuk melanjutkan
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="bg-brand-white py-8 px-6 shadow-sm border border-brand-sand/80 rounded-3xl">
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl p-3 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-bold tracking-wider text-brand-text-soft uppercase">
                Email
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-2xl border border-brand-sand px-4 py-3 bg-brand-bg/50 text-brand-text placeholder-brand-text-light focus:outline-none focus:ring-1 focus:ring-brand-blush-dark/40 text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold tracking-wider text-brand-text-soft uppercase">
                Password
              </label>
              <div className="mt-2 relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-2xl border border-brand-sand px-4 py-3 bg-brand-bg/50 text-brand-text placeholder-brand-text-light focus:outline-none focus:ring-1 focus:ring-brand-blush-dark/40 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-brand-text-soft"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-2xl bg-brand-text text-brand-white font-bold hover:opacity-90 active:scale-[0.99] transition-all text-sm disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              {loading ? "Sedang masuk..." : "Masuk"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-brand-text-soft">
            Belum punya akun?{" "}
            <button
              onClick={onNavigateToRegister}
              className="text-brand-text font-bold hover:underline"
            >
              Daftar di sini
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
