/**
 * Il Colony Plotter nel tool (fase 13 della roadmap): gli obiettivi di colonizzazione calcolati dal
 * motore (repo acfs-colony-plotter) e serviti dal server dello Squadrone (`/v1/colonisation`, solo
 * membri). Tipi del JSON, etichette in italiano (la pagina è solo in italiano, come Attività), le
 * "ragioni di interesse" da mostrare e i filtri e gli ordinamenti della pagina, puri.
 *
 * Impaginazione sul modello del Colony Finder dei Canonn, preferito dall'utente il 25 ottobre 2026
 * per leggibilità: i fatti in primo piano (tutti i corpi interessanti come nel loro, la biologia
 * specie per specie), il punteggio per scopo solo come filtro ("Adatto a"). Filtri separati per tipo
 * di corpo, biologia e il resto (proposta dell'utente).
 */

export type Purpose = 'refinery' | 'industrial' | 'extraction' | 'agriculture' | 'tourism' | 'hightech';

export const PURPOSES: readonly Purpose[] = ['refinery', 'industrial', 'extraction', 'agriculture', 'tourism', 'hightech'];

export const PURPOSE_LABELS: Readonly<Record<Purpose, string>> = {
  refinery: 'Raffineria',
  industrial: 'Industria',
  extraction: 'Estrazione',
  agriculture: 'Agricoltura',
  tourism: 'Turismo',
  hightech: 'High Tech',
};

/** I tipi di corpo che contano di più, in quest'ordine, prima di tutti gli altri (che seguono A-Z). */
const NOTABLE_SUBTYPES: readonly string[] = [
  'Earth-like world',
  'Water world',
  'Ammonia world',
  'Water giant',
  'Gas giant with water-based life',
  'Gas giant with ammonia-based life',
];

/** I tipi comuni (contati dai Canonn, ma frequenti): etichetta neutra, e non pesano nell'ordinamento. */
const COMMON_SUBTYPE = /^(High metal content world|Rocky body|Metal-rich body|Class [IV]+ gas giant|Helium(-rich)? gas giant)$/;

/** Le voci del filtro "Altro". */
export const OTHER_FILTERS: readonly { key: string; label: string }[] = [
  { key: 'rings', label: 'Anelli' },
  { key: 'hotspots', label: 'Hotspot negli anelli' },
  { key: 'pristine', label: 'Riserva Pristine' },
  { key: 'geology', label: 'Geologia (geyser, fumarole…)' },
  { key: 'multipleStars', label: 'Più stelle' },
  { key: 'manyBodies', label: 'Più di 40 corpi' },
];

export interface ColonisationReason {
  key: string;
  bodies: string[];
}

export interface ColonisationRing {
  body: string;
  subtype: string | null;
  rings: { type: string; reserve: string | null; hotspots: { name: string; count: number }[] }[];
}

/** Un corpo interessante (motore: `bodies.mjs`). */
export interface InterestingBody {
  name: string;
  subtype: string;
  /** Tipo raro o gigante gassoso (criteri dei Canonn); se no, è nella lista per biologia o geologia. */
  rare: boolean;
  terraformable: boolean;
  ringed: boolean;
  biology: { genus: string; species: string }[];
  geology: string[];
  /** Dalla stella d'arrivo, Ls. */
  distance: number | null;
}

export interface FactionShare {
  share: number;
  faction: string | null;
  note?: string;
}

export interface ColonisationSource {
  name: string;
  id64: string;
  distance: number;
  stations: { name: string; type: string }[];
  factions: FactionShare[];
}

