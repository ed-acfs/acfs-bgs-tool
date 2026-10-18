import { TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { AuthService, PilotKey } from '../auth.service';
import { PilotKeysDialogComponent } from './pilot-keys-dialog.component';

const PILOTS: PilotKey[] = [
  { id: 1, name: 'gabolander', discord_id: '1', discord_name: 'Gabolander', created_at: '2026-10-18T12:38:48Z', revoked_at: null, last_seen_at: '2026-10-18T12:43:46Z' },
  { id: 2, name: 'vecchio', discord_id: null, discord_name: null, created_at: '2026-10-18T12:00:00Z', revoked_at: '2026-10-18T13:00:00Z', last_seen_at: null },
];

describe('PilotKeysDialogComponent', () => {
  let auth: { pilotKeys: ReturnType<typeof vi.fn>; revokePilotKey: ReturnType<typeof vi.fn> };

  async function open(): Promise<{ el: HTMLElement; detect: () => Promise<void> }> {
    await TestBed.configureTestingModule({
      imports: [PilotKeysDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
        { provide: AuthService, useValue: auth },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(PilotKeysDialogComponent);
    const detect = async () => {
      await fixture.whenStable();
      fixture.detectChanges();
    };
    await detect();
    return { el: fixture.nativeElement as HTMLElement, detect };
  }

  beforeEach(() => {
    auth = { pilotKeys: vi.fn().mockResolvedValue(PILOTS), revokePilotKey: vi.fn().mockResolvedValue(undefined) };
  });

  afterEach(() => vi.restoreAllMocks());

  it('lists the keys, with a Revoke button only on the active ones', async () => {
    const { el } = await open();
    const rows = [...el.querySelectorAll('tbody tr')];
    expect(rows.map(r => r.querySelector('code')?.textContent)).toEqual(['gabolander', 'vecchio']);
    expect(rows[0].textContent).toContain('Gabolander');
    expect(rows[1].textContent).toContain('data a mano');
    expect(rows[1].textContent).toContain('revocata il');
    expect(el.querySelectorAll('tbody button').length).toBe(1);
  });

  it('revokes a key after confirmation and reloads the list', async () => {
    const { el, detect } = await open();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    (el.querySelector('tbody button') as HTMLButtonElement).click();
    await detect();

    expect(auth.revokePilotKey).toHaveBeenCalledWith(1);
    expect(auth.pilotKeys).toHaveBeenCalledTimes(2);
  });

  it('does nothing if the officer cancels', async () => {
    const { el } = await open();
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    (el.querySelector('tbody button') as HTMLButtonElement).click();
    expect(auth.revokePilotKey).not.toHaveBeenCalled();
  });
});
