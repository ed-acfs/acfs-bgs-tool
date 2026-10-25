import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { InfluenceTrend } from '../../core/influence-history';
import { I18nService } from '../i18n.service';

/** Drawing size of the sparkline in px; the points sit inside a margin that leaves room for the end dot. */
const WIDTH = 48;
const HEIGHT = 16;
const MARGIN = 3;

/**
 * Under our influence in the table: a sparkline of the last 30 days and the change in points
 * over the last week (`▲ +2,7 7g`), from the squadron server's history. A button that opens the
 * system's chart. The sparkline's scale always includes zero, so a flat line stays flat and a
 * swing only looks big when it was (as in the Canonn tool's sparkline, MIT).
 */
@Component({
  selector: 'app-influence-trend',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (trend(); as tr) {
      <button type="button" class="trend" [title]="title()" [attr.aria-label]="title()" (click)="open.emit(); $event.stopPropagation()">
        @if (shape(); as s) {
          <svg [attr.width]="width" [attr.height]="height" [attr.viewBox]="'0 0 ' + width + ' ' + height" aria-hidden="true">
            @if (s.line) {
              <polyline class="line" [attr.points]="s.line" fill="none" stroke-linecap="round" stroke-linejoin="round" />
            }
            <circle class="dot" [attr.cx]="s.last[0]" [attr.cy]="s.last[1]" r="2.5" />
          </svg>
        }
        @if (tr.change; as c) {
          <span class="change" [class.change--up]="c.direction === 'up'" [class.change--down]="c.direction === 'down'" aria-hidden="true">
            {{ arrow() }} {{ points() }}<small>{{ i18n.t('trend.daysShort', { days: c.days }) }}</small>
          </span>
        }
      </button>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .trend {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 0;
      border: 0;
      background: none;
      color: inherit;
      font: inherit;
      cursor: pointer;
      line-height: 1;
    }

    .trend:focus-visible {
      outline: 2px solid var(--color-accent);
      outline-offset: 2px;
    }

    .line {
      stroke: var(--color-accent);
      stroke-width: 1.5;
      opacity: 0.7;
    }

    .dot {
      fill: var(--color-accent);
    }

    .change {
      font-size: 0.75rem;
      font-weight: 400;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
      color: var(--color-text-2);
    }

    .change--up {
      color: var(--color-success);
    }

    .change--down {
      color: var(--color-danger);
    }

    small {
      margin-left: 2px;
      font-size: 0.85em;
      opacity: 0.8;
    }
  `,
})
export class InfluenceTrendComponent {
  protected readonly i18n = inject(I18nService);

  /** The system's trend; nothing is drawn without one. */
  readonly trend = input<InfluenceTrend | null>(null);
  /** The button was clicked: open the system's chart. */
  readonly open = output<void>();

  protected readonly width = WIDTH;
  protected readonly height = HEIGHT;

  protected readonly arrow = computed(() => {
    switch (this.trend()?.change?.direction) {
      case 'up':
        return '▲';
      case 'down':
        return '▼';
      default:
        return '▶';
    }
  });

  protected readonly points = computed(() => {
    const change = this.trend()?.change;
    return change ? signedPoints(change.points, this.i18n.decimal) : '';
  });

  protected readonly title = computed(() => {
    const change = this.trend()?.change;
    const changeText = change
      ? this.i18n.t(change.days === 1 ? 'trend.changeOneDay' : 'trend.change', { points: signedPoints(change.points, this.i18n.decimal), days: change.days })
      : this.i18n.t('trend.noChange');
    return `${changeText}\n${this.i18n.t('trend.open')}`;
  });

  protected readonly shape = computed(() => {
    const values = this.trend()?.values ?? [];
    if (values.length === 0) {
      return null;
    }
    const max = Math.max(...values, 0.0001);
    const min = Math.min(...values, 0);
    const span = max - min || 1;
    const points = values.map((value, index) => {
      // One value has no "before": it goes at the latest end, where the dot belongs.
      const along = values.length === 1 ? 1 : index / (values.length - 1);
      return [MARGIN + along * (WIDTH - 2 * MARGIN), MARGIN + (1 - (value - min) / span) * (HEIGHT - 2 * MARGIN)] as const;
    });
    return {
      line: points.length > 1 ? points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ') : '',
      last: points[points.length - 1],
    };
  });
}

/** "+2,7", "−0,4", "0,0" in the language's style. */
export function signedPoints(points: number, decimal: (value: number) => string): string {
  const rounded = Math.round(points * 10) / 10;
  if (rounded === 0) {
    return decimal(0);
  }
  return `${rounded > 0 ? '+' : '−'}${decimal(Math.abs(rounded))}`;
}
