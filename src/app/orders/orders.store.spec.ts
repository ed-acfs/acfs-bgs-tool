import { TestBed } from '@angular/core/testing';
import { SERVER_API_URL } from '../../core/config';
import { createOrderItem } from '../../core/orders';
import { OrdersStore } from './orders.store';

const reply = (status: number, body: unknown) => Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) } as Response);
const shared = (items: unknown[], version: number, by = 'Habba-Nero') => ({
  data: { items, meta: { mention: '@Membro Flotta', footerNote: 'Nota', signature: ':acfs:' }, day: '2099-01-02' },
  version,
  updated_at: '2026-10-18T21:00:00Z',
  updated_by: by,
});

describe('OrdersStore', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let store: OrdersStore;

  beforeEach(() => {
    localStorage.clear();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    store = TestBed.inject(OrdersStore);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('loads the shared draft from the server and adopts it', async () => {
    fetchMock.mockReturnValueOnce(reply(200, shared([createOrderItem('note', 'note')], 3)));

    await store.load();

    expect(fetchMock.mock.calls[0][0]).toBe(`${SERVER_API_URL}/auth/orders/draft`);
    expect(store.items().length).toBe(1);
    expect(store.day()).toBe('2099-01-02');
    expect(store.sync()).toBe('saved');
    expect(store.saved().by).toBe('Habba-Nero');
  });

  it('saves a change with the version it started from', async () => {
    fetchMock.mockReturnValueOnce(reply(200, shared([], 3)));
    await store.load();
    fetchMock.mockReturnValueOnce(reply(200, { version: 4, updated_at: '2026-10-18T21:01:00Z', updated_by: 'WiitifulSky' }));

    store.addItem('note', 'note');
    expect(store.sync()).toBe('pending');
    await store['save']();

    const [url, init] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(url).toBe(`${SERVER_API_URL}/auth/orders/draft`);
    expect(init.method).toBe('PUT');
    expect(JSON.parse(String(init.body)).version).toBe(3);
    expect(store.sync()).toBe('saved');
    expect(store.saved().by).toBe('WiitifulSky');
  });

  it("doesn't overwrite another officer's save: it asks, and can take theirs or keep its own", async () => {
    fetchMock.mockReturnValueOnce(reply(200, shared([], 3)));
    await store.load();
    fetchMock.mockReturnValueOnce(reply(409, { current: shared([createOrderItem('note', 'note'), createOrderItem('note', 'note')], 4) }));

    store.addItem('cantieri', 'construction');
    await store['save']();

    expect(store.sync()).toBe('conflict');
    expect(store.conflict()?.updated_by).toBe('Habba-Nero');
    // While the choice is pending, nothing else is sent.
    store.addItem('note', 'note');
    expect(fetchMock).toHaveBeenCalledTimes(2);

    store.takeTheirs();
    expect(store.items().length).toBe(2);
    expect(store.sync()).toBe('saved');
  });

  it("the first time, a draft kept in this browser becomes the shared one if the server has none", async () => {
    store.addItem('note', 'note');
    fetchMock.mockReset();
    fetchMock
      .mockReturnValueOnce(reply(200, { data: null, version: 0 }))
      .mockReturnValueOnce(reply(200, { version: 1, updated_at: '2026-10-18T21:02:00Z', updated_by: 'WiitifulSky' }));

    await store.load(true);

    const [, init] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(init.method).toBe('PUT');
    expect(JSON.parse(String(init.body)).data.items.length).toBe(1);
    expect(store.sync()).toBe('saved');
  });

  it('publishes the current draft for the members', async () => {
    fetchMock.mockReturnValueOnce(reply(200, shared([createOrderItem('note', 'note')], 3)));
    await store.load();
    fetchMock.mockReturnValueOnce(reply(200, { version: 1, updated_at: '2026-10-18T21:03:00Z', updated_by: 'WiitifulSky' }));

    await store.publish();

    const [url, init] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(url).toBe(`${SERVER_API_URL}/auth/orders/publish`);
    expect(JSON.parse(String(init.body)).data.items.length).toBe(1);
  });
});
