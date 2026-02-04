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

interface AsesoriaForm {
  nombre: string;
  correo: string;
  fecha: string;
  hora: string;
  mensaje: string;
  projectId?: string; // 👈 opcional
}

@Component({
  selector: 'app-explorar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './explorar.html',
  styleUrls: ['./explorar.scss']
})

export class ExplorarComponent implements OnInit {

constructor(
  private userService: UserService,
  private availabilityService: AvailabilityService,
  private emailService: EmailService,
  private projectService: ProjectService,
  private advisoryService: AdvisoryService

) {}


  programadores: User[] = [];
  cargando = true;

  // estados de UI
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

  // datos del formulario para pedir asesoría
  asesoria = {
    nombre: '',
    correo: '',
    fecha: '',
    hora: '',
    mensaje: '',
    projectId: ''
  };

  ngOnInit(): void {
    this.cargarProgramadores();
  }

  cargarProgramadores() {
  this.userService.getProgramadores().subscribe({
    next: (data) => {
      this.programadores = data;
      this.cargando = false;
      console.log('Programadores backend:', data);
    },
    error: (err) => {
      console.error(err);
      this.cargando = false;
    }
  });
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


verPerfil(p: any) {
  this.perfilCompleto = p;
  this.mostrarPerfil = true;
}

cerrarPerfil() {
  this.mostrarPerfil = false;
  this.perfilCompleto = null;
}


seleccionarProgramador(p: User) {
  this.programadorSeleccionado = p;

  this.cargarHorarios(p.id);
  this.cargarProyectos(p.id);   // 👈 AÑADIR ESTO

  this.mostrarModal = true;
}


  cerrarModal() {
    this.mostrarModal = false;

    // reinicia formulario
    this.asesoria = {
      nombre: '',
      correo: '',
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
      id: this.programadorSeleccionado.id   // 👈 usuario programador
    },
    project: this.asesoria.projectId
  ? { id: this.asesoria.projectId }
  : null // o { id: 'P1' } si luego lo manejas
  };

  const nombreProyecto = this.asesoria.projectId
  ? this.proyectos.find(p => p.id === this.asesoria.projectId)?.nombre
  : 'Sin proyecto seleccionado';

  this.advisoryService.create(advisory).subscribe({
    next: () => {

      // 📧 correo al programador
      this.emailService.enviarCorreoProgramador({
        to_name: this.programadorSeleccionado.nombre,
        cliente: this.asesoria.nombre,
        correo: this.asesoria.correo,
        fecha: this.asesoria.fecha,
        hora: this.asesoria.hora,
        mensaje: this.asesoria.mensaje,
        proyecto: nombreProyecto, 
        correo_destino: this.programadorSeleccionado.email
      });

      // 📧 copia al usuario
      this.emailService.enviarCorreoUsuario({
        cliente: this.asesoria.nombre,
        correo: this.asesoria.correo,
        fecha: this.asesoria.fecha,
        hora: this.asesoria.hora,
        mensaje: this.asesoria.mensaje,
        proyecto: nombreProyecto, 
        correo_destino: this.asesoria.correo
      });

      // UI
      this.asesoria = { nombre: '', correo: '', fecha: '', hora: '', mensaje: '', projectId: '' };
      this.mostrarModal = false;
      this.mostrarConfirmacion = true;
      this.mensajeConfirmacion = '¡Tu solicitud fue enviada correctamente!';
    },
    error: (err) => {
      console.error(err);
      alert('Error al registrar la asesoría');
    }
  });
}

  // método completo para guardar asesoría y enviar correos
  /*async agendarAsesoria() {

    // validación de disponibilidad
    if (this.mensajeHora) {
      alert(this.mensajeHora);
      return;
    }

    if (!this.asesoria.hora) {
      alert("Debe ingresar una hora válida.");
      return;
    }

    const asesoriasRef = collection(this.firestore, 'asesorias');

    // guarda asesoría en firestore
    await addDoc(asesoriasRef, {
      ...this.asesoria,
      programadorId: this.programadorSeleccionado.uid,
      estado: 'pendiente',
      creadaEn: new Date()
    });

    // envío de correo al programador
    /*console.log("Enviando correo al programador:", this.programadorSeleccionado.email);
    this.emailService.enviarCorreoProgramador({
      to_name: this.programadorSeleccionado?.nombre || "Programador",
      cliente: this.asesoria.nombre,
      correo: this.asesoria.correo,
      fecha: this.asesoria.fecha,
      hora: this.asesoria.hora,
      mensaje: this.asesoria.mensaje,
      correo_destino: this.programadorSeleccionado.email 
    })
    .then(() => console.log("Correo enviado al programador"))
    .catch(err => console.error("Error programador:", err));

    // copia para el usuario
    console.log("Enviando copia al usuario:", this.asesoria.correo);
    this.emailService.enviarCorreoUsuario({
      cliente: this.asesoria.nombre,
      correo: this.asesoria.correo,
      fecha: this.asesoria.fecha,
      hora: this.asesoria.hora,
      mensaje: this.asesoria.mensaje,
      correo_destino: this.asesoria.correo 
    })
    .then(() => console.log("Correo enviado al usuario"))
    .catch(err => console.error("Error usuario:", err));

    // limpia formulario y muestra mensaje de éxito
    this.asesoria = { nombre: '', correo: '', fecha: '', hora: '', mensaje: '' };
    this.mostrarModal = false;
    this.mensajeConfirmacion = "¡Tu solicitud fue enviada correctamente!";
    this.mostrarConfirmacion = true;

  }*/

  /*async verPortafolio(p: any) {
    this.programadorSeleccionado = p;
    this.mostrarPortafolio = true;

    // obtiene proyectos del programador desde firestore
    const proyectosRef = collection(this.firestore, 'proyectos');
    const q = query(proyectosRef, where('uid', '==', p.uid));

    collectionData(q, { idField: 'id' }).subscribe((proys: any[]) => {
      console.log("Proyectos del programador:", proys);
      this.proyectos = proys;
    });
  }

  cerrarPortafolio() {
    this.mostrarPortafolio = false;
    this.proyectos = [];
  }*/

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
}