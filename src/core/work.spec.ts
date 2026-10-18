import { describeWork } from './work';

describe('describeWork', () => {
  it('describes the work with the squadron channel abbreviations, the bad items last', () => {
    expect(
      describeWork({
        cbs: 13_080_000,
        bvs: 8_040_000,
        infprimary: 5,
        spacecz_medium: 1,
        spacecz_high: 3,
        trade_sell_value: 1000,
        trade_sell_profit: 200,
        missionfails: 1,
      }),
    ).toEqual([
      'BVs 8,04 M',
      'CBs 13,08 M',
      'Inf +5',
      'CZ spaziali M×1 H×3',
      'Vendite 1.000 cr (profitto 200 cr)',
      '⚠️ Missioni fallite 1',
    ]);
  });

  it('is empty when nothing was done', () => {
    expect(describeWork({})).toEqual([]);
  });
});
