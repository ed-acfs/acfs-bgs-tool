import { ChangeDetectionStrategy, Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faArrowUpRightFromSquare, faCircleQuestion, faCopy, faListUl, faRocket, faRoute, faSatelliteDish } from '@fortawesome/free-solid-svg-icons';
import { MatDialog } from '@angular/material/dialog';
import { FACTION_NAME, SERVER_API_URL } from '../../core/config';
import {
  ColonisationData,
  ColonisationSource,
  ColonisationTarget,
  DEFAULT_FILTER,
  NATURAL_DIRECTION,
  PURPOSES,
  OTHER_FILTERS,
  PURPOSE_LABELS,
  PlotterFilter,
  SortKey,
  Point,
  Purpose,
  biologyOptions,
  bodyDetailLines,
  bodyTypeOptions,
  describeShares,
  distance,
  filterTargets,
  interestTags,
  links,
  purposesOf,
  ringLine,
  shortBody,
} from '../../core/colony-plotter';
import { AcfsLogoComponent } from '../acfs-logo/acfs-logo.component';
import { AccountComponent } from '../account/account.component';
import { HelpDialogComponent, HelpDialogData } from '../help-dialog/help-dialog.component';
import { AuthService } from '../auth.service';
import { BgsService } from '../bgs.service';

const TIMEOUT_MS = 15_000;
/** Righe per pagina, come nella tabella principale. */
const PAGE_SIZES = [25, 50, 100] as const;

/**
 * "Colony Plotter (beta)": gli obiettivi di colonizzazione attorno alle stazioni di Flotta Stellare,
 * calcolati dal motore (repo acfs-colony-plotter) e serviti dal server dello Squadrone. Impaginato
 * come il Colony Finder dei Canonn (preferenza dell'utente del 25 ottobre 2026): i corpi interessanti
 * in primo piano, il nome del sistema apre la scheda, sotto il nome i link a Inara, Raven Colonial,
 * Spansh e Canonn Signals. Riservato ai membri dello Squadrone: il controllo lo fa il server
 * (/v1/colonisation), come per Attività. Solo in italiano.
 */
