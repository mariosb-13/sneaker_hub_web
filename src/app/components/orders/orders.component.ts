import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrdersService } from '../../services/orders.service';
import { Order } from '../../models/order.model';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
})
export class OrdersComponent implements OnInit {
  private ordersService = inject(OrdersService);
  
  pedidos: Order[] = [];
  cargando = true;

  async ngOnInit() {
    this.pedidos = await this.ordersService.getUserOrders();
    
    // Ordenamos usando order_date
    this.pedidos.sort((a, b) => {
      const fechaA = a.order_date || 0;
      const fechaB = b.order_date || 0;
      return fechaB - fechaA;
    });
    
    this.cargando = false;
  }
}