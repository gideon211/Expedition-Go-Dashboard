import { useState } from "react";
import { MapPin, Clock, Users, DollarSign, Star, Check, CheckCircle, AlertCircle, Shield, Info, FileText, Trash2, FileEdit, Globe, Calendar, BookOpen, Plane, Briefcase, Tag as TagIcon, Plus, Pencil, Image as ImageIcon, Percent, Hash, X } from "lucide-react";
import { useProductBuilderStore } from "@/features/products/stores/productBuilderStore";

const OFFER_TYPES = [
  { value: "LIMITED_TIME", label: "Limited Time" },
  { value: "EARLY_BIRD", label: "Early Bird" },
  { value: "LAST_MINUTE", label: "Last Minute" },
];

const DISCOUNT_TYPES = [
  { value: "PERCENTAGE", label: "Percentage" },
  { value: "FIXED_AMOUNT", label: "Fixed Amount" },
];

function emptyOffer() {
  return {
    name: "",
    offerType: "LIMITED_TIME",
    discountType: "PERCENTAGE",
    discountPercentage: 10,
    fixedDiscountValue: null,
    promoCode: "",
    startDate: "",
    endDate: "",
    isActive: true,
  };
}

function Section({ title, subtitle, icon: Icon, children }) {
  return (
    <div className="py-4 border-b border-slate-100 last:border-b-0">
      {(title || Icon) && (
        <div className="flex items-center gap-3 mb-3">
          {Icon && (
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
              <Icon size={16} className="text-emerald-600" />
            </div>
          )}
          <div>
            <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

export default function PreviewStep() {
  const { product, updateProduct } = useProductBuilderStore();
  const specialOffers = product.specialOffers || [];

  const [offerModal, setOfferModal] = useState(null);
  const [offerForm, setOfferForm] = useState(emptyOffer());

  const openCreateOffer = () => {
    setOfferForm(emptyOffer());
    setOfferModal("create");
  };

  const openEditOffer = (offer) => {
    setOfferForm({
      name: offer.name || "",
      offerType: offer.offerType || "LIMITED_TIME",
      discountType: offer.discountType || "PERCENTAGE",
      discountPercentage: offer.discountPercentage || 10,
      fixedDiscountValue: offer.fixedDiscountValue || null,
      promoCode: offer.promoCode || "",
      startDate: offer.startDate ? offer.startDate.split("T")[0] : "",
      endDate: offer.endDate ? offer.endDate.split("T")[0] : "",
      isActive: offer.isActive !== false,
    });
    setOfferModal({ mode: "edit", index: specialOffers.indexOf(offer) });
  };

  const saveOffer = () => {
    if (!offerForm.name.trim()) return;
    const payload = {
      ...offerForm,
      startDate: offerForm.startDate || null,
      endDate: offerForm.endDate || null,
      promoCode: offerForm.promoCode.trim() || null,
    };
    if (offerModal?.mode === "edit") {
      const updated = [...specialOffers];
      updated[offerModal.index] = { ...updated[offerModal.index], ...payload };
      updateProduct({ specialOffers: updated });
    } else {
      updateProduct({ specialOffers: [...specialOffers, payload] });
    }
    setOfferModal(null);
  };

  const heroPhoto = product.photos?.find(p => p.id === product.heroImage) || product.photos?.[0] || null;
  const enabledAgeGroups = product.pricing?.ageGroups?.filter(ag => ag.enabled) || [];
  const highlights = (product.content?.highlights || []).filter(h => typeof h === 'string' && h.trim());
  const rawUSP = product.content?.uniqueSellingPoints || [];
  const uniqueSellingPoints = Array.isArray(rawUSP) ? rawUSP : (rawUSP.trim() ? [rawUSP.trim()] : []);
  const itinerary = product.content?.itinerary || [];
  const included = product.content?.included || [];
  const excluded = product.content?.excluded || [];
  const operatingDays = product.schedule?.operatingDays || [];
  const timeSlots = product.schedule?.timeSlots || [];
  const whatToBring = product.content?.whatToBring?.filter(w => w.trim()) || [];
  const accessibility = product.content?.accessibility || {};
  const healthRestrictions = product.content?.healthRestrictions || [];
  const languages = product.content?.languages || [];
  const tags = product.tags || [];
  const secondaryThemes = product.secondaryThemes || [];
  const transportModes = product.tourTransportationModes || [];
  const prices = product.pricing?.schedules?.[0]?.prices || [];
  const hasPricing = prices.length > 0 && enabledAgeGroups.length > 0;

  // Merge product + pickup photos for gallery display, dedup by URL
  const allGalleryPhotos = (() => {
    const productUrls = (product.photos || []).map(p => (typeof p === 'string' ? p : p.url)).filter(Boolean);
    const pickupUrls = (product.content?.pickupPhotoUrls || []).map(p => (typeof p === 'string' ? p : p.url)).filter(Boolean);
    return [...new Set([...productUrls, ...pickupUrls])];
  })();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-1 h-10 bg-linear-to-b from-emerald-500 to-emerald-300 rounded-full" />
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">Preview Your Product</h1>
          <p className="text-sm text-slate-500 mt-0.5">Review everything before submitting for review.</p>
        </div>
      </div>

      {/* Product Card Preview */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Hero Image */}
        <div className="relative h-48 bg-slate-100">
          {heroPhoto?.url ? (
            <img
              src={heroPhoto.url}
              alt={product.title || "Product image"}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-slate-400">
                <MapPin size={24} className="mx-auto mb-2" />
                <p className="text-sm font-medium">{product.city || "Location"}{product.country ? `, ${product.country}` : ""}</p>
              </div>
            </div>
          )}

          {/* Status Badge */}
          <div className="absolute top-4 left-4">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${
              product.status === "active"
                ? "bg-emerald-600 text-white"
                : "bg-slate-800/80 text-white backdrop-blur-sm"
            }`}>
              {product.status === "active" ? (
                <><Check size={12} /> Live</>
              ) : (
                <><AlertCircle size={12} /> Draft</>
              )}
            </span>
          </div>

          {/* Pricing Badge */}
          {hasPricing && (
            <div className="absolute top-4 right-4">
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-white text-slate-800 shadow-sm">
                {product.pricing.currency} {prices[0]?.retailPrice || "—"}
                {product.pricing.pricingModel === "perPerson" ? " / person" : " / group"}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Title & Location */}
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {product.title || "Untitled Product"}
            </h3>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <MapPin size={13} className="text-slate-400" />
                {product.city || "—"}{product.country ? `, ${product.country}` : ""}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={13} className="text-slate-400" />
                {product.duration ? `${product.duration} ${product.durationUnit}` : "—"}
              </span>
              {product.difficulty && (
                <span className="flex items-center gap-1.5">
                  <Star size={13} className="text-slate-400" />
                  {product.difficulty}
                </span>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Category</span>
              <span className="text-sm font-medium text-slate-800 capitalize">{product.category || "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Max Group</span>
              <span className="text-sm font-medium text-slate-800">{product.pricing?.maxTravelersPerBooking || "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Currency</span>
              <span className="text-sm font-medium text-slate-800">{product.pricing?.currency || "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Booking Type</span>
              <span className="text-sm font-medium text-slate-800 capitalize">{product.bookingRules?.confirmationType || "manual"}</span>
            </div>
          </div>

          {/* Photos Gallery */}
          {allGalleryPhotos.length > 0 && (
            <Section title="Photos" subtitle={`${allGalleryPhotos.length} photo${allGalleryPhotos.length !== 1 ? "s" : ""}`} icon={ImageIcon}>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {allGalleryPhotos.map((url, i) => (
                  <div key={i} className="relative aspect-[4/3] rounded-lg overflow-hidden bg-slate-100">
                    <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Description */}
          {product.description && (
            <Section title="Description" icon={FileText}>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{product.description}</p>
            </Section>
          )}

          {/* Themes */}
          {(product.theme || product.primaryTheme || secondaryThemes.length > 0) && (
            <Section title="Themes" icon={TagIcon}>
              <div className="flex flex-wrap gap-2">
                {(product.primaryTheme || product.theme) && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700">
                    {product.primaryTheme || product.theme}
                  </span>
                )}
                {secondaryThemes.map((t, i) => (
                  <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600">
                    {t}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* Categorization */}
          {(product.productType || product.activityType || transportModes.length > 0 || product.subcategory) && (
            <Section title="Categorization" icon={BookOpen}>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {product.productType && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Type</span>
                    <span className="font-medium text-slate-700 capitalize">{product.productType}</span>
                  </div>
                )}
                {product.activityType && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Activity</span>
                    <span className="font-medium text-slate-700">{product.activityType}</span>
                  </div>
                )}
                {product.subcategory && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Subcategory</span>
                    <span className="font-medium text-slate-700 capitalize">{product.subcategory}</span>
                  </div>
                )}
                {product.difficulty && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Difficulty</span>
                    <span className="font-medium text-slate-700">{product.difficulty}</span>
                  </div>
                )}
              </div>
              {transportModes.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {transportModes.map((m, i) => (
                    <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600">
                      {m}
                    </span>
                  ))}
                </div>
              )}
            </Section>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <Section title="Tags" icon={TagIcon}>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, i) => (
                  <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600">
                    {tag}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* Highlights */}
          {highlights.length > 0 && (
            <Section title="Highlights" icon={CheckCircle}>
              <ul className="space-y-1.5">
                {highlights.map((h, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                    <Check size={12} className="text-emerald-500 shrink-0" />
                    {h}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Meeting & Pickup */}
          {(product.content?.meetingPoint || product.content?.meetingInstructions || product.content?.pickupAvailable) && (
            <Section title="Meeting & Pickup" subtitle="Where and how to join" icon={MapPin}>
              {product.content?.meetingPoint && (
                <div className="flex items-start gap-2 text-sm mb-2">
                  <MapPin size={13} className="text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-500">Meeting point:</span>
                    <p className="text-slate-700">{product.content.meetingPoint}</p>
                    {product.content.meetingPointAddress && <p className="text-xs text-slate-400">{product.content.meetingPointAddress}</p>}
                  </div>
                </div>
              )}
              {product.content?.meetingInstructions && (
                <div className="flex items-start gap-2 text-sm">
                  <Info size={13} className="text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-500">Instructions:</span>
                    <p className="text-slate-700">{product.content.meetingInstructions}</p>
                  </div>
                </div>
              )}
              {product.content?.pickupAvailable && (
                <div className="flex items-center gap-2 text-sm mt-2 text-emerald-600">
                  <Check size={13} className="shrink-0" />
                  <span>Pickup available</span>
                  {product.content?.pickupAdditionalDetails && (
                    <span className="text-slate-500">— {product.content.pickupAdditionalDetails}</span>
                  )}
                </div>
              )}
            </Section>
          )}

          {/* Languages */}
          {languages.length > 0 && (
            <Section title="Languages" icon={Globe}>
              <div className="flex flex-wrap gap-2">
                {languages.map((lang, i) => (
                  <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600">
                    {lang}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* Unique Selling Points */}
          {uniqueSellingPoints.length > 0 && (
            <Section title="Unique Selling Points" icon={Star}>
              <ul className="space-y-1.5">
                {uniqueSellingPoints.map((point, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                    <Check size={12} className="text-emerald-500 shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* What to Bring */}
          {whatToBring.length > 0 && (
            <Section title="What to Bring" icon={Briefcase}>
              <ul className="space-y-1.5">
                {whatToBring.map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                    <Check size={12} className="text-slate-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Accessibility & Health */}
          {(Object.values(accessibility).some(Boolean) || healthRestrictions.length > 0 || product.content?.physicalDifficulty) && (
            <Section title="Accessibility & Health" icon={Info}>
              {Object.entries(accessibility).filter(([, v]) => v).map(([key]) => (
                <div key={key} className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                  <Check size={12} className="text-emerald-500 shrink-0" />
                  <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                </div>
              ))}
              {product.content?.physicalDifficulty && (
                <div className="flex items-center gap-2 text-sm text-slate-600 mt-2">
                  <Star size={12} className="text-slate-400 shrink-0" />
                  <span>Physical level: <span className="font-medium capitalize">{product.content.physicalDifficulty}</span></span>
                </div>
              )}
              {healthRestrictions.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-slate-500 mb-1">Health restrictions:</p>
                  <ul className="space-y-1">
                    {healthRestrictions.map((r, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-slate-600">
                        <AlertCircle size={10} className="text-amber-400 shrink-0" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Section>
          )}

          {/* Traveler Info Requirements */}
          {(product.content?.passportRequired || product.content?.flightInfoRequired || product.content?.shipInfoRequired || product.content?.trainInfoRequired || product.content?.hotelInfoRequired) && (
            <Section title="Traveler Information Required" icon={Plane}>
              <div className="flex flex-wrap gap-2">
                {product.content?.passportRequired && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600">Passport</span>
                )}
                {product.content?.flightInfoRequired && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600">Flight</span>
                )}
                {product.content?.shipInfoRequired && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600">Ship/Cruise</span>
                )}
                {product.content?.trainInfoRequired && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600">Train</span>
                )}
                {product.content?.hotelInfoRequired && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600">Hotel</span>
                )}
              </div>
            </Section>
          )}

          {/* Age Groups */}
          {enabledAgeGroups.length > 0 && (
            <Section title="Age Groups" icon={Users}>
              <div className="flex flex-wrap gap-2">
                {enabledAgeGroups.map((ag, i) => (
                  <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600">
                    {ag.name} ({ag.minAge}–{ag.maxAge})
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* Complete Pricing */}
          {hasPricing && (
            <Section
              title={`Pricing`}
              subtitle={product.pricing.pricingModel === "perPerson" ? "Per person" : "Per group"}
              icon={DollarSign}
            >
              {product.pricing.schedules[0]?.startDate && (
                <p className="text-xs text-slate-400 mb-3">
                  Valid {product.pricing.schedules[0].startDate}{product.pricing.schedules[0].endDate ? ` — ${product.pricing.schedules[0].endDate}` : ""}
                </p>
              )}
              <div className="space-y-2">
                {prices.map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-sm font-medium text-slate-700">{p.ageGroup || `Tier ${i + 1}`}</span>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-slate-500">Retail: <span className="font-semibold text-slate-800">{product.pricing.currency} {p.retailPrice || "—"}</span></span>
                      {p.commissionRate && (
                        <span className="text-slate-400">Commission: {p.commissionRate}%</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Itinerary */}
          {itinerary.length > 0 && (
            <Section title="Itinerary" subtitle={`${itinerary.length} stops`} icon={Calendar}>
              <div className="space-y-0">
                {itinerary.map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-semibold text-slate-400 w-6 text-center shrink-0">{i + 1}</span>
                      {i < itinerary.length - 1 && <div className="w-px flex-1 bg-slate-200 my-1" />}
                    </div>
                    <div className="flex-1 min-w-0 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-800">{item.title || `Stop ${i + 1}`}</span>
                        {item.time && <span className="text-xs text-slate-400">{item.time}</span>}
                      </div>
                      {item.description && <p className="text-xs text-slate-500 mt-1">{item.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Operating Days & Time Slots */}
          {operatingDays.length > 0 && (
            <Section title="Operating Days" icon={Calendar}>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => {
                  const isActive = operatingDays.includes(day);
                  return (
                    <div key={day} className={`w-8 h-8 rounded-md flex items-center justify-center text-[10px] font-semibold ${
                      isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-400"
                    }`}>
                      {day.slice(0, 2).toUpperCase()}
                    </div>
                  );
                })}
              </div>
              {timeSlots.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {timeSlots.map((slot, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600">
                      <Clock size={10} className="text-slate-400" />
                      {slot.startTime}{slot.endTime ? ` — ${slot.endTime}` : ""}
                    </span>
                  ))}
                </div>
              )}
            </Section>
          )}

          {/* Cancellation Policy */}
          {product.cancellationPolicy && (
            <Section title="Cancellation Policy" icon={Shield}>
              <div className="flex items-center gap-2 text-sm">
                <span className="capitalize text-slate-700 font-medium">{product.cancellationPolicy === "flexible" ? "Flexible" : "Non-refundable"}</span>
                {product.refundRules && <span className="text-slate-400">— {product.refundRules}</span>}
              </div>
            </Section>
          )}

          {/* Booking Rules */}
          <Section title="Booking Rules" icon={FileText}>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Confirmation</span>
                <span className="font-medium text-slate-700 capitalize">{product.bookingRules?.confirmationType || "manual"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Advance booking</span>
                <span className="font-medium text-slate-700">{product.bookingRules?.minAdvanceBookingHours || "—"} hours</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Min group size</span>
                <span className="font-medium text-slate-700">{product.bookingRules?.minGroupSize || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Max group size</span>
                <span className="font-medium text-slate-700">{product.bookingRules?.maxGroupSize || "—"}</span>
              </div>
            </div>
          </Section>

          {/* Special Offers */}
          <Section title="Special Offers" subtitle={`${specialOffers.length} offer${specialOffers.length !== 1 ? "s" : ""} linked`} icon={TagIcon}>
            <div className="flex items-center justify-end mb-3">
              <button
                onClick={openCreateOffer}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-600 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors"
              >
                <Plus size={12} />
                Create Offer
              </button>
            </div>

            {specialOffers.length > 0 && (
              <div className="space-y-2 mb-3">
                {specialOffers.map((offer, i) => (
                  <div key={offer.offerId || i} className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{offer.name}</p>
                      <p className="text-xs text-slate-500">
                        {offer.discountType === "PERCENTAGE" ? `${offer.discountPercentage}% off` : `$${offer.fixedDiscountValue} off`}
                        {offer.offerType === "LIMITED_TIME" ? " — Limited Time" : offer.offerType === "EARLY_BIRD" ? " — Early Bird" : " — Last Minute"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditOffer(offer)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-white transition-colors"
                        title="Edit offer"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => updateProduct({ specialOffers: specialOffers.filter((_, idx) => idx !== i) })}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-white transition-colors"
                        title="Unlink offer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-slate-400">
              Create special offers to add discounts, early bird pricing, and promo codes.
            </p>
          </Section>

          {/* Special Offer Create/Edit Modal */}
          {offerModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {offerModal?.mode === "edit" ? "Edit Offer" : "Create Offer"}
                  </h3>
                  <button onClick={() => setOfferModal(null)} className="p-1 text-slate-400 hover:text-slate-600">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Offer Name</label>
                    <input
                      type="text"
                      value={offerForm.name}
                      onChange={(e) => setOfferForm({ ...offerForm, name: e.target.value })}
                      placeholder="e.g. Summer Sale"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Offer Type</label>
                      <select
                        value={offerForm.offerType}
                        onChange={(e) => setOfferForm({ ...offerForm, offerType: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      >
                        {OFFER_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Discount Type</label>
                      <select
                        value={offerForm.discountType}
                        onChange={(e) => setOfferForm({ ...offerForm, discountType: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      >
                        {DISCOUNT_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {offerForm.discountType === "PERCENTAGE" ? (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        <Percent size={12} className="inline mr-1" />
                        Discount Percentage
                      </label>
                      <input
                        type="number"
                        value={offerForm.discountPercentage}
                        onChange={(e) => setOfferForm({ ...offerForm, discountPercentage: Number(e.target.value) })}
                        min="1"
                        max="100"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        <Hash size={12} className="inline mr-1" />
                        Fixed Discount Value ({product.pricing?.currency || "USD"})
                      </label>
                      <input
                        type="number"
                        value={offerForm.fixedDiscountValue || ""}
                        onChange={(e) => setOfferForm({ ...offerForm, fixedDiscountValue: Number(e.target.value) })}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Promo Code</label>
                    <input
                      type="text"
                      value={offerForm.promoCode}
                      onChange={(e) => setOfferForm({ ...offerForm, promoCode: e.target.value })}
                      placeholder="e.g. SUMMER10"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={offerForm.startDate}
                        onChange={(e) => setOfferForm({ ...offerForm, startDate: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                      <input
                        type="date"
                        value={offerForm.endDate}
                        onChange={(e) => setOfferForm({ ...offerForm, endDate: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={offerForm.isActive}
                      onChange={(e) => setOfferForm({ ...offerForm, isActive: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                    />
                    Active immediately
                  </label>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setOfferModal(null)}
                    className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveOffer}
                    disabled={!offerForm.name.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {offerModal?.mode === "edit" ? "Save Changes" : "Add Offer"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Inclusions / Exclusions */}
          {(included.length > 0 || excluded.length > 0) && (
            <div className="py-4">
              <div className="grid grid-cols-2 gap-6">
                {included.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 mb-2">Included</h4>
                    <ul className="space-y-1.5">
                      {included.map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-slate-600">
                          <Check size={12} className="text-emerald-500 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {excluded.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 mb-2">Not Included</h4>
                    <ul className="space-y-1.5">
                      {excluded.map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-slate-600">
                          <AlertCircle size={12} className="text-slate-400 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Publish Status */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
            <Globe size={16} className="text-emerald-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Publish Status</h3>
            <p className="text-xs text-slate-500">Choose how to publish your product</p>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                value: "draft",
                label: "Save as Draft",
                desc: "Save your progress and publish later.",
                icon: FileEdit,
              },
              {
                value: "active",
                label: "Publish Now",
                desc: "Make your product live and visible to customers.",
                icon: Globe,
              },
            ].map((status) => {
              const Icon = status.icon;
              const selected = product.status === status.value;
              return (
                <button
                  key={status.value}
                  onClick={() => useProductBuilderStore.getState().updateProduct({ status: status.value })}
                  className={`relative p-4 rounded-xl border text-left transition-all ${
                    selected
                      ? "border-emerald-500 bg-emerald-50/50 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      selected ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                    }`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-semibold ${selected ? "text-emerald-800" : "text-slate-800"}`}>
                          {status.label}
                        </p>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          selected ? "border-emerald-600" : "border-slate-200"
                        }`}>
                          {selected && <div className="w-2 h-2 rounded-full bg-emerald-600" />}
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{status.desc}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
