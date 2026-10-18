import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { SERVER_API_URL, STORAGE_PREFIX } from '../../core/config';
import { WorkResponse, WorkTick, describeWork } from '../../core/work';
import { AuthService } from '../auth.service';

/** Dove le versioni fino alla 1.5.3 ricordavano la password degli ufficiali: si cancella. */
const OLD_PASSWORD_KEY = `${STORAGE_PREFIX}officers-password`;
const TICKS = 5;
const TIMEOUT_MS = 10_000;

/**
 * "Attività (beta)": il lavoro BGS ricevuto da BGS-Tally, per tick, sistema e pilota. Riservato agli
 * ufficiali: si entra con l'accesso con Discord (ruolo da ufficiale), e il controllo lo fa il server
 * (acfs-server, /v1/work), quindi senza permesso i dati non arrivano proprio. Solo in italiano.
 */
@Component({
  selector: 'app-work-page',
  imports: [RouterLink, MatButtonModule],
  templateUrl: './work-page.component.html',
  styleUrl: './work-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkPageComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  protected readonly state = signal<'locked' | 'loading' | 'ready'>('locked');
  protected readonly error = signal<string | null>(null);
  protected readonly ticks = signal<WorkTick[]>([]);
  protected readonly describe = describeWork;

  async ngOnInit(): Promise<void> {
    try {
      localStorage.removeItem(OLD_PASSWORD_KEY);
    } catch {
      // Niente da cancellare.
    }
    await this.auth.load();
    if (this.auth.session()?.officer) {
      void this.load();
    }
  }

  protected async load(): Promise<void> {
    if (this.auth.session()?.officer !== true || !SERVER_API_URL) {
      this.state.set('locked');
      return;
    }
    this.state.set('loading');
    this.error.set(null);
    try {
      const response = await fetch(`${SERVER_API_URL}/v1/work?ticks=${TICKS}`, {
        credentials: 'include',
        cache: 'no-store',
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!response.ok) {
        this.error.set(this.messageFor(response.status));
        this.state.set('locked');
        return;
      }
      const body = (await response.json()) as WorkResponse;
      this.ticks.set(body.ticks ?? []);
      this.state.set('ready');
    } catch {
      this.error.set('Server dello squadrone non raggiungibile. Riprova fra poco.');
      this.state.set(this.ticks().length ? 'ready' : 'locked');
    }
  }

  /** "17 ott 2026, 16:25 UTC". */
  protected tickLabel(tick: WorkTick): string {
    if (!tick.ticktime) {
      return tick.tickid;
    }
    const date = new Date(tick.ticktime);
    return `${date.toLocaleString('it-IT', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} UTC`;
  }

  private messageFor(status: number): string {
    switch (status) {
      case 401:
        return 'Sessione scaduta: accedi di nuovo con Discord.';
      case 403:
        return 'Riservato agli ufficiali.';
      default:
        return `Errore del server (${status}).`;
    }
  }
}
