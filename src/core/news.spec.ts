import { NEWS_ID, shouldShowNews } from './news';

describe('finestra Novità', () => {
  it('compare se non è mai stata vista o se ne è uscita una nuova', () => {
    expect(shouldShowNews(null)).toBe(true);
    expect(shouldShowNews('1.7.0')).toBe(true);
    expect(shouldShowNews(NEWS_ID)).toBe(false);
  });
});
