import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UserService } from '../../../../core/services/user.service';
import { User } from '../../../../models/user';
import { AvailabilityService } from '../../../../core/services/availability.service';
import { Availability } from '../../../../models/availability';

import { environment } from '../../../../../environments/environment';
import { initializeApp } from 'firebase/app';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit {


  // controla qué vista se muestra (crear, editar o lista)
  vista: string = 'lista';

  programadores: User[] = [];

  constructor(private userService: UserService, 
  private availabilityService: AvailabilityService) {}

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
  crearProgramador() {
  this.userService.crearProgramador({
    email: this.nuevoProgramador.email,
    nombre: this.nuevoProgramador.name,
    especialidad: this.nuevoProgramador.specialty
  }).subscribe({
    next: () => {
      this.mostrarMensaje('Programador creado correctamente');
      this.nuevoProgramador = { name: '', email: '', specialty: '' };
      this.cargarProgramadores();
    }
  });
}


  cargarProgramadores() {
  this.userService.getProgramadores().subscribe({
    next: (data) => {
      this.programadores = data;
      console.log('Programadores backend:', data);
    },
    error: (err) => {
      console.error('Error cargando programadores', err);
    }
  });
}


  // habilita modo edición
  editarProgramador(p: any) {
    this.programadorEditando = { ...p };
    this.vista = 'editar';
  }

  // guarda cambios del programador editado
  actualizarProgramador() {
  const data = {
    id: this.programadorEditando.id,
    nombre: this.programadorEditando.nombre,
    email: this.programadorEditando.email,
    rol: this.programadorEditando.rol,
    especialidad: this.programadorEditando.especialidad,
    activo: this.programadorEditando.activo
  };

  this.userService
    .update(this.programadorEditando.id, data as any)
    .subscribe(() => {
      this.mostrarMensaje('✔ Programador actualizado');
      this.vista = 'lista';
      this.cargarProgramadores();
    });
}

  // mensaje de confirmación antes de eliminar
  eliminarProgramador(id: string) {
    this.preguntar("¿Seguro que deseas eliminar este programador?", async () => {
      await this.eliminarProgramadorConfirmado(id);
    });
  }

  // elimina programador definitivamente
  eliminarProgramadorConfirmado(id: string) {
  this.userService.delete(id).subscribe({
    next: () => {
      this.mostrarMensaje('🗑 Programador eliminado');
      this.cargarProgramadores();

      if (this.programadorSeleccionado?.id === id) {
        this.programadorSeleccionado = null;
        this.horariosProgramador = [];
      }
    },
    error: (err) => {
      console.error(err);
      this.mostrarMensaje('❌ Error al eliminar programador');
    }
  });
}

  // agrega horario para un programador
    guardarHorario() {
    if (!this.programadorSeleccionado) return;

    if (!this.nuevoHorario.horaInicio || !this.nuevoHorario.horaFin) {
    this.mostrarMensaje('Debe seleccionar hora inicio y hora fin.');
    return;
    }

    if (this.nuevoHorario.horaInicio >= this.nuevoHorario.horaFin) {
    this.mostrarMensaje('La hora de inicio debe ser menor que la hora de fin.');
    return;
  }

  const horario: Availability = {
    id: 'A' + Date.now(),
    dia: this.nuevoHorario.dia,
    horaInicio: this.nuevoHorario.horaInicio,
    horaFin: this.nuevoHorario.horaFin,
    user: { id: this.programadorSeleccionado.id }
  };

  this.availabilityService.create(horario).subscribe({
    next: () => {
      this.mostrarMensaje('✔ Horario agregado');
      this.nuevoHorario = { dia: '', horaInicio: '', horaFin: '' };
      this.cargarHorariosProgramador();
    },
    error: () => {
      this.mostrarMensaje('❌ Error al crear horario');
    }
  });
}


  // carga horarios del programador seleccionado
  cargarHorariosProgramador() {
  if (!this.programadorSeleccionado) return;

  this.availabilityService
    .getByUser(this.programadorSeleccionado.id)
    .subscribe({
      next: (data) => {
        this.horariosProgramador = data;
      },
      error: (err) => {
        console.error(err);
        this.mostrarMensaje('❌ Error cargando horarios');
      }
    });
}

actualizarHorario() {
  if (!this.horarioEditando?.id) {
    this.mostrarMensaje('❌ Horario inválido');
    return;
  }

  if (this.horarioEditando.horaInicio >= this.horarioEditando.horaFin) {
    this.mostrarMensaje('La hora de inicio debe ser menor que la hora fin.');
    return;
  }

  this.availabilityService
    .update(this.horarioEditando.id, this.horarioEditando)
    .subscribe({
      next: () => {
        this.mostrarMensaje('✔ Horario actualizado');
        this.modoEditarHorario = false;
        this.horarioEditando = null;
        this.cargarHorariosProgramador();
      },
      error: () => {
        this.mostrarMensaje('❌ Error al actualizar horario');
      }
    });
}



  // activa modo edición de horario
  editarHorario(horario: any) {
    this.modoEditarHorario = true;
    this.horarioEditando = { ...horario };
  }

  cancelarEdicionHorario() {
    this.modoEditarHorario = false;
    this.horarioEditando = null;
  }

  // elimina horario con confirmación


  eliminarHorarioConfirmado(id: string) {
  this.availabilityService.delete(id).subscribe({
    next: () => {
      this.mostrarMensaje('🗑 Horario eliminado');
      this.cargarHorariosProgramador();
    },
    error: () => {
      this.mostrarMensaje('❌ Error al eliminar horario');
    }
  });
}


  // recarga horarios cuando cambia programador
  cambiarProgramador() {
  if (this.programadorSeleccionado) {
    this.cargarHorariosProgramador();
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
