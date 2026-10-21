/**
 * The Ordini Ufficiali draft, shared by the officers on the squadron server (`/auth/orders/draft`):
 * the same on every computer and for every officer, instead of one per browser. Every change is
 * saved a moment later; if another officer saved in between, the server refuses (409) and the
 * page says so instead of overwriting their work. "Pubblica" sends the current draft to the
 * members' read-only page (`/auth/orders/published`). Access is the Discord role, checked by the
 * server: there is no passphrase any more.
 *
 * The browser keeps a copy (localStorage) so a draft survives a reload while the server is
 * unreachable; the first time an officer opens the shared draft and the server has none yet,
 * their local draft becomes it. The rendering is `core/orders.ts`, which this just calls.
 */
import { Injectable, computed, signal } from '@angular/core';
import { SERVER_API_URL, STORAGE_PREFIX } from '../../core/config';
import { createOrderItem, OrderItem, OrdersDraft, parseIsoDay, renderOrdersMarkdown, resolveOrdersDay } from '../../core/orders';
import { insertAfterOperations, ordersSkeleton, shortcodesToEmoji } from '../../core/orders-text';

const ITEMS_KEY = `${STORAGE_PREFIX}orders-items:v1`;
const TEXT_KEY = `${STORAGE_PREFIX}orders-text:v1`;
const META_KEY = `${STORAGE_PREFIX}orders-meta:v1`;
const DAY_KEY = `${STORAGE_PREFIX}orders-day:v1`;
/** Wait after the last change before saving, so typing doesn't send a request per key. */
const SAVE_DELAY_MS = 800;
const TIMEOUT_MS = 8000;

export interface OrdersMeta {
  mention: string;
  footerNote: string;
  signature: string;
}

/** What the server keeps: the tool's own JSON, which it stores without reading. */
export interface OrdersData {
  items: OrderItem[];
  meta: OrdersMeta;
  day: string;
  /**
   * The report as one text, for the text editor (October 2026). Absent in drafts saved before
   * it: the editor then starts from the structured items, rendered (see {@link OrdersStore.ensureText}).
   */
  text?: string;
}

/** A saved version on the server, with who saved it. */
export interface OrdersDoc {
  data: OrdersData | null;
  version?: number;
  updated_at?: string;
  updated_by?: string | null;
}

/**
 * Where the shared draft stands: loading it, saved, a change waiting or on its way, refused
 * because another officer saved first (`conflict`), or the server unreachable (`error`).
 */
export type SyncState = 'loading' | 'saved' | 'pending' | 'saving' | 'conflict' | 'error';

const DEFAULT_META: OrdersMeta = {
  mention: '@Membro Flotta',
  footerNote: 'Qualunque contributo è ben accetto e mai obbligatorio.',
  signature: ':acfs:',
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable (e.g. private browsing) — the server copy is what counts anyway.
  }
}

