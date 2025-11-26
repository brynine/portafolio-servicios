import { Routes } from '@angular/router';

import { HomeComponent } from './modules/publico/pages/home/home';
import { DashboardComponent } from './modules/admin/pages/dashboard/dashboard';
import { Portafolio } from './modules/programador/pages/portafolio/portafolio';

import { authGuard } from './core/guards/auth-guard';
import { adminGuard } from './core/guards/admin-guard';
import { programadorGuard } from './core/guards/programador-guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },

  {
    path: 'admin',
    component: DashboardComponent,
    canActivate: [authGuard, adminGuard]
  },

  {
    path: 'programador',
    component: Portafolio,
    canActivate: [authGuard, programadorGuard]
  },

  { path: '**', redirectTo: '' }
];
