import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../../core/services/auth';

@Component({
  selector: 'app-agendar-asesoria',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './agendar-asesoria.html',
  styleUrl: './agendar-asesoria.scss'
})
export class AgendarAsesoriaComponent implements OnInit {

  @Input() programadorId: string = '';

  asesoria = {
    nombre: '',
    correo: '',
    mensaje: '',
    fecha: ''
  };

  constructor(
    private firestore: Firestore,
    private route: ActivatedRoute,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    const uidRuta = this.route.snapshot.paramMap.get('id');
    if (uidRuta) {
      this.programadorId = uidRuta;
      console.log("UID del programador recibido:", this.programadorId);
    }
  }

  async agendar() {
    if (!this.programadorId) {
      alert("Error: no se encontró el programador.");
      return;
    }

    const asesoriasRef = collection(this.firestore, 'asesorias');

    const data = {
      ...this.asesoria,
      programadorId: this.programadorId,
      estado: 'pendiente',
      creadaEn: new Date()
    };

    await addDoc(asesoriasRef, data);

    alert('Asesoría solicitada correctamente');

    this.asesoria = {
      nombre: '',
      correo: '',
      mensaje: '',
      fecha: ''
    };
  }
}
