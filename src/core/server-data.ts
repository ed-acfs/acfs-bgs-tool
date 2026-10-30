/**
 * Data from the squadron's own server (`acfs-server`, fed live by EDDN; see the roadmap, phase
 * 10). The app reads `/v1/systems` at load time and, system by system, keeps whichever source saw
 * the system last: the server, or the dataset (Spansh for factions and states, EliteBGS for scores).
 */
import { parseUpdatedAt } from './freshness';
import { BgsSystemRecord, EbgsConflicts, MinorFactionPresence } from './bgs';

/** One side of a conflict as the server sends it: our faction is always `faction1` when involved. */
export interface ServerConflictSide {
  name: string | null;
  stake: string | null;
  won_days: number | null;
}

/** A conflict as the server sends it. */
export interface ServerConflict {
  /** "war", "civilwar" or "election". */
  type: string | null;
  /** "pending", "active" or "ended" (finished, with its final score). */
  status: string;
  /** Whether our faction is one of the sides (then it is `faction1`). */
  involves_us?: boolean;
  faction1: ServerConflictSide;
  faction2: ServerConflictSide;
}

/** A faction in a system as the server sends it. */
export interface ServerFaction {
  name: string;
  /** 0-1, like Spansh's. */
  influence: number | null;
  active_states: string[];
  pending_states: string[];
  recovering_states: string[];
  government: string | null;
  allegiance: string | null;
}

/** One entry of the server's `/v1/systems`: the latest observation of the system. */
export interface ServerSystem {
  system_address: string;
  name: string;
  /** ISO 8601 game time of the latest observation. */
  last_seen: string;
  controlling_faction: string | null;
  factions: ServerFaction[];
  conflicts: ServerConflict[];
}

export interface ServerSystemsResponse {
  systems: ServerSystem[];
}

/** What the app keeps of the server's answer: its systems by lowercased name, like the dataset's lookups. */
export interface ServerData {
  systems: Map<string, ServerSystem>;
}

export function serverDataFrom(response: ServerSystemsResponse): ServerData {
  return { systems: new Map((response.systems ?? []).map(system => [system.name.toLowerCase(), system])) };
}

/** The server's conflicts for a system in the dataset's score format, or null if it lists none. */
function serverConflicts(system: ServerSystem): EbgsConflicts | null {
  if (!system.conflicts?.length) {
    return null;
  }
  const side = (s: ServerConflictSide) => ({ name: s.name, stake: s.stake, days_won: s.won_days });
  return {
    updated_at: system.last_seen,
    source: 'server',
    conflicts: system.conflicts.map(c => ({ type: c.type, status: c.status, faction1: side(c.faction1), faction2: side(c.faction2) })),
  };
}

function presence(faction: ServerFaction): MinorFactionPresence {
  return {
    name: faction.name,
    influence: faction.influence ?? 0,
    allegiance: faction.allegiance ?? undefined,
    government: faction.government ?? undefined,
    active_states: faction.active_states ?? [],
    pending_states: faction.pending_states ?? [],
    recovering_states: faction.recovering_states ?? [],
  };
}

/**
 * The record with the freshest data the server has for it:
 * - factions, influence, states and control from the server when it saw the system after Spansh
 *   (stations, population and the rest always stay Spansh's);
 * - conflict scores from the server when it saw the system after EliteBGS, or EliteBGS has none.
 * Systems the server hasn't seen come back unchanged.
 */
export function withServerData(record: BgsSystemRecord, server: ServerData): BgsSystemRecord {
  const system = server.systems.get(record.name.toLowerCase());
  if (!system) {
    return record;
  }
  let result = record;
  const seenMs = parseUpdatedAt(system.last_seen);
  const spanshMs = parseUpdatedAt(record.updated_at);
  if (seenMs !== null && (spanshMs === null || seenMs > spanshMs) && system.factions?.length) {
    result = {
      ...result,
      controlling_minor_faction: system.controlling_faction ?? result.controlling_minor_faction,
      minor_faction_presences: system.factions.map(presence),
      updated_at: system.last_seen,
      data_source: 'server',
    };
  }
  const conflicts = serverConflicts(system);
  const current = record.ebgs_conflicts;
  if (conflicts && (!current?.updated_at || (conflicts.updated_at ?? '') > current.updated_at)) {
    result = { ...result, ebgs_conflicts: conflicts };
  }
  return result;
}