async function request(method: 'GET' | 'PUT' | 'POST', path: string, body?: unknown): Promise<Response> {
  return fetch(`${SERVER_API_URL}${path}`, {
    method,
    credentials: 'include',
    cache: 'no-store',
    headers: method === 'GET' ? {} : { 'Content-Type': 'application/json', 'X-Requested-With': 'acfs-bgs-tool' },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
}

@Injectable({ providedIn: 'root' })
export class OrdersStore {
  private readonly itemsSignal = signal<OrderItem[]>(readJson(ITEMS_KEY, []));
  private readonly textSignal = signal<string>(readJson(TEXT_KEY, ''));
  private readonly metaSignal = signal<OrdersMeta>(readJson(META_KEY, DEFAULT_META));
  /** `YYYY-MM-DD`: the day the orders are for — tomorrow unless someone picked another (see {@link resolveOrdersDay}). */
  private readonly daySignal = signal<string>(resolveOrdersDay(readJson<string | null>(DAY_KEY, null), new Date()));
  private readonly syncSignal = signal<SyncState>('loading');
  private readonly savedSignal = signal<{ at: string | null; by: string | null }>({ at: null, by: null });
  /** The other officer's version, when ours was refused: shown so they can choose. */
  private readonly conflictSignal = signal<OrdersDoc | null>(null);

  readonly items = this.itemsSignal.asReadonly();
  readonly text = this.textSignal.asReadonly();
  readonly meta = this.metaSignal.asReadonly();
  readonly day = this.daySignal.asReadonly();
  readonly sync = this.syncSignal.asReadonly();
  readonly saved = this.savedSignal.asReadonly();
  readonly conflict = this.conflictSignal.asReadonly();

  /** The full report, ready to copy — see `core/orders.ts`. */
  readonly markdown = computed(() => {
    const date = parseIsoDay(this.daySignal()) ?? new Date();
    const draft: OrdersDraft = { date, items: this.itemsSignal(), ...this.metaSignal() };
    return renderOrdersMarkdown(draft);
  });

  private version = 0;
  private loaded = false;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  /** Loads the shared draft (once per session; again after a conflict). Officers only: the server checks. */
  async load(force = false): Promise<void> {
    if (this.loaded && !force) {
      return;
    }
    this.syncSignal.set('loading');
    try {
      const response = await request('GET', '/auth/orders/draft');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const doc = (await response.json()) as OrdersDoc;
      this.loaded = true;
      this.version = doc.version ?? 0;
      if (doc.data) {
        this.adopt(doc);
        this.syncSignal.set('saved');
      } else if (this.itemsSignal().length > 0 || this.textSignal().trim()) {
        // No shared draft yet: this browser's becomes it.
        this.syncSignal.set('pending');
        await this.save();
      } else {
        this.syncSignal.set('saved');
      }
    } catch {
      this.syncSignal.set('error');
    }
  }

  /** After a conflict: take the other officer's version, dropping this page's unsaved changes. */
  takeTheirs(): void {
    const theirs = this.conflictSignal();
    if (theirs?.data) {
      this.adopt(theirs);
    }
    this.version = theirs?.version ?? this.version;
    this.conflictSignal.set(null);
    this.syncSignal.set('saved');
  }

  /** After a conflict: save this page's version over the other officer's. */
  async keepMine(): Promise<void> {
    this.version = this.conflictSignal()?.version ?? this.version;
    this.conflictSignal.set(null);
    await this.save();
  }

  /** Publishes the current draft for the members (after saving it). Throws if the server refuses. */
  async publish(): Promise<OrdersDoc> {
    await this.save();
    const response = await request('POST', '/auth/orders/publish', { data: this.data() });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return (await response.json()) as OrdersDoc;
  }

  setText(text: string): void {
    this.textSignal.set(text);
    writeJson(TEXT_KEY, text);
    this.changed();
  }

  /**
   * Gives the text editor something to start from when the draft has no text yet: the structured
   * draft rendered (with real emoji), or an empty report for the day.
   */
  ensureText(): void {
    if (this.textSignal().trim()) {
      return;
    }
    const date = parseIsoDay(this.daySignal()) ?? new Date();
    this.setText(this.itemsSignal().length > 0 ? shortcodesToEmoji(this.markdown()) : ordersSkeleton(date, this.metaSignal()));
  }

  /**
   * Adds a system's lines to the text, at the end of the operations — the table's "Aggiungi agli
   * ordini". Like {@link addDraftItem}, the shared draft is loaded first.
   */
  addTextBlock(block: string): void {
    const add = () => {
      this.ensureText();
      this.setText(insertAfterOperations(this.textSignal(), block));
    };
    if (this.loaded) {
      add();
    } else {
      void this.load().then(add);
    }
  }

  addItem(section: OrderItem['section'], typeKey: string): OrderItem {
    const item = createOrderItem(section, typeKey);
    this.pushItem(item);
    return item;
  }

  /**
   * Adds an already-built item — the "Aggiungi agli ordini" table action uses this. From the
   * table the shared draft may not be loaded yet: it's loaded first, so the item joins it
   * instead of a stale local copy.
   */
  addDraftItem(draft: OrderItem): void {
    if (this.loaded) {
      this.pushItem(draft);
    } else {
      void this.load().then(() => this.pushItem(draft));
    }
  }

  addDraftItems(drafts: readonly OrderItem[]): void {
    this.setItems([...this.itemsSignal(), ...drafts]);
  }

  updateItem(id: string, patch: Partial<OrderItem>): void {
    this.setItems(this.itemsSignal().map(item => (item.id === id ? { ...item, ...patch } : item)));
  }

  /** Swaps in a whole new version of an item (same id) — for changes computed in `core/orders.ts`. */
  replaceItem(next: OrderItem): void {
    this.setItems(this.itemsSignal().map(item => (item.id === next.id ? next : item)));
  }

  removeItem(id: string): void {
    this.setItems(this.itemsSignal().filter(item => item.id !== id));
  }

  clearAll(): void {
    this.setItems([]);
  }

  /** Sets the day the orders are for; an empty or invalid value goes back to the default (tomorrow). */
  setDay(value: string): void {
    const day = parseIsoDay(value) ? value : resolveOrdersDay(null, new Date());
    this.daySignal.set(day);
    writeJson(DAY_KEY, day);
    this.changed();
  }

  updateMeta(patch: Partial<OrdersMeta>): void {
    const next = { ...this.metaSignal(), ...patch };
    this.metaSignal.set(next);
    writeJson(META_KEY, next);
    this.changed();
  }

  private data(): OrdersData {
    return { items: this.itemsSignal(), meta: this.metaSignal(), day: this.daySignal(), text: this.textSignal() };
  }

  private adopt(doc: OrdersDoc): void {
    const data = doc.data!;
    this.itemsSignal.set(data.items ?? []);
    this.textSignal.set(data.text ?? '');
    writeJson(TEXT_KEY, this.textSignal());
    this.metaSignal.set({ ...DEFAULT_META, ...data.meta });
    this.daySignal.set(resolveOrdersDay(data.day ?? null, new Date()));
    this.savedSignal.set({ at: doc.updated_at ?? null, by: doc.updated_by ?? null });
    writeJson(ITEMS_KEY, this.itemsSignal());
    writeJson(META_KEY, this.metaSignal());
    writeJson(DAY_KEY, this.daySignal());
  }

  private pushItem(item: OrderItem): void {
    this.setItems([...this.itemsSignal(), item]);
  }

  private setItems(items: OrderItem[]): void {
    this.itemsSignal.set(items);
    writeJson(ITEMS_KEY, items);
    this.changed();
  }

  /** A change to save shortly — unless a conflict is waiting for the officer's choice. */
  private changed(): void {
    if (this.syncSignal() === 'conflict') {
      return;
    }
    this.syncSignal.set('pending');
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }
    this.saveTimer = setTimeout(() => void this.save(), SAVE_DELAY_MS);
  }

  private async save(): Promise<void> {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    if (!SERVER_API_URL || this.syncSignal() === 'conflict' || (this.syncSignal() === 'saved' && this.loaded)) {
      return;
    }
    this.syncSignal.set('saving');
    try {
      const response = await request('PUT', '/auth/orders/draft', { data: this.data(), version: this.version });
      if (response.status === 409) {
        const body = (await response.json()) as { current: OrdersDoc | null };
        this.conflictSignal.set(body.current ?? { data: null, version: 0 });
        this.syncSignal.set('conflict');
        return;
      }
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const saved = (await response.json()) as { version: number; updated_at: string; updated_by: string };
      this.version = saved.version;
      this.loaded = true;
      this.savedSignal.set({ at: saved.updated_at, by: saved.updated_by });
      // Another change may have come in while this one was on its way.
      this.syncSignal.set(this.saveTimer ? 'pending' : 'saved');
    } catch {
      this.syncSignal.set('error');
    }
  }
}
