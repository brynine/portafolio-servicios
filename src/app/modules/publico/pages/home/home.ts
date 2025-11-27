import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../../../core/services/auth';

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  addDoc
} from 'firebase/firestore';

import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.html',
  styleUrl: './home.scss',
  imports: [
    CommonModule,
    FormsModule
  ]
})
export class HomeComponent implements OnInit {

  db = getFirestore(initializeApp(environment.firebase));

  programadores: any[] = [];
  programadorSeleccionado = '';
  fechaSeleccionada = '';
  comentario = '';

  constructor(
    public auth: AuthService,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.cargarProgramadores();
  }

  async loginGoogle() {

    try {
      const user = await this.auth.loginWithGoogle();

      if (!user) {
        console.warn('No se obtuvo usuario');
        return;
      }

      console.log('Usuario logeado:', user.email);

      this.router.navigateByUrl('/');

    } catch (error) {
      console.error('Error en login:', error);
    }
  }

  async cargarProgramadores() {
    const ref = collection(this.db, 'users');
    const snap = await getDocs(ref);

    this.programadores = snap.docs
      .map(d => d.data())
      .filter((u: any) => u.role === 'programador');

    console.log('Programadores encontrados:', this.programadores);
  }

  async agendarAsesoria() {

    if (!this.programadorSeleccionado || !this.fechaSeleccionada) {
      alert('Debes seleccionar programador y fecha');
      return;
    }

    if (!this.auth.currentUserData) {
      alert('Usuario no autenticado');
      return;
    }

    const solicitud = {
      solicitante: this.auth.currentUserData.uid,
      programador: this.programadorSeleccionado,
      fecha: this.fechaSeleccionada,
      comentario: this.comentario,
      estado: 'pendiente',
      createdAt: new Date()
    };

    await addDoc(collection(this.db, 'asesorias'), solicitud);

    alert('Asesoría enviada correctamente');

    this.comentario = '';
    this.fechaSeleccionada = '';
    this.programadorSeleccionado = '';
  }

  entrar() {
  const role = this.auth.getRole();

  if (role === 'admin') {
    this.router.navigate(['/admin']);
  } else if (role === 'programador') {
    this.router.navigate(['/programador']);
  } else {
    this.router.navigate(['/explorar']);
  }
}


  async logout() {
  await this.auth.logout();
}


}
