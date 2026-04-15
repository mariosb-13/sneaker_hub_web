import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Database, ref, onValue } from '@angular/fire/database';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit {
  private db = inject(Database);

  ventasMes: number = 0;
  stockTotal: number = 0;
  pedidosPendientes: number = 0;

  ngOnInit() {
    this.calcularEstadisticas();
  }

  calcularEstadisticas() {
    // Calcular Ventas del Mes y Pedidos Pendientes
    const ordersRef = ref(this.db, 'orders');
    onValue(ordersRef, (snapshot) => {
      this.ventasMes = 0;
      this.pedidosPendientes = 0;
      
      if (snapshot.exists()) {
        const allOrders = snapshot.val();
        
        // Obtenemos el mes y año en el que estamos ahora mismo
        const now = new Date();
        const mesActual = now.getMonth();
        const anioActual = now.getFullYear();

        for (const uid in allOrders) {
          const userOrders = allOrders[uid];
          for (const orderId in userOrders) {
            const order = userOrders[orderId];
            
            // Si está pagado pero no enviado, es un pedido pendiente
            if (order.status === 'PAID') {
              this.pedidosPendientes++;
            }

            // Si el pedido tiene fecha, comprobamos si es de este mes
            if (order.order_date) {
              const orderDate = new Date(order.order_date);
              if (orderDate.getMonth() === mesActual && orderDate.getFullYear() === anioActual) {
                this.ventasMes += (order.total || 0);
              }
            }
          }
        }
      }
    });

    // Calcular Stock Total de Zapatillas
    const sneakersRef = ref(this.db, 'sneakers');
    onValue(sneakersRef, (snapshot) => {
      this.stockTotal = 0;
      
      if (snapshot.exists()) {
        const sneakers = snapshot.val();
        for (const key in sneakers) {
          const sizes = sneakers[key].sizes;
          if (sizes) {
            // Recorremos todas las tallas de esta zapatilla y sumamos las cantidades
            for (const sizeKey in sizes) {
              const qty = sizes[sizeKey];
              if (qty > 0) {
                this.stockTotal += qty;
              }
            }
          }
        }
      }
    });
  }
}