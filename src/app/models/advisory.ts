import { User } from './user';
import { Project } from './project';

export interface Advisory {
  id?: string;
  mensaje: string;
  fecha: string;
  hora: string;
  estado: string;

  nombreCliente: string;
  correoCliente: string;

  user: {
    id: string;
  };

  project?: {
    id: string;
  } | null;
}


