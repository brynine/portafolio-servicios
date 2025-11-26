import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  getDocs
} from 'firebase/firestore';

import { environment } from '../../../../../environments/environment';
import { AuthService } from '../../../../core/services/auth';

@Component({
  selector: 'app-portafolio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './portafolio.html',
  styleUrl: './portafolio.scss',
})
export class Portafolio implements OnInit {

  db = getFirestore(initializeApp(environment.firebase));

  proyectosAcademicos: any[] = [];
  proyectosLaborales: any[] = [];

  nuevoProyecto = {
    nombre: '',
    descripcion: '',
    tipo: 'academico',
    participacion: '',
    tecnologias: '',
    repositorio: '',
    deploy: ''
  };

  constructor(private auth: AuthService) {}

  async ngOnInit() {
    await this.cargarProyectos();
  }

  async guardarProyecto() {

    if (!this.auth.currentUserData) {
      alert('Usuario no autenticado');
      return;
    }

    const proyecto = {
      ...this.nuevoProyecto,
      uid: this.auth.currentUserData.uid,
      createdAt: new Date()
    };

    await addDoc(collection(this.db, 'proyectos'), proyecto);

    alert('Proyecto guardado');

    this.nuevoProyecto = {
      nombre: '',
      descripcion: '',
      tipo: 'academico',
      participacion: '',
      tecnologias: '',
      repositorio: '',
      deploy: ''
    };

    await this.cargarProyectos();
  }

  async cargarProyectos() {

    if (!this.auth.currentUserData) return;

    const q = query(
      collection(this.db, 'proyectos'),
      where('uid', '==', this.auth.currentUserData.uid)
    );

    const snapshot = await getDocs(q);

    const datos = snapshot.docs.map(doc => doc.data());

    this.proyectosAcademicos = datos.filter(p => p['tipo'] === 'academico');
    this.proyectosLaborales = datos.filter(p => p['tipo'] === 'laboral');


  }
}
