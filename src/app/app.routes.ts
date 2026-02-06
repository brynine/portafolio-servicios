import { Routes } from '@angular/router';

// público
import { HomeComponent } from './modules/publico/pages/home/home';
import { ExplorarComponent } from './modules/publico/pages/explorar/explorar';
import { AgendarAsesoriaComponent } from './modules/publico/pages/agendar-asesoria/agendar-asesoria';

// admin
import { DashboardComponent } from './modules/admin/pages/dashboard/dashboard';

// programador
import { Portafolio } from './modules/programador/pages/portafolio/portafolio';

import { adminGuard } from './core/guards/admin-guard';
import { programadorGuard } from './core/guards/programador-guard';

export const routes: Routes = [

  // ===== RUTAS PÚBLICAS =====
  { path: '', component: HomeComponent },
  { path: 'explorar', component: ExplorarComponent },
  { path: 'agendar-asesoria/:id', component: AgendarAsesoriaComponent },

  // ===== ADMIN =====
 {
    path: 'admin',
    canActivate: [adminGuard],
    children: [
      {
        path: 'dashboard',
        component: DashboardComponent
      }
    ]
  },

  // ===== PROGRAMADOR =====
  {
    path: 'programador',
    component: Portafolio,
    canActivate: [programadorGuard]
  },

  // ===== FALLBACK =====
  { path: '**', redirectTo: '' }
];
