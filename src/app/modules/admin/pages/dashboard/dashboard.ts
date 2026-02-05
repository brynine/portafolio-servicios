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
import { Chart } from 'chart.js/auto';
import { AdvisoryService } from '../../../../core/services/advisory.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit {

  vista: string = 'lista';

  programadores: User[] = [];

  totalAsesorias = 0;

chartProgramadores: Chart | null = null;
chartEstado: Chart | null = null;
statsEstado: any[] = [];
statsProgramador: any[] = [];


  constructor(private userService: UserService,
  private advisoryService: AdvisoryService, 
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

  mostrarModalMensaje = false;
  mostrarModalConfirmacion = false;
  mensajeModal = "";
  accionPendiente: Function | null = null;

  nuevoHorario = {
    dia: '',
    horaInicio: '',
    horaFin: ''
  };

  async ngOnInit() {
  await this.cargarProgramadores();

  // solo datos
  this.cargarTotal();
  this.cargarEstado();
  this.cargarProgramador();
}


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
      console.log('ID recibido para eliminar:', id);
      await this.eliminarProgramadorConfirmado(id);
    });
  }

  // elimina programador definitivamente
eliminarProgramadorConfirmado(id: string) {
  this.userService.delete(id).subscribe({
    next: () => {
      this.mostrarMensaje('🗑 Programador eliminado');
      this.cargarProgramadores();
    },
    error: (err) => {
      console.error(err);

      // 🔥 MENSAJE DESDE BACKEND
      const mensaje =
        err?.error && typeof err.error === 'string'
          ? err.error
          : '❌ No se pudo eliminar el programador';

      this.mostrarMensaje(mensaje);
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

cargarTotal() {
  this.advisoryService.getTotalAsesorias().subscribe({
    next: (data) => this.totalAsesorias = data
  });
}

cargarEstado() {
  this.advisoryService.getStatsEstado().subscribe({
    next: (data) => this.statsEstado = data
  });
}

cargarProgramador() {
  this.advisoryService.getStatsProgramadores().subscribe({
    next: (data) => this.statsProgramador = data
  });
}

mostrarDashboard() {
  this.vista = 'dashboard';

  setTimeout(() => {
    // aseguramos que los datos estén cargados
    if (!this.statsProgramador.length) {
      this.cargarProgramador();
    }

    if (!this.statsEstado.length) {
      this.cargarEstado();
    }

    // pequeño delay para que Angular pinte el canvas
    setTimeout(() => {
      this.crearGraficoProgramadores();
      this.crearGraficoEstado();
    }, 100);

  }, 0);
}


crearGraficoProgramadores() {
  const canvas = document.getElementById('chartProgramadores') as HTMLCanvasElement;

  // validaciones básicas
  if (!canvas) {
    console.warn('Canvas chartProgramadores no encontrado');
    return;
  }

  if (!this.statsProgramador || this.statsProgramador.length === 0) {
    console.warn('No hay datos de asesorías por programador');
    return;
  }

  // destruir gráfico previo si existe
  if (this.chartProgramadores) {
    this.chartProgramadores.destroy();
  }

  this.chartProgramadores = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: this.statsProgramador.map(p => p[0]), // nombre programador
      datasets: [
        {
          label: 'Asesorías',
          data: this.statsProgramador.map(p => p[1]), // cantidad
          backgroundColor: 'rgba(107, 77, 255, 0.7)',
          borderColor: 'rgba(107, 77, 255, 1)',
          borderWidth: 2,
          borderRadius: 10
        }
      ]
    },
    options: {
  responsive: true,
  maintainAspectRatio: false, // 🔑 CLAVE
  aspectRatio: 2,             // 🔥 controla ancho/alto
  plugins: {
    legend: {
      labels: {
        color: '#ffffff'
      }
    }
  },
  scales: {
    x: {
      ticks: { color: '#ffffff' },
      grid: { color: 'rgba(255,255,255,0.1)' }
    },
    y: {
      beginAtZero: true,
      ticks: { color: '#ffffff', precision: 0 },
      grid: { color: 'rgba(255,255,255,0.1)' }
    }
  }
}
  });
}


crearGraficoEstado() {
  const canvas = document.getElementById('chartEstado') as HTMLCanvasElement;
  if (!canvas || !this.statsEstado.length) return;

  if (this.chartEstado) {
    this.chartEstado.destroy();
  }

  this.chartEstado = new Chart(canvas, {
    type: 'pie',
    data: {
      labels: this.statsEstado.map(e => e[0]),
      datasets: [{
        data: this.statsEstado.map(e => e[1])
      }]
    }
  });
}

}
