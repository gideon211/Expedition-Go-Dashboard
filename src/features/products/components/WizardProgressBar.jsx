import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProductBuilderStore } from "@/features/products/stores/productBuilderStore";

export default function WizardProgressBar() {
  const { steps, currentStep, completedSteps } = useProductBuilderStore();

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(index);
          const isCurrent = currentStep === index;
          const isPending = index > currentStep && !isCompleted;
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex flex-1 items-center">
              {/* Step indicator */}
              <div className="flex flex-col items-center relative">
                <button
                  onClick={() => useProductBuilderStore.getState().goToStep(index)}
                  className={cn(
                    "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 border-2 cursor-pointer",
                    isCompleted && "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/20",
                    isCurrent && "bg-white border-emerald-600 text-emerald-600 ring-4 ring-emerald-600/10 shadow-sm",
                    isPending && "bg-white border-slate-200 text-slate-400 hover:border-emerald-600 hover:text-emerald-600 hover:shadow-sm hover:shadow-emerald-600/10"
                  )}
                >
                  {isCompleted ? (
                    <Check size={18} className="sm:w-5 sm:h-5" />
                  ) : (
                    <Icon size={18} className="sm:w-5 sm:h-5" />
                  )}
                </button>
                <span
                  className={cn(
                    "mt-2.5 text-[10px] sm:text-xs font-medium whitespace-nowrap transition-colors duration-200",
                    isCompleted && "text-emerald-600",
                    isCurrent && "text-slate-800 font-semibold",
                    isPending && "text-slate-400"
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-2 sm:mx-3 mb-6 sm:mb-7">
                  <div
                    className={cn(
                      "h-full transition-all duration-500",
                      isCompleted ? "bg-emerald-600" : "bg-slate-200"
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
