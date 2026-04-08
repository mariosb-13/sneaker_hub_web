import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Database, ref, onValue, update } from '@angular/fire/database';
import { AdminTableComponent, TableColumn } from '../admin-table/admin-table.component';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, AdminTableComponent],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="fw-bold text-dark m-0">Gestión de Usuarios</h2>
    </div>

    <app-admin-table 
      [data]="users" 
      [columns]="misColumnas" 
      searchPlaceholder="Buscar usuario por nombre o correo..."
      (onAction)="manejarAccion($event)">
    </app-admin-table>
  `
})
export class AdminUsersComponent implements OnInit {
  private db = inject(Database);
  users: any[] = [];

  // Le decimos a la tabla qué columnas queremos y de qué tipo
  misColumnas: TableColumn[] = [
    { field: 'fullName', header: 'Usuario', type: 'avatar' },
    { field: 'email', header: 'Correo Electrónico', type: 'text' },
    { field: 'rol', header: 'Rol del Sistema', type: 'badge' }
  ];

  ngOnInit() {
    const usersRef = ref(this.db, 'users');
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) this.users = Object.keys(data).map(k => ({ uid: k, ...data[k] }));
    });
  }

  // Recibimos el evento de la tabla genérica
  manejarAccion(event: { actionName: string, row: any }) {
    if (event.actionName === 'toggleRole') {
      const nuevoRol = event.row.rol === 'admin' ? 'cliente' : 'admin';
      update(ref(this.db, `users/${event.row.uid}`), { rol: nuevoRol });
    }
    if (event.actionName === 'edit') {
      alert('Vas a editar a: ' + event.row.fullName);
    }
  }
}