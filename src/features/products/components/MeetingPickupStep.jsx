import { useRef } from "react";
import { Plus, X, MapPin, Info } from "lucide-react";
import { useProductBuilderStore } from "@/features/products/stores/productBuilderStore";
import LocationMapPicker from "@/components/shared/LocationMapPicker";
import LocationAutocomplete from "@/components/shared/LocationAutocomplete";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PICKUP_AREAS = ["Hotel", "Port", "Airport", "Other"];
const PICKUP_TYPES = ["Van", "Bus", "Car", "Minibus", "Other"];
const LEAD_TIME_OPTIONS = [
  { value: 0, label: "0 minutes" },
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 45, label: "45 minutes" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
  { value: 150, label: "2.5 hours" },
  { value: 180, label: "3 hours" },
  { value: 240, label: "4 hours" },
  { value: 300, label: "5 hours" },
];

function inputCls(error) {
  return `w-full px-4 py-2.5 border rounded-xl text-sm text-slate-800 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600/30 focus:border-emerald-600 transition-all ${
    error ? "border-red-400" : "border-slate-200/80 hover:border-slate-300"
  }`;
}

function labelCls(optional) {
  return `text-xs font-medium ${optional ? "text-slate-400" : "text-slate-500"} uppercase tracking-wider`;
}

