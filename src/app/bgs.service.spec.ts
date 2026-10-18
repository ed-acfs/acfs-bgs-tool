import { systemServices } from '../core/bgs';
import { TestBed } from '@angular/core/testing';
import { ARCHITECT_FORM_ACTION, ARCHITECTS_SHEET_URL, SERVER_API_URL, WATCHLIST_SHEET_URL } from '../core/config';
import { BgsService } from './bgs.service';
import { logger } from '../core/logger';

const BGS_DATA_URL = 'data/bgs.json';

function textResponse(body: string, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status >= 200 && status < 300 ? 'OK' : 'Not Found',
    text: () => Promise.resolve(body),
  } as Response;
}

function dataset(results: unknown[]) {
  return JSON.stringify({ faction: 'Flotta Stellare', generated_at: '2026-10-04T17:49:25.854Z', count: results.length, results });
}

/** The squadron sheets as Google publishes them: the form's own headers, Italian timestamp column included. */
const ARCHITECTS_TSV =
  'Informazioni cronologiche\tYour Name\tSystem Name\tArchitect Name\tACFS Architect\tPreferred Faction\n' +
  '04/10/2026 21:00:00\tSkyflash\tSystem 1\tHabba-Nero\tNot an ACFS Member\tFlotta Stellare\n';
const WATCHLIST_TSV = 'System\tFaction\tPosition\tDetails\nSystem 1\tFlotta Stellare\t1\tKeep control.\n';

function systemRecord(name: string) {
  return { name, controlling_minor_faction: null, x: 0, y: 0, z: 0 };
}

describe('BgsService dataset loading', () => {
  const TOTAL_SYSTEMS = 389;
  let service: BgsService;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    const records = Array.from({ length: TOTAL_SYSTEMS }, (_unused, i) => systemRecord(`System ${i}`));
    const responses = new Map<string | null, string>([
      [BGS_DATA_URL, dataset(records)],
      [ARCHITECTS_SHEET_URL, ARCHITECTS_TSV],
      [WATCHLIST_SHEET_URL, WATCHLIST_TSV],
    ]);
    fetchMock = vi.fn((url: string) =>
      responses.has(url)
        ? Promise.resolve(textResponse(responses.get(url)!))
        : Promise.reject(new Error(`Unexpected fetch in test: ${url}`)),
    );
    vi.stubGlobal('fetch', fetchMock);
    TestBed.configureTestingModule({});
    service = TestBed.inject(BgsService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns every system on page 0, as a single page', async () => {
    const first = await service.getPage(0);

    expect(first.rows.length).toBe(TOTAL_SYSTEMS);
    expect(first.totalCount).toBe(TOTAL_SYSTEMS);
    expect(first.totalPages).toBe(1);
  });

  it('fetches the dataset once, however many pages and full-dataset reads are requested', async () => {
    const rows = await service.getAllRows();
    await service.getPage(0);
    const beyond = await service.getPage(1);

    expect(rows.length).toBe(TOTAL_SYSTEMS);
    // System 1 is on the watchlist (see WATCHLIST_TSV), so it comes first; then the file's order.
    expect(rows.slice(0, 2).map(row => row.systemName)).toEqual(['System 1', 'System 0']);
    expect(beyond.rows).toEqual([]);
    expect(fetchMock.mock.calls.filter(([url]) => url === BGS_DATA_URL)).toHaveLength(1);
  });

  it('reads the architect registry and the watchlist from the squadron sheets', async () => {
    const page = await service.getPage(0);
    const system1 = page.rows.find(row => row.systemName === 'System 1')!;

    expect(await service.getArchitectRegistry()).toEqual([
      { systemName: 'System 1', architect: 'Habba-Nero', affiliation: 'Not an ACFS Member', preferredFaction: 'Flotta Stellare' },
    ]);
    expect(system1.architect).toBe('Habba-Nero');
    expect(system1.preferredFaction).toBe('Flotta Stellare');
    expect(system1.preferredFactionRecorded).toBe(true);
    expect(system1.watchlist).toEqual([{ systemName: 'System 1', faction: 'Flotta Stellare', position: 1, details: 'Keep control.' }]);
  });

  it('retries the dataset after a failed load instead of caching the failure', async () => {
    fetchMock.mockImplementationOnce(() => Promise.resolve(textResponse('Not Found', 404)));

    await expect(service.getPage(0)).rejects.toThrow();
    const retried = await service.getPage(0);

    expect(retried.rows.length).toBe(TOTAL_SYSTEMS);
  });

  it('submits an assignment to the squadron form, as an opaque no-cors POST', async () => {
    // The Form path, used whenever the Apps Script isn't configured.
    service.assignScriptUrl = null;
    fetchMock.mockImplementationOnce(() => Promise.resolve({ ok: false, status: 0, type: 'opaque' } as Response));

    await service.submitAssignment({ yourName: 'Cmdr', systemName: 'Wong Sher', architect: '', affiliation: '', preferredFaction: '' });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(ARCHITECT_FORM_ACTION);
    expect(init.method).toBe('POST');
    expect(init.mode).toBe('no-cors');
    expect(String(init.body)).toContain('entry.2086138170=Wong+Sher');
  });

  it('writes through the protected Apps Script, once configured, with the password in a text/plain JSON body', async () => {
    service.assignScriptUrl = 'https://script.google.com/macros/s/test/exec';
    fetchMock.mockImplementationOnce(() => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ ok: true }) } as Response));

    await service.submitAssignment({ yourName: 'Cmdr', systemName: 'Wong Sher', architect: '', affiliation: "Don't know", preferredFaction: '' }, 'segreta');

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://script.google.com/macros/s/test/exec');
    expect(init.mode).toBeUndefined();
    expect((init.headers as Record<string, string>)['Content-Type']).toContain('text/plain');
    expect(JSON.parse(String(init.body))).toMatchObject({ password: 'segreta', systemName: 'Wong Sher' });
  });

  it("rejects with the script's reason when it refuses the assignment", async () => {
    service.assignScriptUrl = 'https://script.google.com/macros/s/test/exec';
    fetchMock.mockImplementationOnce(() =>
      Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ ok: false, error: 'password' }) } as Response),
    );

    await expect(
      service.submitAssignment({ yourName: 'Cmdr', systemName: 'Wong Sher', architect: '', affiliation: "Don't know", preferredFaction: '' }, 'sbagliata'),
    ).rejects.toMatchObject({ name: 'AssignRejectedError', reason: 'password' });
  });
});

