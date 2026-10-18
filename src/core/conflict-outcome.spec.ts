import { conflictIsOver, conflictOutcome, conflictResult } from './bgs';

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
    expect(conflictOutcome(0, 3)).toBe('Total Defeat');
  });
});

describe('ended conflicts', () => {
  it('are over at 4 days won or when the source says so, and only say who won', () => {
    expect(conflictIsOver({ ours: 4, theirs: 0 })).toBe(true);
    expect(conflictIsOver({ ours: 1, theirs: 4 })).toBe(true);
    expect(conflictIsOver({ ours: 3, theirs: 2, ended: true })).toBe(true);
    expect(conflictIsOver({ ours: 3, theirs: 0 })).toBe(false);
    expect(conflictResult(4, 0)).toBe('won');
    expect(conflictResult(1, 4)).toBe('lost');
    expect(conflictResult(2, 2)).toBe('drawn');
  });
});
