import { useParams, useSearchParams, useNavigate, useBlocker } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { X, Loader2, AlertCircle, Menu } from "lucide-react";
import { useProductBuilderStore, SECTIONS } from "@/features/products/stores/productBuilderStore";
import { getMyProduct } from "@/features/products/api";
import WizardStepLayout from "@/features/products/components/WizardStepLayout";
import WizardSidebar from "@/features/products/components/WizardSidebar";
import LanguageTitleStep from "@/features/products/components/LanguageTitleStep";
import CategorizationStep from "@/features/products/components/CategorizationStep";
import ThemeStep from "@/features/products/components/ThemeStep";
import ProductPhotosStep from "@/features/products/components/ProductPhotosStep";
import MeetingPickupStep from "@/features/products/components/MeetingPickupStep";
import TourDetailsStep from "@/features/products/components/TourDetailsStep";
import LanguagesOfferedStep from "@/features/products/components/LanguagesOfferedStep";
import InclusionsExclusionsStep from "@/features/products/components/InclusionsExclusionsStep";
import USPStep from "@/features/products/components/USPStep";
import TravelerInfoStep from "@/features/products/components/TravelerInfoStep";
import TravelerDetailsStep from "@/features/products/components/TravelerDetailsStep";
import PricingSchedulesStep from "@/features/products/components/PricingSchedulesStep";
import BookingProcessStep from "@/features/products/components/BookingProcessStep";
import CancellationPolicyStep from "@/features/products/components/CancellationPolicyStep";
import TravelerRequiredInfoStep from "@/features/products/components/TravelerRequiredInfoStep";
import PreviewStep from "@/features/products/components/PreviewStep";
import { normalizeHighlights } from "@/features/products/utils/normalizeHighlights";
import { normalizeItinerary } from "@/features/products/utils/normalizeItinerary";
import {
  parseProductTypeFromCategorization,
} from "@/features/products/utils/productTypeFromCategorization";

const STEPS = [
  { id: "language-and-title", label: "Language & Title", description: "Choose your writing language and set your product title.", component: LanguageTitleStep },
  { id: "categorization", label: "Categorization", description: "Choose your product type and categorize it.", component: CategorizationStep },
  { id: "theme", label: "Theme", description: "Choose themes that best describe your product.", component: ThemeStep },
  { id: "photos", label: "Photos & Media", description: "Upload photos and add media to showcase your product.", component: ProductPhotosStep },
  { id: "meeting-and-pickup", label: "Meeting & Pickup", description: "Set meeting and pickup instructions.", component: MeetingPickupStep },
  { id: "tour-details", label: "Tour Details", description: "Add itinerary and highlights for your product.", component: TourDetailsStep },
  { id: "languages-offered", label: "Languages Offered", description: "Select languages your product is offered in.", component: LanguagesOfferedStep },
  { id: "inclusions-exclusions", label: "Inclusions & Exclusions", description: "Specify what's included and excluded.", component: InclusionsExclusionsStep },
  { id: "unique-selling-points", label: "What Makes Your Product Unique", description: "Describe what sets your product apart.", component: USPStep },
  { id: "info-travelers-need", label: "Information Travelers Need", description: "Provide important information for travelers.", component: TravelerInfoStep },
  { id: "traveler-details", label: "Traveler Details", description: "Select details to collect from travelers.", component: TravelerDetailsStep },
  { id: "pricing-schedules", label: "Pricing Schedules", description: "Set pricing tiers, taxes, and fees.", component: PricingSchedulesStep },
  { id: "booking-process", label: "Booking Process", description: "Configure booking confirmation, cut-off, and operating days.", component: BookingProcessStep },
  { id: "cancellation-policy", label: "Cancellation Policy", description: "Set cancellation and refund policies.", component: CancellationPolicyStep },
  { id: "traveler-required-info", label: "Traveler Required Info", description: "Select information to collect from travelers.", component: TravelerRequiredInfoStep },
  { id: "preview", label: "Preview", description: "Preview your product before submitting.", component: PreviewStep },
];

