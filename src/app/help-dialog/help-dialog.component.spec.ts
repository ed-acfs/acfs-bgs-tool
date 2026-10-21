import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HelpDialogComponent, HelpDialogData } from './help-dialog.component';

describe('HelpDialogComponent', () => {
  async function open(data: HelpDialogData | null): Promise<HTMLElement> {
    await TestBed.configureTestingModule({
      imports: [HelpDialogComponent],
      providers: data ? [{ provide: MAT_DIALOG_DATA, useValue: data }] : [],
    }).compileComponents();
    const fixture = TestBed.createComponent(HelpDialogComponent);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('from the table, only says who writes and who reads the Ordini', async () => {
    const text = (await open(null)).textContent ?? '';
    expect(text).toContain('li scrivono gli ufficiali e si leggono sul Discord');
    expect(text).not.toContain('Aggiorna i numeri');
    expect(text).toContain('Dettagli del sistema');
    expect(text).toContain('La Watchlist è');
  });

  it('from the unlocked Ordini page, explains the Ordini in full', async () => {
    const text = (await open({ orders: true })).textContent ?? '';
    expect(text).toContain('Aggiorna i numeri');
    expect(text).not.toContain('è riservata');
  });
});
