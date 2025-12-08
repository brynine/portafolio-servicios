import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { deleteDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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

/* interfaz para tipar proyectos */
interface Proyecto {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: 'academico' | 'laboral';
  participacion: string;
  tecnologias: string[];
  repositorio: string;
  deploy: string;
  uid: string;
}

@Component({
  selector: 'app-portafolio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './portafolio.html',
  styleUrl: './portafolio.scss',
})
export class Portafolio implements OnInit, OnDestroy {

  db = getFirestore(initializeApp(environment.firebase)); // conexión con Firestore

  vista: string = 'agregar'; // controla qué pantalla se muestra

  proyectosAcademicos: any[] = [];
  proyectosLaborales: any[] = [];
  filtroProyecto: string = '';
  proyectosFiltrados: any[] = [];
  proyectoEditando: any = null;

  asesorias: any[] = [];

  perfil: any = {};
  userDocId: string = '';
  storage = getStorage(); // almacenamiento Firebase para fotos

  /* control de modales */
  mostrarModalMensaje = false;
  mostrarModalConfirmacion = false;
  mensajeModal = "";
  accionPendiente: Function | null = null;

  /* modelo inicial para nuevo proyecto */
  nuevoProyecto = {
    nombre: '',
    descripcion: '',
    tipo: 'academico',
    participacion: '',
    tecnologias: '',
    repositorio: '',
    deploy: ''
  };

  private unsubscribe: (() => void) | null = null;

  constructor(private auth: AuthService) {}

  async ngOnInit() {

    // carga inicial
    await this.refrescarPantalla();

    // escucha cambios de usuario (logout o cambio de cuenta)
    this.auth.onUserDataChange(async (user) => {
      console.log(" Usuario cambió:", user);
      await this.refrescarPantalla();
    });
  }

  ngOnDestroy() {
    this.unsubscribe = null; // limpieza de listeners
  }

  /* método central que actualiza toda la pantalla */
  private async refrescarPantalla() {
    await this.cargarProyectos();
    await this.cargarAsesorias();
    await this.cargarPerfil();
  }

  /* crea y guarda un nuevo proyecto */
  async guardarProyecto() {

    if (!this.auth.currentUserData) {
      this.mostrarMensaje('Usuario no autenticado');
      return;
    }

    const proyecto = {
      ...this.nuevoProyecto,
      uid: this.auth.currentUserData.uid, // asigna proyecto al usuario
      createdAt: new Date()
    };

    await addDoc(collection(this.db, 'proyectos'), proyecto);

    this.mostrarMensaje('✔ Proyecto guardado');

    // limpia formulario
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

  /* obtiene proyectos del usuario desde Firestore */
  async cargarProyectos() {

    if (!this.auth.currentUserData) return;

    const q = query(
      collection(this.db, 'proyectos'),
      where('uid', '==', this.auth.currentUserData.uid)
    );

    const snapshot = await getDocs(q);

    const datos: Proyecto[] = snapshot.docs.map(d => ({
      ...d.data() as Proyecto,
      id: d.id
    }));

    // separación según categoría
    this.proyectosAcademicos = datos.filter(p => p.tipo === 'academico');
    this.proyectosLaborales = datos.filter(p => p.tipo === 'laboral');

    this.filtrarProyectos();
  }

  /* buscador de proyectos */
  filtrarProyectos() {
    const texto = this.filtroProyecto.toLowerCase();

    const todos = [...this.proyectosAcademicos, ...this.proyectosLaborales];

    this.proyectosFiltrados = todos.filter(p =>
      p.nombre.toLowerCase().includes(texto) ||
      p.tecnologias.toLowerCase().includes(texto) ||
      p.descripcion.toLowerCase().includes(texto)
    );
  }

  /* activa modo edición */
  editarProyecto(proyecto: any) {
    this.proyectoEditando = { ...proyecto };
    this.vista = 'editar-proyecto';
  }

  cancelarEdicion() {
    this.proyectoEditando = null;
    this.vista = 'proyectos';
  }

  /* guarda cambios de un proyecto existente */
  async actualizarProyecto() {

    if (!this.proyectoEditando || !this.proyectoEditando.id) {
      this.mostrarMensaje("Error: el proyecto no tiene ID válido.");
      return;
    }

    try {
      const ref = doc(this.db, 'proyectos', this.proyectoEditando.id);

      await updateDoc(ref, {
        nombre: this.proyectoEditando.nombre,
        descripcion: this.proyectoEditando.descripcion,
        tipo: this.proyectoEditando.tipo,
        participacion: this.proyectoEditando.participacion,
        tecnologias: this.proyectoEditando.tecnologias,
        repositorio: this.proyectoEditando.repositorio,
        deploy: this.proyectoEditando.deploy
      });

      this.mostrarMensaje("✔ Proyecto actualizado correctamente");

      this.proyectoEditando = null;
      this.vista = 'proyectos';

      await this.cargarProyectos();

    } catch (error) {
      console.error("Error al actualizar:", error);
      this.mostrarMensaje(" Error al actualizar proyecto");
    }
  }

  /* elimina proyecto con confirmación */
  eliminarProyecto(id: string) {
    this.preguntar("⚠¿Seguro que deseas eliminar este proyecto?", async () => {
      await this.eliminarProyectoConfirmado(id);
    });
  }

  async eliminarProyectoConfirmado(id: string) {
    await deleteDoc(doc(this.db, 'proyectos', id));
    this.mostrarMensaje("🗑 Proyecto eliminado correctamente");
    await this.cargarProyectos();
  }

  /* carga solicitudes de asesorías del programador */
  async cargarAsesorias() {
    if (!this.auth.currentUserData) return;

    const q = query(
      collection(this.db, 'asesorias'),
      where('programadorId', '==', this.auth.currentUserData.uid)
    );

    const snapshot = await getDocs(q);

    this.asesorias = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));
  }

  /* actualiza estado de asesoría */
  async responder(id: string, estado: string) {
    await updateDoc(doc(this.db, 'asesorias', id), { estado });
    this.mostrarMensaje(`✔ Asesoría actualizada: ${estado}`);
    await this.cargarAsesorias();
  }

  confirmarEliminarAsesoria(id: string) {
    this.preguntar("⚠ ¿Deseas eliminar esta asesoría definitivamente?", async () => {
      await this.eliminarAsesoria(id);
    });
  }

  async eliminarAsesoria(id: string) {
    await deleteDoc(doc(this.db, 'asesorias', id));
    this.mostrarMensaje("🗑 Asesoría eliminada correctamente");
    await this.cargarAsesorias();
  }

  /* carga perfil del programador */
  async cargarPerfil() {

    if (!this.auth.currentUserData) return;

    const q = query(
      collection(this.db, 'users'),
      where('email', '==', this.auth.currentUserData.email)
    );

    const snap = await getDocs(q);

    if (!snap.empty) {
      this.userDocId = snap.docs[0].id;
      this.perfil = snap.docs[0].data();
    }
  }

  /* guarda cambios del perfil */
  async guardarPerfil() {
    await updateDoc(doc(this.db, 'users', this.userDocId), this.perfil);
    this.mostrarMensaje("✔ Perfil actualizado correctamente");
  }

  /* permite subir foto al Storage */
  async subirFoto(event: any) {
    const archivo = event.target.files[0];
    if (!archivo) return;

    const ruta = `fotos_perfil/${this.userDocId}.jpg`;
    const storageRef = ref(this.storage, ruta);

    await uploadBytes(storageRef, archivo);
    const url = await getDownloadURL(storageRef);

    this.perfil.photo = url;
    await updateDoc(doc(this.db, 'users', this.userDocId), { photo: url });

    this.mostrarMensaje("✔ Foto actualizada");
  }

  /* helpers de interacción */
  mostrarMensaje(texto: string) {
    this.mensajeModal = texto;
    this.mostrarModalMensaje = true;
  }

  preguntar(texto: string, accion: Function) {
    this.mensajeModal = texto;
    this.accionPendiente = accion;
    this.mostrarModalConfirmacion = true;
  }

  confirmarAccion() {
    if (this.accionPendiente) this.accionPendiente();
    this.accionPendiente = null;
    this.mostrarModalConfirmacion = false;
  }

  cancelarAccion() {
    this.accionPendiente = null;
    this.mostrarModalConfirmacion = false;
  }

  confirmarEliminarProyecto(id: string) {
    this.preguntar("⚠ ¿Deseas eliminar este proyecto definitivamente?", async () => {
      await this.eliminarProyectoConfirmado(id);
    });
  }

}
