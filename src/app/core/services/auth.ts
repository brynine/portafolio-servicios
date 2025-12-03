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

export type UserRole = 'admin' | 'programador' | 'externo';

export interface AppUser {
  uid: string;
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

  public currentUserData: AppUser | null = null;
  public authLoaded = false;

  private userDataListeners: ((u: AppUser | null) => void)[] = [];

  constructor() {
    this.app = initializeApp(environment.firebase);
    this.auth = getAuth(this.app);
    this.db = getFirestore(this.app);

    console.log("Firebase inicializado correctamente");

onAuthStateChanged(this.auth, async (user) => {
  if (user) {
    await this.loadUserData(user);
  } else {
    this.currentUserData = null;
    this.emitUserDataChange();
  }

  this.authLoaded = true;
  this.emitAppUserReady();
});
  }

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

  async loginWithGoogle(): Promise<User | null> {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      const result = await signInWithPopup(this.auth, provider);
      const user = result.user;

      if (!user) return null;

      console.log("Usuario autenticado:", user.email);

      await this.saveUserIfNotExists(user);
      await this.loadUserData(user);

      return user;

    } catch (error) {
      console.error("ERROR LOGIN GOOGLE:", error);
      return null;
    }
  }
  // Guardar y actualizar usuario
  private async saveUserIfNotExists(user: User): Promise<void> {

    const q = query(
      collection(this.db, 'users'),
      where('email', '==', user.email)
    );

    const snap = await getDocs(q);

    const googlePhoto =
      user.photoURL ||
      (user as any).reloadUserInfo?.photoUrl ||
      null;

    if (!snap.empty) {
      const docRef = snap.docs[0].ref;
      const data = snap.docs[0].data() as AppUser;

      console.log("Usuario existe. Actualizando datos con Google...");

      await setDoc(docRef, {
        ...data,
        uid: user.uid,
        photo: googlePhoto,
        name: user.displayName,
        updatedAt: new Date()
      }, { merge: true });

      return;
    }

    const newUser: AppUser = {
      uid: user.uid,
      name: user.displayName,
      email: user.email,
      photo: googlePhoto,
      role: 'externo'
    };

    await setDoc(doc(this.db, 'users', user.uid), {
      ...newUser,
      createdAt: new Date()
    });

    console.log("Usuario externo creado en Firestore");
  }
  // Cargar datos del usuario
  private async loadUserData(user: User): Promise<void> {

    const q = query(
      collection(this.db, 'users'),
      where('email', '==', user.email)
    );

    const snap = await getDocs(q);

    const googlePhoto =
      user.photoURL ||
      (user as any).reloadUserInfo?.photoUrl ||
      null;

    if (!snap.empty) {
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

      this.currentUserData = data;
      this.emitUserDataChange();
      return;
    }

    const newUser: AppUser = {
      uid: user.uid,
      name: user.displayName,
      email: user.email,
      photo: googlePhoto,
      role: 'externo'
    };

    await setDoc(doc(this.db, 'users', user.uid), newUser);

    this.currentUserData = newUser;
    this.emitUserDataChange();
this.emitAppUserReady();

  }

  getRole(): UserRole | null {
    return this.currentUserData?.role || null;
  }

  isAdmin(): boolean {
    return this.currentUserData?.role === 'admin';
  }

  isProgramador(): boolean {
    return this.currentUserData?.role === 'programador';
  }

  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }

  onAuthChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(this.auth, callback);
  }

  async logout(): Promise<void> {
    this.currentUserData = null;
    this.emitUserDataChange();
    await signOut(this.auth);
  }

private appUserReadyListeners: (() => void)[] = [];

onAppUserReady(cb: () => void) {
  this.appUserReadyListeners.push(cb);
  if (this.currentUserData) cb();
}

private emitAppUserReady() {
  for (const cb of this.appUserReadyListeners) cb();
}

}