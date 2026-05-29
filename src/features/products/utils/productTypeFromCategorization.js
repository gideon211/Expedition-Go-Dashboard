const VALID_PRODUCT_TYPES = new Set(["tour", "activity", "transport"]);

export function parseProductTypeFromCategorization(categorization = {}) {
  const activityCategories = Array.isArray(categorization.activityCategories)
    ? categorization.activityCategories
    : [];
  const transportCategories = Array.isArray(categorization.transportCategories)
    ? categorization.transportCategories
    : [];
  const tourDurationCategory = categorization.tourDurationCategory || "";

  let productType = VALID_PRODUCT_TYPES.has(categorization.productType)
    ? categorization.productType
    : "";

  if (!productType) {
    if (transportCategories.length > 0) {
      productType = "transport";
    } else if (activityCategories.length > 0) {
      productType = "activity";
    } else {
      const transportMode = categorization.transportMode || {};
      const hasTourTransport = [
        ...(transportMode.land || []),
        ...(transportMode.air || []),
      ].length > 0;

      if (hasTourTransport || tourDurationCategory) {
        productType = "tour";
      } else if (categorization.category?.toLowerCase() === "tour") {
        productType = "tour";
      }
    }
  }

  return {
    productType,
    tourDurationCategory,
    activityCategories,
    transportCategories,
  };
}

export function buildCategorizationProductTypeFields(product = {}) {
  return {
    productType: product.productType || "",
    tourDurationCategory: product.tourDurationCategory || "",
    activityCategories: product.activityCategories || [],
    transportCategories: product.transportCategories || [],
  };
}
