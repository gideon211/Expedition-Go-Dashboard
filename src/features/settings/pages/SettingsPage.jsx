import { useEffect, useRef, useState } from "react";
import { Check, Loader2, ImagePlus, Upload, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { fetchCurrentUser, updateCurrentUser, uploadSupplierLogo } from "../api";
import { getAuthToken } from "@/stores/authStore";
import { useAuthStore } from "@/stores/authStore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { config } from "@/config";

const FADE_UP = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

export default function SettingsPage() {
  const authUser = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    language: "en",
    timezone: "UTC",
    email: "",
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [currentLogoUrl, setCurrentLogoUrl] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    async function loadProfile() {
      if (!getAuthToken()) {
        setLoading(false);
        return;
      }

      try {
        const user = await fetchCurrentUser();
        if (user) {
          setForm({
            name: user.name || "",
            phone: user.phone || "",
            language: user.language || "en",
            timezone: user.timezone || "UTC",
            email: user.email || "",
          });
          setCurrentLogoUrl(user.logoUrl || null);
        }
    } catch (err) {
      if (err?.code !== "AUTH_REQUIRED") {
        toast.error("Failed to load profile");
      }
    } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const handleLogoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > config.upload.maxFileSize) {
      toast.error("Logo must be smaller than 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleRemoveSelected = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUploadLogo = async () => {
    if (!logoFile) return;

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("logo", logoFile);

      const result = await uploadSupplierLogo(formData);

      if (result?.logoUrl) {
        setCurrentLogoUrl(result.logoUrl);
        useAuthStore.setState((state) => ({
          user: { ...state.user, logoUrl: result.logoUrl },
        }));
        toast.success("Logo uploaded");
        handleRemoveSelected();
      } else {
        toast.error("Failed to upload logo");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to upload logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    try {
      await updateCurrentUser({ logoUrl: null });
      setCurrentLogoUrl(null);
      useAuthStore.setState((state) => ({
        user: { ...state.user, logoUrl: null },
      }));
      toast.success("Logo removed");
    } catch {
      toast.error("Failed to remove logo");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await updateCurrentUser({
        name: form.name,
        phone: form.phone,
        language: form.language,
        timezone: form.timezone,
      });

      const updatedUser = response.data?.data?.user;
      if (updatedUser) {
        useAuthStore.setState((state) => ({
          user: { ...state.user, ...updatedUser },
        }));
      }

      toast.success("Profile updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center min-h-[40vh]">
        <Loader2 size={28} className="animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="p-5 md:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-1 h-10 bg-gradient-to-b from-emerald-500 to-emerald-300 rounded-full" />
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">Settings</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage your account profile</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Profile Card */}
        <motion.div variants={FADE_UP} initial="initial" animate="animate"
          className="bg-white rounded-xl border border-slate-100 shadow-sm shadow-slate-900/5 overflow-hidden"
        >
          <form onSubmit={handleSave} className="px-6 py-6 space-y-5">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full overflow-hidden shadow-lg bg-slate-50">
                {(authUser?.photoURL || authUser?.avatar) ? (
                  <img src={authUser.photoURL || authUser.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-emerald-600">{(authUser?.name || "S").charAt(0).toUpperCase()}</span>
                  </div>
                )}
              </div>
              <h2 className="text-base font-semibold text-slate-800 mt-3">Profile</h2>
              <p className="text-xs text-slate-500 mt-0.5">Update your personal information</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                value={form.email || authUser?.email || ""}
                disabled
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
              />
              <p className="text-xs text-slate-400 mt-1.5">Email is managed through your login provider</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Language</label>
                <Select
                  value={form.language}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, language: value }))}
                >
                  <SelectTrigger className="w-full h-[42px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="sw">Swahili</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Timezone</label>
                <input
                  type="text"
                  value={form.timezone}
                  onChange={(e) => setForm((prev) => ({ ...prev, timezone: e.target.value }))}
                  placeholder="e.g. Africa/Nairobi"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 transition-all"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-all disabled:opacity-50 "
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                Save Changes
              </button>
            </div>
          </form>
        </motion.div>

        {/* Company Logo Card */}
        <motion.div variants={FADE_UP} initial="initial" animate="animate"
          className="bg-white rounded-xl border border-slate-100 shadow-sm shadow-slate-900/5 overflow-hidden"
        >
          <div className="px-6 py-5 border-b border-slate-100">
            <div>
              <h2 className="text-base font-semibold text-slate-800">Company Logo</h2>
              <p className="text-xs text-slate-500">Upload your business logo</p>
            </div>
          </div>

          <div className="px-6 py-5">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0">
                {logoPreview ? (
                  <div className="relative w-24 h-24 rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                  </div>
                ) : currentLogoUrl ? (
                  <div className="relative w-24 h-24 rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <img
                      src={currentLogoUrl}
                      alt="Company logo"
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = "none"; }}
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50">
                    <ImagePlus size={32} className="text-slate-300" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-3">
                {logoPreview ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleUploadLogo}
                      disabled={uploadingLogo}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-medium hover:bg-emerald-700 transition-all disabled:opacity-50 "
                    >
                      {uploadingLogo ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                      {uploadingLogo ? "Uploading..." : "Upload Logo"}
                    </button>
                    <button
                      onClick={handleRemoveSelected}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-slate-600 rounded-xl text-xs font-medium hover:bg-slate-50 transition-all"
                    >
                      <X size={16} /> Cancel
                    </button>
                  </div>
                ) : currentLogoUrl ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-medium hover:bg-emerald-700 transition-all "
                    >
                      <Upload size={13} /> Change Logo
                    </button>
                    <button
                      onClick={handleRemoveLogo}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-red-600 rounded-xl text-xs font-medium hover:bg-red-50 transition-all"
                    >
                      <Trash2 size={16} /> Remove
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-medium hover:bg-emerald-700 transition-all "
                  >
                    <Upload size={13} /> Select Logo
                  </button>
                )}

                <p className="text-xs text-slate-400">Supports JPG, PNG, WebP. Max 5MB. Square images work best.</p>
              </div>
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoSelect} />
          </div>
        </motion.div>

        <p className="text-xs text-slate-400">
          Manage payout methods under Finance → Payout Methods. Tour availability is configured in each
          product&apos;s schedule step.
        </p>
      </div>
    </div>
  );
}
