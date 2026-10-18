import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../auth.service';
import { BgsService } from '../bgs.service';
import { HelpDialogComponent, HelpDialogData } from '../help-dialog/help-dialog.component';
import { findOrderType, ORDER_STATUSES, ORDER_TRENDS, ORDER_TYPES } from '../../core/order-types';
import {
  changeOrderType,
  createOrderItemFromBar,
  formatOrdersDate,
  OrderItem,
  OrderSection,
  parseIsoDay,
  pendingExpansionTemplate,
  pendingItemsFromRows,
  setOrderPending,
  toggleOrderStatus,
} from '../../core/orders';
import { OrdersStore } from './orders.store';

/** Same cadence as the main table's distance search — see `bgs-table.component.ts`. */
const SUGGESTION_DEBOUNCE_MS = 300;
const SUGGESTION_MIN_LENGTH = 3;

/** The type the "Aggiungi riga" bar switches to when a section is picked (none for "concluse": keep the current one). */
const DEFAULT_TYPE_BY_SECTION: Partial<Record<OrderSection, string>> = {
  operazioni: 'election',
  cantieri: 'construction',
  note: 'note',
};

const SECTION_OPTIONS: { value: OrderSection; label: string }[] = [
  { value: 'operazioni', label: 'Operazioni in corso' },
  { value: 'cantieri', label: 'Cantieri aperti' },
  { value: 'note', label: 'Note & informazioni' },
  { value: 'concluse', label: 'Operazioni concluse' },
];

/**
 * The "Ordini Ufficiali" editor: compose a day's operations, copy the result into Discord and
 * publish it for the members. For officers (Discord role, checked again by the server); a member
 * who opens it is sent to the read-only page, anyone else is asked to sign in. The draft is the
 * one shared on the squadron server (see {@link OrdersStore}).
 */
