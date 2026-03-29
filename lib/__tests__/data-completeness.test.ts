import { getDataCompleteness } from "../utils";

describe("getDataCompleteness", () => {
  describe("new college with minimal data", () => {
    it("should return 0% completion for college with only required fields", () => {
      const college = {
        name: "Test University",
        category: "MATCH",
        strategy: "RD",
        location: null,
        major: null,
        deadlineApp: null,
        deadlineFinaid: null,
        portalUrl: null,
        portalUser: null,
        portalPassword: null,
        costTuition: null,
        costRoomBoard: null,
        costFees: null,
        costBooks: null,
        costPersonal: null,
        costOther: null,
        isInState: null,
        notes: null,
      };

      const result = getDataCompleteness(college);

      expect(result.overall.completed).toBe(0);
      expect(result.overall.total).toBe(15);
      expect(result.overall.percentage).toBe(0);
      expect(result.status).toBe("alert");
    });
  });

  describe("category-specific completeness", () => {
    it("should correctly count basic info fields", () => {
      const college = {
        location: "Boston, MA",
        major: "Computer Science",
        deadlineApp: null,
        deadlineFinaid: null,
        portalUrl: null,
        portalUser: null,
        portalPassword: null,
        costTuition: null,
        costRoomBoard: null,
        costFees: null,
        costBooks: null,
        costPersonal: null,
        costOther: null,
        isInState: null,
        notes: null,
      };

      const result = getDataCompleteness(college);
      const basicCategory = result.categories.find(
        (c) => c.name === "Basic Info"
      );

      expect(basicCategory?.completed).toBe(2);
      expect(basicCategory?.total).toBe(2);
      expect(basicCategory?.percentage).toBe(100);
      expect(basicCategory?.status).toBe("complete");
      expect(basicCategory?.missingFields).toEqual([]);
    });

    it("should correctly count deadline fields", () => {
      const college = {
        location: null,
        major: null,
        deadlineApp: new Date("2026-11-01"),
        deadlineFinaid: new Date("2026-03-01"),
        portalUrl: null,
        portalUser: null,
        portalPassword: null,
        costTuition: null,
        costRoomBoard: null,
        costFees: null,
        costBooks: null,
        costPersonal: null,
        costOther: null,
        isInState: null,
        notes: null,
      };

      const result = getDataCompleteness(college);
      const deadlinesCategory = result.categories.find(
        (c) => c.name === "Deadlines"
      );

      expect(deadlinesCategory?.completed).toBe(2);
      expect(deadlinesCategory?.total).toBe(2);
      expect(deadlinesCategory?.percentage).toBe(100);
      expect(deadlinesCategory?.status).toBe("complete");
    });

    it("should correctly count portal fields (partial)", () => {
      const college = {
        location: null,
        major: null,
        deadlineApp: null,
        deadlineFinaid: null,
        portalUrl: "https://apply.university.edu",
        portalUser: "student@email.com",
        portalPassword: null,
        costTuition: null,
        costRoomBoard: null,
        costFees: null,
        costBooks: null,
        costPersonal: null,
        costOther: null,
        isInState: null,
        notes: null,
      };

      const result = getDataCompleteness(college);
      const portalCategory = result.categories.find(
        (c) => c.name === "Portal Access"
      );

      expect(portalCategory?.completed).toBe(2);
      expect(portalCategory?.total).toBe(3);
      expect(portalCategory?.percentage).toBe(67);
      expect(portalCategory?.status).toBe("warning");
      expect(portalCategory?.missingFields).toEqual(["Password"]);
    });

    it("should correctly count cost fields (partial)", () => {
      const college = {
        location: null,
        major: null,
        deadlineApp: null,
        deadlineFinaid: null,
        portalUrl: null,
        portalUser: null,
        portalPassword: null,
        costTuition: 50000,
        costRoomBoard: 15000,
        costFees: 2000,
        costBooks: null,
        costPersonal: null,
        costOther: null,
        isInState: true,
        notes: null,
      };

      const result = getDataCompleteness(college);
      const costCategory = result.categories.find((c) => c.name === "Cost Info");

      expect(costCategory?.completed).toBe(4);
      expect(costCategory?.total).toBe(7);
      expect(costCategory?.percentage).toBe(57);
      expect(costCategory?.status).toBe("warning");
      expect(costCategory?.missingFields).toEqual([
        "Books",
        "Personal",
        "Other",
      ]);
    });

    it("should correctly count notes field", () => {
      const college = {
        location: null,
        major: null,
        deadlineApp: null,
        deadlineFinaid: null,
        portalUrl: null,
        portalUser: null,
        portalPassword: null,
        costTuition: null,
        costRoomBoard: null,
        costFees: null,
        costBooks: null,
        costPersonal: null,
        costOther: null,
        isInState: null,
        notes: "Strong engineering program",
      };

      const result = getDataCompleteness(college);
      const notesCategory = result.categories.find((c) => c.name === "Notes");

      expect(notesCategory?.completed).toBe(1);
      expect(notesCategory?.total).toBe(1);
      expect(notesCategory?.percentage).toBe(100);
      expect(notesCategory?.status).toBe("complete");
    });
  });

  describe("complete college data", () => {
    it("should return 100% for fully populated college", () => {
      const college = {
        location: "Boston, MA",
        major: "Computer Science",
        deadlineApp: new Date("2026-11-01"),
        deadlineFinaid: new Date("2026-03-01"),
        portalUrl: "https://apply.university.edu",
        portalUser: "student@email.com",
        portalPassword: "secure123",
        costTuition: 50000,
        costRoomBoard: 15000,
        costFees: 2000,
        costBooks: 1000,
        costPersonal: 2000,
        costOther: 500,
        isInState: false,
        notes: "Strong engineering program",
      };

      const result = getDataCompleteness(college);

      expect(result.overall.completed).toBe(15);
      expect(result.overall.total).toBe(15);
      expect(result.overall.percentage).toBe(100);
      expect(result.status).toBe("complete");

      // All categories should be complete
      result.categories.forEach((category) => {
        expect(category.percentage).toBe(100);
        expect(category.status).toBe("complete");
        expect(category.missingFields).toEqual([]);
      });
    });
  });

  describe("edge cases", () => {
    it("should treat empty strings as incomplete", () => {
      const college = {
        location: "",
        major: "   ",
        deadlineApp: null,
        deadlineFinaid: null,
        portalUrl: null,
        portalUser: null,
        portalPassword: null,
        costTuition: null,
        costRoomBoard: null,
        costFees: null,
        costBooks: null,
        costPersonal: null,
        costOther: null,
        isInState: null,
        notes: "",
      };

      const result = getDataCompleteness(college);
      const basicCategory = result.categories.find(
        (c) => c.name === "Basic Info"
      );

      expect(basicCategory?.completed).toBe(0);
      expect(basicCategory?.missingFields).toEqual(["Location", "Major"]);
    });

    it("should treat zero as valid data (complete)", () => {
      const college = {
        location: null,
        major: null,
        deadlineApp: null,
        deadlineFinaid: null,
        portalUrl: null,
        portalUser: null,
        portalPassword: null,
        costTuition: 0,
        costRoomBoard: 0,
        costFees: 0,
        costBooks: 0,
        costPersonal: 0,
        costOther: 0,
        isInState: null,
        notes: null,
      };

      const result = getDataCompleteness(college);
      const costCategory = result.categories.find((c) => c.name === "Cost Info");

      expect(costCategory?.completed).toBe(6);
      expect(costCategory?.total).toBe(7);
      expect(costCategory?.missingFields).toEqual(["Residency"]);
    });

    it("should treat false as valid data (complete)", () => {
      const college = {
        location: null,
        major: null,
        deadlineApp: null,
        deadlineFinaid: null,
        portalUrl: null,
        portalUser: null,
        portalPassword: null,
        costTuition: null,
        costRoomBoard: null,
        costFees: null,
        costBooks: null,
        costPersonal: null,
        costOther: null,
        isInState: false,
        notes: null,
      };

      const result = getDataCompleteness(college);
      const costCategory = result.categories.find((c) => c.name === "Cost Info");

      expect(costCategory?.completed).toBe(1);
      expect(costCategory?.missingFields).not.toContain("Residency");
    });

    it("should handle Decimal type for cost fields", () => {
      const college = {
        location: null,
        major: null,
        deadlineApp: null,
        deadlineFinaid: null,
        portalUrl: null,
        portalUser: null,
        portalPassword: null,
        costTuition: { toNumber: () => 50000 },
        costRoomBoard: { toNumber: () => 15000 },
        costFees: null,
        costBooks: null,
        costPersonal: null,
        costOther: null,
        isInState: null,
        notes: null,
      };

      const result = getDataCompleteness(college);
      const costCategory = result.categories.find((c) => c.name === "Cost Info");

      expect(costCategory?.completed).toBe(2);
      expect(costCategory?.missingFields).toEqual([
        "Fees",
        "Books",
        "Personal",
        "Other",
        "Residency",
      ]);
    });
  });

  describe("status thresholds", () => {
    it("should return 'complete' for 100%", () => {
      const college = {
        location: "Boston, MA",
        major: "Computer Science",
        deadlineApp: new Date(),
        deadlineFinaid: new Date(),
        portalUrl: "https://portal.edu",
        portalUser: "user",
        portalPassword: "pass",
        costTuition: 50000,
        costRoomBoard: 15000,
        costFees: 2000,
        costBooks: 1000,
        costPersonal: 2000,
        costOther: 500,
        isInState: true,
        notes: "Notes",
      };

      const result = getDataCompleteness(college);
      expect(result.status).toBe("complete");
    });

    it("should return 'good' for 75-99%", () => {
      const college = {
        location: "Boston, MA",
        major: "Computer Science",
        deadlineApp: new Date(),
        deadlineFinaid: new Date(),
        portalUrl: "https://portal.edu",
        portalUser: "user",
        portalPassword: "pass",
        costTuition: 50000,
        costRoomBoard: 15000,
        costFees: 2000,
        costBooks: 1000,
        costPersonal: 2000,
        costOther: null, // 13/15 = 87%
        isInState: true,
        notes: null,
      };

      const result = getDataCompleteness(college);
      expect(result.overall.percentage).toBe(87); // 13/15
      expect(result.status).toBe("good");
    });

    it("should return 'warning' for 40-74%", () => {
      const college = {
        location: "Boston, MA",
        major: "Computer Science",
        deadlineApp: new Date(),
        deadlineFinaid: null,
        portalUrl: "https://portal.edu",
        portalUser: null,
        portalPassword: null,
        costTuition: 50000,
        costRoomBoard: null,
        costFees: null,
        costBooks: null,
        costPersonal: null,
        costOther: null,
        isInState: null,
        notes: null,
      };

      const result = getDataCompleteness(college);
      expect(result.overall.percentage).toBe(33); // 5/15
      expect(result.status).toBe("alert");
    });

    it("should return 'alert' for 0-39%", () => {
      const college = {
        location: null,
        major: null,
        deadlineApp: new Date(),
        deadlineFinaid: null,
        portalUrl: null,
        portalUser: null,
        portalPassword: null,
        costTuition: null,
        costRoomBoard: null,
        costFees: null,
        costBooks: null,
        costPersonal: null,
        costOther: null,
        isInState: null,
        notes: null,
      };

      const result = getDataCompleteness(college);
      expect(result.overall.percentage).toBe(7); // 1/15
      expect(result.status).toBe("alert");
    });
  });

  describe("real-world scenarios", () => {
    it("should handle typical partial data entry", () => {
      const college = {
        location: "Cambridge, MA",
        major: "Biology",
        deadlineApp: new Date("2026-11-01"),
        deadlineFinaid: null,
        portalUrl: "https://apply.harvard.edu",
        portalUser: "student@email.com",
        portalPassword: null,
        costTuition: 57261,
        costRoomBoard: 18389,
        costFees: null,
        costBooks: null,
        costPersonal: null,
        costOther: null,
        isInState: false,
        notes: null,
      };

      const result = getDataCompleteness(college);

      // 2 (basic) + 1 (deadlines) + 2 (portal) + 3 (cost) = 8/15 = 53%
      expect(result.overall.completed).toBe(8);
      expect(result.overall.percentage).toBe(53);
      expect(result.status).toBe("warning");

      // Check individual categories
      const basicCategory = result.categories.find(
        (c) => c.name === "Basic Info"
      );
      expect(basicCategory?.percentage).toBe(100);

      const deadlinesCategory = result.categories.find(
        (c) => c.name === "Deadlines"
      );
      expect(deadlinesCategory?.percentage).toBe(50);

      const portalCategory = result.categories.find(
        (c) => c.name === "Portal Access"
      );
      expect(portalCategory?.percentage).toBe(67);

      const costCategory = result.categories.find((c) => c.name === "Cost Info");
      expect(costCategory?.percentage).toBe(43);
    });

    it("should provide accurate missing field hints", () => {
      const college = {
        location: null,
        major: "Engineering",
        deadlineApp: null,
        deadlineFinaid: null,
        portalUrl: "https://portal.edu",
        portalUser: null,
        portalPassword: null,
        costTuition: 50000,
        costRoomBoard: null,
        costFees: null,
        costBooks: null,
        costPersonal: null,
        costOther: null,
        isInState: null,
        notes: "Great program",
      };

      const result = getDataCompleteness(college);

      const basicCategory = result.categories.find(
        (c) => c.name === "Basic Info"
      );
      expect(basicCategory?.missingFields).toEqual(["Location"]);

      const deadlinesCategory = result.categories.find(
        (c) => c.name === "Deadlines"
      );
      expect(deadlinesCategory?.missingFields).toEqual([
        "Application Deadline",
        "Financial Aid Deadline",
      ]);

      const portalCategory = result.categories.find(
        (c) => c.name === "Portal Access"
      );
      expect(portalCategory?.missingFields).toEqual(["Username", "Password"]);
    });
  });
});
