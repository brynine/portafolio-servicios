import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth';
import { ProjectService } from '../../../../core/services/project.service';
import { AdvisoryService } from '../../../../core/services/advisory.service';
import { Advisory } from '../../../../models/advisory';
import { Notification } from '../../../../models/notification';
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
import { NotificationService } from '../../../../core/services/notification.service';
import { AvailabilityService } from '../../../../core/services/availability.service';

@Component({
  selector: 'app-portafolio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './portafolio.html',
  styleUrl: './portafolio.scss',
})

export class Portafolio implements OnInit, OnDestroy {

  db = getFirestore(initializeApp(environment.firebase));
  storage = getStorage();

  vista: string = 'agregar';
  userId!: string;
  userBackendId!: string;

  nuevoProyecto = {
  nombre: '',
  descripcion: '',
  tipo: 'academico',
  participacion: '',
  tecnologias: '',
  repositorio: '',
  deploy: ''
};

disponibilidad = {
  dia: '',
  horaInicio: '',
  horaFin: ''
};

  disponibilidades: any[] = [];
  proyectosAcademicos: any[] = [];
  proyectosLaborales: any[] = [];
  proyectosFiltrados: any[] = [];
  filtroProyecto: string = '';
  asesorias: any[] = [];
  perfil: any = {};
  userDocId: string = '';
  googlePhoto: string | null = null;
  asesoria: Advisory[] = [];
  proyectoEditando: any = null;
  mostrarModalMensaje = false;
  mostrarModalConfirmacion = false;
  mensajeModal = '';
  accionPendiente: Function | null = null;
  notificaciones: any[] = [];
  asesoriasFinales: any[] = [];
  mapaNotificaciones = new Map<string, Notification>();


