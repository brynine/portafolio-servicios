import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  Firestore,
  collection,
  collectionData,
  query,
  where,
  addDoc,
  doc,
  getDoc
} from '@angular/fire/firestore';

@Component({
  selector: 'app-explorar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './explorar.html',
  styleUrls: ['./explorar.scss']
})
export class ExplorarComponent implements OnInit {

  private firestore = inject(Firestore);

  programadores: any[] = [];

  mostrarModal = false;
  mostrarPerfil = false;
  mostrarPortafolio = false;
  proyectos: any[] = [];
  horariosProgramador: any[] = [];
  horasDisponibles: string[] = [];
  mensajeHora: string = "";
  horaValida: boolean = false;

  programadorSeleccionado: any = null;

  perfilCompleto: any = null;

  asesoria = {
  nombre: '',
  correo: '',
  fecha: '',
  hora: '',
  mensaje: ''
};


  ngOnInit(): void {
    const usersRef = collection(this.firestore, 'users');
    const q = query(usersRef, where('role', '==', 'programador'));

    collectionData(q, { idField: 'id' }).subscribe((data: any[]) => {
      this.programadores = data;
    });
  }

  async verPerfil(p: any) {
    const ref = doc(this.firestore, 'users', p.id);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      this.perfilCompleto = snap.data();
      this.mostrarPerfil = true;
    } else {
      alert("No se pudo cargar el perfil del programador.");
    }
  }

  cerrarPerfil() {
    this.mostrarPerfil = false;
    this.perfilCompleto = null;
  }

  async seleccionarProgramador(p: any) {
  this.programadorSeleccionado = p;  

  const ref = doc(this.firestore, 'users', p.id);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const data = snap.data();
    this.programadorSeleccionado.uid = data['uid'];
  }

  console.log("UID real del programador:", this.programadorSeleccionado.uid);

  const horariosRef = collection(this.firestore, 'horarios');
  const q = query(horariosRef, where('uid', '==', this.programadorSeleccionado.uid));

  collectionData(q).subscribe(h => {
    this.horariosProgramador = h;
    console.log("Horarios:", h);
  });

  this.mostrarModal = true;
}

cerrarModal() {
  this.mostrarModal = false;

  this.asesoria = {
    nombre: '',
    correo: '',
    fecha: '',
    hora: '',
    mensaje: ''
  };

  this.mensajeHora = '';
}


  async agendarAsesoria() {

  if (this.mensajeHora) {
    alert(this.mensajeHora);
    return;
  }

  if (!this.asesoria.hora) {
    alert("Debe ingresar una hora válida.");
    return;
  }

  const asesoriasRef = collection(this.firestore, 'asesorias');

  await addDoc(asesoriasRef, {
  ...this.asesoria,
  programadorId: this.programadorSeleccionado.uid,
  estado: 'pendiente',
  creadaEn: new Date()
});


  alert("Asesoría agendada correctamente");

  this.asesoria = { nombre: '', correo: '', fecha: '', hora: '', mensaje: '' };
  this.cerrarModal();
}

  async verPortafolio(p: any) {
  this.programadorSeleccionado = p;
  this.mostrarPortafolio = true;

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
}

generarHorasDisponibles() {
  this.horasDisponibles = [];

  if (!this.asesoria.fecha || !this.horariosProgramador.length) return;

  const partes = this.asesoria.fecha.split("-");
  const anio = parseInt(partes[0], 10);
  const mes = parseInt(partes[1], 10) - 1;
  const dia = parseInt(partes[2], 10);

  const fecha = new Date(anio, mes, dia);

  const diaSemana = fecha.getDay();
  const mapaDias = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
  const nombreDia = mapaDias[diaSemana];

  console.log("→ Día calculado:", nombreDia);

  const horarioDia = this.horariosProgramador.find(
    h => h.dia.toLowerCase() === nombreDia
  );

  if (!horarioDia) {
    this.horasDisponibles = [];
    return;
  }

  const inicio = parseInt(horarioDia.horaInicio.split(":")[0]);
  const fin = parseInt(horarioDia.horaFin.split(":")[0]);

  const horas = [];

  for (let h = inicio; h < fin; h++) {
    horas.push(h.toString().padStart(2, "0") + ":00");
  }

  this.horasDisponibles = horas;
}

validarHora() {
  if (!this.asesoria.hora || !this.horariosProgramador.length) return;

  const fecha = new Date(this.asesoria.fecha);
  const dia = fecha.toLocaleString('es-ES', { weekday: 'long' }).toLowerCase();

  const horarioDia = this.horariosProgramador.find(
    h => h.dia.toLowerCase() === dia
  );

  if (!horarioDia) {
    this.mensajeHora = "El programador no tiene disponibilidad ese día.";
    return;
  }

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