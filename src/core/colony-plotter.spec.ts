import {
  ColonisationTarget,
  DEFAULT_FILTER,
  InterestingBody,
  bodyDetailLines,
  biologyOptions,
  bodyTypeOptions,
  filterTargets,
  interestTags,
  BridgeStep,
  bridgeText,
  highlights,
  nearestAnchor,
  plotterSummary,
  stepsToBuild,
} from './colony-plotter';

const body = (name: string, subtype: string, extra: Partial<InterestingBody> = {}): InterestingBody => ({
  name,
  subtype,
  rare: true,
  terraformable: false,
  ringed: false,
  biology: [],
  geology: [],
  distance: 100,
  ...extra,
});

function target(name: string, extra: Partial<ColonisationTarget> = {}): ColonisationTarget {
  return {
    name,
    id64: name,
    x: 0,
    y: 0,
    z: 0,
    status: 'free',
    bodyCount: 10,
    stars: ['K (Yellow-Orange) Star'],
    rings: [],
    reserve: null,
    bodies: [],
    reasons: [],
    purposes: { refinery: { score: 0, bodies: [] }, industrial: { score: 0, bodies: [] }, extraction: { score: 0, bodies: [] }, agriculture: { score: 0, bodies: [] }, tourism: { score: 0, bodies: [] }, hightech: { score: 0, bodies: [] } },
    bestPurpose: null,
    score: 0,
    spanshUpdatedAt: null,
    from: [{ name: 'HIP 21437', id64: '1', distance: 5, stations: [{ name: 'Porto', type: 'Outpost' }], factions: [] }],
    ...extra,
  };
}

