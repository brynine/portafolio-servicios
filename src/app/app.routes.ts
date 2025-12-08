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

  // vista pública
  { path: '', component: HomeComponent, pathMatch: 'full' },

  // vista pública
  { path: 'explorar', component: ExplorarComponent },

  // ruta con parámetro dinámico
  { path: 'agendar-asesoria/:id', component: AgendarAsesoriaComponent },

  // acceso solo para administradores
  {
    path: 'admin',
    component: DashboardComponent,
    canActivate: [authGuard, adminGuard]
  },

  // acceso solo para programadores
  {
    path: 'programador',
    component: Portafolio,
    canActivate: [authGuard, programadorGuard]
  },

  // ruta por defecto si la url no coincide
  { path: '**', redirectTo: '', pathMatch: 'full' }
];
