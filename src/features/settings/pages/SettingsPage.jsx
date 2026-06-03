import { useEffect, useRef, useState } from "react";
import { User, Save, Loader2, Building2, Upload, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { fetchCurrentUser, updateCurrentUser, uploadSupplierLogo } from "../api";
import { getAuthToken } from "@/stores/authStore";
import { useAuthStore } from "@/stores/authStore";
import { config } from "@/config";

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
        if (err.code !== "AUTH_REQUIRED") {
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
    } catch (err) {
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
        <Loader2 size={28} className="animate-spin text-[#044b3b]" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-[#1e293b]">Settings</h1>
        <p className="text-sm text-[#64748b] mt-1">Manage your account profile</p>
      </div>

      <div className="max-w-2xl">
        <div className="bg-white rounded-lg border border-[#eaeaea] p-4 md:p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-[#f0fdf4] flex items-center justify-center">
              <User size={20} className="text-[#044b3b]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#1e293b]">Profile</h2>
              <p className="text-sm text-[#64748b]">Update your personal information</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#1e293b] mb-1.5">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-2.5 border border-[#eaeaea] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#044b3b]/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1e293b] mb-1.5">Email</label>
              <input
                type="email"
                value={form.email || authUser?.email || ""}
                disabled
                className="w-full px-4 py-2.5 border border-[#eaeaea] rounded-lg text-sm bg-[#f8fafc] text-[#64748b] cursor-not-allowed"
              />
              <p className="text-xs text-[#9e9e9e] mt-1">Email is managed through your login provider</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1e293b] mb-1.5">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                className="w-full px-4 py-2.5 border border-[#eaeaea] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#044b3b]/20"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1e293b] mb-1.5">Language</label>
                <select
                  value={form.language}
                  onChange={(e) => setForm((prev) => ({ ...prev, language: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-[#eaeaea] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#044b3b]/20"
                >
                  <option value="en">English</option>
                  <option value="fr">French</option>
                  <option value="sw">Swahili</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1e293b] mb-1.5">Timezone</label>
                <input
                  type="text"
                  value={form.timezone}
                  onChange={(e) => setForm((prev) => ({ ...prev, timezone: e.target.value }))}
                  placeholder="e.g. Africa/Nairobi"
                  className="w-full px-4 py-2.5 border border-[#eaeaea] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#044b3b]/20"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#044b3b] text-white rounded-lg text-sm font-medium hover:bg-[#033629] transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save Changes
              </button>
            </div>
          </form>
        </div>

        {/* Company Logo */}
        <div className="bg-white rounded-lg border border-[#eaeaea] p-4 md:p-6 mt-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-[#f0fdf4] flex items-center justify-center">
              <Building2 size={20} className="text-[#044b3b]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#1e293b]">Company Logo</h2>
              <p className="text-sm text-[#64748b]">Upload your business logo</p>
            </div>
          </div>

          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              {logoPreview ? (
                <div className="relative w-24 h-24 rounded-lg border border-[#eaeaea] overflow-hidden">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : currentLogoUrl ? (
                <div className="relative w-24 h-24 rounded-lg border border-[#eaeaea] overflow-hidden">
                  <img
                    src={currentLogoUrl}
                    alt="Company logo"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-lg border-2 border-dashed border-[#eaeaea] flex items-center justify-center bg-[#f8fafc]">
                  <Building2 size={32} className="text-[#9e9e9e]" />
                </div>
              )}
            </div>

            <div className="flex-1 space-y-3">
              {logoPreview ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleUploadLogo}
                    disabled={uploadingLogo}
                    className="flex items-center gap-2 px-4 py-2 bg-[#044b3b] text-white rounded-lg text-sm font-medium hover:bg-[#033629] transition-colors disabled:opacity-50"
                  >
                    {uploadingLogo ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Upload size={16} />
                    )}
                    {uploadingLogo ? "Uploading..." : "Upload Logo"}
                  </button>
                  <button
                    onClick={handleRemoveSelected}
                    className="flex items-center gap-2 px-4 py-2 text-[#64748b] rounded-lg text-sm font-medium hover:bg-[#f8fafc] transition-colors"
                  >
                    <X size={16} />
                    Cancel
                  </button>
                </div>
              ) : currentLogoUrl ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 bg-[#044b3b] text-white rounded-lg text-sm font-medium hover:bg-[#033629] transition-colors"
                  >
                    <Upload size={16} />
                    Change Logo
                  </button>
                  <button
                    onClick={handleRemoveLogo}
                    className="flex items-center gap-2 px-4 py-2 text-[#dc2626] rounded-lg text-sm font-medium hover:bg-[#fef2f2] transition-colors"
                  >
                    <Trash2 size={16} />
                    Remove
                  </button>
                </div>
              ) : (
                <div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 bg-[#044b3b] text-white rounded-lg text-sm font-medium hover:bg-[#033629] transition-colors"
                  >
                    <Upload size={16} />
                    Select Logo
                  </button>
                </div>
              )}

              <p className="text-xs text-[#64748b]">
                Supports JPG, PNG, WebP. Max 5MB. Square images work best.
              </p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoSelect}
          />
        </div>

        <p className="text-xs text-[#64748b] mt-4">
          Manage payout methods under Finance → Payout Methods. Tour availability is configured in each product&apos;s schedule step.
        </p>
      </div>
    </div>
  );
}
