import { User } from './user';
import { Project } from './project';

export interface Advisory {
  id: string;
  tema: string;
  descripcion: string;
  fecha: string;
  estado: string;
  user: User;
  project: Project;
}
