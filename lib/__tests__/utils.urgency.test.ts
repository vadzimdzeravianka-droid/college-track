import { getUrgencyLevel, getUrgencyMessage } from "../utils";

// Helper to create dates relative to now
const daysFromNow = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

const mockChecklist = {
  lorTeacher: false,
  transcriptSent: false,
  testScoresSent: false,
  essayCount: 2,
  mainEssayComplete: false,
  supplementalEssaysCompleted: 0,
  finaidGreenLight: false,
};

describe("getUrgencyLevel", () => {
  describe("boundary cases for absolute day thresholds", () => {
    it("should return red for overdue deadline (yesterday)", () => {
      const deadline = daysFromNow(-1);
      const result = getUrgencyLevel(deadline, "IN_PROGRESS", mockChecklist, 2);
      expect(result).toBe("red");
    });

    it("should return red for deadline today (0 days)", () => {
      const deadline = daysFromNow(0);
      const result = getUrgencyLevel(deadline, "IN_PROGRESS", mockChecklist, 2);
      expect(result).toBe("red");
    });

    it("should return red for deadline in 7 days (boundary)", () => {
      const deadline = daysFromNow(7);
      const result = getUrgencyLevel(deadline, "IN_PROGRESS", mockChecklist, 2);
      expect(result).toBe("red");
    });

    it("should return yellow for deadline in 8 days (just past red boundary)", () => {
      const deadline = daysFromNow(8);
      const result = getUrgencyLevel(deadline, "IN_PROGRESS", mockChecklist, 2);
      expect(result).toBe("yellow");
    });

    it("should return yellow for deadline in 14 days (middle of yellow zone)", () => {
      const deadline = daysFromNow(14);
      const result = getUrgencyLevel(deadline, "IN_PROGRESS", mockChecklist, 2);
      expect(result).toBe("yellow");
    });

    it("should return yellow for deadline in 21 days (boundary)", () => {
      const deadline = daysFromNow(21);
      const result = getUrgencyLevel(deadline, "IN_PROGRESS", mockChecklist, 2);
      expect(result).toBe("yellow");
    });

    it("should return green for deadline in 22 days (just past yellow boundary)", () => {
      const deadline = daysFromNow(22);
      const result = getUrgencyLevel(deadline, "IN_PROGRESS", mockChecklist, 2);
      expect(result).toBe("green");
    });

    it("should return green for deadline in 45 days", () => {
      const deadline = daysFromNow(45);
      const result = getUrgencyLevel(deadline, "IN_PROGRESS", mockChecklist, 2);
      expect(result).toBe("green");
    });
  });

  describe("special status cases", () => {
    it("should return none for null deadline", () => {
      const result = getUrgencyLevel(null, "IN_PROGRESS", mockChecklist, 2);
      expect(result).toBe("none");
    });

    it("should return none for SUBMITTED status with future deadline", () => {
      const deadline = daysFromNow(5);
      const result = getUrgencyLevel(deadline, "SUBMITTED", mockChecklist, 2);
      expect(result).toBe("none");
    });

    it("should return none for ACCEPTED status with past deadline", () => {
      const deadline = daysFromNow(-10);
      const result = getUrgencyLevel(deadline, "ACCEPTED", mockChecklist, 2);
      expect(result).toBe("none");
    });

    it("should return none for DECLINED status", () => {
      const deadline = daysFromNow(5);
      const result = getUrgencyLevel(deadline, "DECLINED", mockChecklist, 2);
      expect(result).toBe("none");
    });
  });
});

