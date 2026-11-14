import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { NEWS_ID, NEWS_SEEN_KEY, shouldShowNews } from '../../core/news';
import { I18nService } from '../i18n.service';

/** Le novità importanti dell'ultima versione, in poche righe (vedi core/news.ts). */
@Component({
  selector: 'app-news-dialog',
  imports: [MatButtonModule, MatDialogModule],
  templateUrl: './news-dialog.component.html',
  styleUrl: './news-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewsDialogComponent {
  protected readonly t = inject(I18nService).t;
  protected readonly items = ['news.item1', 'news.item2', 'news.item3'] as const;
}

/** Se questo browser deve vedere la finestra; false se localStorage non risponde. */
export function newsPending(): boolean {
  try {
    return shouldShowNews(localStorage.getItem(NEWS_SEEN_KEY));
  } catch {
    return false;
  }
}

/** Segna la finestra come vista, comunque sia stata chiusa. */
export function markNewsSeen(): void {
  try {
    localStorage.setItem(NEWS_SEEN_KEY, NEWS_ID);
  } catch {
    // Senza localStorage la finestra ricomparirà: meglio che un errore.
  }
}
