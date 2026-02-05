import { Injectable } from '@angular/core';
import * as emailjs from '@emailjs/browser'; 

@Injectable({
  providedIn: 'root'
})
export class EmailService {

  private SERVICE_ID = 'service_vymsn8k';

  private TEMPLATE_ID = 'template_602bvrs'; 
  private PUBLIC_KEY = 'CMx7HnT7j9FSmDve2'; 

  constructor() {
    console.log('EmailService inicializado');
  }

  enviarCorreo(data: any) {
  return emailjs.send(
    this.SERVICE_ID,
    this.TEMPLATE_ID,
    data,
    this.PUBLIC_KEY
  );
}

}
