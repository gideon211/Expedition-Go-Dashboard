import { useState } from "react";
import { MapPin, FileText, Settings2, Puzzle } from "lucide-react";
import { useProductBuilderStore } from "@/features/products/stores/productBuilderStore";
import LocationAutocomplete from "@/components/shared/LocationAutocomplete";
import MultiSelect from "@/components/shared/MultiSelect";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const TAG_OPTIONS = [
  { value: "adventure", label: "Adventure" },
  { value: "beach", label: "Beach & Island" },
  { value: "cultural", label: "Cultural" },
  { value: "safari", label: "Safari" },
  { value: "wildlife", label: "Wildlife" },
  { value: "nature", label: "Nature" },
  { value: "hiking", label: "Hiking" },
  { value: "city", label: "City Tour" },
  { value: "food", label: "Food & Drink" },
  { value: "photography", label: "Photography" },
  { value: "luxury", label: "Luxury" },
  { value: "budget", label: "Budget Friendly" },
  { value: "family-friendly", label: "Family Friendly" },
  { value: "romantic", label: "Romantic" },
  { value: "solo", label: "Solo Traveler" },
  { value: "group", label: "Group Tour" },
  { value: "eco-friendly", label: "Eco Friendly" },
  { value: "historical", label: "Historical" },
  { value: "religious", label: "Religious" },
  { value: "shopping", label: "Shopping" },
  { value: "nightlife", label: "Nightlife" },
  { value: "sports", label: "Sports" },
  { value: "wellness", label: "Wellness" },
  { value: "cruise", label: "Cruise" },
  { value: "skiing", label: "Skiing" },
  { value: "diving", label: "Diving & Snorkeling" },
  { value: "yoga", label: "Yoga & Meditation" },
  { value: "cooking", label: "Cooking Class" },
  { value: "wine", label: "Wine & Vineyard" },
  { value: "art", label: "Art & Museum" },
  { value: "music", label: "Music & Festival" },
  { value: "camping", label: "Camping" },
  { value: "road-trip", label: "Road Trip" },
  { value: "backpacking", label: "Backpacking" },
  { value: "kayaking", label: "Kayaking & Canoeing" },
  { value: "horseback", label: "Horseback Riding" },
  { value: "fishing", label: "Fishing" },
  { value: "cycling", label: "Cycling" },
  { value: "climbing", label: "Rock Climbing" },
  { value: "spiritual", label: "Spiritual Retreat" },
  { value: "volunteer", label: "Volunteer Tourism" },
];

const CATEGORIES = [
  { value: "safari", label: "Safari" },
  { value: "beach", label: "Beach & Island" },
  { value: "adventure", label: "Adventure" },
  { value: "cultural", label: "Cultural" },
  { value: "city", label: "City Tour" },
  { value: "wildlife", label: "Wildlife" },
  { value: "trekking", label: "Trekking & Hiking" },
  { value: "luxury", label: "Luxury" },
];