function SectionCard({ children, className = "" }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-5 md:p-6 ${className}`}>
      {children}
    </div>
  );
}

export default function MeetingPickupStep() {
  const { product, errors, updateNested } = useProductBuilderStore();
  const { content } = product;

  const fileInputRef = useRef(null);

  const handlePickupToggle = (enabled) => {
    updateNested("content.pickupAvailable", enabled);
  };

  const togglePickupArea = (area) => {
    const current = content.pickupAreas || [];
    const next = current.includes(area)
      ? current.filter((a) => a !== area)
      : [...current, area];
    updateNested("content.pickupAreas", next);
  };

  const addLocation = (area) => {
    const locations = [...(content.pickupLocations || [])];
    locations.push({ area, address: "", latitude: null, longitude: null });
    updateNested("content.pickupLocations", locations);
  };

  const updateLocation = (index, data) => {
    const locations = [...(content.pickupLocations || [])];
    locations[index] = { ...locations[index], ...data };
    updateNested("content.pickupLocations", locations);
  };

  const handlePickupLocationSelect = (index, result) => {
    updateLocation(index, {
      address: result.formatted,
      latitude: result.latitude,
      longitude: result.longitude,
    });
  };

  const removeLocation = (index) => {
    const locations = [...(content.pickupLocations || [])];
    locations.splice(index, 1);
    updateNested("content.pickupLocations", locations);
  };

  const handlePickupPhotoUpload = (e) => {
    const files = e.target.files;
    if (!files?.length) return;
    const current = content.pickupPhotoUrls || [];
    const newPhotos = Array.from(files).map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      url: URL.createObjectURL(file),
      file,
    }));
    updateNested("content.pickupPhotoUrls", [...current, ...newPhotos]);
    e.target.value = "";
  };

  const removePickupPhoto = (id) => {
    const current = content.pickupPhotoUrls || [];
    updateNested("content.pickupPhotoUrls", current.filter((p) => p.id !== id));
  };

  const handleMapSelect = (result) => {
    updateNested("content.meetingPointLat", result.latitude);
    updateNested("content.meetingPointLng", result.longitude);
    if (result.formatted) {
      const name = result.formatted.split(",")[0];
      updateNested("content.meetingPoint", name);
      updateNested("content.meetingPointAddress", result.formatted);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-medium tracking-tight text-slate-900">
          Tell us how and where you meet your travelers
        </h2>
        <div className="mt-3 flex items-start gap-2.5 p-3.5 bg-blue-50/50 rounded-2xl">
          <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700 leading-relaxed">
            Travelers want to book products with accurate pickup locations so they can plan their day.
            Adding specific meeting and pickup points will help them find your product.
          </p>
        </div>
      </div>

      {/* Do you pick up travelers? */}
      <SectionCard>
        <div className="space-y-2">
          <label className={labelCls()}>Do you pick up travelers?</label>
          <Select
            value={content.pickupAvailable ? "yes" : "no"}
            onValueChange={(value) => handlePickupToggle(value === "yes")}
          >
            <SelectTrigger className="max-w-md">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="no">No, we meet all travelers at a meeting point</SelectItem>
              <SelectItem value="yes">Yes, we pick up travelers</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </SectionCard>

      {/* Pickup Section */}
      {content.pickupAvailable && (
        <>
          <SectionCard>
            <div className="space-y-5">
              <h3 className="text-base font-medium text-slate-900">
                Now tell us where you pick up travelers
              </h3>

              {/* Pickup Areas */}
              <div className="space-y-2.5">
                <label className={labelCls()}>Do you pickup from general areas?</label>
                <div className="flex flex-wrap gap-2">
                  {PICKUP_AREAS.map((area) => {
                    const selected = (content.pickupAreas || []).includes(area);
                    return (
                      <button
                        key={area}
                        type="button"
                        onClick={() => togglePickupArea(area)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                          selected
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "bg-slate-50 text-slate-600 border border-slate-200/80 hover:border-slate-300 hover:bg-slate-100"
                        }`}
                      >
                        {area}
                      </button>
                    );
                  })}
                </div>
                {errors.pickupAreas && (
                  <p className="text-xs text-red-500">{errors.pickupAreas}</p>
                )}
              </div>

              {/* Pickup Locations */}
              {(content.pickupAreas || []).length > 0 && (
                <div className="space-y-3">
                  <label className={labelCls()}>Enter any specific locations you pick up from</label>
                  {(content.pickupAreas || []).map((area) => {
                    const areaLocations = (content.pickupLocations || [])
                      .map((loc, idx) => ({ ...loc, idx }))
                      .filter((loc) => loc.area === area);
                    return (
                      <div key={area} className="space-y-2">
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          {area}
                        </p>
                        {areaLocations.map((loc) => (
                          <div key={loc.idx} className="flex items-center gap-2">
                            <div className="flex-1">
                              <LocationAutocomplete
                                initialQuery={loc.address}
                                onSelect={(result) => handlePickupLocationSelect(loc.idx, result)}
                                onChange={(val) => updateLocation(loc.idx, { address: val })}
                                hideLabel
                                hideAttribution
                                placeholder={`Enter ${area.toLowerCase()} location`}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeLocation(loc.idx)}
                              className="p-2 text-slate-400 hover:text-red-500 transition-colors shrink-0"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addLocation(area)}
                          className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                        >
                          <Plus size={16} />
                          Add a location
                        </button>
                      </div>
                    );
                  })}
                  {errors.pickupLocations && (
                    <p className="text-xs text-red-500">{errors.pickupLocations}</p>
                  )}
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard>
            <div className="space-y-5">
              {/* Custom Pickup Point */}
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={content.pickupCustomLocation || false}
                  onChange={(e) => updateNested("content.pickupCustomLocation", e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600/20 transition-shadow"
                />
                <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">
                  Allow travelers to specify their own pickup point
                </span>
              </label>

              <div className="h-px bg-gradient-to-r from-slate-100 to-transparent" />

              {/* Pickup Lead Time */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <label className={labelCls()}>
                  How long before your activity start time do you pick up travelers?
                </label>
                <Select
                  value={String(content.pickupLeadTime ?? 30)}
                  onValueChange={(value) => updateNested("content.pickupLeadTime", Number(value))}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_TIME_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="h-px bg-gradient-to-r from-slate-100 to-transparent" />

              {/* Drop-off */}
              <div className="space-y-3">
                <label className={labelCls()}>Do you offer drop-off?</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => updateNested("content.dropoffAvailable", true)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      content.dropoffAvailable
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-slate-50 text-slate-600 border border-slate-200/80 hover:border-slate-300"
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => updateNested("content.dropoffAvailable", false)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      !content.dropoffAvailable
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-slate-50 text-slate-600 border border-slate-200/80 hover:border-slate-300"
                    }`}
                  >
                    No
                  </button>
                </div>
                {content.dropoffAvailable && (
                  <div className="space-y-3 pt-1 pl-0">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={content.dropoffSameAsPickup !== false}
                        onChange={(e) => updateNested("content.dropoffSameAsPickup", e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600/20"
                      />
                      <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">
                        Yes, same location(s) as pickup
                      </span>
                    </label>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                      <label className={labelCls()}>
                        How much time do you allocate to drop-offs?
                      </label>
                      <Select
                        value={String(content.dropoffTime ?? 0)}
                        onValueChange={(value) => updateNested("content.dropoffTime", Number(value))}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LEAD_TIME_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </SectionCard>

          {/* Additional Pickup Details */}
          <SectionCard>
            <div className="space-y-2.5">
              <label className={labelCls()}>
                Additional pickup details
                <span className="text-slate-300 font-normal"> (Optional)</span>
              </label>
              <p className="text-xs text-slate-400 leading-relaxed">
                This will be displayed on both the product page and travelers&apos; tickets.
                E.g. how to find the pickup location, how travelers can find you.
              </p>
              <textarea
                value={content.pickupAdditionalDetails || ""}
                onChange={(e) => updateNested("content.pickupAdditionalDetails", e.target.value)}
                rows={3}
                placeholder="How to find the pickup location, how travelers can find you..."
                className={inputCls() + " resize-none"}
              />
            </div>
          </SectionCard>

          {/* Pickup Type & Appearance + Photos */}
          <SectionCard>
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-medium text-slate-900">
                  How will you pickup travelers?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Provide details on the pickup type and its features to help travelers identify their pickup
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelCls()}>Pickup type</label>
                  <Select
                    value={content.pickupType || ""}
                    onValueChange={(value) => updateNested("content.pickupType", value)}
                  >
                    <SelectTrigger className={errors.pickupType ? "border-red-400" : ""}>
                      <SelectValue placeholder="Select pickup type" />
                    </SelectTrigger>
                    <SelectContent>
                      {PICKUP_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.pickupType && (
                    <p className="text-xs text-red-500">{errors.pickupType}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className={labelCls(true)}>
                    Describe the pickup&apos;s appearance
                  </label>
                  <input
                    type="text"
                    value={content.pickupAppearance || ""}
                    onChange={(e) => updateNested("content.pickupAppearance", e.target.value)}
                    placeholder="&quot;A Mercedes van with plate REG123&quot;"
                    className={inputCls()}
                  />
                </div>
              </div>

              <div className="h-px bg-gradient-to-r from-slate-100 to-transparent" />

              {/* Pickup Photos */}
              <div className="space-y-3">
                <div>
                  <label className={labelCls(true)}>Upload photo</label>
                  <p className="text-xs text-slate-400 mt-1">
                    Choose a high-quality photo that helps travelers easily identify the vehicle or location.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {(content.pickupPhotoUrls || []).map((photo) => (
                    <div key={photo.id} className="relative group">
                      <img
                        src={photo.url}
                        alt="Pickup"
                        className="w-24 h-24 object-cover rounded-xl border border-slate-200/80"
                      />
                      <button
                        type="button"
                        onClick={() => removePickupPhoto(photo.id)}
                        className="absolute top-1.5 right-1.5 p-1 bg-white/80 backdrop-blur-sm rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-white"
                      >
                        <X size={14} className="text-slate-500" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-emerald-600/40 hover:text-emerald-600 hover:bg-emerald-50/30 transition-all duration-200 bg-slate-50/50"
                  >
                    <Plus size={20} strokeWidth={1.5} />
                    <span className="text-[10px] font-medium">Add photos</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePickupPhotoUpload}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          </SectionCard>
        </>
      )}

      {/* Meeting Point Section */}
      <SectionCard>
        <div className="space-y-5">
          <h3 className="text-base font-medium text-slate-900">
            Where will you meet travelers that don&apos;t require pickup?
          </h3>

          <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
            <LocationMapPicker
              initialLat={content.meetingPointLat}
              initialLng={content.meetingPointLng}
              label="Set Meeting Point"
              placeholder="Search for the meeting location..."
              onSelect={handleMapSelect}
            />
          </div>

          <div className="space-y-1.5">
            <label className={labelCls()}>Or enter manually</label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={content.meetingPoint || ""}
                onChange={(e) => updateNested("content.meetingPoint", e.target.value)}
                placeholder="Enter meeting point name (e.g., Accra Coliseum or Lapaz)"
                className={inputCls(errors.meetingPoint) + " pl-10"}
              />
            </div>
            {errors.meetingPoint && (
              <p className="text-xs text-red-500">{errors.meetingPoint}</p>
            )}
          </div>
        </div>
      </SectionCard>

      {/* Meeting Instructions */}
      <SectionCard>
        <div className="space-y-1.5">
          <label className={labelCls()}>Meeting instructions</label>
          <textarea
            value={content.meetingInstructions}
            onChange={(e) => updateNested("content.meetingInstructions", e.target.value)}
            rows={4}
            placeholder="Please only include information about how to find the meeting point (e.g. Go to the corner of Stockton and Post Street and look for a guide wearing a red hat)"
            className={`${inputCls(errors.meetingInstructions)} resize-none`}
          />
          {errors.meetingInstructions && (
            <p className="text-xs text-red-500">{errors.meetingInstructions}</p>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
