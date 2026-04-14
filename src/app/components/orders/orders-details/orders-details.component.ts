import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { OrdersService } from '../../../services/orders.service';
import { Order } from '../../../models/order.model';

@Component({
  selector: 'app-orders-details', // Ajustado a tus nombres
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './orders-details.component.html', // Coincide con tu captura
  styleUrls: ['./orders-details.component.scss']  // Coincide con tu captura
})
export class OrdersDetailsComponent implements OnInit { // Añadida la "s" para ser consistentes
  private route = inject(ActivatedRoute);
  private ordersService = inject(OrdersService);

  pedido: Order | null = null;
  cargando = true;

  async ngOnInit() {
    // Obtenemos el ID de la URL
    const orderId = this.route.snapshot.paramMap.get('id');
    
    if (orderId) {
      this.pedido = await this.ordersService.getOrderById(orderId);
    }
    this.cargando = false;
  }
}