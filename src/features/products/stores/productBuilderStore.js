import { create } from "zustand";

const STEPS = [
  { id: "basics", label: "Product Basics", number: 1 },
  { id: "photos", label: "Photos & Media", number: 2 },
  { id: "pricing", label: "Pricing & Tickets", number: 3 },
  { id: "schedule", label: "Schedule & Availability", number: 4 },
  { id: "booking", label: "Booking Rules", number: 5 },
  { id: "content", label: "Content & Details", number: 6 },
  { id: "review", label: "Review & Submit", number: 7 },
];

const INITIAL_PRODUCT = {
  title: "",
  description: "",
  shortSummary: "",
  category: "",
  theme: "",
  tags: [],
  slug: "",
  difficulty: "",
  duration: "",
  durationUnit: "hours",
  photos: [],
  heroImage: null,
  videoUrl: "",
  pricing: {
    basePrice: 0,
    currency: "USD",
    tiers: [
      { name: "Adult", price: 0, minAge: 18, maxAge: 64 },
      { name: "Child", price: 0, minAge: 3, maxAge: 17 },
      { name: "Senior", price: 0, minAge: 65, maxAge: 99 },
    ],
    taxes: 0,
    fees: 0,
    commissionRate: 15,
  },
  cancellationPolicy: "flexible",
  refundRules: "",
  schedule: {
    operatingDays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
    timeSlots: [{ startTime: "09:00", endTime: "12:00" }],
    seasonalAvailability: "all_year",
    blackoutDates: [],
    capacityPerSlot: 20,
    bookingCutoffHours: 24,
  },
  bookingRules: {
    confirmationType: "manual",
    minAdvanceBookingHours: 48,
    maxGroupSize: 20,
    minGroupSize: 1,
    meetingPoint: "",
    pickupAvailable: false,
    pickupDetails: "",
    inclusions: [],
    exclusions: [],
  },
  content: {
    itinerary: "",
    highlights: [],
    included: [],
    excluded: [],
    meetingInstructions: "",
    additionalInfo: "",
    languages: ["English"],
  },
  status: "draft",
};

export const useProductBuilderStore = create((set, get) => ({
  steps: STEPS,
  currentStep: 0,
  product: { ...INITIAL_PRODUCT },
  completedSteps: [],
  isDirty: false,
  isSaving: false,
  lastSaved: null,
  errors: {},

  setStep: (step) => set({ currentStep: step }),

  nextStep: () => {
    const { currentStep, completedSteps } = get();
    const newCompleted = [...new Set([...completedSteps, currentStep])];
    set({
      currentStep: Math.min(currentStep + 1, STEPS.length - 1),
      completedSteps: newCompleted,
    });
  },

  prevStep: () => {
    const { currentStep } = get();
    set({ currentStep: Math.max(currentStep - 1, 0) });
  },

  goToStep: (step) => {
    // Only allow going to completed steps or current + 1
    const { completedSteps, currentStep } = get();
    if (step <= currentStep + 1 || completedSteps.includes(step)) {
      set({ currentStep: step });
    }
  },

  updateProduct: (updates) => {
    set((state) => ({
      product: { ...state.product, ...updates },
      isDirty: true,
    }));
  },

  updateNested: (path, value) => {
    set((state) => {
      const keys = path.split(".");
      const newProduct = { ...state.product };
      let current = newProduct;
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return { product: newProduct, isDirty: true };
    });
  },

  setSaving: (saving) => set({ isSaving: saving }),

  markSaved: () => set({ isDirty: false, lastSaved: new Date().toISOString() }),

  setErrors: (errors) => set({ errors }),

  clearErrors: () => set({ errors: {} }),

  validateStep: (stepIndex) => {
    const { product } = get();
    const errors = {};

    switch (stepIndex) {
      case 0: // Basics
        if (!product.title?.trim()) errors.title = "Title is required";
        if (!product.description?.trim()) errors.description = "Description is required";
        if (!product.category) errors.category = "Category is required";
        if (!product.duration) errors.duration = "Duration is required";
        break;
      case 2: // Pricing
        if (product.pricing.basePrice <= 0) errors.basePrice = "Base price must be greater than 0";
        break;
      case 3: // Schedule
        if (!product.schedule.operatingDays?.length) errors.operatingDays = "At least one operating day is required";
        break;
      case 4: // Booking Rules
        if (!product.bookingRules.meetingPoint?.trim()) errors.meetingPoint = "Meeting point is required";
        break;
      default:
        break;
    }

    set({ errors });
    return Object.keys(errors).length === 0;
  },

  reset: () => {
    set({
      currentStep: 0,
      product: { ...INITIAL_PRODUCT },
      completedSteps: [],
      isDirty: false,
      isSaving: false,
      lastSaved: null,
      errors: {},
    });
  },

  loadDraft: (draft) => {
    set({
      product: { ...INITIAL_PRODUCT, ...draft },
      isDirty: false,
    });
  },
}));
