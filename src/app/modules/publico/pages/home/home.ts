import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
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
    RouterLink,
    FormsModule
  ]
})
export class HomeComponent implements OnInit {

  // Firebase
  db = getFirestore(initializeApp(environment.firebase));

  // Asesorías
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

  // Login
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

  // Programadores
  async cargarProgramadores() {
    const ref = collection(this.db, 'users');
    const snap = await getDocs(ref);

    this.programadores = snap.docs
      .map(d => d.data())
      .filter((u: any) => u.role === 'programador');

    console.log('Programadores encontrados:', this.programadores);
  }

  // Asesorias
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

    // Limpiar formulario
    this.comentario = '';
    this.fechaSeleccionada = '';
    this.programadorSeleccionado = '';
  }

}
