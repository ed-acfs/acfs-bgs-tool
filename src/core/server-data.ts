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
