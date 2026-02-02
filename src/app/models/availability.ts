import { User } from './user';

export interface Availability {
  id: string;
  dia: string;
  horaInicio: string;
  horaFin: string;
  user: {
    id: String};
}
