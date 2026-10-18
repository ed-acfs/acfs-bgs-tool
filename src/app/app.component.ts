import { Component, computed, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterOutlet } from '@angular/router';
import { version } from '../../package.json';
import { I18nService } from './i18n.service';

/** Nomi che la nota in fondo alla pagina collega ai siti ufficiali: uguali in tutte le lingue. */
const FOOTER_LINKS: Record<string, string> = {
  'Elite Dangerous': 'https://www.elitedangerous.com/',
  'Frontier Developments': 'https://www.frontier.co.uk/',
};
const FOOTER_LINK_PATTERN = new RegExp(`(${Object.keys(FOOTER_LINKS).join('|')})`);

export interface FooterPart {
  text: string;
  href?: string;
}

/** La nota tradotta divisa in pezzi, con il collegamento sui nomi di FOOTER_LINKS. */
export function footerParts(text: string): FooterPart[] {
  return text
    .split(FOOTER_LINK_PATTERN)
    .filter(part => part !== '')
    .map(part => ({ text: part, href: FOOTER_LINKS[part] }));
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class App {
  /** Per la nota in fondo alla pagina, nella lingua scelta. */
  protected readonly i18n = inject(I18nService);
  protected readonly disclaimer = computed(() => footerParts(this.i18n.t('footer.disclaimer')));

  constructor() {
    // The browser tab names the release too, like the page title (index.html has no version to keep in sync).
    inject(Title).setTitle(`ACFS BGS Tool ${version}`);
  }
}
