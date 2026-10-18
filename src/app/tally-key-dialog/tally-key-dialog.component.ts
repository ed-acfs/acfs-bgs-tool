import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { formatUtcTime } from '../../core/i18n';
import { AuthService, TallyKeyStatus } from '../auth.service';
import { I18nService } from '../i18n.service';

/**
 * "Chiave BGS-Tally" dal menu dell'account: chiunque sia collegato con Discord si genera, rigenera o
 * revoca la chiave con cui il plugin BGS-Tally manda il suo lavoro al server dello squadrone
 * (fase 8b, passo 4). La chiave si vede solo appena generata. In tre lingue: la usano tutti i piloti.
 */
@Component({
  selector: 'app-tally-key-dialog',
  imports: [MatButtonModule, MatDialogModule],
  templateUrl: './tally-key-dialog.component.html',
  styleUrl: './tally-key-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TallyKeyDialogComponent implements OnInit {
  private readonly auth = inject(AuthService);
  protected readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;
  protected readonly status = signal<TallyKeyStatus | null>(null);
  protected readonly busy = signal(false);
  protected readonly error = signal(false);
  protected readonly copied = signal<'key' | 'url' | null>(null);

  ngOnInit(): void {
    void this.run('GET');
  }

  protected generate(): void {
    if (this.status()?.exists && !window.confirm(this.t('tallyKey.confirmRegenerate'))) {
      return;
    }
    void this.run('POST');
  }

  protected revoke(): void {
    if (window.confirm(this.t('tallyKey.confirmRevoke'))) {
      void this.run('DELETE');
    }
  }

  protected async copy(what: 'key' | 'url', text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.copied.set(what);
      setTimeout(() => this.copied.set(null), 2000);
    } catch {
      // Appunti non disponibili: il testo resta selezionabile a mano.
    }
  }

  protected when(iso: string | null | undefined): string {
    return iso ? `${formatUtcTime(this.i18n.lang(), Date.parse(iso), true)} UTC` : this.t('tallyKey.never');
  }

  private async run(method: 'GET' | 'POST' | 'DELETE'): Promise<void> {
    this.busy.set(true);
    this.error.set(false);
    try {
      this.status.set(await this.auth.tallyKey(method));
    } catch {
      this.error.set(true);
    } finally {
      this.busy.set(false);
    }
  }
}
