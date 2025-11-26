export type UserRole = 'admin' | 'programador' | 'usuario';

export interface AppUser {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  role: UserRole;
  especialidad?: string;
  descripcion?: string;
}
