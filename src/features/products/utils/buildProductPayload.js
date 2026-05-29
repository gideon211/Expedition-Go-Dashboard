/**
 * Transforms the flat product builder state into the nested API schema.
 * Matches the backend's `createTour` controller exactly.
 * Only sends fields the backend reads from req.body.
 */
import { normalizeHighlights } from "@/features/products/utils/normalizeHighlights";
import { buildCategorizationProductTypeFields } from "@/features/products/utils/productTypeFromCategorization";

export const buildProductPayload = (product) => {
  // Build duration object for backend
  const durationPayload = {};
  if (product.durationUnit === "hours") {
    durationPayload.hours = Number(product.duration) || 0;
  } else if (product.durationUnit === "days") {
    durationPayload.days = Number(product.duration) || 0;
  } else if (product.durationUnit === "weeks") {
    durationPayload.days = (Number(product.duration) || 0) * 7;
  }

  // Extract photo URLs
  const photoUrls = (product.photos || [])
    .map((p) => (typeof p === "string" ? p : p?.url))
    .filter(Boolean);

  // Find the hero photo URL (backend coverPhoto must be a URL string)
  const heroPhoto = product.heroImage
    ? product.photos.find((p) => p.id === product.heroImage)
    : null;
  const coverPhotoUrl = heroPhoto?.url || (photoUrls.length > 0 ? photoUrls[0] : null);

  // Build age groups from pricing tiers
  const ageGroups = (product.pricing?.tiers || []).map((tier) => ({
    label: tier.name,
    minAge: tier.minAge,
    maxAge: tier.maxAge,
  }));

  // Build prices for pricing schedule
  const prices = (product.pricing?.tiers || []).map((tier) => ({
    ageGroup: tier.name,
    retailPrice: Number(tier.price) || 0,
  }));

  // Build transport mode object
  const transportMode = {};
  if (product.tourTransportationModes?.length) {
    transportMode.land = product.tourTransportationModes.filter((m) =>
      [
        "4WD",
        "ATV",
        "Bus",
        "Car",
        "Funicular",
        "Horse",
        "Minivan",
        "Motorcycle",
        "Rickshaw",
        "Segway",
        "Subway",
        "Train",
        "Tram",
        "Trolley",
        "Walking",
      ].includes(m),
    );
    transportMode.air = product.tourTransportationModes.filter((m) =>
      ["Plane", "Helicopter"].includes(m),
    );
  }

  const payload = {
    title: product.title || "",
    description: product.description || "",
    metaTitle: product.metaTitle || product.title || "",
    metaDescription:
      product.metaDescription || product.description?.substring(0, 160) || "",
    status: (product.status || "draft").toUpperCase(),
    tags: product.tags || [],
    photos: photoUrls,
    coverPhoto: coverPhotoUrl,
    latitude: product.latitude || null,
    longitude: product.longitude || null,

    categorization: {
      category: product.category || "",
      subcategory: product.subcategory || "",
      activityType: product.activityType || "Guided Tour",
      difficulty: product.difficulty || "Easy",
      ...buildCategorizationProductTypeFields(product),
      duration: durationPayload,
      groupSize: {
        min: product.bookingRules?.minGroupSize ?? 1,
        max: product.bookingRules?.maxGroupSize ?? 20,
      },
      transportMode,
    },

    theme: {
      primary: product.primaryTheme || product.theme || "",
      secondary: product.secondaryThemes || [],
      tags: product.tags || [],
    },

    productContent: {
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
    },

    schedulesAndPricing: {
      travelerDetails: {
        pricingModel: product.pricing?.pricingModel || "perPerson",
        maxTravelersPerBooking: product.bookingRules?.maxGroupSize ?? 20,
        ageGroups,
      },
      pricingSchedules: {
        currency: product.pricing?.currency || "USD",
        schedules: [
          {
            startDate:
              product.pricing?.startDate ||
              new Date().toISOString().split("T")[0],
            endDate:
              product.pricing?.endDate ||
              new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0],
            prices,
          },
        ],
      },
      operatingDays: product.schedule?.operatingDays || [],
      timeSlots: product.schedule?.timeSlots || [],
      capacityPerSlot: product.schedule?.capacityPerSlot ?? 20,
    },

    bookingAndTickets: {
      instantBooking: product.bookingRules?.instantBooking ?? false,
      minAdvanceBookingHours:
        product.bookingRules?.minAdvanceBookingHours ?? 48,
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
    },
  };

  return payload;
};

export default buildProductPayload;
