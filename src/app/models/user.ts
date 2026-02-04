export interface User {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
  especialidad?: string;
  bio?: string;
  github?: string;
  linkedin?: string;
  instagram?: string;
  sitioWeb?: string;
}
