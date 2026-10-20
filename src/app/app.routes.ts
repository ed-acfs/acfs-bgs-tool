import { Routes } from '@angular/router';
import { BgsTableComponent } from './bgs-table/bgs-table.component';
import { OrdersPageComponent } from './orders/orders-page.component';
import { OrdersReaderComponent } from './orders-reader/orders-reader.component';
import { WorkPageComponent } from './work/work-page.component';

export const routes: Routes = [
  {
    // Editor degli Ordini, per gli ufficiali; un membro viene mandato alla pagina di lettura.
    path: 'ordini',
    component: OrdersPageComponent,
  },
  {
    // Gli ultimi Ordini pubblicati, per membri e ufficiali.
    path: 'ordini/pubblicati',
    component: OrdersReaderComponent,
  },
  {
    // Lavoro BGS-Tally per pilota, per membri e ufficiali (ruolo controllato dal server), in beta.
    path: 'activity',
    component: WorkPageComponent,
  },
  {
    path: '**',
    component: BgsTableComponent,
  },
];
