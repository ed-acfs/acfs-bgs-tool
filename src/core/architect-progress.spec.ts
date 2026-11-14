import { architectProgress, progressGroup, weekStart } from './architect-progress';
import type { ArchitectRegistryRow } from './architect-registry';
import { parseArchitectsTsv, parseSheetTimestamp } from './bgs';

const FS = 'Flotta Stellare';
const DAY = 24 * 60 * 60 * 1000;
/** Lunedì 5 ottobre 2026, 00:00 UTC. */
const MON = Date.UTC(2026, 9, 5);

type Row = Parameters<typeof architectProgress>[0][number];
const sys = (systemName: string, extra: Partial<Row> = {}): Row => ({
  systemName,
  architect: null,
  notAColony: false,
  preferredFaction: null,
  preferredFactionRecorded: false,
  ...extra,
});
const ours = (name: string) => sys(name, { architect: 'X', preferredFaction: FS, preferredFactionRecorded: true });
const reg = (systemName: string, at: number | null): ArchitectRegistryRow => ({ systemName, architect: 'X', affiliation: '', preferredFaction: '', at });

describe('avanzamento del Registro Architetti', () => {
  it('legge le date del modulo, anche con i punti nell\'ora', () => {
    expect(parseSheetTimestamp('04/10/2026 23.22.47')).toBe(Date.UTC(2026, 9, 4, 23, 22, 47));
    expect(parseSheetTimestamp('4/10/2026 9:05:00')).toBe(Date.UTC(2026, 9, 4, 9, 5, 0));
    expect(parseSheetTimestamp('')).toBeNull();
    expect(parseSheetTimestamp('31/13/2026')).toBeNull();
    const rows = parseArchitectsTsv('Informazioni cronologiche\tYour Name\tSystem Name\tArchitect Name\tACFS Architect\tPreferred Faction\n05/10/2026 10.00.00\tA\tSol\tB\t\tFlotta Stellare\n');
    expect(rows[0].at).toBe(Date.UTC(2026, 9, 5, 10));
  });

  it('la settimana comincia il lunedì', () => {
    expect(weekStart(MON + 3 * DAY + 5000)).toBe(MON);
    expect(weekStart(MON - 1)).toBe(MON - 7 * DAY);
  });

  it('gruppi: Flotta Stellare, altra fazione, nessuna preferita, non è una colonia', () => {
    expect(progressGroup({ notAColony: false, preferredFaction: FS, preferredFactionRecorded: true }, FS)).toBe('ours');
    expect(progressGroup({ notAColony: false, preferredFaction: 'Y', preferredFactionRecorded: true }, FS)).toBe('other');
    expect(progressGroup({ notAColony: false, preferredFaction: FS, preferredFactionRecorded: false }, FS)).toBe('none');
    expect(progressGroup({ notAColony: true, preferredFaction: null, preferredFactionRecorded: false }, FS)).toBe('notColony');
  });

  it('settimane, mancanti nel tempo, ritmo e fine prevista', () => {
    const now = MON + 21 * DAY + DAY; // martedì della quarta settimana
    const table = [ours('A'), ours('B'), sys('C', { notAColony: true }), ours('D'), sys('E'), sys('F'), sys('G')];
    const registry = [
      reg('A', MON + DAY), reg('A', MON + 10 * DAY), // conta la prima risposta
      reg('B', MON + 2 * DAY),
      reg('C', MON + 8 * DAY),
      reg('D', MON + 22 * DAY + 3600_000), // settimana in corso
      reg('Z', MON), // non è in tabella: non conta
    ];
    const p = architectProgress(table, registry, FS, now + 2 * 3600_000);
    expect(p.total).toBe(7);
    expect(p.recorded).toBe(4);
    expect(p.remaining).toBe(3);
    expect(p.undated).toBe(0);
    expect(p.weeks.map(w => w.total)).toEqual([2, 1, 0, 1]);
    expect(p.weeks[1].counts.notColony).toBe(1);
    expect(p.weeks[3].partial).toBe(true);
    expect(p.burndown.map(b => b.remaining)).toEqual([7, 5, 4, 4, 3]);
    // Tre settimane complete: (2 + 1 + 0) / 3 = 1 a settimana; 3 mancanti → 3 settimane.
    expect(p.recentPerWeek).toBe(1);
    expect(p.recentWeeks).toBe(3);
    expect(p.projectedFinish).toBe(now + 2 * 3600_000 + 3 * 7 * DAY);
    expect(p.neededPerWeek).toBeNull();
  });

  it('registrati senza data, nessun ritmo, scadenza facoltativa', () => {
    const p = architectProgress([ours('A'), sys('B')], [reg('A', null)], FS, MON, MON + 4 * 7 * DAY);
    expect(p.undated).toBe(1);
    expect(p.weeks).toEqual([]);
    expect(p.recentPerWeek).toBeNull();
    expect(p.projectedFinish).toBeNull();
    expect(p.neededPerWeek).toBe(0.25);
  });
});
