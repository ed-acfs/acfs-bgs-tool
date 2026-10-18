import { OrderItem } from './orders';
import { discordInlineToHtml, ordersView } from './orders-view';

const item = (patch: Partial<OrderItem>): OrderItem => ({
  id: patch.id ?? 'x',
  section: 'operazioni',
  priority: 1,
  typeKey: 'election',
  system: 'Crowfor',
  score: '',
  trend: null,
  statusKeys: [],
  pending: false,
  detail: '',
  ...patch,
});

describe('ordersView', () => {
  it('lays the orders out by section and priority, with real emoji instead of Discord shortcodes', () => {
    const view = ordersView({
      day: '2026-10-19',
      meta: { footerNote: 'Grazie a tutti.' },
      items: [
        item({ id: 'b', priority: 2, typeKey: 'war', system: 'LP 254-26', score: 'Victory; 2-0', trend: 'up', statusKeys: ['new', 'urgent'], detail: '**difendere** _Metcalf Depot_' }),
        item({ id: 'a', priority: 1, pending: true, detail: 'vincere' }),
        item({ id: 'n', section: 'note', typeKey: 'note', system: '', detail: 'Nota libera', statusKeys: ['ok'] }),
        item({ id: 'c', section: 'cantieri', typeKey: 'construction', system: 'Wong Sher', detail: 'Porto' }),
      ],
    });

    expect(view.date).toBe('19/10/3312');
    expect(view.sections.map(s => s.key)).toEqual(['operazioni', 'cantieri', 'note']);
    const [p1, p2] = view.sections[0].groups;
    expect([p1.title, p2.title]).toEqual(['Priorità 1', 'Priorità 2']);
    expect(p1.items[0].action).toBe('Pending Election per ACFS');
    expect(p2.items[0]).toMatchObject({ icon: '⚔️', system: 'LP 254-26', score: 'Victory; 2-0', trend: '⬆️', action: 'War per ACFS' });
    expect(p2.items[0].statuses.map(s => s.emoji)).toEqual(['🆕', '🚨']);
    expect(view.sections[1].groups[0].items[0].action).toBeNull();
    expect(view.sections[2].groups[0].items[0]).toMatchObject({ system: '', action: null, detail: 'Nota libera' });
    expect(view.footerNote).toBe('Grazie a tutti.');
  });
});

describe('ordersView, work for another faction', () => {
  it('names the other faction apart, so the page can highlight it', () => {
    const view = ordersView({ items: [item({ typeKey: 'influence', beneficiary: 'LP 254-25 Free', detail: '38%' })] });
    expect(view.sections[0].groups[0].items[0]).toMatchObject({ action: 'Inf per', beneficiary: 'LP 254-25 Free' });
  });
});

describe('discordInlineToHtml', () => {
  it('turns the Discord Markdown of a detail into HTML', () => {
    expect(discordInlineToHtml('**conquista** di _Apgar City_ e *altro*\nriga')).toBe(
      '<strong>conquista</strong> di <em>Apgar City</em> e <em>altro</em><br />riga',
    );
  });

  it('escapes any markup the text contains', () => {
    expect(discordInlineToHtml('<img src=x onerror="alert(1)"> & **ok**')).toBe(
      '&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; <strong>ok</strong>',
    );
  });
});
