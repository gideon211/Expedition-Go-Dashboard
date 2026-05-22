import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Save, X, Loader2, CheckCircle2, AlertCircle, ArrowRight, Eye } from "lucide-react";
import { toast } from "sonner";
import { useProductBuilderStore } from "@/features/products/stores/productBuilderStore";
import { createProduct, updateProduct } from "@/features/products/api";

function buildFormData(product) {
  const formData = new FormData();

  // Flat fields
  formData.append("title", product.title || "");
  formData.append("description", product.description || "");
  formData.append("metaTitle", product.metaTitle || product.title || "");
  formData.append("metaDescription", product.metaDescription || product.description?.substring(0, 160) || "");
  formData.append("status", (product.status || "draft").toUpperCase());
  formData.append("latitude", product.latitude ?? "");
  formData.append("longitude", product.longitude ?? "");

  if (product.tags?.length) {
    formData.append("tags", JSON.stringify(product.tags));
  }

  // Build duration
  let durationValue = 0;
  if (product.durationUnit === "hours") {
    durationValue = Number(product.duration) || 0;
  } else if (product.durationUnit === "days") {
    durationValue = (Number(product.duration) || 0);
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

  // categorization (JSON string)
  const categorization = {
    category: product.category || "",
    subcategory: product.subcategory || "",
    activityType: product.activityType || "Guided Tour",
    difficulty: product.difficulty || "Easy",
    duration: { hours: product.durationUnit === "hours" ? durationValue : 0, days: product.durationUnit === "days" ? durationValue : 0 },
    groupSize: {
      min: product.bookingRules?.minGroupSize ?? 1,
      max: product.bookingRules?.maxGroupSize ?? 20,
    },
    transportMode,
  };
  formData.append("categorization", JSON.stringify(categorization));

  // theme (JSON string)
  const theme = {
    primary: product.primaryTheme || product.theme || "",
    secondary: product.secondaryThemes || [],
    tags: product.tags || [],
  };
  formData.append("theme", JSON.stringify(theme));

  // productContent (JSON string)
  const productContent = {
    highlights: product.content?.highlights || [],
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

  // Photos as file objects
  (product.photos || []).forEach((photo) => {
    if (photo.file) {
      formData.append("photos", photo.file);
    }
  });

  // Cover photo: send index so backend knows which uploaded file is the hero
  const heroIndex = product.photos?.findIndex((p) => p.id === product.heroImage);
  if (heroIndex >= 0) {
    formData.append("coverPhotoIndex", String(heroIndex));
  }

  return formData;
}

export default function WizardNavFooter() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentStep, steps, isDirty, isSaving, product, lastSaved, nextStep, prevStep, validateStep, setSaving } = useProductBuilderStore();
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  const [submitResult, setSubmitResult] = useState(null);

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
    setSubmitResult(null);

    const allStepsValid = steps.every((_, index) => validateStep(index));
    if (!allStepsValid) {
      toast.error("Please complete all required fields before submitting.");
      return;
    }

    setSaving(true);
    console.log("🚀 [WizardNavFooter] Starting product submission...");

    try {
      const formData = buildFormData(product);
      console.log("📦 [WizardNavFooter] FormData built, photos:", (product.photos || []).filter((p) => p.file).length);

      let response;
      if (id && id !== "new") {
        response = await updateProduct(id, formData);
      } else {
        response = await createProduct(formData);
      }

      console.log("✅ [WizardNavFooter] API call succeeded!");
      console.log("   Status:", response.status);
      console.log("   Response data:", response.data);

      setSubmitResult({
        type: "success",
        status: response.status,
        title: id && id !== "new" ? "Product Updated" : "Product Created",
        message: `Successfully saved to the database (HTTP ${response.status}).`,
        data: response.data,
      });

      toast.success(id && id !== "new" ? "Product updated successfully!" : "Product created successfully!");
      useProductBuilderStore.getState().markSaved();
      localStorage.removeItem("product-builder-draft");
    } catch (err) {
      console.error("❌ [WizardNavFooter] API call failed:", err);
      console.error("   Error response data:", err.response?.data);

      const status = err.response?.status;
      const isAuthError = status === 401;
      const message = isAuthError
        ? "Authentication failed. You need to log in before creating a product."
        : err.response?.data?.message || err.response?.data?.error || err.message || "Failed to save product. Please try again.";

      setSubmitResult({
        type: "error",
        status: status || null,
        title: isAuthError ? "Authentication Required" : "Submission Failed",
        message,
        data: err.response?.data || null,
      });

      toast.error(message);
    } finally {
      setSaving(false);
      console.log("🏁 [WizardNavFooter] Submission attempt finished.");
    }
  };

  const handleContinue = () => {
    navigate("/products");
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
              <span>Submit for Review</span>
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

      {/* Submission Result Panel */}
      {submitResult && (
        <div
          className={`rounded-lg border p-4 space-y-3 ${
            submitResult.type === "success"
              ? "bg-[#f0fdf4] border-[#86efac]"
              : "bg-[#fef2f2] border-[#fca5a5]"
          }`}
        >
          {/* Header */}
          <div className="flex items-start gap-3">
            {submitResult.type === "success" ? (
              <CheckCircle2 size={20} className="text-[#16a34a] mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle size={20} className="text-[#dc2626] mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4
                  className={`text-sm font-semibold ${
                    submitResult.type === "success" ? "text-[#166534]" : "text-[#991b1b]"
                  }`}
                >
                  {submitResult.title}
                </h4>
                {submitResult.status && (
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      submitResult.type === "success"
                        ? "bg-[#dcfce7] text-[#166534]"
                        : "bg-[#fee2e2] text-[#991b1b]"
                    }`}
                  >
                    HTTP {submitResult.status}
                  </span>
                )}
              </div>
              <p
                className={`text-sm mt-0.5 ${
                  submitResult.type === "success" ? "text-[#15803d]" : "text-[#b91c1c]"
                }`}
              >
                {submitResult.message}
              </p>
            </div>
          </div>

          {/* Response Data Preview */}
          {submitResult.data && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Eye size={14} className="text-[#64748b]" />
                <span className="text-xs font-medium text-[#64748b]">Response Data</span>
              </div>
              <div className="bg-white/80 rounded-md border border-black/5 p-3 overflow-x-auto">
                <pre className="text-xs text-[#1e293b] font-mono whitespace-pre-wrap break-all">
                  {JSON.stringify(submitResult.data, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-1">
            {submitResult.type === "success" && (
              <button
                onClick={handleContinue}
                className="flex items-center gap-2 px-4 py-2 bg-[#044b3b] text-white rounded-lg text-sm font-medium hover:bg-[#033629] transition-colors"
              >
                <span>Continue to Products</span>
                <ArrowRight size={16} />
              </button>
            )}
            <button
              onClick={() => setSubmitResult(null)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                submitResult.type === "success"
                  ? "border border-[#86efac] text-[#166534] hover:bg-[#dcfce7]"
                  : "border border-[#fca5a5] text-[#991b1b] hover:bg-[#fee2e2]"
              }`}
            >
              <X size={16} />
              <span>Dismiss</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
