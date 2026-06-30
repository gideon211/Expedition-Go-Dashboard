import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Map, Waves, Bus, HelpCircle, X, ChevronDown, ChevronRight, Search, Check } from "lucide-react";
import { useProductBuilderStore } from "@/features/products/stores/productBuilderStore";
import { cn } from "@/lib/utils";

const PRODUCT_TYPES = [
  {
    id: "tour",
    label: "Tour",
    description: "A guided visit to one or more sites",
    icon: Map,
  },
  {
    id: "activity",
    label: "Activity",
    description: "An instructed or interactive experience",
    icon: Waves,
  },
  {
    id: "transport",
    label: "Transport",
    description: "Transferring travelers between locations, with a focus on transportation rather than sightseeing",
    icon: Bus,
  },
];

const TRANSPORTATION_CATEGORIES = [
  {
    name: "Air Transport",
    items: ["Biplane", "Glider Plane", "Gyrocopter", "Helicopter", "Hot Air Balloon", "Jet Fighter", "Plane", "Seaplane", "Tiger Moth"],
  },
  {
    name: "Land Transport",
    items: ["4WD", "ATV", "Bike", "Buggy", "Bus/Coach", "Cable Car", "Car", "Classic Car", "E-Bike", "Golf Cart", "Hiking", "Horse Drawn Carriage", "Luxury Car", "Metro/Subway", "Minibus", "Minivan", "Motorcycle", "Mountain Bike", "Rickshaw", "Running", "Scoot Coupe", "Scooter/Moped", "Segway", "Sidecar", "Train/Rail", "Trikke", "Trolley", "Tuk Tuk", "Walking"],
    subcategories: [
      {
        name: "Animal",
        items: ["Alpaca", "Camel", "Donkey/Mule", "Horse", "Llama", "Reindeer"],
      },
    ],
  },
  {
    name: "Water Transport",
    items: ["Airboat", "Aqua Cycle", "Boat", "Canoe", "Catamaran", "Gondola", "Inflatable Raft", "Inner Tube", "Jet Boat", "Jet Ski", "Kayak", "Paddle Boat", "Speedboat", "Steamboat", "Submarine", "Swimming", "Wooden Raft", "Yacht"],
  },
];

const ACTIVITY_CATEGORIES = [
  {
    name: "Air Activities",
    items: ["Flight Simulator", "Gliding", "Hangliding", "Indoor Skydiving", "Paragliding", "Skydiving"],
  },
  {
    name: "Classes/Lessons/Workshops",
    items: ["Cooking Classes", "Art Workshops", "Photography Classes", "Dance Lessons", "Language Classes"],
  },
  {
    name: "Dining Experience",
    items: ["Food Tours", "Wine Tasting", "Dinner Cruises", "Farm-to-Table", "Street Food Tours"],
  },
  {
    name: "Fun & Games",
    items: ["Axe Throwing", "Clothing/Dress up Experience", "Escape Games/Rooms", "Go Kart", "Laser Tag"],
  },
  {
    name: "Land & Outdoor Activities",
    items: ["Hiking", "Cycling", "Horseback Riding", "Rock Climbing", "ATV Tours", "Camping", "Fishing", "Safari"],
  },
  {
    name: "Snow Activities",
    items: ["Skiing", "Snowboarding", "Snowshoeing", "Dog Sledding", "Ice Fishing"],
  },
  {
    name: "Spas",
    items: ["Arab Baths", "Day Spa", "Hammam & Turkish Bath", "Hot Spring", "Onsen"],
  },
  {
    name: "Water Activities",
    items: ["Airboat", "Canoeing", "Diving", "Dolphin Watching", "Fishing", "Jet Skiing", "Kayaking", "Paddle Boarding", "Scuba Diving", "Snorkeling", "Surfing", "Swimming with Dolphins", "White Water Rafting"],
  },
];

