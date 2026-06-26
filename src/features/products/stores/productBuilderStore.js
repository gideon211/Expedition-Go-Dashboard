import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Layers, ScrollText, Image, DollarSign, ClipboardList, MapPin, Globe, Check, Sparkles, Info, Users, Clock, Shield } from "lucide-react";
import { normalizeHighlights } from "@/features/products/utils/normalizeHighlights";

const STEPS = [
  { id: "language-and-title", label: "Language & Title", number: 1, icon: Layers },
  { id: "categorization", label: "Categorization", number: 2, icon: Layers },
  { id: "theme", label: "Theme", number: 3, icon: Layers },
  { id: "photos", label: "Photos & Media", number: 4, icon: Image },
  { id: "meeting-and-pickup", label: "Meeting & Pickup", number: 5, icon: MapPin },
  { id: "tour-details", label: "Tour Details", number: 6, icon: ScrollText },
  { id: "languages-offered", label: "Languages Offered", number: 7, icon: Globe },
  { id: "inclusions-exclusions", label: "Inclusions & Exclusions", number: 8, icon: Check },
  { id: "unique-selling-points", label: "What Makes Your Product Unique", number: 9, icon: Sparkles },
  { id: "info-travelers-need", label: "Information Travelers Need", number: 10, icon: Info },
  { id: "traveler-details", label: "Traveler Details", number: 11, icon: Users },
  { id: "pricing-schedules", label: "Pricing Schedules", number: 12, icon: DollarSign },
  { id: "booking-process", label: "Booking Process", number: 13, icon: Clock },
  { id: "cancellation-policy", label: "Cancellation Policy", number: 14, icon: Shield },
  { id: "traveler-required-info", label: "Traveler Required Info", number: 15, icon: ClipboardList },
  { id: "preview", label: "Preview", number: 16, icon: ScrollText },
];

export const SECTIONS = [
  {
    id: "basics",
    label: "BASICS",
    steps: [
      { id: "language-and-title", label: "Language & Title", stepIndex: 0 },
      { id: "categorization", label: "Categorization", stepIndex: 1 },
      { id: "theme", label: "Theme", stepIndex: 2 },
      { id: "photos", label: "Photos", stepIndex: 3 },
    ],
  },
  {
    id: "product-content",
    label: "PRODUCT CONTENT",
    steps: [
      { id: "meeting-and-pickup", label: "Meeting & Pickup", stepIndex: 4 },
      { id: "tour-details", label: "Tour Details", stepIndex: 5 },
      { id: "languages-offered", label: "Languages Offered", stepIndex: 6 },
      { id: "inclusions-exclusions", label: "Inclusions & Exclusions", stepIndex: 7 },
      { id: "unique-selling-points", label: "What Makes Your Product Unique", stepIndex: 8 },
      { id: "info-travelers-need", label: "Information Travelers Need", stepIndex: 9 },
    ],
  },
  {
    id: "schedules-and-pricing",
    label: "SCHEDULES & PRICING",
    steps: [
      { id: "traveler-details", label: "Traveler Details", stepIndex: 10 },
      { id: "pricing-schedules", label: "Pricing Schedules", stepIndex: 11 },
    ],
  },
  {
    id: "booking-and-tickets",
    label: "BOOKING & TICKETS",
    steps: [
      { id: "booking-process", label: "Booking Process", stepIndex: 12 },
      { id: "cancellation-policy", label: "Cancellation Policy", stepIndex: 13 },
      { id: "traveler-required-info", label: "Traveler Required Info", stepIndex: 14 },
    ],
  },
  {
    id: "finish",
    label: "FINISH",
    steps: [
      { id: "preview", label: "Preview", stepIndex: 15 },
    ],
  },
];

