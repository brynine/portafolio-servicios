import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmailService } from '../../../../core/services/email.service';
import { UserService } from '../../../../core/services/user.service';
import { AvailabilityService } from '../../../../core/services/availability.service';
import { User } from '../../../../models/user';
import { Availability } from '../../../../models/availability';
import { ProjectService } from '../../../../core/services/project.service';
import { AdvisoryService } from '../../../../core/services/advisory.service';
import {
  getFirestore,
  collection,
  getDocs
} from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { environment } from '../../../../../environments/environment';

interface AsesoriaForm {
  nombre: string;
  correo: string;
  fecha: string;
  hora: string;
  mensaje: string;
  projectId?: string;
}
interface UserWithPhoto extends User {
  photo?: string | null;
}


@Component({
  selector: 'app-explorar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './explorar.html',
  styleUrls: ['./explorar.scss']
})

export class ExplorarComponent implements OnInit {

  db = getFirestore(initializeApp(environment.firebase));
  
constructor(
  private userService: UserService,
  private availabilityService: AvailabilityService,
  private emailService: EmailService,
  private projectService: ProjectService,
  private advisoryService: AdvisoryService

) {}

programadores: UserWithPhoto[] = [];
  cargando = true;
  mostrarModal = false;
  mostrarPerfil = false;
  mostrarPortafolio = false;
  proyectos: any[] = [];
  horariosProgramador: any[] = [];
  horasDisponibles: string[] = [];
  proyectoSeleccionado: any = null;
  mensajeHora: string = "";
  horaValida: boolean = false;
  mostrarConfirmacion = false;
  mensajeConfirmacion = "";
  programadorSeleccionado: any = null;
  perfilCompleto: any = null;

  asesoria = {
    nombre: '',
    correo: '',
    telefono: '',
    fecha: '',
    hora: '',
    mensaje: '',
    projectId: ''
  };

  ngOnInit(): void {
    this.cargarProgramadores();
  }

async cargarProgramadores() {
  this.cargando = true;

  try {
    // programadores desde backend
    const programadoresBackend = await this.userService
      .getProgramadores()
      .toPromise();

    // usuarios desde Firestore
    const snap = await getDocs(collection(getFirestore(), 'users'));
    const usuariosFirestore = snap.docs.map(d => d.data());

    // merge por email
    this.programadores = programadoresBackend!.map((p: any) => {
      const match = usuariosFirestore.find(
        (u: any) =>
          u.email?.toLowerCase() === p.email?.toLowerCase()
      );

      return {
        ...p,
        photo: match?.['photo'] || null
      };
    });

    console.log('Programadores fusionados:', this.programadores);

  } catch (err) {
    console.error('Error cargando programadores', err);
  } finally {
    this.cargando = false;
  }
}

cargarHorarios(userId: string) {
  this.availabilityService.getByUser(userId).subscribe({
    next: (data) => {
      this.horariosProgramador = data;
      console.log('Horarios:', data);
    },
    error: (err) => {
      console.error(err);
    }
  });
}

cargarProyectos(programadorId: string) {
  this.projectService.getByUser(programadorId).subscribe({
    next: (data) => {
      this.proyectos = data;
      console.log('Proyectos del programador:', data);
    },
    error: (err) => {
      console.error('Error cargando proyectos', err);
      this.proyectos = [];
    }
  });
}

async verPerfil(p: any) {

  //  obtener usuarios de firestore
  const snap = await getDocs(collection(this.db, 'users'));
  const usuariosFirestore = snap.docs.map(d => d.data());

  //buscar match por email
  const match = usuariosFirestore.find(
    (u: any) =>
      u.email?.toLowerCase() === p.email?.toLowerCase()
  );

  //pedir perfil al backend
  this.userService.getById(p.id).subscribe({
    next: (user) => {
      this.perfilCompleto = {
        name: user.nombre,
        email: user.email,
        specialty: user.especialidad,
        description: user.bio,
        github: user.github,
        linkedin: user.linkedin,
        instagram: user.instagram,
        website: user.sitioWeb,

        photo: match?.['photo'] || null
      };

      this.mostrarPerfil = true;
    },
    error: (err) => {
      console.error('Error cargando perfil', err);
    }
  });
}

cerrarPerfil() {
  this.mostrarPerfil = false;
  this.perfilCompleto = null;
}

seleccionarProgramador(p: User) {
  this.programadorSeleccionado = p;

  this.cargarHorarios(p.id);
  this.cargarProyectos(p.id);

  this.mostrarModal = true;
}