/** One entry of the server's `/v1/site`: base data (coordinates, population) merged from Spansh and EDDN, whichever is fresher. */
export interface SiteSystem {
  system_address: string;
  name: string;
  x: number | null;
  y: number | null;
  z: number | null;
  population: number | null;
  /** False when the server's listener saw our faction leave the system. */
  present: boolean;
  /** Where the base data (coordinates, population…) comes from: 'eddn' means it is fresher than Spansh's. */
  base_source: 'spansh' | 'eddn' | null;
}

export interface SiteResponse {
  systems: SiteSystem[];
}

/**
 * The dataset's systems with the server's base data folded in, plus the systems only the server
 * knows (a new colony or an expansion, seen by the listener before Spansh):
 * - population and coordinates from the server when it has them fresher than Spansh's (EDDN);
 * - a system missing from the dataset is added when the server has its coordinates, still has our
 *   faction there and has seen its factions (those come through {@link withServerData}).
 * Stations and services always stay Spansh's: a new system shows none until Spansh lists it.
 */
export function withSiteData(records: BgsSystemRecord[], site: SiteResponse, server: ServerData | null): BgsSystemRecord[] {
  const byName = new Map((site.systems ?? []).map(s => [s.name.toLowerCase(), s]));
  const known = new Set<string>();
  const merged = records.map(record => {
    const key = record.name.toLowerCase();
    known.add(key);
    const entry = byName.get(key);
    if (entry?.base_source !== 'eddn') {
      return record;
    }
    return {
      ...record,
      population: entry.population ?? record.population,
      x: entry.x ?? record.x,
      y: entry.y ?? record.y,
      z: entry.z ?? record.z,
    };
  });
  const added: BgsSystemRecord[] = [];
  for (const [key, entry] of byName) {
    const hasFactions = Boolean(server?.systems.get(key)?.factions?.length);
    if (known.has(key) || entry.present === false || !hasFactions || entry.x === null || entry.y === null || entry.z === null) {
      continue;
    }
    added.push({
      name: entry.name,
      controlling_minor_faction: server?.systems.get(key)?.controlling_faction ?? null,
      x: entry.x,
      y: entry.y,
      z: entry.z,
      updated_at: null,
      population: entry.population,
    });
  }
  return [...merged, ...added];
}

/** How long a system we left stays in the "recently left" box. */
export const RECENT_EXIT_DAYS = 7;

/** An event of the server's `/v1/events`. */
export interface ServerEvent {
  /** ISO 8601 game time. */
  ts: string;
  system_name: string;
  type: string;
}

/** A system our faction left in the last {@link RECENT_EXIT_DAYS} days. */
export interface RecentExit {
  name: string;
  /** ISO 8601 time the server saw us gone. */
  at: string;
  /** Who controls the system now, if the server knows. */
  controllingFaction: string | null;
}

/**
 * The systems we left recently, newest first, from the server's `faction_left` events. Spansh drops
 * a system once we're gone, so the table has no row for it; this keeps a trace for a week. A system
 * where we are back (the server's latest observation lists us) is left out.
 */
export function recentExitsFrom(events: ServerEvent[], server: ServerData | null, faction: string, nowMs: number): RecentExit[] {
  const limitMs = nowMs - RECENT_EXIT_DAYS * 24 * 60 * 60 * 1000;
  const exits = new Map<string, RecentExit>();
  for (const event of events) {
    const atMs = parseUpdatedAt(event.ts);
    if (event.type !== 'faction_left' || atMs === null || atMs < limitMs || exits.has(event.system_name.toLowerCase())) {
      continue;
    }
    const system = server?.systems.get(event.system_name.toLowerCase());
    if (system?.factions?.some(f => f.name === faction)) {
      continue;
    }
    exits.set(event.system_name.toLowerCase(), { name: event.system_name, at: event.ts, controllingFaction: system?.controlling_faction ?? null });
  }
  return [...exits.values()].sort((a, b) => b.at.localeCompare(a.at));
}