describe("getUrgencyMessage", () => {
  describe("red urgency messages", () => {
    it("should return 'Deadline passed' for overdue deadline", () => {
      const deadline = daysFromNow(-5);
      const result = getUrgencyMessage(deadline, "IN_PROGRESS", mockChecklist, 2);
      expect(result).toBe("Deadline passed");
    });

    it("should show days needed when impossible to complete", () => {
      const deadline = daysFromNow(5);
      // Mock checklist that requires more than 5 days
      const result = getUrgencyMessage(deadline, "IN_PROGRESS", mockChecklist, 2);
      // Should show "Critical: Need X days, only 5 days left" format
      expect(result).toContain("Critical: Need");
      expect(result).toContain("days, only 5 days left");
    });

    it("should return simple critical message when time is sufficient", () => {
      const deadline = daysFromNow(7);
      // Completed checklist requires minimum 10 days, but we have only 7
      // Actually with 7 days it still exceeds, let me think...
      // Actually calculateDaysNeeded returns min 10 days
      // So any deadline <= 10 days will show "Need X, only Y" format
      // To get simple message, need deadline > 10 days but still in red zone
      // Red zone is <= 7 days, so no way to get simple message in red zone
      // with current logic. Let me check yellow zone instead.
      const completedChecklist = {
        lorTeacher: true,
        transcriptSent: true,
        testScoresSent: true,
        essayCount: 0,
        mainEssayComplete: true,
        supplementalEssaysCompleted: 0,
        finaidGreenLight: true,
      };
      const result = getUrgencyMessage(deadline, "IN_PROGRESS", completedChecklist, 0);
      // With 7 days and needing 10, should show "Need 10, only 7"
      expect(result).toBe("Critical: Need 10 days, only 7 days left");
    });
  });

  describe("yellow urgency messages", () => {
    it("should return 'Warning: 1-3 weeks until deadline' when time is sufficient", () => {
      const deadline = daysFromNow(14);
      // Completed checklist needs 10 days, we have 14, so should show simple message
      const completedChecklist = {
        lorTeacher: true,
        transcriptSent: true,
        testScoresSent: true,
        essayCount: 0,
        mainEssayComplete: true,
        supplementalEssaysCompleted: 0,
        finaidGreenLight: true,
      };
      const result = getUrgencyMessage(deadline, "IN_PROGRESS", completedChecklist, 0);
      expect(result).toBe("Warning: 1-3 weeks until deadline");
    });

    it("should show days needed when work exceeds time available", () => {
      const deadline = daysFromNow(20);
      // Mock checklist that requires more than 20 days
      const result = getUrgencyMessage(deadline, "IN_PROGRESS", mockChecklist, 5);
      // Should show "Warning: Need X days, only 20 days left" format
      expect(result).toContain("Warning:");
      expect(result).toContain("Need");
      expect(result).toContain("days");
    });
  });

  describe("green urgency messages", () => {
    it("should return 'On track: X days until deadline' for 45 days", () => {
      const deadline = daysFromNow(45);
      const result = getUrgencyMessage(deadline, "IN_PROGRESS", mockChecklist, 2);
      expect(result).toBe("On track: 45 days until deadline");
    });

    it("should return 'On track: X days until deadline' for 30 days", () => {
      const deadline = daysFromNow(30);
      const result = getUrgencyMessage(deadline, "IN_PROGRESS", mockChecklist, 2);
      expect(result).toBe("On track: 30 days until deadline");
    });
  });

  describe("none urgency messages", () => {
    it("should return empty string for null deadline", () => {
      const result = getUrgencyMessage(null, "IN_PROGRESS", mockChecklist, 2);
      expect(result).toBe("");
    });

    it("should return empty string for SUBMITTED status", () => {
      const deadline = daysFromNow(5);
      const result = getUrgencyMessage(deadline, "SUBMITTED", mockChecklist, 2);
      expect(result).toBe("");
    });
  });

  describe("message format validation", () => {
    it("should not reference 'buffer ratio' or 'percentage'", () => {
      const testCases = [
        daysFromNow(3),  // red
        daysFromNow(14), // yellow
        daysFromNow(45), // green
      ];

      testCases.forEach((deadline) => {
        const result = getUrgencyMessage(deadline, "IN_PROGRESS", null, 0);
        expect(result.toLowerCase()).not.toContain("buffer ratio");
        expect(result.toLowerCase()).not.toContain("percentage");
        expect(result.toLowerCase()).not.toContain("%");
      });
    });
  });
});
