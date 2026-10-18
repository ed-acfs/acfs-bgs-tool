import { Component, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterOutlet } from '@angular/router';
import { version } from '../../package.json';
import { I18nService } from './i18n.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class App {
  /** Per la nota in fondo alla pagina, nella lingua scelta. */
  protected readonly i18n = inject(I18nService);

  constructor() {
    // The browser tab names the release too, like the page title (index.html has no version to keep in sync).
    inject(Title).setTitle(`ACFS BGS Tool ${version}`);
  }
}
