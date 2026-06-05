import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { RotateCcw, X, Loader2, AlertCircle } from "lucide-react";
import { useProductBuilderStore } from "@/features/products/stores/productBuilderStore";
import { getMyProduct } from "@/features/products/api";
import WizardStepLayout from "@/features/products/components/WizardStepLayout";
import ProductTypeStep from "@/features/products/components/ProductTypeStep";
import ProductBasicsStep from "@/features/products/components/ProductBasicsStep";
import ProductPhotosStep from "@/features/products/components/ProductPhotosStep";
import ProductPricingStep from "@/features/products/components/ProductPricingStep";
import ProductScheduleStep from "@/features/products/components/ProductScheduleStep";
import ProductBookingStep from "@/features/products/components/ProductBookingStep";
import ProductContentStep from "@/features/products/components/ProductContentStep";
import ProductReviewStep from "@/features/products/components/ProductReviewStep";
import { normalizeHighlights } from "@/features/products/utils/normalizeHighlights";
import { normalizeItinerary } from "@/features/products/utils/normalizeItinerary";
import {
  parseProductTypeFromCategorization,
} from "@/features/products/utils/productTypeFromCategorization";

const STEPS = [
  { id: "type", label: "Product Type", description: "Choose the type of product you are creating.", component: ProductTypeStep },
  { id: "basics", label: "Product Basics", description: "Enter the basic information about your product.", component: ProductBasicsStep },
  { id: "content", label: "Product Content", description: "Add itinerary, highlights, languages, and other content.", component: ProductContentStep },
  { id: "photos", label: "Photos & Media", description: "Upload photos and add media to showcase your product.", component: ProductPhotosStep },
  { id: "pricing", label: "Pricing & Tickets", description: "Set pricing tiers, taxes, and cancellation policies.", component: ProductPricingStep },
  { id: "schedule", label: "Schedule & Availability", description: "Define when your product operates and capacity limits.", component: ProductScheduleStep },
  { id: "booking", label: "Booking Rules", description: "Configure how customers can book your product.", component: ProductBookingStep },
  { id: "review", label: "Review & Submit", description: "Review all details before submitting your product.", component: ProductReviewStep },
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
  const tierData = pricingSchedules.schedules?.[0]?.prices || [];

  const transportMode = categorization.transportMode || {};
  const transportModes = [
    ...(transportMode.land || []),
    ...(transportMode.air || []),
  ];

  const tiers = tierData.map((p, i) => {
    const ageGroup = schedules.travelerDetails?.ageGroups?.[i] || {};
    return {
      name: ageGroup.label || p.ageGroup || `Tier ${i + 1}`,
      price: p.retailPrice ?? "",
      minAge: ageGroup.minAge ?? 0,
      maxAge: ageGroup.maxAge ?? 99,
    };
  });

  const durationHours = duration.hours || 0;
  const durationDays = duration.days || 0;
  const durationValue = durationHours || durationDays;
  const durationUnit = durationDays > 0 ? "days" : "hours";

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
    description: tour.description || "",
    shortSummary: content.shortSummary || "",
    category: categorization.category || "",
    subcategory: categorization.subcategory || "",
    theme: theme.primary || "",
    primaryTheme: theme.primary || "",
    secondaryThemes: theme.secondary || [],
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
    region: location.region || tour.region || "",
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
      // Backend may apply different Cloudinary transformations to coverPhoto vs photos,
      // so compare by public ID (the part after /v1/ or the last path segment).
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
      basePrice: tierData[0]?.retailPrice ?? "", 
      currency: pricingSchedules.currency || "USD",
      pricingModel: schedules.travelerDetails?.pricingModel || "perPerson",
      startDate: pricingSchedules.schedules?.[0]?.startDate || "",
      endDate: pricingSchedules.schedules?.[0]?.endDate || "",
      tiers: tiers.length > 0 ? tiers : [
        { name: "Adult", price: "", minAge: 18, maxAge: 64 },
        { name: "Child", price: "", minAge: 3, maxAge: 17 },
        { name: "Senior", price: "", minAge: 65, maxAge: 99 },
      ],
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
      confirmationType: booking.instantBooking ? "instant" : "manual",
      minAdvanceBookingHours: booking.minAdvanceBookingHours ?? 48,
      maxGroupSize: groupSize.max ?? 20,
      minGroupSize: groupSize.min ?? 1,
      meetingPoint: meetingPoint.name || meetingPoint.address || "",
      meetingPointAddress: meetingPoint.address || "",
      meetingPointLat: meetingPoint.coordinates?.lat || null,
      meetingPointLng: meetingPoint.coordinates?.lng || null,
      instantBooking: booking.instantBooking ?? false,
      refundPercentage: cancellation.refundPercentage ?? 100,
      pickupAvailable: booking.pickupAvailable ?? false,
      pickupDetails: booking.pickupDetails || "",
      inclusions: content.included || [],
      exclusions: content.excluded || [],
    },
    content: {
      itinerary: normalizeItinerary(content.itinerary),
      highlights: normalizeHighlights(content.highlights),
      included: content.included || [],
      excluded: content.excluded || [],
      whatToBring: content.whatToBring || [],
      meetingInstructions: content.meetingInstructions || "",
      pickupDescription: booking.pickupDetails || "",
      additionalInfo: content.additionalInfo || "",
      uniqueSellingPoints: content.uniqueSellingPoints || "",
      travelerRequirements: content.travelerRequirements || "",
      languages: content.languages || ["English"],
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
  const { id, step } = useParams();
  const navigate = useNavigate();
  const { currentStep, setStep, reset, loadDraft, hasHydrated } = useProductBuilderStore();
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [productError, setProductError] = useState(null);

  const [showRestoreBanner, setShowRestoreBanner] = useState(false);

  // Map URL step param to step index
  const foundIndex = STEPS.findIndex((s) => s.id === step);
  const stepIndex = foundIndex !== -1 ? foundIndex : 0;

  // Check for saved draft on initial hydration
  useEffect(() => {
    if (!hasHydrated) return;

    if (id && id !== "new") return;

    const saved = localStorage.getItem("product-builder-draft");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const savedProduct = parsed.state?.product;
        if (savedProduct && savedProduct.title && savedProduct.title.trim().length > 0) {
          setShowRestoreBanner(true);
        }
      } catch {
        // Invalid JSON, ignore
      }
    }
  }, [hasHydrated, id]);

  // Sync URL with store
  useEffect(() => {
    if (step && stepIndex !== currentStep) {
      setStep(stepIndex);
    }
  }, [step, stepIndex]);

  // Update URL when step changes
  useEffect(() => {
    const currentStepId = STEPS[currentStep]?.id;
    if (currentStepId && currentStepId !== step) {
      navigate(`/products/build/${id || "new"}/${currentStepId}`, { replace: true });
    }
  }, [currentStep]);

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

  const handleRestoreDraft = () => {
    const saved = localStorage.getItem("product-builder-draft");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const savedState = parsed.state;
        if (savedState) {
          loadDraft(savedState.product);
          const savedStep = savedState.currentStep ?? 0;
          setStep(savedStep);
          const stepId = STEPS[savedStep]?.id;
          if (stepId) {
            navigate(`/products/build/new/${stepId}`, { replace: true });
          }
        }
      } catch {
        localStorage.removeItem("product-builder-draft");
      }
    }
    setShowRestoreBanner(false);
  };

  const handleDismissBanner = () => {
    localStorage.removeItem("product-builder-draft");
    reset();
    setShowRestoreBanner(false);
  };

  if (loadingProduct) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-[#044b3b]" />
          <p className="text-sm text-[#64748b]">Loading product...</p>
        </div>
      </div>
    );
  }

  if (productError) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="bg-[#fef2f2] border border-[#fca5a5] rounded-lg p-6 max-w-md text-center">
            <AlertCircle size={40} className="text-[#dc2626] mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-[#991b1b] mb-2">Failed to Load Product</h2>
            <p className="text-sm text-[#b91c1c] mb-4">{productError}</p>
            <button
              onClick={() => navigate("/products")}
              className="px-4 py-2 bg-[#044b3b] text-white rounded-lg text-sm font-medium hover:bg-[#033629] transition-colors"
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
    <div className="p-4 md:p-6">
      {/* Draft Restore Banner */}
      {showRestoreBanner && (
        <div className="mb-4 p-4 bg-[#fffbeb] border border-[#ffc400] rounded-lg flex items-start gap-3">
          <RotateCcw size={18} className="text-[#b45309] mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-[#1e293b]">
              You have an unsaved draft
            </p>
            <p className="text-xs text-[#64748b] mt-0.5">
              Would you like to continue where you left off? All your inputs are preserved.
            </p>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={handleRestoreDraft}
                className="px-3 py-1.5 bg-[#044b3b] text-white rounded-md text-xs font-medium hover:bg-[#033629] transition-colors"
              >
                Continue Editing
              </button>
              <button
                onClick={handleDismissBanner}
                className="px-3 py-1.5 border border-[#eaeaea] rounded-md text-xs font-medium text-[#64748b] hover:bg-[#f8fafc] transition-colors"
              >
                Start New
              </button>
            </div>
          </div>
          <button
            onClick={() => setShowRestoreBanner(false)}
            className="text-[#9e9e9e] hover:text-[#64748b]"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-[#1e293b]">
          {id && id !== "new" ? "Edit Product" : "Create New Product"}
        </h1>
        <p className="text-sm text-[#64748b] mt-1">
          Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep]?.label}
        </p>
      </div>

      {/* Wizard */}
      <WizardStepLayout title={STEPS[currentStep]?.label} description={STEPS[currentStep]?.description}>
        {CurrentStepComponent && <CurrentStepComponent />}
      </WizardStepLayout>
    </div>
  );
}
