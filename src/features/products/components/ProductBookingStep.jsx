import { useRef, useState, useCallback, useEffect } from "react";
import { MapPin, Users, Clock, Check, Search, Loader2, X } from "lucide-react";
import { useProductBuilderStore } from "@/features/products/stores/productBuilderStore";
import LocationMapPicker from "@/components/shared/LocationMapPicker";
import { useGeocoding } from "@/hooks/useGeocoding";
import config from "@/config";

const CONFIRMATION_TYPES = [
  { value: "instant", label: "Instant Confirmation", description: "Booking is confirmed immediately" },
  { value: "manual", label: "Manual Confirmation", description: "You review and confirm each booking" },
];

export default function ProductBookingStep() {
  const { product, errors, updateNested } = useProductBuilderStore();
  const { bookingRules } = product;

  const apiKey = config.maps?.geoapifyApiKey || "";
  const { search, clear, results, loading, error } = useGeocoding(apiKey);

  const [meetingQuery, setMeetingQuery] = useState(bookingRules.meetingPoint || "");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState(-1);
  const meetingInputRef = useRef(null);
  const meetingContainerRef = useRef(null);

  useEffect(() => {
    setMeetingQuery(bookingRules.meetingPoint || "");
  }, [bookingRules.meetingPoint]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (meetingContainerRef.current && !meetingContainerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMeetingInputChange = (e) => {
    const value = e.target.value;
    setMeetingQuery(value);
    updateNested("bookingRules.meetingPoint", value);
    setHighlightedIdx(-1);
    if (value.trim().length >= 2) {
      search(value);
      setShowSuggestions(true);
    } else {
      clear();
      setShowSuggestions(false);
    }
  };

  const handleMeetingSelect = useCallback(
    (result) => {
      setMeetingQuery(result.formatted);
      setShowSuggestions(false);
      setHighlightedIdx(-1);
      updateNested("bookingRules.meetingPoint", result.formatted);
      if (result.formatted) {
        updateNested("bookingRules.meetingPointAddress", result.formatted);
      }
      if (result.latitude != null) updateNested("bookingRules.meetingPointLat", result.latitude);
      if (result.longitude != null) updateNested("bookingRules.meetingPointLng", result.longitude);
    },
    [updateNested],
  );

  const handleMeetingKeyDown = (e) => {
    if (!showSuggestions || results.length === 0) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIdx((prev) => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIdx((prev) => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIdx >= 0) {
          handleMeetingSelect(results[highlightedIdx]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setHighlightedIdx(-1);
        break;
    }
  };

  const handleMeetingClear = () => {
    setMeetingQuery("");
    clear();
    setShowSuggestions(false);
    updateNested("bookingRules.meetingPoint", "");
    meetingInputRef.current?.focus();
  };

  return (
    <div className="space-y-6">
      {/* Confirmation Type */}
      <div>
        <label className="block text-sm font-medium text-[#1e293b] mb-3">Booking Confirmation Type</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CONFIRMATION_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => updateNested("bookingRules.confirmationType", type.value)}
              className={`p-4 rounded-lg border-2 text-left transition-colors ${
                bookingRules.confirmationType === type.value
                  ? "border-[#044b3b] bg-[#f0fdf4]"
                  : "border-[#eaeaea] hover:border-[#044b3b]/30"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    bookingRules.confirmationType === type.value
                      ? "border-[#044b3b] bg-[#044b3b]"
                      : "border-[#eaeaea]"
                  }`}
                >
                  {bookingRules.confirmationType === type.value && <Check size={12} className="text-white" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1e293b]">{type.label}</p>
                  <p className="text-xs text-[#64748b]">{type.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Group Size & Advance Booking */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div>
          <label className="block text-sm font-medium text-[#1e293b] mb-2">
            <span className="flex items-center gap-2">
              <Clock size={16} className="text-[#64748b]" />
              Min Advance Booking (hrs)
            </span>
          </label>
          <input
            type="number"
            value={bookingRules.minAdvanceBookingHours}
            onChange={(e) => updateNested("bookingRules.minAdvanceBookingHours", Number(e.target.value))}
            min="0"
            className="w-full px-4 py-2.5 border border-[#eaeaea] rounded-lg text-sm text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#044b3b]/20 focus:border-[#044b3b]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1e293b] mb-2">
            <span className="flex items-center gap-2">
              <Users size={16} className="text-[#64748b]" />
              Min Group Size
            </span>
          </label>
          <input
            type="number"
            value={bookingRules.minGroupSize}
            onChange={(e) => updateNested("bookingRules.minGroupSize", Number(e.target.value))}
            min="1"
            className="w-full px-4 py-2.5 border border-[#eaeaea] rounded-lg text-sm text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#044b3b]/20 focus:border-[#044b3b]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1e293b] mb-2">
            <span className="flex items-center gap-2">
              <Users size={16} className="text-[#64748b]" />
              Max Group Size
            </span>
          </label>
          <input
            type="number"
            value={bookingRules.maxGroupSize}
            onChange={(e) => updateNested("bookingRules.maxGroupSize", Number(e.target.value))}
            min="1"
            className="w-full px-4 py-2.5 border border-[#eaeaea] rounded-lg text-sm text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#044b3b]/20 focus:border-[#044b3b]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1e293b] mb-2">Refund Percentage (%)</label>
          <input
            type="number"
            value={bookingRules.refundPercentage}
            onChange={(e) => updateNested("bookingRules.refundPercentage", Number(e.target.value))}
            min="0"
            max="100"
            className="w-full px-4 py-2.5 border border-[#eaeaea] rounded-lg text-sm text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#044b3b]/20 focus:border-[#044b3b]"
          />
        </div>
      </div>

      {/* Instant Booking Toggle */}
      <div className="flex items-center gap-3 p-4 bg-[#f8fafc] rounded-lg border border-[#eaeaea]">
        <input
          type="checkbox"
          id="instantBooking"
          checked={bookingRules.instantBooking}
          onChange={(e) => updateNested("bookingRules.instantBooking", e.target.checked)}
          className="w-5 h-5 rounded border-[#eaeaea] text-[#044b3b] focus:ring-[#044b3b]"
        />
        <label htmlFor="instantBooking" className="text-sm font-medium text-[#1e293b]">
          Enable Instant Booking
        </label>
        <span className="text-xs text-[#64748b]">Bookings are confirmed immediately without manual review</span>
      </div>

      {/* Meeting Point */}
      <div className="space-y-4">
        <div ref={meetingContainerRef} className="relative">
          <label className="block text-sm font-medium text-[#1e293b] mb-2">
            <span className="flex items-center gap-2">
              <MapPin size={16} className="text-[#64748b]" />
              Meeting Point Name <span className="text-[#dc3545]">*</span>
            </span>
          </label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9e9e9e]" />
            <input
              ref={meetingInputRef}
              type="text"
              value={meetingQuery}
              onChange={handleMeetingInputChange}
              onKeyDown={handleMeetingKeyDown}
              onFocus={() => { if (results.length > 0) setShowSuggestions(true); }}
              placeholder="Search for a location or type a meeting point name..."
              className={`w-full pl-10 pr-10 py-2.5 border rounded-lg text-sm text-[#1e293b] placeholder:text-[#9e9e9e] focus:outline-none focus:ring-2 focus:ring-[#044b3b]/20 focus:border-[#044b3b] ${
                errors.meetingPoint ? "border-[#dc3545]" : "border-[#eaeaea]"
              }`}
            />
            {meetingQuery && (
              <button
                type="button"
                onClick={handleMeetingClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9e9e9e] hover:text-[#64748b]"
                aria-label="Clear meeting point"
              >
                <X size={14} />
              </button>
            )}
          </div>
          {errors.meetingPoint && <p className="mt-1 text-xs text-[#dc3545]">{errors.meetingPoint}</p>}

          {/* Suggestion dropdown */}
          {showSuggestions && (
            <div className="absolute z-50 mt-1 w-full bg-white border border-[#eaeaea] rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {loading && (
                <div className="flex items-center gap-2 px-4 py-3 text-sm text-[#64748b]">
                  <Loader2 size={14} className="animate-spin" />
                  Searching locations...
                </div>
              )}
              {!loading && error && (
                <div className="px-4 py-3 text-sm text-[#dc3545]">
                  {error}
                  <p className="text-xs text-[#9e9e9e] mt-1">You can still type a meeting point name manually.</p>
                </div>
              )}
              {!loading && !error && results.length === 0 && meetingQuery.trim().length >= 2 && (
                <div className="px-4 py-3 text-sm text-[#64748b]">
                  No locations found.
                  <p className="text-xs text-[#9e9e9e] mt-1">Try a different search or type the name manually.</p>
                </div>
              )}
              {!loading && results.map((result, index) => (
                <div
                  key={`${result.source}-${index}`}
                  onClick={() => handleMeetingSelect(result)}
                  onMouseEnter={() => setHighlightedIdx(index)}
                  className={`px-4 py-2.5 cursor-pointer text-sm border-b border-[#f1f5f9] last:border-0 ${
                    index === highlightedIdx
                      ? "bg-[#f0fdf4] text-[#044b3b]"
                      : "text-[#1e293b] hover:bg-[#f8fafc]"
                  }`}
                >
                  <div className="font-medium truncate">{result.formatted}</div>
                  <div className="text-xs text-[#64748b] truncate">
                    {[result.city, result.region, result.country].filter(Boolean).join(", ")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1e293b] mb-2">
            Meeting Point Address <span className="text-[#dc3545]">*</span>
          </label>
          <textarea
            value={bookingRules.meetingPointAddress}
            onChange={(e) => updateNested("bookingRules.meetingPointAddress", e.target.value)}
            rows={3}
            placeholder="Full street address..."
            className={`w-full px-4 py-2.5 border rounded-lg text-sm text-[#1e293b] placeholder:text-[#9e9e9e] focus:outline-none focus:ring-2 focus:ring-[#044b3b]/20 focus:border-[#044b3b] resize-none ${
              errors.meetingPointAddress ? "border-[#dc3545]" : "border-[#eaeaea]"
            }`}
          />
          {errors.meetingPointAddress && <p className="mt-1 text-xs text-[#dc3545]">{errors.meetingPointAddress}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-[#1e293b] mb-2">Latitude</label>
            <input
              type="number"
              step="any"
              value={bookingRules.meetingPointLat ?? ""}
              onChange={(e) => updateNested("bookingRules.meetingPointLat", e.target.value === "" ? null : Number(e.target.value))}
              placeholder="e.g., 40.7647"
              className="w-full px-4 py-2.5 border border-[#eaeaea] rounded-lg text-sm text-[#1e293b] placeholder:text-[#9e9e9e] focus:outline-none focus:ring-2 focus:ring-[#044b3b]/20 focus:border-[#044b3b]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1e293b] mb-2">Longitude</label>
            <input
              type="number"
              step="any"
              value={bookingRules.meetingPointLng ?? ""}
              onChange={(e) => updateNested("bookingRules.meetingPointLng", e.target.value === "" ? null : Number(e.target.value))}
              placeholder="e.g., -73.973"
              className="w-full px-4 py-2.5 border border-[#eaeaea] rounded-lg text-sm text-[#1e293b] placeholder:text-[#9e9e9e] focus:outline-none focus:ring-2 focus:ring-[#044b3b]/20 focus:border-[#044b3b]"
            />
          </div>
        </div>

        {/* Meeting Point Location Map */}
        <div className="md:col-span-2">
          <LocationMapPicker
            accessToken={config.maps.mapboxAccessToken}
            initialLat={bookingRules.meetingPointLat}
            initialLng={bookingRules.meetingPointLng}
            label="Set Meeting Point on Map"
            placeholder="Search for the meeting location..."
            onSelect={(result) => {
              updateNested("bookingRules.meetingPointLat", result.latitude);
              updateNested("bookingRules.meetingPointLng", result.longitude);
              if (result.formatted) {
                const name = result.formatted.split(",")[0];
                updateNested("bookingRules.meetingPoint", name);
                setMeetingQuery(name);
                updateNested("bookingRules.meetingPointAddress", result.formatted);
              }
            }}
          />
        </div>

        <p className="text-[10px] text-[#9e9e9e]">
          Location data ©{" "}
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#64748b]">
            OpenStreetMap
          </a>{" "}
          contributors
        </p>
      </div>

      {/* Pickup */}
      <div className="space-y-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={bookingRules.pickupAvailable}
            onChange={(e) => updateNested("bookingRules.pickupAvailable", e.target.checked)}
            className="w-4 h-4 rounded border-[#eaeaea] text-[#044b3b] focus:ring-[#044b3b]"
          />
          <span className="text-sm font-medium text-[#1e293b]">Pickup Service Available</span>
        </label>

        {bookingRules.pickupAvailable && (
          <div>
            <label className="block text-xs text-[#64748b] mb-1">Pickup Details</label>
            <textarea
              value={bookingRules.pickupDetails}
              onChange={(e) => updateNested("bookingRules.pickupDetails", e.target.value)}
              rows={3}
              placeholder="Describe pickup locations, times, and any restrictions..."
              className="w-full px-4 py-2.5 border border-[#eaeaea] rounded-lg text-sm text-[#1e293b] placeholder:text-[#9e9e9e] focus:outline-none focus:ring-2 focus:ring-[#044b3b]/20 focus:border-[#044b3b] resize-none"
            />
          </div>
        )}
      </div>

    </div>
  );
}
