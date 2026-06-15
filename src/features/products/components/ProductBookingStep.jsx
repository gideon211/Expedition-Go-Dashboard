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
        <label className="block text-sm font-medium text-slate-800 mb-3">Booking Confirmation Type</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CONFIRMATION_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => updateNested("bookingRules.confirmationType", type.value)}
              className={`p-4 rounded-xl border-2 text-left transition-colors ${
                bookingRules.confirmationType === type.value
                  ? "border-emerald-600 bg-emerald-50"
                  : "border-slate-200 hover:border-emerald-600/30"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    bookingRules.confirmationType === type.value
                      ? "border-emerald-600 bg-emerald-600"
                      : "border-slate-200"
                  }`}
                >
                  {bookingRules.confirmationType === type.value && <Check size={12} className="text-white" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{type.label}</p>
                  <p className="text-xs text-slate-500">{type.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Group Size & Advance Booking */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">
            <span className="flex items-center gap-2">
              <Clock size={16} className="text-slate-500" />
              Min Advance Booking (hrs)
            </span>
          </label>
          <input
            type="number"
            value={bookingRules.minAdvanceBookingHours}
            onChange={(e) => updateNested("bookingRules.minAdvanceBookingHours", Number(e.target.value))}
            min="0"
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">
            <span className="flex items-center gap-2">
              <Users size={16} className="text-slate-500" />
              Min Group Size
            </span>
          </label>
          <input
            type="number"
            value={bookingRules.minGroupSize}
            onChange={(e) => updateNested("bookingRules.minGroupSize", Number(e.target.value))}
            min="1"
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">
            <span className="flex items-center gap-2">
              <Users size={16} className="text-slate-500" />
              Max Group Size
            </span>
          </label>
          <input
            type="number"
            value={bookingRules.maxGroupSize}
            onChange={(e) => updateNested("bookingRules.maxGroupSize", Number(e.target.value))}
            min="1"
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">Refund Percentage (%)</label>
          <input
            type="number"
            value={bookingRules.refundPercentage}
            onChange={(e) => updateNested("bookingRules.refundPercentage", Number(e.target.value))}
            min="0"
            max="100"
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none"
          />
        </div>
      </div>

      {/* Instant Booking Toggle */}
      <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
        <input
          type="checkbox"
          id="instantBooking"
          checked={bookingRules.instantBooking}
          onChange={(e) => updateNested("bookingRules.instantBooking", e.target.checked)}
          className="w-5 h-5 rounded border-slate-200 text-emerald-600 focus:ring-slate-300"
        />
        <label htmlFor="instantBooking" className="text-sm font-medium text-slate-800">
          Enable Instant Booking
        </label>
        <span className="text-xs text-slate-500">Bookings are confirmed immediately without manual review</span>
      </div>

      {/* Meeting Point */}
      <div className="space-y-4">
        <div ref={meetingContainerRef} className="relative">
          <label className="block text-sm font-medium text-slate-800 mb-2">
            <span className="flex items-center gap-2">
              <MapPin size={16} className="text-slate-500" />
              Meeting Point Name <span className="text-red-500">*</span>
            </span>
          </label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={meetingInputRef}
              type="text"
              value={meetingQuery}
              onChange={handleMeetingInputChange}
              onKeyDown={handleMeetingKeyDown}
              onFocus={() => { if (results.length > 0) setShowSuggestions(true); }}
              placeholder="Search for a location or type a meeting point name..."
              className={`w-full pl-10 pr-10 py-2.5 border rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none ${
                errors.meetingPoint ? "border-red-500" : "border-slate-200"
              }`}
            />
            {meetingQuery && (
              <button
                type="button"
                onClick={handleMeetingClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-500"
                aria-label="Clear meeting point"
              >
                <X size={14} />
              </button>
            )}
          </div>
          {errors.meetingPoint && <p className="mt-1 text-xs text-red-500">{errors.meetingPoint}</p>}

          {/* Suggestion dropdown */}
          {showSuggestions && (
            <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
              {loading && (
                <div className="flex items-center gap-2 px-4 py-3 text-sm text-slate-500">
                  <Loader2 size={14} className="animate-spin" />
                  Searching locations...
                </div>
              )}
              {!loading && error && (
                <div className="px-4 py-3 text-sm text-red-500">
                  {error}
                  <p className="text-xs text-slate-400 mt-1">You can still type a meeting point name manually.</p>
                </div>
              )}
              {!loading && !error && results.length === 0 && meetingQuery.trim().length >= 2 && (
                <div className="px-4 py-3 text-sm text-slate-500">
                  No locations found.
                  <p className="text-xs text-slate-400 mt-1">Try a different search or type the name manually.</p>
                </div>
              )}
              {!loading && results.map((result, index) => (
                <div
                  key={`${result.source}-${index}`}
                  onClick={() => handleMeetingSelect(result)}
                  onMouseEnter={() => setHighlightedIdx(index)}
                  className={`px-4 py-2.5 cursor-pointer text-sm border-b border-slate-100 last:border-0 ${
                    index === highlightedIdx
                      ? "bg-emerald-50 text-emerald-600"
                      : "text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <div className="font-medium truncate">{result.formatted}</div>
                  <div className="text-xs text-slate-500 truncate">
                    {[result.city, result.region, result.country].filter(Boolean).join(", ")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 mb-2">
            Meeting Point Address <span className="text-red-500">*</span>
          </label>
          <textarea
            value={bookingRules.meetingPointAddress}
            onChange={(e) => updateNested("bookingRules.meetingPointAddress", e.target.value)}
            rows={3}
            placeholder="Full street address..."
            className={`w-full px-4 py-2.5 border rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none resize-none ${
              errors.meetingPointAddress ? "border-red-500" : "border-slate-200"
            }`}
          />
          {errors.meetingPointAddress && <p className="mt-1 text-xs text-red-500">{errors.meetingPointAddress}</p>}
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

        <p className="text-[10px] text-slate-400">
          Location data ©{" "}
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-500">
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
            className="w-4 h-4 rounded border-slate-200 text-emerald-600 focus:ring-slate-300"
          />
          <span className="text-sm font-medium text-slate-800">Pickup Service Available</span>
        </label>

        {bookingRules.pickupAvailable && (
          <div>
            <label className="block text-xs text-slate-500 mb-1">Pickup Details</label>
            <textarea
              value={bookingRules.pickupDetails}
              onChange={(e) => updateNested("bookingRules.pickupDetails", e.target.value)}
              rows={3}
              placeholder="Describe pickup locations, times, and any restrictions..."
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none resize-none"
            />
          </div>
        )}
      </div>

    </div>
  );
}