const THEMES = [
  // Adventure & Outdoor
  { value: "adventure", label: "Adventure" },
  { value: "hiking-trekking", label: "Hiking & Trekking" },
  { value: "cycling-biking", label: "Cycling & Biking" },
  { value: "water-sports", label: "Water Sports" },
  { value: "extreme-sports", label: "Extreme Sports" },
  { value: "camping-outdoor", label: "Camping & Outdoor" },
  { value: "kayaking-canoeing", label: "Kayaking & Canoeing" },
  { value: "diving-snorkeling", label: "Diving & Snorkeling" },
  { value: "rock-climbing", label: "Rock Climbing" },
  { value: "horseback-riding", label: "Horseback Riding" },
  { value: "skiing-snowboarding", label: "Skiing & Snowboarding" },
  { value: "safari-wildlife", label: "Safari & Wildlife" },
  { value: "fishing-angling", label: "Fishing & Angling" },
  // Cultural & Historical
  { value: "cultural-heritage", label: "Cultural & Heritage" },
  { value: "historical", label: "Historical" },
  { value: "art-museums", label: "Art & Museums" },
  { value: "music-festivals", label: "Music & Festivals" },
  { value: "religious-spiritual", label: "Religious & Spiritual" },
  { value: "architecture", label: "Architecture" },
  { value: "photography", label: "Photography Tours" },
  // Food & Leisure
  { value: "food-drink", label: "Food & Drink" },
  { value: "cooking-classes", label: "Cooking Classes" },
  { value: "wine-vineyards", label: "Wine & Vineyards" },
  { value: "nightlife", label: "Nightlife & Entertainment" },
  { value: "shopping", label: "Shopping" },
  { value: "wellness-spas", label: "Wellness & Spas" },
  { value: "yoga-meditation", label: "Yoga & Meditation" },
  // Nature & Scenery
  { value: "nature-scenery", label: "Nature & Scenery" },
  { value: "beach-island", label: "Beach & Island" },
  { value: "wildlife-encounters", label: "Wildlife Encounters" },
  { value: "eco-friendly", label: "Eco-Friendly & Sustainable" },
  { value: "gardens-parks", label: "Gardens & Parks" },
  // City & Urban
  { value: "city-tours", label: "City Tours" },
  { value: "walking-tours", label: "Walking Tours" },
  // Travel Style
  { value: "luxury", label: "Luxury" },
  { value: "budget-friendly", label: "Budget Friendly" },
  { value: "family-friendly", label: "Family Friendly" },
  { value: "romantic", label: "Romantic" },
  { value: "solo-traveler", label: "Solo Traveler" },
  { value: "group-tours", label: "Group Tours" },
  { value: "private-tours", label: "Private Tours" },
  // Special Interest
  { value: "educational", label: "Educational" },
  { value: "volunteer-community", label: "Volunteer & Community" },
  { value: "cruises-sailing", label: "Cruises & Sailing" },
  { value: "road-trips", label: "Road Trips" },
  { value: "multiday-tours", label: "Multi-Day Tours" },
];

const DIFFICULTIES = [
  { value: "easy", label: "Easy" },
  { value: "moderate", label: "Moderate" },
  { value: "challenging", label: "Challenging" },
  { value: "extreme", label: "Extreme" },
];

const ACTIVITY_TYPES = [
  "Guided Tour",
  "Self-Guided Tour",
  "Private Tour",
  "Group Tour",
  "Adventure Tour",
  "Cultural Experience",
  "Food & Wine Tour",
  "Wildlife Safari",
  "City Tour",
  "Walking Tour",
];

function SectionHeader({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
      <Icon size={18} className="text-emerald-600" />
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
    </div>
  );
}

function fieldClasses(error) {
  return `w-full px-4 py-2.5 border rounded-xl text-sm text-slate-800 placeholder:text-slate-400 bg-white focus:outline-none ${
    error ? "border-red-500" : "border-slate-200"
  }`;
}

