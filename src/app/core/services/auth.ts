import { Injectable } from '@angular/core';
import { query, where, collection, getDocs } from 'firebase/firestore';
import { HttpClient } from '@angular/common/http';
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
import { Router } from '@angular/router';



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

  public currentUserData: AppUser | null = null;

  public authLoaded = false;

  private userDataListeners: ((u: AppUser | null) => void)[] = [];

  public authReady: Promise<void>;
  private resolveAuthReady!: () => void;

  constructor(private userService: UserService,
    private http: HttpClient, private router: Router
  ) {

    this.app = initializeApp(environment.firebase);
    this.auth = getAuth(this.app);
    this.db = getFirestore(this.app);

    this.authReady = new Promise(resolve => this.resolveAuthReady = resolve);

    onAuthStateChanged(this.auth, async (user) => {

      if (user) {
        await this.loadUserData(user);
      } else {
        this.currentUserData = null;
        this.emitUserDataChange();
      }

      this.authLoaded = true;
      this.emitAppUserReady();

      this.resolveAuthReady();
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

      await this.saveUserFix(user);
      await this.loadUserData(user);

      return user;

    } catch (error) {
      console.error("ERROR LOGIN GOOGLE:", error);
      return null;
    }
  }

  private async saveUserFix(user: User): Promise<void> {

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
      const docRef = snap.docs[0].ref;

      await setDoc(docRef, {
        uid: user.uid,
        name: user.displayName,
        photo: googlePhoto,
        updatedAt: new Date()
      }, { merge: true });

      return;
    }

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

// 🔥 REDIRECCIÓN SEGÚN ROL
setTimeout(() => {
  if (this.currentUserData?.role === 'admin') {
    this.router.navigate(['/admin/dashboard']);
  }
  
  if (this.currentUserData?.role === 'programador') {
    this.router.navigate(['/programador']);
  }
}, 0);

    // 🔐 PEDIR TOKEN JWT AL BACKEND
this.http.post<any>(
  'http://localhost:8080/gproyecto/api/auth/login',
  { email: normalizedEmail }
).subscribe(res => {
  const currentToken = localStorage.getItem('token');

if (!currentToken) {
  localStorage.setItem('token', res.token);
  console.log('Token guardado');
}

  console.log('Token guardado');
});



      this.emitUserDataChange();
      return;

    }

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
      rol: user.rol
    };

  } catch (error) {
    console.error('Error sincronizando usuario con backend', error);
    return null;
  }
}

}
