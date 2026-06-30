import React, { useState, useRef } from "react";
import { User } from "../types";
import { LogOut, ShieldAlert, Award, Camera, Upload, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { updateProfilePicture } from "../utils";

interface TopbarProps {
  currentUser: User;
  onLogout: () => void;
  onUserUpdate?: (user: User) => void;
}

export default function Topbar({ currentUser, onLogout, onUserUpdate }: TopbarProps) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      setError("Ukuran file maksimal adalah 2MB");
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      const publicUrl = await updateProfilePicture(currentUser.id, file);
      setSuccess("Foto profil berhasil diperbarui!");
      if (onUserUpdate) {
        onUserUpdate({ ...currentUser, avatarUrl: publicUrl });
      }
      setTimeout(() => {
        setShowUploadModal(false);
        setSuccess("");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Gagal mengunggah foto profil.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <nav className="h-16 bg-brand-white border-b border-brand-sand px-6 xl:px-12 flex items-center justify-between sticky top-0 z-50 shadow-sm/20 font-sans">
      
      {/* Brand logo */}
      <div className="flex items-center gap-2.5">
        <div className="w-2.5 h-2.5 rounded-full bg-brand-blush-dark animate-pulse"></div>
        <span className="font-serif font-black text-xl text-brand-text tracking-tight select-none">
          InfluMatch
        </span>
        <span className="bg-brand-blush text-brand-blush-dark text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider scale-95 select-none md:inline hidden">
          Local UMKM Hub
        </span>
      </div>

      {/* User profile actions */}
      <div className="flex items-center gap-4">
        
        {/* User Identity widget */}
        <div className="flex items-center gap-3">
          
          <div className="text-right flex flex-col justify-center">
            <div className="text-xs font-bold text-brand-text leading-tight flex items-center justify-end gap-1">
              {currentUser.role === 'admin' && (
                <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
              )}
              {currentUser.role === 'umkm' && (
                <Award className="w-3.5 h-3.5 text-brand-blush-dark" />
              )}
              {currentUser.name}
            </div>
            <div className="text-[10px] font-bold text-brand-text-light uppercase tracking-wider leading-tight">
              {currentUser.role === 'umkm' ? (currentUser.brandName || 'UMKM Lokal') : currentUser.role.toUpperCase()}
            </div>
          </div>

          <div 
            onClick={() => setShowUploadModal(true)}
            className="relative w-10 h-10 rounded-full group cursor-pointer overflow-hidden border border-brand-sand shadow-inner shrink-0"
            title="Ubah Foto Profil"
          >
            {currentUser.avatarUrl && (currentUser.avatarUrl.startsWith("http") || currentUser.avatarUrl.startsWith("/") || currentUser.avatarUrl.startsWith("data:")) ? (
              <img 
                src={currentUser.avatarUrl} 
                alt={currentUser.name} 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer" 
              />
            ) : (
              <div className="w-full h-full bg-brand-blush text-brand-blush-dark flex items-center justify-center font-bold text-sm">
                {currentUser.avatarUrl || currentUser.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            {/* Hover overlay with Camera Icon */}
            <div className="absolute inset-0 bg-brand-text/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-200">
              <Camera className="w-4 h-4 text-brand-white" />
            </div>
          </div>

        </div>

        <div className="h-6 w-px bg-brand-sand/60"></div>

        {/* Logout button */}
        <button
          onClick={onLogout}
          title="Keluar dari Akun"
          className="p-2 rounded-xl bg-brand-bg text-brand-text-soft hover:bg-brand-blush/30 hover:text-brand-blush-dark active:scale-95 transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>

      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-brand-text/55 backdrop-blur-xs" onClick={() => !uploading && setShowUploadModal(false)}></div>
          
          <div className="bg-brand-white rounded-3xl p-6 shadow-2xl border border-brand-sand max-w-sm w-full z-10 space-y-5 relative font-sans text-brand-text animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center">
              <h3 className="font-serif text-lg font-bold text-brand-text">Ubah Foto Profil</h3>
              <p className="text-xs text-brand-text-soft mt-1">
                Unggah foto terbaik Anda (PNG, JPG, JPEG, WEBP) maksimal 2MB.
              </p>
            </div>

            {/* Preview Section */}
            <div className="flex flex-col items-center justify-center py-4 bg-brand-bg/50 rounded-2xl border border-brand-sand/50">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-brand-white shadow-md relative">
                {currentUser.avatarUrl && (currentUser.avatarUrl.startsWith("http") || currentUser.avatarUrl.startsWith("/") || currentUser.avatarUrl.startsWith("data:")) ? (
                  <img 
                    src={currentUser.avatarUrl} 
                    alt={currentUser.name} 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer" 
                  />
                ) : (
                  <div className="w-full h-full bg-brand-blush text-brand-blush-dark flex items-center justify-center font-serif text-3xl font-black">
                    {currentUser.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <span className="text-[10px] text-brand-text-light font-mono font-bold mt-2 uppercase">Pratinjau Saat Ini</span>
            </div>

            {/* Error & Success Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-semibold">{error}</span>
              </div>
            )}
            {success && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl p-3 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span className="font-semibold">{success}</span>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => !uploading && setShowUploadModal(false)}
                disabled={uploading}
                className="flex-1 py-3 px-4 border border-brand-sand rounded-2xl text-xs font-bold text-brand-text-soft hover:bg-brand-bg transition-colors disabled:opacity-50 cursor-pointer"
              >
                Batal
              </button>
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex-1 py-3 px-4 bg-brand-text hover:opacity-90 text-brand-white rounded-2xl text-xs font-bold transition-all shadow-md disabled:opacity-55 flex items-center justify-center gap-2 cursor-pointer"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Mengunggah...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Pilih Foto</span>
                  </>
                )}
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleUpload}
              accept="image/*"
              className="hidden"
            />
          </div>
        </div>
      )}

    </nav>
  );
}