export default function ProductBasicsStep() {
  const { product, errors, updateProduct } = useProductBuilderStore();
  const [showManualLocation, setShowManualLocation] = useState(false);

  const handleChange = (field, value) => {
    updateProduct({ [field]: value });
  };

  const handleLocationSelect = (result) => {
    updateProduct({
      city: result.city || "",
      country: result.country || "",
      region: result.region || "",
      latitude: result.latitude,
      longitude: result.longitude,
    });
  };

  return (
    <div className="space-y-8">
      {/* SECTION: Basic Information */}
      <div className="space-y-4">
        <SectionHeader icon={Settings2} title="Basic Information" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-800 mb-2">
              Product Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={product.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="e.g., Serengeti Safari Adventure"
              className={fieldClasses(errors.title)}
            />
            {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-800 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <Select
              value={product.category}
              onValueChange={(value) => handleChange("category", value)}
            >
              <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-800 mb-2">
              Subcategory <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={product.subcategory}
              onChange={(e) => handleChange("subcategory", e.target.value)}
              placeholder="e.g., Walking Tours"
              className={fieldClasses(errors.subcategory)}
            />
            {errors.subcategory && <p className="mt-1 text-xs text-red-500">{errors.subcategory}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-800 mb-2">
              Duration <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={product.duration}
                onChange={(e) => handleChange("duration", e.target.value)}
                placeholder="3"
                className={fieldClasses(errors.duration)}
              />
              <Select
                value={product.durationUnit}
                onValueChange={(value) => handleChange("durationUnit", value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hours">Hours</SelectItem>
                  <SelectItem value="days">Days</SelectItem>
                  <SelectItem value="weeks">Weeks</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {errors.duration && <p className="mt-1 text-xs text-red-500">{errors.duration}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-800 mb-2">Difficulty Level</label>
            <Select
              value={product.difficulty || ""}
              onValueChange={(value) => handleChange("difficulty", value || "easy")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                {DIFFICULTIES.map((diff) => (
                  <SelectItem key={diff.value} value={diff.value}>{diff.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-800 mb-2">
              Activity Type <span className="text-red-500">*</span>
            </label>
            <Select
              value={product.activityType}
              onValueChange={(value) => handleChange("activityType", value)}
            >
              <SelectTrigger className={errors.activityType ? "border-red-500" : ""}>
                <SelectValue placeholder="Select activity type" />
              </SelectTrigger>
              <SelectContent>
                {ACTIVITY_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.activityType && <p className="mt-1 text-xs text-red-500">{errors.activityType}</p>}
          </div>
        </div>
      </div>

      {/* SECTION: Themes & Tags */}
      <div className="space-y-4">
        <SectionHeader icon={Puzzle} title="Themes & Tags" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-800 mb-2">
              Primary Theme <span className="text-red-500">*</span>
            </label>
            <Select
              value={product.primaryTheme}
              onValueChange={(value) => handleChange("primaryTheme", value)}
            >
              <SelectTrigger className={errors.primaryTheme ? "border-red-500" : ""}>
                <SelectValue placeholder="Choose a primary theme" />
              </SelectTrigger>
              <SelectContent>
                <div className="px-2 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Adventure & Outdoor</div>
                {[
                  "adventure","hiking-trekking","cycling-biking","water-sports","extreme-sports",
                  "camping-outdoor","kayaking-canoeing","diving-snorkeling","rock-climbing",
                  "horseback-riding","skiing-snowboarding","safari-wildlife","fishing-angling",
                ].map((v) => {
                  const t = THEMES.find(o => o.value === v);
                  return t ? <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem> : null;
                })}
                <div className="px-2 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-t border-slate-100">Cultural & Historical</div>
                {[
                  "cultural-heritage","historical","art-museums","music-festivals",
                  "religious-spiritual","architecture","photography",
                ].map((v) => {
                  const t = THEMES.find(o => o.value === v);
                  return t ? <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem> : null;
                })}
                <div className="px-2 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-t border-slate-100">Food & Leisure</div>
                {[
                  "food-drink","cooking-classes","wine-vineyards","nightlife",
                  "shopping","wellness-spas","yoga-meditation",
                ].map((v) => {
                  const t = THEMES.find(o => o.value === v);
                  return t ? <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem> : null;
                })}
                <div className="px-2 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-t border-slate-100">Nature & Scenery</div>
                {[
                  "nature-scenery","beach-island","wildlife-encounters","eco-friendly","gardens-parks",
                ].map((v) => {
                  const t = THEMES.find(o => o.value === v);
                  return t ? <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem> : null;
                })}
                <div className="px-2 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-t border-slate-100">City & Urban</div>
                {[
                  "city-tours","walking-tours",
                ].map((v) => {
                  const t = THEMES.find(o => o.value === v);
                  return t ? <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem> : null;
                })}
                <div className="px-2 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-t border-slate-100">Travel Style</div>
                {[
                  "luxury","budget-friendly","family-friendly","romantic",
                  "solo-traveler","group-tours","private-tours",
                ].map((v) => {
                  const t = THEMES.find(o => o.value === v);
                  return t ? <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem> : null;
                })}
                <div className="px-2 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-t border-slate-100">Special Interest</div>
                {[
                  "educational","volunteer-community","cruises-sailing","road-trips","multiday-tours",
                ].map((v) => {
                  const t = THEMES.find(o => o.value === v);
                  return t ? <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem> : null;
                })}
              </SelectContent>
            </Select>
            {errors.primaryTheme && <p className="mt-1 text-xs text-red-500">{errors.primaryTheme}</p>}
          </div>

          <div className="md:col-span-2">
            <MultiSelect
              label="Secondary Themes"
              options={THEMES}
              value={product.secondaryThemes}
              onChange={(themes) => handleChange("secondaryThemes", themes)}
              placeholder="Select secondary themes..."
              searchPlaceholder="Search themes..."
            />
          </div>
        </div>

        <MultiSelect
          label="Tags"
          options={TAG_OPTIONS}
          value={product.tags}
          onChange={(tags) => handleChange("tags", tags)}
          placeholder="Select tags..."
          searchPlaceholder="Search tags..."
          max={10}
          error={errors.tags}
        />
      </div>

      {/* SECTION: Location */}
      <div className="space-y-4">
        <SectionHeader icon={MapPin} title="Location" />
        <LocationAutocomplete onSelect={handleLocationSelect} />

        {!showManualLocation ? (
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-sm text-slate-500">
              {product.city || product.country ? (
                <span className="text-slate-800 font-medium">
                  {[product.city, product.region, product.country].filter(Boolean).join(", ")}
                </span>
              ) : (
                <span>Location set by autocomplete</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowManualLocation(true)}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Edit manually
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-2">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={product.city}
                onChange={(e) => handleChange("city", e.target.value)}
                placeholder="e.g., New York"
                className={fieldClasses(errors.city)}
              />
              {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-800 mb-2">
                Country <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={product.country}
                onChange={(e) => handleChange("country", e.target.value)}
                placeholder="e.g., USA"
                className={fieldClasses(errors.country)}
              />
              {errors.country && <p className="mt-1 text-xs text-red-500">{errors.country}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-800 mb-2">Region</label>
              <input
                type="text"
                value={product.region}
                onChange={(e) => handleChange("region", e.target.value)}
                placeholder="e.g., Western Cape"
                className={fieldClasses()}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-800 mb-2">Latitude</label>
              <input
                type="number"
                step="any"
                value={product.latitude ?? ""}
                onChange={(e) => handleChange("latitude", e.target.value === "" ? null : Number(e.target.value))}
                placeholder="e.g., -33.9249"
                className={fieldClasses(errors.latitude)}
              />
              {errors.latitude && <p className="mt-1 text-xs text-red-500">{errors.latitude}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-800 mb-2">Longitude</label>
              <input
                type="number"
                step="any"
                value={product.longitude ?? ""}
                onChange={(e) => handleChange("longitude", e.target.value === "" ? null : Number(e.target.value))}
                placeholder="e.g., 18.4241"
                className={fieldClasses(errors.longitude)}
              />
              {errors.longitude && <p className="mt-1 text-xs text-red-500">{errors.longitude}</p>}
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => setShowManualLocation(false)}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-medium mb-1"
              >
                Use autocomplete instead
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SECTION: SEO & Description */}
      <div className="space-y-4">
        <SectionHeader icon={FileText} title="SEO & Description" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-800 mb-2">
              Meta Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={product.metaTitle}
              onChange={(e) => handleChange("metaTitle", e.target.value)}
              placeholder="SEO title for search engines"
              className={fieldClasses(errors.metaTitle)}
            />
            {errors.metaTitle && <p className="mt-1 text-xs text-red-500">{errors.metaTitle}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-800 mb-2">Slug</label>
            <input
              type="text"
              value={product.slug}
              onChange={(e) => handleChange("slug", e.target.value)}
              placeholder="auto-generated from title"
              className={fieldClasses()}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-800 mb-2">Meta Description</label>
            <textarea
              value={product.metaDescription}
              onChange={(e) => handleChange("metaDescription", e.target.value)}
              rows={3}
              placeholder="Short description for SEO and social sharing"
              className={fieldClasses() + " resize-none"}
            />
            <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 text-xs text-slate-500">
              <div className="flex items-start sm:items-center gap-1.5">
                <svg className="w-3.5 h-3.5 mt-0.5 sm:mt-0 flex-shrink-0 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
                </svg>
                <span>Keep between <strong>120–160 characters</strong> for optimal Google search snippets.</span>
              </div>
              <span className="hidden sm:inline text-slate-400">|</span>
              <div className="flex items-start sm:items-center gap-1.5">
                <svg className="w-3.5 h-3.5 mt-0.5 sm:mt-0 flex-shrink-0 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Include primary keywords naturally — this appears in search results and social shares.</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-800 mb-2">
              Full Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={product.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={6}
              placeholder="Detailed description of the tour experience..."
              className={fieldClasses(errors.description) + " resize-none"}
            />
            {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
