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

  // conexión a Firebase
  db = getFirestore(initializeApp(environment.firebase));

  // controla qué vista se muestra (crear, editar o lista)
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

  // estados de los modales
  mostrarModalMensaje = false;
  mostrarModalConfirmacion = false;
  mensajeModal = "";
  accionPendiente: Function | null = null;

  // modelo para agregar horarios
  nuevoHorario = {
    dia: '',
    horaInicio: '',
    horaFin: ''
  };

  async ngOnInit() {
    await this.cargarProgramadores(); 
  }

  // crea un nuevo programador
  async crearProgramador() {
    const data = {
      name: this.nuevoProgramador.name,
      email: this.nuevoProgramador.email,
      specialty: this.nuevoProgramador.specialty,
      role: 'programador' 
    };

    const ref = await addDoc(collection(this.db, 'users'), data);

    // asigna uid con el id generado por Firestore
    await updateDoc(ref, { uid: ref.id });

    this.mostrarMensaje('Programador creado correctamente');

    this.nuevoProgramador = { name: '', email: '', specialty: '' };

    await this.cargarProgramadores();
  }

  // obtiene lista de programadores desde Firestore
  async cargarProgramadores() {
    const q = query(
      collection(this.db, 'users'),
      where('role', '==', 'programador')
    );

    const snap = await getDocs(q);

    this.programadores = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));
  }

  // habilita modo edición
  editarProgramador(p: any) {
    this.programadorEditando = { ...p };
    this.vista = 'editar';
  }

  // guarda cambios del programador editado
  async actualizarProgramador() {
    const ref = doc(this.db, 'users', this.programadorEditando.id);

    await updateDoc(ref, this.programadorEditando);

    this.mostrarMensaje("✔ Programador actualizado");

    this.vista = 'lista';
    await this.cargarProgramadores();
  }

  // mensaje de confirmación antes de eliminar
  eliminarProgramador(id: string) {
    this.preguntar("¿Seguro que deseas eliminar este programador?", async () => {
      await this.eliminarProgramadorConfirmado(id);
    });
  }

  // elimina programador definitivamente
  async eliminarProgramadorConfirmado(id: string) {
    const ref = doc(this.db, 'users', id);
    await deleteDoc(ref);

    this.mostrarMensaje("🗑 Programador eliminado");
    await this.cargarProgramadores();

    // limpia selección si era el que estaba activo
    if (this.programadorSeleccionado?.id === id) {
      this.programadorSeleccionado = null;
      this.horariosProgramador = [];
    }
  }

  // agrega horario para un programador
  async guardarHorario() {
    if (!this.programadorSeleccionado) return;

    if (!this.nuevoHorario.horaInicio || !this.nuevoHorario.horaFin) {
      this.mostrarMensaje('Debe seleccionar hora inicio y hora fin.');
      return;
    }

    if (this.nuevoHorario.horaInicio >= this.nuevoHorario.horaFin) {
      this.mostrarMensaje('La hora de inicio debe ser menor que la hora de fin.');
      return;
    }

    await addDoc(collection(this.db, 'horarios'), {
      uid: this.programadorSeleccionado.id,
      dia: this.nuevoHorario.dia,
      horaInicio: this.nuevoHorario.horaInicio,
      horaFin: this.nuevoHorario.horaFin
    });

    this.mostrarMensaje('✔ Horario agregado');

    this.nuevoHorario = { dia: '', horaInicio: '', horaFin: '' };

    await this.cargarHorariosProgramador();
  }

  // carga horarios del programador seleccionado
  async cargarHorariosProgramador() {
    if (!this.programadorSeleccionado) return;

    const q = query(
      collection(this.db, 'horarios'),
      where('uid', '==', this.programadorSeleccionado.id)
    );

    const snap = await getDocs(q);

    this.horariosProgramador = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));
  }

  // activa modo edición de horario
  editarHorario(horario: any) {
    this.modoEditarHorario = true;
    this.horarioEditando = { ...horario };
  }

  // guarda actualización de horario
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

    this.mostrarMensaje("✔ Horario actualizado");

    this.modoEditarHorario = false;
    this.horarioEditando = null;

    await this.cargarHorariosProgramador();
  }

  cancelarEdicionHorario() {
    this.modoEditarHorario = false;
    this.horarioEditando = null;
  }

  // elimina horario con confirmación
  eliminarHorario(id: string) {
    this.preguntar("¿Seguro que deseas eliminar este horario?", async () => {
      await this.eliminarHorarioConfirmado(id);
    });
  }

  async eliminarHorarioConfirmado(id: string) {
    const ref = doc(this.db, 'horarios', id);
    await deleteDoc(ref);

    this.mostrarMensaje("🗑 Horario eliminado correctamente");

    await this.cargarHorariosProgramador();
  }

  // recarga horarios cuando cambia programador
  async cambiarProgramador() {
    if (this.programadorSeleccionado) {
      await this.cargarHorariosProgramador();
    } else {
      this.horariosProgramador = [];
    }
  }

  // muestra modal con mensaje simple
  mostrarMensaje(texto: string) {
    this.mensajeModal = texto;
    this.mostrarModalMensaje = true;
  }

  // modal para confirmaciones
  preguntar(texto: string, accion: Function) {
    this.mensajeModal = texto;
    this.accionPendiente = accion;
    this.mostrarModalConfirmacion = true;
  }

  // ejecuta acción confirmada
  confirmarAccion() {
    if (this.accionPendiente) this.accionPendiente();
    this.accionPendiente = null;
    this.mostrarModalConfirmacion = false;
  }

  cancelarAccion() {
    this.accionPendiente = null;
    this.mostrarModalConfirmacion = false;
  }
}
