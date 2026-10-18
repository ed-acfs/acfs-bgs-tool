import { BgsSystemRecord, EbgsConflicts } from './bgs';
import { serverConflictsBySystem, withFreshestConflicts } from './server-conflicts';

const side = (name: string, wonDays: number, stake: string | null = null) => ({ name, stake, won_days: wonDays });

describe('serverConflictsBySystem', () => {
  it('groups the conflicts by lowercased system name, in the dataset format, marked as from the server', () => {
    const map = serverConflictsBySystem({
      conflicts: [
        { system_address: '1', system_name: 'LP 254-26', last_seen: '2026-10-18T09:00:00Z', type: 'war', status: 'active', faction1: side('Flotta Stellare', 1), faction2: side('Other', 1, 'Some Port') },
        { system_address: '1', system_name: 'LP 254-26', last_seen: '2026-10-18T09:00:00Z', type: 'election', status: 'pending', faction1: side('A', 0), faction2: side('B', 0) },
        { system_address: '2', system_name: 'Crowfor', last_seen: '2026-10-18T06:49:34Z', type: 'election', status: 'ended', faction1: side('Flotta Stellare', 4), faction2: side('LP 254-27 Free', 0) },
      ],
    });

    expect([...map.keys()]).toEqual(['lp 254-26', 'crowfor']);
    expect(map.get('lp 254-26')).toEqual({
      updated_at: '2026-10-18T09:00:00Z',
      source: 'server',
      conflicts: [
        { type: 'war', status: 'active', faction1: { name: 'Flotta Stellare', stake: null, days_won: 1 }, faction2: { name: 'Other', stake: 'Some Port', days_won: 1 } },
        { type: 'election', status: 'pending', faction1: { name: 'A', stake: null, days_won: 0 }, faction2: { name: 'B', stake: null, days_won: 0 } },
      ],
    });
  });

  it('copes with an empty answer', () => {
    expect(serverConflictsBySystem({ conflicts: [] }).size).toBe(0);
  });
});

describe('withFreshestConflicts', () => {
  const record = (ebgs: EbgsConflicts | null): BgsSystemRecord =>
    ({ name: 'Misir', controlling_minor_faction: null, x: 0, y: 0, z: 0, ebgs_conflicts: ebgs }) as BgsSystemRecord;
  const fromServer = (updatedAt: string): EbgsConflicts => ({ updated_at: updatedAt, source: 'server', conflicts: [] });
  const fromEliteBgs: EbgsConflicts = { updated_at: '2026-10-10T00:00:00.000Z', conflicts: [] };

  it("takes the server's conflicts when it saw the system later", () => {
    const server = new Map([['misir', fromServer('2026-10-18T00:00:00Z')]]);
    expect(withFreshestConflicts(record(fromEliteBgs), server).ebgs_conflicts?.source).toBe('server');
  });

  it("takes the server's conflicts when EliteBGS has none", () => {
    const server = new Map([['misir', fromServer('2026-10-18T00:00:00Z')]]);
    expect(withFreshestConflicts(record(null), server).ebgs_conflicts?.source).toBe('server');
  });

  it('keeps EliteBGS when its data is newer, and leaves systems the server has not seen alone', () => {
    const original = record(fromEliteBgs);
    expect(withFreshestConflicts(original, new Map([['misir', fromServer('2026-10-01T00:00:00Z')]]))).toBe(original);
    expect(withFreshestConflicts(original, new Map())).toBe(original);
  });
});
