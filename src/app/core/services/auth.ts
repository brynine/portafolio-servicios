import { Injectable } from '@angular/core';

import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
  Auth,
} from 'firebase/auth';

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  Firestore,
} from 'firebase/firestore';

import { environment } from '../../../environments/environment';

// Tipos de rol
export type UserRole = 'admin' | 'programador' | 'externo';

// Estructura del usuario en firestore
export interface AppUser {
  uid: string;
  name: string | null;
  email: string | null;
  photo: string | null;
  role: UserRole;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private app: FirebaseApp;
  private auth: Auth;
  private db: Firestore;

  // Usuario completo con rol
  public currentUserData: AppUser | null = null;

  constructor() {

    // Inicializar Firebase
    this.app = initializeApp(environment.firebase);

    this.auth = getAuth(this.app);
    this.db = getFirestore(this.app);

    console.log('Firebase inicializado correctamente');

    // Detectar cambios de sesión
    onAuthStateChanged(this.auth, async (user) => {
      if (user) {
        await this.loadUserData(user.uid);
      } else {
        this.currentUserData = null;
      }
    });
  }

  // Login con google
  async loginWithGoogle(): Promise<User | null> {
    try {
      const provider = new GoogleAuthProvider();

      const result = await signInWithPopup(this.auth, provider);

      const user = result.user;

      if (!user) {
        throw new Error('No se obtuvo usuario de Google');
      }

      console.log('USUARIO AUTENTICADO:', user.uid);

      // Guardar usuario si no existe
      await this.saveUserIfNotExists(user);

      // Cargar datos (incluye rol)
      await this.loadUserData(user.uid);

      return user;

    } catch (error) {
      console.error('ERROR EN LOGIN CON POPUP:', error);
      return null;
    }
  }

  // Guardar usuario si no existe
  private async saveUserIfNotExists(user: User): Promise<void> {

    const userRef = doc(this.db, 'users', user.uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {

      const data: AppUser = {
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        photo: user.photoURL,
        role: 'externo'
      };

      await setDoc(userRef, {
        ...data,
        createdAt: new Date(),
      });

      console.log('Usuario guardado en Firestore con rol externo');

    } else {
      console.log('El usuario ya existe en Firestore');
    }
  }

  // Cargar datos del usuario
  private async loadUserData(uid: string): Promise<void> {

    const userRef = doc(this.db, 'users', uid);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      this.currentUserData = snap.data() as AppUser;
      console.log('Datos de usuario cargados:', this.currentUserData);
    } else {
      this.currentUserData = null;
    }
  }

  // Obtener el rol
  getRole(): UserRole | null {
    return this.currentUserData?.role || null;
  }

  // Verificaciones
  isAdmin(): boolean {
    return this.currentUserData?.role === 'admin';
  }

  isProgramador(): boolean {
    return this.currentUserData?.role === 'programador';
  }

  // Usuario de firebase
  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }

  onAuthChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(this.auth, callback);
  }

  async logout(): Promise<void> {
    this.currentUserData = null;
    await signOut(this.auth);
  }
}
