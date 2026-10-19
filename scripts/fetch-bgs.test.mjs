import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  activeConflictSystems,
  applyServiceTypes,
  fetchConflictScores,
  fetchLastTick,
  fetchServiceTypes,
  serviceSystems,
  slimSystem,
} from './fetch-bgs.mjs';

const system = {
  name: 'Wong Sher',
  controlling_minor_faction: 'Flotta Stellare',
  updated_at: '2026-10-04T17:24:53Z',
  x: 16.46875,
  y: 4.0625,
  z: -60.5,
  bodies: [{ name: 'Wong Sher A' }],
  synthesis_recipes: [{ name: 'FSD', level: 'Basic' }],
  minor_faction_presences: [{ name: 'Flotta Stellare', influence: 0.6, active_states: ['Boom'] }],
  stations: [
    { name: 'Starport', type: 'Coriolis Starport', controlling_minor_faction: 'Flotta Stellare', has_market: true },
    { name: 'X7Z-12B', type: 'Drake-Class Carrier', controlling_minor_faction: 'FleetCarrier' },
    { name: 'Outpost', controlling_minor_faction: 'Other Faction' },
  ],
};

test('drops bodies, synthesis recipes and the full station details', () => {
  const slim = slimSystem(system);

  assert.equal('bodies' in slim, false);
  assert.equal('synthesis_recipes' in slim, false);
  assert.equal('stations' in slim, false);
});

test('keeps the fields the app reads untouched', () => {
  const slim = slimSystem(system);

  assert.equal(slim.name, 'Wong Sher');
  assert.equal(slim.controlling_minor_faction, 'Flotta Stellare');
  assert.equal(slim.updated_at, '2026-10-04T17:24:53Z');
  assert.deepEqual([slim.x, slim.y, slim.z], [16.46875, 4.0625, -60.5]);
  assert.deepEqual(slim.minor_faction_presences, system.minor_faction_presences);
});

test('counts and lists stations without fleet carriers', () => {
  const slim = slimSystem(system);

  assert.equal(slim.station_count, 2);
  assert.deepEqual(slim.assets, [
    { name: 'Starport', type: 'Coriolis Starport', controlling_minor_faction: 'Flotta Stellare' },
    { name: 'Outpost', type: null, controlling_minor_faction: 'Other Faction' },
  ]);
});

test('handles a system Spansh returns without stations', () => {
  const { stations, ...withoutStations } = system;
  const slim = slimSystem(withoutStations);

  assert.equal(slim.station_count, 0);
  assert.deepEqual(slim.assets, []);
});

/** Fake answers for the two tick detectors and the published data; a missing one is down. */
const tickSources = ({ edcd, infomancer, published }) => async url => {
  const body = String(url).includes('tick.edcd.io') ? edcd
    : String(url).includes('infomancer') ? infomancer
    : published;
  return body === undefined ? new Response('Service Unavailable', { status: 503 }) : new Response(JSON.stringify(body));
};

test('reads the last tick from the Tick Detector as an ISO timestamp', async t => {
  t.mock.method(globalThis, 'fetch', tickSources({ edcd: '2026-10-04T16:06:50+00:00' }));
  t.mock.method(console, 'warn', () => {});
  assert.equal(await fetchLastTick(), '2026-10-04T16:06:50.000Z');
});

test('takes the most recent tick when one detector is stuck', async t => {
  t.mock.method(globalThis, 'fetch', tickSources({
    edcd: '2026-10-17T16:25:36+00:00',
    infomancer: { lastGalaxyTick: '2026-10-19T16:41:53.000Z' },
    published: { tick_at: '2026-10-17T16:25:36.000Z', results: [] },
  }));
  assert.equal(await fetchLastTick(), '2026-10-19T16:41:53.000Z');
});

test('ignores a tick in the future', async t => {
  t.mock.method(globalThis, 'fetch', tickSources({ edcd: '2099-01-01T00:00:00+00:00', infomancer: { lastGalaxyTick: '2026-10-19T16:41:53.000Z' } }));
  t.mock.method(console, 'warn', () => {});
  assert.equal(await fetchLastTick(), '2026-10-19T16:41:53.000Z');
});

test('keeps the tick of the published data when both detectors are down', async t => {
  t.mock.method(globalThis, 'fetch', tickSources({ published: { tick_at: '2026-10-17T14:40:00.000Z', results: [] } }));
  t.mock.method(console, 'warn', () => {});
  assert.equal(await fetchLastTick(), '2026-10-17T14:40:00.000Z');
});

