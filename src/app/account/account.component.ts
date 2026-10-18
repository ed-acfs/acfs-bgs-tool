import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faDiscord } from '@fortawesome/free-brands-svg-icons';
import { faChartColumn, faClipboardList, faKey, faRightFromBracket, faUserLock } from '@fortawesome/free-solid-svg-icons';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';
import { I18nService } from '../i18n.service';
import { PilotKeysDialogComponent } from '../pilot-keys-dialog/pilot-keys-dialog.component';
import { TallyKeyDialogComponent } from '../tally-key-dialog/tally-key-dialog.component';

/**
 * Nell'intestazione: "Accedi con Discord", oppure chi è collegato con un menu. Compare solo se il
 * server dello Squadrone risponde e ha l'accesso configurato; altrimenti niente, e il tool resta
 * quello di sempre. Gli strumenti dello Squadrone stanno nel suo menu, solo in italiano: gli Ordini
 * per membri (lettura) e ufficiali (editor), Attività e Chiavi dei piloti per gli ufficiali.
 */
@Component({
  selector: 'app-account',
  imports: [FaIconComponent, MatButtonModule, MatMenuModule, RouterLink],
  template: `
    @if (auth.session(); as session) {
      <button mat-stroked-button type="button" class="account-chip" [matMenuTriggerFor]="accountMenu" [attr.aria-label]="i18n.t('account.menuAria', { name: session.user.display_name })">
        @if (session.user.avatar_url) {
          <img class="account-avatar" [src]="session.user.avatar_url" alt="" />
        }
        <span class="account-name">{{ session.user.display_name }}</span>
      </button>
      <mat-menu #accountMenu="matMenu">
        <p class="account-level">{{ i18n.t(session.officer ? 'account.officer' : session.member ? 'account.member' : 'account.connected') }}</p>
        @if ((session.officer || session.member) && i18n.isItalian()) {
          <!-- Gli ufficiali scrivono gli Ordini, i membri li leggono. -->
          <a mat-menu-item [routerLink]="session.officer ? '/ordini' : '/ordini/pubblicati'"><fa-icon [icon]="faClipboardList" aria-hidden="true"></fa-icon> Ordini</a>
        }
        @if (session.officer && i18n.isItalian()) {
          <a mat-menu-item routerLink="/activity"><fa-icon [icon]="faChartColumn" aria-hidden="true"></fa-icon> Attività (beta)</a>
          <button mat-menu-item type="button" (click)="openPilotKeys()"><fa-icon [icon]="faUserLock" aria-hidden="true"></fa-icon> Chiavi dei piloti</button>
        }
        <button mat-menu-item type="button" (click)="openTallyKey()">
          <fa-icon [icon]="faKey" aria-hidden="true"></fa-icon> {{ i18n.t('account.tallyKey') }}
        </button>
        <hr class="account-separator" />
        <button mat-menu-item type="button" (click)="auth.logout()">
          <fa-icon [icon]="faRightFromBracket" aria-hidden="true"></fa-icon> {{ i18n.t('account.logout') }}
        </button>
      </mat-menu>
    } @else if (auth.available()) {
      <button mat-stroked-button type="button" (click)="auth.login()">
        <fa-icon class="account-discord" [icon]="faDiscord" aria-hidden="true"></fa-icon>
        {{ i18n.t('account.login') }}
      </button>
    }
    @if (auth.loginMessage(); as message) {
      <span class="account-message" role="status">{{ i18n.t(message) }}</span>
    }
  `,
  styles: `
    :host { position: relative; display: inline-flex; flex-wrap: wrap; align-items: center; gap: 6px; }
    .account-chip { display: inline-flex; align-items: center; gap: 6px; }
    .account-avatar { width: 20px; height: 20px; border-radius: 50%; vertical-align: middle; }
    .account-name { max-width: 14ch; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .account-level { margin: 4px 16px; font-size: 0.8rem; color: var(--color-text-muted); }
    /* Sotto il pulsante e sopra la pagina: compare e sparisce senza spostare l'intestazione. */
    .account-message {
      position: absolute; top: calc(100% + 4px); right: 0; z-index: 2; white-space: nowrap;
      padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;
      color: var(--color-text-2); background: var(--color-surface); box-shadow: 0 1px 4px rgb(0 0 0 / 40%);
    }
    .account-discord { color: #7289da; }
    .account-separator { margin: 4px 0; border: 0; border-top: 1px solid var(--color-border-muted); }
    fa-icon { margin-right: 8px; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  protected readonly i18n = inject(I18nService);
  protected readonly faDiscord = faDiscord;
  protected readonly faRightFromBracket = faRightFromBracket;
  protected readonly faClipboardList = faClipboardList;
  protected readonly faChartColumn = faChartColumn;
  protected readonly faKey = faKey;
  protected readonly faUserLock = faUserLock;
  private readonly dialog = inject(MatDialog);

  /** La propria chiave BGS-Tally: per chiunque sia collegato, in tutte le lingue. */
  protected openTallyKey(): void {
    this.dialog.open(TallyKeyDialogComponent, { autoFocus: 'first-tabbable', restoreFocus: true, maxWidth: 'min(640px, 92vw)' });
  }

  /** Solo ufficiali, solo in italiano: le chiavi di tutti, per revocare quella di chi esce. */
  protected openPilotKeys(): void {
    this.dialog.open(PilotKeysDialogComponent, { autoFocus: 'first-tabbable', restoreFocus: true, maxWidth: 'min(820px, 96vw)' });
  }

  ngOnInit(): void {
    void this.auth.load();
    // Il messaggio del ritorno da Discord resta qualche secondo.
    setTimeout(() => this.auth.loginMessage.set(null), 8000);
  }
}
