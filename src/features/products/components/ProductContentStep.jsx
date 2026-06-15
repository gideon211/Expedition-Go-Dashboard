import { useState } from "react";
import { Globe, FileText, Star, MapPin, Check, ChevronRight, Users, Sparkles, Info, Plus, X, Clock, Pencil } from "lucide-react";
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
        return content.itinerary?.length > 0 && highlights.length > 0;
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
              <label className="block text-sm font-medium text-slate-800 mb-2">
                Meeting Point Instructions
              </label>
              <textarea
                value={content.meetingInstructions}
                onChange={(e) => updateNested("content.meetingInstructions", e.target.value)}
                rows={4}
                placeholder="Describe where and how customers will meet you or your guide..."
                className={`w-full px-4 py-2.5 border rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none resize-none ${
                  errors.meetingInstructions ? "border-red-500" : "border-slate-200"
                }`}
              />
              {errors.meetingInstructions && (
                <p className="mt-1 text-xs text-red-500">{errors.meetingInstructions}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-2">
                Pickup Description
              </label>
              <textarea
                value={content.pickupDescription}
                onChange={(e) => updateNested("content.pickupDescription", e.target.value)}
                rows={4}
                placeholder="Describe pickup services, locations, and any restrictions..."
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none resize-none"
              />
            </div>
          </div>
        );

      case "details":
        return (
          <div className="space-y-6">
            <ItineraryBuilder
              items={content.itinerary || []}
              onChange={(items) => updateNested("content.itinerary", items)}
              error={errors.itinerary}
            />

            <div>
              <label className="block text-sm font-medium text-slate-800 mb-2">
                <span className="flex items-center gap-2">
                  <Star size={16} className="text-slate-500" />
                  Tour Highlights
                </span>
              </label>
              <p className="text-xs text-slate-500 mb-2">
                Add the key selling points of your tour. Enter one highlight per line.
              </p>
              <textarea
                value={highlightLines.join("\n")}
                onChange={(e) => handleHighlightsChange(e.target.value)}
                rows={6}
                placeholder={"Visit local markets and cultural sites\nGuided nature walk through scenic trails\nTraditional cooking experience\nPhoto opportunities at viewpoints"}
                className={`w-full px-4 py-2.5 border rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none resize-none ${
                  errors.highlights ? "border-red-500" : "border-slate-200"
                }`}
              />
              {errors.highlights && (
                <p className="mt-1 text-xs text-red-500">{errors.highlights}</p>
              )}
              {highlights.length > 0 ? (
                <ul className="mt-3 space-y-1.5 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  {highlights.map((item, index) => (
                    <li key={`${item}-${index}`} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-slate-400 italic">No highlights added yet. Enter them above.</p>
              )}
            </div>
          </div>
        );

      case "languages":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-3">
                Languages Offered
              </label>
              {errors.languages && (
                <p className="mb-2 text-xs text-red-500">{errors.languages}</p>
              )}
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => toggleLanguage(lang)}
                    className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                      content.languages.includes(lang)
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-50 text-slate-500 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-600"
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
              {(content.languages || []).length === 0 && (
                <p className="mt-3 text-sm text-slate-400 italic">No languages selected. Select at least one above.</p>
              )}
            </div>
          </div>
        );

      case "inclusions":
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <TagList
                label="What's Included"
                accent="green"
                items={content.included}
                placeholder="e.g. Professional guide"
                onChange={(items) => updateNested("content.included", items)}
              />
              <TagList
                label="What's Excluded"
                accent="red"
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
              <label className="block text-sm font-medium text-slate-800 mb-2">
                What makes your product unique?
              </label>
              <p className="text-xs text-slate-500 mb-2">
                Describe what sets your experience apart from others. This will be shown prominently on your product page.
              </p>
              <textarea
                value={content.uniqueSellingPoints}
                onChange={(e) => updateNested("content.uniqueSellingPoints", e.target.value)}
                rows={6}
                placeholder="Our tour is the only one that offers..."
                className={`w-full px-4 py-2.5 border rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none resize-none ${
                  errors.uniqueSellingPoints ? "border-red-500" : "border-slate-200"
                }`}
              />
              {errors.uniqueSellingPoints && (
                <p className="mt-1 text-xs text-red-500">{errors.uniqueSellingPoints}</p>
              )}
            </div>
          </div>
        );

      case "travelerInfo":
        return (
          <div className="space-y-6">
            <TagList
              label="What to Bring"
              accent="green"
              items={content.whatToBring}
              placeholder="e.g. Comfortable walking shoes"
              onChange={(items) => updateNested("content.whatToBring", items)}
            />
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-2">
                Additional Information
              </label>
              <p className="text-xs text-slate-500 mb-2">
                Any other important information travelers should know before booking.
              </p>
              <textarea
                value={content.additionalInfo}
                onChange={(e) => updateNested("content.additionalInfo", e.target.value)}
                rows={4}
                placeholder="Minimum age requirements, physical fitness level..."
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-2">
                Traveler Requirements
              </label>
              <p className="text-xs text-slate-500 mb-2">
                Specific requirements or restrictions for travelers (e.g., age, physical ability, documents).
              </p>
              <textarea
                value={content.travelerRequirements}
                onChange={(e) => updateNested("content.travelerRequirements", e.target.value)}
                rows={4}
                placeholder="Minimum age: 12 years old. Moderate fitness level required..."
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none resize-none"
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
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Product Content
            </h3>
          </div>
          <nav className="divide-y divide-slate-200">
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
                      ? "bg-emerald-50 text-emerald-600 font-medium"
                      : "text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <div className={`flex-shrink-0 ${isActive ? "text-emerald-600" : "text-slate-500"}`}>
                    <Icon size={18} />
                  </div>
                  <span className="flex-1">{section.label}</span>
                  {isComplete && (
                    <Check size={16} className="text-emerald-500 flex-shrink-0" />
                  )}
                  {!isComplete && isActive && (
                    <ChevronRight size={16} className="text-emerald-600 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-w-0">
        <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-6 shadow-sm">
          <div className="mb-4 pb-3 border-b border-slate-200">
            <h3 className="text-base font-semibold text-slate-800">
              {CONTENT_SECTIONS.find((s) => s.id === activeSection)?.label}
            </h3>
          </div>
          {renderSectionContent()}
        </div>
      </div>
    </div>
  );
}

function ItineraryBuilder({ items, onChange, error }) {
  const [day, setDay] = useState("");
  const [time, setTime] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);

  const resetForm = () => {
    setDay("");
    setTime("");
    setTitle("");
    setDescription("");
    setEditingIndex(null);
  };

  const saveItem = () => {
    if (!title.trim() && !description.trim()) return;
    const newItem = { day: day.trim(), time: time.trim(), title: title.trim(), description: description.trim() };

    if (editingIndex !== null) {
      const updated = [...items];
      updated[editingIndex] = newItem;
      onChange(updated);
    } else {
      onChange([...items, newItem]);
    }
    resetForm();
  };

  const startEdit = (index) => {
    const item = items[index];
    setDay(item.day || "");
    setTime(item.time || "");
    setTitle(item.title || "");
    setDescription(item.description || "");
    setEditingIndex(index);
  };

  const removeItem = (index) => {
    if (editingIndex === index) resetForm();
    onChange(items.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      saveItem();
    }
  };

  const isEditing = editingIndex !== null;

  return (
    <div>
      <label className="block text-sm font-medium text-slate-800 mb-2">Full Itinerary</label>
      <p className="text-xs text-slate-500 mb-3">Add time, title, and description for each itinerary stop.</p>

      {error && <p className="mb-3 text-xs text-red-500">{error}</p>}

      {/* Existing items */}
      {items.length > 0 && (
        <div className="space-y-3 mb-4">
          {items.map((item, index) => (
            <div key={index} className="flex gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex flex-col items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 flex-shrink-0 mt-1.5" />
                {index < items.length - 1 && <div className="w-0.5 flex-1 bg-slate-200 my-1" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    {(item.day || item.time) && (
                      <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                        {[item.day, item.time].filter(Boolean).join(" — ")}
                      </span>
                    )}
                    {item.title && (
                      <p className="text-sm font-medium text-slate-800">{item.title}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => startEdit(index)}
                      className="p-1.5 text-slate-400 hover:text-emerald-600 transition-colors flex-shrink-0"
                      aria-label="Edit itinerary item"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="p-1.5 text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
                      aria-label="Remove itinerary item"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
                {item.description && (
                  <p className="text-sm text-slate-500 mt-0.5">{item.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {items.length === 0 && !isEditing && (
        <div className="mb-4 p-6 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center">
          <Clock size={24} className="mx-auto text-slate-400 mb-2" />
          <p className="text-sm text-slate-500">No itinerary stops added yet</p>
          <p className="text-xs text-slate-400 mt-1">Add your first stop below</p>
        </div>
      )}

      {/* Add / Edit form */}
      <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3 shadow-sm">
        {isEditing && (
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Editing Item {editingIndex + 1}</span>
            <button
              type="button"
              onClick={resetForm}
              className="text-xs text-slate-500 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              <span className="flex items-center gap-1">
                <Clock size={12} />
                Day
              </span>
            </label>
            <input
              type="text"
              value={day}
              onChange={(e) => setDay(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Day 1"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Time</label>
            <input
              type="text"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. 09:00"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Morning Game Drive"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            placeholder="Describe what happens at this stop..."
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none resize-none"
          />
        </div>
        <div className="flex justify-end gap-2">
          {isEditing && (
            <button
              type="button"
              onClick={resetForm}
              className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-500 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              <X size={16} />
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={saveItem}
            disabled={!title.trim() && !description.trim()}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isEditing ? <Pencil size={16} /> : <Plus size={16} />}
            {isEditing ? "Save" : "Add Itinerary Item"}
          </button>
        </div>
      </div>
    </div>
  );
}

function TagList({ label, items, placeholder, onChange, accent = "green" }) {
  const [inputValue, setInputValue] = useState("");
  const isGreen = accent === "green";

  const accentColor = isGreen ? "emerald" : "red";
  const accentBg = isGreen ? "bg-emerald-50" : "bg-red-50";
  const accentBorder = isGreen ? "border-emerald-200" : "border-red-200";
  const accentRing = isGreen ? "focus:ring-emerald-600/20 focus:border-emerald-600" : "focus:ring-red-500/20 focus:border-red-500";

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
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className={`px-5 py-3.5 border-b border-slate-100 ${isGreen ? "" : ""}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-2 h-2 rounded-full ${isGreen ? "bg-emerald-500" : "bg-red-500"}`} />
            <h3 className="text-sm font-semibold text-slate-800">{label}</h3>
          </div>
          {items.length > 0 && (
            <span className={`inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full text-[11px] font-semibold ${
              isGreen ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
            }`}>
              {items.length}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        {/* Input row */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className={`w-full px-4 py-2.5 border rounded-xl text-sm text-slate-800 placeholder:text-slate-400 bg-white focus:outline-none ${accentRing} ${
                inputValue.trim() ? "border-slate-300" : "border-slate-200"
              }`}
            />
          </div>
          <button
            type="button"
            onClick={addItem}
            disabled={!inputValue.trim()}
            className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Plus size={16} />
            <span>Add</span>
          </button>
        </div>

        {/* Items list */}
        {items.length > 0 && (
          <div className="mt-4 space-y-1.5">
            {items.map((item, index) => (
              <div
                key={`${item}-${index}`}
                className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border transition-all hover:shadow-sm group ${
                  isGreen ? "border-emerald-100 bg-emerald-50/30 hover:border-emerald-200 hover:bg-emerald-50/60" : "border-red-100 bg-red-50/30 hover:border-red-200 hover:bg-red-50/60"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isGreen ? "bg-emerald-400" : "bg-red-400"}`} />
                  <span className="text-sm text-slate-700 truncate">{item}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="flex-shrink-0 p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {items.length === 0 && (
          <div className="mt-4 flex flex-col items-center justify-center py-6 px-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2.5 ${
              isGreen ? "bg-emerald-100" : "bg-red-100"
            }`}>
              <Check size={18} className={isGreen ? "text-emerald-500" : "text-red-500"} />
            </div>
            <p className="text-sm text-slate-500 text-center">No items added yet</p>
            <p className="text-xs text-slate-400 mt-0.5">Type above and press Enter or click Add</p>
          </div>
        )}
      </div>
    </div>
  );
}
