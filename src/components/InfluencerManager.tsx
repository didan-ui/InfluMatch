import React, { useState, useEffect } from "react";
import { useCampaignInfluencers, useUsers, useEscrow } from "../services/hooks";
import { motion } from "motion/react";
import { Plus, Trash2, AlertCircle, CheckCircle, Users, Lock, Unlock } from "lucide-react";

interface InfluencerManagerProps {
  campaignId: string;
  campaignName: string;
  campaignBudget: number;
}

export default function InfluencerManager({
  campaignId,
  campaignName,
  campaignBudget,
}: InfluencerManagerProps) {
  const { influencers, addInfluencer, removeInfluencer, updateInfluencerStatus } =
    useCampaignInfluencers(campaignId);
  const { users: allInfluencers } = useUsers("influencer");
  const { lock: lockEscrow } = useEscrow();

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedInfluencerId, setSelectedInfluencerId] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [lockingEscrow, setLockingEscrow] = useState<string | null>(null);

  const handleAddInfluencer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!selectedInfluencerId) {
      setFormError("Pilih influencer");
      return;
    }

    try {
      await addInfluencer(selectedInfluencerId);
      setSuccessMessage("Influencer berhasil ditambahkan!");
      setSelectedInfluencerId("");
      setShowAddForm(false);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const handleRemoveInfluencer = async (influencerId: string) => {
    if (window.confirm("Yakin ingin menghapus influencer dari kampanye ini?")) {
      try {
        await removeInfluencer(influencerId);
        setSuccessMessage("Influencer berhasil dihapus!");
        setTimeout(() => setSuccessMessage(""), 3000);
      } catch (err: any) {
        setFormError(err.message);
      }
    }
  };

  const handleStatusChange = async (influencerId: string, newStatus: string) => {
    try {
      await updateInfluencerStatus(influencerId, newStatus);
      setSuccessMessage("Status berhasil diperbarui!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const handleLockEscrow = async (influencerId: string, influencerName: string) => {
    setLockingEscrow(influencerId);
    try {
      // Calculate escrow amount (for now, just 50% of budget divided by number of influencers)
      const amount = Math.floor(campaignBudget / Math.max(influencers.length, 1));

      await lockEscrow(campaignId, influencerId, amount);
      setSuccessMessage(`Escrow terkunci untuk ${influencerName}!`);

      // Update status to escrow_locked
      await updateInfluencerStatus(influencerId, "escrow_locked");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setLockingEscrow(null);
    }
  };

  const usedInfluencerIds = influencers.map((inf) => inf.influencer_id);
  const availableInfluencers = allInfluencers.filter(
    (inf) => !usedInfluencerIds.includes(inf.id) && inf.is_approved
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "invited":
        return "bg-yellow-100 text-yellow-700";
      case "brief_ready":
        return "bg-blue-100 text-blue-700";
      case "escrow_locked":
        return "bg-purple-100 text-purple-700";
      case "content_uploaded":
        return "bg-orange-100 text-orange-700";
      case "completed":
        return "bg-green-100 text-green-700";
      case "disputed":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-6">
      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 flex items-center gap-2"
        >
          <CheckCircle className="w-5 h-5" />
          {successMessage}
        </motion.div>
      )}

      {formError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {formError}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          <h3 className="text-xl font-bold text-brand-text">
            Influencer Kampanye ({influencers.length})
          </h3>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          disabled={availableInfluencers.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-brand-text text-white rounded-xl hover:opacity-90 disabled:opacity-50 transition-all"
        >
          <Plus className="w-4 h-4" />
          Tambah Influencer
        </button>
      </div>

      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-brand-sand p-6 space-y-4"
        >
          <form onSubmit={handleAddInfluencer} className="space-y-4">
            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">
                {formError}
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-brand-text mb-2">
                Pilih Influencer
              </label>
              <select
                value={selectedInfluencerId}
                onChange={(e) => setSelectedInfluencerId(e.target.value)}
                className="w-full rounded-xl border border-brand-sand px-4 py-2"
              >
                <option value="">-- Pilih Influencer --</option>
                {availableInfluencers.map((inf) => (
                  <option key={inf.id} value={inf.id}>
                    {inf.name} (@{(inf as any).handle || "N/A"}) - {(inf as any).followers_num || 0} followers
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2 px-4 bg-brand-text text-white rounded-xl hover:opacity-90"
              >
                Tambah Influencer
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="flex-1 py-2 px-4 border border-brand-sand rounded-xl hover:bg-brand-bg"
              >
                Batal
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {influencers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-brand-sand">
          <p className="text-brand-text-soft">Belum ada influencer di kampanye ini</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {influencers.map((influencer) => (
            <motion.div
              key={influencer.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-brand-sand p-6 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-bold text-lg text-brand-text">
                    {influencer.influencer_name}
                  </h4>
                  <span className={`inline-block px-3 py-1 text-xs font-bold rounded-lg ${getStatusColor(influencer.status)}`}>
                    {influencer.status.replace(/_/g, " ").toUpperCase()}
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveInfluencer(influencer.influencer_id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {influencer.submission_url && (
                <div>
                  <p className="text-xs text-brand-text-soft mb-1">Konten yang diupload:</p>
                  <a
                    href={influencer.submission_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 text-sm hover:underline break-all"
                  >
                    {influencer.submission_url}
                  </a>
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                <select
                  value={influencer.status}
                  onChange={(e) => handleStatusChange(influencer.influencer_id, e.target.value)}
                  className="text-xs px-3 py-1.5 border border-brand-sand rounded-lg"
                >
                  <option value="invited">Invited</option>
                  <option value="brief_ready">Brief Ready</option>
                  <option value="escrow_locked">Escrow Locked</option>
                  <option value="content_uploaded">Content Uploaded</option>
                  <option value="completed">Completed</option>
                  <option value="disputed">Disputed</option>
                </select>

                {influencer.status !== "escrow_locked" && (
                  <button
                    onClick={() =>
                      handleLockEscrow(influencer.influencer_id, influencer.influencer_name)
                    }
                    disabled={lockingEscrow === influencer.influencer_id}
                    className="text-xs px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 disabled:opacity-50 flex items-center gap-1"
                  >
                    <Lock className="w-3 h-3" />
                    Lock Escrow
                  </button>
                )}

                {influencer.status === "escrow_locked" && (
                  <span className="text-xs px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Escrow Locked
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
