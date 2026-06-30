import { User } from "../types";
import { LogOut, ShieldAlert, Award } from "lucide-react";

interface TopbarProps {
  currentUser: User;
  onLogout: () => void;
}

export default function Topbar({ currentUser, onLogout }: TopbarProps) {
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

          <div className="w-10 h-10 rounded-full bg-brand-blush text-brand-blush-dark flex items-center justify-center font-bold text-sm border border-brand-sand select-none shadow-inner overflow-hidden">
            {currentUser.avatarUrl && currentUser.avatarUrl.startsWith("http") ? (
              <img 
                src={currentUser.avatarUrl} 
                alt={currentUser.name} 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
              />
            ) : (
              currentUser.avatarUrl || currentUser.name.slice(0, 2).toUpperCase()
            )}
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

    </nav>
  );
}
