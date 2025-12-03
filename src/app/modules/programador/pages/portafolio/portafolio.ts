import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { deleteDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';



import { initializeApp } from 'firebase/app';

import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  doc
} from 'firebase/firestore';

import { environment } from '../../../../../environments/environment';
import { AuthService } from '../../../../core/services/auth';

interface Proyecto {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: 'academico' | 'laboral';
  participacion: string;
  tecnologias: string[];
  repositorio: string;
  deploy: string;
  uid: string;
}


@Component({
  selector: 'app-portafolio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './portafolio.html',
  styleUrl: './portafolio.scss',
})
export class Portafolio implements OnInit {

  db = getFirestore(initializeApp(environment.firebase));

  vista: string = 'agregar';

  proyectosAcademicos: any[] = [];
  proyectosLaborales: any[] = [];
  filtroProyecto: string = '';
proyectosFiltrados: any[] = [];
proyectoEditando: any = null;
perfil: any = {};
userDocId: string = '';
storage = getStorage();

  nuevoProyecto = {
    nombre: '',
    descripcion: '',
    tipo: 'academico',
    participacion: '',
    tecnologias: '',
    repositorio: '',
    deploy: ''
  };

  asesorias: any[] = [];

  constructor(private auth: AuthService) {}

  async ngOnInit() {
    console.log('Entré al portafolio');
    console.log("UID programador logueado:", this.auth.currentUserData?.uid);


    await this.cargarProyectos();
    await this.cargarAsesorias();
    await this.cargarPerfil();
  }

  async guardarProyecto() {

    if (!this.auth.currentUserData) {
      alert('Usuario no autenticado');
      return;
    }

    const proyecto = {
      ...this.nuevoProyecto,
      uid: this.auth.currentUserData.uid,
      createdAt: new Date()
    };

    await addDoc(collection(this.db, 'proyectos'), proyecto);

    alert('✔ Proyecto guardado');

    this.nuevoProyecto = {
      nombre: '',
      descripcion: '',
      tipo: 'academico',
      participacion: '',
      tecnologias: '',
      repositorio: '',
      deploy: ''
    };

    await this.cargarProyectos();
  }

  async cargarProyectos() {

  if (!this.auth.currentUserData) return;

  const q = query(
    collection(this.db, 'proyectos'),
    where('uid', '==', this.auth.currentUserData.uid)
  );

  const snapshot = await getDocs(q);

  const datos: Proyecto[] = snapshot.docs.map(d => {
    const data = d.data() as Proyecto;

    return {
      ...data,
      id: d.id
    };
  });

  this.proyectosAcademicos = datos.filter(p => p.tipo === 'academico');
  this.proyectosLaborales = datos.filter(p => p.tipo === 'laboral');

  console.log("Proyectos cargados:", datos);

  this.filtrarProyectos();
}

  async cargarAsesorias() {

  if (!this.auth.currentUserData) return;

  const q = query(
    collection(this.db, 'asesorias'),
    where('programadorId', '==', this.auth.currentUserData.uid)
  );

  const snapshot = await getDocs(q);

  this.asesorias = snapshot.docs.map(d => ({
    id: d.id,
    ...d.data()
  }));

  console.log("📬 Asesorías del programador:", this.asesorias);
}

  async responder(id: string, estado: string) {

    const ref = doc(this.db, 'asesorias', id);

    await updateDoc(ref, {
      estado: estado
    });

    alert(`✔ Asesoría marcada como: ${estado}`);

    await this.cargarAsesorias();
  }

  filtrarProyectos() {
  const texto = this.filtroProyecto.toLowerCase();

  const todos = [...this.proyectosAcademicos, ...this.proyectosLaborales];

  this.proyectosFiltrados = todos.filter(p =>
    p.nombre.toLowerCase().includes(texto) ||
    p.tecnologias.toLowerCase().includes(texto) ||
    p.descripcion.toLowerCase().includes(texto)
  );
}

editarProyecto(proyecto: any) {
  this.proyectoEditando = { ...proyecto };
  this.vista = 'editar';
}

cancelarEdicion() {
  this.proyectoEditando = null;
  this.vista = 'proyectos';
}


async actualizarProyecto() {

  if (!this.proyectoEditando || !this.proyectoEditando.id) {
    alert("Error: el proyecto no tiene un ID válido.");
    console.error("proyectoEditando:", this.proyectoEditando);
    return;
  }

  try {
    const ref = doc(this.db, 'proyectos', this.proyectoEditando.id);

    await updateDoc(ref, {
      nombre: this.proyectoEditando.nombre,
      descripcion: this.proyectoEditando.descripcion,
      tipo: this.proyectoEditando.tipo,
      participacion: this.proyectoEditando.participacion,
      tecnologias: this.proyectoEditando.tecnologias,
      repositorio: this.proyectoEditando.repositorio,
      deploy: this.proyectoEditando.deploy
    });

    alert("✔ Proyecto actualizado correctamente");

    this.proyectoEditando = null;
    this.vista = 'proyectos';

    await this.cargarProyectos();

  } catch (error) {
    console.error("Error al actualizar proyecto:", error);
    alert("Error al actualizar el proyecto. Revisa la consola.");
  }
}

async eliminarProyecto(id: string) {

  if (!id) {
    console.error("Error: el ID recibido para eliminar es undefined o vacío.");
    alert("No se puede eliminar este proyecto porque no tiene un ID válido.");
    return;
  }

  if (!confirm("¿Seguro que deseas eliminar este proyecto?")) return;

  try {
    const ref = doc(this.db, 'proyectos', id);
    await deleteDoc(ref);

    alert("🗑 Proyecto eliminado correctamente");
    await this.cargarProyectos();

  } catch (error) {
    console.error("Error al eliminar proyecto:", error);
    alert("Error al eliminar el proyecto. Revisa la consola.");
  }
}


async cargarPerfil() {
  if (!this.auth.currentUserData) return;

  const email = this.auth.currentUserData.email;

  const q = query(
    collection(this.db, 'users'),
    where('email', '==', email)
  );

  const snap = await getDocs(q);

  if (!snap.empty) {
    const docSnap = snap.docs[0];
    this.userDocId = docSnap.id;
    this.perfil = docSnap.data();
  }
}

async guardarPerfil() {

  const refDoc = doc(this.db, 'users', this.userDocId);

  await updateDoc(refDoc, this.perfil);

  alert('✔ Perfil actualizado correctamente');
}

async subirFoto(event: any) {
  const archivo = event.target.files[0];

  if (!archivo) return;

  const ruta = `fotos_perfil/${this.userDocId}.jpg`;

  const storageRef = ref(this.storage, ruta);

  await uploadBytes(storageRef, archivo);

  const url = await getDownloadURL(storageRef);

  this.perfil.photo = url;

  await updateDoc(doc(this.db, 'users', this.userDocId), {
    photo: url
  });

  alert("✔ Foto actualizada");
}
}