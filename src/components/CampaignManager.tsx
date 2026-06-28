import React, { useState } from "react";
import { Campaign } from "../types";
import { useCampaigns, useAI } from "../services/hooks";
import { motion } from "motion/react";
import { Plus, Edit2, Trash2, AlertCircle, CheckCircle, Loader } from "lucide-react";

interface CampaignManagerProps {
  umkmId: string;
}

export default function CampaignManager({ umkmId }: CampaignManagerProps) {
  const { campaigns, loading, error, createCampaign, updateCampaign, deleteCampaign } = useCampaigns(umkmId);
  const { generateBrief } = useAI();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [generatingBriefFor, setGeneratingBriefFor] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    objective: "",
    audience: "",
    platform: "",
    tone: "",
    budget: 0,
  });
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      description: "",
      objective: "",
      audience: "",
      platform: "",
      tone: "",
      budget: 0,
    });
    setEditingId(null);
    setShowForm(false);
    setFormError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.name || !formData.budget) {
      setFormError("Nama kampanye dan budget harus diisi");
      return;
    }

    try {
      if (editingId) {
        await updateCampaign(editingId, formData);
        setSuccessMessage("Kampanye berhasil diperbarui!");
      } else {
        await createCampaign(formData);
        setSuccessMessage("Kampanye berhasil dibuat!");
      }
      resetForm();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const handleDelete = async (campaignId: string) => {
    if (window.confirm("Yakin ingin menghapus kampanye ini?")) {
      try {
        await deleteCampaign(campaignId);
        setSuccessMessage("Kampanye berhasil dihapus!");
        setTimeout(() => setSuccessMessage(""), 3000);
      } catch (err: any) {
        setFormError(err.message);
      }
    }
  };

  const handleGenerateBrief = async (campaign: Campaign) => {
    setGeneratingBriefFor(campaign.id);
    try {
      const response = await generateBrief({
        campaignName: campaign.name,
        objective: campaign.objective,
        audience: campaign.audience,
        platform: campaign.platform,
        tone: campaign.tone,
        brandName: "Brand Name", // TODO: Get from user profile
        brandCategory: campaign.category,
      });

      await updateCampaign(campaign.id, {
        ...campaign,
        brief_text: response.brief,
      });

      setSuccessMessage("Brief berhasil digenerate!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      setFormError("Gagal generate brief: " + err.message);
    } finally {
      setGeneratingBriefFor(null);
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

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-brand-text">Kampanye Saya</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-text text-white rounded-xl hover:opacity-90 transition-all"
        >
          <Plus className="w-4 h-4" />
          Buat Kampanye Baru
        </button>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-brand-sand p-6 space-y-4"
        >
          <h3 className="font-bold text-lg">
            {editingId ? "Edit Kampanye" : "Buat Kampanye Baru"}
          </h3>

          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Nama Kampanye"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="col-span-2 rounded-xl border border-brand-sand px-4 py-2"
              />

              <input
                type="text"
                placeholder="Kategori"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="rounded-xl border border-brand-sand px-4 py-2"
              />

              <input
                type="number"
                placeholder="Budget"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                className="rounded-xl border border-brand-sand px-4 py-2"
              />

              <input
                type="text"
                placeholder="Objective"
                value={formData.objective}
                onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                className="rounded-xl border border-brand-sand px-4 py-2"
              />

              <input
                type="text"
                placeholder="Platform"
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                className="rounded-xl border border-brand-sand px-4 py-2"
              />

              <input
                type="text"
                placeholder="Tone"
                value={formData.tone}
                onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                className="rounded-xl border border-brand-sand px-4 py-2"
              />
            </div>

            <textarea
              placeholder="Deskripsi Kampanye"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-xl border border-brand-sand px-4 py-2 h-20"
            />

            <textarea
              placeholder="Target Audience"
              value={formData.audience}
              onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
              className="w-full rounded-xl border border-brand-sand px-4 py-2 h-20"
            />

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2 px-4 bg-brand-text text-white rounded-xl hover:opacity-90"
              >
                {editingId ? "Update" : "Buat"} Kampanye
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 py-2 px-4 border border-brand-sand rounded-xl hover:bg-brand-bg"
              >
                Batal
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <Loader className="w-6 h-6 animate-spin mx-auto" />
          <p className="text-brand-text-soft mt-2">Memuat kampanye...</p>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-brand-sand">
          <p className="text-brand-text-soft">Belum ada kampanye. Buat kampanye pertama Anda!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((campaign) => (
            <motion.div
              key={campaign.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-brand-sand p-6 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-brand-text">{campaign.name}</h3>
                  <p className="text-sm text-brand-text-soft">{campaign.description}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleGenerateBrief(campaign)}
                    disabled={generatingBriefFor === campaign.id}
                    className="px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50"
                  >
                    {generatingBriefFor === campaign.id ? "Generating..." : "Generate Brief"}
                  </button>
                  <button
                    onClick={() => {
                      setFormData(campaign as any);
                      setEditingId(campaign.id);
                      setShowForm(true);
                    }}
                    className="p-2 text-brand-text hover:bg-brand-bg rounded-lg"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(campaign.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

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
                  <p className="text-brand-text-soft">Status</p>
                  <p className="font-bold capitalize">{campaign.status}</p>
                </div>
                <div>
                  <p className="text-brand-text-soft">Influencers</p>
                  <p className="font-bold">{campaign.campaign_influencers?.length || 0}</p>
                </div>
              </div>

              {campaign.brief_text && (
                <details className="pt-3 border-t border-brand-sand">
                  <summary className="cursor-pointer font-semibold text-sm">Lihat Brief</summary>
                  <div
                    className="mt-3 text-sm text-brand-text prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: campaign.brief_text }}
                  />
                </details>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
