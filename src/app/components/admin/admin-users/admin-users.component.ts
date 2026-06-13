import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Database, ref, list, update, remove } from '@angular/fire/database';
import { Observable, map } from 'rxjs';
import { AlertService } from '../../../services/alert.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-users.component.html'
})
export class AdminUsersComponent implements OnInit {
  private db = inject(Database);
  private alertService = inject(AlertService);
  
  users$: Observable<any[]> | undefined;
  usersList: any[] = [];
  filteredUsers: any[] = [];
  
  totalUsers = 0;
  totalAdmins = 0;

  filtroBusqueda: string = '';
  
  mostrarModalConfirm: boolean = false;
  usuarioAEliminar: any = null;

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
      this.alertService.success('Rol actualizado', `El rol del usuario ha sido actualizado correctamente.`);
    } catch (e) {
      this.alertService.error('Error', 'No fue posible cambiar el rol del usuario. Intenta de nuevo.');
    }
  }

  async eliminarUsuario(user: any) {
    this.usuarioAEliminar = user;
    this.mostrarModalConfirm = true;
  }

  cerrarModalConfirm() {
    this.mostrarModalConfirm = false;
    this.usuarioAEliminar = null;
  }

  async confirmarEliminarUsuario() {
    if (!this.usuarioAEliminar) return;
    
    const uid = this.usuarioAEliminar.uid;
    const userRef = ref(this.db, `users/${uid}`);
    try {
      await remove(userRef);
      // Eliminar del array local para actualizar la UI inmediatamente
      this.usersList = this.usersList.filter(u => u.uid !== uid);
      this.totalUsers = this.usersList.length;
      this.totalAdmins = this.usersList.filter(u => u.rol === 'admin').length;
      this.aplicarFiltro();
      this.alertService.success('Usuario eliminado', `${this.usuarioAEliminar.fullName} ha sido eliminado correctamente del sistema.`);
    } catch (error) {
      this.alertService.error('Error', 'No fue posible eliminar el usuario. Intenta de nuevo.');
    } finally {
      this.cerrarModalConfirm();
    }
  }
}