interface FactionPresenceFixture {
  name: string;
  influence: number;
  active_states?: string[];
  pending_states?: string[];
}

function systemWithPresences(
  name: string,
  presences: FactionPresenceFixture[],
  extra: { body_count?: number; population?: number; ebgs_conflicts?: unknown; assets?: unknown[]; updated_at?: string } = {},
) {
  return { name, controlling_minor_faction: null, x: 0, y: 0, z: 0, minor_faction_presences: presences, ...extra };
}

describe('BgsService state summarisation (retreat, FR-1/FR-2)', () => {
  let service: BgsService;
  let fetchMock: ReturnType<typeof vi.fn>;
  let records: ReturnType<typeof systemWithPresences>[];
  /** The squadron server's /v1/systems answer; null = the server doesn't answer. */
  let serverSystems: unknown[] | null;

  beforeEach(() => {
    localStorage.clear();
    records = [];
    serverSystems = null;
    fetchMock = vi.fn((url: string) =>
      url === BGS_DATA_URL
        ? Promise.resolve(textResponse(dataset(records)))
        : url === `${SERVER_API_URL}/v1/systems` && serverSystems
          ? Promise.resolve(textResponse(JSON.stringify({ systems: serverSystems })))
          : Promise.reject(new Error(`Unexpected fetch in test: ${url}`)),
    );
    vi.stubGlobal('fetch', fetchMock);
    TestBed.configureTestingModule({});
    service = TestBed.inject(BgsService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('renders an active retreat for a single faction, with no second corroborator required', async () => {
    records = [
      systemWithPresences('Varati Ring', [
        { name: 'Flotta Stellare', influence: 0.021, active_states: ['Retreat'] },
        { name: 'Other Faction', influence: 0.5 },
      ]),
    ];

    const page = await service.getPage(0);

    expect(page.rows[0].retreatState).toBe('active');
    expect(page.rows[0].retreatDetails).toBe('Retreat: Flotta Stellare (2.1%)');
  });

  it('lists the State details as structured entries, our faction first, active winning over pending', async () => {
    records = [
      systemWithPresences('Misir', [
        { name: 'Earth Defense Fleet', influence: 0.3, active_states: ['CivilWar'] },
        { name: 'Flotta Stellare', influence: 0.25, active_states: ['CivilWar'], pending_states: ['Election'] },
        { name: 'Civitas Dei', influence: 0.2, pending_states: ['Election'] },
      ]),
    ];

    const page = await service.getPage(0);

    expect(page.rows[0].stateEntries).toEqual([
      { kind: 'war', state: 'CivilWar', status: 'active', factions: ['Flotta Stellare', 'Earth Defense Fleet'], score: null },
      { kind: 'election', state: 'Election', status: 'pending', factions: ['Flotta Stellare', 'Civitas Dei'], score: null },
    ]);
  });

  it("attaches EliteBGS's score to an active conflict from our side, our days first", async () => {
    records = [
      systemWithPresences(
        'Misir',
        [
          { name: 'Earth Defense Fleet', influence: 0.3, active_states: ['CivilWar'] },
          { name: 'Flotta Stellare', influence: 0.3, active_states: ['CivilWar'] },
        ],
        {
          ebgs_conflicts: {
            updated_at: '2026-10-06T08:00:00.000Z',
            conflicts: [
              { type: 'election', status: 'active', faction1: { name: 'Someone', stake: null, days_won: 3 }, faction2: { name: 'Else', stake: null, days_won: 0 } },
              {
                type: 'civilwar',
                status: 'active',
                faction1: { name: 'Earth Defense Fleet', stake: 'Bolden Port', days_won: 2 },
                faction2: { name: 'flotta stellare', stake: null, days_won: 1 },
              },
            ],
          },
        },
      ),
    ];

    const page = await service.getPage(0);

    expect(page.rows[0].stateEntries[0].score).toEqual({
      ours: 1,
      theirs: 2,
      opponent: 'Earth Defense Fleet',
      ourStake: null,
      theirStake: 'Bolden Port',
      updatedAt: '2026-10-06T08:00:00.000Z',
      source: 'elitebgs',
      ended: false,
    });
  });

  describe('with the squadron server', () => {
    const civilWar = () =>
      systemWithPresences(
        'Misir',
        [
          { name: 'Earth Defense Fleet', influence: 0.3, active_states: ['CivilWar'] },
          { name: 'Flotta Stellare', influence: 0.3, active_states: ['CivilWar'] },
        ],
        {
          ebgs_conflicts: {
            updated_at: '2026-10-06T08:00:00.000Z',
            conflicts: [
              {
                type: 'civilwar',
                status: 'active',
                faction1: { name: 'Earth Defense Fleet', stake: 'Bolden Port', days_won: 2 },
                faction2: { name: 'Flotta Stellare', stake: null, days_won: 1 },
              },
            ],
          },
        },
      );
    const conflict = (status: string) => ({
      type: 'civilwar',
      status,
      involves_us: true,
      faction1: { name: 'Flotta Stellare', stake: null, won_days: 4 },
      faction2: { name: 'Earth Defense Fleet', stake: 'Bolden Port', won_days: 0 },
      score: '4-0',
    });
    /** A server system; no factions = only the conflict scores count, the states stay Spansh's. */
    const serverSystem = (lastSeen: string, status: string, factions: unknown[] = []) => ({
      system_address: '123',
      name: 'MISIR',
      last_seen: lastSeen,
      controlling_faction: 'Flotta Stellare',
      factions,
      conflicts: [conflict(status)],
    });
    const serverFaction = (name: string, influence: number, recovering: string[] = []) => ({
      name, influence, active_states: [], pending_states: [], recovering_states: recovering, government: null, allegiance: null,
    });

    it("uses the server's score when it saw the system after EliteBGS, telling a finished conflict apart", async () => {
      records = [civilWar()];
      serverSystems = [serverSystem('2026-10-18T06:49:34Z', 'ended')];

      const page = await service.getPage(0);
      const info = await service.getDatasetInfo();

      expect(page.rows[0].stateEntries[0].score).toEqual({
        ours: 4,
        theirs: 0,
        opponent: 'Earth Defense Fleet',
        ourStake: null,
        theirStake: 'Bolden Port',
        updatedAt: '2026-10-18T06:49:34Z',
        source: 'server',
        ended: true,
      });
      expect(info.conflictScoresAvailable).toBe(true);
    });

    it("keeps EliteBGS's score when the server's observation is older", async () => {
      records = [civilWar()];
      serverSystems = [serverSystem('2026-10-01T00:00:00Z', 'active')];

      const page = await service.getPage(0);

      expect(page.rows[0].stateEntries[0].score).toMatchObject({ ours: 1, theirs: 2, source: 'elitebgs' });
    });

    it('still loads the table, with the dataset scores, when the server does not answer', async () => {
      const warnSpy = vi.spyOn(logger, 'warn');
      records = [civilWar()];

      const page = await service.getPage(0);
      const info = await service.getDatasetInfo();

      expect(page.rows[0].stateEntries[0].score).toMatchObject({ ours: 1, theirs: 2, source: 'elitebgs' });
      expect(info.conflictScoresAvailable).toBe(false);
      expect(page.rows[0].dataSource).toBe('spansh');
      expect(warnSpy).toHaveBeenCalledWith('Squadron server unavailable; states and conflict scores come from the dataset only.', expect.any(Error));
    });

    it("takes factions and states from the server when it saw the system after Spansh, and shows a conflict of ours that just ended", async () => {
      records = [{ ...civilWar(), updated_at: '2026-10-17 20:00:00+00' }];
      serverSystems = [
        serverSystem('2026-10-18T06:49:34Z', 'ended', [
          serverFaction('Flotta Stellare', 0.55, ['CivilWar']),
          serverFaction('Earth Defense Fleet', 0.2, ['CivilWar']),
        ]),
      ];

      const [row] = (await service.getPage(0)).rows;

      expect(row.dataSource).toBe('server');
      expect(row.updatedAt).toBe('2026-10-18T06:49:34Z');
      expect(row.factionInfluence).toBeCloseTo(55);
      expect(row.warState).toBeNull();
      expect(row.stateEntries).toEqual([
        {
          kind: 'war',
          state: 'CivilWar',
          status: 'ended',
          factions: ['Flotta Stellare', 'Earth Defense Fleet'],
          score: expect.objectContaining({ ours: 4, theirs: 0, source: 'server', ended: true }),
        },
      ]);
    });

    it("keeps Spansh's factions and states when Spansh saw the system after the server", async () => {
      records = [{ ...civilWar(), updated_at: '2026-10-18 08:00:00+00' }];
      serverSystems = [serverSystem('2026-10-18T06:49:34Z', 'active', [serverFaction('Flotta Stellare', 0.9)])];

      const [row] = (await service.getPage(0)).rows;

      expect(row.dataSource).toBe('spansh');
      expect(row.factionInfluence).toBeCloseTo(30);
      expect(row.warState).toBe('active');
    });
  });

  it('gives no score when EliteBGS has none for the conflict, or the conflict is still pending', async () => {
    const conflicts = { updated_at: null, conflicts: [] };
    records = [
      systemWithPresences('A', [
        { name: 'Flotta Stellare', influence: 0.3, active_states: ['War'] },
        { name: 'Other', influence: 0.3, active_states: ['War'] },
      ], { ebgs_conflicts: conflicts }),
      systemWithPresences('B', [
        { name: 'Flotta Stellare', influence: 0.3, pending_states: ['Election'] },
        { name: 'Other', influence: 0.3, pending_states: ['Election'] },
      ], {
        ebgs_conflicts: {
          updated_at: null,
          conflicts: [{ type: 'election', status: 'pending', faction1: { name: 'Flotta Stellare', stake: null, days_won: 0 }, faction2: { name: 'Other', stake: null, days_won: 0 } }],
        },
      }),
    ];

    const page = await service.getPage(0);

    expect(page.rows.map(r => r.stateEntries[0].score)).toEqual([null, null]);
  });

  it('does not log an anomaly for an unpaired pending retreat (R9 only applies to two-party states)', async () => {
    const warnSpy = vi.spyOn(logger, 'warn');
    const logSpy = vi.spyOn(logger, 'log');
    records = [
      systemWithPresences('Varati Ring', [
        { name: 'Flotta Stellare', influence: 0.05, pending_states: ['Retreat'] },
      ]),
    ];

    const page = await service.getPage(0);
    const anomalyCalls = (calls: unknown[][]) => calls.filter(([message]) => message === 'BGS conflict-state anomaly');

    expect(page.rows[0].retreatState).toBe('pending');
    expect(anomalyCalls(warnSpy.mock.calls)).toEqual([]);
    expect(anomalyCalls(logSpy.mock.calls)).toEqual([]);
  });

  it('suppresses the retreat icon for a faction in its own home system', async () => {
    records = [
      systemWithPresences('Wong Sher', [{ name: 'Flotta Stellare', influence: 0.02, active_states: ['Retreat'] }]),
    ];

    const page = await service.getPage(0);

    expect(page.rows[0].retreatState).toBeNull();
  });

  it('still surfaces a retreat for the same faction away from its home system', async () => {
    records = [
      systemWithPresences('Some Other System', [{ name: 'Flotta Stellare', influence: 0.02, active_states: ['Retreat'] }]),
    ];

    const page = await service.getPage(0);

    expect(page.rows[0].retreatState).toBe('active');
  });

  it('maps body_count and population through to the row, defaulting to null when the API omits them', async () => {
    records = [
      systemWithPresences('With Data', [], { body_count: 32, population: 26481079 }),
      systemWithPresences('Without Data', []),
    ];

    const page = await service.getPage(0);

    expect(page.rows[0].bodyCount).toBe(32);
    expect(page.rows[0].population).toBe(26481079);
    expect(page.rows[1].bodyCount).toBeNull();
    expect(page.rows[1].population).toBeNull();
  });

  it('reads Material Traders and Technology Brokers from the stations, with an unknown kind as null', async () => {
    records = [
      systemWithPresences('Zandu', [], {
        assets: [
          { name: 'Plain Port', type: 'Outpost', controlling_minor_faction: 'Other' },
          { name: 'Vaucanson Hub', type: 'Coriolis Starport', controlling_minor_faction: 'Flotta Stellare', distance_to_arrival: 282, material_trader: 'Encoded', technology_broker: 'unknown' },
        ],
      }),
    ];

    const [zandu] = (await service.getPage(0)).rows;

    expect(zandu.stations[0].services).toBeUndefined();
    expect(zandu.stations[1].services).toEqual([
      { kind: 'material-trader', type: 'Encoded' },
      { kind: 'technology-broker', type: null },
    ]);
    expect(systemServices(zandu.stations)).toEqual([
      { kind: 'material-trader', type: 'Encoded', station: 'Vaucanson Hub', distanceToArrival: 282, pad: null },
      { kind: 'technology-broker', type: null, station: 'Vaucanson Hub', distanceToArrival: 282, pad: null },
    ]);
  });

  it('reads Interstellar Factors, handiest station first: largest pad, then nearest to the star', async () => {
    records = [
      systemWithPresences('Lyncis Sector LD-S b4-0', [], {
        assets: [
          { name: "Constancia's Watch", type: 'Settlement', controlling_minor_faction: 'Other', distance_to_arrival: 3207, pad: 'M', interstellar_factors: true },
          { name: 'Philip Platform', type: 'Planetary Outpost', controlling_minor_faction: 'Canonn', distance_to_arrival: 896, pad: 'L', interstellar_factors: true },
          { name: 'The Rivahrock', type: 'Asteroid base', controlling_minor_faction: 'Other', distance_to_arrival: 913, pad: 'L', interstellar_factors: true },
          { name: 'Hub', type: 'Outpost', controlling_minor_faction: 'Other', distance_to_arrival: 50, pad: 'M', material_trader: 'Raw' },
        ],
      }),
    ];

    const [system] = (await service.getPage(0)).rows;

    expect(system.stations[0].services).toEqual([{ kind: 'interstellar-factors', type: null }]);
    expect(system.stations[0].pad).toBe('M');
    expect(systemServices(system.stations, ['interstellar-factors']).map(s => s.station)).toEqual([
      'Philip Platform',
      'The Rivahrock',
      "Constancia's Watch",
    ]);
    expect(systemServices(system.stations).map(s => s.kind)).toEqual([
      'material-trader',
      'interstellar-factors',
      'interstellar-factors',
      'interstellar-factors',
    ]);
  });
});
