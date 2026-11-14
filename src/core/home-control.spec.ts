import { AFFILIATION_NOT_MEMBER, AFFILIATION_SQUADRON_MEMBER } from './architect-form';
import type { BgsRow } from './bgs';
import { homeControl, homeReason } from './home-control';

const FS = 'Flotta Stellare';

/** Solo i campi che il calcolo legge. */
function row(controllingFaction: string | null, extra: Partial<BgsRow> = {}): BgsRow {
  return {
    controllingFaction,
    notAColony: false,
    preferredFaction: FS,
    preferredFactionRecorded: true,
    architectAffiliation: AFFILIATION_NOT_MEMBER,
    ...extra,
  } as BgsRow;
}

describe('chi controlla i nostri sistemi', () => {
  it('nostro: preferita Flotta Stellare nel Registro, o architetto dello Squadrone senza preferita', () => {
    expect(homeReason(row('X'), FS)).toBe('preference');
    expect(homeReason(row('X', { preferredFaction: 'Altri' }), FS)).toBeNull();
    // Preferita solo ricavata dal controllo: non conta, conta l'architetto.
    const derived = { preferredFactionRecorded: false, preferredFaction: FS };
    expect(homeReason(row(FS, derived), FS)).toBeNull();
    expect(homeReason(row(FS, { ...derived, architectAffiliation: AFFILIATION_SQUADRON_MEMBER }), FS)).toBe('architect');
    // Un membro che ha indicato un'altra fazione: non è nostro.
    expect(homeReason(row('X', { preferredFaction: 'Altri', architectAffiliation: AFFILIATION_SQUADRON_MEMBER }), FS)).toBeNull();
    expect(homeReason(row(FS, { notAColony: true }), FS)).toBeNull();
  });

  it('conta i controllori, con la nostra fazione per prima e le altre dalla più presente', () => {
    const rows = [row('B'), row('A'), row('B'), row(FS), row(null), row('A', { preferredFaction: 'Altri' })];
    const result = homeControl(rows, FS);
    expect(result.total).toBe(5);
    expect(result.byPreference).toBe(5);
    expect(result.controllers).toEqual([
      { faction: FS, count: 1, others: false },
      { faction: 'B', count: 2, others: false },
      { faction: null, count: 1, others: false },
      { faction: 'A', count: 1, others: false },
    ]);
  });

  it('oltre il limite le fazioni finiscono in "tutte le altre"', () => {
    const rows = ['A', 'A', 'B', 'C', 'D'].map(f => row(f));
    const result = homeControl(rows, FS, 2);
    expect(result.controllers).toEqual([
      { faction: 'A', count: 2, others: false },
      { faction: 'B', count: 1, others: false },
      { faction: null, count: 2, others: true },
    ]);
  });
});
