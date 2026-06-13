import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Database, ref, onValue, update } from '@angular/fire/database';
import { AlertService } from '../../../services/alert.service';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-orders.component.html'
})
export class AdminOrdersComponent implements OnInit {
  private db = inject(Database);
  private alertService = inject(AlertService);
  
  pedidos: any[] = [];
  pendientes: number = 0;
  cargando: boolean = true;
  selectedOrder: any = null;

  filtroTexto: string = '';
  filtroEstado: string = 'TODOS';

  ngOnInit() {
    this.cargarTodosLosPedidos();
  }

  cargarTodosLosPedidos() {
    const ordersRef = ref(this.db, 'orders');
    const usersRef = ref(this.db, 'users');

    onValue(ordersRef, (ordersSnap) => {
      this.pedidos = [];
      if (ordersSnap.exists()) {
        const allOrders = ordersSnap.val();

        onValue(usersRef, (usersSnap) => {
          const usersData = usersSnap.val() || {};

          for (const uid in allOrders) {
            const userOrders = allOrders[uid];
            const userInfo = usersData[uid] || { fullName: 'Usuario Eliminado', email: 'Sin datos' };

            for (const orderId in userOrders) {
              this.pedidos.push({
                id: orderId,
                uid: uid,
                userName: userInfo.fullName,
                userEmail: userInfo.email,
                ...userOrders[orderId]
              });
            }
          }

          this.pedidos.sort((a, b) => {
            return (b.order_date || 0) - (a.order_date || 0);
          });

          this.pendientes = this.pedidos.filter(p => p.status === 'PAID').length;
          this.cargando = false;
        });
      } else {
        this.cargando = false;
      }
    });
  }

  get pedidosFiltrados() {
    return this.pedidos.filter(p => {
      const busqueda = this.filtroTexto.toLowerCase();
      const matchTexto = p.id.toLowerCase().includes(busqueda) || 
                         p.userName.toLowerCase().includes(busqueda) || 
                         p.userEmail.toLowerCase().includes(busqueda);
      
      const matchEstado = this.filtroEstado === 'TODOS' || p.status === this.filtroEstado;

      return matchTexto && matchEstado;
    });
  }

  limpiarFiltros() {
    this.filtroTexto = '';
    this.filtroEstado = 'TODOS';
  }

  verDetalles(pedido: any) {
    this.selectedOrder = pedido;
  }

  async actualizarEstado(nuevoEstado: string) {
    if (!this.selectedOrder) return;

    // Apuntamos exactamente al pedido de ese usuario
    const orderRef = ref(this.db, `orders/${this.selectedOrder.uid}/${this.selectedOrder.id}`);
    
    try {
      await update(orderRef, { status: nuevoEstado });
      // El modal no se cierra automáticamente para que el admin vea el cambio,
      // pero actualizamos la variable local por si acaso.
      this.selectedOrder.status = nuevoEstado;
      
    } catch (error) {
      console.error("Error al actualizar estado:", error);
      this.alertService.error('Error', 'No fue posible actualizar el estado del pedido. Intenta de nuevo.');
    }
  }
}