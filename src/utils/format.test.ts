import { describe, it, expect } from 'vitest';
import { formatDuration, formatTime, truncate } from './format';

describe('format utilities', () => {
  it('formats seconds into readable hours, minutes, and seconds', () => {
    expect(formatDuration(85)).toBe('1m 25s');
    expect(formatDuration(35)).toBe('35s');
    expect(formatDuration(7200)).toBe('2h');
    expect(formatDuration(7500)).toBe('2h 5m');
  });

  it('formats seconds into mm:ss and hh:mm:ss', () => {
    expect(formatTime(65)).toBe('01:05');
    expect(formatTime(3665)).toBe('1:01:05');
    expect(formatTime(0)).toBe('00:00');
  });

  it('truncates long text properly', () => {
    expect(truncate('Hello world', 5)).toBe('Hello…');
    expect(truncate('Short', 10)).toBe('Short');
  });
});