const STEP_INDEX_TO_SECTION_STEP = {
  0: { sectionId: "basics", stepId: "language-and-title" },
  1: { sectionId: "basics", stepId: "categorization" },
  2: { sectionId: "basics", stepId: "theme" },
  3: { sectionId: "basics", stepId: "photos" },
  4: { sectionId: "product-content", stepId: "meeting-and-pickup" },
  5: { sectionId: "product-content", stepId: "tour-details" },
  6: { sectionId: "product-content", stepId: "languages-offered" },
  7: { sectionId: "product-content", stepId: "inclusions-exclusions" },
  8: { sectionId: "product-content", stepId: "unique-selling-points" },
  9: { sectionId: "product-content", stepId: "info-travelers-need" },
  10: { sectionId: "schedules-and-pricing", stepId: "traveler-details" },
  11: { sectionId: "schedules-and-pricing", stepId: "pricing-schedules" },
  12: { sectionId: "booking-and-tickets", stepId: "booking-process" },
  13: { sectionId: "booking-and-tickets", stepId: "cancellation-policy" },
  14: { sectionId: "booking-and-tickets", stepId: "traveler-required-info" },
  15: { sectionId: "finish", stepId: "preview" },
};

function findSectionStep(sectionId, stepId) {
  for (const section of SECTIONS) {
    if (section.id === sectionId) {
      for (const step of section.steps) {
        if (step.id === stepId) return step;
      }
    }
  }
  return null;
}

function getDefaultSectionStep() {
  return { sectionId: "basics", stepId: "language-and-title" };
}

