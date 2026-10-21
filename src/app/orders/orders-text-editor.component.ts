import { ChangeDetectionStrategy, Component, ElementRef, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../auth.service';
import { BgsService } from '../bgs.service';
import { HelpDialogComponent, HelpDialogData } from '../help-dialog/help-dialog.component';
import { formatOrdersDate, parseIsoDay } from '../../core/orders';
import {
  EMOJI_GROUPS,
  NumberChange,
  orderLineForName,
  orderLineForRow,
  ordersSkeleton,
  refreshOrderNumbers,
  renderDiscordPreview,
  setOrdersDate,
  shortcodesToEmoji,
} from '../../core/orders-text';
import { OrdersStore } from './orders.store';

/** Same cadence as the main table's distance search — see `bgs-table.component.ts`. */
const SUGGESTION_DEBOUNCE_MS = 300;
const SUGGESTION_MIN_LENGTH = 3;

/**
 * The Ordini written as one text, like in VS Code, with the tool's help on top: real emoji (a
 * typed `:green_circle:` becomes 🟢), an emoji bar, a ready line for a system, the numbers
 * refreshed from the data and a Discord-like preview beside the text. For officers; the draft is
 * the one shared on the squadron server (see {@link OrdersStore}). The members' page is
 * suspended while this is being tried out, so there's no "Pubblica" here.
 */
@Component({
  selector: 'app-orders-text-editor',
  imports: [ReactiveFormsModule, RouterLink, MatAutocompleteModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './orders-text-editor.component.html',
  styleUrl: './orders-text-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersTextEditorComponent implements OnInit {
  protected readonly store = inject(OrdersStore);
  protected readonly auth = inject(AuthService);
  private readonly bgsService = inject(BgsService);
  private readonly dialog = inject(MatDialog);

  private readonly editor = viewChild<ElementRef<HTMLTextAreaElement>>('editor');

  protected readonly emojiGroups = EMOJI_GROUPS;
  protected readonly isOfficer = computed(() => this.auth.session()?.officer === true);
  protected readonly preview = computed(() => renderDiscordPreview(this.store.text()));

  protected readonly inGameDate = computed(() => {
    const date = parseIsoDay(this.store.day());
    return date ? `In gioco: ${formatOrdersDate(date)}` : '';
  });

  protected readonly systemSearchControl = new FormControl('', { nonNullable: true });
  protected readonly systemSuggestions = signal<string[]>([]);
  protected readonly copyConfirmed = signal(false);
  protected readonly refreshing = signal(false);
  /** What the last "Aggiorna i numeri" changed, or why it couldn't. */
  protected readonly refreshResult = signal<{ changes: NumberChange[]; message: string } | null>(null);

  private searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private lastSuggestionQuery: string | null = null;
  private suggestionGeneration = 0;

  async ngOnInit(): Promise<void> {
    await this.auth.load();
    if (this.auth.session()?.officer) {
      await this.store.load();
      this.store.ensureText();
    }
  }

  /** "Salvato alle 21:40 da WitifulSky", "Salvataggio…", or what went wrong. */
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
        return 'Server dello Squadrone non raggiungibile: le modifiche restano in questo browser, riprova fra poco.';
      default:
        return saved.at
          ? `Bozza condivisa, salvata alle ${new Date(saved.at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}${saved.by ? ` da ${saved.by}` : ''}.`
          : 'Bozza condivisa con gli altri ufficiali.';
    }
  });

  /** Typing: a shortcode becomes its emoji as soon as it's closed, keeping the cursor where it was. */
  protected onInput(textarea: HTMLTextAreaElement): void {
    const value = textarea.value;
    const converted = shortcodesToEmoji(value);
    if (converted !== value) {
      const caret = shortcodesToEmoji(value.slice(0, textarea.selectionStart)).length;
      textarea.value = converted;
      textarea.setSelectionRange(caret, caret);
    }
    this.store.setText(converted);
  }

  /** Puts text where the cursor is (replacing a selection), then puts the cursor after it. */
  protected insert(text: string): void {
    const textarea = this.editor()?.nativeElement;
    if (!textarea) {
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    textarea.setRangeText(text, start, end, 'end');
    this.store.setText(textarea.value);
    textarea.focus();
  }

  /** A whole block on its own line(s): starts a new line if the cursor is in the middle of one. */
  private insertBlock(block: string): void {
    const textarea = this.editor()?.nativeElement;
    const before = textarea ? textarea.value.slice(0, textarea.selectionStart) : '';
    const lead = before === '' || before.endsWith('\n') ? '' : '\n';
    this.insert(`${lead}${block}`);
  }

  protected setDay(value: string): void {
    this.store.setDay(value);
    const date = parseIsoDay(this.store.day());
    if (date) {
      this.store.setText(setOrdersDate(this.store.text(), date));
    }
  }

  protected onSystemSearchInput(): void {
    const value = this.systemSearchControl.value;
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
    this.searchDebounceTimer = setTimeout(() => void this.runSuggestions(value), SUGGESTION_DEBOUNCE_MS);
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

  /** A system picked in the search: its ready line if the data follows it, else just the bold name. */
  protected async insertSystem(event: MatAutocompleteSelectedEvent): Promise<void> {
    const name = String(event.option.value);
    let block = orderLineForName(name);
    try {
      const rows = await this.bgsService.getAllRows();
      const row = rows.find(candidate => candidate.systemName.toLowerCase() === name.toLowerCase());
      if (row) {
        block = orderLineForRow(row);
      }
    } catch {
      // No data: the bold name is still a start.
    }
    this.insertBlock(block);
    this.systemSearchControl.setValue('');
    this.systemSuggestions.set([]);
  }

  protected async refreshNumbers(): Promise<void> {
    if (this.refreshing()) {
      return;
    }
    this.refreshing.set(true);
    try {
      const rows = await this.bgsService.getAllRows();
      const { text, changes } = refreshOrderNumbers(this.store.text(), rows);
      if (changes.length > 0) {
        this.store.setText(text);
      }
      this.refreshResult.set({
        changes,
        message: changes.length > 0 ? `Aggiornate ${changes.length} righe:` : 'I numeri nel testo sono già quelli dei dati.',
      });
    } catch {
      this.refreshResult.set({ changes: [], message: 'Dati dei sistemi non disponibili: riprova più tardi.' });
    } finally {
      this.refreshing.set(false);
    }
  }

  protected restartFromSkeleton(): void {
    if (!confirm('Ripartire da un report vuoto? Il testo attuale si perde.')) {
      return;
    }
    const date = parseIsoDay(this.store.day()) ?? new Date();
    this.store.setText(ordersSkeleton(date, this.store.meta()));
  }

  protected async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.store.text());
      this.copyConfirmed.set(true);
      setTimeout(() => this.copyConfirmed.set(false), 2000);
    } catch {
      // Clipboard permission denied or unavailable — the text is still selectable in the editor.
    }
  }

  protected openHelp(): void {
    this.dialog.open<HelpDialogComponent, HelpDialogData>(HelpDialogComponent, {
      data: { orders: this.isOfficer() },
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      maxWidth: 'min(1168px, 90vw)',
    });
  }
}