export interface ColonisationTarget {
  name: string;
  id64: string;
  x: number;
  y: number;
  z: number;
  /** `free` libero, `claimed` reclamato (in costruzione). */
  status: 'free' | 'claimed';
  bodyCount: number | null;
  stars: string[];
  rings: ColonisationRing[];
  reserve: string | null;
  /** Assente nei dati calcolati prima del 25 ottobre 2026 sera. */
  bodies?: InterestingBody[];
  reasons: ColonisationReason[];
  purposes: Record<Purpose, { score: number; bodies: string[] }>;
  bestPurpose: Purpose | null;
  score: number;
  spanshUpdatedAt: string | null;
  from: ColonisationSource[];
}

export interface ColonisationData {
  generated_at: string;
  faction: string;
  radius_ly: number;
  anchors: { name: string; id64: string; x: number; y: number; z: number; stations: { name: string; type: string }[] }[];
  count: number;
  targets: ColonisationTarget[];
}

export interface Point {
  name: string;
  x: number;
  y: number;
  z: number;
}

export type SortKey = 'interest' | 'distance' | 'search' | 'bodies' | 'name' | 'purpose';
export type SortDirection = 'asc' | 'desc';

/** Il verso naturale di ogni ordinamento: più interesse, più corpi, scopo più adatto prima; distanze brevi e nomi dalla A prima. */
export const NATURAL_DIRECTION: Readonly<Record<SortKey, SortDirection>> = {
  interest: 'desc',
  bodies: 'desc',
  purpose: 'desc',
  distance: 'asc',
  search: 'asc',
  name: 'asc',
};

export interface PlotterFilter {
  includeClaimed: boolean;
  /** Parte del nome di un nostro sistema di partenza. Niente filtro per nome dell'obiettivo (tolto su
   * indicazione dell'utente, 25 ottobre 2026): per ritrovarne uno basta la distanza da quel sistema. */
  from: string;
  minBodies: number;
  /** Un tipo di corpo (sottotipo di Spansh), o '' per tutti. */
  bodyType: string;
  /** Un genere biologico, '*' per qualunque biologia, '' per non filtrare. */
  biology: string;
  /** Una chiave di OTHER_FILTERS, o ''. */
  other: string;
  /** "Adatto a": lo scopo per cui il sistema deve valere qualcosa, o '' per tutti. */
  purpose: Purpose | '';
  sort: SortKey;
  direction: SortDirection;
}

export const DEFAULT_FILTER: PlotterFilter = {
  includeClaimed: false,
  from: '',
  minBodies: 0,
  bodyType: '',
  biology: '',
  other: '',
  purpose: '',
  sort: 'interest',
  direction: 'desc',
};

/** Una ragione di interesse da mostrare: un'etichetta, con il dettaglio nel tooltip. */
export interface InterestTag {
  /** `body` (tipo notevole), `common` (tipo comune), `biology`, `geology`, `rings`, `hotspots`, `stars`, `manyBodies`. */
  kind: string;
  label: string;
  title: string;
}

