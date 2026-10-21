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
import { EMOJI_GROUPS, orderLineForName, ordersSkeleton, renderDiscordPreview, setOrdersDate, shortcodesToEmoji } from '../../core/orders-text';
import { OrdersStore } from './orders.store';

/** Same cadence as the main table's distance search — see `bgs-table.component.ts`. */
const SUGGESTION_DEBOUNCE_MS = 300;
const SUGGESTION_MIN_LENGTH = 3;

/**
 * The Ordini written as one text, like in VS Code, with the tool's help on top: real emoji (a
 * typed `:green_circle:` becomes 🟢), an emoji bar, system names spelt right and a Discord-like
 * preview beside the text. Nothing is taken from the table's data: the data can be days behind
 * the game, the officer writing the orders isn't. For officers; the draft is
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
    // "👉 **** 👈": the cursor goes between the asterisks, where the faction's name is typed.
    const slot = text.indexOf('****');
    if (slot >= 0) {
      textarea.setSelectionRange(start + slot + 2, start + slot + 2);
    }
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

  /** A system picked in the search: its name in bold, where the cursor was. */
  protected insertSystem(event: MatAutocompleteSelectedEvent): void {
    this.insertBlock(orderLineForName(String(event.option.value)));
    this.systemSearchControl.setValue('');
    this.systemSuggestions.set([]);
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
