/**
 * Link condivisibili (idea dal tool dei Canonn, commit `bdfa799` e `4de5f86` di `upstream`, MIT;
 * riscritta per i nostri filtri). Un link riapre la tabella com'era: ordinamento, "Distanza da",
 * filtri rapidi e righe per pagina; con `system=` apre anche la scheda di un sistema.
 * Nel link vanno solo le scelte diverse da come la tabella si apre, così un link resta corto.
 */

export type ShareSortColumn =
  | 'systemName'
  | 'influence'
  | 'trend'
  | 'margin'
  | 'controllingFaction'
  | 'architect'
  | 'preferredFaction'
  | 'factionCount'
  | 'freshness'
  | 'priority';

const SORT_COLUMNS: readonly ShareSortColumn[] = [
  'systemName', 'influence', 'trend', 'margin', 'controllingFaction', 'architect', 'preferredFaction', 'factionCount', 'freshness', 'priority',
];
const SERVICE_KINDS = ['material-trader', 'technology-broker', 'interstellar-factors'] as const;
export type ShareServiceKind = (typeof SERVICE_KINDS)[number];
const TRADER_KINDS = ['Raw', 'Manufactured', 'Encoded'] as const;
// Come la tabella: 20 è il predefinito e non va nel link; un vecchio link con rows=10 apre con 20.
const PAGE_SIZES = [20, 50, 100];

/** Lo stato della tabella che un link può riaprire. */
export interface ShareView {
  /** Ordinamento per colonna; null se la tabella è ordinata per distanza. */
  sort: { column: ShareSortColumn; direction: 'asc' | 'desc' } | null;
  /** Il sistema da cui si misura la distanza, se è stato scelto (con o senza ordinamento per distanza). */
  distanceFrom: string | null;
  warElection: boolean;
  needsRecon: boolean;
  /** Il filtro Servizi, con i servizi e i tipi di Material Trader scelti; null se spento. */
  services: { kinds: ShareServiceKind[]; traders: string[] } | null;
  architect: { mode: 'none' | 'squadron' } | { mode: 'name'; name: string } | null;
  faction: { mode: 'controlled' } | { mode: 'name'; name: string } | null;
  pageSize: number | null;
  /** Il sistema di cui aprire la scheda. */
  system: string | null;
}

export const DEFAULT_SHARE_VIEW: ShareView = {
  sort: { column: 'priority', direction: 'desc' },
  distanceFrom: null,
  warElection: false,
  needsRecon: false,
  services: null,
  architect: null,
  faction: null,
  pageSize: null,
  system: null,
};

const DEFAULT_SERVICE_KINDS: ShareServiceKind[] = ['material-trader', 'technology-broker'];

const sameSet = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every(x => b.includes(x));

/** I parametri del link per una vista: solo quelli diversi da come la tabella si apre. */
export function shareParams(view: ShareView): URLSearchParams {
  const params = new URLSearchParams();
  if (view.sort === null) {
    params.set('sort', 'distance');
  } else if (view.sort.column !== 'priority' || view.sort.direction !== 'desc') {
    params.set('sort', view.sort.column);
    params.set('dir', view.sort.direction);
  }
  if (view.distanceFrom) {
    params.set('from', view.distanceFrom);
  }
  if (view.warElection) {
    params.set('war', '1');
  }
  if (view.needsRecon) {
    params.set('recon', '1');
  }
  if (view.services) {
    params.set('services', sameSet(view.services.kinds, DEFAULT_SERVICE_KINDS) ? '1' : view.services.kinds.join(','));
    if (!sameSet(view.services.traders, TRADER_KINDS)) {
      params.set('traders', view.services.traders.join(','));
    }
  }
  if (view.architect) {
    params.set('architect', view.architect.mode === 'name' ? `=${view.architect.name}` : view.architect.mode);
  }
  if (view.faction) {
    params.set('faction', view.faction.mode === 'name' ? `=${view.faction.name}` : view.faction.mode);
  }
  if (view.pageSize !== null && view.pageSize !== PAGE_SIZES[0]) {
    params.set('rows', String(view.pageSize));
  }
  if (view.system) {
    params.set('system', view.system);
  }
  return params;
}

/** L'indirizzo completo da copiare: la pagina della tabella con i parametri della vista. */
export function shareUrl(base: string, view: ShareView): string {
  const query = shareParams(view).toString();
  return query ? `${base}?${query}` : base;
}

/**
 * La vista descritta dai parametri di un link, o null se il link non ne porta (indirizzo
 * normale). I valori sconosciuti si ignorano: un link vecchio o modificato a mano apre comunque
 * la tabella, con quello che si riesce a leggere.
 */
export function readShareParams(params: URLSearchParams): ShareView | null {
  const keys = ['sort', 'dir', 'from', 'war', 'recon', 'services', 'traders', 'architect', 'faction', 'rows', 'system'];
  if (!keys.some(key => params.has(key))) {
    return null;
  }
  const view: ShareView = { ...DEFAULT_SHARE_VIEW };
  const sort = params.get('sort');
  if (sort === 'distance') {
    view.sort = null;
  } else if (sort && (SORT_COLUMNS as readonly string[]).includes(sort)) {
    const dir = params.get('dir');
    view.sort = { column: sort as ShareSortColumn, direction: dir === 'asc' || dir === 'desc' ? dir : sort === 'priority' ? 'desc' : 'asc' };
  }
  view.distanceFrom = params.get('from')?.trim() || null;
  if (view.sort === null && !view.distanceFrom) {
    view.sort = DEFAULT_SHARE_VIEW.sort;
  }
  view.warElection = params.get('war') === '1';
  view.needsRecon = params.get('recon') === '1';
  const services = params.get('services');
  if (services) {
    const kinds = services === '1' ? DEFAULT_SERVICE_KINDS : services.split(',').filter((k): k is ShareServiceKind => (SERVICE_KINDS as readonly string[]).includes(k));
    const traders = (params.get('traders') ?? TRADER_KINDS.join(',')).split(',').filter(k => (TRADER_KINDS as readonly string[]).includes(k));
    if (kinds.length > 0) {
      view.services = { kinds: [...kinds], traders: traders.length > 0 ? traders : [...TRADER_KINDS] };
    }
  }
  view.architect = readNameFilter(params.get('architect'), ['none', 'squadron']) as ShareView['architect'];
  view.faction = readNameFilter(params.get('faction'), ['controlled']) as ShareView['faction'];
  const rows = Number(params.get('rows'));
  view.pageSize = PAGE_SIZES.includes(rows) ? rows : null;
  view.system = params.get('system')?.trim() || null;
  return view;
}

/** "=Nome" è un nome; altrimenti uno dei modi previsti; null se vuoto o sconosciuto. */
function readNameFilter(value: string | null, modes: readonly string[]): { mode: string; name?: string } | null {
  if (!value) {
    return null;
  }
  if (value.startsWith('=')) {
    const name = value.slice(1).trim();
    return name ? { mode: 'name', name } : null;
  }
  return modes.includes(value) ? { mode: value } : null;
}