function tourToProduct(tour) {
  if (!tour) return null;

  const categorization = tour.categorization || {};
  const theme = tour.theme || {};
  const content = tour.productContent || {};
  const schedules = tour.schedulesAndPricing || {};
  const booking = tour.bookingAndTickets || {};
  const pricingSchedules = schedules.pricingSchedules || {};
  const cancellation = booking.cancellationPolicy || {};
  const meetingPoint = booking.meetingPoint || {};
  const location = content.location || {};
  const duration = categorization.duration || {};
  const groupSize = categorization.groupSize || {};
  const transportMode = categorization.transportMode || {};
  const transportModes = [
    ...(transportMode.land || []),
    ...(transportMode.air || []),
  ];

  const durationHours = duration.hours || 0;
  const durationMinutes = duration.minutes || 0;
  const durationDays = duration.days || 0;
  const durationValue = durationMinutes || durationHours || durationDays;
  const durationUnit = durationMinutes > 0 ? "minutes" : durationDays > 0 ? "days" : "hours";

  const dayMapping = {
    Monday: "monday", Tuesday: "tuesday", Wednesday: "wednesday",
    Thursday: "thursday", Friday: "friday", Saturday: "saturday", Sunday: "sunday",
  };
  const operatingDays = (schedules.operatingDays || []).map(
    (d) => dayMapping[d] || d?.toLowerCase?.() || d
  );

  const timeSlots = (schedules.timeSlots || []).map((slot) => ({
    startTime: typeof slot === "string" ? slot : (slot.startTime || slot),
    endTime: slot.endTime || "",
  }));

  const {
    productType,
    tourDurationCategory,
    activityCategories,
    transportCategories,
  } = parseProductTypeFromCategorization(categorization);

  return {
    title: tour.title || "",
    referenceCode: tour.referenceCode || "",
    description: tour.description || "",
    shortSummary: content.shortSummary || "",
    specialOffers: tour.specialOffers || [],
    category: categorization.category || "",
    subcategory: categorization.subcategory || "",
    theme: theme.primaryTheme || theme.primary || "",
    primaryTheme: theme.primaryTheme || theme.primary || "",
    secondaryThemes: theme.secondaryThemes || theme.secondary || [],
    tags: tour.tags || [],
    slug: tour.slug || "",
    difficulty: categorization.difficulty || "Easy",
    duration: durationValue,
    durationUnit,
    activityType: categorization.activityType || "Guided Tour",
    productType,
    tourTransportationModes: transportModes,
    tourDurationCategory,
    activityCategories,
    transportCategories,
    city: location.city || tour.city || "",
    country: location.country || tour.country || "",
    region: location.region || "",
    latitude: tour.latitude,
    longitude: tour.longitude,
    metaTitle: tour.metaTitle || tour.title || "",
    metaDescription: tour.metaDescription || "",
    photos: (tour.photos || []).map((url, i) => ({
      id: `photo_${i}_${url}`,
      url,
      file: null,
      alt: '',
    })),
    heroImage: (() => {
      if (!tour.coverPhoto) return null;
      const extractId = (url) => {
        if (!url) return '';
        const m = url.match(/\/(?:v\d+\/)?([^/]+)$/);
        return m ? m[1] : url;
      };
      const coverId = extractId(tour.coverPhoto);
      const idx = (tour.photos || []).findIndex((url) => extractId(url) === coverId);
      return idx >= 0 ? `photo_${idx}_${tour.photos[idx]}` : null;
    })(),
    videoUrl: "",
    pricing: {
      pricingModel: schedules.travelerDetails?.pricingModel || "perPerson",
      vehicleType: schedules.travelerDetails?.vehicleType || "",
      maxTravelersPerBooking: schedules.travelerDetails?.maxTravelersPerBooking ?? 2,
      currency: pricingSchedules.currency || "USD",
      ageGroups: (() => {
        const apiAgeGroups = schedules.travelerDetails?.ageGroups || [];
        if (apiAgeGroups.length > 0) {
          return apiAgeGroups.map(ag => ({
            name: ag.label,
            enabled: true,
            minAge: ag.minAge ?? 0,
            maxAge: ag.maxAge ?? 99,
          }));
        }
        return [
          { name: "Adult", enabled: true, minAge: 18, maxAge: 64 },
          { name: "Infant", enabled: false, minAge: 0, maxAge: 2 },
          { name: "Child", enabled: false, minAge: 3, maxAge: 17 },
          { name: "Youth", enabled: false, minAge: 12, maxAge: 17 },
          { name: "Senior", enabled: false, minAge: 65, maxAge: 99 },
        ];
      })(),
      schedules: [{
        startDate: pricingSchedules.schedules?.[0]?.startDate || "",
        endDate: pricingSchedules.schedules?.[0]?.endDate || "",
        prices: (pricingSchedules.schedules?.[0]?.prices || []).map(p => ({
          ageGroup: p.ageGroup,
          retailPrice: p.retailPrice ?? "",
          commissionRate: p.commissionRate ?? 15,
        })),
      }],
      taxes: "",
      fees: "",
      commissionRate: 15,
    },
    cancellationPolicy: cancellation.type || "flexible",
    refundRules: booking.refundRules || cancellation.refundPercentage ? `${cancellation.refundPercentage}%` : "",
    schedule: {
      operatingDays: operatingDays.length > 0 ? operatingDays : [],
      timeSlots: timeSlots.length > 0 ? timeSlots : [{ startTime: "09:00", endTime: "12:00" }],
      seasonalAvailability: "all_year",
      blackoutDates: [],
      capacityPerSlot: schedules.capacityPerSlot ?? 20,
      bookingCutoffHours: cancellation.cutoffHours ?? 24,
    },
    bookingRules: {
      confirmationType: booking.confirmationType || (booking.instantBooking ? "instant" : "manual"),
      minAdvanceBookingHours: booking.minAdvanceBookingHours ?? 48,
      maxGroupSize: groupSize.max ?? 20,
      minGroupSize: groupSize.min ?? 1,
      instantBooking: booking.instantBooking ?? false,
      refundPercentage: cancellation.refundPercentage ?? 100,
      travelerRequiredInfo: booking.travelerRequiredInfo || [],
      ticketTypes: [],
      redemptionInstructions: "",
      redemptionVenueAddress: "",
    },
    content: {
      writingLanguage: content.writingLanguage || "English",
      shortSummary: content.shortSummary || "",
      itinerary: normalizeItinerary(content.itinerary),
      highlights: normalizeHighlights(content.highlights),
      included: content.included || [],
      excluded: content.excluded || [],
      whatToBring: content.whatToBring || [],
      meetingInstructions: content.meetingInstructions || "",
      meetingPoint: meetingPoint.name || meetingPoint.address || "",
      meetingPointAddress: meetingPoint.address || "",
      meetingPointLat: meetingPoint.coordinates?.lat || null,
      meetingPointLng: meetingPoint.coordinates?.lng || null,
      pickupAvailable: content.pickupAvailable ?? booking.pickupAvailable ?? false,
      pickupAreas: content.pickupAreas || [],
      pickupLocations: content.pickupLocations || [],
      pickupCustomLocation: content.pickupCustomLocation ?? false,
      pickupLeadTime: content.pickupLeadTime ?? 30,
      pickupType: content.pickupType || "",
      pickupAppearance: content.pickupAppearance || "",
      pickupPhotoUrls: content.pickupPhotoUrls || [],
      pickupAdditionalDetails: content.pickupAdditionalDetails || booking.pickupDetails || "",
      dropoffAvailable: content.dropoffAvailable ?? false,
      dropoffSameAsPickup: content.dropoffSameAsPickup ?? true,
      dropoffTime: content.dropoffTime ?? 0,
      additionalInfo: content.additionalInfo || "",
      uniqueSellingPoints: Array.isArray(content.uniqueSellingPoints) ? content.uniqueSellingPoints : (content.uniqueSellingPoints ? [content.uniqueSellingPoints] : []),
      travelerRequirements: content.travelerRequirements || "",
      languages: content.languages || ["English"],
      hasGuideLead: content.hasGuideLead ?? false,
      guideType: content.guideType || "",
      inclusionsConfirmed: content.inclusionsConfirmed ?? false,
      isPrivateActivity: content.isPrivateActivity ?? false,
      maxTravelers: content.maxTravelers ?? 20,
      resellerType: content.resellerType || "not_reseller",
      accessibility: content.accessibility || {
        wheelchairAccessible: true,
        transportationWheelchairAccessible: true,
        surfacesWheelchairAccessible: true,
        strollerAccessible: true,
        serviceAnimalsAllowed: true,
        publicTransportation: true,
        infantsOnLaps: true,
        infantSeatsAvailable: true,
        custom: [],
      },
      healthRestrictions: content.healthRestrictions || [],
      physicalDifficulty: content.physicalDifficulty || "easy",
      contactPhone: content.contactPhone || { countryCode: "+233", number: "" },
      passportRequired: content.passportRequired ?? false,
      flightInfoRequired: content.flightInfoRequired ?? false,
      shipInfoRequired: content.shipInfoRequired ?? false,
      trainInfoRequired: content.trainInfoRequired ?? false,
      hotelInfoRequired: content.hotelInfoRequired ?? false,
    },
    status: (tour.status || "draft").toLowerCase(),
    totalBookings: tour._count?.bookings ?? tour.totalBookings ?? 0,
    totalRevenue: tour.totalRevenue || 0,
    averageRating: tour.averageRating || 0,
    reviewCount: tour._count?.reviews ?? tour.reviewCount ?? 0,
    viewCount: tour.viewCount || 0,
    supplier: tour.supplier || null,
    createdAt: tour.createdAt || new Date().toISOString(),
    updatedAt: tour.updatedAt || new Date().toISOString(),
  };
}

