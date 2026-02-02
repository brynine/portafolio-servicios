import { Routes } from '@angular/router';

// público
import { HomeComponent } from './modules/publico/pages/home/home';
import { ExplorarComponent } from './modules/publico/pages/explorar/explorar';
import { AgendarAsesoriaComponent } from './modules/publico/pages/agendar-asesoria/agendar-asesoria';

// admin
import { DashboardComponent } from './modules/admin/pages/dashboard/dashboard';
import { NotificationsComponent } from './modules/admin/pages/notifications/notifications.component';

// programador
import { Portafolio } from './modules/programador/pages/portafolio/portafolio';

export const routes: Routes = [

  // ===== RUTAS PÚBLICAS =====
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'explorar',
    component: ExplorarComponent
  },
  {
    path: 'agendar-asesoria/:id',
    component: AgendarAsesoriaComponent
  },

  // ===== ADMIN =====
  {
    path: 'admin',
    component: DashboardComponent, // ⬅️ CONTENEDOR
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      },
      {
        path: 'dashboard',
        component: DashboardComponent
      },
      {
        path: 'notifications',
        component: NotificationsComponent
      }
    ]
  },

  // ===== PROGRAMADOR =====
  {
    path: 'programador',
    component: Portafolio
  },

  // ===== FALLBACK =====
  {
    path: '**',
    redirectTo: ''
  }
];
