import { TipoProyecto } from './tipo-proyecto';
import { User } from './user';

export interface Project {
  id: string;
  nombre: string;
  descripcion?: string;
  tipo: TipoProyecto;
  participacion?: string;
  tecnologias?: string[];
  repositorio?: string;
  deploy?: string;
  createdAt: string;
  user: User;
}
