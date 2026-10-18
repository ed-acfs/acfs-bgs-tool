import { describeWork, humanFormat } from './work';

const text = (parts: ReturnType<typeof describeWork>) => parts.map(p => [p.label, p.value, p.detail].filter(Boolean).join(' '));

describe('describeWork', () => {
  it('writes the work like the BGS-Tally summary, in its order and with its Italian labels', () => {
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
            trade_buy_value: 850_000,
            trade_sell_profit: 1_200_000,
            missionfails: 1,
            murdersspace: 2,
          },
          { '5': 3, '3': 1 },
        ),
      ),
    ).toEqual([
      'INF +18 (3️⃣ x 1 5️⃣ x 3)',
      'BVs 10,2M',
      'CBs 13,5M',
      'ComAcq 850K',
      'ComProfit 1,2M',
      'Expl 1,72M',
      'Uccisioni 2',
      'Fallite 1',
      'CZ Spaziali M x 1 H x 3',
      'CZ a terra H x 2',
      'SAR 6',
    ]);
  });

  it('names the influence after the state: INF Elezione, INF War', () => {
    expect(text(describeWork({ infelection: 12 }, { '3': 4 }))).toEqual(['INF Elezione +12 (3️⃣ x 4)']);
    expect(text(describeWork({ infwar: 5 }))).toEqual(['INF War +5']);
    expect(describeWork({ infelection: 2, cbs: 1 }).map(p => p.tone)).toEqual(['blue', 'red']);
  });

  it('is empty when nothing was done', () => {
    expect(describeWork({})).toEqual([]);
  });
});

describe('humanFormat', () => {
  it('rounds to three digits with K, M, B, like BGS-Tally', () => {
    expect(humanFormat(13_480_000)).toBe('13,5M');
    expect(humanFormat(1_724_000)).toBe('1,72M');
    expect(humanFormat(850_000)).toBe('850K');
    expect(humanFormat(999)).toBe('999');
  });
});