  cerrarModal() {
    this.mostrarModal = false;

    this.asesoria = {
      nombre: '',
      correo: '',
      telefono: '',
      fecha: '',
      hora: '',
      mensaje: '',
      projectId: ''
    };

    this.mensajeHora = '';
  }

verPortafolio(p: any) {
  this.programadorSeleccionado = p;
  this.mostrarPortafolio = true;

  this.projectService.getByUser(p.id).subscribe({
    next: (data) => {
      this.proyectos = data;
    },
    error: () => {
      this.proyectos = [];
    }
  });
}

cerrarPortafolio() {
  this.mostrarPortafolio = false;
  this.proyectos = [];
}

agendarAsesoria() {

  if (!this.asesoria.fecha || !this.asesoria.hora) {
    alert('Debe seleccionar fecha y hora');
    return;
  }

  const advisory = {
    mensaje: this.asesoria.mensaje,
    fecha: this.asesoria.fecha,
    hora: this.asesoria.hora,
    estado: 'PENDIENTE',
    correoCliente: this.asesoria.correo,
      nombreCliente: this.asesoria.nombre,
    user: {
      id: this.programadorSeleccionado.id
    },
    project: this.asesoria.projectId
  ? { id: this.asesoria.projectId }
  : null
  };

  const nombreProyecto = this.asesoria.projectId
  ? this.proyectos.find(p => p.id === this.asesoria.projectId)?.nombre
  : 'Sin proyecto seleccionado';

this.advisoryService.create(advisory).subscribe({
  next: () => {

    // CORREO AL PROGRAMADOR
    this.emailService.enviarCorreo({
      correo_destino: this.programadorSeleccionado.email,
      to_name: this.programadorSeleccionado.nombre,
      titulo: '📩 Nueva solicitud de asesoría',
      estado: 'PENDIENTE',
      cliente: this.asesoria.nombre,
      email: this.asesoria.correo,
      fecha: this.asesoria.fecha,
      hora: this.asesoria.hora,
      proyecto: nombreProyecto,
      mensaje: this.asesoria.mensaje
    });

    // CORREO AL USUARIO (COPIA)
    this.emailService.enviarCorreo({
      correo_destino: this.asesoria.correo,
      to_name: this.asesoria.nombre,
      titulo: '✅ Solicitud enviada correctamente',
      estado: 'PENDIENTE',
      cliente: this.asesoria.nombre,
      email: this.asesoria.correo,
      fecha: this.asesoria.fecha,
      hora: this.asesoria.hora,
      proyecto: nombreProyecto,
      mensaje: this.asesoria.mensaje
    });

    this.mostrarConfirmacion = true;
    this.mensajeConfirmacion = '¡Tu solicitud fue enviada correctamente!';
  }
});

}

  generarHorasDisponibles() {
    this.horasDisponibles = [];

    // si falta fecha o no hay horarios, no genera nada
    if (!this.asesoria.fecha || !this.horariosProgramador.length) return;

    const partes = this.asesoria.fecha.split("-");
    const anio = parseInt(partes[0], 10);
    const mes = parseInt(partes[1], 10) - 1;
    const dia = parseInt(partes[2], 10);

    const fecha = new Date(anio, mes, dia);

    // obtener día de la semana
    const diaSemana = fecha.getDay();
    const mapaDias = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
    const nombreDia = mapaDias[diaSemana];

    console.log("→ Día calculado:", nombreDia);

    // busca disponibilidad del programador para ese día
    const horarioDia = this.horariosProgramador.find(
      h => h.dia.toLowerCase() === nombreDia
    );

    if (!horarioDia) {
      this.horasDisponibles = [];
      this.mensajeHora = "El programador no tiene disponibilidad ese día.";
      return;
    }

    this.mensajeHora = "";

    const inicio = parseInt(horarioDia.horaInicio.split(":")[0]);
    const fin = parseInt(horarioDia.horaFin.split(":")[0]);

    const horas = [];

    for (let h = inicio; h < fin; h++) {
      horas.push(h.toString().padStart(2, "0") + ":00");
    }

    this.horasDisponibles = horas;
  }

  validarHora() {
    if (!this.asesoria.hora || !this.asesoria.fecha || !this.horariosProgramador.length) return;

    const partes = this.asesoria.fecha.split("-");
    const anio = parseInt(partes[0], 10);
    const mes = parseInt(partes[1], 10) - 1;
    const diaNum = parseInt(partes[2], 10);

    const fecha = new Date(anio, mes, diaNum);

    const diaSemana = fecha.getDay();
    const mapaDias = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
    const nombreDia = mapaDias[diaSemana];

    console.log("validarHora → fecha:", this.asesoria.fecha, "día:", nombreDia);

    // busca si el programador trabaja ese día
    const horarioDia = this.horariosProgramador.find(
      h => h.dia.toLowerCase() === nombreDia
    );

    if (!horarioDia) {
      this.mensajeHora = "El programador no tiene disponibilidad ese día.";
      return;
    }

    // valida rango permitido
    const horaInicio = horarioDia.horaInicio;
    const horaFin = horarioDia.horaFin;
    const horaUsuario = this.asesoria.hora;

    if (horaUsuario < horaInicio || horaUsuario > horaFin) {
      this.mensajeHora = `El horario permitido es entre ${horaInicio} y ${horaFin}.`;
    } else {
      this.mensajeHora = "";
    }
  }

  volverHome() {
    window.location.href = '/';
  }

  programarNotificacionAntes(asesoria: any, minutosAntes: number) {

  const fechaHoraAsesoria = new Date(
    `${asesoria.fecha}T${asesoria.hora}`
  );

  const ahora = new Date();

  const tiempoAntes =
    fechaHoraAsesoria.getTime() -
    ahora.getTime() -
    minutosAntes * 60 * 1000;

  console.log('⏱ Notificación en (ms):', tiempoAntes);

  if (tiempoAntes <= 0) {
    console.warn('⚠ No se puede programar la notificación');
    return;
  }

  setTimeout(() => {

    this.mostrarConfirmacion = true;
    this.mensajeConfirmacion =
      `⏰ Recordatorio: tu asesoría inicia en ${minutosAntes} minutos`;

    if (asesoria.telefono) {
      const mensaje = encodeURIComponent(
        `⏰ Recordatorio: tu asesoría inicia en ${minutosAntes} minutos`
      );

      const telefono = asesoria.telefono.replace(/\D/g, '');

      window.open(
        `https://wa.me/593${telefono}?text=${mensaje}`,
        '_blank'
      );
    }

  }, tiempoAntes);
}

}