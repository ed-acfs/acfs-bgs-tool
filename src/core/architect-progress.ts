/**
 * Avanzamento del Registro Architetti (idea dal tool dei Canonn, commit `5b9ce63` di `upstream`,
 * MIT; riscritta per noi e **senza scadenza**, decisione dell'utente del 14 novembre 2026: "prima
 * voglio vedere come va"). Quanti sistemi della tabella hanno una risposta nel Registro (architetto,
 * fazione preferita o "non è una colonia"), quanti mancano, quante risposte nuove arrivano a
 * settimana e quando finiremmo al ritmo attuale. Una scadenza si può aggiungere passando `target`.
 */
import type { ArchitectRegistryRow } from './architect-registry';
import type { BgsRow } from './bgs';

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;
/** Settimane complete su cui si calcola il ritmo recente. */
const RECENT_WEEKS = 4;

/** Come si conta un sistema registrato nel grafico settimanale, secondo la sua risposta di oggi. */
export type ProgressGroup = 'ours' | 'other' | 'none' | 'notColony';
export const PROGRESS_GROUPS: readonly ProgressGroup[] = ['ours', 'other', 'none', 'notColony'];

/** Una settimana (da lunedì, UTC) di sistemi registrati per la prima volta. */
export interface ProgressWeek {
  start: number;
  counts: Record<ProgressGroup, number>;
  total: number;
  /** La settimana in corso: il conto non è definitivo. */
  partial: boolean;
}

/** Sistemi ancora senza risposta in un momento. */
export interface ProgressPoint {
  at: number;
  remaining: number;
}

export interface ArchitectProgress {
  /** Sistemi in tabella, registrati e mancanti oggi. */
  total: number;
  recorded: number;
  remaining: number;
  weeks: ProgressWeek[];
  /** I mancanti all'inizio della prima settimana e alla fine di ognuna (l'ultima finisce adesso). */
  burndown: ProgressPoint[];
  /** Registrati senza una data nel Registro (non entrano nel grafico settimanale). */
  undated: number;
  /** Media di sistemi registrati per settimana nelle ultime settimane complete (fino a 4), e quante sono; null se nessuna. */
  recentPerWeek: number | null;
  recentWeeks: number;
  /** Quando finiremmo al ritmo recente; null se non manca niente o il ritmo è zero. */
  projectedFinish: number | null;
  /** Con una scadenza: quanti sistemi a settimana servirebbero per finire in tempo. */
  neededPerWeek: number | null;
}

/** Lunedì 00:00 UTC della settimana di `ms`. */
export function weekStart(ms: number): number {
  const day = Math.floor(ms / DAY_MS);
  // Il 1° gennaio 1970 era un giovedì: (giorno + 3) % 7 è 0 il lunedì.
  return (day - ((day + 3) % 7)) * DAY_MS;
}

/** Il gruppo di un sistema registrato, dalla sua risposta di oggi (l'ultima del Registro). */
export function progressGroup(row: Pick<BgsRow, 'notAColony' | 'preferredFaction' | 'preferredFactionRecorded'>, faction: string): ProgressGroup {
  if (row.notAColony) {
    return 'notColony';
  }
  if (!row.preferredFactionRecorded || !row.preferredFaction) {
    return 'none';
  }
  return row.preferredFaction === faction ? 'ours' : 'other';
}

type TableRow = Pick<BgsRow, 'systemName' | 'architect' | 'notAColony' | 'preferredFaction' | 'preferredFactionRecorded'>;

/** Se il sistema ha una risposta nel Registro: architetto, fazione preferita indicata o "non è una colonia". */
export function isRecorded(row: TableRow): boolean {
  return row.architect !== null || row.notAColony || row.preferredFactionRecorded;
}

/**
 * L'avanzamento. Conta solo i sistemi della tabella (quelli in cui Flotta Stellare è presente);
 * per ognuno la data è quella della **prima** risposta nel Registro, il gruppo quello della risposta
 * di oggi. I mancanti nel passato si ricostruiscono da quelli di oggi più i registrati da allora:
 * un sistema entrato in tabella dopo (una colonia nuova) conta come se ci fosse sempre stato.
 */
export function architectProgress(
  table: readonly TableRow[],
  registry: readonly ArchitectRegistryRow[],
  faction: string,
  now: number,
  target: number | null = null,
): ArchitectProgress {
  const firstAt = new Map<string, number>();
  for (const entry of registry) {
    if (entry.at == null) {
      continue;
    }
    const key = entry.systemName.trim().toLowerCase();
    const seen = firstAt.get(key);
    if (seen === undefined || entry.at < seen) {
      firstAt.set(key, entry.at);
    }
  }

  const dated: { at: number; group: ProgressGroup }[] = [];
  let recorded = 0;
  let undated = 0;
  for (const row of table) {
    if (!isRecorded(row)) {
      continue;
    }
    recorded++;
    const at = firstAt.get(row.systemName.trim().toLowerCase());
    if (at === undefined || at > now) {
      undated++;
    } else {
      dated.push({ at, group: progressGroup(row, faction) });
    }
  }
  const total = table.length;
  const remaining = total - recorded;

  const weeks: ProgressWeek[] = [];
  const burndown: ProgressPoint[] = [];
  if (dated.length > 0) {
    const first = weekStart(Math.min(...dated.map(d => d.at)));
    const current = weekStart(now);
    for (let start = first; start <= current; start += WEEK_MS) {
      const counts: Record<ProgressGroup, number> = { ours: 0, other: 0, none: 0, notColony: 0 };
      for (const d of dated) {
        if (d.at >= start && d.at < start + WEEK_MS) {
          counts[d.group]++;
        }
      }
      const weekTotal = PROGRESS_GROUPS.reduce((sum, g) => sum + counts[g], 0);
      weeks.push({ start, counts, total: weekTotal, partial: start === current });
    }
    burndown.push({ at: first, remaining: remaining + dated.length });
    for (const week of weeks) {
      const end = Math.min(week.start + WEEK_MS, now);
      burndown.push({ at: end, remaining: remaining + dated.filter(d => d.at >= end).length });
    }
  }

  const complete = weeks.filter(w => !w.partial).slice(-RECENT_WEEKS);
  const recentPerWeek = complete.length > 0 ? complete.reduce((sum, w) => sum + w.total, 0) / complete.length : null;
  const projectedFinish = remaining > 0 && recentPerWeek ? now + (remaining / recentPerWeek) * WEEK_MS : null;
  const weeksLeft = target === null ? null : Math.max(0, (target - now) / WEEK_MS);
  const neededPerWeek = weeksLeft === null ? null : remaining === 0 ? 0 : remaining / Math.max(1, weeksLeft);

  return { total, recorded, remaining, weeks, burndown, undated, recentPerWeek, recentWeeks: complete.length, projectedFinish, neededPerWeek };
}
