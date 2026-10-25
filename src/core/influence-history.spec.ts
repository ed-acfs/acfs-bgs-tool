import {
  ServerHistoryPoint,
  axisMax,
  buildConflictSpans,
  buildSeries,
  conflictStanding,
  conflictsAt,
  trendFrom,
  trendsFrom,
  valueAt,
} from './influence-history';
import { ServerConflict } from './server-data';

const FS = 'Flotta Stellare';

describe('trendFrom', () => {
  it('measures the change over the last week, from the reading in effect a week before the latest', () => {
    const trend = trendFrom({
      system_address: '1',
      name: 'Misir',
      points: [
        ['2026-10-10T10:00:00Z', 0.4],
        ['2026-10-15T10:00:00Z', 0.45],
        ['2026-10-20T10:00:00Z', 0.5],
        ['2026-10-22T10:00:00Z', 0.5],
      ],
    })!;
    expect(trend.values).toEqual([40, 45, 50, 50]);
    expect(trend.change!.points).toBeCloseTo(5);
    expect(trend.change!.days).toBe(7);
    expect(trend.change!.direction).toBe('up');
    expect(trend.latestAt).toBe(Date.parse('2026-10-22T10:00:00Z'));
  });

  it('uses the whole history while it is shorter than a week', () => {
    const trend = trendFrom({
      system_address: '1',
      name: 'Misir',
      points: [['2026-10-18T10:00:00Z', 0.3], ['2026-10-21T10:00:00Z', 0.27]],
    })!;
    expect(trend.change!.points).toBeCloseTo(-3);
    expect(trend.change!.days).toBe(3);
    expect(trend.change!.direction).toBe('down');
  });

  it('has no change under a day of history, and no trend once our faction is gone', () => {
    expect(trendFrom({ system_address: '1', name: 'A', points: [['2026-10-21T10:00:00Z', 0.3]] })!.change).toBeNull();
    expect(trendFrom({ system_address: '1', name: 'A', points: [['2026-10-20T10:00:00Z', 0.3], ['2026-10-21T10:00:00Z', null]] })).toBeNull();
  });

  it('calls a tiny move flat', () => {
    const trend = trendFrom({ system_address: '1', name: 'A', points: [['2026-10-18T10:00:00Z', 0.3], ['2026-10-21T10:00:00Z', 0.3001]] })!;
    expect(trend.change!.direction).toBe('flat');
  });

  it('keys the trends by lowercased system name', () => {
    const trends = trendsFrom({ systems: [{ system_address: '9', name: 'Wong Sher', points: [['2026-10-21T10:00:00Z', 0.6]] }] });
    expect(trends.get('wong sher')!.systemAddress).toBe('9');
  });
});

const conflict = (status: string, ours: number | null, theirs: number | null, type = 'election'): ServerConflict => ({
  type,
  status,
  involves_us: true,
  faction1: { name: FS, stake: null, won_days: ours },
  faction2: { name: 'Rivali', stake: null, won_days: theirs },
});
const point = (at: string, influence: Record<string, number>, conflicts: ServerConflict[] = []): ServerHistoryPoint => ({
  at,
  controlling_faction: null,
  influence,
  conflicts,
});

describe('buildSeries', () => {
  it('puts our faction first, then the others A-Z, points oldest first', () => {
    const series = buildSeries(
      [point('2026-10-21T10:00:00Z', { Zeta: 0.2, [FS]: 0.5, Alfa: 0.3 }), point('2026-10-20T10:00:00Z', { [FS]: 0.4 })],
      FS,
    );
    expect(series.map(s => s.name)).toEqual([FS, 'Alfa', 'Zeta']);
    expect(series[0].ours).toBe(true);
    expect(series[0].points.map(p => p.value)).toEqual([40, 50]);
    expect(valueAt(series[0], Date.parse('2026-10-20T20:00:00Z'))).toBe(40);
    expect(valueAt(series[1], Date.parse('2026-10-20T20:00:00Z'))).toBeNull();
    expect(axisMax(series)).toBe(50);
  });
});

describe('buildConflictSpans', () => {
  const history = [
    point('2026-10-18T10:00:00Z', {}),
    point('2026-10-19T10:00:00Z', {}, [conflict('pending', 0, 0)]),
    point('2026-10-20T10:00:00Z', {}, [conflict('active', 1, 0)]),
    point('2026-10-21T10:00:00Z', {}, [conflict('active', 2, 1)]),
  ];

  it('spans a conflict from its first sighting, still open at the latest reading', () => {
    const [span] = buildConflictSpans(history);
    expect(span.kind).toBe('Election');
    expect(span.family).toBe('election');
    expect(span.start).toBe(Date.parse('2026-10-19T10:00:00Z'));
    expect(span.end).toBeNull();
    expect(conflictStanding(span)).toEqual({ kind: 'running', outcome: 'Close Victory', days1: 2, days2: 1 });
    expect(conflictsAt([span], Date.parse('2026-10-18T12:00:00Z'))).toEqual([]);
    expect(conflictsAt([span], Date.parse('2026-10-22T12:00:00Z'))).toEqual([span]);
  });

  it('closes it when the server says ended, and then it is just won, lost or drawn', () => {
    const [span] = buildConflictSpans([...history, point('2026-10-22T10:00:00Z', {}, [conflict('ended', 4, 1)])]);
    expect(span.end).toBe(Date.parse('2026-10-22T10:00:00Z'));
    expect(conflictStanding(span)).toEqual({ kind: 'over', result: 'won', days1: 4, days2: 1 });
  });

  it('closes it when it is no longer in the system, and keeps a pending one as pending', () => {
    const spans = buildConflictSpans([
      point('2026-10-19T10:00:00Z', {}, [conflict('pending', 0, 0, 'war')]),
      point('2026-10-20T10:00:00Z', {}),
    ]);
    expect(spans[0].family).toBe('war');
    expect(spans[0].end).toBe(Date.parse('2026-10-20T10:00:00Z'));
    expect(conflictStanding(spans[0])).toEqual({ kind: 'pending' });
  });
});
