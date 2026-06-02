import { useState } from "react";
import { Globe, FileText, Star, MapPin, Check, ChevronRight, Users, Sparkles, Info, Plus, X } from "lucide-react";
import { useProductBuilderStore } from "@/features/products/stores/productBuilderStore";
import { normalizeHighlights } from "@/features/products/utils/normalizeHighlights";

const LANGUAGES = [
  "English", "French", "German", "Spanish", "Italian", "Portuguese", "Dutch", "Russian",
  "Chinese", "Japanese", "Korean", "Arabic", "Swahili",
];

const CONTENT_SECTIONS = [
  { id: "meeting", label: "Meeting & pickup", icon: MapPin },
  { id: "details", label: "Tour details", icon: FileText },
  { id: "languages", label: "Languages Offered", icon: Globe },
  { id: "inclusions", label: "Inclusions & exclusions", icon: Check },
  { id: "unique", label: "What makes your product unique", icon: Sparkles },
  { id: "travelerInfo", label: "Information travelers need from you", icon: Info },
];

export default function ProductContentStep() {
  const { product, errors, updateNested } = useProductBuilderStore();
  const { content } = product;
  const [activeSection, setActiveSection] = useState("meeting");

  const handleHighlightsChange = (value) => {
    updateNested(
      "content.highlights",
      value.split("\n").map((item) => item.trimEnd()),
    );
  };

  const highlightLines = Array.isArray(content.highlights) ? content.highlights : [];
  const highlights = normalizeHighlights(highlightLines);

  const toggleLanguage = (lang) => {
    const newLangs = content.languages.includes(lang)
      ? content.languages.filter((l) => l !== lang)
      : [...content.languages, lang];
    updateNested("content.languages", newLangs);
  };

  const isSectionComplete = (sectionId) => {
    switch (sectionId) {
      case "meeting":
        return !!content.meetingInstructions?.trim() && !!content.pickupDescription?.trim();
      case "details":
        return !!content.itinerary?.trim() && highlights.length > 0;
      case "languages":
        return content.languages?.length > 0;
      case "inclusions":
        return content.included?.length > 0 || content.excluded?.length > 0;
      case "unique":
        return !!content.uniqueSellingPoints?.trim();
      case "travelerInfo":
        return !!content.additionalInfo?.trim() || !!content.travelerRequirements?.trim() || content.whatToBring?.length > 0;
      default:
        return false;
    }
  };

  const renderSectionContent = () => {
    switch (activeSection) {
      case "meeting":
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#1e293b] mb-2">
                Meeting Point Instructions
              </label>
              <textarea
                value={content.meetingInstructions}
                onChange={(e) => updateNested("content.meetingInstructions", e.target.value)}
                rows={4}
                placeholder="Describe where and how customers will meet you or your guide..."
                className={`w-full px-4 py-2.5 border rounded-lg text-sm text-[#1e293b] placeholder:text-[#9e9e9e] focus:outline-none focus:ring-2 focus:ring-[#044b3b]/20 focus:border-[#044b3b] resize-none ${
                  errors.meetingInstructions ? "border-[#dc3545]" : "border-[#eaeaea]"
                }`}
              />
              {errors.meetingInstructions && (
                <p className="mt-1 text-xs text-[#dc3545]">{errors.meetingInstructions}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1e293b] mb-2">
                Pickup Description
              </label>
              <textarea
                value={content.pickupDescription}
                onChange={(e) => updateNested("content.pickupDescription", e.target.value)}
                rows={4}
                placeholder="Describe pickup services, locations, and any restrictions..."
                className="w-full px-4 py-2.5 border border-[#eaeaea] rounded-lg text-sm text-[#1e293b] placeholder:text-[#9e9e9e] focus:outline-none focus:ring-2 focus:ring-[#044b3b]/20 focus:border-[#044b3b] resize-none"
              />
            </div>
          </div>
        );

      case "details":
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#1e293b] mb-2">
                Full Itinerary
              </label>
              <textarea
                value={content.itinerary}
                onChange={(e) => updateNested("content.itinerary", e.target.value)}
                rows={6}
                placeholder="Day 1: Arrival and welcome...\nDay 2: Morning game drive..."
                className={`w-full px-4 py-2.5 border rounded-lg text-sm text-[#1e293b] placeholder:text-[#9e9e9e] focus:outline-none focus:ring-2 focus:ring-[#044b3b]/20 focus:border-[#044b3b] resize-none ${
                  errors.itinerary ? "border-[#dc3545]" : "border-[#eaeaea]"
                }`}
              />
              {errors.itinerary && (
                <p className="mt-1 text-xs text-[#dc3545]">{errors.itinerary}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1e293b] mb-2">
                <span className="flex items-center gap-2">
                  <Star size={16} className="text-[#64748b]" />
                  Tour Highlights
                </span>
              </label>
              <p className="text-xs text-[#64748b] mb-2">
                Add the key selling points of your tour. Enter one highlight per line.
              </p>
              <textarea
                value={highlightLines.join("\n")}
                onChange={(e) => handleHighlightsChange(e.target.value)}
                rows={6}
                placeholder={"Visit local markets and cultural sites\nGuided nature walk through scenic trails\nTraditional cooking experience\nPhoto opportunities at viewpoints"}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm text-[#1e293b] placeholder:text-[#9e9e9e] focus:outline-none focus:ring-2 focus:ring-[#044b3b]/20 focus:border-[#044b3b] resize-none ${
                  errors.highlights ? "border-[#dc3545]" : "border-[#eaeaea]"
                }`}
              />
              {errors.highlights && (
                <p className="mt-1 text-xs text-[#dc3545]">{errors.highlights}</p>
              )}
              {highlights.length > 0 && (
                <ul className="mt-3 space-y-1.5 rounded-lg border border-[#eaeaea] bg-[#f8fafc] p-3">
                  {highlights.map((item, index) => (
                    <li key={`${item}-${index}`} className="flex items-start gap-2 text-sm text-[#475569]">
                      <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#044b3b]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        );

      case "languages":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1e293b] mb-3">
                Languages Offered
              </label>
              {errors.languages && (
                <p className="mb-2 text-xs text-[#dc3545]">{errors.languages}</p>
              )}
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => toggleLanguage(lang)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      content.languages.includes(lang)
                        ? "bg-[#044b3b] text-white"
                        : "bg-[#f8fafc] text-[#64748b] border border-[#eaeaea] hover:bg-[#f0fdf4] hover:text-[#044b3b]"
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case "inclusions":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TagList
                label="What's Included"
                items={content.included}
                placeholder="e.g. Professional guide"
                onChange={(items) => updateNested("content.included", items)}
              />
              <TagList
                label="What's Excluded"
                items={content.excluded}
                placeholder="e.g. Personal expenses"
                onChange={(items) => updateNested("content.excluded", items)}
              />
            </div>
          </div>
        );

      case "unique":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1e293b] mb-2">
                What makes your product unique?
              </label>
              <p className="text-xs text-[#64748b] mb-2">
                Describe what sets your experience apart from others. This will be shown prominently on your product page.
              </p>
              <textarea
                value={content.uniqueSellingPoints}
                onChange={(e) => updateNested("content.uniqueSellingPoints", e.target.value)}
                rows={6}
                placeholder="Our tour is the only one that offers..."
                className={`w-full px-4 py-2.5 border rounded-lg text-sm text-[#1e293b] placeholder:text-[#9e9e9e] focus:outline-none focus:ring-2 focus:ring-[#044b3b]/20 focus:border-[#044b3b] resize-none ${
                  errors.uniqueSellingPoints ? "border-[#dc3545]" : "border-[#eaeaea]"
                }`}
              />
              {errors.uniqueSellingPoints && (
                <p className="mt-1 text-xs text-[#dc3545]">{errors.uniqueSellingPoints}</p>
              )}
            </div>
          </div>
        );

      case "travelerInfo":
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#1e293b] mb-2">
                What to Bring
              </label>
              <p className="text-xs text-[#64748b] mb-2">
                List items travelers should bring on the experience (one per line).
              </p>
              <textarea
                value={content.whatToBring.join("\n")}
                onChange={(e) => updateNested("content.whatToBring", e.target.value.split("\n").filter(Boolean))}
                rows={4}
                placeholder="Comfortable walking shoes\nWeather-appropriate clothing\nCamera or smartphone"
                className="w-full px-4 py-2.5 border border-[#eaeaea] rounded-lg text-sm text-[#1e293b] placeholder:text-[#9e9e9e] focus:outline-none focus:ring-2 focus:ring-[#044b3b]/20 focus:border-[#044b3b] resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1e293b] mb-2">
                Additional Information
              </label>
              <p className="text-xs text-[#64748b] mb-2">
                Any other important information travelers should know before booking.
              </p>
              <textarea
                value={content.additionalInfo}
                onChange={(e) => updateNested("content.additionalInfo", e.target.value)}
                rows={4}
                placeholder="Minimum age requirements, physical fitness level..."
                className="w-full px-4 py-2.5 border border-[#eaeaea] rounded-lg text-sm text-[#1e293b] placeholder:text-[#9e9e9e] focus:outline-none focus:ring-2 focus:ring-[#044b3b]/20 focus:border-[#044b3b] resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1e293b] mb-2">
                Traveler Requirements
              </label>
              <p className="text-xs text-[#64748b] mb-2">
                Specific requirements or restrictions for travelers (e.g., age, physical ability, documents).
              </p>
              <textarea
                value={content.travelerRequirements}
                onChange={(e) => updateNested("content.travelerRequirements", e.target.value)}
                rows={4}
                placeholder="Minimum age: 12 years old. Moderate fitness level required..."
                className="w-full px-4 py-2.5 border border-[#eaeaea] rounded-lg text-sm text-[#1e293b] placeholder:text-[#9e9e9e] focus:outline-none focus:ring-2 focus:ring-[#044b3b]/20 focus:border-[#044b3b] resize-none"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Sidebar Navigation */}
      <div className="lg:w-72 flex-shrink-0">
        <div className="bg-white rounded-lg border border-[#eaeaea] overflow-hidden">
          <div className="px-4 py-3 bg-[#f8fafc] border-b border-[#eaeaea]">
            <h3 className="text-xs font-bold text-[#1e293b] uppercase tracking-wider">
              Product Content
            </h3>
          </div>
          <nav className="divide-y divide-[#eaeaea]">
            {CONTENT_SECTIONS.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              const isComplete = isSectionComplete(section.id);
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors ${
                    isActive
                      ? "bg-[#f0fdf4] text-[#044b3b] font-medium"
                      : "text-[#1e293b] hover:bg-[#f8fafc]"
                  }`}
                >
                  <div className={`flex-shrink-0 ${isActive ? "text-[#044b3b]" : "text-[#64748b]"}`}>
                    <Icon size={18} />
                  </div>
                  <span className="flex-1">{section.label}</span>
                  {isComplete && (
                    <Check size={16} className="text-[#00d67f] flex-shrink-0" />
                  )}
                  {!isComplete && isActive && (
                    <ChevronRight size={16} className="text-[#044b3b] flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-w-0">
        <div className="bg-white rounded-lg border border-[#eaeaea] p-4 md:p-6">
          <div className="mb-4 pb-3 border-b border-[#eaeaea]">
            <h3 className="text-base font-semibold text-[#1e293b]">
              {CONTENT_SECTIONS.find((s) => s.id === activeSection)?.label}
            </h3>
          </div>
          {renderSectionContent()}
        </div>
      </div>
    </div>
  );
}

function TagList({ label, items, placeholder, onChange }) {
  const [inputValue, setInputValue] = useState("");

  const addItem = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    if (items.includes(trimmed)) return;
    onChange([...items, trimmed]);
    setInputValue("");
  };

  const removeItem = (index) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addItem();
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-[#1e293b] mb-2">{label}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 min-w-0 px-4 py-2.5 border border-[#eaeaea] rounded-lg text-sm text-[#1e293b] placeholder:text-[#9e9e9e] focus:outline-none focus:ring-2 focus:ring-[#044b3b]/20 focus:border-[#044b3b]"
        />
        <button
          type="button"
          onClick={addItem}
          disabled={!inputValue.trim()}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-[#044b3b] text-white rounded-lg text-sm font-medium hover:bg-[#033629] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Add</span>
        </button>
      </div>
      <p className="text-xs text-[#64748b] mt-1">Type an item and press Enter to add it</p>
      {items.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {items.map((item, index) => (
            <span
              key={`${item}-${index}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white text-[#1e293b] border border-[#e0e0e0] rounded-md text-sm shadow-sm"
            >
              {item}
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="text-[#9e9e9e] hover:text-[#dc3545] transition-colors"
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
