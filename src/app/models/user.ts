export interface User {
  id: string;
  nombre: string;
  email: string;
  password?: string;
  rol: string;
  activo: boolean;
  especialidad?: string;
}
