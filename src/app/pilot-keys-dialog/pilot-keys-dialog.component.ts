import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { formatUtcTime } from '../../core/i18n';
import { AuthService, PilotKey } from '../auth.service';

/**
 * "Chiavi dei piloti", dal menu dell'account, solo per gli ufficiali e solo in italiano (come Ordini
 * e Attività): l'elenco delle chiavi BGS-Tally e la revoca di quella di chi lascia lo Squadrone.
 * Il server non sa da solo chi esce dal server Discord, quindi la revoca la fanno gli ufficiali.
 */
@Component({
  selector: 'app-pilot-keys-dialog',
  imports: [MatButtonModule, MatDialogModule],
  templateUrl: './pilot-keys-dialog.component.html',
  styleUrl: './pilot-keys-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PilotKeysDialogComponent implements OnInit {
  private readonly auth = inject(AuthService);
  protected readonly pilots = signal<PilotKey[] | null>(null);
  protected readonly busy = signal(false);
  protected readonly error = signal(false);

  ngOnInit(): void {
    void this.load();
  }

  protected when(iso: string | null): string {
    return iso ? `${formatUtcTime('it', Date.parse(iso), true)} UTC` : 'mai';
  }

  protected async revoke(pilot: PilotKey): Promise<void> {
    const who = pilot.discord_name ? `${pilot.name} (${pilot.discord_name})` : pilot.name;
    if (!window.confirm(`Revocare la chiave di ${who}? Il suo plugin smette subito di inviare. Se è ancora nel server Discord, potrà generarsene una nuova dal tool.`)) {
      return;
    }
    this.busy.set(true);
    try {
      await this.auth.revokePilotKey(pilot.id);
      await this.load();
    } catch {
      this.error.set(true);
    } finally {
      this.busy.set(false);
    }
  }

  private async load(): Promise<void> {
    this.error.set(false);
    try {
      this.pilots.set(await this.auth.pilotKeys());
    } catch {
      this.error.set(true);
    }
  }
}
