/**
 * Il lavoro dello Squadrone ricevuto da BGS-Tally, come lo dà il server agli ufficiali
 * (`/v1/work` di acfs-server, solo con il ruolo da ufficiale; roadmap, fase 10). Solo per la pagina
 * "Attività (beta)", in italiano come gli Ordini.
 */

/** Totali di una voce di lavoro, come li somma il server (`work.mjs`): solo le voci diverse da zero. */
export interface WorkTotals {
  bvs?: number;
  cbs?: number;
  /** Influenza delle missioni per la fazione; `infelection` se era in elezione. */
  infprimary?: number;
  infelection?: number;
  infsecondary?: number;
  exploration?: number;
  exobiology?: number;
  scenarios?: number;
  /** Ricerca e soccorso: capsule, scatole nere, ostaggi… consegnati, in un numero solo. */
  sandr?: number;
  tradebm?: number;
  missionfails?: number;
  murdersground?: number;
  murdersspace?: number;
  spacecz_low?: number;
  spacecz_medium?: number;
  spacecz_high?: number;
  groundcz_low?: number;
  groundcz_medium?: number;
  groundcz_high?: number;
  trade_sell_value?: number;
  trade_sell_profit?: number;
  trade_buy_value?: number;
}

/** Un insediamento delle CZ a terra vinte, con quante volte. */
export interface WorkSettlement {
  name: string;
  count: number;
}

/** Missioni chiuse per livello di influenza (numero di "+"): { "3": 1, "5": 3 }. */
export type InfluenceLevels = Record<string, number>;

export interface WorkPilot {
  /** L'etichetta della chiave sul server (di solito il nome del comandante). */
  pilot: string;
  /** Il comandante come lo manda BGS-Tally. */
  cmdr: string | null;
  updated_at: string;
  totals: WorkTotals;
  settlements?: WorkSettlement[];
  inf_levels?: InfluenceLevels;
}

export interface WorkSystem {
  system_address: string;
  system_name: string;
  totals: WorkTotals;
  settlements?: WorkSettlement[];
  inf_levels?: InfluenceLevels;
  pilots: WorkPilot[];
}

export interface WorkTick {
  tickid: string;
  ticktime: string | null;
  systems: WorkSystem[];
}

export interface WorkResponse {
  ticks: WorkTick[];
}

/** Il colore dell'etichetta, come nel riepilogo di BGS-Tally: combattimento, influenza, il resto, contro di noi. */
export type WorkTone = 'combat' | 'influence' | 'other' | 'bad';

/** Una voce del riepilogo: "CBs" e "13,5 M", con l'eventuale dettaglio "(3️⃣×1 5️⃣×3)". */
export interface WorkPart {
  label: string;
  value: string;
  detail?: string;
  tone: WorkTone;
}

const millions = (value: number) =>
  `${(value / 1e6).toLocaleString('it-IT', { maximumFractionDigits: 2 })} M`;
/** "1.000 cr": in italiano il punto delle migliaia di norma manca sotto le 10.000, qui lo si vuole sempre. */
const credits = (value: number) => `${String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} cr`;
const KEYCAPS = ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];
/** "(3️⃣×1 5️⃣×3)": le missioni per livello di influenza, dal più basso. */
const levelsLabel = (levels?: InfluenceLevels) => {
  const entries = Object.entries(levels ?? {})
    .map(([level, count]) => [Number(level), count] as const)
    .filter(([level, count]) => level > 0 && count > 0)
    .sort(([a], [b]) => a - b);
  return entries.length ? `(${entries.map(([level, count]) => `${KEYCAPS[level] ?? level}×${count}`).join(' ')})` : undefined;
};

/**
 * Il lavoro sul modello del riepilogo di BGS-Tally ("CBs 13,5 M", "CZ a terra H×2", "INF +18
 * (3️⃣×1 5️⃣×3)", "INF Elezione +12", "SAR 6", "BVs 10,2 M", "Expl 1,72 M"). I livelli delle
 * missioni vanno con l'influenza; le voci contro di noi (omicidi, missioni fallite) in fondo.
 */
export function describeWork(t: WorkTotals, levels?: InfluenceLevels): WorkPart[] {
  const parts: WorkPart[] = [];
  if (t.cbs) parts.push({ label: 'CBs', value: millions(t.cbs), tone: 'combat' });
  for (const [prefix, label] of [['groundcz', 'CZ a terra'], ['spacecz', 'CZ spaziali']] as const) {
    const counts = (['low', 'medium', 'high'] as const)
      .map(level => [level, t[`${prefix}_${level}`] ?? 0] as const)
      .filter(([, count]) => count > 0)
      .map(([level, count]) => `${level[0].toUpperCase()}×${count}`);
    if (counts.length > 0) parts.push({ label, value: counts.join(' '), tone: 'combat' });
  }
  const levelDetail = levelsLabel(levels);
  if (t.infprimary) parts.push({ label: 'INF', value: `+${t.infprimary}`, detail: levelDetail, tone: 'influence' });
  if (t.infelection) parts.push({ label: 'INF Elezione', value: `+${t.infelection}`, detail: t.infprimary ? undefined : levelDetail, tone: 'influence' });
  if (t.infsecondary) parts.push({ label: 'INF secondaria', value: `+${t.infsecondary}`, tone: 'influence' });
  if (t.bvs) parts.push({ label: 'BVs', value: millions(t.bvs), tone: 'combat' });
  if (t.sandr) parts.push({ label: 'SAR', value: String(t.sandr), tone: 'other' });
  if (t.scenarios) parts.push({ label: 'Scenari', value: String(t.scenarios), tone: 'combat' });
  if (t.exploration) parts.push({ label: 'Expl', value: millions(t.exploration), tone: 'other' });
  if (t.exobiology) parts.push({ label: 'Exo', value: millions(t.exobiology), tone: 'other' });
  if (t.trade_sell_value) {
    parts.push({
      label: 'Vendite',
      value: credits(t.trade_sell_value),
      detail: t.trade_sell_profit ? `(profitto ${credits(t.trade_sell_profit)})` : undefined,
      tone: 'other',
    });
  }
  if (t.trade_buy_value) parts.push({ label: 'Acquisti', value: credits(t.trade_buy_value), tone: 'other' });
  if (t.tradebm) parts.push({ label: 'Mercato nero', value: credits(t.tradebm), tone: 'other' });
  if (t.missionfails) parts.push({ label: '⚠️ Missioni fallite', value: String(t.missionfails), tone: 'bad' });
  if (t.murdersspace || t.murdersground) {
    parts.push({ label: '⚠️ Omicidi', value: String((t.murdersspace ?? 0) + (t.murdersground ?? 0)), tone: 'bad' });
  }
  return parts;
}
