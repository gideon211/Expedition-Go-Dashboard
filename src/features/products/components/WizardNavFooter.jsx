import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Save, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useProductBuilderStore } from "@/features/products/stores/productBuilderStore";
import { createProduct, updateProduct } from "@/features/products/api";

import { normalizeHighlights } from "@/features/products/utils/normalizeHighlights";
import { buildCategorizationProductTypeFields } from "@/features/products/utils/productTypeFromCategorization";

function buildFormData(product) {
  const formData = new FormData();

  // Build duration
  let durationValue = 0;
  if (product.durationUnit === "hours") {
    durationValue = Number(product.duration) || 0;
  } else if (product.durationUnit === "days") {
    durationValue = Number(product.duration) || 0;
  } else if (product.durationUnit === "weeks") {
    durationValue = (Number(product.duration) || 0) * 7;
  }

  // Build transport mode
  const transportMode = {};
  if (product.tourTransportationModes?.length) {
    transportMode.land = product.tourTransportationModes.filter((m) =>
      ["4WD", "ATV", "Bus", "Car", "Funicular", "Horse", "Minivan", "Motorcycle", "Rickshaw", "Segway", "Subway", "Train", "Tram", "Trolley", "Walking"].includes(m),
    );
    transportMode.air = product.tourTransportationModes.filter((m) =>
      ["Plane", "Helicopter"].includes(m),
    );
  }

  // Age groups from pricing tiers
  const ageGroups = (product.pricing?.tiers || []).map((tier) => ({
    label: tier.name,
    minAge: tier.minAge,
    maxAge: tier.maxAge,
  }));

  // Prices for pricing schedule
  const prices = (product.pricing?.tiers || []).map((tier) => ({
    ageGroup: tier.name,
    retailPrice: Number(tier.price) || 0,
  }));

  // categorization (JSON string - backend parses it)
  const categorization = {
    category: product.category || "",
    subcategory: product.subcategory || "",
    activityType: product.activityType || "Guided Tour",
    difficulty: product.difficulty || "Easy",
    ...buildCategorizationProductTypeFields(product),
    duration: { hours: product.durationUnit === "hours" ? durationValue : 0, days: product.durationUnit === "days" ? durationValue : 0 },
    groupSize: {
      min: product.bookingRules?.minGroupSize ?? 1,
      max: product.bookingRules?.maxGroupSize ?? 20,
    },
    transportMode,
  };
  formData.append("categorization", JSON.stringify(categorization));

  // theme (JSON string - backend parses it)
  const theme = {
    primary: product.primaryTheme || product.theme || "",
    secondary: product.secondaryThemes || [],
    tags: product.tags || [],
  };
  formData.append("theme", JSON.stringify(theme));

  // productContent (JSON string)
  const productContent = {
    highlights: normalizeHighlights(product.content?.highlights),
    included: product.content?.included || [],
    excluded: product.content?.excluded || [],
    whatToBring: product.content?.whatToBring || [],
    itinerary: product.content?.itinerary || "",
    meetingInstructions: product.content?.meetingInstructions || "",
    additionalInfo: product.content?.additionalInfo || "",
    uniqueSellingPoints: product.content?.uniqueSellingPoints || "",
    travelerRequirements: product.content?.travelerRequirements || "",
    languages: product.content?.languages || ["English"],
    location: {
      city: product.city || "",
      country: product.country || "",
      region: product.region || "",
    },
  };
  formData.append("productContent", JSON.stringify(productContent));

  // schedulesAndPricing (JSON string)
  const schedulesAndPricing = {
    travelerDetails: {
      pricingModel: product.pricing?.pricingModel || "perPerson",
      maxTravelersPerBooking: product.bookingRules?.maxGroupSize ?? 20,
      ageGroups,
    },
    pricingSchedules: {
      currency: product.pricing?.currency || "USD",
      schedules: [
        {
          startDate: product.pricing?.startDate || new Date().toISOString().split("T")[0],
          endDate: product.pricing?.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          prices,
        },
      ],
    },
    operatingDays: product.schedule?.operatingDays || [],
    timeSlots: product.schedule?.timeSlots || [],
    capacityPerSlot: product.schedule?.capacityPerSlot ?? 20,
  };
  formData.append("schedulesAndPricing", JSON.stringify(schedulesAndPricing));

  // bookingAndTickets (JSON string)
  const bookingAndTickets = {
    instantBooking: product.bookingRules?.instantBooking ?? false,
    minAdvanceBookingHours: product.bookingRules?.minAdvanceBookingHours ?? 48,
    cancellationPolicy: {
      type: product.cancellationPolicy || "flexible",
      cutoffHours: product.schedule?.bookingCutoffHours ?? 24,
      refundPercentage: product.bookingRules?.refundPercentage ?? 100,
    },
    meetingPoint: {
      name: product.bookingRules?.meetingPoint || "",
      address: product.bookingRules?.meetingPointAddress || "",
      coordinates: {
        lat: product.bookingRules?.meetingPointLat || null,
        lng: product.bookingRules?.meetingPointLng || null,
      },
    },
    pickupAvailable: product.bookingRules?.pickupAvailable ?? false,
    pickupDetails: product.bookingRules?.pickupDetails || "",
    refundRules: product.refundRules || "",
  };
  formData.append("bookingAndTickets", JSON.stringify(bookingAndTickets));

  // Flat fields
  formData.append("title", product.title || "");
  formData.append("description", product.description || "");
  formData.append("metaTitle", product.metaTitle || product.title || "");
  formData.append("metaDescription", product.metaDescription || product.description?.substring(0, 160) || "");
  formData.append("status", (product.status || "draft").toUpperCase());

  // Latitude / Longitude: only append when they have real numeric values
  // Empty/null values are omitted so the backend doesn't receive them at all,
  // avoiding the "must be a number" validation error
  if (product.latitude != null && product.latitude !== "") {
    formData.append("latitude", String(product.latitude));
  }
  if (product.longitude != null && product.longitude !== "") {
    formData.append("longitude", String(product.longitude));
  }

  // Tags: send as multiple form entries (multer builds an array, avoiding "must be an array" error)
  if (product.tags?.length > 0) {
    const validTags = product.tags.slice(0, 10);
    validTags.forEach((tag) => formData.append("tags", tag));
  }

  // Photos as file objects (newly selected files only)
  (product.photos || []).forEach((photo) => {
    const file = typeof photo === 'object' && photo.file instanceof File ? photo.file : null;
    if (file) {
      formData.append("photos", file);
    }
  });

  // Existing photo URLs that should be kept
  const existingUrls = (product.photos || [])
    .filter((p) => {
      if (typeof p === 'string') return !p.startsWith('blob:');
      return !(p.file instanceof File) && p.url && !p.url.startsWith('blob:');
    })
    .map((p) => (typeof p === 'string' ? p : p.url));
  if (existingUrls.length > 0) {
    formData.append("existingPhotos", JSON.stringify(existingUrls));
  }

  // Cover photo: send URL for existing photos or index among uploaded files
  const heroPhoto = product.photos?.find((p) => {
    const id = typeof p === 'object' ? p.id : null;
    return id === product.heroImage;
  });
  if (heroPhoto && typeof heroPhoto === 'object') {
    if (heroPhoto.url && !heroPhoto.url.startsWith('blob:')) {
      formData.append('coverPhoto', heroPhoto.url);
    } else if (heroPhoto.file instanceof File) {
      const uploadedFiles = product.photos.filter((p) => typeof p === 'object' && p.file instanceof File);
      const uploadIndex = uploadedFiles.findIndex((p) => p.id === product.heroImage);
      if (uploadIndex >= 0) {
        formData.append('coverPhotoIndex', String(uploadIndex));
      }
    }
  }

  return formData;
}

