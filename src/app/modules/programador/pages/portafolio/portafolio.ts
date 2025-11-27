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
  getDocs,
  updateDoc,
  doc
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
  asesorias: any[] = [];


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
    console.log('Entre al portafolio');
    await this.cargarProyectos();
    await this.cargarAsesorias();
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

  async cargarAsesorias() {

  if (!this.auth.currentUserData) return;

  const q = query(
    collection(this.db, 'asesorias'),
    where('programador', '==', this.auth.currentUserData.uid)
  );

  const snapshot = await getDocs(q);

  this.asesorias = snapshot.docs.map(d => ({
    id: d.id,
    ...d.data()
  }));

  console.log('Asesorías recibidas:', this.asesorias);
}

async responder(id: string, estado: string) {

  const ref = doc(this.db, 'asesorias', id);

  await updateDoc(ref, {
    estado: estado
  });

  alert(`Asesoría ${estado}`);

  await this.cargarAsesorias();
}


}
