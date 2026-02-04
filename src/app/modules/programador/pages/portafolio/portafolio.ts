import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../../../core/services/auth';
import { ProjectService } from '../../../../core/services/project.service';
import { AdvisoryService } from '../../../../core/services/advisory.service';
import { Advisory } from '../../../../models/advisory';


import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  deleteDoc
} from 'firebase/firestore';

import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { initializeApp } from 'firebase/app';
import { environment } from '../../../../../environments/environment';
import { UserService } from '../../../../core/services/user.service';

@Component({
  selector: 'app-portafolio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './portafolio.html',
  styleUrl: './portafolio.scss',
})
export class Portafolio implements OnInit, OnDestroy {

  /* 🔥 Firebase SOLO para perfil y asesorías */
  db = getFirestore(initializeApp(environment.firebase));
  storage = getStorage();

  vista: string = 'agregar';

  nuevoProyecto = {
  nombre: '',
  descripcion: '',
  tipo: 'academico',
  participacion: '',
  tecnologias: '',
  repositorio: '',
  deploy: ''
};


  proyectosAcademicos: any[] = [];
  proyectosLaborales: any[] = [];
  proyectosFiltrados: any[] = [];
  filtroProyecto: string = '';

  asesorias: any[] = [];
  perfil: any = {};
  userDocId: string = '';

  asesoria: Advisory[] = [];

  proyectoEditando: any = null;

  mostrarModalMensaje = false;
  mostrarModalConfirmacion = false;
  mensajeModal = '';
  accionPendiente: Function | null = null;

  constructor(
    private auth: AuthService,
    private projectService: ProjectService,
    private advisoryService: AdvisoryService,
    private userService: UserService
  ) {
  }

  ngOnInit() {
  console.log('PORTAFOLIO CARGADO');

  this.auth.onUserDataChange((user) => {
    if (!user?.backendId) {
      console.warn('Usuario sin backendId aún');
      return;
    }

    console.log('BackendId detectado:', user.backendId);

    this.userService.getById(user.backendId).subscribe({
      next: (u) => {
        console.log('USUARIO BACKEND:', u);

        this.cargarAsesorias();
        this.cargarProyectosDesdeBackend();
      },
      error: (err) => {
        console.error('ERROR BACKEND:', err);
      }
    });
  });
}

  ngOnDestroy() {}

  /* =====================================================
     📦 PROYECTOS DESDE BACKEND (JAKARTA EE)
     ===================================================== */

  cargarProyectosDesdeBackend() {

  const userId = this.auth.currentUserData?.backendId;

  if (!userId) {
    console.warn('backendId aún no disponible');
    return;
  }

  this.projectService.getByUser(userId).subscribe({
    next: (data) => {
      console.log('Proyectos desde backend:', data);

      this.proyectosAcademicos = data.filter(
        (p: any) => p.tipo === 'ACADEMICO'
      );

      this.proyectosLaborales = data.filter(
        (p: any) => p.tipo === 'LABORAL'
      );

      this.filtrarProyectos();
    },
    error: (err) => {
      console.error('Error al cargar proyectos:', err);
    }
  });
}

  filtrarProyectos() {
    const texto = this.filtroProyecto.toLowerCase();

    const todos = [...this.proyectosAcademicos, ...this.proyectosLaborales];

    this.proyectosFiltrados = todos.filter(p =>
      p.nombre.toLowerCase().includes(texto) ||
      p.descripcion.toLowerCase().includes(texto) ||
      p.tecnologias.join(',').toLowerCase().includes(texto)
    );
  }

  editarProyecto(p: any) {
    this.proyectoEditando = { ...p };
    this.vista = 'editar-proyecto';
  }

  cancelarEdicion() {
    this.proyectoEditando = null;
    this.vista = 'proyectos';
  }

actualizarProyecto() {

  const proyectoActualizado = {
    ...this.proyectoEditando,
    tipo: this.proyectoEditando.tipo.toUpperCase(),
  };

  this.projectService.update(this.proyectoEditando.id, proyectoActualizado)
    .subscribe({
      next: () => {
        this.mostrarMensaje('✔ Proyecto actualizado');
        this.proyectoEditando = null;
        this.vista = 'proyectos';
        this.cargarProyectosDesdeBackend();
      },
      error: (err) => {
        console.error(err);
        this.mostrarMensaje('❌ Error al actualizar el proyecto');
      }
    });
}


