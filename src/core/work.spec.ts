import { describeWork } from './work';

const text = (parts: ReturnType<typeof describeWork>) => parts.map(p => [p.label, p.value, p.detail].filter(Boolean).join(' '));

describe('describeWork', () => {
  it('describes the work like the BGS-Tally summary, the bad items last', () => {
    expect(
      text(
        describeWork(
          {
            cbs: 13_500_000,
            bvs: 10_200_000,
            infprimary: 18,
            groundcz_high: 2,
            spacecz_medium: 1,
            spacecz_high: 3,
            sandr: 6,
            exploration: 1_720_000,
            trade_sell_value: 1000,
            trade_sell_profit: 200,
            missionfails: 1,
          },
          { '5': 3, '3': 1 },
        ),
      ),
    ).toEqual([
      'CBs 13,5 M',
      'CZ a terra H×2',
      'CZ spaziali M×1 H×3',
      'INF +18 (3️⃣×1 5️⃣×3)',
      'BVs 10,2 M',
      'SAR 6',
      'Expl 1,72 M',
      'Vendite 1.000 cr (profitto 200 cr)',
      '⚠️ Missioni fallite 1',
    ]);
  });

  it('shows the influence in an election on its own, with the mission levels', () => {
    expect(text(describeWork({ infelection: 12 }, { '3': 4 }))).toEqual(['INF Elezione +12 (3️⃣×4)']);
    expect(describeWork({ cbs: 1, infelection: 2 })[0].tone).toBe('combat');
  });

  it('is empty when nothing was done', () => {
    expect(describeWork({})).toEqual([]);
  });
});
