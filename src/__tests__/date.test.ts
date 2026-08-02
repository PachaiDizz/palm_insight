import { describe, it, expect } from "vitest";
import { getMonthRange, toLocalDateKey, MONTH_NAMES } from "@/lib/date";

describe("getMonthRange", () => {
  it("returns correct range for January", () => {
    const result = getMonthRange(2024, 0);
    expect(result).toEqual({ startDate: "2024-01-01", endDate: "2024-01-31" });
  });

  it("returns correct range for February in leap year", () => {
    const result = getMonthRange(2024, 1);
    expect(result).toEqual({ startDate: "2024-02-01", endDate: "2024-02-29" });
  });

  it("returns correct range for February in non-leap year", () => {
    const result = getMonthRange(2023, 1);
    expect(result).toEqual({ startDate: "2023-02-01", endDate: "2023-02-28" });
  });

  it("returns correct range for December", () => {
    const result = getMonthRange(2024, 11);
    expect(result).toEqual({ startDate: "2024-12-01", endDate: "2024-12-31" });
  });
});

describe("toLocalDateKey", () => {
  it("formats date correctly", () => {
    const date = new Date(2024, 0, 15); // January 15, 2024
    expect(toLocalDateKey(date)).toBe("2024-01-15");
  });

  it("pads single-digit months and days", () => {
    const date = new Date(2024, 2, 5); // March 5, 2024
    expect(toLocalDateKey(date)).toBe("2024-03-05");
  });
});

describe("MONTH_NAMES", () => {
  it("has 12 months", () => {
    expect(MONTH_NAMES).toHaveLength(12);
  });

  it("starts with January and ends with December", () => {
    expect(MONTH_NAMES[0]).toBe("January");
    expect(MONTH_NAMES[11]).toBe("December");
  });
});
