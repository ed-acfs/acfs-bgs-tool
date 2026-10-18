import { Injectable, signal } from '@angular/core';
import { SERVER_API_URL } from '../core/config';
import { MessageKey } from '../core/i18n';
import { logger } from '../core/logger';

/** Chi è collegato, come lo dice `/auth/me` del server (acfs-server, auth.mjs). */
export interface AuthSession {
  user: { id: string; username: string; display_name: string; avatar_url: string | null };
  /** Membro dello Squadrone (Membro Flotta, Cadetto) o ufficiale. */
  member: boolean;
  /** Ammiraglio, Vice Ammiraglio, Contrammiraglio: Attività, e poi Ordini e Assegna. */
  officer: boolean;
}

/** La chiave BGS-Tally del pilota collegato, come la dà `/auth/tally-key`. */
/** Risposta non riuscita di `/auth/tally-key`: 400 nome non valido, 409 nome già preso. */
export class TallyKeyError extends Error {
  constructor(readonly status: number) {
    super(`HTTP ${status}`);
  }
}

/** Una chiave BGS-Tally nell'elenco degli ufficiali (`/auth/tally-keys`): mai la chiave, solo i suoi dati. */
export interface PilotKey {
  id: number;
  name: string;
  discord_id: string | null;
  /** Il nome Discord dall'ultima sessione del pilota, se ne ha una. */
  discord_name: string | null;
  created_at: string;
  revoked_at: string | null;
  last_seen_at: string | null;
}

export interface TallyKeyStatus {
  exists: boolean;
  /** Il nome della chiave (lettere minuscole e cifre), che ne è anche l'inizio; null se non è mai stata creata. */
  name?: string | null;
  created_at?: string;
  revoked_at?: string | null;
  last_seen_at?: string | null;
  /** L'indirizzo da inserire nel plugin ("Url Server"). */
  server_url: string;
  /** Solo nella risposta che la genera: dopo non si vede più. */
  key?: string;
}

/** Esito del ritorno da Discord (`?login=` nell'indirizzo), come chiave del messaggio da mostrare. */
const LOGIN_MESSAGES: Record<string, MessageKey> = {
  ok: 'account.loginOk',
  negato: 'account.loginDenied',
  annullato: 'account.loginCancelled',
  scaduto: 'account.loginExpired',
  errore: 'account.loginError',
};
const TIMEOUT_MS = 6000;

/**
 * L'accesso con Discord (fase 8b della roadmap): il server tiene la sessione in un cookie suo,
 * qui si chiede solo chi è collegato. Senza server o senza risposta il tool resta quello di sempre:
 * il login abilita gli strumenti degli ufficiali, non serve a consultare.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  /** undefined: non ancora chiesto; null: nessuno collegato (o server non raggiungibile). */
  readonly session = signal<AuthSession | null | undefined>(undefined);
  /** Il server ha risposto e l'accesso con Discord è configurato: solo allora si offre il pulsante. */
  readonly available = signal(false);
  /** Messaggio del ritorno da Discord, da mostrare una volta. */
  readonly loginMessage = signal<MessageKey | null>(null);
  private loading?: Promise<void>;

  /** Chiede al server chi è collegato, una volta per pagina; legge e toglie `?login=` dall'indirizzo. */
  load(): Promise<void> {
    this.readLoginResult();
    this.loading ??= this.fetchSession();
    return this.loading;
  }

  /** Verso Discord; al ritorno si torna qui. */
  login(): void {
    if (!SERVER_API_URL) {
      return;
    }
    const back = new URL(window.location.href);
    back.searchParams.delete('login');
    window.location.assign(`${SERVER_API_URL}/auth/discord/login?return=${encodeURIComponent(back.toString())}`);
  }

  async logout(): Promise<void> {
    try {
      await fetch(`${SERVER_API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'X-Requested-With': 'acfs-bgs-tool' },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (error) {
      logger.warn('Logout non riuscito sul server.', error);
    }
    this.session.set(null);
  }

  /** La propria chiave BGS-Tally: stato (GET), nuova o rigenerata (POST, con la chiave in chiaro), revoca (DELETE). */
  async tallyKey(method: 'GET' | 'POST' | 'DELETE'): Promise<TallyKeyStatus>;
  async tallyKey(method: 'PATCH', body: { name: string }): Promise<TallyKeyStatus>;
  async tallyKey(method: 'GET' | 'POST' | 'PATCH' | 'DELETE', body?: { name: string }): Promise<TallyKeyStatus> {
    const response = await fetch(`${SERVER_API_URL}/auth/tally-key`, {
      method,
      credentials: 'include',
      cache: 'no-store',
      headers: {
        ...(method === 'GET' ? {} : { 'X-Requested-With': 'acfs-bgs-tool' }),
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new TallyKeyError(response.status);
    }
    return (await response.json()) as TallyKeyStatus;
  }

  /** Solo ufficiali: le chiavi di tutti i piloti. */
  async pilotKeys(): Promise<PilotKey[]> {
    const response = await fetch(`${SERVER_API_URL}/auth/tally-keys`, {
      credentials: 'include',
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new TallyKeyError(response.status);
    }
    return ((await response.json()) as { pilots: PilotKey[] }).pilots;
  }

  /** Solo ufficiali: revoca la chiave di un pilota. */
  async revokePilotKey(id: number): Promise<void> {
    const response = await fetch(`${SERVER_API_URL}/auth/tally-keys/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'X-Requested-With': 'acfs-bgs-tool' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new TallyKeyError(response.status);
    }
  }

  private async fetchSession(): Promise<void> {
    if (!SERVER_API_URL) {
      this.session.set(null);
      return;
    }
    try {
      const response = await fetch(`${SERVER_API_URL}/auth/me`, {
        credentials: 'include',
        cache: 'no-store',
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      const body = (await response.json()) as Partial<AuthSession> & { logged_in?: boolean; configured?: boolean };
      this.available.set(Boolean(body.logged_in || body.configured));
      this.session.set(body.logged_in && body.user ? { user: body.user, member: Boolean(body.member), officer: Boolean(body.officer) } : null);
    } catch (error) {
      logger.warn('Server dello Squadrone non raggiungibile: accesso con Discord non disponibile.', error);
      this.available.set(false);
      this.session.set(null);
    }
  }

  private readLoginResult(): void {
    const url = new URL(window.location.href);
    const result = url.searchParams.get('login');
    if (result === null) {
      return;
    }
    this.loginMessage.set(LOGIN_MESSAGES[result] ?? 'account.loginError');
    url.searchParams.delete('login');
    history.replaceState(history.state, '', url.toString());
  }
}