test('treats an unknown tick as null when the published data has none either, without failing', async t => {
  t.mock.method(globalThis, 'fetch', async () => new Response('Service Unavailable', { status: 503 }));
  t.mock.method(console, 'warn', () => {});
  assert.equal(await fetchLastTick(), null);
});

test('picks the systems where our faction has an active war, civil war or election', () => {
  const systems = [
    { name: 'A', minor_faction_presences: [{ name: 'Flotta Stellare', active_states: ['Civil War'] }] },
    { name: 'B', minor_faction_presences: [{ name: 'Flotta Stellare', active_states: ['Boom'], pending_states: ['Election'] }] },
    { name: 'C', minor_faction_presences: [{ name: 'Other', active_states: ['War'] }, { name: 'Flotta Stellare' }] },
    { name: 'D', minor_faction_presences: [{ name: 'Flotta Stellare', active_states: ['Election'] }] },
  ];
  assert.deepEqual(activeConflictSystems(systems, 'Flotta Stellare'), ['A', 'D']);
});

test('asks EliteBGS for conflict scores ten systems at a time, keyed by lowercased name', async t => {
  const names = Array.from({ length: 12 }, (_unused, i) => `System ${i}`);
  const urls = [];
  t.mock.method(globalThis, 'fetch', async url => {
    urls.push(url);
    const asked = new URL(url).searchParams.getAll('name');
    return new Response(JSON.stringify({
      docs: asked.map(name => ({
        name: name.toUpperCase(),
        updated_at: '2026-10-06T08:00:00.000Z',
        conflicts: [{ type: 'war', status: 'active', faction1: { name: 'Flotta Stellare', stake: '', days_won: 1, faction_id: 'x' }, faction2: { name: 'Other', stake: 'Port', days_won: 2 } }],
      })),
    }));
  });

  const scores = await fetchConflictScores(names);

  assert.equal(urls.length, 2);
  assert.equal(new URL(urls[0]).searchParams.getAll('name').length, 10);
  assert.deepEqual(scores['system 11'], {
    updated_at: '2026-10-06T08:00:00.000Z',
    conflicts: [{ type: 'war', status: 'active', faction1: { name: 'Flotta Stellare', stake: null, days_won: 1 }, faction2: { name: 'Other', stake: 'Port', days_won: 2 } }],
  });
});

test('does not call EliteBGS when no system is in conflict', async t => {
  const fetchMock = t.mock.method(globalThis, 'fetch', async () => new Response('{}'));
  assert.deepEqual(await fetchConflictScores([]), {});
  assert.equal(fetchMock.mock.callCount(), 0);
});

test('treats an EliteBGS database error as no scores, even when it comes back as HTTP 200', async t => {
  t.mock.method(console, 'warn', () => {});
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ message: 'connect ECONNREFUSED 127.0.0.1:27017', error: {} })));
  assert.equal(await fetchConflictScores(['Misir']), null);
});

test('treats an EliteBGS HTTP 500 as no scores, without failing the download', async t => {
  t.mock.method(console, 'warn', () => {});
  t.mock.method(globalThis, 'fetch', async () => new Response('{"message":"down"}', { status: 500 }));
  assert.equal(await fetchConflictScores(['Misir']), null);
});

test('marks Material Traders and Technology Brokers as unknown kinds, with the distance from the star', () => {
  const slim = slimSystem({
    name: 'Zandu',
    stations: [
      { name: 'Vaucanson Hub', type: 'Coriolis Starport', controlling_minor_faction: 'Flotta Stellare', distance_to_arrival: 282.4, services: ['Market', 'Material Trader', 'Technology Broker'] },
      { name: 'Plain Port', type: 'Outpost', controlling_minor_faction: 'Other', distance_to_arrival: 90, services: ['Market'] },
    ],
  });

  assert.deepEqual(slim.assets, [
    { name: 'Vaucanson Hub', type: 'Coriolis Starport', controlling_minor_faction: 'Flotta Stellare', distance_to_arrival: 282, pad: null, material_trader: 'unknown', technology_broker: 'unknown' },
    { name: 'Plain Port', type: 'Outpost', controlling_minor_faction: 'Other' },
  ]);
  assert.deepEqual(serviceSystems([slim, slimSystem(system)]), ['Zandu']);
});

