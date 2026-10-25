import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { FACTION_NAME } from '../../core/config';
import { LOCALES } from '../../core/i18n';
import {
  ConflictSpan,
  FactionSeries,
  axisMax,
  axisTicks,
  buildConflictSpans,
  buildSeries,
  conflictStanding,
  conflictsAt,
  nearestIndex,
  snapshotTimes,
  timeTicks,
  valueAt,
} from '../../core/influence-history';
import { BgsService } from '../bgs.service';
import { I18nService } from '../i18n.service';

/** The system whose history the dialog charts. */
export interface InfluenceChartDialogData {
  systemName: string;
  systemAddress: string;
}

/** Days of history the chart asks the server for. */
const HISTORY_DAYS = 30;

/** Drawing space of the SVG (its viewBox); the element itself scales to the dialog's width. */
const WIDTH = 780;
const HEIGHT = 340;
const MARGIN = { left: 48, right: 20, top: 14, bottom: 32 };
const X_TICKS = 6;

/** Flotta Stellare is the site's orange, as in the Factions chart; nobody else gets an orange. Cycled A-Z, so a faction keeps its colour. */
const OTHER_COLOURS: readonly string[] = ['#4dabf7', '#51cf66', '#b197fc', '#22d3ee', '#f06595', '#e9ecef', '#8ce99a', '#748ffc'];

/** A drag on the plot shorter than this (in drawing units) is a click, not a zoom. */
const MIN_SELECTION = 6;
const DAY_MS = 24 * 60 * 60 * 1000;

type Status = 'loading' | 'ready' | 'empty' | 'error';

/** One faction's line on the chart. */
interface ChartLine {
  key: string;
  label: string;
  colour: string;
  heavy: boolean;
  visible: boolean;
  /** SVG polyline points; empty when there is just the one reading. */
  path: string;
  dots: { x: number; y: number }[];
  /** The latest value, for the legend. */
  latest: string;
}

/**
 * A system's influence over the last 30 days, every faction in it, from the squadron server's
 * history: opened from the trend under our influence in the table. Plain SVG, like the rest of
 * the page; hover (or the arrow keys) reads every faction at a reading, a drag zooms in, and wars
 * and elections are shaded bands. Adapted from the Canonn tool's chart (canonn-colony-operations, MIT).
 */
