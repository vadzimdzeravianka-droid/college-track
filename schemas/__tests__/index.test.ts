import { PasskeySchema, CollegeSchema, ChecklistSchema } from '../index';

describe('PasskeySchema', () => {
  it('should validate correct passkey', () => {
    const result = PasskeySchema.safeParse({ passkey: 'test123' });
    expect(result.success).toBe(true);
  });

  it('should reject empty passkey', () => {
    const result = PasskeySchema.safeParse({ passkey: '' });
    expect(result.success).toBe(false);
  });

  it('should reject missing passkey', () => {
    const result = PasskeySchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('CollegeSchema', () => {
  const validCollege = {
    name: 'Stanford University',
    category: 'REACH' as const,
    status: 'NOT_STARTED' as const,
    strategy: 'RD' as const,
  };

  it('should validate valid college data', () => {
    const result = CollegeSchema.safeParse(validCollege);
    expect(result.success).toBe(true);
  });

  it('should reject empty name', () => {
    const result = CollegeSchema.safeParse({ ...validCollege, name: '' });
    expect(result.success).toBe(false);
  });

  it('should reject invalid category', () => {
    const result = CollegeSchema.safeParse({ ...validCollege, category: 'INVALID' });
    expect(result.success).toBe(false);
  });

  it('should reject invalid status', () => {
    const result = CollegeSchema.safeParse({ ...validCollege, status: 'INVALID' });
    expect(result.success).toBe(false);
  });

  it('should reject invalid strategy', () => {
    const result = CollegeSchema.safeParse({ ...validCollege, strategy: 'INVALID' });
    expect(result.success).toBe(false);
  });

  it('should accept optional fields as null', () => {
    const result = CollegeSchema.safeParse({
      ...validCollege,
      location: null,
      major: null,
      notes: null,
    });
    expect(result.success).toBe(true);
  });

  it('should accept optional fields as undefined', () => {
    const result = CollegeSchema.safeParse({
      ...validCollege,
      location: undefined,
      major: undefined,
    });
    expect(result.success).toBe(true);
  });
});

describe('ChecklistSchema', () => {
  it('should validate with default values', () => {
    const result = ChecklistSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.lorTeacher).toBe(false);
      expect(result.data.transcriptSent).toBe(false);
      expect(result.data.essayCount).toBe(0);
    }
  });

  it('should validate with custom values', () => {
    const result = ChecklistSchema.safeParse({
      lorTeacher: true,
      transcriptSent: true,
      testScoresSent: false,
      essayCount: 3,
      finaidGreenLight: true,
    });
    expect(result.success).toBe(true);
  });

  it('should reject negative essay count', () => {
    const result = ChecklistSchema.safeParse({ essayCount: -1 });
    expect(result.success).toBe(false);
  });

  it('should reject non-integer essay count', () => {
    const result = ChecklistSchema.safeParse({ essayCount: 2.5 });
    expect(result.success).toBe(false);
  });
});
