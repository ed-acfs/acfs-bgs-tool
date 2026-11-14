import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import type { ArchitectRegistryRow } from '../../core/architect-registry';
import { PROGRESS_GROUPS, ProgressGroup, architectProgress } from '../../core/architect-progress';
import type { BgsRow } from '../../core/bgs';
import { FACTION_NAME } from '../../core/config';
import { I18nService } from '../i18n.service';
import type { MessageKey } from '../../core/i18n';

export interface ArchitectProgressDialogData {
  rows: readonly BgsRow[];
  registry: readonly ArchitectRegistryRow[];
}

/** Colori del grafico settimanale, validati sul tema scuro (skill dataviz): ordine fisso, dal basso. */
export const GROUP_COLORS: Record<ProgressGroup, string> = {
  ours: '#cc7a00',
  other: '#3987e5',
  none: '#199e70',
  notColony: '#9085e9',
};

/** Area dei grafici, in unità del viewBox SVG. */
const W = 600;
const H = 190;
const PAD = { left: 34, right: 12, top: 10, bottom: 24 };

/**
 * Avanzamento del Registro Architetti: numeri in breve, i mancanti nel tempo (con la linea "a questo
 * ritmo" fino alla fine prevista) e le registrazioni per settimana. Grafici in SVG, senza libreria.
 */
@Component({
  selector: 'app-architect-progress-dialog',
  imports: [MatButtonModule, MatDialogModule],
  templateUrl: './architect-progress-dialog.component.html',
  styleUrl: './architect-progress-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArchitectProgressDialogComponent {
  private readonly data = inject<ArchitectProgressDialogData>(MAT_DIALOG_DATA);
  protected readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;
  protected readonly factionName = FACTION_NAME;
  protected readonly now = Date.now();
  protected readonly p = architectProgress(this.data.rows, this.data.registry, FACTION_NAME, this.now);
  protected readonly groups = PROGRESS_GROUPS;
  protected readonly colors = GROUP_COLORS;
  protected readonly W = W;
  protected readonly H = H;
  protected readonly pad = PAD;

  // --- mancanti nel tempo ---------------------------------------------------------------
  private readonly xStart = this.p.burndown[0]?.at ?? this.now;
  private readonly xEnd = Math.max(this.now, this.p.projectedFinish ?? this.now);
  private readonly yMax = Math.max(1, ...this.p.burndown.map(b => b.remaining));

  protected x(ms: number): number {
    const span = Math.max(1, this.xEnd - this.xStart);
    return PAD.left + ((ms - this.xStart) / span) * (W - PAD.left - PAD.right);
  }

  protected y(value: number, max = this.yMax): number {
    return PAD.top + (1 - value / max) * (H - PAD.top - PAD.bottom);
  }

  protected readonly burnPath = this.p.burndown.map((b, i) => `${i ? 'L' : 'M'}${this.x(b.at).toFixed(1)},${this.y(b.remaining).toFixed(1)}`).join(' ');
  protected readonly projection =
    this.p.projectedFinish !== null
      ? { x1: this.x(this.now), y1: this.y(this.p.remaining), x2: this.x(this.p.projectedFinish), y2: this.y(0) }
      : null;
  /** Tre righe di griglia: zero, metà e il massimo. */
  protected readonly burnTicks = [0, Math.round(this.yMax / 2), this.yMax];

  // --- registrazioni per settimana -------------------------------------------------------------
  private readonly barMax = Math.max(1, ...this.p.weeks.map(w => w.total));
  protected readonly barTicks = [0, Math.round(this.barMax / 2), this.barMax];
  protected readonly slotWidth = (W - PAD.left - PAD.right) / Math.max(1, this.p.weeks.length);
  protected readonly barWidth = Math.max(2, Math.min(36, this.slotWidth - 4));

  /** Inizio della colonna di una settimana (anche la zona sensibile al passaggio del mouse). */
  protected s0x(index: number): number {
    return PAD.left + index * this.slotWidth;
  }

  /** I segmenti di una settimana, dal basso, con 2 unità di spazio fra uno e l'altro. */
  protected segments(index: number): { group: ProgressGroup; x: number; y: number; h: number }[] {
    const week = this.p.weeks[index];
    const x = this.s0x(index) + (this.slotWidth - this.barWidth) / 2;
    const out: { group: ProgressGroup; x: number; y: number; h: number }[] = [];
    let below = 0;
    for (const group of PROGRESS_GROUPS) {
      const count = week.counts[group];
      if (!count) {
        continue;
      }
      const bottom = this.barY(below);
      const top = this.barY(below + count);
      const gap = below > 0 ? 2 : 0;
      out.push({ group, x, y: top, h: Math.max(1, bottom - top - gap) });
      below += count;
    }
    return out;
  }

  protected barY(value: number): number {
    return this.y(value, this.barMax);
  }

  protected weekTitle(index: number): string {
    const week = this.p.weeks[index];
    const head = this.t(week.partial ? 'progress.weekPartial' : 'progress.week', { date: this.i18n.shortDate(week.start) });
    const lines = PROGRESS_GROUPS.filter(g => week.counts[g]).map(g => `${this.groupLabel(g)}: ${week.counts[g]}`);
    return [head, ...lines, this.t('progress.weekTotal', { count: week.total })].join('\n');
  }

  protected groupLabel(group: ProgressGroup): string {
    return this.t(`progress.group.${group}` as MessageKey, { faction: FACTION_NAME });
  }

  protected rate(): string {
    return this.p.recentPerWeek === null ? '—' : this.i18n.decimal(this.p.recentPerWeek);
  }
}