  constructor(
    private auth: AuthService,
    private projectService: ProjectService,
    private advisoryService: AdvisoryService,
    private notificationService: NotificationService,
    private userService: UserService,
    private availabilityService: AvailabilityService
  ) {
  }

ngOnInit() {
  console.log('PORTAFOLIO CARGADO');

  this.auth.onUserDataChange((user) => {
    if (!user?.backendId) {
      console.warn('Usuario sin backendId aún');
      return;
    }

    // ✅ ESTA LÍNEA FALTABA
    this.userBackendId = user.backendId;

    console.log('BackendId detectado:', this.userBackendId);

    this.userService.getById(this.userBackendId).subscribe({
      next: (u) => {
        console.log('USUARIO BACKEND:', u);

        this.googlePhoto = user.photo || null;

        // 🔥 AHORA SÍ
        this.cargarPerfilDesdeBackend();
        this.cargarAsesorias();
        this.cargarProyectosDesdeBackend();
        this.cargarNotificaciones();
        this.cargarDisponibilidades();
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
  this.preguntar('⚠ ¿Eliminar este proyecto?', () => {

    this.projectService.delete(id).subscribe({
      next: () => {
        this.mostrarMensaje('🗑 Proyecto eliminado');
        this.cargarProyectosDesdeBackend();
      },
      error: (err) => {

        // 👇 MENSAJE DE NEGOCIO DESDE BACKEND
        if (err.status === 409) {
          this.mostrarMensaje(err.error);
        } else {
          this.mostrarMensaje('❌ Error al eliminar el proyecto');
        }
      }
    });

  });
}


  /* =====================================================
     📬 ASESORÍAS
     ===================================================== */

cargarAsesorias() {

  if (!this.userBackendId) {
    console.warn('No hay backendId para cargar asesorías');
    return;
  }

  // 1️⃣ Asesorías del programador
  this.advisoryService.getByProgramador(this.userBackendId).subscribe({
    next: (asesorias) => {

      console.log('ASESORÍAS BACKEND:', asesorias);
      this.asesorias = asesorias;

      // 2️⃣ Notificaciones del mismo usuario
      this.notificationService.getByUser(this.userBackendId).subscribe({
        next: (nots) => {

          console.log('NOTIFICACIONES:', nots);
          this.notificaciones = nots;

          // 3️⃣ Mapa mensaje → notificación
          // 3️⃣ Mapa advisoryId → notificación
this.mapaNotificaciones.clear();
nots.forEach(n => {
  if (n.advisoryId) {
    this.mapaNotificaciones.set(n.advisoryId, n);
  }
});

// 4️⃣ Fusionar datos usando advisoryId
this.asesoriasFinales = asesorias.map(a => {
  const notif = this.mapaNotificaciones.get(a.id);

  return {
    ...a,
    leido: notif ? notif.leido : false,
    notificationId: notif?.id || null
  };
});

console.log('ASESORÍAS FINALES:', this.asesoriasFinales);

        }
      });
    },
    error: (err) => {
      console.error('Error cargando asesorías', err);
    }
  });
}

responder(id: string, estado: string) {
  this.advisoryService.updateEstado(id, estado).subscribe({
    next: () => {

      // 🔥 ACTUALIZAR EN asesoriasFinales
      const asesoria = this.asesoriasFinales.find(a => a.id === id);
      if (asesoria) {
        asesoria.estado = estado;
      }

      this.mostrarMensaje(`✔ Asesoría ${estado}`);
    },
    error: (err) => {
      console.error(err);
      this.mostrarMensaje('❌ Error al actualizar asesoría');
    }
  });
}


eliminarAsesoria(id: string) {
  this.advisoryService.delete(id).subscribe({
    next: () => {
      this.mostrarMensaje('🗑 Asesoría eliminada correctamente');
      this.cargarAsesorias();
    },
    error: (err) => {
      console.error(err);
      this.mostrarMensaje('❌ Error al eliminar asesoría');
    }
  });
}

  confirmarEliminarAsesoria(id: string) {
  this.preguntar("⚠ ¿Deseas eliminar esta asesoría definitivamente?", async () => {
    await this.eliminarAsesoria(id);
  });
}
  /* =====================================================
     👤 PERFIL
     ===================================================== */
cargarPerfilDesdeBackend() {
  const backendId = this.auth.currentUserData?.backendId;

  if (!backendId) {
    console.warn('No hay backendId');
    return;
  }

  this.userService.getById(backendId).subscribe({
    next: (user) => {
      console.log('Perfil desde backend:', user);

this.perfil = {
  name: user.nombre,
  especialidad: user.especialidad,
  description: user.bio,
  github: user.github,
  linkedin: user.linkedin,
  instagram: user.instagram,
  sitioWeb: user.sitioWeb,

  photo: this.auth.currentUserData?.photo || null
};

    },
    error: (err) => {
      console.error('Error cargando perfil:', err);
    }
  });
}


guardarPerfil() {
  const backendId = this.auth.currentUserData?.backendId;

  if (!backendId) {
    this.mostrarMensaje('❌ Usuario sin backendId');
    return;
  }

  console.log('Perfil actual:', this.perfil);

  const payload = {
    nombre: this.perfil.name,         
    especialidad: this.perfil.especialidad, 
    bio: this.perfil.description,            
    github: this.perfil.github,
    linkedin: this.perfil.linkedin,
    instagram: this.perfil.instagram,
    sitioWeb: this.perfil.sitioWeb
  };

  console.log('Payload crudo:', payload);

  const cleanPayload = Object.fromEntries(
    Object.entries(payload).filter(
      ([_, v]) => v !== undefined && v !== null && v !== ''
    )
  );

  console.log('Payload enviado al backend:', cleanPayload);

  this.userService.update(backendId, cleanPayload).subscribe({
    next: () => {
      this.mostrarMensaje('✔ Perfil actualizado correctamente');
    },
    error: (err) => {
      console.error(err);
      this.mostrarMensaje('❌ Error al guardar perfil');
    }
  });
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

marcarComoLeido(a: any) {
  console.log('Marcando como leído:', a);

  if (!a.notificationId) {
    console.warn('No hay notificationId');
    return;
  }

  this.notificationService.marcarLeido(a.notificationId).subscribe({
    next: () => {
      a.leido = true; // 🔥 actualiza UI
      this.mostrarMensaje('✔ Marcada como leída');
    },
    error: (err) => {
      console.error(err);
      this.mostrarMensaje('❌ Error al marcar como leído');
    }
  });
}

cargarNotificaciones() {
  const userId = this.auth.currentUserData?.backendId;
  if (!userId) return;

  this.notificationService.getByUser(userId).subscribe({
    next: (data) => {
      this.notificaciones = data;
      console.log('NOTIFICACIONES:', data);
    },
    error: (err) => console.error(err)
  });
}

cargarDisponibilidades() {
  if (!this.userBackendId) return;

  this.availabilityService
    .getByUser(this.userBackendId)
    .subscribe(d => this.disponibilidades = d);
}

guardarDisponibilidad() {
  const payload = {
    ...this.disponibilidad,
    user: { id: this.userBackendId }
  };

  this.availabilityService.create(payload as any)
    .subscribe(() => {
      this.mostrarMensaje('✔ Disponibilidad guardada');
      this.disponibilidad = {
        dia: '',
        horaInicio: '',
        horaFin: ''
      };
      this.cargarDisponibilidades();
    });
}



eliminarDisponibilidad(id: string) {
  this.availabilityService.delete(id)
    .subscribe(() => this.cargarDisponibilidades());
}


}