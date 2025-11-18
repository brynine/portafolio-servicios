import { Injectable, inject } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithPopup, signOut, user } from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private auth = inject(Auth);
  private firestore = inject(Firestore);

  user$ = user(this.auth);

  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(this.auth, provider);
    const firebaseUser = result.user;

    // Guardar usuario en Firestore si no existe
    await this.saveUserIfNotExists(firebaseUser.uid, {
      uid: firebaseUser.uid,
      name: firebaseUser.displayName,
      email: firebaseUser.email,
      photo: firebaseUser.photoURL,
      role: "externo" // rol por defecto
    });

    return firebaseUser;
  }

  async logout() {
    return await signOut(this.auth);
  }

  private async saveUserIfNotExists(uid: string, data: any) {
    const ref = doc(this.firestore, `users/${uid}`);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      await setDoc(ref, data);
    }
  }

  async getCurrentUserData() {
    const u = await firstValueFrom(this.user$);
    if (!u) return null;
    const ref = doc(this.firestore, `users/${u.uid}`);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : null;
  }
}
