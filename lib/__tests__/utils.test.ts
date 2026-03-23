import { isDeadlineUrgent, formatDate } from '../utils';

describe('isDeadlineUrgent', () => {
  const now = new Date('2026-03-23T00:00:00Z');

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return true when deadline is within 7 days and status is NOT_STARTED', () => {
    const deadline = new Date('2026-03-29T00:00:00Z'); // 6 days away
    expect(isDeadlineUrgent(deadline, 'NOT_STARTED')).toBe(true);
  });

  it('should return true when deadline is within 7 days and status is IN_PROGRESS', () => {
    const deadline = new Date('2026-03-25T00:00:00Z'); // 2 days away
    expect(isDeadlineUrgent(deadline, 'IN_PROGRESS')).toBe(true);
  });

  it('should return false when deadline is more than 7 days away', () => {
    const deadline = new Date('2026-04-05T00:00:00Z'); // 13 days away
    expect(isDeadlineUrgent(deadline, 'NOT_STARTED')).toBe(false);
  });

  it('should return false when status is SUBMITTED', () => {
    const deadline = new Date('2026-03-25T00:00:00Z'); // 2 days away
    expect(isDeadlineUrgent(deadline, 'SUBMITTED')).toBe(false);
  });

  it('should return false when status is ACCEPTED', () => {
    const deadline = new Date('2026-03-25T00:00:00Z'); // 2 days away
    expect(isDeadlineUrgent(deadline, 'ACCEPTED')).toBe(false);
  });

  it('should return false when status is DECLINED', () => {
    const deadline = new Date('2026-03-25T00:00:00Z'); // 2 days away
    expect(isDeadlineUrgent(deadline, 'DECLINED')).toBe(false);
  });

  it('should return false when deadline is null', () => {
    expect(isDeadlineUrgent(null, 'NOT_STARTED')).toBe(false);
  });

  it('should return false when deadline has passed', () => {
    const deadline = new Date('2026-03-20T00:00:00Z'); // 3 days ago
    expect(isDeadlineUrgent(deadline, 'NOT_STARTED')).toBe(false);
  });

  it('should return true when deadline is exactly 7 days away', () => {
    const deadline = new Date('2026-03-30T00:00:00Z'); // 7 days away
    expect(isDeadlineUrgent(deadline, 'NOT_STARTED')).toBe(true);
  });

  it('should return true when deadline is today', () => {
    const deadline = new Date('2026-03-23T00:00:00Z'); // today
    expect(isDeadlineUrgent(deadline, 'IN_PROGRESS')).toBe(true);
  });
});

describe('formatDate', () => {
  it('should format date correctly', () => {
    const date = new Date('2026-03-23T00:00:00Z');
    const formatted = formatDate(date);
    expect(formatted).toMatch(/Mar 2[23], 2026/); // Can vary by timezone
  });

  it('should return "Not set" for null date', () => {
    expect(formatDate(null)).toBe('Not set');
  });
});
