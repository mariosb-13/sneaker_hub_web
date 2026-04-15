import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { CartItem } from '../../models/cartItem.model';
import { PaymentService } from '../../services/payment.service';

import { Database, ref, get } from '@angular/fire/database';
import { Auth } from '@angular/fire/auth';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit {
  private cartService = inject(CartService);
  private paymentService = inject(PaymentService);
  private router = inject(Router);
  
  // Inyectamos Auth y BD para hacer las comprobaciones previas
  private db = inject(Database);
  private auth = inject(Auth);

  cartItems: CartItem[] = [];
  total: number = 0;
  
  stripe: any;
  elements: any;
  paymentElement: any;
  
  isProcessing: boolean = false;
  showPaymentForm: boolean = false;
  clientSecret: string | null = null;

  ngOnInit(): void {
    this.cartService.getCart().subscribe(items => {
      this.cartItems = items;
      this.total = this.cartService.getTotal();
    });
  }

  // --- EL PORTERO DE DISCOTECA (NUEVA FUNCIÓN) ---
  async validarCompra(): Promise<boolean> {
    const user = this.auth.currentUser;
    if (!user) {
      alert("Debes iniciar sesión para comprar.");
      return false;
    }

    // 1. COMPROBAR DIRECCIÓN
    const userRef = ref(this.db, `users/${user.uid}`);
    const userSnap = await get(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.val();
      // Verificamos que tenga los datos mínimos de envío (ajústalos si los llamas diferente)
      if (!userData.address || !userData.city || !userData.zipCode) {
        alert("¡Eh! No sabemos dónde enviarlo. Ve a tu Perfil y rellena tu dirección de envío antes de pagar.");
        this.router.navigate(['/perfil']); // Lo mandamos al perfil a que lo rellene
        return false;
      }
    } else {
      return false;
    }

    // 2. COMPROBAR STOCK DE CADA ZAPATILLA
    for (let item of this.cartItems) {
      const tallaKey = item.tallaElegida.replace('.', '_');
      const stockRef = ref(this.db, `sneakers/${item.productId}/sizes/${tallaKey}`);
      const stockSnap = await get(stockRef);
      
      let stockReal = 0;
      if (stockSnap.exists()) {
        stockReal = stockSnap.val();
      }

      // Si pide más de lo que hay, bloqueamos todo
      if (stockReal < item.cantidad) {
        alert(`❌ Error de stock: Solo nos quedan ${stockReal} unidades de "${item.name}" en talla ${item.tallaElegida}. Por favor, ajusta tu carrito.`);
        return false;
      }
    }

    return true; // Si pasa las dos pruebas, ¡le dejamos sacar la tarjeta!
  }

  async checkout() {
    if (this.cartItems.length === 0) return;
    this.isProcessing = true;

    const compraValida = await this.validarCompra();
    
    if (!compraValida) {
      this.isProcessing = false;
      return; // Si no es válida, cortamos el proceso aquí mismo
    }

    // Si todo está OK, seguimos con el proceso normal de Stripe
    this.clientSecret = await this.paymentService.obtenerClientSecret(this.cartItems, this.total);

    if (this.clientSecret) {
      this.stripe = await this.paymentService.getStripe();
      this.showPaymentForm = true;
      
      const appearance = {
        theme: 'stripe' as const,
        variables: { colorPrimary: '#000000' },
      };

      this.elements = this.stripe.elements({ clientSecret: this.clientSecret, appearance });
      this.paymentElement = this.elements.create('payment');

      setTimeout(() => {
        this.paymentElement.mount('#payment-element');
        this.isProcessing = false;
      }, 0);
    } else {
      alert('Error al generar la orden de pago');
      this.isProcessing = false;
    }
  }

 async confirmarPago() {
    if (!this.stripe || !this.elements) return;
    this.isProcessing = true;

    const { error, paymentIntent } = await this.stripe.confirmPayment({
      elements: this.elements,
      confirmParams: {
        return_url: `${window.location.origin}/success`, 
      },
      redirect: 'if_required' 
    });

    if (error) {
      alert('Error: ' + error.message);
      this.isProcessing = false;
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      this.router.navigate(['/success'], { state: { orderSuccess: true } });
    }
  }

  cancelarPago() {
    this.showPaymentForm = false;
    this.isProcessing = false;
  }

  incrementQuantity(item: CartItem) {
    this.cartService.updateQuantity(item.detalleCartId, item.cantidad + 1);
  }

  decrementQuantity(item: CartItem) {
    if (item.cantidad > 1) {
      this.cartService.updateQuantity(item.detalleCartId, item.cantidad - 1);
    } else {
      this.removeItem(item.detalleCartId);
    }
  }

  removeItem(id: string) {
    this.cartService.removeFromCart(id);
  }
}