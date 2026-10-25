/**
 * The influence history from the squadron's server (`acfs-server`, phase 12 of the roadmap): the
 * trend beside Flotta Stellare's influence in the table (from `/v1/history`) and the maths of a
 * system's chart (from `/v1/systems/<id64>`). Pure, so the components only draw what they get.
 *
 * Idea and part of the chart maths from the Canonn tool (canonn-colony-operations, MIT:
 * `src/app/data/influence-history.ts` and `influence-change.ts`), reworked for one faction and for
 * our server's formats. The history starts on 18 October 2026, when the server's listener started.
 */
import { conflictIsOver, conflictOutcome, conflictResult, ConflictOutcome, ConflictResult } from './bgs';
import { ServerConflict } from './server-data';

const DAY_MS = 24 * 60 * 60 * 1000;
/** The change is measured over the last week, or over the whole history while it is shorter. */
const TREND_WINDOW_DAYS = 7;
/** Under a day of history there is no change worth showing: influence moves once a tick. */
const TREND_MIN_DAYS = 1;
/** A move this small (points) reads as flat. */
const FLAT_POINTS = 0.05;

/** One system in `/v1/history`: `[game time, influence 0-1 or null]`, a point per change plus the latest reading. */
export interface ServerHistorySystem {
  system_address: string;
  name: string;
  points: [string, number | null][];
}

export interface ServerHistoryResponse {
  systems: ServerHistorySystem[];
}

/** Our faction's change in influence over the window the history allows. */
export interface InfluenceChange {
  /** Percentage points gained (positive) or lost (negative). */
  points: number;
  /** Days the change is measured over: 7, or fewer for a system the server has watched less. */
  days: number;
  direction: 'up' | 'down' | 'flat';
}

/** What the table shows beside our influence: the sparkline and the change. */
export interface InfluenceTrend {
  systemAddress: string;
  /** Percentages, oldest first, for the sparkline (readings without our faction left out). */
  values: number[];
  /** Time of the latest reading, ms. */
  latestAt: number;
  change: InfluenceChange | null;
}

/** Each system's trend by lowercased name, like the other lookups of the dataset. */
export function trendsFrom(response: ServerHistoryResponse): Map<string, InfluenceTrend> {
  const trends = new Map<string, InfluenceTrend>();
  for (const system of response.systems ?? []) {
    const trend = trendFrom(system);
    if (trend) {
      trends.set(system.name.toLowerCase(), trend);
    }
  }
  return trends;
}

export function trendFrom(system: ServerHistorySystem): InfluenceTrend | null {
  const points = (system.points ?? [])
    .map(([at, influence]) => ({ time: Date.parse(at), value: influence === null ? null : influence * 100 }))
    .filter(p => !Number.isNaN(p.time))
    .sort((a, b) => a.time - b.time);
  const latest = points[points.length - 1];
  if (!latest || latest.value === null) {
    return null;
  }
  return {
    systemAddress: system.system_address,
    values: points.flatMap(p => (p.value === null ? [] : [p.value])),
    latestAt: latest.time,
    change: changeOf(points),
  };
}

/** From the reading in effect a week before the latest one (or the first, if the history is shorter) to the latest. */
function changeOf(points: { time: number; value: number | null }[]): InfluenceChange | null {
  const latest = points[points.length - 1];
  const from = latest.time - TREND_WINDOW_DAYS * DAY_MS;
  let reference = points[0];
  for (const point of points) {
    if (point.time <= from) {
      reference = point;
    }
  }
  const days = (latest.time - Math.max(reference.time, from)) / DAY_MS;
  if (latest.value === null || reference.value === null || days < TREND_MIN_DAYS) {
    return null;
  }
  const change = latest.value - reference.value;
  return {
    points: change,
    days: Math.round(days),
    direction: Math.abs(change) < FLAT_POINTS ? 'flat' : change > 0 ? 'up' : 'down',
  };
}

// --- The chart of one system ---

/** One observation in `/v1/systems/<id64>`'s `history`. */
export interface ServerHistoryPoint {
  at: string;
  controlling_faction: string | null;
  /** Faction name -> influence 0-1. */
  influence: Record<string, number>;
  /** Since 25 October 2026; missing in older answers. */
  conflicts?: ServerConflict[];
}

/** A moment and a faction's influence then, as a percentage. */
export interface HistoryPoint {
  time: number;
  value: number;
}

export interface FactionSeries {
  name: string;
  /** Our faction: drawn in the accent orange and listed first. */
  ours: boolean;
  /** Oldest first. */
  points: HistoryPoint[];
}

/** One series per faction: ours first, then A-Z. */
export function buildSeries(history: readonly ServerHistoryPoint[], ownFaction: string): FactionSeries[] {
  const byName = new Map<string, HistoryPoint[]>();
  for (const point of history) {
    const time = Date.parse(point.at);
    if (Number.isNaN(time)) {
      continue;
    }
    for (const [name, influence] of Object.entries(point.influence ?? {})) {
      if (typeof influence !== 'number') {
        continue;
      }
      const points = byName.get(name) ?? [];
      points.push({ time, value: influence * 100 });
      byName.set(name, points);
    }
  }
  return [...byName.entries()]
    .sort(([a], [b]) => Number(b === ownFaction) - Number(a === ownFaction) || a.localeCompare(b, undefined, { sensitivity: 'base' }))
    .map(([name, points]) => ({ name, ours: name === ownFaction, points: points.sort((a, b) => a.time - b.time) }));
}

