import { Injectable } from '@angular/core';
import * as emailjs from '@emailjs/browser'; 

@Injectable({
  providedIn: 'root'
})
export class EmailService {

  // identificadores configurados en EmailJS
  private SERVICE_ID = 'service_vymsn8k';

  // plantillas separadas: una para el programador y otra para el usuario
  private TEMPLATE_PROGRAMADOR = 'template_602bvrs';
  private TEMPLATE_USUARIO   = 'template_9xjjfjj';
  private PUBLIC_KEY = 'CMx7HnT7j9FSmDve2'; 

  constructor() {
    console.log('EmailService inicializado');
  }

  // método para enviar notificación al programador
  enviarCorreoProgramador(data: any) {
    console.log('Enviando correo a PROGRAMADOR con datos:', data);

    return emailjs
      .send(this.SERVICE_ID, this.TEMPLATE_PROGRAMADOR, data, this.PUBLIC_KEY)
      .then((res) => {
        console.log('EmailJS PROGRAMADOR OK:', res.status, res.text);
        return res;
      })
      .catch((err) => {
        console.error('EmailJS PROGRAMADOR ERROR:', err);
        throw err;
      });
  }

  // método para enviar confirmación al usuario solicitante
  enviarCorreoUsuario(data: any) {
    console.log('Enviando correo a USUARIO con datos:', data);

    return emailjs
      .send(this.SERVICE_ID, this.TEMPLATE_USUARIO, data, this.PUBLIC_KEY)
      .then((res) => {
        console.log('EmailJS USUARIO OK:', res.status, res.text);
        return res;
      })
      .catch((err) => {
        console.error('EmailJS USUARIO ERROR:', err);
        throw err;
      });
  }
}