@Component({
  selector: 'app-orders-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatAutocompleteModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './orders-page.component.html',
  styleUrl: './orders-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersPageComponent implements OnInit {
  protected readonly store = inject(OrdersStore);
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly bgsService = inject(BgsService);
  private readonly dialog = inject(MatDialog);

  protected readonly sectionOptions = SECTION_OPTIONS;
  protected readonly orderTypes = ORDER_TYPES;
  protected readonly trends = ORDER_TRENDS;
  protected readonly statuses = ORDER_STATUSES;
  protected readonly findOrderType = findOrderType;
  protected readonly Number = Number;

  /** Officers edit; the server checks the role again on every save. */
  protected readonly isOfficer = computed(() => this.auth.session()?.officer === true);
  protected readonly publishing = signal(false);
  protected readonly publishMessage = signal<string | null>(null);

  protected readonly newItemSection = signal<OrderSection>('operazioni');
  protected readonly newItemType = signal<string>(ORDER_TYPES[0].key);
  protected readonly systemSearchControl = new FormControl('', { nonNullable: true });
  protected readonly systemSuggestions = signal<string[]>([]);

  protected readonly copyConfirmed = signal(false);
  /** Outcome of the last "Precompila con i pending", shown next to the button. */
  protected readonly prefillMessage = signal<string | null>(null);
  protected readonly prefilling = signal(false);

  /** The picked day as it appears in the report, in-game ("06/10/3312"). */
  protected readonly inGameDate = computed(() => {
    const date = parseIsoDay(this.store.day());
    return date ? `In gioco: ${formatOrdersDate(date)}` : '';
  });

  private searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private lastSuggestionQuery: string | null = null;
  private suggestionGeneration = 0;

  async ngOnInit(): Promise<void> {
    await this.auth.load();
    const session = this.auth.session();
    if (session?.officer) {
      await this.store.load();
    } else if (session?.member) {
      // Members read the published orders; the editor isn't for them.
      void this.router.navigate(['/ordini/pubblicati'], { replaceUrl: true });
    }
  }

  /** "Salvato alle 21:40 da WiitifulSky", "Salvataggio…", or what went wrong. */
  protected readonly syncLabel = computed(() => {
    const saved = this.store.saved();
    switch (this.store.sync()) {
      case 'loading':
        return 'Caricamento della bozza condivisa…';
      case 'pending':
      case 'saving':
        return 'Salvataggio…';
      case 'conflict':
        return 'Un altro ufficiale ha cambiato la bozza mentre la modificavi.';
      case 'error':
        return 'Server dello squadrone non raggiungibile: le modifiche restano in questo browser, riprova fra poco.';
      default:
        return saved.at
          ? `Bozza condivisa, salvata alle ${new Date(saved.at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}${saved.by ? ` da ${saved.by}` : ''}.`
          : 'Bozza condivisa con gli altri ufficiali.';
    }
  });

  protected async publish(): Promise<void> {
    if (this.publishing() || !confirm('Pubblicare questi Ordini per i membri? Sostituiscono quelli pubblicati finora.')) {
      return;
    }
    this.publishing.set(true);
    this.publishMessage.set(null);
    try {
      await this.store.publish();
      this.publishMessage.set('Pubblicati: i membri li vedono in Ordini.');
    } catch {
      this.publishMessage.set('Pubblicazione non riuscita: riprova fra poco.');
    } finally {
      this.publishing.set(false);
    }
  }

  /** The Ordini section of the guide, in full for officers. */
  protected openHelp(): void {
    this.dialog.open<HelpDialogComponent, HelpDialogData>(HelpDialogComponent, {
      data: { orders: this.isOfficer() },
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      maxWidth: 'min(1168px, 90vw)',
    });
  }

  protected onSystemSearchInput(): void {
    const value = this.systemSearchControl.value;
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
    this.searchDebounceTimer = setTimeout(() => {
      void this.runSuggestions(value);
    }, SUGGESTION_DEBOUNCE_MS);
  }

  private async runSuggestions(value: string): Promise<void> {
    if (value === this.lastSuggestionQuery) {
      return;
    }
    this.lastSuggestionQuery = value;
    const generation = ++this.suggestionGeneration;

    if (!value || value.trim().length < SUGGESTION_MIN_LENGTH) {
      this.systemSuggestions.set([]);
      return;
    }
    try {
      const response = await this.bgsService.typeahead(value.trim());
      if (generation === this.suggestionGeneration) {
        this.systemSuggestions.set(response.values ?? []);
      }
    } catch {
      if (generation === this.suggestionGeneration) {
        this.systemSuggestions.set([]);
      }
    }
  }

  protected chooseNewItemSection(section: OrderSection): void {
    this.newItemSection.set(section);
    const type = DEFAULT_TYPE_BY_SECTION[section];
    if (type) {
      this.newItemType.set(type);
    }
  }

  protected addItem(): void {
    const system = this.systemSearchControl.value.trim();
    this.store.addDraftItem(createOrderItemFromBar(this.newItemSection(), this.newItemType(), system));
    this.systemSearchControl.setValue('');
    this.systemSuggestions.set([]);
  }

  protected itemsForSection(section: OrderSection): OrderItem[] {
    return this.store.items().filter(item => item.section === section);
  }

  protected updateItem(id: string, patch: Partial<OrderItem>): void {
    this.store.updateItem(id, patch);
  }

  protected removeItem(id: string): void {
    this.store.removeItem(id);
  }

  protected toggleStatus(item: OrderItem, key: string): void {
    const statusOrder = this.statuses.map(status => status.key);
    this.store.replaceItem(toggleOrderStatus(item, key, statusOrder));
  }

  protected changeType(item: OrderItem, typeKey: string): void {
    this.store.replaceItem(changeOrderType(item, typeKey));
  }

  protected setPending(item: OrderItem, pending: boolean): void {
    this.store.replaceItem(setOrderPending(item, pending));
  }

  /** Adds every pending war and election in the dataset to "Note & informazioni" (see {@link pendingItemsFromRows}). */
  protected async prefillPending(): Promise<void> {
    if (this.prefilling()) {
      return;
    }
    this.prefilling.set(true);
    this.prefillMessage.set(null);
    try {
      const rows = await this.bgsService.getAllRows();
      const drafts = pendingItemsFromRows(rows, this.store.items());
      this.store.addDraftItems(drafts);
      this.prefillMessage.set(drafts.length > 0 ? `Aggiunte ${drafts.length} righe in pending.` : 'Nessun nuovo pending nei dati.');
    } catch {
      this.prefillMessage.set('Dati dei sistemi non disponibili: riprova più tardi.');
    } finally {
      this.prefilling.set(false);
    }
  }

  protected addExpansionNote(): void {
    this.store.addDraftItem(pendingExpansionTemplate());
  }

  protected addFreeNote(): void {
    this.store.addItem('note', 'note');
  }

  protected clearAll(): void {
    if (confirm('Svuotare tutti gli ordini? Non si può annullare.')) {
      this.store.clearAll();
    }
  }

  protected async copyMarkdown(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.store.markdown());
      this.copyConfirmed.set(true);
      setTimeout(() => this.copyConfirmed.set(false), 2000);
    } catch {
      // Clipboard permission denied or unavailable — the text is still selectable in the preview.
    }
  }
}
