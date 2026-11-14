/**
 * Chi controlla i "nostri" sistemi (idea dal tool dei Canonn, commit `8f783bc` di `upstream`, MIT;
 * riscritta per una sola fazione). Nostri sono i sistemi colonizzati in cui il Registro Architetti
 * indica Flotta Stellare come fazione preferita, più quelli colonizzati da un membro dello
 * Squadrone senza una fazione preferita indicata. La fazione preferita ricavata dal controllo
 * non conta: altrimenti ogni sistema "nostro" risulterebbe controllato da noi per definizione.
 */
import { AFFILIATION_SQUADRON_MEMBER } from './architect-form';
import type { BgsRow } from './bgs';

/** Una barra del grafico: una fazione (o "tutte le altre") e quanti nostri sistemi controlla. */
export interface ControllerCount {
  /** Nome della fazione; null per la barra che raccoglie tutte le altre, o per i sistemi senza controllo noto. */
  faction: string | null;
  count: number;
  /** Vero per la barra "tutte le altre fazioni". */
  others: boolean;
}

export interface HomeControl {
  /** Quanti sistemi sono nostri secondo la regola qui sopra. */
  total: number;
  /** Di questi, quanti con Flotta Stellare come preferita nel Registro, e quanti solo per l'architetto. */
  byPreference: number;
  byArchitect: number;
  /** Le fazioni che li controllano, dalla più presente; oltre `limit` raccolte in una barra sola. */
  controllers: ControllerCount[];
}

/** Se un sistema è "nostro" e perché: per la fazione preferita nel Registro, per l'architetto, o no. */
export function homeReason(row: BgsRow, faction: string): 'preference' | 'architect' | null {
  if (row.notAColony) {
    return null;
  }
  if (row.preferredFactionRecorded) {
    return row.preferredFaction === faction ? 'preference' : null;
  }
  return row.architectAffiliation === AFFILIATION_SQUADRON_MEMBER ? 'architect' : null;
}

/** Il grafico: chi controlla i nostri sistemi, le prime `limit` fazioni e poi tutte le altre insieme. */
export function homeControl(rows: readonly BgsRow[], faction: string, limit = 10): HomeControl {
  const counts = new Map<string | null, number>();
  let byPreference = 0;
  let byArchitect = 0;
  for (const row of rows) {
    const reason = homeReason(row, faction);
    if (!reason) {
      continue;
    }
    if (reason === 'preference') {
      byPreference++;
    } else {
      byArchitect++;
    }
    counts.set(row.controllingFaction, (counts.get(row.controllingFaction) ?? 0) + 1);
  }
  const sorted = [...counts]
    .map(([name, count]) => ({ faction: name, count, others: false }))
    // La nostra fazione per prima, poi le altre dalla più presente, a pari merito per nome.
    .sort((a, b) =>
      (b.faction === faction ? 1 : 0) - (a.faction === faction ? 1 : 0) ||
      b.count - a.count ||
      (a.faction ?? '').localeCompare(b.faction ?? ''),
    );
  const top = sorted.slice(0, limit);
  const rest = sorted.slice(limit).reduce((sum, c) => sum + c.count, 0);
  return {
    total: byPreference + byArchitect,
    byPreference,
    byArchitect,
    controllers: rest > 0 ? [...top, { faction: null, count: rest, others: true }] : top,
  };
}
