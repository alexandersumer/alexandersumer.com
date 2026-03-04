import { describe, it, expect } from 'vitest';
import { formatDate, isoDate } from '../src/utils/format';

describe('formatDate', () => {
  it('formats a date in US locale', () => {
    expect(formatDate(new Date('2026-02-13'))).toBe('Feb 13, 2026');
  });

  it('formats single-digit day without zero-padding', () => {
    expect(formatDate(new Date('2026-01-05'))).toBe('Jan 5, 2026');
  });

  it('formats December correctly', () => {
    expect(formatDate(new Date('2025-12-31'))).toBe('Dec 31, 2025');
  });
});

describe('isoDate', () => {
  it('returns YYYY-MM-DD', () => {
    expect(isoDate(new Date('2026-02-13'))).toBe('2026-02-13');
  });

  it('zero-pads month and day', () => {
    expect(isoDate(new Date('2026-01-05'))).toBe('2026-01-05');
  });
});
