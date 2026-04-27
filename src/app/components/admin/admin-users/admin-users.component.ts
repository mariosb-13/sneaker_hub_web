import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Database, ref, list, update, remove } from '@angular/fire/database';
import { Observable, map } from 'rxjs';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-users.component.html'
})
export class AdminUsersComponent implements OnInit {
  private db = inject(Database);
  
  users$: Observable<any[]> | undefined;
  usersList: any[] = [];
  filteredUsers: any[] = [];
  
  totalUsers = 0;
  totalAdmins = 0;

  filtroBusqueda: string = '';

  ngOnInit() {
    this.cargarUsuarios();
  }

  cargarUsuarios() {
    const usersRef = ref(this.db, 'users');
    this.users$ = (list(usersRef) as Observable<any[]>).pipe(
      map(changes => changes.map(c => ({ uid: c.key, ...c.snapshot.val() })))
    );

    this.users$.subscribe(users => {
      this.usersList = users;
      this.totalUsers = users.length;
      this.totalAdmins = users.filter(u => u.rol === 'admin').length;
      this.aplicarFiltro();
    });
  }

  aplicarFiltro() {
    this.filteredUsers = this.usersList.filter(u => 
      u.fullName?.toLowerCase().includes(this.filtroBusqueda.toLowerCase()) ||
      u.email?.toLowerCase().includes(this.filtroBusqueda.toLowerCase())
    );
  }

  async cambiarRol(user: any) {
    const nuevoRol = user.rol === 'admin' ? 'user' : 'admin';
    const userRef = ref(this.db, `users/${user.uid}`);
    try {
      await update(userRef, { rol: nuevoRol });
    } catch (e) { alert("Error al cambiar rol"); }
  }

  async eliminarUsuario(uid: string) {
    if (confirm('¿Seguro que quieres eliminar este usuario? No hay vuelta atrás.')) {
      const userRef = ref(this.db, `users/${uid}`);
      await remove(userRef);
    }
  }
}