/**
 * Conflict scores from the squadron's own server (`acfs-server`, fed live by EDDN; see the
 * roadmap, phase 10): the app reads `/v1/conflicts` at load time and, system by system, keeps
 * whichever source saw the system last — the server or the EliteBGS scores in the dataset.
 */
import { BgsSystemRecord, EbgsConflicts } from './bgs';

/** One side of a conflict as the server sends it: our faction is always `faction1` when involved. */
export interface ServerConflictSide {
  name: string | null;
  stake: string | null;
  won_days: number | null;
}

/** One entry of the server's `/v1/conflicts`. */
export interface ServerConflict {
  system_address: string;
  system_name: string;
  /** ISO 8601 time of the observation the conflict comes from. */
  last_seen: string;
  /** "war", "civilwar" or "election". */
  type: string | null;
  /** "pending", "active" or "ended" (finished, with its final score). */
  status: string;
  faction1: ServerConflictSide;
  faction2: ServerConflictSide;
}

export interface ServerConflictsResponse {
  conflicts: ServerConflict[];
}

/** The server's conflicts in the dataset's format, keyed by lowercased system name like the EliteBGS scores. */
export function serverConflictsBySystem(response: ServerConflictsResponse): Map<string, EbgsConflicts> {
  const bySystem = new Map<string, EbgsConflicts>();
  for (const c of response.conflicts ?? []) {
    const key = c.system_name.toLowerCase();
    let entry = bySystem.get(key);
    if (!entry) {
      entry = { updated_at: c.last_seen, source: 'server', conflicts: [] };
      bySystem.set(key, entry);
    }
    const side = (s: ServerConflictSide) => ({ name: s.name, stake: s.stake, days_won: s.won_days });
    entry.conflicts.push({ type: c.type, status: c.status, faction1: side(c.faction1), faction2: side(c.faction2) });
  }
  return bySystem;
}

/**
 * The record with the freshest conflict scores: the server's when it saw the system after
 * EliteBGS did (or EliteBGS has nothing), otherwise the record unchanged.
 */
export function withFreshestConflicts(
  record: BgsSystemRecord,
  server: ReadonlyMap<string, EbgsConflicts>,
): BgsSystemRecord {
  const fromServer = server.get(record.name.toLowerCase());
  if (!fromServer) {
    return record;
  }
  const current = record.ebgs_conflicts;
  const serverIsNewer = !current?.updated_at || (fromServer.updated_at ?? '') > current.updated_at;
  return serverIsNewer ? { ...record, ebgs_conflicts: fromServer } : record;
}
