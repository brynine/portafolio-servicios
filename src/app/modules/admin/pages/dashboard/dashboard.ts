import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';

import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit {

  db = getFirestore(initializeApp(environment.firebase));

  users: any[] = [];

  async ngOnInit() {
    await this.loadUsers();
  }

  async loadUsers() {
    const usersRef = collection(this.db, 'users');
    const snapshot = await getDocs(usersRef);

    this.users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log('Usuarios cargados:', this.users);
  }

  async changeRole(userId: string, newRole: string) {
    const userRef = doc(this.db, 'users', userId);
    await updateDoc(userRef, {
      role: newRole
    });

    await this.loadUsers();
  }

}
