import { Component } from '@angular/core';
import { Router, RouterOutlet, NavigationStart, NavigationEnd } from '@angular/router';
import { AuthService } from './core/services/auth';
import { Location } from '@angular/common';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
})
export class App {

  mostrarMenu = false;
  mostrarPerfil = false;
  redirigido = false; 

  cargandoRuta = true;

  constructor(
    public auth: AuthService,
    private location: Location,
    public router: Router
  ) {

    this.router.events.subscribe(event => {

      if (event instanceof NavigationStart) {
        this.cargandoRuta = true;
      }

      if (event instanceof NavigationEnd) {
        setTimeout(() => {
          this.cargandoRuta = false;
        }, 100);
      }
    });

    setTimeout(() => {
      this.cargandoRuta = false;
    }, 300);

    this.auth.onUserDataChange((userData) => {

  const rutaActual = this.router.url;

  const rutasPublicas = [
    '/',
    '/explorar'
  ];

  if (rutaActual.startsWith('/agendar-asesoria/')) {
    rutasPublicas.push(rutaActual);
  }

  if (!userData) {
    this.redirigido = false;
    return;
  }

  if (this.redirigido) return;

  const role = userData.role;

  if (role === 'admin') {
    this.redirigido = true;
    this.router.navigate(['/admin']);
  } 
  else if (role === 'programador') {
    this.redirigido = true;
    this.router.navigate(['/programador']);
  } 
  else {
    this.redirigido = true;
    this.router.navigate(['/explorar']);
  }
});

  }

  async loginGoogle() {
    const user = await this.auth.loginWithGoogle();
    if (!user) return;

    const role = this.auth.getRole();

    if (role === 'admin') this.router.navigate(['/admin']);
    else if (role === 'programador') this.router.navigate(['/programador']);
    else this.router.navigate(['/explorar']);
  }

  abrirPerfil() {
    this.mostrarPerfil = true;
    this.mostrarMenu = false;
  }

  cerrarPerfil() {
    this.mostrarPerfil = false;
  }

  async cambiarCuenta() {
    this.mostrarMenu = false;
    this.redirigido = false;
    await this.auth.loginWithGoogle();
  }

  async logout() {
    this.mostrarMenu = false;
    this.redirigido = false;
    await this.auth.logout();
    this.router.navigate(['/']);
  }

  irAtras() {
    this.location.back();
  }

  isHome() {
    return this.router.url === '/';
  }
}