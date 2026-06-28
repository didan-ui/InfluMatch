import React, { useState, useEffect } from "react";
import { User } from "./types";
import LoginPage from "./components/LoginPage";
import RegisterPageNew from "./components/RegisterPageNew";
import WelcomePage from "./components/WelcomePage";
import UmkmDashboard from "./components/UmkmDashboard";
import InfluencerDashboard from "./components/InfluencerDashboard";
import AdminDashboardNew from "./components/AdminDashboardNew";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [screen, setScreen] = useState<"welcome" | "login" | "register" | "main">("welcome");

  // Try to restore user from localStorage (if backend sets it)
  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser) as User;
        setCurrentUser(parsed);
        setScreen("main");
      } catch (e) {
        console.error("Session restore error:", e);
        localStorage.removeItem("currentUser");
      }
    }
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem("currentUser", JSON.stringify(user));
    setScreen("main");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("currentUser");
    setScreen("welcome");
  };

  const handleRegisterSuccess = () => {
    setScreen("login");
  };

  return (
    <div className="min-h-screen bg-brand-bg font-sans text-brand-text flex flex-col selection:bg-brand-blush/65 select-none md:select-text">
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
            <RegisterPageNew
              onRegisterSuccess={handleRegisterSuccess}
              onNavigateToLogin={() => setScreen("login")}
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
            {/* Role-based Dashboard */}
            {currentUser.role === "umkm" && (
              <UmkmDashboard currentUser={currentUser} onLogout={handleLogout} />
            )}

            {currentUser.role === "influencer" && (
              <InfluencerDashboard currentUser={currentUser} onLogout={handleLogout} />
            )}

            {currentUser.role === "admin" && (
              <AdminDashboardNew user={currentUser} onLogout={handleLogout} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
