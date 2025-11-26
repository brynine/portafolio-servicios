import { Component } from '@angular/core';
import { RouterOutlet  } from '@angular/router';
import { AuthService } from './core/services/auth';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  user: any = null;

  constructor(private authService: AuthService) {
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
}
