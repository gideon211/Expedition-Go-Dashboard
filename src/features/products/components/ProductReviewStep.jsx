import { Check, AlertTriangle, FileEdit, Globe, ArrowRight, MapPin, DollarSign, Calendar, ShieldCheck, Image, Layers } from "lucide-react";
import { useProductBuilderStore } from "@/features/products/stores/productBuilderStore";
import { normalizeHighlights } from "@/features/products/utils/normalizeHighlights";

const stepIcons = [Layers, FileEdit, Globe, Image, DollarSign, Calendar, ShieldCheck, Check];

function ErrorList({ errors, stepIndex, goToStep }) {
  return (
    <ul className="mt-2 space-y-1">
      {Object.values(errors).map((err, i) => (
        <li key={i}>
          <button
            type="button"
            onClick={() => goToStep(stepIndex)}
            className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-800 hover:underline transition-colors"
          >
            <span className="w-1 h-1 rounded-full bg-red-400 shrink-0" />
            {err}
            <ArrowRight size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </li>
      ))}
    </ul>
  );
}

export default function ProductReviewStep() {
  const { product, steps, currentStep, goToStep } = useProductBuilderStore();

  const validationResults = steps.map((_, index) => {
    const stepErrors = {};
    switch (index) {
      case 0:
        if (!product.productType) stepErrors.productType = "Product type required";
        if (product.productType === "tour") {
          if (!product.tourTransportationModes?.length) stepErrors.tourTransportationModes = "Transportation modes required";
          if (!product.tourDurationCategory) stepErrors.tourDurationCategory = "Tour duration required";
        }
        if (product.productType === "activity") {
          if (!product.activityCategories?.length) stepErrors.activityCategories = "Activity categories required";
        }
        if (product.productType === "transport") {
          if (!product.transportCategories?.length) stepErrors.transportCategories = "Transportation types required";
        }
        break;
      case 1:
        if (!product.title?.trim()) {
          stepErrors.title = "Title required";
        } else if (product.title.length > 200) {
          stepErrors.title = "Title must be less than 200 characters";
        }
        if (!product.description?.trim()) {
          stepErrors.description = "Description required";
        } else if (product.description.trim().length < 50) {
          stepErrors.description = "Description must be at least 50 characters";
        } else if (product.description.length > 5000) {
          stepErrors.description = "Description must be less than 5000 characters";
        }
        if (!product.subcategory?.trim()) stepErrors.subcategory = "Subcategory required";
        if (!product.activityType) stepErrors.activityType = "Activity type required";
        if (!product.city?.trim()) stepErrors.city = "City required";
        if (!product.country?.trim()) stepErrors.country = "Country required";
        if (!product.metaTitle?.trim()) stepErrors.metaTitle = "Meta title required";
        if (!product.duration) stepErrors.duration = "Duration required";
        const hasLat = product.latitude !== null && product.latitude !== undefined && product.latitude !== '';
        const hasLng = product.longitude !== null && product.longitude !== undefined && product.longitude !== '';
        if (hasLat !== hasLng) {
          if (hasLat) stepErrors.longitude = "Both latitude and longitude must be provided together";
          if (hasLng) stepErrors.latitude = "Both latitude and longitude must be provided together";
        }
        if (hasLat) {
          const lat = Number(product.latitude);
          if (Number.isNaN(lat) || lat < -90 || lat > 90) stepErrors.latitude = "Latitude must be between -90 and 90";
        }
        if (hasLng) {
          const lng = Number(product.longitude);
          if (Number.isNaN(lng) || lng < -180 || lng > 180) stepErrors.longitude = "Longitude must be between -180 and 180";
        }
        break;
      case 2:
        if (!product.content.itinerary?.length) stepErrors.itinerary = "Itinerary required";
        if (normalizeHighlights(product.content.highlights).length === 0) stepErrors.highlights = "At least one tour highlight is required";
        if (!product.content.meetingInstructions?.trim()) stepErrors.meetingInstructions = "Meeting instructions required";
        if (!product.content.uniqueSellingPoints?.trim()) stepErrors.uniqueSellingPoints = "Unique selling points required";
        if (!product.content.languages?.length) stepErrors.languages = "Languages required";
        break;
      case 3:
        if (!product.photos || product.photos.length === 0) {
          stepErrors.photos = "At least one photo is required";
        } else if (product.photos.length > 20) {
          stepErrors.photos = "Maximum 20 photos allowed";
        }
        break;
      case 4:
        if (!product.pricing.basePrice || Number(product.pricing.basePrice) <= 0) stepErrors.price = "Base price must be greater than 0";
        if (!product.pricing.startDate) stepErrors.pricingStartDate = "Pricing start date required";
        if (!product.pricing.endDate) stepErrors.pricingEndDate = "Pricing end date required";
        if (!product.pricing.currency || product.pricing.currency.length !== 3) stepErrors.currency = "Valid 3-letter currency code required";
        if (!product.pricing.tiers || product.pricing.tiers.length === 0) stepErrors.pricingSchedule = "At least one pricing schedule required";
        break;
      case 5:
        if (!product.schedule.operatingDays?.length) stepErrors.days = "Operating days required";
        break;
      case 6:
        if (!product.bookingRules.meetingPoint?.trim()) stepErrors.meeting = "Meeting point required";
        if (!product.bookingRules.meetingPointAddress?.trim()) stepErrors.meetingPointAddress = "Meeting point address required";
        break;
      default:
        break;
    }
    if (product.tags && product.tags.length > 10) stepErrors.tags = "Maximum 10 tags allowed";
    return { step: index, isValid: Object.keys(stepErrors).length === 0, errors: stepErrors };
  });

  const allValid = validationResults.every((r) => r.isValid);
  const errorCount = validationResults.filter((r) => !r.isValid).length;

  return (
    <div className="space-y-8">
      {/* Validation Summary Banner */}
      <div className={`rounded-xl border-2 shadow-sm overflow-hidden ${
        allValid ? "border-emerald-500" : "border-amber-400"
      }`}>
        <div className={`px-5 py-4 flex items-start gap-4 ${
          allValid ? "bg-emerald-50" : "bg-amber-50"
        }`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            allValid ? "bg-emerald-500" : "bg-amber-400"
          }`}>
            {allValid ? (
              <Check size={20} className="text-white" />
            ) : (
              <AlertTriangle size={20} className="text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-base font-semibold ${
              allValid ? "text-emerald-800" : "text-amber-800"
            }`}>
              {allValid ? "Ready to submit!" : `${errorCount} step${errorCount > 1 ? "s" : ""} need${errorCount === 1 ? "s" : ""} attention`}
            </p>
            <p className={`text-sm mt-0.5 ${
              allValid ? "text-emerald-600" : "text-amber-600"
            }`}>
              {allValid
                ? "All required fields are filled. Choose your publish status below and submit."
                : "Review the issues below and click on any error to jump to that step and fix it."}
            </p>
          </div>
        </div>
      </div>

      {/* Step Validation Cards */}
      <div className="space-y-3">
        {steps.slice(0, -1).map((step, index) => {
          const result = validationResults[index];
          const Icon = stepIcons[index] || Check;
          return (
            <div
              key={step.id}
              className={`group relative bg-white rounded-xl border shadow-sm overflow-hidden transition-shadow hover:shadow-md ${
                result.isValid ? "border-slate-200" : "border-red-200"
              }`}
            >
              {/* Left accent bar */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                result.isValid ? "bg-emerald-500" : "bg-red-400"
              }`} />

              <div className="pl-5 pr-5 py-4">
                <div className="flex items-start gap-3.5">
                  {/* Icon */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    result.isValid ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-500"
                  }`}>
                    {result.isValid ? (
                      <Check size={18} />
                    ) : (
                      <Icon size={18} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-800">
                        {step.number}. {step.label}
                      </p>
                      {!result.isValid && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-100 text-red-600 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          {Object.keys(result.errors).length} issue{Object.keys(result.errors).length > 1 ? "s" : ""}
                        </span>
                      )}
                      {result.isValid && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-600 shrink-0">
                          <Check size={11} />
                          Complete
                        </span>
                      )}
                    </div>
                    {!result.isValid && (
                      <div className="group/errors">
                        <ErrorList errors={result.errors} stepIndex={index} goToStep={goToStep} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Product Preview - Sectioned */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50">
          <h3 className="text-sm font-semibold text-slate-800">Product Summary</h3>
        </div>

        <div className="divide-y divide-slate-100">
          {/* Basic Info */}
          <div className="px-5 py-4">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Basic Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-2.5 text-sm">
              <PreviewRow label="Product Type" value={product.productType || "—"} capitalize />
              <PreviewRow label="Title" value={product.title || "—"} />
              <PreviewRow label="Category" value={product.category || "—"} capitalize />
              <PreviewRow label="Subcategory" value={product.subcategory || "—"} />
              <PreviewRow label="Activity Type" value={product.activityType || "—"} />
              <PreviewRow label="Duration" value={product.duration ? `${product.duration} ${product.durationUnit}` : "—"} />
              <PreviewRow label="Description" value={product.description ? `${product.description.slice(0, 80)}${product.description.length > 80 ? "..." : ""}` : "—"} />
            </div>
          </div>

          {/* Location */}
          <div className="px-5 py-4">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Location</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-2.5 text-sm">
              <PreviewRow label="City" value={product.city || "—"} />
              <PreviewRow label="Country" value={product.country || "—"} />
              <PreviewRow label="Region" value={product.region || "—"} />
            </div>
          </div>

          {/* Pricing */}
          <div className="px-5 py-4">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Pricing</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-2.5 text-sm">
              <PreviewRow label="Base Price" value={product.pricing.basePrice > 0 ? `$${product.pricing.basePrice}` : "—"} />
              <PreviewRow label="Currency" value={product.pricing.currency || "—"} />
              <PreviewRow label="Pricing Dates" value={product.pricing.startDate && product.pricing.endDate ? `${product.pricing.startDate} to ${product.pricing.endDate}` : "—"} />
              {product.pricing.tiers?.length > 0 && (
                <div className="sm:col-span-3">
                  <span className="text-slate-500">Pricing Tiers: </span>
                  <div className="inline-flex flex-wrap gap-1.5 mt-0.5">
                    {product.pricing.tiers.map((tier, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded-md">
                        {tier.name}: ${tier.price}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Schedule */}
          <div className="px-5 py-4">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Schedule</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-2.5 text-sm">
              <PreviewRow label="Operating Days" value={product.schedule.operatingDays.length > 0 ? `${product.schedule.operatingDays.length} day${product.schedule.operatingDays.length > 1 ? "s" : ""}` : "—"} />
              <PreviewRow label="Capacity" value={`${product.schedule.capacityPerSlot} per slot`} />
              <PreviewRow label="Time Slots" value={product.schedule.timeSlots?.length > 0 ? `${product.schedule.timeSlots.length} slot${product.schedule.timeSlots.length > 1 ? "s" : ""}` : "—"} />
            </div>
          </div>

          {/* Booking & Content */}
          <div className="px-5 py-4">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Booking & Content</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-2.5 text-sm">
              <PreviewRow label="Meeting Point" value={product.bookingRules.meetingPoint || "—"} />
              <PreviewRow label="Meeting Address" value={product.bookingRules.meetingPointAddress || "—"} />
              <PreviewRow label="Languages" value={product.content.languages?.length > 0 ? product.content.languages.join(", ") : "—"} />
              <PreviewRow label="Highlights" value={normalizeHighlights(product.content.highlights).length > 0 ? `${normalizeHighlights(product.content.highlights).length} added` : "—"} />
              <PreviewRow label="Photos" value={product.photos?.length > 0 ? `${product.photos.length} uploaded` : "—"} />
              <PreviewRow label="Tags" value={product.tags?.length > 0 ? product.tags.join(", ") : "—"} />
            </div>
          </div>
        </div>
      </div>

      {/* Publish Status */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50">
          <h3 className="text-sm font-semibold text-slate-800">Publish Status</h3>
        </div>
        <div className="px-5 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { value: "draft", label: "Save as Draft", desc: "Save your progress and publish later. You can come back anytime.", icon: FileEdit },
              { value: "active", label: "Publish Now", desc: "Make your product live and visible to customers immediately.", icon: Globe },
            ].map((status) => {
              const Icon = status.icon;
              const selected = product.status === status.value;
              return (
                <button
                  key={status.value}
                  onClick={() => useProductBuilderStore.getState().updateProduct({ status: status.value })}
                  className={`relative p-4 sm:p-5 rounded-xl border-2 text-left transition-all ${
                    selected
                      ? "border-emerald-600 bg-emerald-50 shadow-sm shadow-emerald-600/10"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      selected ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-400"
                    }`}>
                      <Icon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5">
                        <p className={`text-sm font-semibold ${selected ? "text-emerald-800" : "text-slate-800"}`}>
                          {status.label}
                        </p>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          selected ? "border-emerald-600" : "border-slate-200"
                        }`}>
                          {selected && <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />}
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{status.desc}</p>
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

function PreviewRow({ label, value, capitalize }) {
  return (
    <div>
      <span className="text-slate-400 text-xs">{label}</span>
      <p className={`text-slate-800 mt-0.5 ${capitalize ? "capitalize" : ""} truncate`}>{value}</p>
    </div>
  );
}
