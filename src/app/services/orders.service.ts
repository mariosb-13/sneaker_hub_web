import { Injectable, inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Database, ref, get } from '@angular/fire/database';
import { Order } from '../models/order.model'; 

@Injectable({
  providedIn: 'root'
})
export class OrdersService {
  private auth = inject(Auth);
  private db = inject(Database);

  // Obtener todos los pedidos del usuario
  async getUserOrders(): Promise<Order[]> {
    const user = this.auth.currentUser;
    if (!user) return [];

    const ordersRef = ref(this.db, `orders/${user.uid}`);
    const snapshot = await get(ordersRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      const orders = Object.values(data) as Order[];

      orders.forEach(order => {
        if (order.purchased_sneakers && !Array.isArray(order.purchased_sneakers)) {
          order.purchased_sneakers = Object.values(order.purchased_sneakers);
        }
      });

      return orders;
    }
    return [];
  }

  // NUEVO: Obtener un solo pedido por su ID
  async getOrderById(orderId: string): Promise<Order | null> {
    const user = this.auth.currentUser;
    if (!user) return null;

    const orderRef = ref(this.db, `orders/${user.uid}/${orderId}`);
    const snapshot = await get(orderRef);
    
    if (snapshot.exists()) {
      const order = snapshot.val() as Order;
      
      if (order.purchased_sneakers && !Array.isArray(order.purchased_sneakers)) {
        order.purchased_sneakers = Object.values(order.purchased_sneakers);
      }
      return order;
    }
    return null;
  }
}