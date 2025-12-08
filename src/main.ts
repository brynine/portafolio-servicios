import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';

import { App } from './app/app';
import { routes } from './app/app.routes';
import { environment } from './environments/environment';

import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideAuth, getAuth } from '@angular/fire/auth';

bootstrapApplication(App, {
  providers: [
    provideRouter(routes), // registra las rutas de la app

    // inicializa firebase usando la config del environment
    provideFirebaseApp(() => initializeApp(environment.firebase)),

    provideAuth(() => getAuth()), // habilita autenticación firebase
    provideFirestore(() => getFirestore()), // habilita firestore (base de datos)
  ]
})
.catch(err => console.error(err)); // muestra errores si el bootstrap falla
