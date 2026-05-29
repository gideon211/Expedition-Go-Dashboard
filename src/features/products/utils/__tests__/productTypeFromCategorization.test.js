import { describe, it, expect } from "vitest";
import { parseProductTypeFromCategorization } from "../productTypeFromCategorization";

describe("parseProductTypeFromCategorization", () => {
  it("returns stored productType when present", () => {
    expect(
      parseProductTypeFromCategorization({
        productType: "tour",
        tourDurationCategory: "one_day_or_less",
      }),
    ).toEqual({
      productType: "tour",
      tourDurationCategory: "one_day_or_less",
      activityCategories: [],
      transportCategories: [],
    });
  });

  it("infers tour type from transportation modes for legacy tours", () => {
    expect(
      parseProductTypeFromCategorization({
        category: "safari",
        transportMode: { land: ["4WD"], air: [] },
      }),
    ).toEqual({
      productType: "tour",
      tourDurationCategory: "",
      activityCategories: [],
      transportCategories: [],
    });
  });

  it("does not default non-tour categories to activity", () => {
    expect(
      parseProductTypeFromCategorization({
        category: "safari",
      }),
    ).toEqual({
      productType: "",
      tourDurationCategory: "",
      activityCategories: [],
      transportCategories: [],
    });
  });

  it("infers activity and transport types from saved category lists", () => {
    expect(
      parseProductTypeFromCategorization({
        activityCategories: ["Hiking"],
      }).productType,
    ).toBe("activity");

    expect(
      parseProductTypeFromCategorization({
        transportCategories: ["Airport Transfers"],
      }).productType,
    ).toBe("transport");
  });
});
