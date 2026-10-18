import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SERVER_API_URL, STORAGE_PREFIX } from '../../core/config';
import { WorkPageComponent } from './work-page.component';

const WORK = {
  ticks: [
    {
      tickid: 't1',
      ticktime: '2026-10-17T16:25:00Z',
      systems: [
        {
          system_address: '1',
          system_name: 'LP 254-26',
          totals: { cbs: 13_080_000, spacecz_high: 3 },
          pilots: [
            { pilot: 'Gabolander', cmdr: 'Gabolander', updated_at: '2026-10-18T13:00:00Z', totals: { cbs: 9_260_000, spacecz_high: 3 } },
            { pilot: 'Marziano-Inside', cmdr: 'Marziano Inside', updated_at: '2026-10-18T13:00:00Z', totals: { cbs: 3_820_000 } },
          ],
        },
      ],
    },
  ],
};

describe('WorkPageComponent', () => {
  let fixture: ComponentFixture<WorkPageComponent>;
  let fetchMock: ReturnType<typeof vi.fn>;
  /** Cosa risponde /auth/me: nessuno collegato, salvo dove il test lo cambia. */
  let me: object;

  beforeEach(() => {
    localStorage.clear();
    me = { logged_in: false, configured: true };
    fetchMock = vi.fn((url: string, init: RequestInit) => {
      if (url === `${SERVER_API_URL}/auth/me`) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(me) } as Response);
      }
      const officerSession = (me as { officer?: boolean }).officer === true && init.credentials === 'include';
      const ok = url.startsWith(`${SERVER_API_URL}/v1/work`) && officerSession;
      return Promise.resolve({ ok, status: ok ? 200 : 401, json: () => Promise.resolve(WORK) } as Response);
    });
    vi.stubGlobal('fetch', fetchMock);
    TestBed.configureTestingModule({ imports: [WorkPageComponent], providers: [provideRouter([])] });
    fixture = TestBed.createComponent(WorkPageComponent);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('without Discord offers only "Accedi con Discord": no password any more, and the old one is forgotten', async () => {
    localStorage.setItem(`${STORAGE_PREFIX}officers-password`, 'vecchia');
    fixture.detectChanges();

    const host: HTMLElement = fixture.nativeElement;
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect([...host.querySelectorAll('button')].some(b => b.textContent!.trim() === 'Accedi con Discord')).toBe(true);
    });
    expect(host.querySelector('input[type="password"]')).toBeNull();
    expect(localStorage.getItem(`${STORAGE_PREFIX}officers-password`)).toBeNull();
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/v1/work'))).toBe(false);
  });

  const user = { id: '1', username: 'witifulsky', display_name: 'WiitifulSky', avatar_url: null };

  it('shows the work per system and pilot to an officer signed in with Discord', async () => {
    me = { logged_in: true, user, member: true, officer: true };
    fixture.detectChanges();

    const host: HTMLElement = fixture.nativeElement;
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(host.querySelector('.work-system h3')?.textContent).toBe('LP 254-26');
    });
    expect(host.querySelector('.work-tick h2')!.textContent).toContain('17 ott 2026');
    expect(host.querySelector('.work-total')!.textContent!.replace(/\s+/g, ' ').trim()).toBe('CBs 13,1M CZ Spaziali H x 3');
    expect([...host.querySelectorAll('.work-pilot')].map(e => e.textContent)).toEqual(['Gabolander', 'Marziano Inside']);
  });

  it('tells a signed-in member who is not an officer that the page is reserved', async () => {
    me = { logged_in: true, user, member: true, officer: false };
    fixture.detectChanges();

    const host: HTMLElement = fixture.nativeElement;
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(host.textContent).toContain('Sei collegato come WiitifulSky, ma la pagina è riservata agli ufficiali.');
    });
    expect(host.querySelector('.work-system')).toBeNull();
  });
});
