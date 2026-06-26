import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Search, Check, Info } from "lucide-react";
import { useProductBuilderStore } from "@/features/products/stores/productBuilderStore";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const THEME_GROUPS = [
  {
    label: "Art, Design, & Fashion",
    themes: [
      { value: "african-art", label: "African Art" },
      { value: "beadwork", label: "Beadwork" },
      { value: "textiles-fabric", label: "Textiles & Fabric" },
      { value: "pottery-ceramics", label: "Pottery & Ceramics" },
      { value: "contemporary-art", label: "Contemporary Art" },
      { value: "fashion-design", label: "Fashion & Design" },
      { value: "street-art", label: "Street Art" },
    ],
  },
  {
    label: "Entertainment",
    themes: [
      { value: "afrobeats", label: "Afrobeats" },
      { value: "music-dance", label: "Music & Dance" },
      { value: "film-nollywood", label: "Film & Nollywood" },
      { value: "storytelling", label: "Storytelling" },
      { value: "comedy", label: "Comedy" },
      { value: "nightlife", label: "Nightlife" },
      { value: "sports-games", label: "Sports & Games" },
    ],
  },
  {
    label: "Food & Drink",
    themes: [
      { value: "local-cuisine", label: "Local Cuisine" },
      { value: "street-food", label: "Street Food" },
      { value: "braai-barbecue", label: "Braai & Barbecue" },
      { value: "coffee-tea", label: "Coffee & Tea" },
      { value: "cooking-classes", label: "Cooking Classes" },
      { value: "wine-vineyards", label: "Wine & Vineyards" },
      { value: "breweries-distilleries", label: "Breweries & Distilleries" },
    ],
  },
  {
    label: "Health & Fitness",
    themes: [
      { value: "wellness-spas", label: "Wellness & Spas" },
      { value: "yoga-meditation", label: "Yoga & Meditation" },
      { value: "hiking-walking", label: "Hiking & Walking" },
      { value: "fitness-training", label: "Fitness & Training" },
      { value: "traditional-healing", label: "Traditional Healing" },
      { value: "sports", label: "Sports" },
    ],
  },
  {
    label: "History & Culture",
    themes: [
      { value: "colonial-history", label: "Colonial History" },
      { value: "independence-heritage", label: "Independence Heritage" },
      { value: "tribal-traditions", label: "Tribal Traditions" },
      { value: "language-literature", label: "Language & Literature" },
      { value: "music-dance-heritage", label: "Music & Dance Heritage" },
      { value: "archaeology", label: "Archaeology" },
      { value: "cultural-villages", label: "Cultural Villages" },
      { value: "genealogy", label: "Genealogy" },
    ],
  },
  {
    label: "Holidays",
    themes: [
      { value: "easter", label: "Easter" },
      { value: "christmas", label: "Christmas" },
      { value: "eid-al-fitr", label: "Eid al-Fitr" },
      { value: "eid-al-adha", label: "Eid al-Adha" },
      { value: "new-years", label: "New Year's" },
      { value: "independence-day", label: "Independence Day" },
      { value: "heritage-day", label: "Heritage Day" },
      { value: "freedom-day", label: "Freedom Day" },
      { value: "diwali", label: "Diwali" },
      { value: "ramadan", label: "Ramadan" },
      { value: "cultural-festivals", label: "Cultural Festivals" },
    ],
  },
  {
    label: "Lifestyle & Celebrations",
    themes: [
      { value: "weddings-traditions", label: "Weddings & Traditions" },
      { value: "family-gatherings", label: "Family Gatherings" },
      { value: "business-events", label: "Business Events" },
      { value: "festivals-celebrations", label: "Festivals & Celebrations" },
      { value: "luxury-lifestyle", label: "Luxury Lifestyle" },
      { value: "romantic-getaways", label: "Romantic Getaways" },
      { value: "community-events", label: "Community Events" },
    ],
  },
  {
    label: "Nature and Social Impact",
    themes: [
      { value: "wildlife-safaris", label: "Wildlife & Safaris" },
      { value: "conservation", label: "Conservation" },
      { value: "community-tourism", label: "Community Tourism" },
      { value: "eco-tourism", label: "Eco-Tourism" },
      { value: "national-parks", label: "National Parks" },
      { value: "bird-watching", label: "Bird Watching" },
      { value: "volunteer-community", label: "Volunteer & Community" },
      { value: "sustainable-travel", label: "Sustainable Travel" },
    ],
  },
  {
    label: "Outdoor & Adventure",
    themes: [
      { value: "safari", label: "Safari" },
      { value: "hiking-trekking", label: "Hiking & Trekking" },
      { value: "mountain-climbing", label: "Mountain Climbing" },
      { value: "water-sports", label: "Water Sports" },
      { value: "camping-outdoor", label: "Camping & Outdoor" },
      { value: "kayaking-canoeing", label: "Kayaking & Canoeing" },
      { value: "fishing", label: "Fishing" },
      { value: "hot-air-balloons", label: "Hot Air Balloons" },
      { value: "zipline-canopy", label: "Zipline & Canopy" },
      { value: "biking-cycling", label: "Biking & Cycling" },
      { value: "horseback-riding", label: "Horseback Riding" },
    ],
  },
  {
    label: "Religion",
    themes: [
      { value: "christianity", label: "Christianity" },
      { value: "islam", label: "Islam" },
      { value: "traditional-african", label: "Traditional African Religions" },
      { value: "hinduism", label: "Hinduism" },
      { value: "pilgrimage-sites", label: "Pilgrimage Sites" },
    ],
  },
  {
    label: "Science & Technology",
    themes: [
      { value: "innovation-tech", label: "Innovation & Tech" },
      { value: "astronomy-stargazing", label: "Astronomy & Stargazing" },
      { value: "conservation-science", label: "Conservation Science" },
      { value: "mobile-technology", label: "Mobile Technology" },
    ],
  },
  {
    label: "Seasonal",
    themes: [
      { value: "dry-season", label: "Dry Season" },
      { value: "rainy-season", label: "Rainy Season" },
      { value: "summer", label: "Summer" },
      { value: "winter", label: "Winter" },
      { value: "migration-season", label: "Migration Season" },
      { value: "harvest-season", label: "Harvest Season" },
    ],
  },
  {
    label: "Time of Day",
    themes: [
      { value: "sunrise", label: "Sunrise" },
      { value: "day", label: "Day" },
      { value: "sunset", label: "Sunset" },
      { value: "night", label: "Night" },
    ],
  },
  {
    label: "Travel",
    themes: [
      { value: "city-tours", label: "City Tours" },
      { value: "cultural-tours", label: "Cultural Tours" },
      { value: "safari-game-drives", label: "Safari & Game Drives" },
      { value: "beach-island", label: "Beach & Island" },
      { value: "road-trips", label: "Road Trips" },
      { value: "multiday-tours", label: "Multi-Day Tours" },
      { value: "airport-transfers", label: "Airport Transfers" },
      { value: "group-tours", label: "Group Tours" },
      { value: "private-tours", label: "Private Tours" },
      { value: "walking-tours", label: "Walking Tours" },
      { value: "camping-safaris", label: "Camping Safaris" },
      { value: "luxury-travel", label: "Luxury Travel" },
      { value: "budget-travel", label: "Budget Travel" },
    ],
  },
  {
    label: "Virtual experience",
    themes: [
      { value: "virtual-safari", label: "Virtual Safari" },
      { value: "virtual-cultural-tour", label: "Virtual Cultural Tour" },
      { value: "online-classes", label: "Online Classes" },
      { value: "live-streaming", label: "Live Streaming Events" },
    ],
  },
];

