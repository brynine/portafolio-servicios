import { Injectable } from '@angular/core';
import { query, where, collection, getDocs } from 'firebase/firestore';

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
  setDoc,
  Firestore,
} from 'firebase/firestore';

import { environment } from '../../../environments/environment';
import { UserService } from '../../core/services/user.service';


// tipos de rol permitidos
export type UserRole = 'admin' | 'programador' | 'externo';

// estructura del usuario almacenado en firestore
export interface AppUser {
  uid: string;
  backendId?: string;  
  id?: string;
  name: string | null;
  email: string | null;
  photo: string | null;
  role: UserRole;
  specialty?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private app: FirebaseApp;
  private auth: Auth;
  private db: Firestore;

  // datos del usuario ya procesados desde firestore
  public currentUserData: AppUser | null = null;

  // indica cuando firebase terminó de cargar el estado
  public authLoaded = false;

  // listeners opcionales para sincronizar datos en componentes
  private userDataListeners: ((u: AppUser | null) => void)[] = [];

  // promesa usada para esperar a firebase antes de ejecutar guards
  public authReady: Promise<void>;
  private resolveAuthReady!: () => void;

  constructor(private userService: UserService) {

    // inicializa firebase con las credenciales
    this.app = initializeApp(environment.firebase);
    this.auth = getAuth(this.app);
    this.db = getFirestore(this.app);

    // crea la promesa que avisará que autenticación está lista
    this.authReady = new Promise(resolve => this.resolveAuthReady = resolve);

    // escucha cambios de sesión del usuario
    onAuthStateChanged(this.auth, async (user) => {

      if (user) {
        // carga los datos del usuario registrado en firestore
        await this.loadUserData(user);
      } else {
        // si no hay usuario, restablece valores
        this.currentUserData = null;
        this.emitUserDataChange();
      }

      this.authLoaded = true;
      this.emitAppUserReady();

      // indica que firebase terminó de verificar la sesión
      this.resolveAuthReady();
    });
  }

  // permite que los componentes reciban actualizaciones del usuario
  onUserDataChange(cb: (u: AppUser | null) => void) {
    this.userDataListeners.push(cb);

    if (this.currentUserData) {
      cb(this.currentUserData);
    }
  }

  private emitUserDataChange() {
    for (const cb of this.userDataListeners) {
      cb(this.currentUserData);
    }
  }

  // proceso de inicio de sesión usando google popup
  async loginWithGoogle(): Promise<User | null> {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      const result = await signInWithPopup(this.auth, provider);
      const user = result.user;
      if (!user) return null;

      await this.saveUserFix(user);
      await this.loadUserData(user);

      return user;

    } catch (error) {
      console.error("ERROR LOGIN GOOGLE:", error);
      return null;
    }
  }

  // guarda el usuario en firestore si aún no existe
  private async saveUserFix(user: User): Promise<void> {

    const normalizedEmail = user.email?.toLowerCase() || "";

    const q = query(
      collection(this.db, 'users'),
      where('email', '==', normalizedEmail)
    );

    const snap = await getDocs(q);

    // intenta obtener la foto del perfil real del usuario
    const googlePhoto =
      user.photoURL ||
      (user as any).reloadUserInfo?.photoUrl ||
      null;

    if (!snap.empty) {
      // si existe, solo actualiza información básica
      const docRef = snap.docs[0].ref;

      await setDoc(docRef, {
        uid: user.uid,
        name: user.displayName,
        photo: googlePhoto,
        updatedAt: new Date()
      }, { merge: true });

      return;
    }

    // si el usuario es nuevo, se almacena con rol externo por defecto
    const newUser: AppUser = {
      uid: user.uid,
      name: user.displayName,
      email: normalizedEmail,
      photo: googlePhoto,
      role: 'externo',
    };

    await setDoc(doc(this.db, 'users', user.uid), {
      ...newUser,
      createdAt: new Date()
    });
  }

  private mapBackendRole(role: string | undefined): UserRole {
  if (role === 'admin' || role === 'programador' || role === 'externo') {
    return role;
  }
  return 'externo';
}


  // obtiene los datos del usuario desde firestore
  private async loadUserData(user: User): Promise<void> {

    const normalizedEmail = user.email?.toLowerCase() || "";

    const q = query(
      collection(this.db, 'users'),
      where('email', '==', normalizedEmail)
    );

    const snap = await getDocs(q);

    const googlePhoto =
      user.photoURL ||
      (user as any).reloadUserInfo?.photoUrl ||
      null;

    if (!snap.empty) {
      // si existe en firestore, sincroniza datos locales
      const data = snap.docs[0].data() as AppUser;
      const docRef = snap.docs[0].ref;

      if (!data.photo && googlePhoto) {
        await setDoc(docRef, { photo: googlePhoto }, { merge: true });
        data.photo = googlePhoto;
      }

      if (data.uid !== user.uid) {
        await setDoc(docRef, { uid: user.uid }, { merge: true });
        data.uid = user.uid;
      }

      const backendData = await this.syncBackendUser(
      normalizedEmail,
      user.displayName
      );

      this.currentUserData = {
      ...data,
      backendId: backendData?.id,
      role: this.mapBackendRole(backendData?.rol)
    };


      this.emitUserDataChange();
      return;

      
    }

    // si el usuario no existía, se crea con valores por defecto
    const newUser: AppUser = {
      uid: user.uid,
      name: user.displayName,
      email: normalizedEmail,
      photo: googlePhoto,
      role: 'externo'
    };

    await setDoc(doc(this.db, 'users', user.uid), newUser);

    this.currentUserData = newUser;
    this.emitUserDataChange();
    this.emitAppUserReady();
  }

  // métodos utilitarios de rol
  getRole(): UserRole | null {
    return this.currentUserData?.role || null;
  }

  isAdmin(): boolean {
    return this.currentUserData?.role === 'admin';
  }

  isProgramador(): boolean {
    return this.currentUserData?.role === 'programador';
  }

  // obtiene el usuario desde firebase auth
  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }

  // escucha cambios de autenticación
  onAuthChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(this.auth, callback);
  }

  // cierre de sesión
  async logout(): Promise<void> {
    this.currentUserData = null;
    this.emitUserDataChange();
    await signOut(this.auth);
  }

  private appUserReadyListeners: (() => void)[] = [];

  // permite ejecutar acciones cuando los datos del usuario ya están disponibles
  onAppUserReady(cb: () => void) {
    this.appUserReadyListeners.push(cb);
    if (this.currentUserData) cb();
  }

  emitAppUserReady() {
    for (const cb of this.appUserReadyListeners) cb();
  }

 private async syncBackendUser(
  email: string,
  nombre: string | null
): Promise<{ id: string; rol: string } | null> {

  try {
    const user = await this.userService
      .syncUser(email, nombre ?? '')
      .toPromise();

    if (!user) return null;

    return {
      id: user.id,
      rol: user.rol   // 🔑 ROL VIENE DEL BACKEND
    };

  } catch (error) {
    console.error('Error sincronizando usuario con backend', error);
    return null;
  }
}


}
