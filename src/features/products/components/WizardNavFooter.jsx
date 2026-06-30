import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Archive, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useProductBuilderStore, SECTIONS } from "@/features/products/stores/productBuilderStore";
import { createProduct, updateProduct } from "@/features/products/api";

import { normalizeHighlights } from "@/features/products/utils/normalizeHighlights";
import { buildCategorizationProductTypeFields } from "@/features/products/utils/productTypeFromCategorization";

function buildFormData(product) {
  const formData = new FormData();

  let durationValue = 0;
  if (product.durationUnit === "minutes") {
    durationValue = Number(product.duration) || 0;
  } else if (product.durationUnit === "hours") {
    durationValue = Number(product.duration) || 0;
  } else if (product.durationUnit === "days") {
    durationValue = Number(product.duration) || 0;
  } else if (product.durationUnit === "weeks") {
    durationValue = (Number(product.duration) || 0) * 7;
  }

  const TRANSPORT_AIR_ITEMS = ["Biplane", "Glider Plane", "Gyrocopter", "Helicopter", "Hot Air Balloon", "Jet Fighter", "Plane", "Seaplane", "Tiger Moth"];
  const TRANSPORT_LAND_ITEMS = ["4WD", "ATV", "Bike", "Buggy", "Bus/Coach", "Cable Car", "Car", "Classic Car", "E-Bike", "Golf Cart", "Hiking", "Horse Drawn Carriage", "Luxury Car", "Metro/Subway", "Minibus", "Minivan", "Motorcycle", "Mountain Bike", "Rickshaw", "Running", "Scoot Coupe", "Scooter/Moped", "Segway", "Sidecar", "Train/Rail", "Trikke", "Trolley", "Tuk Tuk", "Walking"];
  const TRANSPORT_ANIMAL_ITEMS = ["Alpaca", "Camel", "Donkey/Mule", "Horse", "Llama", "Reindeer"];
  const TRANSPORT_WATER_ITEMS = ["Airboat", "Aqua Cycle", "Boat", "Canoe", "Catamaran", "Gondola", "Inflatable Raft", "Inner Tube", "Jet Boat", "Jet Ski", "Kayak", "Paddle Boat", "Speedboat", "Steamboat", "Submarine", "Swimming", "Wooden Raft", "Yacht"];

  const transportMode = {};
  if (product.tourTransportationModes?.length) {
    transportMode.land = product.tourTransportationModes.filter((m) =>
      [...TRANSPORT_LAND_ITEMS, ...TRANSPORT_ANIMAL_ITEMS].includes(m),
    );
    transportMode.air = product.tourTransportationModes.filter((m) =>
      TRANSPORT_AIR_ITEMS.includes(m),
    );
    transportMode.water = product.tourTransportationModes.filter((m) =>
      TRANSPORT_WATER_ITEMS.includes(m),
    );
  }

  const ageGroups = (product.pricing?.ageGroups || [])
    .filter((ag) => ag.enabled)
    .map((ag) => ({
      label: ag.name,
      minAge: ag.minAge,
      maxAge: ag.maxAge,
    }));

  const prices = (product.pricing?.schedules?.[0]?.prices || []).map((p) => ({
    ageGroup: p.ageGroup,
    retailPrice: Number(p.retailPrice) || 0,
    commissionRate: Number(p.commissionRate) || 15,
  }));

  const categorization = {
    category: product.category || "",
    subcategory: product.subcategory || "",
    activityType: product.activityType || "Guided Tour",
    difficulty: product.difficulty || "Easy",
    ...buildCategorizationProductTypeFields(product),
    duration: {
      minutes: product.durationUnit === "minutes" ? durationValue : 0,
      hours: product.durationUnit === "hours" ? durationValue : 0,
      days: product.durationUnit === "days" || product.durationUnit === "weeks" ? durationValue : 0,
    },
    groupSize: {
      min: product.bookingRules?.minGroupSize ?? 1,
      max: product.bookingRules?.maxGroupSize ?? 20,
    },
    transportMode,
  };
  formData.append("categorization", JSON.stringify(categorization));

  const theme = {
    primaryTheme: product.primaryTheme || product.theme || "",
    secondaryThemes: product.secondaryThemes || [],
    tags: product.tags || [],
  };
  formData.append("theme", JSON.stringify(theme));

  const productContent = {
    writingLanguage: product.content?.writingLanguage || "English",
    shortSummary: product.content?.shortSummary || "",
    highlights: normalizeHighlights(product.content?.highlights),
    included: product.content?.included || [],
    excluded: product.content?.excluded || [],
    whatToBring: product.content?.whatToBring || [],
    itinerary: product.content?.itinerary || [],
    meetingInstructions: product.content?.meetingInstructions || "",
    additionalInfo: product.content?.additionalInfo || "",
    uniqueSellingPoints: product.content?.uniqueSellingPoints || [],
    travelerRequirements: product.content?.travelerRequirements || "",
    languages: product.content?.languages || ["English"],
    hasGuideLead: product.content?.hasGuideLead ?? false,
    guideType: product.content?.guideType || "",
    inclusionsConfirmed: product.content?.inclusionsConfirmed ?? false,
    isPrivateActivity: product.content?.isPrivateActivity ?? false,
    maxTravelers: product.content?.maxTravelers ?? 20,
    resellerType: product.content?.resellerType || "not_reseller",
    accessibility: {
      wheelchairAccessible: product.content?.accessibility?.wheelchairAccessible ?? true,
      transportationWheelchairAccessible: product.content?.accessibility?.transportationWheelchairAccessible ?? true,
      surfacesWheelchairAccessible: product.content?.accessibility?.surfacesWheelchairAccessible ?? true,
      strollerAccessible: product.content?.accessibility?.strollerAccessible ?? true,
      serviceAnimalsAllowed: product.content?.accessibility?.serviceAnimalsAllowed ?? true,
      publicTransportation: product.content?.accessibility?.publicTransportation ?? true,
      infantsOnLaps: product.content?.accessibility?.infantsOnLaps ?? true,
      infantSeatsAvailable: product.content?.accessibility?.infantSeatsAvailable ?? true,
      custom: product.content?.accessibility?.custom || [],
    },
    healthRestrictions: product.content?.healthRestrictions || [],
    physicalDifficulty: product.content?.physicalDifficulty || "easy",
    contactPhone: {
      countryCode: product.content?.contactPhone?.countryCode || "+233",
      number: product.content?.contactPhone?.number || "",
    },
    passportRequired: product.content?.passportRequired ?? false,
    flightInfoRequired: product.content?.flightInfoRequired ?? false,
    shipInfoRequired: product.content?.shipInfoRequired ?? false,
    trainInfoRequired: product.content?.trainInfoRequired ?? false,
    hotelInfoRequired: product.content?.hotelInfoRequired ?? false,
    pickupAvailable: product.content?.pickupAvailable ?? false,
    pickupAreas: product.content?.pickupAreas || [],
    pickupLocations: product.content?.pickupLocations || [],
    pickupCustomLocation: product.content?.pickupCustomLocation ?? false,
    pickupLeadTime: product.content?.pickupLeadTime ?? 30,
    pickupType: product.content?.pickupType || "",
    pickupAppearance: product.content?.pickupAppearance || "",
    pickupPhotoUrls: product.content?.pickupPhotoUrls || [],
    pickupAdditionalDetails: product.content?.pickupAdditionalDetails || "",
    dropoffAvailable: product.content?.dropoffAvailable ?? false,
    dropoffSameAsPickup: product.content?.dropoffSameAsPickup ?? true,
    dropoffTime: product.content?.dropoffTime ?? 0,
    location: {
      city: product.city || "",
      country: product.country || "",
      region: product.region || "",
    },
  };
  formData.append("productContent", JSON.stringify(productContent));

  const schedulesAndPricing = {
    travelerDetails: {
      pricingModel: product.pricing?.pricingModel || "perPerson",
      vehicleType: product.pricing?.vehicleType || "",
      maxTravelersPerBooking: product.pricing?.maxTravelersPerBooking ?? 2,
      ageGroups,
    },
    pricingSchedules: {
      currency: product.pricing?.currency || "USD",
      schedules: [
        {
          startDate: product.pricing?.schedules?.[0]?.startDate || new Date().toISOString().split("T")[0],
          endDate: product.pricing?.schedules?.[0]?.endDate || "",
          prices,
        },
      ],
    },
    operatingDays: product.schedule?.operatingDays || [],
    timeSlots: product.schedule?.timeSlots || [],
    capacityPerSlot: product.schedule?.capacityPerSlot ?? 20,
  };
  formData.append("schedulesAndPricing", JSON.stringify(schedulesAndPricing));

  const bookingAndTickets = {
    instantBooking: product.bookingRules?.instantBooking ?? false,
    confirmationType: product.bookingRules?.confirmationType || "manual",
    minAdvanceBookingHours: product.bookingRules?.minAdvanceBookingHours ?? 48,
    travelerRequiredInfo: product.bookingRules?.travelerRequiredInfo || [],
    cancellationPolicy: {
      type: product.cancellationPolicy || "flexible",
      cutoffHours: product.schedule?.bookingCutoffHours ?? 24,
      refundPercentage: product.bookingRules?.refundPercentage ?? 100,
    },
    meetingPoint: {
      name: product.content?.meetingPoint || "",
      address: product.content?.meetingPointAddress || "",
      coordinates: {
        lat: product.content?.meetingPointLat || null,
        lng: product.content?.meetingPointLng || null,
      },
    },
    pickupAvailable: product.content?.pickupAvailable ?? false,
    pickupDetails: product.content?.pickupAdditionalDetails || "",
    refundRules: product.refundRules || "",
  };
  formData.append("bookingAndTickets", JSON.stringify(bookingAndTickets));

  formData.append("title", product.title || "");
  formData.append("referenceCode", product.referenceCode || "");
  formData.append("description", product.description || "");
  formData.append("metaTitle", product.metaTitle || product.title || "");
  formData.append("metaDescription", product.metaDescription || product.description?.substring(0, 160) || "");
  if (product.specialOffers?.length > 0) {
    formData.append("specialOffers", JSON.stringify(product.specialOffers));
  }
  formData.append("status", (product.status || "draft").toUpperCase());

  if (product.latitude != null && product.latitude !== "") {
    formData.append("latitude", String(product.latitude));
  }
  if (product.longitude != null && product.longitude !== "") {
    formData.append("longitude", String(product.longitude));
  }

  if (product.tags?.length > 0) {
    const validTags = product.tags.slice(0, 10);
    validTags.forEach((tag) => formData.append("tags", tag));
  }

  (product.photos || []).forEach((photo) => {
    const file = typeof photo === 'object' && photo.file instanceof File ? photo.file : null;
    if (file) {
      formData.append("photos", file);
    }
  });

  const existingUrls = (product.photos || [])
    .filter((p) => {
      if (typeof p === 'string') return !p.startsWith('blob:');
      return !(p.file instanceof File) && p.url && !p.url.startsWith('blob:');
    })
    .map((p) => (typeof p === 'string' ? p : p.url));
  if (existingUrls.length > 0) {
    formData.append("existingPhotos", JSON.stringify(existingUrls));
  }

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
  const [isNavigating, setIsNavigating] = useState(false);
  const {
    currentStep,
    steps,
    isDirty,
    isSaving,
    product,
    lastSaved,
    nextStep,
    prevStep,
    goToStep,
    setSubmitting,
    validateStep,
    setSaving,
    currentSectionId,
    currentStepId,
  } = useProductBuilderStore();
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  const isEditing = id && id !== "new";

  const currentSection = SECTIONS.find((s) => s.id === currentSectionId);
  const currentSectionStep = currentSection?.steps.find(
    (s) => s.id === currentStepId
  );

  const handleNext = () => {
    setIsNavigating(true);
    setTimeout(() => {
      const isValid = validateStep(currentStep);
      if (!isValid) {
        setIsNavigating(false);
        return;
      }
      nextStep();
      setIsNavigating(false);
    }, 500);
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
    const allErrors = {};
    let firstFailing = -1;

    steps.forEach((_, index) => {
      const valid = validateStep(index);
      if (!valid) {
        allErrors[index] = { ...useProductBuilderStore.getState().errors };
        if (firstFailing < 0) firstFailing = index;
      }
    });

    if (firstFailing >= 0) {
      goToStep(firstFailing);
      useProductBuilderStore.getState().setSubmissionErrors(allErrors);
      validateStep(firstFailing);
      const count = Object.keys(allErrors).length;
      toast.error(`${count} step${count > 1 ? "s" : ""} need${count === 1 ? "s" : ""} attention. Fix the highlighted fields and try again.`);
      return;
    }

    setSaving(true);
    setSubmitting(true);

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
        ? err.response?.data?.message || "Authentication failed. You need to log in before creating a product."
        : err.response?.data?.message || err.response?.data?.error || err.message || "Failed to save product. Please try again.";

      toast.error(message);
    } finally {
      setSaving(false);
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Section context indicator */}
      {currentSection && currentSectionStep && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="font-medium text-emerald-700 uppercase tracking-wider">
            {currentSection.label}
          </span>
          <span className="text-slate-300">/</span>
          <span>{currentSectionStep.label}</span>
        </div>
      )}

      {/* Main Footer Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleDiscard}
            className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors"
          >
            <X size={16} />
            <span className="hidden sm:inline">Discard</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Archive size={16} />}
            <span className="hidden sm:inline">Save Draft</span>
          </button>
          {lastSaved && (
            <span className="text-xs text-slate-400">
              Last saved: {new Date(lastSaved).toLocaleTimeString()}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => prevStep()}
            disabled={isFirst}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
            <span className="hidden sm:inline">Previous</span>
          </button>

          {isLast ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
              <span>{isEditing ? "Update Tour" : "Create Tour"}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              disabled={isNavigating}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isNavigating ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight size={16} />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