const INITIAL_PRODUCT = {
  title: "",
  referenceCode: "",
  description: "",
  shortSummary: "",
  category: "",
  subcategory: "",
  theme: "",
  primaryTheme: "",
  secondaryThemes: [],
  tags: [],
  slug: "",
  difficulty: "",
  duration: "",
  durationUnit: "hours",
  activityType: "Guided Tour",
  productType: "",
  tourTransportationModes: [],
  tourDurationCategory: "",
  activityCategories: [],
  transportCategories: [],
  city: "",
  country: "",
  region: "",
  latitude: null,
  longitude: null,
  metaTitle: "",
  metaDescription: "",
  photos: [],
  heroImage: null,
  videoUrl: "",
  pricing: {
    pricingModel: "perPerson",
    vehicleType: "",
    ageGroups: [
      { name: "Adult", enabled: true, minAge: 18, maxAge: 64 },
      { name: "Infant", enabled: false, minAge: 0, maxAge: 2 },
      { name: "Child", enabled: false, minAge: 3, maxAge: 17 },
      { name: "Youth", enabled: false, minAge: 12, maxAge: 17 },
      { name: "Senior", enabled: false, minAge: 65, maxAge: 99 },
    ],
    maxTravelersPerBooking: 2,
    currency: "USD",
    schedules: [{
      startDate: "",
      endDate: "",
      prices: [],
    }],
    taxes: "",
    fees: "",
    commissionRate: 15,
  },
  cancellationPolicy: "flexible",
  refundRules: "",
  specialOffers: [],
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
    instantBooking: false,
    refundPercentage: 100,
    travelerRequiredInfo: [],
    ticketTypes: [],
    redemptionInstructions: "",
    redemptionVenueAddress: "",
  },
  content: {
    shortSummary: "",
    itinerary: [],
    highlights: [],
    included: [],
    excluded: [],
    whatToBring: [],
    meetingInstructions: "",
    meetingPoint: "",
    meetingPointAddress: "",
    meetingPointLat: null,
    meetingPointLng: null,
    inclusionsConfirmed: false,
    isPrivateActivity: false,
    maxTravelers: 20,
    pickupAvailable: false,
    pickupAreas: [],
    pickupLocations: [],
    pickupCustomLocation: false,
    pickupLeadTime: 30,
    dropoffAvailable: false,
    dropoffSameAsPickup: true,
    dropoffTime: 0,
    pickupAdditionalDetails: "",
    pickupType: "",
    pickupAppearance: "",
    pickupPhotoUrls: [],
    additionalInfo: "",
    uniqueSellingPoints: [],
    travelerRequirements: "",
    languages: ["English"],
    writingLanguage: "English",
    hasGuideLead: false,
    guideType: "",
    resellerType: "not_reseller",
    accessibility: {
      wheelchairAccessible: true,
      transportationWheelchairAccessible: true,
      surfacesWheelchairAccessible: true,
      strollerAccessible: true,
      serviceAnimalsAllowed: true,
      publicTransportation: true,
      infantsOnLaps: true,
      infantSeatsAvailable: true,
    },
    healthRestrictions: [
      "Not recommended for travelers with back problems",
      "Not recommended for pregnant travelers",
    ],
    physicalDifficulty: "easy",
    contactPhone: {
      countryCode: "+233",
      number: "",
    },
    passportRequired: false,
    flightInfoRequired: false,
    shipInfoRequired: false,
    trainInfoRequired: false,
    hotelInfoRequired: false,
  },
  status: "draft",
  totalBookings: 0,
  totalRevenue: 0,
  averageRating: 0,
  reviewCount: 0,
  viewCount: 0,
  supplier: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const useProductBuilderStore = create(
  persist(
    (set, get) => ({
      steps: STEPS,
      currentStep: 0,
      product: { ...INITIAL_PRODUCT },
      completedSteps: [],
      isDirty: false,
      isSaving: false,
      isSubmitting: false,
      lastSaved: null,
      errors: {},
      submissionErrors: {},
      hasHydrated: false,

      currentSectionId: "basics",
      currentStepId: "language-and-title",
      completedStepIds: [],

      setHasHydrated: (state) => set({ hasHydrated: state }),

      setStep: (step) => {
        const mapping = STEP_INDEX_TO_SECTION_STEP[step] || getDefaultSectionStep();
        set({
          currentStep: step,
          currentSectionId: mapping.sectionId,
          currentStepId: mapping.stepId,
        });
      },

      nextStep: () => {
        const { currentStep, completedSteps, currentStepId, completedStepIds, submissionErrors } = get();
        const remainingSubmissionErrors = Object.fromEntries(
          Object.entries(submissionErrors).filter(([k]) => Number(k) !== currentStep)
        );
        const newCompleted = [...new Set([...completedSteps, currentStep])];
        const newCompletedStepIds = [
          ...new Set([...completedStepIds, currentStepId]),
        ];
        const nextIndex = Math.min(currentStep + 1, STEPS.length - 1);
        const mapping = STEP_INDEX_TO_SECTION_STEP[nextIndex] || getDefaultSectionStep();
        set({
          currentStep: nextIndex,
          completedSteps: newCompleted,
          currentSectionId: mapping.sectionId,
          currentStepId: mapping.stepId,
          completedStepIds: newCompletedStepIds,
          submissionErrors: remainingSubmissionErrors,
        });
      },

      prevStep: () => {
        const { currentStep, submissionErrors } = get();
        const remainingSubmissionErrors = Object.fromEntries(
          Object.entries(submissionErrors).filter(([k]) => Number(k) !== currentStep)
        );
        const prevIndex = Math.max(currentStep - 1, 0);
        const mapping = STEP_INDEX_TO_SECTION_STEP[prevIndex] || getDefaultSectionStep();
        set({
          currentStep: prevIndex,
          currentSectionId: mapping.sectionId,
          currentStepId: mapping.stepId,
          submissionErrors: remainingSubmissionErrors,
        });
      },

      goToStep: (step) => {
        const { currentStep, submissionErrors } = get();
        const remainingSubmissionErrors = Object.fromEntries(
          Object.entries(submissionErrors).filter(([k]) => Number(k) !== currentStep)
        );
        const mapping = STEP_INDEX_TO_SECTION_STEP[step] || getDefaultSectionStep();
        set({
          currentStep: step,
          currentSectionId: mapping.sectionId,
          currentStepId: mapping.stepId,
          submissionErrors: remainingSubmissionErrors,
        });
      },

      navigateTo: (sectionId, stepId) => {
        const { currentStep, submissionErrors } = get();
        const remainingSubmissionErrors = Object.fromEntries(
          Object.entries(submissionErrors).filter(([k]) => Number(k) !== currentStep)
        );
        const step = findSectionStep(sectionId, stepId);
        if (!step) return;
        set({
          currentSectionId: sectionId,
          currentStepId: stepId,
          currentStep: step.stepIndex,
          submissionErrors: remainingSubmissionErrors,
        });
      },

      getSectionProgress: (sectionId) => {
        const { completedStepIds } = get();
        const section = SECTIONS.find((s) => s.id === sectionId);
        if (!section) return { completed: 0, total: 0, percentage: 0 };
        const completed = section.steps.filter((s) =>
          completedStepIds.includes(s.id)
        ).length;
        const total = section.steps.length;
        return {
          completed,
          total,
          percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
        };
      },

      getOverallProgress: () => {
        const { completedStepIds } = get();
        const totalSteps = SECTIONS.reduce((sum, s) => sum + s.steps.length, 0);
        if (totalSteps === 0) return 0;
        return Math.round((completedStepIds.length / totalSteps) * 100);
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

      setSubmitting: (val) => set({ isSubmitting: val }),

      setErrors: (errors) => set({ errors }),

      clearErrors: () => set({ errors: {} }),

      setSubmissionErrors: (errors) => set({ submissionErrors: errors }),

      clearSubmissionErrors: () => set({ submissionErrors: {} }),

      clearStepSubmissionError: (stepIndex) => {
        set((state) => ({
          submissionErrors: Object.fromEntries(
            Object.entries(state.submissionErrors).filter(([k]) => Number(k) !== stepIndex)
          ),
        }));
      },

      validateStep: (stepIndex) => {
        const { product } = get();
        const errors = {};

        switch (stepIndex) {
          case 0: // Language & Title
            if (!product.title?.trim()) {
              errors.title = "Title is required";
            } else if (product.title.length > 200) {
              errors.title = "Title must be less than 200 characters";
            }

            if (!product.content?.writingLanguage) {
              errors.writingLanguage = "Please select a language";
            }
            break;

          case 1: // Categorization
            if (!product.productType) errors.productType = "Please select a product type";
            if (product.productType === "tour") {
              if (!product.tourTransportationModes?.length) errors.tourTransportationModes = "Please select at least one transportation mode";
            }
            if (product.productType === "activity") {
              if (!product.activityCategories?.length) errors.activityCategories = "Please select at least one activity category";
            }
            if (product.productType === "transport") {
              if (!product.transportCategories?.length) errors.transportCategories = "Please select at least one transportation type";
            }
            break;

          case 2: // Theme
            if (!product.secondaryThemes?.length) {
              errors.secondaryThemes = "Please select at least one theme";
            } else if (product.secondaryThemes.length > 3) {
              errors.secondaryThemes = "Maximum 3 themes allowed";
            }
            break;

          case 3: // Photos & Media
            if (!product.photos || product.photos.length === 0) {
              errors.photos = "At least one photo is required";
            } else if (product.photos.length > 20) {
              errors.photos = "Maximum 20 photos allowed";
            }
            break;

          case 4: // Meeting & Pickup
            if (product.content.pickupAvailable) {
              if (!product.content.pickupAreas?.length) errors.pickupAreas = "Select at least one pickup area";
              if (!product.content.pickupLocations?.length) errors.pickupLocations = "Add at least one pickup location";
              if (!product.content.pickupLeadTime && product.content.pickupLeadTime !== 0) errors.pickupLeadTime = "Pickup lead time is required";
              if (!product.content.pickupType?.trim()) errors.pickupType = "Pickup type is required";
            } else {
              if (!product.content.meetingPoint?.trim()) errors.meetingPoint = "Meeting point is required";
            }
            if (!product.content.meetingInstructions?.trim()) errors.meetingInstructions = "Meeting instructions are required";
            break;

          case 5: // Tour Details
            if (!product.content.itinerary?.length) errors.itinerary = "At least one itinerary item is required";
            if (normalizeHighlights(product.content.highlights).length === 0) {
              errors.highlights = "At least one tour highlight is required";
            }
            break;

          case 6: // Languages Offered
            if (!product.content.languages?.length) errors.languages = "At least one language is required";
            break;

          case 7: // Inclusions & Exclusions
            if (!product.content.included?.length) errors.included = "Add at least one inclusion";
            if (!product.content.excluded?.length) errors.excluded = "Add at least one exclusion";
            if (!product.content.inclusionsConfirmed) errors.inclusionsConfirmed = "Please confirm the information is accurate";
            break;

          case 8: // What Makes Your Product Unique
            if (!product.content.uniqueSellingPoints?.length) {
              errors.uniqueSellingPoints = "Add at least one selling point";
            }
            break;

          case 9: // Information Travelers Need
            if (!product.content.physicalDifficulty) {
              errors.physicalDifficulty = "Please select a physical difficulty level";
            }
            if (!product.content.resellerType) {
              errors.resellerType = "Please indicate if you are acting as a reseller";
            }
            if (!product.content.contactPhone?.number?.trim()) {
              errors.contactPhone = "A contact phone number is required";
            }
            break;

          case 10: // Traveler Details
            if (
              !product.content.passportRequired &&
              !product.content.flightInfoRequired &&
              !product.content.shipInfoRequired &&
              !product.content.trainInfoRequired &&
              !product.content.hotelInfoRequired
            ) {
              errors.travelerDetails = "Select at least one traveler detail to collect";
            }
            break;

          case 11: // Pricing Schedules
            if (!product.pricing.pricingModel) {
              errors.pricingModel = "Pricing model is required";
            }
            if (!product.pricing.currency || product.pricing.currency.length !== 3) {
              errors.currency = "Valid currency is required";
            }
            if (!product.pricing.ageGroups?.some((ag) => ag.enabled)) {
              errors.ageGroups = "At least one age group must be enabled";
            }
            if (!product.pricing.maxTravelersPerBooking || product.pricing.maxTravelersPerBooking < 1) {
              errors.maxTravelers = "Maximum travelers per booking is required";
            }
            break;

          case 12: // Booking Process
            if (!product.schedule.operatingDays?.length) {
              errors.operatingDays = "At least one operating day is required";
            }
            if (!product.bookingRules.minAdvanceBookingHours || product.bookingRules.minAdvanceBookingHours < 1) {
              errors.minAdvanceBookingHours = "Minimum advance booking hours is required";
            }
            break;

          case 13: // Cancellation Policy
            if (!product.cancellationPolicy) {
              errors.cancellationPolicy = "Please select a cancellation policy";
            }
            break;

          case 14: // Traveler Required Info
            if (!product.bookingRules.travelerRequiredInfo?.length) {
              errors.travelerRequiredInfo = "Select at least one field to collect from travelers";
            }
            break;

          case 15: // Preview
            if (!product.description?.trim()) {
              errors.description = "Product description is required for preview";
            }
            break;

          default:
            break;
        }

        const isValid = Object.keys(errors).length === 0;
        set({ errors });
        return isValid;
      },

      reset: () => {
        set({
          currentStep: 0,
          product: { ...INITIAL_PRODUCT },
          completedSteps: [],
          isDirty: false,
          isSaving: false,
          isSubmitting: false,
          lastSaved: null,
          errors: {},
          submissionErrors: {},
          currentSectionId: "basics",
          currentStepId: "language-and-title",
          completedStepIds: [],
        });
      },

      loadDraft: (draft) => {
        const mergedContent = {
          ...INITIAL_PRODUCT.content,
          ...draft?.content,
          highlights: normalizeHighlights(draft?.content?.highlights),
        };

        set({
          product: {
            ...INITIAL_PRODUCT,
            ...draft,
            content: mergedContent,
          },
          isDirty: false,
        });
      },
    }),
    {
      name: "product-builder-draft",
      partialize: (state) => ({
        product: {
          ...state.product,
          photos: (state.product.photos || []).map((p) => ({
            ...p,
            file: undefined,
          })),
        },
        currentStep: state.currentStep,
        completedSteps: state.completedSteps,
        currentSectionId: state.currentSectionId,
        currentStepId: state.currentStepId,
        completedStepIds: state.completedStepIds,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.hasHydrated = true;
          state.product = {
            ...INITIAL_PRODUCT,
            ...state.product,
            content: { ...INITIAL_PRODUCT.content, ...state.product?.content },
            bookingRules: { ...INITIAL_PRODUCT.bookingRules, ...state.product?.bookingRules },
            pricing: { ...INITIAL_PRODUCT.pricing, ...state.product?.pricing },
            schedule: { ...INITIAL_PRODUCT.schedule, ...state.product?.schedule },
          };
          if (state.product?.photos) {
            state.product.photos = state.product.photos.filter(
              (p) => !p.url?.startsWith?.('blob:'),
            );
          }
        }
      },
    },
  ),
);
