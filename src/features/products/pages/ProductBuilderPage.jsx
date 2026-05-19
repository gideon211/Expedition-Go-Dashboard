import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useProductBuilderStore } from "@/features/products/stores/productBuilderStore";
import WizardStepLayout from "@/features/products/components/WizardStepLayout";
import ProductBasicsStep from "@/features/products/components/ProductBasicsStep";
import ProductPhotosStep from "@/features/products/components/ProductPhotosStep";
import ProductPricingStep from "@/features/products/components/ProductPricingStep";
import ProductScheduleStep from "@/features/products/components/ProductScheduleStep";
import ProductBookingStep from "@/features/products/components/ProductBookingStep";
import ProductContentStep from "@/features/products/components/ProductContentStep";
import ProductReviewStep from "@/features/products/components/ProductReviewStep";

const STEPS = [
  { id: "basics", label: "Product Basics", description: "Enter the basic information about your tour product.", component: ProductBasicsStep },
  { id: "photos", label: "Photos & Media", description: "Upload photos and add media to showcase your tour.", component: ProductPhotosStep },
  { id: "pricing", label: "Pricing & Tickets", description: "Set pricing tiers, taxes, and cancellation policies.", component: ProductPricingStep },
  { id: "schedule", label: "Schedule & Availability", description: "Define when your tour operates and capacity limits.", component: ProductScheduleStep },
  { id: "booking", label: "Booking Rules", description: "Configure how customers can book your tour.", component: ProductBookingStep },
  { id: "content", label: "Content & Details", description: "Add itinerary, highlights, and other content.", component: ProductContentStep },
  { id: "review", label: "Review & Submit", description: "Review all details before submitting your product.", component: ProductReviewStep },
];

export default function ProductBuilderPage() {
  const { id, step } = useParams();
  const navigate = useNavigate();
  const { currentStep, setStep, reset, loadDraft } = useProductBuilderStore();

  // Map URL step param to step index
  const stepIndex = STEPS.findIndex((s) => s.id === step) || 0;

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

  // Load draft if editing
  useEffect(() => {
    if (id && id !== "new") {
      // In real app, fetch draft from API
      // loadDraft(fetchedDraft);
    }
  }, [id]);

  // Reset on unmount
  useEffect(() => {
    return () => {
      // Optional: reset();
    };
  }, []);

  const CurrentStepComponent = STEPS[currentStep]?.component;

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1e293b]">
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
