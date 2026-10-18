import { conflictOutcome } from './bgs';

describe('conflictOutcome', () => {
  it('counts only the gap between the days won', () => {
    expect(conflictOutcome(0, 0)).toBe('Draw');
    expect(conflictOutcome(3, 3)).toBe('Draw');
    expect(conflictOutcome(1, 0)).toBe('Close Victory');
    expect(conflictOutcome(3, 2)).toBe('Close Victory');
    expect(conflictOutcome(0, 1)).toBe('Close Defeat');
    expect(conflictOutcome(2, 0)).toBe('Victory');
    expect(conflictOutcome(0, 2)).toBe('Defeat');
    expect(conflictOutcome(3, 0)).toBe('Total Victory');
    expect(conflictOutcome(4, 0)).toBe('Total Victory');
    expect(conflictOutcome(1, 4)).toBe('Total Defeat');
  });
});
