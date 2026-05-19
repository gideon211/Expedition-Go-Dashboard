import { Plus, Trash2, Globe, FileText, Star } from "lucide-react";
import { useProductBuilderStore } from "@/features/products/stores/productBuilderStore";

const LANGUAGES = [
  "English", "French", "German", "Spanish", "Italian", "Portuguese", "Dutch", "Russian",
  "Chinese", "Japanese", "Korean", "Arabic", "Swahili",
];

export default function ProductContentStep() {
  const { product, updateNested } = useProductBuilderStore();
  const { content } = product;

  const handleHighlightChange = (index, value) => {
    const newHighlights = [...content.highlights];
    newHighlights[index] = value;
    updateNested("content.highlights", newHighlights);
  };

  const addHighlight = () => {
    updateNested("content.highlights", [...content.highlights, ""]);
  };

  const removeHighlight = (index) => {
    const newHighlights = content.highlights.filter((_, i) => i !== index);
    updateNested("content.highlights", newHighlights);
  };

  const toggleLanguage = (lang) => {
    const newLangs = content.languages.includes(lang)
      ? content.languages.filter((l) => l !== lang)
      : [...content.languages, lang];
    updateNested("content.languages", newLangs);
  };

  return (
    <div className="space-y-6">
      {/* Itinerary */}
      <div>
        <label className="block text-sm font-medium text-[#1e293b] mb-2">
          <span className="flex items-center gap-2">
            <FileText size={16} className="text-[#64748b]" />
            Full Itinerary
          </span>
        </label>
        <textarea
          value={content.itinerary}
          onChange={(e) => updateNested("content.itinerary", e.target.value)}
          rows={6}
          placeholder="Day 1: Arrival and welcome...\nDay 2: Morning game drive..."
          className="w-full px-4 py-2.5 border border-[#eaeaea] rounded-lg text-sm text-[#1e293b] placeholder:text-[#9e9e9e] focus:outline-none focus:ring-2 focus:ring-[#044b3b]/20 focus:border-[#044b3b] resize-none"
        />
      </div>

      {/* Highlights */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[#1e293b]">
            <span className="flex items-center gap-2">
              <Star size={16} className="text-[#64748b]" />
              Highlights
            </span>
          </h3>
          <button
            onClick={addHighlight}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#044b3b] bg-[#f0fdf4] rounded-md hover:bg-[#dcfce7] transition-colors"
          >
            <Plus size={12} />
            Add Highlight
          </button>
        </div>
        <div className="space-y-2">
          {content.highlights.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                value={item}
                onChange={(e) => handleHighlightChange(index, e.target.value)}
                placeholder={`Highlight ${index + 1}`}
                className="flex-1 px-4 py-2 border border-[#eaeaea] rounded-lg text-sm text-[#1e293b] placeholder:text-[#9e9e9e] focus:outline-none focus:ring-2 focus:ring-[#044b3b]/20 focus:border-[#044b3b]"
              />
              <button
                onClick={() => removeHighlight(index)}
                className="p-2 text-[#9e9e9e] hover:text-[#dc3545] transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {content.highlights.length === 0 && (
            <p className="text-sm text-[#64748b] italic">No highlights added yet</p>
          )}
        </div>
      </div>

      {/* Included/Excluded Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-[#1e293b] mb-2">Included Summary</label>
          <textarea
            value={content.included.join("\n")}
            onChange={(e) => updateNested("content.included", e.target.value.split("\n").filter(Boolean))}
            rows={4}
            placeholder="Professional guide\nTransportation\nMeals\n..."
            className="w-full px-4 py-2.5 border border-[#eaeaea] rounded-lg text-sm text-[#1e293b] placeholder:text-[#9e9e9e] focus:outline-none focus:ring-2 focus:ring-[#044b3b]/20 focus:border-[#044b3b] resize-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#1e293b] mb-2">Excluded Summary</label>
          <textarea
            value={content.excluded.join("\n")}
            onChange={(e) => updateNested("content.excluded", e.target.value.split("\n").filter(Boolean))}
            rows={4}
            placeholder="Flights\nPersonal expenses\nTravel insurance\n..."
            className="w-full px-4 py-2.5 border border-[#eaeaea] rounded-lg text-sm text-[#1e293b] placeholder:text-[#9e9e9e] focus:outline-none focus:ring-2 focus:ring-[#044b3b]/20 focus:border-[#044b3b] resize-none"
          />
        </div>
      </div>

      {/* Meeting Instructions */}
      <div>
        <label className="block text-sm font-medium text-[#1e293b] mb-2">Meeting Instructions</label>
        <textarea
          value={content.meetingInstructions}
          onChange={(e) => updateNested("content.meetingInstructions", e.target.value)}
          rows={3}
          placeholder="Detailed instructions on where and how to meet the guide..."
          className="w-full px-4 py-2.5 border border-[#eaeaea] rounded-lg text-sm text-[#1e293b] placeholder:text-[#9e9e9e] focus:outline-none focus:ring-2 focus:ring-[#044b3b]/20 focus:border-[#044b3b] resize-none"
        />
      </div>

      {/* Additional Info */}
      <div>
        <label className="block text-sm font-medium text-[#1e293b] mb-2">Additional Information</label>
        <textarea
          value={content.additionalInfo}
          onChange={(e) => updateNested("content.additionalInfo", e.target.value)}
          rows={3}
          placeholder="Any other important information for customers..."
          className="w-full px-4 py-2.5 border border-[#eaeaea] rounded-lg text-sm text-[#1e293b] placeholder:text-[#9e9e9e] focus:outline-none focus:ring-2 focus:ring-[#044b3b]/20 focus:border-[#044b3b] resize-none"
        />
      </div>

      {/* Languages */}
      <div>
        <label className="block text-sm font-medium text-[#1e293b] mb-3">
          <span className="flex items-center gap-2">
            <Globe size={16} className="text-[#64748b]" />
            Languages Offered
          </span>
        </label>
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
}
