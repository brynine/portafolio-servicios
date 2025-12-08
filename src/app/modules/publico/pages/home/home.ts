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
  imports: [CommonModule, FormsModule]
})
export class HomeComponent implements OnInit {

  // conexión local a firestore
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
    // cargar lista de programadores visibles
    await this.cargarProgramadores();
  }

  async loginGoogle() {
    try {
      // inicio de sesión usando google
      await this.auth.loginWithGoogle();
    } catch (error) {
      console.error('Error en login:', error);
    }
  }

  async cargarProgramadores() {
    const ref = collection(this.db, 'users');
    const snap = await getDocs(ref);

    // solo roles programador visibles
    this.programadores = snap.docs
      .map(d => d.data())
      .filter((u: any) => u.role === 'programador');
  }

  async agendarAsesoria() {
    // validación básica de formulario
    if (!this.programadorSeleccionado || !this.fechaSeleccionada) {
      alert('Debes seleccionar programador y fecha');
      return;
    }

    if (!this.auth.currentUserData) {
      alert('Usuario no autenticado');
      return;
    }

    // estructura de documento a guardar
    const solicitud = {
      solicitante: this.auth.currentUserData.uid,
      programador: this.programadorSeleccionado,
      fecha: this.fechaSeleccionada,
      comentario: this.comentario,
      estado: 'pendiente',
      createdAt: new Date()
    };

    // guarda solicitud en firestore
    await addDoc(collection(this.db, 'asesorias'), solicitud);

    alert('Asesoría enviada correctamente');

    // reset de campos
    this.comentario = '';
   	this.fechaSeleccionada = '';
    this.programadorSeleccionado = '';
  }

  entrar() {
    // redirección según rol
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

  agendarAsesoriaHome() {
    this.router.navigate(['/explorar']);
  }
}
