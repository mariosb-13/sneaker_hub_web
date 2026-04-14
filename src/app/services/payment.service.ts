import { Injectable, inject } from '@angular/core';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CartItem } from '../models/cartItem.model';
import { Auth } from '@angular/fire/auth';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private http = inject(HttpClient);
  private auth = inject(Auth);
  
  // Tu clave pública de Stripe
  private stripePromise = loadStripe('pk_test_51TJ7gdAVMjolobzNIGzBUR8GhTClqe3tkieFZWB4RhxBMShwX1u1UsMqZqyRrogtfGWH5A2z7nSLkRc5C8NJ6cW400sMfwNlbL'); 

  async getStripe() {
    return await this.stripePromise;
  }

  async obtenerClientSecret(items: CartItem[], total: number): Promise<string | null> {
    const user = this.auth.currentUser;
    if (!user) return null;

    try {
      const token = await user.getIdToken();
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      const url = 'https://createpaymentintent-lspijhp7ca-ew.a.run.app';

      // Empaquetamos para función Callable de Firebase
      const body = {
        data: {
          amount: Math.round(total * 100),
          currency: 'eur',
          items: items.map(i => ({ 
            productId: i.productId, 
            cantidad: i.cantidad,
            tallaElegida: i.tallaElegida 
          }))
        }
      };

      const response = await firstValueFrom(
        this.http.post<{ result: { clientSecret: string } }>(url, body, { headers })
      );

      return response.result?.clientSecret || null;

    } catch (error) {
      console.error('Error al obtener el secret:', error);
      return null;
    }
  }
}