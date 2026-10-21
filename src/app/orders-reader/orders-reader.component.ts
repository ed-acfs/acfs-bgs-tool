import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { SERVER_API_URL } from '../../core/config';
import { OrdersView, discordInlineToHtml, ordersView } from '../../core/orders-view';
import { AuthService } from '../auth.service';
import { OrdersDoc } from '../orders/orders.store';

/**
 * "Ordini" for the members (Membro Flotta, Cadetto) and the officers: the last orders the
 * officers published, laid out to be read — on a phone too — instead of the Discord Markdown.
 * Italian only, like the editor. The server checks the role (`/auth/orders/published`).
 *
 * Suspended since 22 October 2026 (see {@link MEMBERS_PAGE_SUSPENDED}): nobody sees it while the
 * editor is rebuilt as a text editor, which no longer fills the structured items this page shows.
 */
/** The user's choice of 22 October 2026: no members' page while the new editor is tried out. */
const MEMBERS_PAGE_SUSPENDED = true;

@Component({
  selector: 'app-orders-reader',
  imports: [MatButtonModule, RouterLink],
  templateUrl: './orders-reader.component.html',
  styleUrl: './orders-reader.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersReaderComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  protected readonly state = signal<'loading' | 'ready' | 'empty' | 'forbidden' | 'error' | 'suspended'>(
    MEMBERS_PAGE_SUSPENDED ? 'suspended' : 'loading',
  );
  protected readonly doc = signal<OrdersDoc | null>(null);
  protected readonly view = computed<OrdersView | null>(() => {
    const data = this.doc()?.data;
    return data ? ordersView(data) : null;
  });
  protected readonly html = discordInlineToHtml;

  /** Same colours as the Priority pills in the table: P1, P2, P3, then P4 and below alike. */
  protected pillClass(priority: number): string {
    return priority <= 3 ? `P${Math.max(priority, 1)}` : 'P4';
  }

  /** "21:40 del 18/10" in local time: when and by whom, so the reader knows how fresh they are. */
  protected readonly publishedLabel = computed(() => {
    const doc = this.doc();
    if (!doc?.updated_at) {
      return '';
    }
    const at = new Date(doc.updated_at).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    return `Pubblicati il ${at}${doc.updated_by ? ` da ${doc.updated_by}` : ''}.`;
  });

  async ngOnInit(): Promise<void> {
    await this.auth.load();
    if (MEMBERS_PAGE_SUSPENDED) {
      return;
    }
    const session = this.auth.session();
    if (!session || !SERVER_API_URL) {
      this.state.set('forbidden');
      return;
    }
    try {
      const response = await fetch(`${SERVER_API_URL}/auth/orders/published`, {
        credentials: 'include',
        cache: 'no-store',
        signal: AbortSignal.timeout(8000),
      });
      if (response.status === 401 || response.status === 403) {
        this.state.set('forbidden');
        return;
      }
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const doc = (await response.json()) as OrdersDoc;
      this.doc.set(doc);
      this.state.set(doc.data ? 'ready' : 'empty');
    } catch {
      this.state.set('error');
    }
  }
}