export default function ProductBuilderPage() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    currentStep,
    loadDraft,
    hasHydrated,
    currentSectionId,
    currentStepId,
    navigateTo,
    isDirty,
    isSubmitting,
  } = useProductBuilderStore();
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [productError, setProductError] = useState(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showExitWarning, setShowExitWarning] = useState(false);

  // Block in-app navigation when dirty
  const blocker = useBlocker(
    useCallback(
      ({ currentLocation, nextLocation }) =>
        isDirty && !isSubmitting && currentLocation.pathname !== nextLocation.pathname,
      [isDirty, isSubmitting],
    ),
  );

  // Show confirmation dialog when navigation is blocked
  useEffect(() => {
    if (blocker.state === "blocked") {
      setShowExitWarning(true);
    }
  }, [blocker.state]);

  const handleConfirmExit = () => {
    setShowExitWarning(false);
    blocker.proceed?.();
  };

  const handleCancelExit = () => {
    setShowExitWarning(false);
    blocker.reset?.();
  };

  // Warn on tab close / browser refresh
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // Read query params
  const querySection = searchParams.get("section") || "basics";
  const queryStep = searchParams.get("step") || "language-and-title";

  // Sync store with query params on mount / param change
  useEffect(() => {
    if (!hasHydrated) return;
    const section = SECTIONS.find((s) => s.id === querySection);
    if (section) {
      const step = section.steps.find((s) => s.id === queryStep);
      if (step) {
        navigateTo(querySection, queryStep);
      }
    }
  }, [querySection, queryStep, hasHydrated]);

  // Update URL when store changes (via next/prev buttons)
  useEffect(() => {
    if (!hasHydrated) return;
    const section = currentSectionId || "basics";
    const step = currentStepId || "language-and-title";
    if (section !== querySection || step !== queryStep) {
      setSearchParams({ section, step }, { replace: true });
    }
  }, [currentSectionId, currentStepId, hasHydrated]);

  // Reset store when starting a new product
  useEffect(() => {
    if (hasHydrated && (!id || id === "new")) {
      useProductBuilderStore.getState().reset();
    }
  }, [id, hasHydrated]);

  // Load existing product from API when editing
  useEffect(() => {
    if (!id || id === "new" || !hasHydrated) return;

    let cancelled = false;
    setLoadingProduct(true);
    setProductError(null);

    getMyProduct(id)
      .then((res) => {
        if (cancelled) return;
        const tour = res.data?.data?.tour;
        if (!tour) {
          setProductError("Product not found");
          return;
        }
        const product = tourToProduct(tour);
        loadDraft(product);
      })
      .catch((err) => {
        if (cancelled) return;
        setProductError(err.response?.data?.message || err.message || "Failed to load product");
      })
      .finally(() => {
        if (!cancelled) setLoadingProduct(false);
      });

    return () => { cancelled = true; };
  }, [id, hasHydrated]);

  if (loadingProduct) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-emerald-600" />
          <p className="text-sm text-slate-500">Loading product...</p>
        </div>
      </div>
    );
  }

  if (productError) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="bg-red-50 border border-red-300 rounded-xl p-6 max-w-md text-center shadow-sm">
            <AlertCircle size={40} className="text-red-600 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-red-800 mb-2">Failed to Load Product</h2>
            <p className="text-sm text-red-700 mb-4">{productError}</p>
            <button
              onClick={() => navigate("/products")}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              Back to Products
            </button>
          </div>
        </div>
      </div>
    );
  }

  const CurrentStepComponent = STEPS[currentStep]?.component;

  return (
    <>
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Fixed header */}
      <div className="flex-shrink-0 p-4 md:p-6 pb-0">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-1 h-10 bg-linear-to-b from-emerald-500 to-emerald-300 rounded-full" />
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-800">
                {id && id !== "new" ? "Edit Product" : "Create New Product"}
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep]?.label}
              </p>
            </div>
          </div>
          {/* Mobile sidebar toggle */}
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="lg:hidden flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 transition-colors"
          >
            <Menu size={16} />
            Sections
          </button>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl overflow-y-auto">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-800">Sections</span>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>
            <WizardSidebar />
          </div>
        </div>
      )}

      {/* Wizard area — fills remaining height */}
      <div className="flex-1 min-h-0 px-4 md:px-6 pb-4 md:pb-6">
        <WizardStepLayout title={STEPS[currentStep]?.label} description={STEPS[currentStep]?.description}>
          {CurrentStepComponent && <CurrentStepComponent />}
        </WizardStepLayout>
      </div>
    </div>

    {/* Exit Warning Modal */}
    {showExitWarning && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full mx-4 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Unsaved changes</h3>
          <p className="text-sm text-slate-600 mb-6">
            You have unsaved changes. Are you sure you want to leave? Your progress will be lost.
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleCancelExit}
              className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Stay
            </button>
            <button
              onClick={handleConfirmExit}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors"
            >
              Leave anyway
            </button>
          </div>
        </div>
      </div>
    )}
  </>
  );
}