  confirmarEliminarProyecto(id: string) {
    this.preguntar('⚠ ¿Eliminar este proyecto?', async () => {
      this.projectService.delete(id).subscribe(() => {
        this.mostrarMensaje('🗑 Proyecto eliminado');
        this.cargarProyectosDesdeBackend();
      });
    });
  }

  /* =====================================================
     📬 ASESORÍAS (FIREBASE)
     ===================================================== */

cargarAsesorias() {
  const userId = this.auth.currentUserData?.backendId;

  if (!userId) {
    console.warn('backendId aún no disponible');
    return;
  }

  this.advisoryService.getByProgramador(userId).subscribe({
    next: (data) => {
      console.log('ASESORÍAS DEL PROGRAMADOR:', data);
      this.asesorias = data;
    },
    error: (err) => console.error('Error asesorías:', err)
  });
}

responder(id: string, estado: string) {
  this.advisoryService.updateEstado(id, estado).subscribe({
    next: () => {
      this.mostrarMensaje(`✔ Asesoría ${estado}`);
      this.cargarAsesorias();
    },
    error: (err) => console.error(err)
  });
}


async eliminarAsesoria(id: string) {
  console.warn('Eliminar asesoría (Firebase) DESHABILITADO');
}

  confirmarEliminarAsesoria(id: string) {
  this.preguntar("⚠ ¿Deseas eliminar esta asesoría definitivamente?", async () => {
    await this.eliminarAsesoria(id);
  });
}
  /* =====================================================
     👤 PERFIL (FIREBASE)
     ===================================================== */

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

  async guardarPerfil() {
    await updateDoc(doc(this.db, 'users', this.userDocId), this.perfil);
    this.mostrarMensaje('✔ Perfil actualizado');
  }

  async subirFoto(event: any) {
    const archivo = event.target.files[0];
    if (!archivo) return;

    const ruta = `fotos_perfil/${this.userDocId}.jpg`;
    const storageRef = ref(this.storage, ruta);

    await uploadBytes(storageRef, archivo);
    const url = await getDownloadURL(storageRef);

    await updateDoc(doc(this.db, 'users', this.userDocId), { photo: url });
    this.perfil.photo = url;

    this.mostrarMensaje('✔ Foto actualizada');
  }

  /* =====================================================
     🔔 MODALES
     ===================================================== */

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

guardarProyecto() {
  const userId = this.auth.currentUserData?.backendId;

  if (!userId) {
    this.mostrarMensaje('❌ Usuario no autenticado');
    return;
  }

  const proyecto = {
    nombre: this.nuevoProyecto.nombre,
    descripcion: this.nuevoProyecto.descripcion,
    tipo: this.nuevoProyecto.tipo.toUpperCase(),
    participacion: this.nuevoProyecto.participacion,
    tecnologias: this.nuevoProyecto.tecnologias
      ? this.nuevoProyecto.tecnologias.split(',').map(t => t.trim())
      : [],
    repositorio: this.nuevoProyecto.repositorio || 'N/T',
    deploy: this.nuevoProyecto.deploy || 'N/T',
    user: {
      id: userId
    }
  };

  this.projectService.create(proyecto as any).subscribe({
    next: () => {
      this.mostrarMensaje('✔ Proyecto guardado correctamente');
      this.nuevoProyecto = {
        nombre: '',
        descripcion: '',
        tipo: 'academico',
        participacion: '',
        tecnologias: '',
        repositorio: '',
        deploy: ''
      };
      this.vista = 'proyectos';
      this.cargarProyectosDesdeBackend();
    },
    error: (err) => {
      console.error(err);
      this.mostrarMensaje('❌ Error al guardar el proyecto');
    }
  });
}
}
