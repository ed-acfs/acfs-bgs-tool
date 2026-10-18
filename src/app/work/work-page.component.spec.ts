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

  beforeEach(() => {
    localStorage.clear();
    fetchMock = vi.fn((url: string, init: RequestInit) => {
      const auth = (init.headers as Record<string, string>)['Authorization'];
      const ok = url.startsWith(`${SERVER_API_URL}/v1/work`) && auth === 'Bearer giusta';
      return Promise.resolve({ ok, status: ok ? 200 : 401, json: () => Promise.resolve(WORK) } as Response);
    });
    vi.stubGlobal('fetch', fetchMock);
    TestBed.configureTestingModule({ imports: [WorkPageComponent], providers: [provideRouter([])] });
    fixture = TestBed.createComponent(WorkPageComponent);
  });

  afterEach(() => vi.unstubAllGlobals());

  async function enter(password: string) {
    const host: HTMLElement = fixture.nativeElement;
    const input = host.querySelector<HTMLInputElement>('input[type="password"]')!;
    input.value = password;
    input.dispatchEvent(new Event('input'));
    host.querySelector<HTMLButtonElement>('.work-gate button')!.click();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('asks the password, refuses a wrong one and forgets it', async () => {
    fixture.detectChanges();
    await enter('sbagliata');

    const host: HTMLElement = fixture.nativeElement;
    expect(host.querySelector('.work-error')!.textContent).toContain('Password sbagliata');
    expect(localStorage.getItem(`${STORAGE_PREFIX}officers-password`)).toBeNull();
  });

  it('shows the work per system and pilot with the right password, and remembers it', async () => {
    fixture.detectChanges();
    await enter('giusta');

    const host: HTMLElement = fixture.nativeElement;
    expect(host.querySelector('.work-tick h2')!.textContent).toContain('17 ott 2026');
    expect(host.querySelector('.work-system h3')!.textContent).toBe('LP 254-26');
    expect(host.querySelector('.work-total')!.textContent).toBe('CBs 13,08 M · CZ spaziali H×3');
    expect([...host.querySelectorAll('.work-pilot')].map(e => e.textContent)).toEqual(['Gabolander', 'Marziano Inside']);
    expect(localStorage.getItem(`${STORAGE_PREFIX}officers-password`)).toBe('giusta');
  });
});
