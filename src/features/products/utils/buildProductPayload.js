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

  return {
    // Top-level fields
    title: product.title || "",
    description: product.description || "",
    slug: product.slug || "",
    status: (product.status || "draft").toUpperCase(),
    category: product.category || "",
    subcategory: product.subcategory || "",
    activityType: product.activityType || "Guided Tour",
    difficulty: product.difficulty || "Easy",
    durationMinutes,
    primaryTheme: product.primaryTheme || product.theme || "",
    secondaryThemes: product.secondaryThemes || [],
    tags: product.tags || [],
    city: product.city || "",
    country: product.country || "",
    region: product.region || "",
    latitude: product.latitude,
    longitude: product.longitude,
    metaTitle: product.metaTitle || "",
    metaDescription: product.metaDescription || "",
    photos: photoUrls,
    totalBookings: product.totalBookings ?? 0,
    totalRevenue: product.totalRevenue ?? 0,
    averageRating: product.averageRating ?? 0,
    reviewCount: product.reviewCount ?? 0,
    viewCount: product.viewCount ?? 0,
    supplier: product.supplier,
    createdAt: product.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),

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
          startDate: product.pricing?.startDate || "",
          endDate: product.pricing?.endDate || "",
          prices,
        },
      ],
    },

    // Nested: bookingAndTickets
    bookingAndTickets: {
      instantBooking: product.bookingRules?.instantBooking ?? false,
      cancellationPolicy: {
        type: product.cancellationPolicy || "flexible",
        cutoffHours: product.schedule?.bookingCutoffHours ?? 24,
        refundPercentage: product.bookingRules?.refundPercentage ?? 100,
      },
      meetingPoint: {
        name: product.bookingRules?.meetingPoint || "",
        address: product.bookingRules?.meetingPointAddress || "",
        coordinates: {
          lat: product.bookingRules?.meetingPointLat,
          lng: product.bookingRules?.meetingPointLng,
        },
      },
    },
  };
};

export default buildProductPayload;
