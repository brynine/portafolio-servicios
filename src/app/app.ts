import { Component } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth';
import { Location } from '@angular/common';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {

  user: any = null;

  constructor(
    private authService: AuthService,
    private location: Location,
    public router: Router
  ) {
    this.authService.onAuthChange((u) => {
      this.user = u;
      console.log('Cambio de usuario:', u);
    });
  }

  async loginGoogle() {
    try {
      const user = await this.authService.loginWithGoogle();
      this.user = user;
      console.log('Login exitoso:', user);
    } catch (err) {
      console.error('Error en login:', err);
    }
  }

  async logout() {
    await this.authService.logout();
    this.user = null;
  }

  irAtras() {
    this.location.back();
  }

  isHome(){
    return this.router.url === '/';
  }
}
