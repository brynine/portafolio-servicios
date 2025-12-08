import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Firestore, collection, addDoc, query, where, getDocs } from '@angular/fire/firestore';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/services/auth';

@Component({
  selector: 'app-agendar-asesoria',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './agendar-asesoria.html',
  styleUrl: './agendar-asesoria.scss'
})
export class AgendarAsesoriaComponent implements OnInit {

  @Input() programadorId: string = ''; 

  asesoria = {
    nombre: '',
    correo: '',
    mensaje: '',
    fecha: '',
    hora: ''      
  };

  horarios: any[] = [];  
  horariosDelDia: any[] = []; 
  horasDisponibles: string[] = []; 
  sinDisponibilidad = false;     

  constructor(
    private firestore: Firestore,
    private route: ActivatedRoute, 
    public auth: AuthService         
  ) {}

  async ngOnInit() {
    const uidRuta = this.route.snapshot.paramMap.get('id');

    if (uidRuta) {
      this.programadorId = uidRuta;
      console.log("UID del programador recibido:", this.programadorId);

      await this.cargarHorarios();
    }
  }

  async cargarHorarios() {
    const ref = collection(this.firestore, 'horarios');
    const q = query(ref, where('uid', '==', this.programadorId));
    const snap = await getDocs(q);

    this.horarios = snap.docs.map(d => d.data());
    console.log("Horarios cargados:", this.horarios);
  }

  onFechaChange(event: any) {
    const valor = event.target.value;
    this.asesoria.fecha = valor;

    if (!valor) return;

    // convierte la fecha seleccionada a formato Date
    const fecha = new Date(valor + 'T00:00:00');

    const diaTexto = fecha.toLocaleDateString('es-ES', { weekday: 'long' });
    const diaNormalizado = this.normalizar(diaTexto);

    console.log("Fecha seleccionada:", valor);
    console.log("Día calculado:", diaTexto);

    // filtra los horarios del programador según el día
    this.horariosDelDia = this.horarios.filter(h =>
      this.normalizar(h.dia) === diaNormalizado
    );

    // si el programador no tiene disponibilidad ese día
    if (this.horariosDelDia.length === 0) {
      this.sinDisponibilidad = true;
      this.horasDisponibles = [];
      this.asesoria.hora = '';
      return;
    }

    this.sinDisponibilidad = false;

    // genera las horas disponibles según el rango del horario
    const horario = this.horariosDelDia[0];
    this.generarHoras(horario.horaInicio, horario.horaFin);

    this.asesoria.hora = '';
  }

  normalizar(str: string): string {
    // elimina tildes para comparar textos de forma segura
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  generarHoras(inicio: string, fin: string) {
    // genera la lista de horas completas entre inicio y fin
    const [hIni] = inicio.split(':').map(Number);
    const [hFin] = fin.split(':').map(Number);

    const horas: string[] = [];
    let h = hIni;

    while (h <= hFin) {
      const horaStr = `${h.toString().padStart(2, '0')}:00`;
      horas.push(horaStr);
      h++;
    }

    this.horasDisponibles = horas;
  }

  async agendar() {

    // validaciones básicas antes de guardar
    if (this.sinDisponibilidad) {
      alert('El programador no tiene disponibilidad ese día.');
      return;
    }

    if (!this.asesoria.fecha || !this.asesoria.hora) {
      alert('Selecciona una fecha y una hora válida.');
      return;
    }

    if (!this.programadorId) {
      alert("Error: no se encontró el programador.");
      return;
    }

    // guarda la asesoría en firebase
    const asesoriasRef = collection(this.firestore, 'asesorias');

    const data = {
      ...this.asesoria,
      programadorId: this.programadorId,
      estado: 'pendiente',
      creadaEn: new Date()
    };

    await addDoc(asesoriasRef, data);

    alert('Asesoría solicitada correctamente');

    // limpia formulario
    this.asesoria = {
      nombre: '',
      correo: '',
      mensaje: '',
      fecha: '',
      hora: ''
    };
  }
}