const TRANSPORT_CATEGORIES = [
  {
    name: "Air Transports",
    items: ["Airport Transfers", "Helicopter Transfers", "Seaplane Transfers", "Private Jet Charters"],
  },
  {
    name: "Land Transports",
    items: ["Private Car Transfers", "Shuttle Bus Services", "Train Tickets", "Limousine Services", "Motorcycle Taxis", "Bicycle Rentals", "RV Rentals"],
  },
  {
    name: "Passes",
    items: ["City Passes", "Regional Rail Passes", "Bus Passes", "Ferry Passes", "Multi-Day Transport Passes"],
  },
  {
    name: "Water Transports",
    items: ["Ferry Transfers", "Water Taxi Services", "Private Boat Transfers", "Cruise Ship Transfers"],
  },
];

const dropdownVariants = {
  hidden: { opacity: 0, scale: 0.95, y: -4 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.15, ease: "easeOut" } },
  exit: { opacity: 0, scale: 0.95, y: -4, transition: { duration: 0.1, ease: "easeIn" } },
};

const categoryItemVariants = {
  hidden: { opacity: 0, height: 0 },
  visible: { opacity: 1, height: "auto", transition: { duration: 0.2, ease: "easeOut" } },
  exit: { opacity: 0, height: 0, transition: { duration: 0.15, ease: "easeIn" } },
};

const itemVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: (i) => ({ opacity: 1, x: 0, transition: { delay: i * 0.03, duration: 0.15 } }),
};

const contentVariants = {
  hidden: { opacity: 0, height: 0, overflow: "hidden" },
  visible: { opacity: 1, height: "auto", overflow: "visible", transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, height: 0, overflow: "hidden", transition: { duration: 0.2, ease: "easeIn" } },
};

const cardVariants = {
  idle: { borderColor: "rgb(226 232 240)", transition: { duration: 0.2 } },
  selected: { borderColor: "rgb(5 150 105)", transition: { duration: 0.2 } },
};