test('reads trader and broker kinds from the station search, forty systems at a time', async t => {
  const names = Array.from({ length: 41 }, (_unused, i) => `System ${i}`);
  const bodies = [];
  t.mock.method(globalThis, 'fetch', async (_url, init) => {
    const body = JSON.parse(init.body);
    bodies.push(body);
    const results = body.filters.system_name.value.includes('System 40')
      ? [{ system_name: 'SYSTEM 40', name: 'Hub', material_trader: 'Encoded', technology_broker: null }, { system_name: 'System 40', name: 'Plain' }]
      : [];
    return new Response(JSON.stringify({ count: results.length, results }));
  });

  const types = await fetchServiceTypes(names);

  assert.equal(bodies.length, 2);
  assert.equal(bodies[0].filters.system_name.value.length, 40);
  const systems = [{ name: 'System 40', assets: [{ name: 'Hub', material_trader: 'unknown' }, { name: 'Other', technology_broker: 'unknown' }] }];
  applyServiceTypes(systems, types);
  assert.deepEqual(systems[0].assets, [{ name: 'Hub', material_trader: 'Encoded' }, { name: 'Other', technology_broker: 'unknown' }]);
});

test('marks Interstellar Factors with the largest landing pad', () => {
  const slim = slimSystem({
    name: 'Lyncis Sector LD-S b4-0',
    stations: [
      { name: 'The Rivahrock', type: 'Asteroid base', distance_to_arrival: 913.2, has_large_pad: true, large_pads: 6, medium_pads: 8, small_pads: 4, services: ['Interstellar Factors Contact'] },
      { name: "Constancia's Watch", type: 'Settlement', distance_to_arrival: 3207, has_large_pad: false, large_pads: 0, medium_pads: 1, services: ['Interstellar Factors Contact'] },
    ],
  });

  assert.deepEqual(
    slim.assets.map(({ name, pad, interstellar_factors }) => ({ name, pad, interstellar_factors })),
    [
      { name: 'The Rivahrock', pad: 'L', interstellar_factors: true },
      { name: "Constancia's Watch", pad: 'M', interstellar_factors: true },
    ],
  );
  assert.deepEqual(serviceSystems([slim]), ['Lyncis Sector LD-S b4-0']);
});

test('drops the Interstellar Factors of stations Spansh has not updated in a year', async t => {
  t.mock.method(globalThis, 'fetch', async () =>
    new Response(JSON.stringify({
      count: 4,
      results: [
        { system_name: 'Lyncis Sector LD-S b4-0', name: "Constancia's Watch", updated_at: '2026-01-19T10:00:00Z', services: [{ name: 'Interstellar Factors Contact' }] },
        { system_name: 'Lyncis Sector LD-S b4-0', name: 'Guin Works', updated_at: '2026-10-09T10:00:00Z', services: [{ name: 'Dock' }, { name: 'Interstellar Factors Contact' }] },
        { system_name: 'Lyncis Sector LD-S b4-0', name: 'System Colonisation Ship', updated_at: '2025-03-12T10:00:00Z', services: [{ name: 'Interstellar Factors Contact' }] },
        { system_name: 'Lyncis Sector LD-S b4-0', name: 'Old Hub', updated_at: '2025-03-12T10:00:00Z', material_trader: 'Raw', services: [{ name: 'Material Trader' }, { name: 'Interstellar Factors Contact' }] },
      ],
    })),
  );
  const types = await fetchServiceTypes(['Lyncis Sector LD-S b4-0']);
  const service = { distance_to_arrival: 100, pad: 'L', interstellar_factors: true };
  const systems = [{
    name: 'Lyncis Sector LD-S b4-0',
    assets: [
      { name: "Constancia's Watch", ...service },
      { name: 'Guin Works', ...service },
      { name: 'System Colonisation Ship', ...service },
      { name: 'Old Hub', ...service, material_trader: 'unknown' },
      { name: 'Not In Search', ...service },
    ],
  }];

  applyServiceTypes(systems, types, Date.parse('2026-10-13T00:00:00Z'));

  assert.deepEqual(systems[0].assets, [
    // Nine months old: kept.
    { name: "Constancia's Watch", ...service },
    { name: 'Guin Works', ...service },
    { name: 'System Colonisation Ship' },
    { name: 'Old Hub', distance_to_arrival: 100, pad: 'L', material_trader: 'Raw' },
    // Unknown age: kept.
    { name: 'Not In Search', ...service },
  ]);
});

test('keeps the services as unknown kinds when the station search fails', async t => {
  t.mock.method(console, 'warn', () => {});
  t.mock.method(globalThis, 'fetch', async () => new Response('down', { status: 502 }));
  const types = await fetchServiceTypes(['Zandu']);
  assert.equal(types, null);

  const systems = [{ name: 'Zandu', assets: [{ name: 'Hub', material_trader: 'unknown' }] }];
  applyServiceTypes(systems, types);
  assert.equal(systems[0].assets[0].material_trader, 'unknown');
});
