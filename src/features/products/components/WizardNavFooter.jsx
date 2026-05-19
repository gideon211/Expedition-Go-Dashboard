import { ChevronLeft, ChevronRight, Save, X, Loader2 } from "lucide-react";
import { useProductBuilderStore } from "@/features/products/stores/productBuilderStore";

export default function WizardNavFooter() {
  const { currentStep, steps, isDirty, isSaving, lastSaved, nextStep, prevStep, validateStep } = useProductBuilderStore();
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  const handleNext = () => {
    const isValid = validateStep(currentStep);
    if (isValid) {
      nextStep();
    }
  };

  const handleSave = () => {
    // Auto-save logic would go here
    useProductBuilderStore.getState().markSaved();
  };

  const handleDiscard = () => {
    if (confirm("Are you sure you want to discard all changes?")) {
      useProductBuilderStore.getState().reset();
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleDiscard}
          className="flex items-center gap-2 px-4 py-2.5 border border-[#eaeaea] rounded-lg text-sm font-medium text-[#64748b] hover:bg-[#f8fafc] hover:text-[#1e293b] transition-colors"
        >
          <X size={16} />
          <span className="hidden sm:inline">Discard</span>
        </button>
        <button
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
          onClick={prevStep}
          disabled={isFirst}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 border border-[#eaeaea] rounded-lg text-sm font-medium text-[#64748b] hover:bg-[#f8fafc] hover:text-[#1e293b] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={16} />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {isLast ? (
          <button
            onClick={() => alert("Product submitted for review!")}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-[#044b3b] text-white rounded-lg text-sm font-medium hover:bg-[#033629] transition-colors"
          >
            Submit for Review
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-[#044b3b] text-white rounded-lg text-sm font-medium hover:bg-[#033629] transition-colors"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
