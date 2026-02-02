import { Component, OnInit } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { NotificationService } from '../../../../core/services/notification.service';
import { Notification } from '../../../../models/notification';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, NgFor, NgIf, RouterModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit {
  notifications: Notification[] = [];

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.cargarNotificaciones();
  }

  cargarNotificaciones() {
    this.notificationService.getAll().subscribe({
      next: (data) => { 
        this.notifications = data; 
        console.log('Notificaciones cargadas:', data);
      },
      error: (err) => { 
        console.error('Error al cargar notificaciones', err); 
      }
    });
  }
}
