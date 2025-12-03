import { Routes } from '@angular/router';
import { HomeComponent } from './modules/publico/pages/home/home';
import { DashboardComponent } from './modules/admin/pages/dashboard/dashboard';
import { Portafolio } from './modules/programador/pages/portafolio/portafolio';
import { ExplorarComponent } from './modules/publico/pages/explorar/explorar';
import { AgendarAsesoriaComponent } from './modules/publico/pages/agendar-asesoria/agendar-asesoria';
import { authGuard } from './core/guards/auth-guard';
import { adminGuard } from './core/guards/admin-guard';
import { programadorGuard } from './core/guards/programador-guard';

export const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },

  { path: 'explorar', component: ExplorarComponent },

  { path: 'agendar-asesoria/:id', component: AgendarAsesoriaComponent },

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

  { path: '**', redirectTo: '', pathMatch: 'full' }
];

