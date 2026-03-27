import { Decimal } from "@prisma/client/runtime/library";
import {
  calculateTotalCost,
  formatCurrency,
  getGroupedCosts,
  hasCostData,
} from "../utils";

describe("Cost Utility Functions", () => {
  describe("calculateTotalCost", () => {
    it("should sum all non-null cost fields correctly", () => {
      const college = {
        costTuition: 50000,
        costRoomBoard: 18000,
        costFees: 5000,
        costBooks: 1200,
        costPersonal: 1500,
        costOther: 500,
      };
      expect(calculateTotalCost(college)).toBe(76200);
    });

    it("should return null if all fields are null", () => {
      const college = {
        costTuition: null,
        costRoomBoard: null,
        costFees: null,
        costBooks: null,
        costPersonal: null,
        costOther: null,
      };
      expect(calculateTotalCost(college)).toBeNull();
    });

    it("should handle partial data (some null fields)", () => {
      const college = {
        costTuition: 50000,
        costRoomBoard: 18000,
        costFees: null,
        costBooks: null,
        costPersonal: null,
        costOther: null,
      };
      expect(calculateTotalCost(college)).toBe(68000);
    });

    it("should handle Decimal types from Prisma", () => {
      const college = {
        costTuition: new Decimal(50000),
        costRoomBoard: new Decimal(18000),
        costFees: new Decimal(5000),
        costBooks: null,
        costPersonal: null,
        costOther: null,
      };
      expect(calculateTotalCost(college)).toBe(73000);
    });

    it("should handle zero values correctly", () => {
      const college = {
        costTuition: 50000,
        costRoomBoard: 0,
        costFees: 5000,
        costBooks: null,
        costPersonal: null,
        costOther: null,
      };
      expect(calculateTotalCost(college)).toBe(55000);
    });

    it("should handle undefined fields", () => {
      const college = {
        costTuition: 50000,
        costRoomBoard: undefined,
        costFees: undefined,
        costBooks: undefined,
        costPersonal: undefined,
        costOther: undefined,
      };
      expect(calculateTotalCost(college)).toBe(50000);
    });
  });

  describe("formatCurrency", () => {
    it("should format numbers as USD with commas and decimals", () => {
      expect(formatCurrency(50000)).toBe("$50,000.00");
      expect(formatCurrency(1234.56)).toBe("$1,234.56");
      expect(formatCurrency(999999.99)).toBe("$999,999.99");
    });

    it("should handle null values gracefully", () => {
      expect(formatCurrency(null)).toBe("Not specified");
    });

    it("should handle undefined values gracefully", () => {
      expect(formatCurrency(undefined)).toBe("Not specified");
    });

    it("should handle zero values", () => {
      expect(formatCurrency(0)).toBe("$0.00");
    });

    it("should handle Decimal types from Prisma", () => {
      expect(formatCurrency(new Decimal(50000))).toBe("$50,000.00");
      expect(formatCurrency(new Decimal(1234.56))).toBe("$1,234.56");
    });
  });

  describe("getGroupedCosts", () => {
    it("should combine tuition and fees correctly", () => {
      const college = {
        costTuition: 50000,
        costRoomBoard: 18000,
        costFees: 5000,
        costBooks: 1200,
        costPersonal: 1500,
        costOther: 500,
      };
      const result = getGroupedCosts(college);
      expect(result.tuitionAndFees).toBe(55000); // 50000 + 5000
      expect(result.roomAndBoard).toBe(18000);
      expect(result.other).toBe(3200); // 1200 + 1500 + 500
      expect(result.total).toBe(76200);
    });

    it("should handle null values in groups", () => {
      const college = {
        costTuition: 50000,
        costRoomBoard: null,
        costFees: null,
        costBooks: null,
        costPersonal: null,
        costOther: null,
      };
      const result = getGroupedCosts(college);
      expect(result.tuitionAndFees).toBe(50000);
      expect(result.roomAndBoard).toBeNull();
      expect(result.other).toBeNull();
      expect(result.total).toBe(50000);
    });

    it("should return all null if no cost data", () => {
      const college = {
        costTuition: null,
        costRoomBoard: null,
        costFees: null,
        costBooks: null,
        costPersonal: null,
        costOther: null,
      };
      const result = getGroupedCosts(college);
      expect(result.tuitionAndFees).toBeNull();
      expect(result.roomAndBoard).toBeNull();
      expect(result.other).toBeNull();
      expect(result.total).toBeNull();
    });

    it("should handle Decimal types", () => {
      const college = {
        costTuition: new Decimal(50000),
        costRoomBoard: new Decimal(18000),
        costFees: new Decimal(5000),
        costBooks: new Decimal(1200),
        costPersonal: new Decimal(1500),
        costOther: new Decimal(500),
      };
      const result = getGroupedCosts(college);
      expect(result.tuitionAndFees).toBe(55000);
      expect(result.roomAndBoard).toBe(18000);
      expect(result.other).toBe(3200);
      expect(result.total).toBe(76200);
    });

    it("should handle partial data in each group", () => {
      const college = {
        costTuition: 50000,
        costRoomBoard: 18000,
        costFees: null,
        costBooks: 1200,
        costPersonal: null,
        costOther: null,
      };
      const result = getGroupedCosts(college);
      expect(result.tuitionAndFees).toBe(50000); // only tuition
      expect(result.roomAndBoard).toBe(18000);
      expect(result.other).toBe(1200); // only books
      expect(result.total).toBe(69200);
    });
  });

  describe("hasCostData", () => {
    it("should return true if any cost field is non-null", () => {
      expect(hasCostData({ costTuition: 50000 })).toBe(true);
      expect(hasCostData({ costRoomBoard: 18000 })).toBe(true);
      expect(hasCostData({ costFees: 5000 })).toBe(true);
      expect(hasCostData({ costBooks: 1200 })).toBe(true);
      expect(hasCostData({ costPersonal: 1500 })).toBe(true);
      expect(hasCostData({ costOther: 500 })).toBe(true);
    });

    it("should return false if all fields are null", () => {
      const college = {
        costTuition: null,
        costRoomBoard: null,
        costFees: null,
        costBooks: null,
        costPersonal: null,
        costOther: null,
      };
      expect(hasCostData(college)).toBe(false);
    });

    it("should return false if all fields are undefined", () => {
      const college = {
        costTuition: undefined,
        costRoomBoard: undefined,
        costFees: undefined,
        costBooks: undefined,
        costPersonal: undefined,
        costOther: undefined,
      };
      expect(hasCostData(college)).toBe(false);
    });

    it("should handle zero as valid cost data", () => {
      expect(hasCostData({ costTuition: 0 })).toBe(true);
    });

    it("should handle Decimal types", () => {
      expect(hasCostData({ costTuition: new Decimal(50000) })).toBe(true);
    });

    it("should handle empty object", () => {
      expect(hasCostData({})).toBe(false);
    });
  });
});
