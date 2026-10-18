/**
 * Il lavoro dello Squadrone ricevuto da BGS-Tally, come lo dà il server agli ufficiali
 * (`/v1/work` di acfs-server, solo con il ruolo da ufficiale; roadmap, fase 10). Solo per la pagina
 * "Attività (beta)", in italiano come gli Ordini.
 */

/** Totali di una voce di lavoro, come li somma il server (`work.mjs`): solo le voci diverse da zero. */
export interface WorkTotals {
  bvs?: number;
  cbs?: number;
  /** Influenza delle missioni per la fazione; `infelection` se era in elezione, `infwar` se in guerra. */
  infprimary?: number;
  infelection?: number;
  infwar?: number;
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

/**
 * Il colore dell'etichetta, come nel riepilogo di BGS-Tally (`formatters/default.py`): INF blu;
 * BVs, CBs, CZ e uccisioni rossi; commercio azzurro; esplorazione e SAR bianchi; scenari gialli;
 * missioni fallite magenta. I valori sono sempre verdi.
 */
export type WorkTone = 'blue' | 'red' | 'cyan' | 'white' | 'yellow' | 'magenta';

/** Un pezzo di valore: come in BGS-Tally, solo i numeri sono evidenziati (verdi), il resto ("H x") è testo normale. */
export interface WorkSegment {
  text: string;
  number?: boolean;
}

/** Una voce del riepilogo: "CBs" e "13,5M", con l'eventuale dettaglio "(3️⃣ x 1 5️⃣ x 3)". */
export interface WorkPart {
  label: string;
  value: WorkSegment[];
  detail?: WorkSegment[];
  tone: WorkTone;
}

const num = (text: string | number): WorkSegment => ({ text: String(text), number: true });
const txt = (text: string): WorkSegment => ({ text });

/** Il testo di una voce, senza colori: per i test e per chi lo copia. */
export function workPartText(part: WorkPart): string {
  const join = (segments?: WorkSegment[]) => (segments ?? []).map(s => s.text).join('');
  return [part.label, join(part.value), join(part.detail)].filter(Boolean).join(' ');
}

/** Come `human_format` di BGS-Tally: tre cifre significative e K, M, B ("13,5M", "1,72M", "850K"). */
export function humanFormat(value: number): string {
  let n = Number(value.toPrecision(3));
  let magnitude = 0;
  while (Math.abs(n) >= 1000 && magnitude < 4) {
    magnitude += 1;
    n /= 1000;
  }
  return `${n.toLocaleString('it-IT', { maximumFractionDigits: 2 })}${['', 'K', 'M', 'B', 'T'][magnitude]}`;
}

const KEYCAPS = ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];
/** "(3️⃣ x 1 5️⃣ x 3)": le missioni per livello di influenza, dal più basso, come in BGS-Tally. */
const levelsLabel = (levels?: InfluenceLevels): WorkSegment[] | undefined => {
  const entries = Object.entries(levels ?? {})
    .map(([level, count]) => [Number(level), count] as const)
    .filter(([level, count]) => level > 0 && count > 0)
    .sort(([a], [b]) => a - b);
  if (!entries.length) {
    return undefined;
  }
  const segments: WorkSegment[] = [txt('(')];
  entries.forEach(([level, count], i) => segments.push(txt(`${i ? ' ' : ''}${KEYCAPS[level] ?? level} x `), num(count)));
  segments.push(txt(')'));
  return segments;
};

/**
 * Il lavoro come lo scrive BGS-Tally nel suo riepilogo, nello stesso ordine e con le sigle della
 * sua traduzione italiana: INF (o INF Elezione, INF War) con le missioni per livello, BVs, CBs,
 * commercio, Expl, uccisioni, scenari, missioni fallite, CZ Spaziali, CZ a terra, SAR.
 */
export function describeWork(t: WorkTotals, levels?: InfluenceLevels): WorkPart[] {
  const parts: WorkPart[] = [];
  const levelDetail = levelsLabel(levels);
  let levelsShown = false;
  for (const [key, label] of [['infprimary', 'INF'], ['infelection', 'INF Elezione'], ['infwar', 'INF War']] as const) {
    const value = t[key];
    if (value) {
      parts.push({ label, value: [num(`${value > 0 ? '+' : ''}${value}`)], detail: levelsShown ? undefined : levelDetail, tone: 'blue' });
      levelsShown = true;
    }
  }
  if (t.infsecondary) parts.push({ label: 'INF secondaria', value: [num(`+${t.infsecondary}`)], tone: 'blue' });
  if (t.bvs) parts.push({ label: 'BVs', value: [num(humanFormat(t.bvs))], tone: 'red' });
  if (t.cbs) parts.push({ label: 'CBs', value: [num(humanFormat(t.cbs))], tone: 'red' });
  if (t.trade_buy_value) parts.push({ label: 'ComAcq', value: [num(humanFormat(t.trade_buy_value))], tone: 'cyan' });
  if (t.trade_sell_profit) parts.push({ label: 'ComProfit', value: [num(humanFormat(t.trade_sell_profit))], tone: 'cyan' });
  if (t.tradebm) parts.push({ label: 'ComBMProfit', value: [num(humanFormat(t.tradebm))], tone: 'cyan' });
  if (t.exploration) parts.push({ label: 'Expl', value: [num(humanFormat(t.exploration))], tone: 'white' });
  if (t.exobiology) parts.push({ label: 'Exo', value: [num(humanFormat(t.exobiology))], tone: 'white' });
  if (t.murdersspace) parts.push({ label: 'Uccisioni', value: [num(t.murdersspace)], tone: 'red' });
  if (t.murdersground) parts.push({ label: 'Uccisioni a Terra', value: [num(t.murdersground)], tone: 'red' });
  if (t.scenarios) parts.push({ label: 'Scenari', value: [num(t.scenarios)], tone: 'yellow' });
  if (t.missionfails) parts.push({ label: 'Fallite', value: [num(t.missionfails)], tone: 'magenta' });
  for (const [prefix, label] of [['spacecz', 'CZ Spaziali'], ['groundcz', 'CZ a terra']] as const) {
    const counts = (['low', 'medium', 'high'] as const)
      .map(level => [level, t[`${prefix}_${level}`] ?? 0] as const)
      .filter(([, count]) => count > 0)
      .flatMap(([level, count], i) => [txt(`${i ? ' ' : ''}${level[0].toUpperCase()} x `), num(count)]);
    if (counts.length > 0) parts.push({ label, value: counts, tone: 'red' });
  }
  if (t.sandr) parts.push({ label: 'SAR', value: [num(t.sandr)], tone: 'white' });
  return parts;
}
