import React, { useState } from "react";
import { User } from "../types";
import CampaignManager from "./CampaignManager";
import InfluencerManager from "./InfluencerManager";
import { motion } from "motion/react";

interface UmkmDashboardProps {
  user: User;
  onLogout: () => void;
}

export default function UmkmDashboard({ user, onLogout }: UmkmDashboardProps) {
  const [activeTab, setActiveTab] = useState<"campaigns" | "analytics">("campaigns");

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Header */}
      <div className="bg-white border-b border-brand-sand">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-brand-text">
                {(user as any).brand_name || user.name}
              </h1>
              <p className="text-sm text-brand-text-soft mt-1">
                {(user as any).brand_category || "UMKM"} • {user.city || "Lokasi tidak diatur"}
              </p>
            </div>
            <button
              onClick={onLogout}
              className="px-4 py-2 text-sm font-bold border border-brand-sand rounded-lg hover:bg-brand-bg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-brand-sand">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab("campaigns")}
              className={`py-4 px-2 border-b-2 font-semibold text-sm transition-colors ${
                activeTab === "campaigns"
                  ? "border-brand-text text-brand-text"
                  : "border-transparent text-brand-text-soft hover:text-brand-text"
              }`}
            >
              Kampanye
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`py-4 px-2 border-b-2 font-semibold text-sm transition-colors ${
                activeTab === "analytics"
                  ? "border-brand-text text-brand-text"
                  : "border-transparent text-brand-text-soft hover:text-brand-text"
              }`}
            >
              Analytics
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === "campaigns" && (
            <div className="space-y-8">
              <CampaignManager umkmId={user.id} />
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-brand-sand p-8 text-center">
                <p className="text-brand-text-soft">Analytics section coming soon...</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
