import React, { useState, useRef } from "react";
import { Camera, UploadCloud, X, RefreshCw } from "lucide-react";
import { supabase } from "../lib/supabase";

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  userName: string;
  userId: string;
  onUploadSuccess: (url: string) => void;
  onUploadError?: (message: string) => void;
}

export default function AvatarUpload({
  currentAvatarUrl,
  userName,
  userId,
  onUploadSuccess,
  onUploadError
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bucketName = "avatars";

  // Ensure bucket exists and is public
  const ensureBucketExists = async () => {
    try {
      // Supabase storage bucket creation check
      const { data: buckets } = await supabase.storage.listBuckets();
      const hasBucket = buckets?.some((b) => b.id === bucketName);
      
      if (!hasBucket) {
        await supabase.storage.createBucket(bucketName, {
          public: true,
          allowedMimeTypes: ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"],
          fileSizeLimit: 2 * 1024 * 1024 // 2MB limit
        });
      }
    } catch (err) {
      console.warn("Storage bucket auto-creation check failed (this is normal if RLS/policies restrict listBuckets):", err);
    }
  };

  const handleFileUpload = async (file: File) => {
    // Validate file is an image
    if (!file.type.startsWith("image/")) {
      const msg = "File harus berupa gambar (PNG, JPG, WEBP, GIF)";
      setErrorMsg(msg);
      if (onUploadError) onUploadError(msg);
      return;
    }

    // Validate size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      const msg = "Ukuran gambar maksimal adalah 2MB";
      setErrorMsg(msg);
      if (onUploadError) onUploadError(msg);
      return;
    }

    setIsUploading(true);
    setErrorMsg("");

    try {
      // Ensure the avatars bucket is ready
      await ensureBucketExists();

      const fileExt = file.name.split(".").pop() || "png";
      const uniqueId = Math.random().toString(36).substring(2, 10);
      const filePath = `${userId}/${uniqueId}.${fileExt}`;

      // Upload file directly to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      if (!publicUrlData?.publicUrl) {
        throw new Error("Gagal mengambil tautan publik dari server penyimpanan.");
      }

      // Callback on success
      onUploadSuccess(publicUrlData.publicUrl);
    } catch (err: any) {
      console.error("Upload error:", err);
      const msg = err.message || "Terjadi kesalahan saat mengunggah foto profil.";
      setErrorMsg(msg);
      if (onUploadError) onUploadError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 border border-brand-sand/50 rounded-3xl bg-brand-bg/10 space-y-4 max-w-sm mx-auto">
      <div 
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={triggerFileSelect}
        className={`relative group w-32 h-32 rounded-full border-4 overflow-hidden shadow-inner cursor-pointer transition-all ${
          isDragging ? "border-brand-blush-dark scale-105" : "border-brand-sand hover:border-brand-blush-dark"
        }`}
      >
        {currentAvatarUrl && currentAvatarUrl.startsWith("http") ? (
          <img 
            src={currentAvatarUrl} 
            alt={userName} 
            className="w-full h-full object-cover transition-opacity group-hover:opacity-70"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-brand-blush text-brand-blush-dark flex items-center justify-center font-bold text-3xl">
            {currentAvatarUrl || userName.slice(0, 2).toUpperCase()}
          </div>
        )}

        {/* Hover overlay with Camera Icon */}
        <div className="absolute inset-0 bg-brand-text/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all">
          <Camera className="w-6 h-6 text-brand-white" />
          <span className="text-[10px] text-brand-white font-bold mt-1 uppercase tracking-wide">Ubah Foto</span>
        </div>

        {/* Uploading loading spinner overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-brand-text/60 flex items-center justify-center">
            <RefreshCw className="w-7 h-7 text-brand-white animate-spin" />
          </div>
        )}
      </div>

      <div className="text-center">
        <h4 className="font-serif text-sm font-bold text-brand-text">Foto Profil</h4>
        <p className="text-[11px] text-brand-text-soft mt-1 leading-relaxed">
          Tarik & lepas foto Anda ke lingkaran, atau klik lingkaran untuk memilih file. (Max 2MB, JPG/PNG)
        </p>
      </div>

      {errorMsg && (
        <div className="w-full p-2.5 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between text-[11px] font-bold text-red-700">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg("")} className="p-0.5 hover:bg-red-100 rounded-lg">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Hidden file input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={onFileChange} 
        accept="image/*" 
        className="hidden" 
      />
    </div>
  );
}