@Component({
  selector: 'app-influence-chart-dialog',
  imports: [MatButtonModule, MatDialogModule],
  templateUrl: './influence-chart-dialog.component.html',
  styleUrl: './influence-chart-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfluenceChartDialogComponent implements OnInit {
  private readonly bgsService = inject(BgsService);
  private readonly data = inject<InfluenceChartDialogData>(MAT_DIALOG_DATA);
  protected readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;

  protected readonly systemName = this.data.systemName;
  protected readonly days = HISTORY_DAYS;
  protected readonly width = WIDTH;
  protected readonly height = HEIGHT;
  protected readonly plot = {
    left: MARGIN.left,
    right: WIDTH - MARGIN.right,
    top: MARGIN.top,
    bottom: HEIGHT - MARGIN.bottom,
  };

  protected readonly status = signal<Status>('loading');
  private readonly series = signal<FactionSeries[]>([]);
  private readonly conflicts = signal<ConflictSpan[]>([]);
  /** Factions switched off in the legend. */
  private readonly hidden = signal<ReadonlySet<string>>(new Set());
  /** The reading the pointer or keyboard is on, as an index into {@link times}. */
  protected readonly hoverIndex = signal<number | null>(null);
  /** The zoomed-in time range, or null for the whole history. */
  protected readonly zoom = signal<{ from: number; to: number } | null>(null);
  /** The selection being dragged, as x positions in drawing units. */
  protected readonly selection = signal<{ from: number; to: number } | null>(null);

  private readonly allTimes = computed(() => snapshotTimes(this.series()));
  private readonly dataStart = computed(() => this.allTimes()[0] ?? 0);
  private readonly dataEnd = computed(() => this.allTimes()[this.allTimes().length - 1] ?? 0);
  private readonly start = computed(() => this.zoom()?.from ?? this.dataStart());
  private readonly end = computed(() => this.zoom()?.to ?? this.dataEnd());
  /** The readings in view: the places the hover can land. */
  protected readonly times = computed(() => this.allTimes().filter(t => t >= this.start() && t <= this.end()));
  protected readonly max = computed(() => axisMax(this.series()));

  protected readonly yTicks = computed(() => axisTicks(this.max()).map(value => ({ value, y: this.y(value) })));
  protected readonly xTicks = computed(() => {
    const short = this.end() - this.start() < 3 * DAY_MS;
    return timeTicks(this.start(), this.end(), X_TICKS).map(time => ({
      time,
      x: this.x(time),
      label: short ? this.formatMoment(time) : this.formatDay(time),
    }));
  });
  /** Each war and election as a shaded band; open ones run to the end of the history. */
  protected readonly bands = computed(() =>
    this.conflicts().map(c => {
      const x1 = this.x(c.start);
      const x2 = this.x(c.end ?? this.dataEnd());
      return { family: c.family, x: x1, width: Math.max(2, x2 - x1) };
    }),
  );
  protected readonly hasWars = computed(() => this.conflicts().some(c => c.family === 'war'));
  protected readonly hasElections = computed(() => this.conflicts().some(c => c.family === 'election'));
  protected readonly selectionBox = computed(() => {
    const s = this.selection();
    return s ? { x: Math.min(s.from, s.to), width: Math.abs(s.to - s.from) } : null;
  });

  protected readonly lines = computed<ChartLine[]>(() => {
    const hidden = this.hidden();
    const others = this.series().filter(s => !s.ours).map(s => s.name);
    return this.series().map<ChartLine>(s => {
      const dots = s.points.map(p => ({ x: this.x(p.time), y: this.y(p.value) }));
      return {
        key: s.name,
        label: s.name,
        colour: s.ours ? 'var(--color-accent)' : OTHER_COLOURS[others.indexOf(s.name) % OTHER_COLOURS.length],
        heavy: s.ours,
        visible: !hidden.has(s.name),
        path: dots.length > 1 ? dots.map(d => `${d.x.toFixed(1)},${d.y.toFixed(1)}`).join(' ') : '',
        dots,
        latest: this.i18n.percent(s.points[s.points.length - 1].value),
      };
    });
  });

  /** What the tooltip lists at the hovered reading: the conflicts on, then each visible faction, highest first. */
  protected readonly tooltip = computed(() => {
    const index = this.hoverIndex();
    const times = this.times();
    if (index === null || index < 0 || index >= times.length) {
      return null;
    }
    const time = times[index];
    const hidden = this.hidden();
    const x = this.x(time);
    const colours = new Map(this.lines().map(l => [l.key, l.colour]));
    const entries = this.series()
      .filter(s => !hidden.has(s.name))
      .map(s => ({ s, value: valueAt(s, time) }))
      .filter((entry): entry is { s: FactionSeries; value: number } => entry.value !== null)
      .sort((a, b) => b.value - a.value)
      .map(({ s, value }) => ({ label: s.name, colour: colours.get(s.name) ?? 'currentColor', value }));
    return {
      when: this.formatMoment(time),
      conflicts: conflictsAt(this.conflicts(), time).map(c => this.describeConflict(c)),
      rows: entries.map(e => ({ label: e.label, colour: e.colour, value: this.i18n.percent(e.value) })),
      dots: entries.map(e => ({ x, y: this.y(e.value), colour: e.colour })),
      x,
      percent: (x / WIDTH) * 100,
    };
  });

  ngOnInit(): void {
    void this.load();
  }

  protected retry(): void {
    void this.load();
  }

  protected toggle(key: string): void {
    this.hidden.update(current => {
      const next = new Set(current);
      if (!next.delete(key)) {
        next.add(key);
      }
      return next;
    });
  }

  /** Puts the hover on the reading nearest the pointer, or grows the selection while dragging. */
  protected onPointerMove(event: PointerEvent): void {
    const x = this.drawingX(event);
    if (x === null) {
      return;
    }
    const selection = this.selection();
    if (selection) {
      this.selection.set({ from: selection.from, to: x });
      this.hoverIndex.set(null);
      return;
    }
    const index = nearestIndex(this.times(), this.timeAt(x));
    this.hoverIndex.set(index >= 0 ? index : null);
  }

  protected onPointerLeave(): void {
    if (!this.selection()) {
      this.hoverIndex.set(null);
    }
  }

  /** Starts a drag-to-zoom selection (primary button only; the pointer is captured so the drag can leave the chart). */
  protected onPointerDown(event: PointerEvent): void {
    const x = this.drawingX(event);
    if (x === null || event.button !== 0) {
      return;
    }
    (event.currentTarget as SVGGraphicsElement).setPointerCapture(event.pointerId);
    this.selection.set({ from: x, to: x });
  }

  /** Zooms to the dragged selection, if it is wide enough to mean it. */
  protected onPointerUp(): void {
    const box = this.selectionBox();
    this.selection.set(null);
    if (!box || box.width < MIN_SELECTION) {
      return;
    }
    const from = this.timeAt(box.x);
    const to = this.timeAt(box.x + box.width);
    if (to > from) {
      this.zoom.set({ from, to });
      this.hoverIndex.set(null);
    }
  }

  protected onPointerCancel(): void {
    this.selection.set(null);
  }

  protected resetZoom(): void {
    this.zoom.set(null);
    this.hoverIndex.set(null);
  }

  /** Left and right arrows step between readings; Escape clears the hover or the zoom (and, as usual, then closes the dialog). */
  protected onKeyDown(event: KeyboardEvent): void {
    const count = this.times().length;
    if (count === 0) {
      return;
    }
    const current = this.hoverIndex();
    if (event.key === 'ArrowRight') {
      this.hoverIndex.set(current === null ? count - 1 : Math.min(count - 1, current + 1));
      event.preventDefault();
    } else if (event.key === 'ArrowLeft') {
      this.hoverIndex.set(current === null ? count - 1 : Math.max(0, current - 1));
      event.preventDefault();
    } else if (event.key === 'Escape' && (current !== null || this.selection() || this.zoom())) {
      if (this.selection()) {
        this.selection.set(null);
      } else if (current !== null) {
        this.hoverIndex.set(null);
      } else {
        this.zoom.set(null);
      }
      event.stopPropagation();
    }
  }

  /**
   * A conflict as the tooltip says it: from our side when we are in it, our days first (see
   * CLAUDE.md): "Election contro X: Close Victory; 2-1" while it runs, "vinto, 4-1" once over.
   */
  private describeConflict(span: ConflictSpan): string {
    const standing = conflictStanding(span);
    const params = { kind: span.kind, side1: span.side1, side2: span.side2 };
    if (standing.kind === 'pending') {
      return this.t('chart.conflictPending', params);
    }
    if (standing.kind === 'unknown') {
      return this.t('chart.conflictNoScore', params);
    }
    const score = `${standing.days1}-${standing.days2}`;
    if (!span.involvesUs) {
      return this.t('chart.conflictOthers', { ...params, score });
    }
    return standing.kind === 'running'
      ? this.t('chart.conflictRunning', { ...params, outcome: standing.outcome, score })
      : this.t('chart.conflictOver', { ...params, result: this.t(`state.result.${standing.result}`).toLowerCase(), score });
  }

  /** The pointer's x in drawing units, kept inside the plot; null if the SVG has no size. */
  private drawingX(event: PointerEvent): number | null {
    const box = (event.currentTarget as SVGGraphicsElement).getBoundingClientRect();
    if (box.width === 0) {
      return null;
    }
    const x = ((event.clientX - box.left) / box.width) * WIDTH;
    return Math.min(WIDTH - MARGIN.right, Math.max(MARGIN.left, x));
  }

  private timeAt(x: number): number {
    const fraction = (x - MARGIN.left) / (WIDTH - MARGIN.left - MARGIN.right);
    return this.start() + fraction * (this.end() - this.start());
  }

  private x(time: number): number {
    const span = this.end() - this.start();
    const fraction = span > 0 ? (time - this.start()) / span : 1;
    return MARGIN.left + fraction * (WIDTH - MARGIN.left - MARGIN.right);
  }

  private y(value: number): number {
    return HEIGHT - MARGIN.bottom - (value / this.max()) * (HEIGHT - MARGIN.top - MARGIN.bottom);
  }

  /** "21 ott", in game time (UTC). */
  private formatDay(time: number): string {
    return new Intl.DateTimeFormat(LOCALES[this.i18n.lang()], { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(time);
  }

  /** "21 ott, 14:25", in game time (UTC). */
  private formatMoment(time: number): string {
    return this.i18n.utcTime(time);
  }

  private async load(): Promise<void> {
    this.status.set('loading');
    try {
      const history = await this.bgsService.getSystemHistory(this.data.systemAddress, HISTORY_DAYS);
      const series = buildSeries(history, FACTION_NAME);
      this.conflicts.set(buildConflictSpans(history));
      this.series.set(series);
      this.status.set(series.length > 0 ? 'ready' : 'empty');
    } catch {
      this.status.set('error');
    }
  }
}
