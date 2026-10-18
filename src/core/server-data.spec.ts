import { BgsSystemRecord, EbgsConflicts } from './bgs';
import { ServerSystem, serverDataFrom, withServerData } from './server-data';

const side = (name: string, wonDays: number, stake: string | null = null) => ({ name, stake, won_days: wonDays });

function serverSystem(lastSeen: string, extra: Partial<ServerSystem> = {}): ServerSystem {
  return {
    system_address: '1',
    name: 'Misir',
    last_seen: lastSeen,
    controlling_faction: 'Flotta Stellare',
    factions: [
      { name: 'Flotta Stellare', influence: 0.6, active_states: ['Boom'], pending_states: ['Expansion'], recovering_states: ['War'], government: 'Democracy', allegiance: 'Independent' },
      { name: 'Other', influence: 0.4, active_states: [], pending_states: [], recovering_states: [], government: null, allegiance: null },
    ],
    conflicts: [],
    ...extra,
  };
}

function record(updatedAt: string | null, ebgs: EbgsConflicts | null = null): BgsSystemRecord {
  return {
    name: 'MISIR',
    controlling_minor_faction: 'Other',
    minor_faction_presences: [{ name: 'Other', influence: 1 }],
    x: 0,
    y: 0,
    z: 0,
    updated_at: updatedAt,
    ebgs_conflicts: ebgs,
    population: 1000,
  } as BgsSystemRecord;
}

describe('withServerData', () => {
  it("takes factions, states, control and time from the server when it saw the system after Spansh, keeping Spansh's other data", () => {
    const server = serverDataFrom({ systems: [serverSystem('2026-10-18T09:00:00Z')] });

    const result = withServerData(record('2026-10-17 20:00:00+00'), server);

    expect(result.data_source).toBe('server');
    expect(result.updated_at).toBe('2026-10-18T09:00:00Z');
    expect(result.controlling_minor_faction).toBe('Flotta Stellare');
    expect(result.population).toBe(1000);
    expect(result.minor_faction_presences?.[0]).toEqual({
      name: 'Flotta Stellare',
      influence: 0.6,
      allegiance: 'Independent',
      government: 'Democracy',
      active_states: ['Boom'],
      pending_states: ['Expansion'],
      recovering_states: ['War'],
    });
  });

  it('leaves the states to Spansh when Spansh saw the system later, or the server has no factions', () => {
    expect(withServerData(record('2026-10-18 10:00:00+00'), serverDataFrom({ systems: [serverSystem('2026-10-18T09:00:00Z')] })).data_source).toBeUndefined();
    expect(withServerData(record(null), serverDataFrom({ systems: [serverSystem('2026-10-18T09:00:00Z', { factions: [] })] })).data_source).toBeUndefined();
  });

  it("takes the server's conflict scores when they are newer than EliteBGS's, in the dataset format", () => {
    const server = serverDataFrom({
      systems: [
        serverSystem('2026-10-18T09:00:00Z', {
          conflicts: [{ type: 'election', status: 'ended', faction1: side('Flotta Stellare', 4), faction2: side('Other', 0, 'Some Port') }],
        }),
      ],
    });
    const fromEliteBgs: EbgsConflicts = { updated_at: '2026-10-10T00:00:00.000Z', conflicts: [] };

    expect(withServerData(record(null, fromEliteBgs), server).ebgs_conflicts).toEqual({
      updated_at: '2026-10-18T09:00:00Z',
      source: 'server',
      conflicts: [
        { type: 'election', status: 'ended', faction1: { name: 'Flotta Stellare', stake: null, days_won: 4 }, faction2: { name: 'Other', stake: 'Some Port', days_won: 0 } },
      ],
    });
  });

  it("keeps EliteBGS's scores when they are newer, and leaves systems the server has not seen alone", () => {
    const server = serverDataFrom({
      systems: [serverSystem('2026-10-01T00:00:00Z', { factions: [], conflicts: [{ type: 'war', status: 'active', faction1: side('Flotta Stellare', 1), faction2: side('Other', 0) }] })],
    });
    const fromEliteBgs: EbgsConflicts = { updated_at: '2026-10-10T00:00:00.000Z', conflicts: [] };
    const original = record(null, fromEliteBgs);

    expect(withServerData(original, server)).toBe(original);
    expect(withServerData(original, serverDataFrom({ systems: [] }))).toBe(original);
  });
});