export function distance(a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

/** "A 5" invece di "Col 285 Sector ZZ-Y d79 A 5"; la stella principale senza lettera resta il nome del sistema. */
export function shortBody(target: Pick<ColonisationTarget, 'name'>, body: string): string {
  return body.startsWith(`${target.name} `) ? body.slice(target.name.length + 1) : body;
}

function subtypeRank(subtype: string): number {
  const notable = NOTABLE_SUBTYPES.indexOf(subtype);
  if (notable >= 0) return notable;
  return COMMON_SUBTYPE.test(subtype) ? 200 : 100;
}

/** "A 6 (Gas giant with water-based life): anelli Metal Rich, Rocky; riserva Pristine; hotspot: Painite". */
export function ringLine(target: Pick<ColonisationTarget, 'name'>, ringed: ColonisationRing): string {
  const reserve = ringed.rings.find(r => r.reserve)?.reserve;
  const hotspots = [...new Set(ringed.rings.flatMap(r => r.hotspots.map(h => h.name)))];
  return `${shortBody(target, ringed.body)}${ringed.subtype ? ` (${ringed.subtype})` : ''}: anelli ${ringed.rings.map(r => r.type).join(', ')}`
    + `${reserve ? `; riserva ${reserve}` : ''}${hotspots.length ? `; hotspot: ${hotspots.join(', ')}` : ''}`;
}

/** "A 6 d (Rocky body, terraformabile): Tussock Cultro, Bacterium Acies; Water Ice Geyser". */
export function bodyLine(target: Pick<ColonisationTarget, 'name'>, body: InterestingBody): string {
  const traits = [body.subtype, body.terraformable ? 'terraformabile' : '', body.ringed ? 'con anelli' : ''].filter(Boolean).join(', ');
  const found = [...body.biology.map(b => b.species), ...body.geology];
  return `${shortBody(target, body.name)} (${traits})${found.length ? `: ${found.join(', ')}` : ''}`;
}

/**
 * I corpi interessanti per la scheda del sistema: uno per riga i corpi notevoli e quelli con
 * biologia o geologia, poi una riga per ogni tipo comune ("Rocky body ×22: A 1 a, A 1 b, …").
 */
export function bodyDetailLines(target: ColonisationTarget): string[] {
  const bodies = target.bodies ?? [];
  const isCommonPlain = (b: InterestingBody) => COMMON_SUBTYPE.test(b.subtype) && !b.biology.length && !b.geology.length;
  const single = bodies
    .filter(b => !isCommonPlain(b))
    .sort((a, b) => subtypeRank(a.subtype) - subtypeRank(b.subtype) || a.name.localeCompare(b.name, undefined, { numeric: true }))
    .map(b => bodyLine(target, b));
  const common = new Map<string, InterestingBody[]>();
  for (const body of bodies.filter(isCommonPlain)) {
    common.set(body.subtype, [...(common.get(body.subtype) ?? []), body]);
  }
  const grouped = [...common.entries()].map(([subtype, group]) => {
    const ringed = group.filter(b => b.ringed).length;
    const terraformable = group.filter(b => b.terraformable).length;
    const notes = [ringed ? `${ringed} con anelli` : '', terraformable ? `${terraformable} terraformabili` : ''].filter(Boolean).join(', ');
    return `${subtype} ×${group.length}${notes ? ` (${notes})` : ''}: ${group.map(b => shortBody(target, b.name)).join(', ')}`;
  });
  return [...single, ...grouped];
}

/**
 * Le ragioni di interesse, nell'ordine: i tipi di corpo, uno per tipo ("A 2 Water world", o
 * "High metal content world ×3" con i nomi nel tooltip), i più notevoli prima e quelli comuni in
 * fondo; la biologia, una per corpo con le specie; la geologia in una sola etichetta; anelli e
 * hotspot; più stelle e più di 40 corpi.
 */
export function interestTags(target: ColonisationTarget): InterestTag[] {
  const tags: InterestTag[] = [];
  const bodies = target.bodies ?? [];
  const bySubtype = new Map<string, InterestingBody[]>();
  for (const body of bodies.filter(b => b.rare)) {
    bySubtype.set(body.subtype, [...(bySubtype.get(body.subtype) ?? []), body]);
  }
  const subtypes = [...bySubtype.keys()].sort((a, b) => subtypeRank(a) - subtypeRank(b) || a.localeCompare(b));
  for (const subtype of subtypes) {
    const group = bySubtype.get(subtype)!;
    const terraformable = group.filter(b => b.terraformable).length;
    tags.push({
      kind: COMMON_SUBTYPE.test(subtype) ? 'common' : 'body',
      label: group.length === 1 ? `${shortBody(target, group[0].name)} ${subtype}` : `${subtype} ×${group.length}`,
      title: group.map(b => bodyLine(target, b)).join('\n') + (terraformable ? `\n${terraformable} terraformabili` : ''),
    });
  }
  for (const body of bodies.filter(b => b.biology.length)) {
    tags.push({
      kind: 'biology',
      label: `${shortBody(target, body.name)}: ${body.biology.map(b => b.species).join(', ')}`,
      title: bodyLine(target, body),
    });
  }
  const geological = bodies.filter(b => b.geology.length);
  if (geological.length) {
    tags.push({
      kind: 'geology',
      label: `Geologia: ${geological.map(b => shortBody(target, b.name)).join(', ')}`,
      title: geological.map(b => `${shortBody(target, b.name)}: ${b.geology.join(', ')}`).join('\n'),
    });
  }
  if (target.rings.length) {
    const count = target.rings.length;
    tags.push({
      kind: 'rings',
      label: `${count} ${count === 1 ? 'corpo' : 'corpi'} con anelli${target.reserve ? `, ${target.reserve}` : ''}`,
      title: target.rings.map(r => ringLine(target, r)).join('\n'),
    });
    const hotspots = [...new Set(target.rings.flatMap(r => r.rings.flatMap(x => x.hotspots.map(h => h.name))))];
    if (hotspots.length) {
      tags.push({ kind: 'hotspots', label: `Hotspot: ${hotspots.join(', ')}`, title: 'Hotspot di estrazione negli anelli' });
    }
  }
  if (target.stars.length >= 2) {
    tags.push({ kind: 'stars', label: `${target.stars.length} stelle`, title: `Stelle: ${target.stars.join(', ')}` });
  }
  if ((target.bodyCount ?? 0) > 40) {
    tags.push({ kind: 'manyBodies', label: `${target.bodyCount} corpi`, title: 'Più di 40 corpi' });
  }
  return tags;
}

/** Quante ragioni di interesse "vere" (senza i tipi comuni): l'ordinamento di partenza. */
export function interestCount(target: ColonisationTarget): number {
  return interestTags(target).filter(t => t.kind !== 'common').length;
}

/** Le voci del filtro "Tipo di corpo": i tipi presenti negli obiettivi, pianeti e stelle, i notevoli prima. */
export function bodyTypeOptions(targets: readonly ColonisationTarget[]): { planets: string[]; stars: string[] } {
  const all = new Set(targets.flatMap(t => (t.bodies ?? []).filter(b => b.rare).map(b => b.subtype)));
  const sorted = [...all].sort((a, b) => subtypeRank(a) - subtypeRank(b) || a.localeCompare(b));
  const isStar = (s: string) => /Star$|Black Hole/.test(s);
  return { planets: sorted.filter(s => !isStar(s)), stars: sorted.filter(isStar) };
}

/** Le voci del filtro "Biologia": i generi presenti, A-Z. */
export function biologyOptions(targets: readonly ColonisationTarget[]): string[] {
  return [...new Set(targets.flatMap(t => (t.bodies ?? []).flatMap(b => b.biology.map(x => x.genus))))].sort((a, b) => a.localeCompare(b));
}

function matchesOther(target: ColonisationTarget, key: string): boolean {
  switch (key) {
    case 'rings':
      return target.rings.length > 0;
    case 'hotspots':
      return target.rings.some(r => r.rings.some(x => x.hotspots.length > 0));
    case 'pristine':
      return target.reserve === 'Pristine';
    case 'geology':
      return (target.bodies ?? []).some(b => b.geology.length > 0);
    case 'multipleStars':
      return target.stars.length >= 2;
    case 'manyBodies':
      return (target.bodyCount ?? 0) > 40;
    default:
      return true;
  }
}

/**
 * Gli obiettivi che passano i filtri, nell'ordine scelto. `search`: il sistema da cui misurare la
 * distanza (box "Distanza da"), se c'è.
 */
export function filterTargets(targets: readonly ColonisationTarget[], filter: PlotterFilter, search: Point | null = null): ColonisationTarget[] {
  const from = filter.from.trim().toLowerCase();
  const list = targets
    .filter(t => filter.includeClaimed || t.status === 'free')
    .filter(t => !from || t.from.some(f => f.name.toLowerCase().includes(from)))
    .filter(t => (t.bodyCount ?? 0) >= filter.minBodies)
    .filter(t => !filter.bodyType || (t.bodies ?? []).some(b => b.subtype === filter.bodyType))
    .filter(t => !filter.biology || (t.bodies ?? []).some(b => b.biology.some(x => filter.biology === '*' || x.genus === filter.biology)))
    .filter(t => !filter.other || matchesOther(t, filter.other))
    .filter(t => !filter.purpose || (t.purposes[filter.purpose]?.score ?? 0) > 0);
  const byName = (a: ColonisationTarget, b: ColonisationTarget) => a.name.localeCompare(b.name);
  const nearest = (a: ColonisationTarget, b: ColonisationTarget) => a.from[0].distance - b.from[0].distance;
  const compare: Record<SortKey, (a: ColonisationTarget, b: ColonisationTarget) => number> = {
    interest: (a, b) => interestCount(b) - interestCount(a) || (b.bodyCount ?? 0) - (a.bodyCount ?? 0) || byName(a, b),
    distance: (a, b) => nearest(a, b) || byName(a, b),
    search: (a, b) => (search ? distance(search, a) - distance(search, b) : 0) || byName(a, b),
    bodies: (a, b) => (b.bodyCount ?? 0) - (a.bodyCount ?? 0) || byName(a, b),
    name: byName,
    purpose: (a, b) =>
      (filter.purpose ? (b.purposes[filter.purpose]?.score ?? 0) - (a.purposes[filter.purpose]?.score ?? 0) : b.score - a.score) || nearest(a, b),
  };
  const key: SortKey = filter.sort === 'search' && !search ? 'interest' : filter.sort;
  // I comparatori danno il verso naturale; l'altro verso li rovescia.
  const flip = filter.direction === NATURAL_DIRECTION[key] ? 1 : -1;
  return list.sort((a, b) => flip * compare[key](a, b));
}

/**
 * Il primo porto consigliato (regola dell'utente del 22 novembre 2026): di base un **Outpost**, il
 * più veloce da costruire, che blocca presto il sistema per lo Squadrone (ed è obbligatorio nei
 * ponti); unica eccezione una **Coriolis** davanti a un Water world o a un Earth-like world, che
 * le passano le loro economie (Agriculture e Tourism; l'Earth-like anche High Tech e Military).
 * La posizione del porto primario la fissa il gioco (la bandierina nella mappa del sistema) e
 * Spansh non la dà: l'eccezione vale solo se il porto è in orbita su uno di quei corpi.
 */
export interface FirstPortAdvice {
  port: 'outpost' | 'coriolis';
  /** Water world ed Earth-like del sistema, dal più vicino alla stella d'arrivo; vuoto per l'Outpost. */
  bodies: InterestingBody[];
  /** Lo scopo più adatto per le costruzioni successive, se c'è. */
  next: { purpose: Purpose; label: string; bodies: string[] } | null;
}

const CORIOLIS_SUBTYPES = new Set(['Water world', 'Earth-like world']);

export function firstPortAdvice(target: ColonisationTarget): FirstPortAdvice {
  const bodies = (target.bodies ?? [])
    .filter(b => CORIOLIS_SUBTYPES.has(b.subtype))
    .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
  const best = target.bestPurpose;
  return {
    port: bodies.length ? 'coriolis' : 'outpost',
    bodies,
    next: best ? { purpose: best, label: PURPOSE_LABELS[best], bodies: target.purposes[best]?.bodies ?? [] } : null,
  };
}

/** "LTT 1 a (Water world, 1.234 Ls)": un corpo per il consiglio sul primo porto. */
export function portBodyLine(target: Pick<ColonisationTarget, 'name'>, body: InterestingBody): string {
  const ls = body.distance === null ? '' : `, ${Math.round(body.distance).toLocaleString('it-IT')} Ls`;
  return `${shortBody(target, body.name)} (${body.subtype}${ls})`;
}

/** Gli scopi per cui il sistema vale qualcosa, dal più adatto: per la scheda del sistema. */
export function purposesOf(target: ColonisationTarget): { purpose: Purpose; label: string; score: number }[] {
  return PURPOSES.filter(p => (target.purposes[p]?.score ?? 0) > 0)
    .map(p => ({ purpose: p, label: PURPOSE_LABELS[p], score: target.purposes[p].score }))
    .sort((a, b) => b.score - a.score);
}

/** "60% Flotta Stellare · 20% Civitas Dei · 13% non nota · 6% Anarchy vicina": le fazioni del sistema nuovo. */
export function describeShares(shares: readonly FactionShare[]): string {
  return shares.map(s => `${s.share}% ${s.faction ?? (s.note === 'anarchy' ? 'Anarchy vicina' : 'non nota')}`).join(' · ');
}

export const links = {
  inara: (name: string) => `https://inara.cz/elite/starsystem/?search=${encodeURIComponent(name)}`,
  raven: (name: string) => `https://ravencolonial.com/#sys=${encodeURIComponent(name)}`,
  signals: (name: string) => `https://signals.canonn.tech/?system=${encodeURIComponent(name)}`,
  spansh: (id64: string) => `https://spansh.co.uk/system/${id64}`,
};

/**
 * Un indicatore compatto della riga (riordino del 20 novembre 2026, richiesta dell'utente: la lista
 * di etichette era "confusionaria, molto tabellare"): pochi segni con un numero, il dettaglio nel
 * tooltip e nella scheda del sistema.
 */
export interface Highlight {
  kind: 'body' | 'rare' | 'biology' | 'geology' | 'rings' | 'hotspots' | 'stars';
  label: string;
  title: string;
}

/** Quanti tipi di corpo notevoli mostrare per nome; gli altri corpi rari vanno in "+N rari". */
const NOTABLE_SHOWN = 2;

/**
 * Gli indicatori di un obiettivo, nell'ordine: i tipi di corpo notevoli (Earth-like, Water world,
 * Ammonia world, giganti con vita…, al massimo due, con il numero), gli altri corpi rari in uno solo,
 * le specie biologiche, la geologia, gli anelli (con la riserva se Pristine), gli hotspot, le stelle.
 */
export function highlights(target: ColonisationTarget): Highlight[] {
  const result: Highlight[] = [];
  const bodies = target.bodies ?? [];
  const rare = bodies.filter(b => b.rare && !COMMON_SUBTYPE.test(b.subtype));
  const notable = new Map<string, InterestingBody[]>();
  for (const b of rare.filter(b => NOTABLE_SUBTYPES.includes(b.subtype))) {
    notable.set(b.subtype, [...(notable.get(b.subtype) ?? []), b]);
  }
  const shown = [...notable.keys()].sort((a, b) => subtypeRank(a) - subtypeRank(b)).slice(0, NOTABLE_SHOWN);
  for (const subtype of shown) {
    const group = notable.get(subtype)!;
    result.push({
      kind: 'body',
      label: group.length > 1 ? `${group.length} ${subtype}` : subtype,
      title: group.map(b => bodyLine(target, b)).join('\n'),
    });
  }
  const others = rare.filter(b => !shown.includes(b.subtype));
  if (others.length) {
    result.push({
      kind: 'rare',
      label: `+${others.length} ${others.length === 1 ? 'raro' : 'rari'}`,
      title: others.map(b => bodyLine(target, b)).join('\n'),
    });
  }
  const species = new Set(bodies.flatMap(b => b.biology.map(x => x.species)));
  if (species.size) {
    result.push({
      kind: 'biology',
      label: `${species.size} specie`,
      title: bodies.filter(b => b.biology.length).map(b => bodyLine(target, b)).join('\n'),
    });
  }
  const geological = bodies.filter(b => b.geology.length);
  if (geological.length) {
    result.push({
      kind: 'geology',
      label: `Geologia ×${geological.length}`,
      title: geological.map(b => `${shortBody(target, b.name)}: ${b.geology.join(', ')}`).join('\n'),
    });
  }
  if (target.rings.length) {
    result.push({
      kind: 'rings',
      label: `Anelli ×${target.rings.length}${target.reserve === 'Pristine' ? ' · Pristine' : ''}`,
      title: target.rings.map(r => ringLine(target, r)).join('\n') + (target.reserve ? `\nRiserva: ${target.reserve}` : ''),
    });
    const hotspots = [...new Set(target.rings.flatMap(r => r.rings.flatMap(x => x.hotspots.map(h => h.name))))];
    if (hotspots.length) {
      result.push({ kind: 'hotspots', label: `Hotspot ×${hotspots.length}`, title: `Hotspot: ${hotspots.join(', ')}` });
    }
  }
  if (target.stars.length >= 2) {
    result.push({ kind: 'stars', label: `${target.stars.length} stelle`, title: `Stelle: ${target.stars.join(', ')}` });
  }
  return result;
}

/** Le tessere in cima alla pagina: quanti obiettivi liberi, con biologia, con anelli Pristine, con hotspot. */
export interface PlotterSummary {
  free: number;
  claimed: number;
  biology: number;
  pristine: number;
  hotspots: number;
}

export function plotterSummary(targets: readonly ColonisationTarget[]): PlotterSummary {
  const free = targets.filter(t => t.status === 'free');
  return {
    free: free.length,
    claimed: targets.length - free.length,
    biology: free.filter(t => (t.bodies ?? []).some(b => b.biology.length)).length,
    pristine: free.filter(t => t.reserve === 'Pristine').length,
    hotspots: free.filter(t => matchesOther(t, 'hotspots')).length,
  };
}

/** Il nostro sistema di partenza più vicino a un punto: la partenza proposta per un Ponte. */
export function nearestAnchor<T extends { x: number; y: number; z: number }>(anchors: readonly T[], point: { x: number; y: number; z: number }): T | null {
  let best: T | null = null;
  let bestDistance = Infinity;
  for (const anchor of anchors) {
    const d = distance(anchor, point);
    if (d < bestDistance) {
      best = anchor;
      bestDistance = d;
    }
  }
  return best;
}

/** Lo stato di una tappa del Ponte, come lo dà il server (`/v1/bridge`). */
export type BridgeStepState = 'ours' | 'colonised' | 'building' | 'free' | 'unknown';

export interface BridgeStep {
  name: string;
  id64: string;
  x: number;
  y: number;
  z: number;
  jump_ly: number;
  remaining_ly: number;
  bodies: number | null;
  state: BridgeStepState;
  controlling_faction: string | null;
  population: number | null;
}

export interface BridgeResult {
  status: 'queued' | 'ok';
  job: string;
  from: string;
  to: string;
  incomplete?: boolean;
  reason?: string | null;
  computed_at?: string;
  steps?: BridgeStep[];
}

export const BRIDGE_STATE_LABELS: Readonly<Record<BridgeStepState, string>> = {
  ours: 'nostro',
  colonised: 'già colonizzato',
  building: 'in costruzione',
  free: 'da colonizzare',
  unknown: 'stato non noto',
};

/** Quante tappe restano da colonizzare (le libere, e quelle di cui Spansh non sa niente). */
export function stepsToBuild(steps: readonly BridgeStep[]): number {
  return steps.filter(s => s.state === 'free' || s.state === 'unknown').length;
}

/** La rotta da copiare: un sistema per riga, dalla partenza all'arrivo. */
export function bridgeText(steps: readonly BridgeStep[]): string {
  return steps.map(s => s.name).join('\n');
}