/** A war or election as a band on the time axis, with how it stood when last seen. */
export interface ConflictSpan {
  /** "War", "Civil War" or "Election", as in the game. */
  kind: string;
  family: 'war' | 'election';
  /** Our faction (when involved) or the first side, and the other side. */
  side1: string;
  side2: string;
  involvesUs: boolean;
  start: number;
  /** When it was last seen; null while it is still on at the latest reading. */
  end: number | null;
  /** Pending at its latest reading. */
  pending: boolean;
  /** Ended at its latest reading (the server gives the final score). */
  ended: boolean;
  /** Days won by side1 and side2 at its latest reading, if known. */
  days1: number | null;
  days2: number | null;
}

const KIND: Readonly<Record<string, string>> = { war: 'War', civilwar: 'Civil War', election: 'Election' };

/** The conflicts seen in the history, one span from first to last sighting, oldest first. */
export function buildConflictSpans(history: readonly ServerHistoryPoint[]): ConflictSpan[] {
  const open = new Map<string, ConflictSpan>();
  const spans: ConflictSpan[] = [];
  const sorted = [...history].map(p => ({ ...p, time: Date.parse(p.at) })).filter(p => !Number.isNaN(p.time)).sort((a, b) => a.time - b.time);
  for (const point of sorted) {
    const seen = new Set<string>();
    for (const conflict of point.conflicts ?? []) {
      const kind = KIND[(conflict.type ?? '').toLowerCase()];
      const side1 = conflict.faction1.name;
      const side2 = conflict.faction2.name;
      if (!kind || !side1 || !side2) {
        continue;
      }
      const key = `${conflict.type}|${[side1, side2].sort().join('|')}`;
      seen.add(key);
      let span = open.get(key);
      if (!span) {
        span = {
          kind,
          family: kind === 'Election' ? 'election' : 'war',
          side1,
          side2,
          involvesUs: Boolean(conflict.involves_us),
          start: point.time,
          end: null,
          pending: false,
          ended: false,
          days1: null,
          days2: null,
        };
        open.set(key, span);
        spans.push(span);
      }
      span.pending = conflict.status === 'pending';
      span.ended = conflict.status === 'ended';
      span.days1 = conflict.faction1.won_days;
      span.days2 = conflict.faction2.won_days;
      if (span.ended) {
        span.end = point.time;
        open.delete(key);
      }
    }
    // Gone from the system: over (or out of sight), ended at this reading.
    for (const [key, span] of open) {
      if (!seen.has(key)) {
        span.end = point.time;
        open.delete(key);
      }
    }
  }
  return spans;
}

/** How a span stood, from side1's point of view: in progress (gap label), over (won, lost, drawn), or not started. */
export type ConflictStanding =
  | { kind: 'pending' }
  | { kind: 'running'; outcome: ConflictOutcome; days1: number; days2: number }
  | { kind: 'over'; result: ConflictResult; days1: number; days2: number }
  | { kind: 'unknown' };

/** The gap labels only apply while it runs; once a side has 4 days, or the server says ended, it is just won, lost or drawn (see CLAUDE.md). */
export function conflictStanding(span: ConflictSpan): ConflictStanding {
  if (span.pending) {
    return { kind: 'pending' };
  }
  if (span.days1 === null || span.days2 === null) {
    return { kind: 'unknown' };
  }
  const score = { ours: span.days1, theirs: span.days2, ended: span.ended };
  return conflictIsOver(score)
    ? { kind: 'over', result: conflictResult(span.days1, span.days2), days1: span.days1, days2: span.days2 }
    : { kind: 'running', outcome: conflictOutcome(span.days1, span.days2), days1: span.days1, days2: span.days2 };
}

/** The conflicts on at `time` (an open one runs to the end of the history). */
export function conflictsAt(spans: readonly ConflictSpan[], time: number): ConflictSpan[] {
  return spans.filter(s => s.start <= time && (s.end === null || time <= s.end));
}

/** Every moment any faction has a reading, oldest first: the places the hover can land. */
export function snapshotTimes(series: readonly FactionSeries[]): number[] {
  const times = new Set<number>();
  for (const s of series) {
    for (const point of s.points) {
      times.add(point.time);
    }
  }
  return [...times].sort((a, b) => a - b);
}

/** The faction's influence in effect at `time`: its reading then, else its latest earlier one; null before its first. */
export function valueAt(series: FactionSeries, time: number): number | null {
  let found: number | null = null;
  for (const point of series.points) {
    if (point.time > time) {
      break;
    }
    found = point.value;
  }
  return found;
}

/** The index in `times` nearest to `time` (ties go to the later one); -1 if there are none. */
export function nearestIndex(times: readonly number[], time: number): number {
  let best = -1;
  let bestDistance = Number.POSITIVE_INFINITY;
  times.forEach((candidate, index) => {
    const distance = Math.abs(candidate - time);
    if (distance <= bestDistance) {
      best = index;
      bestDistance = distance;
    }
  });
  return best;
}

/** The top of the influence axis: the highest value, rounded up to the next 10%, between 20% and 100%. */
export function axisMax(series: readonly FactionSeries[]): number {
  const highest = Math.max(0, ...series.flatMap(s => s.points.map(p => p.value)));
  return Math.min(100, Math.max(20, Math.ceil(highest / 10) * 10));
}

/** Gridline values from 0 to `max`, about four steps. */
export function axisTicks(max: number): number[] {
  const step = max <= 20 ? 5 : max <= 50 ? 10 : 25;
  const ticks: number[] = [];
  for (let value = 0; value <= max; value += step) {
    ticks.push(value);
  }
  return ticks;
}

/** Evenly spaced moments between `start` and `end` for the time axis; one if they coincide. */
export function timeTicks(start: number, end: number, count: number): number[] {
  if (end <= start || count < 2) {
    return [start];
  }
  return Array.from({ length: count }, (_unused, i) => start + ((end - start) * i) / (count - 1));
}