describe('colony plotter', () => {
  it('shows rare bodies one by one, groups common types, biology per body and geology in one tag', () => {
    const t = target('Alfa', {
      bodies: [
        body('Alfa A 1', 'Rocky body'),
        body('Alfa A 2', 'Rocky body'),
        body('Alfa A 3', 'Water world'),
        body('Alfa A 4', 'Icy body', { rare: false, biology: [{ genus: 'Bacterium', species: 'Bacterium Acies' }], geology: ['Water Ice Geyser'] }),
      ],
    });
    expect(interestTags(t).map(tag => [tag.kind, tag.label])).toEqual([
      ['body', 'A 3 Water world'],
      ['common', 'Rocky body ×2'],
      ['biology', 'A 4: Bacterium Acies'],
      ['geology', 'Geologia: A 4'],
    ]);
    expect(bodyDetailLines(t)).toEqual([
      'A 3 (Water world)',
      'A 4 (Icy body): Bacterium Acies, Water Ice Geyser',
      'Rocky body ×2: A 1, A 2',
    ]);
  });

  it('filters by body type, biology genus and "other", and sorts by interest without counting common types', () => {
    const water = target('Acqua', { bodies: [body('Acqua 1', 'Water world')] });
    const rocks = target('Sassi', { bodies: [body('Sassi 1', 'Rocky body'), body('Sassi 2', 'Rocky body')], bodyCount: 50 });
    const life = target('Vita', { bodies: [body('Vita 1', 'Icy body', { rare: false, biology: [{ genus: 'Tussock', species: 'Tussock Cultro' }] })] });
    const all = [rocks, water, life];

    expect(filterTargets(all, { ...DEFAULT_FILTER, bodyType: 'Water world' }).map(t => t.name)).toEqual(['Acqua']);
    expect(filterTargets(all, { ...DEFAULT_FILTER, biology: '*' }).map(t => t.name)).toEqual(['Vita']);
    expect(filterTargets(all, { ...DEFAULT_FILTER, biology: 'Bacterium' })).toEqual([]);
    expect(filterTargets(all, { ...DEFAULT_FILTER, other: 'manyBodies' }).map(t => t.name)).toEqual(['Sassi']);
    // Interesse: Acqua e Vita una ragione ciascuna, Sassi solo tipi comuni (+ "50 corpi").
    expect(filterTargets(all, DEFAULT_FILTER).map(t => t.name)).toEqual(['Sassi', 'Acqua', 'Vita']);
    expect(filterTargets(all, { ...DEFAULT_FILTER, minBodies: 20 }).map(t => t.name)).toEqual(['Sassi']);
    expect(filterTargets(all, { ...DEFAULT_FILTER, sort: 'name', direction: 'desc' }).map(t => t.name)).toEqual(['Vita', 'Sassi', 'Acqua']);

    expect(bodyTypeOptions(all)).toEqual({ planets: ['Water world', 'Rocky body'], stars: [] });
    expect(biologyOptions(all)).toEqual(['Tussock']);
  });

  it('hides claimed systems unless asked', () => {
    const claimed = target('Preso', { status: 'claimed' });
    expect(filterTargets([claimed], DEFAULT_FILTER)).toEqual([]);
    expect(filterTargets([claimed], { ...DEFAULT_FILTER, includeClaimed: true }).length).toBe(1);
  });

  it('highlights: at most two notable types by name, the other rare bodies in one, species, rings with Pristine, hotspots, stars', () => {
    const t = target('Ricco', {
      stars: ['A', 'B'],
      reserve: 'Pristine',
      rings: [{ body: 'Ricco 1', subtype: 'Class I gas giant', rings: [{ type: 'Rocky', reserve: 'Pristine', hotspots: [{ name: 'Painite', count: 1 }, { name: 'Alexandrite', count: 2 }] }] }],
      bodies: [
        body('Ricco 2', 'Ammonia world'),
        body('Ricco 3', 'Ammonia world'),
        body('Ricco 4', 'Water world'),
        body('Ricco 5', 'Earth-like world'),
        body('Ricco 6', 'T Tauri Star'),
        body('Ricco 7', 'Rocky body', { biology: [{ genus: 'Tussock', species: 'Tussock Cultro' }, { genus: 'Bacterium', species: 'Bacterium Acies' }] }),
      ],
    });
    expect(highlights(t).map(h => [h.kind, h.label])).toEqual([
      ['body', 'Earth-like world'],
      ['body', 'Water world'],
      ['rare', '+3 rari'],
      ['biology', '2 specie'],
      ['rings', 'Anelli ×1 · Pristine'],
      ['hotspots', 'Hotspot ×2'],
      ['stars', '2 stelle'],
    ]);
  });

  it('summary counts free targets with biology, Pristine rings and hotspots', () => {
    const bio = target('Bio', { bodies: [body('Bio 1', 'Rocky body', { biology: [{ genus: 'Tussock', species: 'Tussock Cultro' }] })] });
    const pristine = target('P', { reserve: 'Pristine' });
    const claimed = target('C', { status: 'claimed', reserve: 'Pristine' });
    expect(plotterSummary([bio, pristine, claimed])).toEqual({ free: 2, claimed: 1, biology: 1, pristine: 1, hotspots: 0 });
  });

  it('bridge: nearest anchor, steps to build and the route to copy', () => {
    const anchors = [{ name: 'Lontano', x: 100, y: 0, z: 0 }, { name: 'Vicino', x: 10, y: 0, z: 0 }];
    expect(nearestAnchor(anchors, { x: 0, y: 0, z: 0 })?.name).toBe('Vicino');
    expect(nearestAnchor([], { x: 0, y: 0, z: 0 })).toBeNull();
    const step = (name: string, state: BridgeStep['state']): BridgeStep => ({
      name, id64: name, x: 0, y: 0, z: 0, jump_ly: 10, remaining_ly: 0, bodies: 1, state, controlling_faction: null, population: null,
    });
    const steps = [step('A', 'ours'), step('B', 'colonised'), step('C', 'free'), step('D', 'unknown'), step('E', 'building')];
    expect(stepsToBuild(steps)).toBe(2);
    expect(bridgeText(steps)).toBe(['A', 'B', 'C', 'D', 'E'].join('\n'));
  });
});
