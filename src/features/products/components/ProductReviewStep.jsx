import { Check, AlertTriangle, Eye } from "lucide-react";
import { useProductBuilderStore } from "@/features/products/stores/productBuilderStore";
import StatusBadge from "@/components/shared/StatusBadge";

export default function ProductReviewStep() {
  const { product, steps, currentStep, errors, validateStep } = useProductBuilderStore();

  // Validate all previous steps
  const validationResults = steps.map((_, index) => {
    // Simulate validation (in real app, would check each step)
    const stepErrors = {};
    switch (index) {
      case 0:
        if (!product.title) stepErrors.title = "Title required";
        if (!product.description) stepErrors.description = "Description required";
        break;
      case 2:
        if (product.pricing.basePrice <= 0) stepErrors.price = "Base price required";
        break;
      case 3:
        if (!product.schedule.operatingDays.length) stepErrors.days = "Operating days required";
        break;
      case 4:
        if (!product.bookingRules.meetingPoint) stepErrors.meeting = "Meeting point required";
        break;
      default:
        break;
    }
    return { step: index, isValid: Object.keys(stepErrors).length === 0, errors: stepErrors };
  });

  const allValid = validationResults.every((r) => r.isValid);

  return (
    <div className="space-y-6">
      {/* Validation Summary */}
      <div className={`p-4 rounded-lg border ${allValid ? "bg-[#ebfcf5] border-[#00d67f]" : "bg-[#fffbeb] border-[#ffc400]"}`}>
        <div className="flex items-center gap-3">
          {allValid ? (
            <Check size={20} className="text-[#00d67f]" />
          ) : (
            <AlertTriangle size={20} className="text-[#ffc400]" />
          )}
          <div>
            <p className={`text-sm font-semibold ${allValid ? "text-[#047857]" : "text-[#b45309]"}`}>
              {allValid ? "All checks passed! Ready to submit." : "Some fields need attention before submitting."}
            </p>
          </div>
        </div>
      </div>

      {/* Step-by-step validation */}
      <div className="space-y-3">
        {steps.slice(0, -1).map((step, index) => {
          const result = validationResults[index];
          return (
            <div
              key={step.id}
              className={`flex items-start gap-3 p-3 rounded-lg border ${
                result.isValid ? "bg-[#f8fafc] border-[#eaeaea]" : "bg-[#fffbeb] border-[#ffc400]"
              }`}
            >
              <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                result.isValid ? "bg-[#00d67f]" : "bg-[#ffc400]"
              }`}>
                {result.isValid ? (
                  <Check size={12} className="text-white" />
                ) : (
                  <span className="text-white text-xs font-bold">!</span>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[#1e293b]">
                  {step.number}. {step.label}
                </p>
                {!result.isValid && (
                  <ul className="mt-1 space-y-0.5">
                    {Object.values(result.errors).map((err, i) => (
                      <li key={i} className="text-xs text-[#b45309]">• {err}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Product Preview */}
      <div className="border border-[#eaeaea] rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-[#f8fafc] border-b border-[#eaeaea] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#1e293b]">Product Preview</h3>
          <button className="flex items-center gap-1 text-xs text-[#044b3b] hover:underline">
            <Eye size={14} />
            Full Preview
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-[#64748b]">Title:</span>
              <span className="ml-2 text-[#1e293b] font-medium">{product.title || "—"}</span>
            </div>
            <div>
              <span className="text-[#64748b]">Category:</span>
              <span className="ml-2 text-[#1e293b] font-medium capitalize">{product.category || "—"}</span>
            </div>
            <div>
              <span className="text-[#64748b]">Duration:</span>
              <span className="ml-2 text-[#1e293b] font-medium">
                {product.duration ? `${product.duration} ${product.durationUnit}` : "—"}
              </span>
            </div>
            <div>
              <span className="text-[#64748b]">Base Price:</span>
              <span className="ml-2 text-[#1e293b] font-medium">
                {product.pricing.basePrice > 0 ? `$${product.pricing.basePrice}` : "—"}
              </span>
            </div>
            <div>
              <span className="text-[#64748b]">Operating Days:</span>
              <span className="ml-2 text-[#1e293b] font-medium">
                {product.schedule.operatingDays.length > 0
                  ? `${product.schedule.operatingDays.length} days`
                  : "—"}
              </span>
            </div>
            <div>
              <span className="text-[#64748b]">Capacity:</span>
              <span className="ml-2 text-[#1e293b] font-medium">
                {product.schedule.capacityPerSlot} per slot
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Selection */}
      <div>
        <label className="block text-sm font-medium text-[#1e293b] mb-3">Publish Status</label>
        <div className="grid grid-cols-3 gap-4">
          {[
            { value: "draft", label: "Draft", desc: "Save but don't publish" },
            { value: "pending_approval", label: "Pending Approval", desc: "Submit for admin review" },
            { value: "active", label: "Active", desc: "Publish immediately" },
          ].map((status) => (
            <button
              key={status.value}
              onClick={() => useProductBuilderStore.getState().updateProduct({ status: status.value })}
              className={`p-4 rounded-lg border-2 text-left transition-colors ${
                product.status === status.value
                  ? "border-[#044b3b] bg-[#f0fdf4]"
                  : "border-[#eaeaea] hover:border-[#044b3b]/30"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    product.status === status.value ? "border-[#044b3b] bg-[#044b3b]" : "border-[#eaeaea]"
                  }`}
                >
                  {product.status === status.value && <Check size={12} className="text-white" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1e293b]">{status.label}</p>
                  <p className="text-xs text-[#64748b]">{status.desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
