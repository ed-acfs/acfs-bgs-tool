import { registerLocaleData } from '@angular/common';
import localeIt from '@angular/common/locales/it';
import {
  ApplicationConfig,
  isDevMode,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';

import { routes } from './app.routes';

// Italian number and date formats ("42,5%", "1.234") for the number/date pipes.
registerLocaleData(localeIt);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    { provide: LOCALE_ID, useValue: 'it-IT' },
    // Installable app and offline use (see ngsw-config.json): the last downloaded data stays
    // readable without a connection, still labelled with its age. Production builds only.
    // Its scope is the tool's own folder, so it never clashes with the main site's worker.
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
