export interface Notification {
  id: string;
  mensaje: string;
  fecha: string;
  leido: boolean;
  user?: {
    id: string;
    nombre: string;
    email: string;
  };
}
