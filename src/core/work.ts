/**
 * Il lavoro dello squadrone ricevuto da BGS-Tally, come lo dà il server agli ufficiali
 * (`/v1/work` di acfs-server, dietro password; roadmap, fase 10). Solo per la pagina
 * "Attività (beta)", in italiano come gli Ordini.
 */

/** Totali di una voce di lavoro, come li somma il server (`work.mjs`): solo le voci diverse da zero. */
export interface WorkTotals {
  bvs?: number;
  cbs?: number;
  infprimary?: number;
  infsecondary?: number;
  exploration?: number;
  exobiology?: number;
  scenarios?: number;
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

export interface WorkPilot {
  /** L'etichetta della chiave sul server (di solito il nome del comandante). */
  pilot: string;
  /** Il comandante come lo manda BGS-Tally. */
  cmdr: string | null;
  updated_at: string;
  totals: WorkTotals;
}

export interface WorkSystem {
  system_address: string;
  system_name: string;
  totals: WorkTotals;
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

const millions = (value: number) =>
  `${(value / 1e6).toLocaleString('it-IT', { maximumFractionDigits: 2 })} M`;
/** "1.000 cr": in italiano il punto delle migliaia di norma manca sotto le 10.000, qui lo si vuole sempre. */
const credits = (value: number) => `${String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} cr`;

/**
 * Il lavoro in poche parole, con le sigle che lo squadrone usa nel canale ("BVs 8,04 M · CBs
 * 13,08 M · Inf +5 · CZ spaziali M×1 H×3"). Le voci contro di noi (omicidi, missioni fallite) vanno in fondo.
 */
export function describeWork(t: WorkTotals): string[] {
  const parts: string[] = [];
  if (t.bvs) parts.push(`BVs ${millions(t.bvs)}`);
  if (t.cbs) parts.push(`CBs ${millions(t.cbs)}`);
  if (t.infprimary) parts.push(`Inf +${t.infprimary}`);
  if (t.infsecondary) parts.push(`Inf secondaria +${t.infsecondary}`);
  for (const [prefix, label] of [['spacecz', 'CZ spaziali'], ['groundcz', 'CZ a terra']] as const) {
    const levels = (['low', 'medium', 'high'] as const)
      .map(level => [level, t[`${prefix}_${level}`] ?? 0] as const)
      .filter(([, count]) => count > 0)
      .map(([level, count]) => `${level[0].toUpperCase()}×${count}`);
    if (levels.length > 0) parts.push(`${label} ${levels.join(' ')}`);
  }
  if (t.scenarios) parts.push(`Scenari ${t.scenarios}`);
  if (t.exploration) parts.push(`Espl ${millions(t.exploration)}`);
  if (t.exobiology) parts.push(`Exo ${millions(t.exobiology)}`);
  if (t.trade_sell_value) {
    parts.push(`Vendite ${credits(t.trade_sell_value)}${t.trade_sell_profit ? ` (profitto ${credits(t.trade_sell_profit)})` : ''}`);
  }
  if (t.trade_buy_value) parts.push(`Acquisti ${credits(t.trade_buy_value)}`);
  if (t.tradebm) parts.push(`Mercato nero ${credits(t.tradebm)}`);
  if (t.missionfails) parts.push(`⚠️ Missioni fallite ${t.missionfails}`);
  if (t.murdersspace || t.murdersground) parts.push(`⚠️ Omicidi ${(t.murdersspace ?? 0) + (t.murdersground ?? 0)}`);
  return parts;
}
