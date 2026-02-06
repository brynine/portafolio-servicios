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
import { EmailService } from '../../../../core/services/email.service';

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
  disponibilidadEditando: any = null;
  modoEditarDisponibilidad: boolean = false;

  
  constructor(
    private auth: AuthService,
    private projectService: ProjectService,
    private advisoryService: AdvisoryService,
    private notificationService: NotificationService,
    private userService: UserService,
    private availabilityService: AvailabilityService,
    private emailService: EmailService
  ) {
  }

ngOnInit() {
  console.log('PORTAFOLIO CARGADO');

  this.auth.onUserDataChange((user) => {
    if (!user?.backendId) {
      console.warn('Usuario sin backendId aún');
      return;
    }

    this.userBackendId = user.backendId;

    console.log('BackendId detectado:', this.userBackendId);

    this.userService.getById(this.userBackendId).subscribe({
      next: (u) => {
        console.log('USUARIO BACKEND:', u);

        this.googlePhoto = user.photo || null;

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
     PROYECTOS DESDE BACKEND (JAKARTA EE)
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
  if (!p?.id) {
    this.mostrarMensaje('❌ Proyecto inválido');
    return;
  }

  this.proyectoEditando = { ...p };
  this.vista = 'editar-proyecto';
}


  cancelarEdicion() {
    this.proyectoEditando = null;
    this.vista = 'proyectos';
  }

actualizarProyecto() {
  if (!this.proyectoEditando?.id) {
    this.mostrarMensaje('❌ Proyecto inválido');
    return;
  }

  if (!this.proyectoEditando.nombre.trim()) {
    this.mostrarMensaje('❌ El nombre no puede estar vacío');
    return;
  }

  if (!this.proyectoEditando.descripcion.trim()) {
    this.mostrarMensaje('❌ La descripción no puede estar vacía');
    return;
  }

  const proyectoActualizado = {
    ...this.proyectoEditando,
    tipo: this.proyectoEditando.tipo.toUpperCase()
  };

  this.projectService
    .update(this.proyectoEditando.id, proyectoActualizado)
    .subscribe({
      next: () => {
        this.mostrarMensaje('✔ Proyecto actualizado');
        this.proyectoEditando = null;
        this.vista = 'proyectos';
        this.cargarProyectosDesdeBackend();
      },
      error: (err) => {
        this.manejarError(err, '❌ Error al actualizar el proyecto');
      }
    });
}

confirmarEliminarProyecto(id: string) {
  if (!id) {
    this.mostrarMensaje('❌ Proyecto inválido');
    return;
  }

  this.preguntar('⚠ ¿Eliminar este proyecto?', () => {
    this.projectService.delete(id).subscribe({
      next: () => {
        this.mostrarMensaje('🗑 Proyecto eliminado');
        this.cargarProyectosDesdeBackend();
      },
      error: (err) => {
        this.manejarError(err, '❌ No se pudo eliminar el proyecto');
      }
    });
  });
}

  /* =====================================================
     ASESORÍAS
     ===================================================== */

cargarAsesorias() {
  if (!this.userBackendId) {
    console.warn('No hay backendId para cargar asesorías');
    return;
  }

  this.advisoryService.getByProgramador(this.userBackendId).subscribe({
    next: (asesorias) => {
      this.asesorias = asesorias;

      this.notificationService.getByUser(this.userBackendId).subscribe({
        next: (nots) => {
          this.mapaNotificaciones.clear();

          nots.forEach(n => {
            if (n.advisoryId) {
              this.mapaNotificaciones.set(n.advisoryId, n);
            }
          });

          this.asesoriasFinales = asesorias.map(a => {
            const notif = this.mapaNotificaciones.get(a.id);
            return {
              ...a,
              leido: notif ? notif.leido : false,
              notificationId: notif?.id || null
            };
          });
        }
      });
    },
    error: (err) => {
      this.manejarError(err, '❌ Error al cargar asesorías');
    }
  });
}


responder(asesoria: any, estado: 'CONFIRMADA' | 'RECHAZADA') {

  if (!asesoria?.id) {
    console.warn('Asesoría inválida');
    return;
  }

  this.advisoryService.updateEstado(asesoria.id, estado).subscribe({
    next: () => {

      asesoria.estado = estado;

      const titulo =
        estado === 'CONFIRMADA'
          ? '✅ Asesoría confirmada'
          : '❌ Asesoría rechazada';

      const estadoTexto =
        estado === 'CONFIRMADA'
          ? 'Tu asesoría ha sido confirmada'
          : 'Tu asesoría ha sido rechazada';

      const estadoColor =
        estado === 'CONFIRMADA'
          ? '#2ecc71' 
          : '#e74c3c'; 

      const mensajeUsuario =
        estado === 'CONFIRMADA'
          ? 'El programador confirmó tu asesoría.'
          : 'El programador no podrá atender en el horario solicitado.';

      /* =========================
         CORREO AL USUARIO
         ========================= */
      this.emailService.enviarCorreo({
        correo_destino: asesoria.correoCliente,
        to_name: asesoria.nombreCliente,
        titulo,
        estado_texto: estadoTexto,
        estado_color: estadoColor,
        fecha: asesoria.fecha,
        hora: asesoria.hora,
        proyecto: asesoria.project?.nombre || 'Sin proyecto seleccionado',
        mensaje: mensajeUsuario
      });

      /* =========================
         CORREO AL PROGRAMADOR
         ========================= */
      this.userService.getById(asesoria.user.id).subscribe(programador => {

        this.emailService.enviarCorreo({
          correo_destino: programador.email,
          to_name: programador.nombre,
          titulo,
          estado_texto: estadoTexto,
          estado_color: estadoColor,
          fecha: asesoria.fecha,
          hora: asesoria.hora,
          proyecto: asesoria.project?.nombre || 'Sin proyecto seleccionado',
          mensaje: asesoria.mensaje
        });

      });

      this.mostrarMensaje(`✔ Asesoría ${estado.toLowerCase()}`);
    },
    error: (err) => {
      console.error(err);
      this.mostrarMensaje('❌ Error al actualizar la asesoría');
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
     PERFIL
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
     MODALES
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

  if (!this.nuevoProyecto.nombre.trim()) {
    this.mostrarMensaje('❌ El nombre del proyecto es obligatorio');
    return;
  }

  if (!this.nuevoProyecto.descripcion.trim()) {
    this.mostrarMensaje('❌ La descripción es obligatoria');
    return;
  }

  if (!this.nuevoProyecto.participacion) {
    this.mostrarMensaje('❌ Debe seleccionar su rol en el proyecto');
    return;
  }

  const proyecto = {
    nombre: this.nuevoProyecto.nombre.trim(),
    descripcion: this.nuevoProyecto.descripcion.trim(),
    tipo: this.nuevoProyecto.tipo.toUpperCase(),
    participacion: this.nuevoProyecto.participacion,
    tecnologias: this.nuevoProyecto.tecnologias
      ? this.nuevoProyecto.tecnologias.split(',').map(t => t.trim()).filter(t => t)
      : [],
    repositorio: this.nuevoProyecto.repositorio || 'N/T',
    deploy: this.nuevoProyecto.deploy || 'N/T',
    user: { id: userId }
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
      this.manejarError(err, '❌ Error al guardar el proyecto');
    }
  });
}

marcarComoLeido(a: any) {
  console.log('Marcando como leído:', a);

  if (!a.notificationId) {
    console.warn('Esta asesoría no tiene notificación asociada');
    this.mostrarMensaje('Esta asesoría no tiene notificación pendiente');
    return;
  }

  this.notificationService.marcarLeido(a.notificationId).subscribe({
    next: () => {
      a.leido = true;
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
  if (!this.userBackendId) {
    this.mostrarMensaje('❌ Usuario inválido');
    return;
  }

  if (!this.disponibilidad.dia) {
    this.mostrarMensaje('❌ Seleccione un día');
    return;
  }

  if (!this.disponibilidad.horaInicio || !this.disponibilidad.horaFin) {
    this.mostrarMensaje('❌ Ingrese hora inicio y fin');
    return;
  }

  if (this.disponibilidad.horaInicio >= this.disponibilidad.horaFin) {
    this.mostrarMensaje('❌ La hora inicio debe ser menor a la hora fin');
    return;
  }

  // 🔑 NORMALIZAR EL DÍA
  const diaNormalizado = this.disponibilidad.dia.toUpperCase();

  // 🔑 VALIDACIÓN DE SOLAPAMIENTO CON NORMALIZACIÓN
  const conflicto = this.disponibilidades.some(d =>
    d.dia.toUpperCase() === diaNormalizado &&
    this.disponibilidad.horaInicio < d.horaFin &&
    this.disponibilidad.horaFin > d.horaInicio
  );

  if (conflicto) {
    this.mostrarMensaje('❌ La disponibilidad se cruza con otra existente');
    return;
  }

  const payload = {
    dia: diaNormalizado, // 🔑 GUARDAR NORMALIZADO
    horaInicio: this.disponibilidad.horaInicio,
    horaFin: this.disponibilidad.horaFin,
    user: { id: this.userBackendId }
  };

  this.availabilityService.create(payload as any).subscribe({
    next: () => {
      this.mostrarMensaje('✔ Disponibilidad guardada');
      this.disponibilidad = { dia: '', horaInicio: '', horaFin: '' };
      this.cargarDisponibilidades();
    },
    error: (err) => {
      this.manejarError(err, '❌ Error al guardar disponibilidad');
    }
  });
}

eliminarDisponibilidad(id: string) {
  this.availabilityService.delete(id)
    .subscribe(() => this.cargarDisponibilidades());
}

private manejarError(err: any, mensajePorDefecto: string) {
  if (!environment.production) {
    console.group('❌ Error');
    console.error(err);
    console.groupEnd();
  }

  if (err?.status === 409 && typeof err.error === 'string') {
    this.mostrarMensaje(err.error);
    return;
  }

  if (err?.error?.message) {
    this.mostrarMensaje(err.error.message);
    return;
  }

  this.mostrarMensaje(mensajePorDefecto);
}

editarDisponibilidad(d: any) {
  if (!d?.id) {
    this.mostrarMensaje('❌ Disponibilidad inválida');
    return;
  }

  this.disponibilidadEditando = { ...d };
  this.modoEditarDisponibilidad = true;

  this.disponibilidad = {
    dia: d.dia,
    horaInicio: d.horaInicio,
    horaFin: d.horaFin
  };
}

actualizarDisponibilidad() {
  if (!this.disponibilidadEditando?.id) {
    this.mostrarMensaje('❌ Disponibilidad inválida');
    return;
  }

  if (!this.disponibilidad.dia) {
    this.mostrarMensaje('❌ Seleccione un día');
    return;
  }

  if (!this.disponibilidad.horaInicio || !this.disponibilidad.horaFin) {
    this.mostrarMensaje('❌ Ingrese hora inicio y fin');
    return;
  }

  if (this.disponibilidad.horaInicio >= this.disponibilidad.horaFin) {
    this.mostrarMensaje('❌ La hora inicio debe ser menor a la hora fin');
    return;
  }

  const diaNormalizado = this.disponibilidad.dia.toUpperCase();

  // Validar solapamiento excluyendo el actual
  const conflicto = this.disponibilidades.some(d =>
    d.id !== this.disponibilidadEditando.id &&
    d.dia.toUpperCase() === diaNormalizado &&
    this.disponibilidad.horaInicio < d.horaFin &&
    this.disponibilidad.horaFin > d.horaInicio
  );

  if (conflicto) {
    this.mostrarMensaje('❌ El horario se cruza con otro existente');
    return;
  }

  const payload = {
    id: this.disponibilidadEditando.id,
    dia: diaNormalizado,
    horaInicio: this.disponibilidad.horaInicio,
    horaFin: this.disponibilidad.horaFin,
    user: { id: this.userBackendId }
  };

  this.availabilityService.update(payload.id, payload).subscribe({
    next: () => {
      this.mostrarMensaje('✔ Disponibilidad actualizada');

      this.modoEditarDisponibilidad = false;
      this.disponibilidadEditando = null;

      this.disponibilidad = {
        dia: '',
        horaInicio: '',
        horaFin: ''
      };

      this.cargarDisponibilidades();
    },
    error: (err) => {
      this.manejarError(err, '❌ Error al actualizar disponibilidad');
    }
  });
}

cancelarEdicionDisponibilidad() {
  this.modoEditarDisponibilidad = false;
  this.disponibilidadEditando = null;

  this.disponibilidad = {
    dia: '',
    horaInicio: '',
    horaFin: ''
  };
}

}