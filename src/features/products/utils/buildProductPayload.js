/**
 * Transforms the flat product builder state into the nested API schema.
 * This function maps wizard fields to the backend's expected payload shape.
 */
export const buildProductPayload = (product) => {
  // Convert duration to minutes
  let durationMinutes = Number(product.duration) || 0;
  if (product.durationUnit === "hours") {
    durationMinutes = durationMinutes * 60;
  } else if (product.durationUnit === "days") {
    durationMinutes = durationMinutes * 24 * 60;
  } else if (product.durationUnit === "weeks") {
    durationMinutes = durationMinutes * 7 * 24 * 60;
  }

  // Extract photo URLs
  const photoUrls = (product.photos || []).map((p) =>
    typeof p === "string" ? p : p?.url
  ).filter(Boolean);

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
      ["4WD", "ATV", "Bus", "Car", "Funicular", "Horse", "Minivan", "Motorcycle", "Rickshaw", "Segway", "Subway", "Train", "Tram", "Trolley", "Walking"].includes(m)
    );
    transportMode.air = product.tourTransportationModes.filter((m) =>
      ["Plane", "Helicopter"].includes(m)
    );
  }

  // Ensure required fields have default values
  const payload = {
    // Top-level fields
    title: product.title || "",
    description: product.description || "",
    slug: product.slug || product.title?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || "",
    status: (product.status || "draft").toUpperCase(),
    productType: product.productType || "tour",
    category: product.category || "",
    subcategory: product.subcategory || "",
    activityType: product.activityType || "Guided Tour",
    difficulty: product.difficulty || "Easy",
    duration: Number(product.duration) || 0,
    durationUnit: product.durationUnit || "hours",
    durationMinutes,
    primaryTheme: product.primaryTheme || product.theme || "",
    secondaryThemes: product.secondaryThemes || [],
    tags: product.tags || [],
    city: product.city || "",
    country: product.country || "",
    region: product.region || "",
    latitude: product.latitude || null,
    longitude: product.longitude || null,
    metaTitle: product.metaTitle || product.title || "",
    metaDescription: product.metaDescription || product.shortSummary || product.description?.substring(0, 160) || "",
    photos: photoUrls,
    heroImage: product.heroImage || null,
    videoUrl: product.videoUrl || "",
    totalBookings: product.totalBookings ?? 0,
    totalRevenue: product.totalRevenue ?? 0,
    averageRating: product.averageRating ?? 0,
    reviewCount: product.reviewCount ?? 0,
    viewCount: product.viewCount ?? 0,
    supplier: product.supplier || null,
    createdAt: product.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),

    // Pricing (flat structure for backward compatibility)
    basePrice: Number(product.pricing?.basePrice) || 0,
    currency: product.pricing?.currency || "USD",
    pricingModel: product.pricing?.pricingModel || "perPerson",
    taxes: Number(product.pricing?.taxes) || 0,
    fees: Number(product.pricing?.fees) || 0,
    commissionRate: product.pricing?.commissionRate ?? 15,

    // Schedule flat fields
    seasonalAvailability: product.schedule?.seasonalAvailability || "all_year",
    blackoutDates: product.schedule?.blackoutDates || [],
    bookingCutoffHours: product.schedule?.bookingCutoffHours ?? 24,

    // Booking rules flat fields
    confirmationType: product.bookingRules?.confirmationType || "manual",
    inclusions: product.bookingRules?.inclusions || [],
    exclusions: product.bookingRules?.exclusions || [],
    pickupDescription: product.content?.pickupDescription || "",
    refundRules: product.refundRules || "",
    cancellationPolicy: product.cancellationPolicy || "flexible",

    // Nested: categorization
    categorization: {
      category: product.category || "",
      subcategory: product.subcategory || "",
      difficulty: product.difficulty || "Easy",
      duration: durationMinutes,
      groupSize: {
        min: product.bookingRules?.minGroupSize ?? 1,
        max: product.bookingRules?.maxGroupSize ?? 20,
      },
      transportMode,
    },

    // Nested: theme
    theme: {
      primary: product.primaryTheme || product.theme || "",
      secondary: product.secondaryThemes || [],
      tags: product.tags || [],
    },

    // Nested: productContent
    productContent: {
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
    },

    // Nested: schedulesAndPricing
    schedulesAndPricing: {
      travelerDetails: {
        pricingModel: product.pricing?.pricingModel || "perPerson",
        maxTravelersPerBooking: product.bookingRules?.maxGroupSize ?? 20,
        ageGroups,
      },
      pricingSchedules: [
        {
          startDate: product.pricing?.startDate || new Date().toISOString().split('T')[0],
          endDate: product.pricing?.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          prices,
        },
      ],
      operatingDays: product.schedule?.operatingDays || [],
      timeSlots: product.schedule?.timeSlots || [],
      capacityPerSlot: product.schedule?.capacityPerSlot ?? 20,
    },

    // Nested: bookingAndTickets
    bookingAndTickets: {
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
    },
  };

  // Log the payload for debugging
  console.log("Built product payload:", payload);

  return payload;
};

export default buildProductPayload;
