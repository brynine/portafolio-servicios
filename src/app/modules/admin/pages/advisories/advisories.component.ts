import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdvisoryService } from '../../../../core/services/advisory.service';
import { Advisory } from '../../../../models/advisory';

@Component({
  selector: 'app-advisories',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './advisories.component.html',
  styleUrls: ['./advisories.component.scss']
})
export class AdvisoriesComponent implements OnInit {

  advisories: Advisory[] = [];

  constructor(private advisoryService: AdvisoryService) {}

  ngOnInit(): void {
    this.loadAdvisories();
  }

  loadAdvisories() {
    this.advisoryService.getAll().subscribe({
      next: (data) => {
        this.advisories = data;
      },
      error: (err) => {
        console.error('Error al cargar asesorías', err);
      }
    });
  }
}
