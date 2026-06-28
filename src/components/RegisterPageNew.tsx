import React, { useState } from "react";
import { useAuth } from "../services/hooks";
import { motion } from "motion/react";
import { AlertCircle, Eye, EyeOff } from "lucide-react";

interface RegisterPageProps {
  onRegisterSuccess: () => void;
  onNavigateToLogin: () => void;
}

export default function RegisterPage({ onRegisterSuccess, onNavigateToLogin }: RegisterPageProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    role: "influencer" as "umkm" | "influencer",
    brandName: "",
    brandCategory: "",
    handle: "",
    city: "",
  });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { register, loading } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.email || !formData.password || !formData.name) {
      setError("Email, password, dan nama harus diisi");
      return;
    }

    if (formData.role === "umkm" && !formData.brandName) {
      setError("Nama brand harus diisi untuk UMKM");
      return;
    }

    if (formData.role === "influencer" && !formData.handle) {
      setError("Handle (username) harus diisi untuk Influencer");
      return;
    }

    try {
      await register({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: formData.role,
        brandName: formData.brandName,
        brandCategory: formData.brandCategory,
        handle: formData.handle,
        city: formData.city,
      });
      onRegisterSuccess();
    } catch (err: any) {
      setError(err.message || "Pendaftaran gagal");
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute top-4 left-4">
        <button
          onClick={onNavigateToLogin}
          className="px-3 py-1.5 bg-brand-white border border-brand-sand rounded-xl text-xs font-bold text-brand-text hover:bg-brand-bg transition-colors"
        >
          ← Kembali
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="text-center">
          <h2 className="text-4xl font-serif font-bold text-brand-text">Daftar Sekarang</h2>
          <p className="mt-2 text-sm text-brand-text-soft">
            Bergabunglah dengan InfluMatch
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
          <form className="space-y-4" onSubmit={handleRegister}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl p-3 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            {/* Role Selection */}
            <div>
              <label className="block text-xs font-bold text-brand-text-soft uppercase mb-2">
                Daftar Sebagai
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-brand-sand px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-blush-dark"
              >
                <option value="influencer">Influencer</option>
                <option value="umkm">UMKM</option>
              </select>
            </div>

            {/* Common Fields */}
            <div>
              <label className="block text-xs font-bold text-brand-text-soft uppercase mb-1">
                Nama Lengkap
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Nama Anda"
                className="w-full rounded-xl border border-brand-sand px-4 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-text-soft uppercase mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="email@example.com"
                className="w-full rounded-xl border border-brand-sand px-4 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-text-soft uppercase mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-brand-sand px-4 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-text-soft uppercase mb-1">
                Kota
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="Kota Anda"
                className="w-full rounded-xl border border-brand-sand px-4 py-2 text-sm"
              />
            </div>

            {/* UMKM Specific */}
            {formData.role === "umkm" && (
              <>
                <div>
                  <label className="block text-xs font-bold text-brand-text-soft uppercase mb-1">
                    Nama Brand
                  </label>
                  <input
                    type="text"
                    name="brandName"
                    value={formData.brandName}
                    onChange={handleInputChange}
                    placeholder="Nama brand Anda"
                    className="w-full rounded-xl border border-brand-sand px-4 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-text-soft uppercase mb-1">
                    Kategori Bisnis
                  </label>
                  <input
                    type="text"
                    name="brandCategory"
                    value={formData.brandCategory}
                    onChange={handleInputChange}
                    placeholder="Kuliner, Fashion, dll"
                    className="w-full rounded-xl border border-brand-sand px-4 py-2 text-sm"
                  />
                </div>
              </>
            )}

            {/* Influencer Specific */}
            {formData.role === "influencer" && (
              <div>
                <label className="block text-xs font-bold text-brand-text-soft uppercase mb-1">
                  Handle/Username
                </label>
                <input
                  type="text"
                  name="handle"
                  value={formData.handle}
                  onChange={handleInputChange}
                  placeholder="@username"
                  className="w-full rounded-xl border border-brand-sand px-4 py-2 text-sm"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-2xl bg-brand-text text-brand-white font-bold hover:opacity-90 disabled:opacity-50 transition-all text-sm"
            >
              {loading ? "Mendaftar..." : "Daftar"}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-brand-text-soft">
            Sudah punya akun?{" "}
            <button
              onClick={onNavigateToLogin}
              className="text-brand-text font-bold hover:underline"
            >
              Masuk di sini
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
