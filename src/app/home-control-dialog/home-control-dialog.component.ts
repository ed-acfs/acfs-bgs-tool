import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import type { BgsRow } from '../../core/bgs';
import { FACTION_NAME } from '../../core/config';
import { homeControl } from '../../core/home-control';
import { I18nService } from '../i18n.service';

export interface HomeControlDialogData {
  rows: readonly BgsRow[];
}

/**
 * Chi controlla i nostri sistemi: una barra per fazione (vedi core/home-control.ts), aperta dal
 * pulsante "Nostri sistemi" in alto. Barre in CSS, senza libreria di grafici.
 */
@Component({
  selector: 'app-home-control-dialog',
  imports: [MatButtonModule, MatDialogModule],
  templateUrl: './home-control-dialog.component.html',
  styleUrl: './home-control-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeControlDialogComponent {
  private readonly data = inject<HomeControlDialogData>(MAT_DIALOG_DATA);
  protected readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;
  protected readonly factionName = FACTION_NAME;
  protected readonly stats = homeControl(this.data.rows, FACTION_NAME);
  /** La barra più lunga occupa tutta la larghezza; le altre in proporzione. */
  private readonly max = Math.max(1, ...this.stats.controllers.map(c => c.count));
  protected readonly ours = this.stats.controllers.find(c => c.faction === FACTION_NAME)?.count ?? 0;

  protected width(count: number): string {
    return `${(count / this.max) * 100}%`;
  }

  protected share(count: number): string {
    return this.i18n.percent(this.stats.total ? (count / this.stats.total) * 100 : 0);
  }

  protected label(faction: string | null, others: boolean): string {
    return others ? this.t('home.others') : (faction ?? this.t('home.unknown'));
  }
}
