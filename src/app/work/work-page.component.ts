import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { SERVER_API_URL, STORAGE_PREFIX } from '../../core/config';
import { WorkResponse, WorkTick, describeWork } from '../../core/work';
import { AuthService } from '../auth.service';

/** Dove si ricorda la password degli ufficiali su questo dispositivo, come la password di "Assegna". */
const PASSWORD_KEY = `${STORAGE_PREFIX}officers-password`;
const TICKS = 5;
const TIMEOUT_MS = 10_000;

/**
 * "Lavoro (beta)": il lavoro BGS ricevuto da BGS-Tally, per tick, sistema e pilota. Riservato agli
 * ufficiali: si entra con l'accesso con Discord (ruolo da ufficiale) o, finché serve, con la password
 * degli ufficiali; in entrambi i casi il controllo lo fa il server (acfs-server, /v1/work), quindi
 * senza permesso i dati non arrivano proprio. Solo in italiano, come gli Ordini.
 */
@Component({
  selector: 'app-work-page',
  imports: [ReactiveFormsModule, RouterLink, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './work-page.component.html',
  styleUrl: './work-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkPageComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  protected readonly passwordControl = new FormControl('', { nonNullable: true });
  protected readonly state = signal<'locked' | 'loading' | 'ready'>('locked');
  protected readonly error = signal<string | null>(null);
  protected readonly ticks = signal<WorkTick[]>([]);
  protected readonly describe = describeWork;

  async ngOnInit(): Promise<void> {
    await this.auth.load();
    if (this.auth.session()?.officer || this.storedPassword()) {
      void this.load();
    }
  }

  /** Si è entrati con la password (e non con Discord): solo allora "Esci" della pagina ha senso. */
  protected usingPassword(): boolean {
    return !this.auth.session()?.officer && this.storedPassword() !== null;
  }

  protected unlock(): void {
    const password = this.passwordControl.value.trim();
    if (!password) {
      return;
    }
    this.store(password);
    this.passwordControl.setValue('');
    void this.load();
  }

  protected lock(): void {
    this.store(null);
    this.ticks.set([]);
    this.error.set(null);
    this.state.set('locked');
  }

  protected async load(): Promise<void> {
    const officer = this.auth.session()?.officer === true;
    const password = officer ? null : this.storedPassword();
    if ((!officer && !password) || !SERVER_API_URL) {
      this.state.set('locked');
      return;
    }
    this.state.set('loading');
    this.error.set(null);
    try {
      const response = await fetch(`${SERVER_API_URL}/v1/work?ticks=${TICKS}`, {
        // Il cookie della sessione Discord, se c'è; altrimenti la password.
        headers: password ? { Authorization: `Bearer ${password}` } : {},
        credentials: 'include',
        cache: 'no-store',
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!response.ok) {
        if (response.status === 401 && password) {
          this.store(null);
        }
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
        return 'Password sbagliata.';
      case 403:
        return 'Riservato agli ufficiali.';
      case 429:
        return 'Troppi tentativi sbagliati: riprova fra qualche minuto.';
      case 503:
        return 'La funzione non è ancora attiva sul server.';
      default:
        return `Errore del server (${status}).`;
    }
  }

  /** Ripiego quando il browser non permette di salvare: la password vale per questa sessione. */
  private memoryPassword: string | null = null;

  private storedPassword(): string | null {
    try {
      return localStorage.getItem(PASSWORD_KEY) ?? this.memoryPassword;
    } catch {
      return this.memoryPassword;
    }
  }

  private store(password: string | null): void {
    this.memoryPassword = password;
    try {
      if (password) {
        localStorage.setItem(PASSWORD_KEY, password);
      } else {
        localStorage.removeItem(PASSWORD_KEY);
      }
    } catch {
      // Storage non disponibile (es. navigazione privata): si richiederà la password la volta dopo.
    }
  }
}
