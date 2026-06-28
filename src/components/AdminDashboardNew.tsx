import React, { useState, useEffect } from "react";
import { User } from "../types";
import { useUsers } from "../services/hooks";
import { motion } from "motion/react";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"influencers" | "umkms">("influencers");
  const { users: allUsers, approveInfluencer, rejectInfluencer } = useUsers();
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const influencers = allUsers.filter((u) => u.role === "influencer");
  const umkms = allUsers.filter((u) => u.role === "umkm");
  const pendingInfluencers = influencers.filter((u) => !u.is_approved);

  const handleApprove = async (influencerId: string) => {
    try {
      await approveInfluencer(influencerId);
      setSuccessMessage("Influencer berhasil disetujui!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleReject = async (influencerId: string) => {
    try {
      await rejectInfluencer(influencerId);
      setSuccessMessage("Influencer berhasil ditolak!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Header */}
      <div className="bg-white border-b border-brand-sand">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-brand-text">Admin Dashboard</h1>
              <p className="text-sm text-brand-text-soft mt-1">Manage all users and platforms</p>
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

      {/* Stats */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-brand-sand p-6">
            <p className="text-brand-text-soft text-sm font-bold">TOTAL INFLUENCERS</p>
            <p className="text-4xl font-bold text-brand-text mt-2">{influencers.length}</p>
            <p className="text-xs text-red-600 mt-1">{pendingInfluencers.length} pending approval</p>
          </div>
          <div className="bg-white rounded-2xl border border-brand-sand p-6">
            <p className="text-brand-text-soft text-sm font-bold">TOTAL UMKMs</p>
            <p className="text-4xl font-bold text-brand-text mt-2">{umkms.length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-brand-sand p-6">
            <p className="text-brand-text-soft text-sm font-bold">APPROVED INFLUENCERS</p>
            <p className="text-4xl font-bold text-brand-text mt-2">
              {influencers.filter((u) => u.is_approved).length}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-brand-sand">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab("influencers")}
              className={`py-4 px-2 border-b-2 font-semibold text-sm transition-colors ${
                activeTab === "influencers"
                  ? "border-brand-text text-brand-text"
                  : "border-transparent text-brand-text-soft hover:text-brand-text"
              }`}
            >
              Influencers ({influencers.length})
            </button>
            <button
              onClick={() => setActiveTab("umkms")}
              className={`py-4 px-2 border-b-2 font-semibold text-sm transition-colors ${
                activeTab === "umkms"
                  ? "border-brand-text text-brand-text"
                  : "border-transparent text-brand-text-soft hover:text-brand-text"
              }`}
            >
              UMKMs ({umkms.length})
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            {successMessage}
          </motion.div>
        )}

        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 flex items-center gap-2"
          >
            <AlertCircle className="w-5 h-5" />
            {errorMessage}
          </motion.div>
        )}

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === "influencers" && (
            <div className="space-y-6">
              {pendingInfluencers.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-brand-text mb-4">
                    Pending Approvals ({pendingInfluencers.length})
                  </h3>
                  <div className="grid gap-4">
                    {pendingInfluencers.map((influencer) => (
                      <motion.div
                        key={influencer.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-yellow-50 rounded-2xl border border-yellow-200 p-6 space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-bold text-lg text-brand-text">{influencer.name}</h4>
                            <p className="text-sm text-brand-text-soft">@{(influencer as any).handle}</p>
                            <p className="text-sm text-brand-text-soft mt-1">
                              {(influencer as any).followers_num || 0} followers • {influencer.city}
                            </p>
                          </div>
                          <span className="px-3 py-1 bg-yellow-200 text-yellow-800 text-xs rounded-full font-bold">
                            PENDING
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-brand-text-soft">Price Per Post</p>
                            <p className="font-bold">Rp {((influencer as any).price_per_post || 0).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-brand-text-soft">Niche</p>
                            <p className="font-bold">{((influencer as any).niche || []).join(", ")}</p>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-3 border-t border-yellow-200">
                          <button
                            onClick={() => handleApprove(influencer.id)}
                            className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 font-bold text-sm"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(influencer.id)}
                            className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 font-bold text-sm"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-lg font-bold text-brand-text mb-4">
                  Approved Influencers ({influencers.filter((u) => u.is_approved).length})
                </h3>
                <div className="grid gap-4">
                  {influencers
                    .filter((u) => u.is_approved)
                    .map((influencer) => (
                      <motion.div
                        key={influencer.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl border border-brand-sand p-6 space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-bold text-lg text-brand-text">{influencer.name}</h4>
                            <p className="text-sm text-brand-text-soft">@{(influencer as any).handle}</p>
                          </div>
                          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-bold">
                            APPROVED
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-brand-text-soft">Followers</p>
                            <p className="font-bold">{((influencer as any).followers_num || 0).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-brand-text-soft">Rating</p>
                            <p className="font-bold">{influencer.rating?.toFixed(1) || "N/A"} ⭐</p>
                          </div>
                          <div>
                            <p className="text-brand-text-soft">Location</p>
                            <p className="font-bold">{influencer.city}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "umkms" && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-brand-text">Registered UMKMs</h3>
              <div className="grid gap-4">
                {umkms.map((umkm) => (
                  <motion.div
                    key={umkm.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-brand-sand p-6 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-bold text-lg text-brand-text">
                          {(umkm as any).brand_name || umkm.name}
                        </h4>
                        <p className="text-sm text-brand-text-soft">{(umkm as any).brand_category}</p>
                      </div>
                      {umkm.is_approved ? (
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-bold">
                          APPROVED
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-bold">
                          PENDING
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-brand-text-soft">Email</p>
                        <p className="font-bold">{umkm.email}</p>
                      </div>
                      <div>
                        <p className="text-brand-text-soft">City</p>
                        <p className="font-bold">{umkm.city}</p>
                      </div>
                      <div>
                        <p className="text-brand-text-soft">Rating</p>
                        <p className="font-bold">{umkm.rating?.toFixed(1) || "N/A"} ⭐</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
