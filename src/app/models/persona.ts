import { User } from './user';

export interface Persona {
  cedula: string;
  nombre: string;
  direccion?: string;
  user?: User;
}
