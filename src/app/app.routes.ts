import { Routes } from '@angular/router';
import { BgsTableComponent } from './bgs-table/bgs-table.component';
import { OrdersPageComponent } from './orders/orders-page.component';
import { WorkPageComponent } from './work/work-page.component';

export const routes: Routes = [
  {
    path: 'ordini',
    component: OrdersPageComponent,
  },
  {
    // Lavoro BGS-Tally per pilota, solo ufficiali (password controllata dal server), in beta.
    path: 'activity',
    component: WorkPageComponent,
  },
  {
    path: '**',
    component: BgsTableComponent,
  },
];
