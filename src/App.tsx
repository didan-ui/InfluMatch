import React, { useState, useEffect } from "react";
import { User } from "./types";
import { getDbUsers, isSupabaseConfigured, syncFromSupabase } from "./utils";
import WelcomePage from "./components/WelcomePage";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import AdminLoginPage from "./components/AdminLoginPage";
import Topbar from "./components/Topbar";
import UmkmDashboard from "./components/UmkmDashboard";
import InfluencerDashboard from "./components/InfluencerDashboard";
import AdminDashboard from "./components/AdminDashboard";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [screen, setScreen] = useState<"welcome" | "login" | "register" | "main" | "admin-login">("welcome");
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  // Attempt to restore session on boot using secure JWT token verification
  useEffect(() => {
    async function initApp() {
      const configured = isSupabaseConfigured();
      if (configured) {
        setIsSyncing(true);
        setSyncStatus("loading");
        const ok = await syncFromSupabase();
        setIsSyncing(false);
        setSyncStatus(ok ? "success" : "error");
      }

      const token = sessionStorage.getItem("im_jwt_token");
      if (token) {
        try {
          const response = await fetch("/api/auth/verify", {
            headers: {
              "Authorization": `Bearer ${token}`
            }
          });
          const data = await response.json();
          if (response.ok && data.success) {
            setCurrentUser(data.user);
            sessionStorage.setItem("im_current_user", JSON.stringify(data.user));
            setScreen("main");
            return;
          } else {
            sessionStorage.removeItem("im_jwt_token");
            sessionStorage.removeItem("im_current_user");
          }
        } catch (e) {
          console.error("JWT token verification error on boot:", e);
        }
      }

      // Fallback to basic session storage if no network or no token
      const savedUser = sessionStorage.getItem("im_current_user");
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser) as User;
          const usersInDb = await getDbUsers();
          const valid = usersInDb.find(u => u.id === parsed.id);
          if (valid) {
            setCurrentUser(valid);
            setScreen("main");
          } else {
            sessionStorage.removeItem("im_current_user");
            setScreen("welcome");
          }
        } catch (e) {
          console.error("Session restore error:", e);
          setScreen("welcome");
        }
      } else {
        setScreen("welcome");
      }
    }

    initApp();
  }, []);

  // Monitor URL hash for admin portal access
  useEffect(() => {
    const checkHash = () => {
      if (window.location.hash === "#admin" || window.location.hash === "#admin-portal") {
        setScreen("admin-login");
      }
    };
    checkHash();
    window.addEventListener("hashchange", checkHash);
    return () => {
      window.removeEventListener("hashchange", checkHash);
    };
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    sessionStorage.setItem("im_current_user", JSON.stringify(user));
    setScreen("main");
  };

  const handleUserUpdate = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    sessionStorage.setItem("im_current_user", JSON.stringify(updatedUser));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem("im_current_user");
    setScreen("welcome");
  };

  if (isSyncing) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex flex-col items-center justify-center p-6 text-brand-text">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-brand-white border border-brand-sand rounded-3xl max-w-sm w-full p-8 shadow-xl text-center space-y-4"
        >
          <div className="flex justify-center">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 border-4 border-brand-sand/30 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-brand-text border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
          <div>
            <h3 className="font-serif text-xl font-bold text-brand-text">Menghubungkan Supabase...</h3>
            <p className="text-xs text-brand-text-soft mt-1.5 leading-relaxed">
              Menghubungkan ke server basis data cloud dan mensinkronisasikan data terbaru secara aman. Mohon tunggu sebentar.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg font-sans text-brand-text flex flex-col selection:bg-brand-blush/65 select-none md:select-text overflow-x-hidden">

      <AnimatePresence mode="wait">

        {screen === "welcome" && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-grow flex flex-col"
          >
            <WelcomePage
              onNavigateToLogin={() => setScreen("login")}
              onNavigateToRegister={() => setScreen("register")}
            />
          </motion.div>
        )}

        {screen === "login" && (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1"
          >
            <LoginPage
              onLoginSuccess={handleLoginSuccess}
              onNavigateToRegister={() => setScreen("register")}
              onNavigateToWelcome={() => setScreen("welcome")}
            />
          </motion.div>
        )}

        {screen === "register" && (
          <motion.div
            key="register"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1"
          >
            <RegisterPage
              onRegisterSuccess={() => setScreen("login")}
              onNavigateToLogin={() => setScreen("login")}
              onNavigateToWelcome={() => setScreen("welcome")}
            />
          </motion.div>
        )}

        {screen === "admin-login" && (
          <motion.div
            key="admin-login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1"
          >
            <AdminLoginPage
              onLoginSuccess={(user) => {
                // Clear URL hash quietly
                window.location.hash = "";
                handleLoginSuccess(user);
              }}
              onNavigateToWelcome={() => {
                window.location.hash = "";
                setScreen("welcome");
              }}
            />
          </motion.div>
        )}

        {screen === "main" && currentUser && (
          <motion.div
            key="main"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex-grow flex flex-col"
          >
            {/* Nav Header Row */}
            <Topbar currentUser={currentUser} onLogout={handleLogout} />

            {/* Main Application Area (Dynamic Role dashboard) */}
            <div className="flex-1 flex flex-col md:flex-row">
              {currentUser.role === "umkm" && (
                <div className="flex-1">
                  <UmkmDashboard currentUser={currentUser} onUserUpdate={handleUserUpdate} />
                </div>
              )}

              {currentUser.role === "influencer" && (
                <div className="flex-1">
                  <InfluencerDashboard currentUser={currentUser} onUserUpdate={handleUserUpdate} />
                </div>
              )}

              {currentUser.role === "admin" && (
                <div className="flex-1">
                  <AdminDashboard currentUser={currentUser} />
                </div>
              )}
            </div>
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}
