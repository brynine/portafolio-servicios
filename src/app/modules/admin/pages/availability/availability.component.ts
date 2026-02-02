import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvailabilityService } from '../../../../core/services/availability.service';
import { Availability } from '../../../../models/availability';

@Component({
  selector: 'app-availability',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './availability.component.html',
  styleUrls: ['./availability.component.scss']
})
export class AvailabilityComponent implements OnInit {

  availabilities: Availability[] = [];

  constructor(private availabilityService: AvailabilityService) {}

  ngOnInit(): void {
    this.loadAvailabilities();
  }

  loadAvailabilities() {
    this.availabilityService.getAll().subscribe({
      next: (data) => {
        this.availabilities = data;
      },
      error: (err) => {
        console.error('Error al cargar disponibilidades', err);
      }
    });
  }
}