const ALL_THEMES = THEME_GROUPS.flatMap((g) => g.themes);

const dropdownVariants = {
  hidden: { opacity: 0, scale: 0.95, y: -4 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.15, ease: "easeOut" } },
  exit: { opacity: 0, scale: 0.95, y: -4, transition: { duration: 0.1, ease: "easeIn" } },
};

function ThemePicker({ themes, selected, onToggle, maxSelections }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const triggerRef = useRef(null);
  const [triggerRect, setTriggerRect] = useState(null);

  const handleTriggerClick = useCallback(() => {
    if (!open && triggerRef.current) {
      setTriggerRect(triggerRef.current.getBoundingClientRect());
      setSearch("");
    }
    setOpen((prev) => !prev);
  }, [open]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setTriggerRect(null);
  }, []);

  const filtered = themes.filter((t) =>
    t.label.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={handleTriggerClick}
        className={cn(
          "flex min-h-[42px] w-full items-center justify-between whitespace-nowrap rounded-xl border bg-white px-4 py-2.5 text-sm shadow-sm transition-all",
          "focus:outline-none",
          open
            ? "border-emerald-600"
            : "border-slate-200 hover:border-slate-300",
        )}
      >
        {selected.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 flex-1 mr-2">
            {selected.map((s) => (
              <span
                key={s.value}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-medium rounded-md border border-slate-200"
              >
                {s.label}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-slate-400 font-normal">Select theme(s)</span>
        )}
        <ChevronDown
          size={16}
          className={cn(
            "text-slate-400 shrink-0 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence>
        {open && triggerRect && (
          <PickerPanel
            themes={filtered}
            selected={selected}
            onToggle={onToggle}
            triggerRect={triggerRect}
            onClose={handleClose}
            maxSelections={maxSelections}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function PickerPanel({ themes, selected, onToggle, triggerRect, onClose, maxSelections }) {
  const panelRef = useRef(null);
  const searchRef = useRef(null);
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (!triggerRect) return;
    const gap = 6;
    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const estimatedHeight = 400;
    const top = spaceBelow < estimatedHeight
      ? triggerRect.top - gap
      : triggerRect.bottom + gap;
    setPosition({ top, left: triggerRect.left, width: triggerRect.width });
    setTimeout(() => searchRef.current?.focus(), 50);
  }, [triggerRect]);

  useEffect(() => {
    function handleScroll(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    }
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [onClose]);

  useEffect(() => {
    function handleKeyDown(e) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const filtered = themes.filter((t) =>
    t.label.toLowerCase().includes(search.toLowerCase()),
  );

  return createPortal(
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <motion.div
        ref={panelRef}
        variants={dropdownVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "fixed",
          top: position.top,
          left: position.left,
          width: Math.max(position.width, 320),
        }}
        className="z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg shadow-black/5"
      >
        <div className="border-b border-slate-200">
          <div className="relative p-2 pb-2.5">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search themes..."
              className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 bg-white focus:outline-none"
            />
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto p-1.5">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Search size={24} className="text-slate-300 mb-2" />
              <p className="text-sm text-slate-400">No themes found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-0.5">
              {filtered.map((theme) => {
                const isSelected = selected.some((s) => s.value === theme.value);
                const atLimit = selected.length >= maxSelections;
                return (
                  <button
                    key={theme.value}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        onToggle(theme);
                      } else if (!atLimit) {
                        onToggle(theme);
                      }
                    }}
                    disabled={!isSelected && atLimit}
                    className={cn(
                      "flex items-center gap-2.5 px-2.5 py-2 text-sm rounded-lg transition-colors select-none text-left w-full",
                      isSelected
                        ? "text-emerald-700 bg-emerald-50/60"
                        : "text-slate-700 hover:bg-slate-50",
                      !isSelected && atLimit && "opacity-40 cursor-not-allowed",
                    )}
                  >
                    <span
                      className={cn(
                        "flex items-center justify-center w-4 h-4 rounded border transition-all shrink-0",
                        isSelected
                          ? "bg-emerald-600 border-emerald-600"
                          : "border-slate-300 bg-white",
                      )}
                    >
                      {isSelected && (
                        <Check size={10} className="text-white" strokeWidth={3} />
                      )}
                    </span>
                    {theme.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 px-3 py-2 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {selected.length}/{maxSelections} selected
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            Done
          </button>
        </div>
      </motion.div>
    </>,
    document.body,
  );
}

export default function ThemeStep() {
  const { product, errors, updateProduct } = useProductBuilderStore();
  const [selectedCategory, setSelectedCategory] = useState("");

  const selectedThemes = product.secondaryThemes || [];
  const maxSelections = 3;

  const currentCategoryThemes = selectedCategory
    ? THEME_GROUPS.find((g) => g.label === selectedCategory)?.themes || []
    : [];

  const handleCategoryChange = (categoryLabel) => {
    setSelectedCategory(categoryLabel);
    updateProduct({ primaryTheme: categoryLabel });
    updateProduct({ secondaryThemes: [] });
  };

  const toggleTheme = (theme) => {
    const isSelected = selectedThemes.includes(theme.value);
    const updated = isSelected
      ? selectedThemes.filter((t) => t !== theme.value)
      : [...selectedThemes, theme.value];
    updateProduct({ secondaryThemes: updated });
  };

  const selectedThemeObjects = selectedThemes
    .map((v) => ALL_THEMES.find((t) => t.value === v))
    .filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h3 className="text-lg font-semibold text-slate-800">
          Choose up to {maxSelections} themes that best describe this product
        </h3>
        <p className="text-sm text-slate-500 leading-relaxed">
          Increase your visibility in traveler searches by selecting all {maxSelections} themes.
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-800">
          Select a theme
        </label>
        <Select value={selectedCategory} onValueChange={handleCategoryChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select a theme category" />
          </SelectTrigger>
          <SelectContent>
            {THEME_GROUPS.map((group) => (
              <SelectItem key={group.label} value={group.label}>
                {group.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <AnimatePresence mode="wait">
        {selectedCategory && (
          <motion.div
            key={selectedCategory}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-800">
                Select theme(s)
              </label>
              <span className="text-xs text-slate-400">
                {selectedThemes.length}/{maxSelections} selected
              </span>
            </div>

            <ThemePicker
              themes={currentCategoryThemes}
              selected={selectedThemeObjects}
              onToggle={toggleTheme}
              maxSelections={maxSelections}
            />

            {selectedThemes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedThemeObjects.map((theme) => (
                  <span
                    key={theme.value}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-lg border border-emerald-200"
                  >
                    <Check size={12} className="text-emerald-500" />
                    {theme.label}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <Info size={14} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed">
                Selecting multiple themes increases visibility in traveler searches.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {errors.secondaryThemes && (
        <p className="text-xs text-red-500">{errors.secondaryThemes}</p>
      )}
    </div>
  );
}
