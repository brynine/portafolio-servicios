import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where
} from 'firebase/firestore';

import { environment } from '../../../../../environments/environment';
import { initializeApp } from 'firebase/app';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit {

  db = getFirestore(initializeApp(environment.firebase));

  vista: string = 'crear';

  programadores: any[] = [];

  nuevoProgramador = {
    name: '',
    email: '',
    specialty: ''
  };

  programadorEditando: any = null;
  programadorSeleccionado: any = null;
  horariosProgramador: any[] = [];
  horarioEditando: any = null;
  modoEditarHorario: boolean = false;

  nuevoHorario = {
    dia: '',
    horaInicio: '',
    horaFin: ''
  };

  async ngOnInit() {
    await this.cargarProgramadores();
  }

  async crearProgramador() {

  const data = {
    name: this.nuevoProgramador.name,
    email: this.nuevoProgramador.email,
    specialty: this.nuevoProgramador.specialty,
    role: 'programador'
  };

  const ref = await addDoc(collection(this.db, 'users'), data);

  await updateDoc(ref, { uid: ref.id });

  alert('Programador creado correctamente');

  this.nuevoProgramador = { name: '', email: '', specialty: '' };

  await this.cargarProgramadores();
}

  async cargarProgramadores() {

    const q = query(
      collection(this.db, 'users'),
      where('role', '==', 'programador')
    );

    const snap = await getDocs(q);

    this.programadores = snap.docs.map(d => ({
      uid: d.id,
      ...d.data()
    }));
  }

  editarProgramador(p: any) {
    this.programadorEditando = { ...p };
    this.vista = 'editar';
  }

  async actualizarProgramador() {

    const ref = doc(this.db, 'users', this.programadorEditando.uid);

    await updateDoc(ref, this.programadorEditando);

    alert('✔ Programador actualizado');

    this.vista = 'lista';
    await this.cargarProgramadores();
  }

  async eliminarProgramador(uid: string) {

    if (!confirm("¿Eliminar este programador?")) return;

    const ref = doc(this.db, 'users', uid);

    await deleteDoc(ref);

    alert('🗑 Programador eliminado');

    await this.cargarProgramadores();
  }

  async guardarHorario() {

    if (!this.programadorSeleccionado) return;

    if (!this.nuevoHorario.horaInicio || !this.nuevoHorario.horaFin) {
      alert('Debe seleccionar hora inicio y hora fin.');
      return;
    }

    if (this.nuevoHorario.horaInicio >= this.nuevoHorario.horaFin) {
      alert('La hora de inicio debe ser menor que la hora de fin.');
      return;
    }

    await addDoc(collection(this.db, 'horarios'), {
      uid: this.programadorSeleccionado.uid,
      dia: this.nuevoHorario.dia,
      horaInicio: this.nuevoHorario.horaInicio,
      horaFin: this.nuevoHorario.horaFin
    });

    alert('✔ Horario agregado');

    this.nuevoHorario = { dia: '', horaInicio: '', horaFin: '' };

    await this.cargarHorariosProgramador();
  }

  async cargarHorariosProgramador() {

    if (!this.programadorSeleccionado) return;

    const q = query(
      collection(this.db, 'horarios'),
      where('uid', '==', this.programadorSeleccionado.uid)
    );

    const snap = await getDocs(q);

    this.horariosProgramador = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));
  }

  editarHorario(horario: any) {
    this.modoEditarHorario = true;
    this.horarioEditando = { ...horario };
  }

  async actualizarHorario() {

    if (!this.horarioEditando.id) {
      alert("Error: el horario no tiene ID");
      return;
    }

    if (this.horarioEditando.horaInicio >= this.horarioEditando.horaFin) {
      alert("La hora de inicio debe ser menor que la hora fin.");
      return;
    }

    const ref = doc(this.db, 'horarios', this.horarioEditando.id);

    await updateDoc(ref, {
      dia: this.horarioEditando.dia,
      horaInicio: this.horarioEditando.horaInicio,
      horaFin: this.horarioEditando.horaFin
    });

    alert("✔ Horario actualizado");

    this.modoEditarHorario = false;
    this.horarioEditando = null;

    await this.cargarHorariosProgramador();
  }

  cancelarEdicionHorario() {
    this.modoEditarHorario = false;
    this.horarioEditando = null;
  }

  async eliminarHorario(id: string) {

    if (!confirm("¿Eliminar este horario?")) return;

    const ref = doc(this.db, 'horarios', id);
    await deleteDoc(ref);

    alert("🗑 Horario eliminado");

    await this.cargarHorariosProgramador();
  }

  abrirHorarios() {
  this.vista = 'horarios';
  this.programadorSeleccionado = null;
  this.horariosProgramador = [];
}

async cambiarProgramador() {
  if (this.programadorSeleccionado) {
    await this.cargarHorariosProgramador();
  } else {
    this.horariosProgramador = [];
  }
}

}