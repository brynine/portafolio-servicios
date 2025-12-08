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
  cargandoRuta = true; // controla animación de carga de rutas

  constructor(
    public auth: AuthService,
    private location: Location,
    public router: Router
  ) {

    // escucha cambios en la navegación para activar loader
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) this.cargandoRuta = true;
      if (event instanceof NavigationEnd) setTimeout(() => this.cargandoRuta = false, 100);
    });

    // fallback por si algo se traba al cargar
    setTimeout(() => this.cargandoRuta = false, 300);

    // escucha cambios del usuario (login / logout / cambio de rol)
    this.auth.onUserDataChange((userData) => {

      const rutaActual = this.router.url;

      // rutas donde no se fuerza redirección
      const rutasPublicas = [
        '/',
        '/explorar'
      ];

      // permitir ruta dinámica
      if (rutaActual.startsWith('/agendar-asesoria/')) {
        rutasPublicas.push(rutaActual);
      }

      // si no hay usuario no hace nada
      if (!userData) {
        this.redirigido = false;
        return;
      }

      console.log("🔄 Cambio detectado - Nuevo Rol:", userData.role);

      // evita redirecciones repetidas
      if (this.redirigido) return;

      const role = userData.role;

      // redirección automática según rol
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

  // login con google
  async loginGoogle() {
    const user = await this.auth.loginWithGoogle();
    if (!user) return;

    // notifica a la app que el usuario ya está listo
    this.redirigido = false;
    this.auth.emitAppUserReady();
  }

  abrirPerfil() {
    this.mostrarPerfil = true;
    this.mostrarMenu = false;
  }

  cerrarPerfil() {
    this.mostrarPerfil = false;
  }

  // cambia de cuenta manteniendo la lógica del rol
  async cambiarCuenta() {
    this.mostrarMenu = false;
    this.redirigido = false;

    const user = await this.auth.loginWithGoogle();

    if (user) this.auth.emitAppUserReady();
  }

  // logout completo
  async logout() {
    this.mostrarMenu = false;
    this.redirigido = false;
    await this.auth.logout();
    this.router.navigate(['/']);
  }

  // retroceder en historial
  irAtras() {
    this.location.back();
  }

  // detectar si está en la home para ocultar botón
  isHome() {
    return this.router.url === '/';
  }
}