@Component({
  selector: 'app-colony-plotter-page',
  imports: [RouterLink, NgTemplateOutlet, MatButtonModule, FaIconComponent, AcfsLogoComponent, AccountComponent],
  templateUrl: './colony-plotter-page.component.html',
  styleUrl: './colony-plotter-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColonyPlotterPageComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly bgsService = inject(BgsService);
  private readonly dialog = inject(MatDialog);

  protected readonly state = signal<'locked' | 'loading' | 'ready'>('locked');
  protected readonly error = signal<string | null>(null);
  protected readonly data = signal<ColonisationData | null>(null);

  protected readonly factionName = FACTION_NAME;
  protected readonly purposes = PURPOSES;
  protected readonly purposeLabels = PURPOSE_LABELS;
  protected readonly otherFilters = OTHER_FILTERS;
  protected readonly bodyDetails = bodyDetailLines;
  protected readonly pageSizes = PAGE_SIZES;
  protected readonly links = links;
  protected readonly describeShares = describeShares;
  protected readonly ringLine = ringLine;
  protected readonly faInara = faArrowUpRightFromSquare;
  protected readonly faRaven = faRocket;
  protected readonly faSignals = faSatelliteDish;
  protected readonly faSpansh = faRoute;
  protected readonly faCopy = faCopy;
  protected readonly faHelp = faCircleQuestion;
  protected readonly faLegend = faListUl;
  protected readonly legendOpen = signal(false);

  protected readonly filter = signal<PlotterFilter>(DEFAULT_FILTER);
  protected readonly pageSize = signal<number>(50);
  protected readonly page = signal(0);
  /** Il sistema della "Distanza da", con le coordinate. */
  protected readonly search = signal<Point | null>(null);
  protected readonly searchText = signal('');
  protected readonly searchError = signal<string | null>(null);
  /** Il sistema aperto nella scheda. */
  protected readonly selected = signal<ColonisationTarget | null>(null);
  protected readonly copied = signal<string | null>(null);

  /** Qualche filtro (o la distanza da un sistema) è diverso da quello di partenza. */
  protected readonly filtersActive = computed(
    () => this.search() !== null || JSON.stringify(this.filter()) !== JSON.stringify(DEFAULT_FILTER),
  );
  protected readonly bodyTypes = computed(() => bodyTypeOptions(this.data()?.targets ?? []));
  protected readonly genera = computed(() => biologyOptions(this.data()?.targets ?? []));
  protected readonly results = computed(() => filterTargets(this.data()?.targets ?? [], this.filter(), this.search()));
  protected readonly pages = computed(() => Math.max(1, Math.ceil(this.results().length / this.pageSize())));
  protected readonly visible = computed(() => {
    const start = this.page() * this.pageSize();
    return this.results().slice(start, start + this.pageSize());
  });
  protected readonly generatedAt = computed(() => {
    const at = this.data()?.generated_at;
    return at ? `${new Date(at).toLocaleString('it-IT', { timeZone: 'UTC', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} UTC` : null;
  });

  async ngOnInit(): Promise<void> {
    await this.auth.load();
    // In locale il server può servire gli obiettivi senza accesso (COLONISATION_OPEN): si prova comunque.
    void this.load();
  }

  protected async load(): Promise<void> {
    if (!SERVER_API_URL) {
      this.state.set('locked');
      return;
    }
    this.state.set('loading');
    this.error.set(null);
    try {
      const response = await fetch(`${SERVER_API_URL}/v1/colonisation`, {
        credentials: 'include',
        cache: 'no-store',
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!response.ok) {
        // Senza accesso non è un errore da mostrare: la pagina invita ad accedere.
        if (response.status !== 401 || this.auth.session()) this.error.set(this.messageFor(response.status));
        this.state.set('locked');
        return;
      }
      this.data.set((await response.json()) as ColonisationData);
      this.state.set('ready');
    } catch {
      this.error.set('Server dello Squadrone non raggiungibile. Riprova fra poco.');
      this.state.set(this.data() ? 'ready' : 'locked');
    }
  }

  protected update(change: Partial<PlotterFilter>): void {
    this.filter.update(current => ({ ...current, ...change }));
    this.page.set(0);
  }

  /** Un ordinamento nuovo riparte dal suo verso naturale (es. più corpi prima, distanze brevi prima). */
  protected setSort(sort: SortKey): void {
    this.update({ sort, direction: NATURAL_DIRECTION[sort] });
  }

  /** Riporta filtri, ordinamento e "distanza da" come all'apertura (non le righe per pagina). */
  protected resetFilters(): void {
    this.filter.set(DEFAULT_FILTER);
    this.search.set(null);
    this.searchText.set('');
    this.searchError.set(null);
    this.page.set(0);
  }

  protected setPageSize(size: number): void {
    this.pageSize.set(size);
    this.page.set(0);
  }

  protected goTo(page: number): void {
    this.page.set(Math.min(Math.max(page, 0), this.pages() - 1));
  }

  /**
   * "Distanza da": le coordinate del sistema scritto, prima fra gli obiettivi e i nostri sistemi di
   * partenza, poi con la ricerca dei sistemi della tabella principale (tutta la galassia).
   */
  protected async searchSystem(): Promise<void> {
    const name = this.searchText().trim();
    this.searchError.set(null);
    if (!name) {
      this.search.set(null);
      if (this.filter().sort === 'search') this.setSort('interest');
      return;
    }
    const lower = name.toLowerCase();
    const data = this.data();
    let found: Point | undefined = [...(data?.targets ?? []), ...(data?.anchors ?? [])].find(s => s.name.toLowerCase() === lower);
    if (!found) {
      try {
        const response = await this.bgsService.typeahead(name);
        found = (response.min_max ?? []).find(s => s.name.toLowerCase() === lower);
      } catch {
        // Sotto: sistema non trovato.
      }
    }
    if (!found) {
      this.searchError.set(`Sistema "${name}" non trovato.`);
      return;
    }
    this.search.set({ name: found.name, x: found.x, y: found.y, z: found.z });
    this.setSort('search');
  }

  protected distanceFromSearch(target: ColonisationTarget): number | null {
    const search = this.search();
    return search ? distance(search, target) : null;
  }

  protected tags(target: ColonisationTarget) {
    return interestTags(target);
  }

  protected suitability(target: ColonisationTarget) {
    return purposesOf(target);
  }

  /** Lo scopo scelto in "Adatto a", per l'ordinamento. */
  protected chosenPurposeLabel(): string {
    const purpose = this.filter().purpose;
    return purpose ? PURPOSE_LABELS[purpose] : '';
  }

  protected stationNames(source: ColonisationSource): string {
    return source.stations.map(s => s.name).join(', ');
  }

  /** I corpi che danno il punteggio di uno scopo, col nome corto. */
  protected purposeBodies(target: ColonisationTarget, purpose: Purpose): string {
    return (target.purposes[purpose]?.bodies ?? []).map(b => shortBody(target, b)).join(', ');
  }

  /** La Guida del tool, con la sola sezione del Colony Plotter. */
  protected openHelp(): void {
    const data: HelpDialogData = { colonyPlotter: true };
    this.dialog.open(HelpDialogComponent, { data, autoFocus: 'first-tabbable', restoreFocus: true, maxWidth: 'min(1168px, 90vw)' });
  }

  protected open(target: ColonisationTarget): void {
    this.selected.set(target);
  }

  protected close(): void {
    this.selected.set(null);
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.close();
  }

  protected async copy(name: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(name);
      this.copied.set(name);
      setTimeout(() => this.copied.set(null), 1500);
    } catch {
      // Appunti non disponibili: niente da fare.
    }
  }

  protected value(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement).value;
  }

  private messageFor(status: number): string {
    switch (status) {
      case 401:
        return 'Sessione scaduta: accedi di nuovo con Discord.';
      case 403:
        return 'Riservato ai membri dello Squadrone.';
      case 404:
        return 'Il server non ha ancora calcolato gli obiettivi.';
      default:
        return `Errore del server (${status}).`;
    }
  }
}
