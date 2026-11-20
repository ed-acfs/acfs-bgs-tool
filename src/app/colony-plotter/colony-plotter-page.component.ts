import { ChangeDetectionStrategy, Component, ElementRef, HostListener, OnDestroy, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faArrowUpRightFromSquare,
  faBridge,
  faCircleHalfStroke,
  faCircleQuestion,
  faCopy,
  faEllipsis,
  faGem,
  faGlobe,
  faLeaf,
  faListUl,
  faMoon,
  faRing,
  faRocket,
  faRoute,
  faSatelliteDish,
  faSliders,
  faStar,
  faSun,
  faVolcano,
  IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import { MatDialog } from '@angular/material/dialog';
import { FACTION_NAME, SERVER_API_URL } from '../../core/config';
import {
  BRIDGE_STATE_LABELS,
  BridgeResult,
  BridgeStep,
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
  bridgeText,
  filterTargets,
  highlights,
  interestTags,
  Highlight,
  nearestAnchor,
  plotterSummary,
  stepsToBuild,
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
import { ThemeChoice, ThemeService } from '../theme.service';

const TIMEOUT_MS = 15_000;
/** Il Ponte: ogni quanto chiedere al server se Spansh ha finito, e per quanto al massimo. */
const BRIDGE_POLL_MS = 4_000;
const BRIDGE_MAX_WAIT_MS = 4 * 60_000;

/** L'icona di ogni indicatore della riga. */
const HIGHLIGHT_ICONS: Readonly<Record<Highlight['kind'], IconDefinition>> = {
  body: faGlobe,
  rare: faGlobe,
  biology: faLeaf,
  geology: faVolcano,
  rings: faRing,
  hotspots: faGem,
  stars: faStar,
};

/** Le scorciatoie delle tessere in cima: ognuna applica un filtro. */
type QuickFilter = 'free' | 'biology' | 'pristine' | 'hotspots';

/** La parte della scheda del sistema che spiega un segno "In evidenza". */
type CardSection = 'bodies' | 'rings' | 'facts';
/** Righe per pagina, come nella tabella principale. */
const PAGE_SIZES = [25, 50, 100] as const;

/**
 * "Colony Plotter" (fuori dalla beta dal 20 novembre 2026): gli obiettivi di colonizzazione attorno alle stazioni di Flotta Stellare,
 * calcolati dal motore (repo acfs-colony-plotter) e serviti dal server dello Squadrone. Impaginato
 * come il Colony Finder dei Canonn (preferenza dell'utente del 25 ottobre 2026): i corpi interessanti
 * in primo piano, il nome del sistema apre la scheda, sotto il nome i link a Inara, Raven Colonial,
 * Spansh e Canonn Signals. Riservato ai membri dello Squadrone: il controllo lo fa il server
 * (/v1/colonisation), come per Attività. Solo in italiano.
 */
@Component({
  selector: 'app-colony-plotter-page',
  imports: [RouterLink, NgTemplateOutlet, MatButtonModule, MatMenuModule, MatTooltipModule, FaIconComponent, AcfsLogoComponent, AccountComponent],
  templateUrl: './colony-plotter-page.component.html',
  styleUrl: './colony-plotter-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColonyPlotterPageComponent implements OnInit, OnDestroy {
  protected readonly auth = inject(AuthService);
  private readonly bgsService = inject(BgsService);
  private readonly dialog = inject(MatDialog);
  protected readonly theme = inject(ThemeService);

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
  protected readonly faMore = faEllipsis;
  protected readonly faFilters = faSliders;
  protected readonly faBridge = faBridge;
  protected readonly themeChoices: readonly { choice: ThemeChoice; icon: IconDefinition; label: string }[] = [
    { choice: 'auto', icon: faCircleHalfStroke, label: 'Tema automatico, come il sistema' },
    { choice: 'light', icon: faSun, label: 'Tema chiaro' },
    { choice: 'dark', icon: faMoon, label: 'Tema scuro' },
  ];
  protected readonly legendOpen = signal(false);
  /** Obiettivi entro 15 ly, o il Ponte verso un sistema lontano. */
  protected readonly view = signal<'targets' | 'bridge'>('targets');
  /** I filtri meno usati, in un riquadro che si apre a richiesta. */
  protected readonly moreFilters = signal(false);
  protected readonly highlightIcons = HIGHLIGHT_ICONS;
  protected readonly stateLabels = BRIDGE_STATE_LABELS;
  protected readonly tagsOf = interestTags;

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
  /** Quanti filtri del riquadro "Altri filtri" sono attivi: si vede anche a riquadro chiuso. */
  protected readonly hiddenFiltersActive = computed(() => {
    const f = this.filter();
    return [!!f.purpose, !!f.biology, !!f.other, !!f.from.trim(), f.includeClaimed].filter(Boolean).length;
  });
  protected readonly summary = computed(() => plotterSummary(this.data()?.targets ?? []));
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

  protected readonly bridgeTo = signal('');
  /** Il nostro sistema di partenza scelto, o '' per il più vicino all'arrivo. */
  protected readonly bridgeFrom = signal('');
  protected readonly bridgeState = signal<'idle' | 'working' | 'ready'>('idle');
  protected readonly bridgeError = signal<string | null>(null);
  protected readonly bridge = signal<BridgeResult | null>(null);
  protected readonly bridgeWaited = signal(0);
  protected readonly bridgeSteps = computed<BridgeStep[]>(() => this.bridge()?.steps ?? []);
  protected readonly bridgeToBuild = computed(() => stepsToBuild(this.bridgeSteps()));
  /** La prima tappa da colonizzare: quella su cui lavorare adesso. */
  protected readonly bridgeNext = computed(() => this.bridgeSteps().find(s => s.state === 'free' || s.state === 'unknown') ?? null);
  protected readonly anchorsByName = computed(() =>
    [...(this.data()?.anchors ?? [])].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })),
  );
  private bridgeTimer: ReturnType<typeof setTimeout> | null = null;
  private bridgeRun = 0;

  async ngOnInit(): Promise<void> {
    this.theme.enable();
    await this.auth.load();
    // In locale il server può servire gli obiettivi senza accesso (COLONISATION_OPEN): si prova comunque.
    await this.load();
    this.openSharedBridge();
  }

  /** Link condivisibile al Ponte: `?ponte=<arrivo>` (e `&da=<partenza>`) apre la scheda e calcola la rotta. */
  private openSharedBridge(): void {
    const params = new URLSearchParams(window.location.search);
    const to = params.get('ponte')?.trim();
    if (!to || this.state() !== 'ready') return;
    this.view.set('bridge');
    this.bridgeTo.set(to);
    this.bridgeFrom.set(params.get('da')?.trim() ?? '');
    void this.planBridge();
  }

  /** Il link a questo Ponte, da mandare a un altro pilota. */
  protected bridgeLink(): string {
    const b = this.bridge();
    const url = new URL(window.location.href);
    url.search = '';
    if (b) {
      url.searchParams.set('ponte', b.to);
      url.searchParams.set('da', b.from);
    }
    return url.toString();
  }

  protected copyBridgeLink(): void {
    void this.copy(this.bridgeLink());
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

  ngOnDestroy(): void {
    this.theme.disable();
    this.stopBridge();
  }

  protected update(change: Partial<PlotterFilter>): void {
    this.filter.update(current => ({ ...current, ...change }));
    this.page.set(0);
  }

  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  /**
   * Un ordinamento nuovo riparte dal suo verso naturale (es. più corpi prima, distanze brevi prima).
   * "Distanza dal sistema cercato" senza un sistema porta il cursore nella casella per scriverlo.
   */
  protected setSort(sort: SortKey): void {
    this.update({ sort, direction: NATURAL_DIRECTION[sort] });
    if (sort === 'search' && !this.search()) this.searchInput()?.nativeElement.focus();
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
    const found = await this.findPoint(name);
    if (!found) {
      this.searchError.set(`Sistema "${name}" non trovato.`);
      return;
    }
    this.search.set({ name: found.name, x: found.x, y: found.y, z: found.z });
    this.setSort('search');
  }

  /** Le coordinate di un sistema: prima fra obiettivi e nostri sistemi, poi in tutta la galassia. */
  private async findPoint(name: string): Promise<Point | undefined> {
    const lower = name.toLowerCase();
    const data = this.data();
    const local = [...(data?.targets ?? []), ...(data?.anchors ?? [])].find(s => s.name.toLowerCase() === lower);
    if (local) return local;
    try {
      const response = await this.bgsService.typeahead(name);
      return (response.min_max ?? []).find(s => s.name.toLowerCase() === lower);
    } catch {
      return undefined;
    }
  }

  protected distanceFromSearch(target: ColonisationTarget): number | null {
    const search = this.search();
    return search ? distance(search, target) : null;
  }

  protected highlights(target: ColonisationTarget) {
    return highlights(target);
  }

  /** Lo scopo migliore, se vale qualcosa, per la colonna "Adatto a". */
  protected best(target: ColonisationTarget): { label: string; score: number } | null {
    return purposesOf(target)[0] ?? null;
  }

  /** Una tessera attiva: il filtro che applica è già quello in uso. */
  protected quickActive(kind: QuickFilter): boolean {
    const f = this.filter();
    switch (kind) {
      case 'free':
        return !f.includeClaimed && !f.biology && !f.other;
      case 'biology':
        return f.biology === '*';
      case 'pristine':
        return f.other === 'pristine';
      case 'hotspots':
        return f.other === 'hotspots';
    }
  }

  /** Un clic su una tessera applica il suo filtro; un secondo clic lo toglie. */
  protected quick(kind: QuickFilter): void {
    if (kind === 'free') {
      this.update({ includeClaimed: false, biology: '', other: '' });
      return;
    }
    if (this.quickActive(kind)) {
      this.update(kind === 'biology' ? { biology: '' } : { other: '' });
      return;
    }
    this.update(kind === 'biology' ? { biology: '*' } : { other: kind });
  }

  protected setView(view: 'targets' | 'bridge'): void {
    this.view.set(view);
  }

  /**
   * Chiede il Ponte al server (che lo chiede al Colonisation Plotter di Spansh) e aspetta la
   * risposta, che può richiedere più di un minuto. Senza partenza scelta, il nostro sistema più
   * vicino all'arrivo.
   */
  protected async planBridge(): Promise<void> {
    const to = this.bridgeTo().trim();
    this.stopBridge();
    this.bridgeError.set(null);
    this.bridge.set(null);
    if (!to || !SERVER_API_URL) return;
    const run = ++this.bridgeRun;
    this.bridgeState.set('working');
    this.bridgeWaited.set(0);
    let from = this.bridgeFrom();
    if (!from) {
      const point = await this.findPoint(to);
      if (run !== this.bridgeRun) return;
      if (!point) {
        this.failBridge(`Sistema "${to}" non trovato.`);
        return;
      }
      const anchor = nearestAnchor(this.data()?.anchors ?? [], point);
      if (!anchor) {
        this.failBridge('Nessun nostro sistema di partenza.');
        return;
      }
      from = anchor.name;
    }
    const started = Date.now();
    let url = `${SERVER_API_URL}/v1/bridge?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
    const step = async (): Promise<void> => {
      try {
        const response = await fetch(url, { credentials: 'include', cache: 'no-store', signal: AbortSignal.timeout(TIMEOUT_MS) });
        const body = (await response.json()) as BridgeResult & { error?: string };
        if (run !== this.bridgeRun) return;
        if (!response.ok) {
          this.failBridge(body.error ?? this.messageFor(response.status));
          return;
        }
        if (body.status === 'ok') {
          this.bridge.set(body);
          this.bridgeState.set('ready');
          return;
        }
        url = `${SERVER_API_URL}/v1/bridge?job=${encodeURIComponent(body.job)}`;
        this.bridge.set(body);
        this.bridgeWaited.set(Math.round((Date.now() - started) / 1000));
        if (Date.now() - started > BRIDGE_MAX_WAIT_MS) {
          this.failBridge('Spansh non ha finito in 4 minuti: riprova più tardi.');
          return;
        }
        this.bridgeTimer = setTimeout(() => void step(), BRIDGE_POLL_MS);
      } catch {
        if (run === this.bridgeRun) this.failBridge('Server dello Squadrone non raggiungibile. Riprova fra poco.');
      }
    };
    await step();
  }

  protected cancelBridge(): void {
    this.stopBridge();
    this.bridgeRun++;
    this.bridgeState.set('idle');
  }

  private failBridge(message: string): void {
    this.bridgeError.set(message);
    this.bridgeState.set('idle');
  }

  private stopBridge(): void {
    if (this.bridgeTimer) clearTimeout(this.bridgeTimer);
    this.bridgeTimer = null;
  }

  protected bridgeCopied(): boolean {
    const copied = this.copied();
    return copied !== null && copied === bridgeText(this.bridgeSteps());
  }

  protected copyBridge(): void {
    void this.copy(bridgeText(this.bridgeSteps()));
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

  /** La parte della scheda evidenziata per un momento, dopo il clic su un segno. */
  protected readonly focusSection = signal<CardSection | null>(null);
  private focusTimer: ReturnType<typeof setTimeout> | null = null;

  protected sectionOf(kind: Highlight['kind']): CardSection {
    if (kind === 'rings' || kind === 'hotspots') return 'rings';
    return kind === 'stars' ? 'facts' : 'bodies';
  }

  /** Apre la scheda del sistema; con `section`, la porta su quella parte e la evidenzia. */
  protected open(target: ColonisationTarget, section?: CardSection): void {
    this.selected.set(target);
    if (this.focusTimer) clearTimeout(this.focusTimer);
    this.focusSection.set(section ?? null);
    if (!section) return;
    setTimeout(() => document.getElementById(`cp-sec-${section}`)?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
    this.focusTimer = setTimeout(() => this.focusSection.set(null), 1800);
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