function SubcategoryGroup({ name, items, selectedItems, onToggle }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="ml-2 pl-2 border-l-2 border-slate-100">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-2.5 py-1.5 text-sm rounded-lg cursor-pointer transition-colors select-none text-slate-500 hover:text-slate-700 hover:bg-slate-50"
      >
        <span className="font-medium text-xs uppercase tracking-wider">{name}</span>
        <motion.div
          animate={{ rotate: expanded ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight size={12} className="text-slate-400" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            variants={categoryItemVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="space-y-0.5 pb-0.5">
              {items.map((item, idx) => (
                <motion.div
                  key={item}
                  custom={idx}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  onClick={() => onToggle(item)}
                  className={cn(
                    "flex items-center gap-2.5 px-2.5 py-2 text-sm rounded-lg cursor-pointer transition-colors select-none",
                    selectedItems.includes(item)
                      ? "text-emerald-700 bg-emerald-50/60"
                      : "text-slate-700 hover:bg-slate-50",
                  )}
                >
                  <span
                    className={cn(
                      "flex items-center justify-center w-4 h-4 rounded border transition-all shrink-0",
                      selectedItems.includes(item)
                        ? "bg-emerald-600 border-emerald-600"
                        : "border-slate-300 bg-white",
                    )}
                  >
                    {selectedItems.includes(item) && (
                      <Check size={10} className="text-white" strokeWidth={3} />
                    )}
                  </span>
                  {item}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DropdownPanel({ categories, selectedItems, onToggle, searchPlaceholder, triggerRect, onClose }) {
  const panelRef = useRef(null);
  const searchRef = useRef(null);
  const [search, setSearch] = useState("");
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (!triggerRect) return;
    const gap = 6;
    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const estimatedHeight = 360;
    const top = spaceBelow < estimatedHeight
      ? triggerRect.top - gap
      : triggerRect.bottom + gap;

    setPosition({ top, left: triggerRect.left, width: triggerRect.width });
    setTimeout(() => searchRef.current?.focus(), 50);
  }, [triggerRect]);

  useEffect(() => {
    function handleScroll(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose();
      }
    }
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [onClose]);

  useEffect(() => {
    function handleKeyDown(e) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const filtered = categories
    .map((cat) => ({
      ...cat,
      items: cat.items.filter((item) => {
        if (typeof item === "string") {
          return item.toLowerCase().includes(search.toLowerCase());
        }
        if (item.items) {
          const subMatch = item.items.some((s) =>
            s.toLowerCase().includes(search.toLowerCase()),
          );
          const nameMatch = item.name.toLowerCase().includes(search.toLowerCase());
          return subMatch || nameMatch;
        }
        return false;
      }),
      subcategories: cat.subcategories
        ? cat.subcategories
            .map((sub) => ({
              ...sub,
              items: sub.items.filter((s) =>
                s.toLowerCase().includes(search.toLowerCase()),
              ),
            }))
            .filter((sub) => sub.items.length > 0 || sub.name.toLowerCase().includes(search.toLowerCase()))
        : cat.subcategories,
    }))
    .filter(
      (cat) =>
        cat.items.length > 0 ||
        (cat.subcategories && cat.subcategories.length > 0) ||
        cat.name.toLowerCase().includes(search.toLowerCase()),
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
          width: position.width,
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
              placeholder={searchPlaceholder || "Search..."}
              className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 bg-white focus:outline-none"
            />
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto p-1.5 space-y-0.5">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Search size={24} className="text-slate-300 mb-2" />
              <p className="text-sm text-slate-400">No options found</p>
              <p className="text-xs text-slate-300 mt-0.5">Try a different search term</p>
            </div>
          ) : (
            filtered.map((category) => {
              const isExpanded = expandedCategory === category.name;
              return (
                <div key={category.name} className="rounded-lg">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedCategory(isExpanded ? null : category.name)
                    }
                    className="w-full flex items-center justify-between px-2.5 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    <span className="font-medium">{category.name}</span>
                    <motion.div
                      animate={{ rotate: isExpanded ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronRight size={14} className="text-slate-400" />
                    </motion.div>
                  </button>
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        variants={categoryItemVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                      >
                        <div className="ml-3 pl-3 border-l border-slate-100 space-y-0.5 pb-1">
                          {category.subcategories?.map((sub) => (
                            <SubcategoryGroup
                              key={sub.name}
                              name={sub.name}
                              items={sub.items}
                              selectedItems={selectedItems}
                              onToggle={onToggle}
                            />
                          ))}
                          {category.items.map((item, idx) => (
                            <motion.div
                              key={item}
                              custom={idx}
                              variants={itemVariants}
                              initial="hidden"
                              animate="visible"
                              onClick={() => onToggle(item)}
                              className={cn(
                                "flex items-center gap-2.5 px-2.5 py-2 text-sm rounded-lg cursor-pointer transition-colors select-none",
                                selectedItems.includes(item)
                                  ? "text-emerald-700 bg-emerald-50/60"
                                  : "text-slate-700 hover:bg-slate-50",
                              )}
                            >
                              <span
                                className={cn(
                                  "flex items-center justify-center w-4 h-4 rounded border transition-all shrink-0",
                                  selectedItems.includes(item)
                                    ? "bg-emerald-600 border-emerald-600"
                                    : "border-slate-300 bg-white",
                                )}
                              >
                                {selectedItems.includes(item) && (
                                  <Check size={10} className="text-white" strokeWidth={3} />
                                )}
                              </span>
                              {item}
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </>,
    document.body,
  );
}

function CategoryDropdown({ categories, selectedItems, onToggle, onRemove, searchPlaceholder }) {
  const [open, setOpen] = useState(false);
  const [triggerRect, setTriggerRect] = useState(null);
  const triggerRef = useRef(null);

  const handleTriggerClick = useCallback(() => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setTriggerRect(rect);
    }
    setOpen((prev) => !prev);
  }, [open]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setTriggerRect(null);
  }, []);

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
        <div className="flex flex-wrap gap-1.5 flex-1 mr-2">
          {selectedItems.length > 0 ? (
            selectedItems.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-medium rounded-md border border-slate-200"
              >
                {item}
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(item);
                  }}
                  className="cursor-pointer hover:text-red-500 transition-colors ml-0.5"
                >
                  <X size={12} />
                </span>
              </span>
            ))
          ) : (
            <span className="text-slate-400 font-normal">Select one (or more)</span>
          )}
        </div>
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
          <DropdownPanel
            categories={categories}
            selectedItems={selectedItems}
            onToggle={onToggle}
            onRemove={onRemove}
            searchPlaceholder={searchPlaceholder}
            triggerRect={triggerRect}
            onClose={handleClose}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CategorizationStep() {
  const { product, errors, updateProduct } = useProductBuilderStore();

  const handleTypeChange = (type) => {
    updateProduct({ productType: type });
  };

  const toggleTransportMode = (mode) => {
    const current = product.tourTransportationModes || [];
    const updated = current.includes(mode)
      ? current.filter((m) => m !== mode)
      : [...current, mode];
    updateProduct({ tourTransportationModes: updated });
  };

  const removeTransportMode = (mode) => {
    const current = product.tourTransportationModes || [];
    updateProduct({ tourTransportationModes: current.filter((m) => m !== mode) });
  };

  const toggleActivityItem = (item) => {
    const current = product.activityCategories || [];
    const updated = current.includes(item)
      ? current.filter((i) => i !== item)
      : [...current, item];
    updateProduct({ activityCategories: updated });
  };

  const removeActivityItem = (item) => {
    const current = product.activityCategories || [];
    updateProduct({ activityCategories: current.filter((i) => i !== item) });
  };

  const toggleTransportItem = (item) => {
    const current = product.transportCategories || [];
    const updated = current.includes(item)
      ? current.filter((i) => i !== item)
      : [...current, item];
    updateProduct({ transportCategories: updated });
  };

  const removeTransportItem = (item) => {
    const current = product.transportCategories || [];
    updateProduct({ transportCategories: current.filter((i) => i !== item) });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h3 className="text-lg font-semibold text-slate-800">
          What type of product are you creating?
        </h3>
        <p className="text-sm text-slate-500 leading-relaxed">
          Please choose carefully as it impacts the following sections and you won't be able to edit this later.
        </p>
      </div>

      <div className="space-y-3">
        {PRODUCT_TYPES.map((type) => {
          const isSelected = product.productType === type.id;
          const Icon = type.icon;
          return (
            <motion.div
              key={type.id}
              layout
              initial={false}
              animate={isSelected ? "selected" : "idle"}
              variants={cardVariants}
              onClick={() => handleTypeChange(type.id)}
              className={cn(
                "relative flex items-start gap-4 p-4 md:p-5 rounded-xl border-2 cursor-pointer bg-white select-none",
                isSelected
                  ? "border-emerald-600 bg-emerald-600/[0.02] shadow-sm"
                  : "border-slate-200 hover:border-slate-300 hover:shadow-sm",
              )}
            >
              <div className="mt-0.5 shrink-0">
                <div
                  className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                    isSelected ? "border-emerald-600" : "border-slate-300",
                  )}
                >
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30, mass: 0.5 }}
                        className="w-2.5 h-2.5 rounded-full bg-emerald-600"
                      />
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="shrink-0">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                  isSelected ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500",
                )}>
                  <Icon size={22} strokeWidth={1.5} />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className={cn(
                    "text-base font-semibold transition-colors",
                    isSelected ? "text-emerald-600" : "text-slate-800",
                  )}>
                    {type.label}
                  </h4>
                  <HelpCircle size={14} className="text-slate-300 shrink-0" />
                </div>
                <p className="text-sm text-slate-500 mt-0.5">{type.description}</p>

                <AnimatePresence initial={false}>
                  {isSelected && (
                    <motion.div
                      variants={contentVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      <div className="mt-4 space-y-5 border-t border-slate-100 pt-4">
                        {type.id === "tour" && (
                          <div>
                            <label className="flex items-center gap-1.5 text-sm font-medium text-slate-800 mb-2.5">
                              What modes of transportation are used during the tour?
                              <HelpCircle size={14} className="text-slate-300 shrink-0" />
                            </label>
                            <CategoryDropdown
                              categories={TRANSPORTATION_CATEGORIES}
                              selectedItems={product.tourTransportationModes || []}
                              onToggle={toggleTransportMode}
                              onRemove={removeTransportMode}
                              searchPlaceholder="Search modes of transport"
                            />
                            {errors.tourTransportationModes && (
                              <motion.p
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-1.5 text-xs text-red-500"
                              >
                                {errors.tourTransportationModes}
                              </motion.p>
                            )}
                          </div>
                        )}

                        {type.id === "activity" && (
                          <div>
                            <label className="flex items-center gap-1.5 text-sm font-medium text-slate-800 mb-2.5">
                              What activities are included?
                              <HelpCircle size={14} className="text-slate-300 shrink-0" />
                            </label>
                            <CategoryDropdown
                              categories={ACTIVITY_CATEGORIES}
                              selectedItems={product.activityCategories || []}
                              onToggle={toggleActivityItem}
                              onRemove={removeActivityItem}
                              searchPlaceholder="Search activities"
                            />
                            {errors.activityCategories && (
                              <motion.p
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-1.5 text-xs text-red-500"
                              >
                                {errors.activityCategories}
                              </motion.p>
                            )}
                          </div>
                        )}

                        {type.id === "transport" && (
                          <div>
                            <label className="flex items-center gap-1.5 text-sm font-medium text-slate-800 mb-2.5">
                              What type of transportation service are you providing?
                              <HelpCircle size={14} className="text-slate-300 shrink-0" />
                            </label>
                            <CategoryDropdown
                              categories={TRANSPORT_CATEGORIES}
                              selectedItems={product.transportCategories || []}
                              onToggle={toggleTransportItem}
                              onRemove={removeTransportItem}
                              searchPlaceholder="Search transportation types"
                            />
                            {errors.transportCategories && (
                              <motion.p
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-1.5 text-xs text-red-500"
                              >
                                {errors.transportCategories}
                              </motion.p>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {errors.productType && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-xs text-red-500"
          >
            {errors.productType}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Category & Duration — shown for all product types */}
      <AnimatePresence>
        {product.productType && (
          <motion.div
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-5"
          >
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-slate-800 mb-2.5">
                Category
                <HelpCircle size={14} className="text-slate-300 shrink-0" />
              </label>
              <select
                value={product.category || ""}
                onChange={(e) => updateProduct({ category: e.target.value })}
                className="flex min-h-[42px] w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm transition-all focus:border-emerald-600 focus:outline-none"
              >
                <option value="">Select a category</option>
                <option value="Adventure">Adventure</option>
                <option value="Cultural & Historical">Cultural & Historical</option>
                <option value="Nature & Wildlife">Nature & Wildlife</option>
                <option value="Food & Drink">Food & Drink</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Shopping">Shopping</option>
                <option value="Sports & Wellness">Sports & Wellness</option>
                <option value="Educational">Educational</option>
                <option value="Nightlife">Nightlife</option>
                <option value="Sightseeing">Sightseeing</option>
              </select>
              {errors.category && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mt-1.5 text-xs text-red-500">{errors.category}</motion.p>
              )}
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-slate-800 mb-2.5">
                Duration
                <HelpCircle size={14} className="text-slate-300 shrink-0" />
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  value={product.duration || ""}
                  onChange={(e) => updateProduct({ duration: e.target.value })}
                  placeholder="e.g. 3"
                  className="flex min-h-[42px] w-28 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm transition-all focus:border-emerald-600 focus:outline-none"
                />
                <select
                  value={product.durationUnit || "hours"}
                  onChange={(e) => updateProduct({ durationUnit: e.target.value })}
                  className="flex min-h-[42px] rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm transition-all focus:border-emerald-600 focus:outline-none"
                >
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                  <option value="weeks">Weeks</option>
                </select>
              </div>
              {errors.duration && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mt-1.5 text-xs text-red-500">{errors.duration}</motion.p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
