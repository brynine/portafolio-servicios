export interface Notification {
  id: string;
  mensaje: string;
  fecha: string;
  leido: boolean;

  advisoryId?: string;

  user: {
    id: string;
  };
}
