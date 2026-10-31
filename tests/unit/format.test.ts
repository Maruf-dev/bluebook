import { describe, expect, it } from 'vitest';
import { formatClock, formatDuration } from '../../src/renderer/lib/format';

describe('format', () => {
  it('formats the countdown clock', () => {
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(65)).toBe('1:05');
    expect(formatClock(3725)).toBe('1:02:05');
    expect(formatClock(-5)).toBe('0:00');
  });

  it('formats durations', () => {
    expect(formatDuration(42)).toBe('42 sec');
    expect(formatDuration(125)).toBe('2 min 5 sec');
  });
});
