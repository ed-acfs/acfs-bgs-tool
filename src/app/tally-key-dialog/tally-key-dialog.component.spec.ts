import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { AuthService, TallyKeyError, TallyKeyStatus } from '../auth.service';
import { TallyKeyDialogComponent } from './tally-key-dialog.component';

const SERVER_URL = 'https://api.flottastellare.it/tally/';

describe('TallyKeyDialogComponent', () => {
  let fixture: ComponentFixture<TallyKeyDialogComponent>;
  let auth: { tallyKey: ReturnType<typeof vi.fn> };

  async function open(status: TallyKeyStatus | Error): Promise<HTMLElement> {
    auth = {
      tallyKey: status instanceof Error ? vi.fn().mockRejectedValue(status) : vi.fn().mockResolvedValue(status),
    };
    await TestBed.configureTestingModule({
      imports: [TallyKeyDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
        { provide: AuthService, useValue: auth },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(TallyKeyDialogComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  function buttons(el: HTMLElement): string[] {
    return [...el.querySelectorAll('mat-dialog-actions button')].map(b => b.textContent!.trim());
  }

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('acfs-bgs:lang', 'it');
  });

  afterEach(() => vi.restoreAllMocks());

  it('offers to generate a key to a pilot who has none', async () => {
    const el = await open({ exists: false, server_url: SERVER_URL });
    expect(auth.tallyKey).toHaveBeenCalledWith('GET');
    expect(el.textContent).toContain('Non hai ancora una chiave.');
    expect(buttons(el)).toEqual(['Genera la chiave', 'Chiudi']);
  });

  it('warns about the BGS-Tally version and invites to send data to EDDN', async () => {
    const el = await open({ exists: false, server_url: SERVER_URL });
    expect(el.querySelector('.tally-key-warning')!.textContent).toContain('5.6.1');
    expect(el.querySelector('.tally-key-eddn')!.textContent).toContain('EDDN');
  });

  it('shows the new key once, with the server URL and the steps for the plugin', async () => {
    const el = await open({ exists: false, server_url: SERVER_URL });
    auth.tallyKey.mockResolvedValue({ exists: true, created_at: '2026-10-18T10:00:00Z', server_url: SERVER_URL, key: 'abc123' });
    (el.querySelector('mat-dialog-actions button') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(auth.tallyKey).toHaveBeenLastCalledWith('POST');
    const values = [...el.querySelectorAll('input')].map(i => i.value);
    expect(values).toEqual([SERVER_URL, 'abc123']);
    expect(el.querySelectorAll('ol li').length).toBe(4);
    expect(buttons(el)).toEqual(['Revoca', 'Rigenera', 'Chiudi']);
  });

  it('asks before replacing an active key, and does nothing if the pilot says no', async () => {
    const el = await open({ exists: true, created_at: '2026-10-18T10:00:00Z', last_seen_at: null, server_url: SERVER_URL });
    expect(el.textContent).toContain('Chiave attiva');
    expect(el.textContent).toContain('mai');
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    ([...el.querySelectorAll('mat-dialog-actions button')][1] as HTMLButtonElement).click();

    expect(confirm).toHaveBeenCalled();
    expect(auth.tallyKey).toHaveBeenCalledTimes(1);
  });

  it('revokes the key after confirmation', async () => {
    const el = await open({ exists: true, created_at: '2026-10-18T10:00:00Z', server_url: SERVER_URL });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    auth.tallyKey.mockResolvedValue({ exists: false, revoked_at: '2026-10-18T11:00:00Z', server_url: SERVER_URL });
    (el.querySelector('mat-dialog-actions button') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(auth.tallyKey).toHaveBeenLastCalledWith('DELETE');
    expect(el.textContent).toContain('Chiave revocata il');
  });

  it('says so when the squadron server does not answer', async () => {
    const el = await open(new Error('HTTP 502'));
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('non risponde');
    expect(buttons(el)).toEqual(['Chiudi']);
  });

  it('renames the key, and says so when the name belongs to another pilot', async () => {
    const el = await open({ exists: true, name: 'wiitifulsky', created_at: '2026-10-18T10:00:00Z', server_url: SERVER_URL });
    expect(el.querySelector('.tally-key-name code')?.textContent).toBe('wiitifulsky');
    (el.querySelector('.tally-key-name button') as HTMLButtonElement).click();
    fixture.detectChanges();
    const input = el.querySelector('form.tally-key-name input') as HTMLInputElement;
    input.value = 'Gabolander';
    input.dispatchEvent(new Event('input'));
    auth.tallyKey.mockRejectedValueOnce(new TallyKeyError(409));
    (el.querySelector('form.tally-key-name') as HTMLFormElement).dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(auth.tallyKey).toHaveBeenLastCalledWith('PATCH', { name: 'Gabolander' });
    expect(el.querySelector('form [role="alert"]')?.textContent).toContain('già di un altro pilota');

    auth.tallyKey.mockResolvedValueOnce({ exists: true, name: 'skyflash', created_at: '2026-10-18T10:00:00Z', server_url: SERVER_URL });
    input.value = 'Sky Flash';
    input.dispatchEvent(new Event('input'));
    (el.querySelector('form.tally-key-name') as HTMLFormElement).dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(el.querySelector('form.tally-key-name')).toBeNull();
    expect(el.querySelector('.tally-key-name code')?.textContent).toBe('skyflash');
  });
});