export default function WizardNavFooter() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentStep, steps, isDirty, isSaving, product, lastSaved, nextStep, prevStep, validateStep, setSaving } = useProductBuilderStore();
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  const isEditing = id && id !== "new";

  const handleNext = () => {
    const isValid = validateStep(currentStep);
    if (isValid) {
      nextStep();
    }
  };

  const handleSave = () => {
    useProductBuilderStore.getState().markSaved();
    toast.success("Draft saved locally");
  };

  const handleDiscard = () => {
    if (confirm("Are you sure you want to discard all changes?")) {
      useProductBuilderStore.getState().reset();
    }
  };

  const handleSubmit = async () => {
    const allStepsValid = steps.every((_, index) => validateStep(index));
    if (!allStepsValid) {
      toast.error("Please complete all required fields before submitting.");
      return;
    }

    setSaving(true);

    try {
      const formData = buildFormData(product);

      if (isEditing) {
        await updateProduct(id, formData);
        toast.success("Tour updated successfully!");
      } else {
        await createProduct(formData);
        toast.success("Tour created successfully!");
      }

      useProductBuilderStore.getState().markSaved();
      localStorage.removeItem("product-builder-draft");
      navigate("/products");
    } catch (err) {
      const status = err.response?.status;
      const message = status === 401
        ? "Authentication failed. You need to log in before creating a product."
        : err.response?.data?.message || err.response?.data?.error || err.message || "Failed to save product. Please try again.";

      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Main Footer Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleDiscard}
            className="flex items-center gap-2 px-4 py-2.5 border border-[#eaeaea] rounded-lg text-sm font-medium text-[#64748b] hover:bg-[#f8fafc] hover:text-[#1e293b] transition-colors"
          >
            <X size={16} />
            <span className="hidden sm:inline">Discard</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className="flex items-center gap-2 px-4 py-2.5 border border-[#eaeaea] rounded-lg text-sm font-medium text-[#64748b] hover:bg-[#f8fafc] hover:text-[#1e293b] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span className="hidden sm:inline">Save Draft</span>
          </button>
          {lastSaved && (
            <span className="text-xs text-[#9e9e9e]">
              Last saved: {new Date(lastSaved).toLocaleTimeString()}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => prevStep()}
            disabled={isFirst}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 border border-[#eaeaea] rounded-lg text-sm font-medium text-[#64748b] hover:bg-[#f8fafc] hover:text-[#1e293b] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
            <span className="hidden sm:inline">Previous</span>
          </button>

          {isLast ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-[#044b3b] text-white rounded-lg text-sm font-medium hover:bg-[#033629] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
              <span>{isEditing ? "Update Tour" : "Create Tour"}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-[#044b3b] text-white rounded-lg text-sm font-medium hover:bg-[#033629] transition-colors"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
