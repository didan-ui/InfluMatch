import React, { useState, useEffect } from "react";
import { User, Campaign, CampaignInfluencer } from "../types";
import { useCampaigns, useCampaignInfluencers } from "../services/hooks";
import { motion } from "motion/react";
import { AlertCircle, CheckCircle, Send, Loader } from "lucide-react";

interface InfluencerDashboardProps {
  user: User;
  onLogout: () => void;
}

export default function InfluencerDashboard({ user, onLogout }: InfluencerDashboardProps) {
  const [activeTab, setActiveTab] = useState<"available" | "my-campaigns">("available");
  const { campaigns: allCampaigns, loading } = useCampaigns();
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [submissionUrl, setSubmissionUrl] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Get campaigns where this influencer is invited
  const myCampaigns = selectedCampaign
    ? []
    : allCampaigns.filter((c) =>
        c.campaign_influencers?.some((inf: any) => inf.influencer_id === user.id)
      );

  const handleSubmitContent = async (campaignId: string) => {
    if (!submissionUrl.trim()) {
      setErrorMessage("URL konten tidak boleh kosong");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      // Find the campaign influencer relationship
      const campaign = allCampaigns.find((c) => c.id === campaignId);
      if (!campaign) throw new Error("Kampanye tidak ditemukan");

      const campaignInf = campaign.campaign_influencers?.find(
        (inf: any) => inf.influencer_id === user.id
      );
      if (!campaignInf) throw new Error("Anda tidak terdaftar di kampanye ini");

      // Call submit endpoint (already implemented in api.ts)
      const response = await fetch(`/api/campaigns/${campaignId}/influencers/${user.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionUrl }),
      });

      if (!response.ok) throw new Error("Gagal submit konten");

      setSuccessMessage("Konten berhasil disubmit!");
      setSubmissionUrl("");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (campaign: Campaign) => {
    const myInf = campaign.campaign_influencers?.find(
      (inf: any) => inf.influencer_id === user.id
    );
    if (!myInf) return <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">Available</span>;

    const statusColors: { [key: string]: string } = {
      invited: "bg-yellow-100 text-yellow-700",
      brief_ready: "bg-blue-100 text-blue-700",
      escrow_locked: "bg-purple-100 text-purple-700",
      content_uploaded: "bg-green-100 text-green-700",
      completed: "bg-emerald-100 text-emerald-700",
      disputed: "bg-red-100 text-red-700",
    };

    return (
      <span className={`px-3 py-1 text-xs rounded-full ${statusColors[myInf.status] || "bg-gray-100"}`}>
        {myInf.status.replace(/_/g, " ").toUpperCase()}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Header */}
      <div className="bg-white border-b border-brand-sand">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-brand-text">{user.name}</h1>
              <p className="text-sm text-brand-text-soft mt-1">
                @{(user as any).handle || "username"} • {(user as any).followers_num || 0} followers
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
              onClick={() => setActiveTab("available")}
              className={`py-4 px-2 border-b-2 font-semibold text-sm transition-colors ${
                activeTab === "available"
                  ? "border-brand-text text-brand-text"
                  : "border-transparent text-brand-text-soft hover:text-brand-text"
              }`}
            >
              Kampanye Tersedia
            </button>
            <button
              onClick={() => setActiveTab("my-campaigns")}
              className={`py-4 px-2 border-b-2 font-semibold text-sm transition-colors ${
                activeTab === "my-campaigns"
                  ? "border-brand-text text-brand-text"
                  : "border-transparent text-brand-text-soft hover:text-brand-text"
              }`}
            >
              Kampanye Saya ({myCampaigns.length})
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

          {activeTab === "available" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-brand-text mb-6">Kampanye Tersedia untuk Anda</h2>
                {loading ? (
                  <div className="text-center py-12">
                    <Loader className="w-6 h-6 animate-spin mx-auto" />
                    <p className="text-brand-text-soft mt-2">Memuat kampanye...</p>
                  </div>
                ) : allCampaigns.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-2xl border border-brand-sand">
                    <p className="text-brand-text-soft">Belum ada kampanye yang tersedia</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {allCampaigns.map((campaign) => (
                      <motion.div
                        key={campaign.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl border border-brand-sand p-6 space-y-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-brand-text">{campaign.name}</h3>
                            <p className="text-sm text-brand-text-soft mt-1">
                              {campaign.umkm_name} • {campaign.category}
                            </p>
                          </div>
                          {getStatusBadge(campaign)}
                        </div>

                        <p className="text-sm text-brand-text">{campaign.description}</p>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-brand-text-soft">Budget</p>
                            <p className="font-bold">Rp {campaign.budget.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-brand-text-soft">Platform</p>
                            <p className="font-bold">{campaign.platform}</p>
                          </div>
                          <div>
                            <p className="text-brand-text-soft">Objective</p>
                            <p className="font-bold">{campaign.objective}</p>
                          </div>
                          <div>
                            <p className="text-brand-text-soft">Target Audience</p>
                            <p className="font-bold">{campaign.audience}</p>
                          </div>
                        </div>

                        {campaign.brief_text && (
                          <details className="pt-4 border-t border-brand-sand">
                            <summary className="cursor-pointer font-semibold text-sm">
                              Lihat Campaign Brief
                            </summary>
                            <div
                              className="mt-3 text-sm text-brand-text prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{ __html: campaign.brief_text }}
                            />
                          </details>
                        )}

                        {!campaign.campaign_influencers?.find(
                          (inf: any) => inf.influencer_id === user.id
                        ) && (
                          <button className="w-full py-2 px-4 bg-brand-text text-white rounded-xl hover:opacity-90 text-sm font-bold">
                            Lamar Kampanye Ini
                          </button>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "my-campaigns" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-brand-text">Kampanye Saya</h2>
              {myCampaigns.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-brand-sand">
                  <p className="text-brand-text-soft">Anda belum bergabung dengan kampanye apapun</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {myCampaigns.map((campaign) => {
                    const myInf = campaign.campaign_influencers?.find(
                      (inf: any) => inf.influencer_id === user.id
                    );

                    return (
                      <motion.div
                        key={campaign.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl border border-brand-sand p-6 space-y-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-brand-text">{campaign.name}</h3>
                            <p className="text-sm text-brand-text-soft">{campaign.umkm_name}</p>
                          </div>
                          {myInf && (
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-bold">
                              {myInf.status.replace(/_/g, " ").toUpperCase()}
                            </span>
                          )}
                        </div>

                        {myInf?.status === "brief_ready" || myInf?.status === "escrow_locked" ? (
                          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                            <p className="text-sm font-bold text-blue-700">Submit Konten Anda</p>
                            <input
                              type="url"
                              placeholder="Paste link konten Anda (YouTube, TikTok, Instagram, dll)"
                              value={submissionUrl}
                              onChange={(e) => setSubmissionUrl(e.target.value)}
                              className="w-full rounded-lg border border-blue-200 px-4 py-2 text-sm"
                            />
                            <button
                              onClick={() => handleSubmitContent(campaign.id)}
                              disabled={submitting || !submissionUrl.trim()}
                              className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 text-sm font-bold"
                            >
                              <Send className="w-4 h-4" />
                              {submitting ? "Submitting..." : "Submit Konten"}
                            </button>
                          </div>
                        ) : (
                          <p className="text-sm text-brand-text-soft">
                            Tunggu status menjadi "Brief Ready" untuk submit konten
                          </p>
                        )}

                        {myInf?.submission_url && (
                          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                            <p className="text-xs text-green-700 font-bold mb-1">Konten yang disubmit:</p>
                            <a
                              href={myInf.submission_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 text-sm hover:underline break-all"
                            >
                              {myInf.submission_url}
                            </a>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
