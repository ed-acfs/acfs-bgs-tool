import { Routes } from '@angular/router';
import { BgsTableComponent } from './bgs-table/bgs-table.component';
import { OrdersPageComponent } from './orders/orders-page.component';
import { OrdersTextEditorComponent } from './orders/orders-text-editor.component';
import { OrdersReaderComponent } from './orders-reader/orders-reader.component';
import { WorkPageComponent } from './work/work-page.component';
import { ColonyPlotterPageComponent } from './colony-plotter/colony-plotter-page.component';

export const routes: Routes = [
  {
    // Editor degli Ordini a testo, per gli ufficiali (bozza, dal 22 ottobre 2026).
    path: 'ordini',
    component: OrdersTextEditorComponent,
  },
  {
    // Il vecchio editor a moduli, tenuto per confronto mentre si prova quello a testo.
    path: 'ordini/moduli',
    component: OrdersPageComponent,
  },
  {
    // Gli ultimi Ordini pubblicati, per membri e ufficiali: sospesa dal 22 ottobre 2026.
    path: 'ordini/pubblicati',
    component: OrdersReaderComponent,
  },
  {
    // Lavoro BGS-Tally per pilota, per membri e ufficiali (ruolo controllato dal server), in beta.
    path: 'activity',
    component: WorkPageComponent,
  },
  {
    // Colony Plotter: obiettivi di colonizzazione, per i membri (ruolo controllato dal server), in beta.
    path: 'colony-plotter',
    component: ColonyPlotterPageComponent,
  },
  {
    path: '**',
    component: BgsTableComponent,
  },
];
