import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { CartItem } from '../../models/cartItem.model';
import { PaymentService } from '../../services/payment.service';

// IMPORTANTE: Añadimos runTransaction para el bloqueo atómico
import { Database, ref, get, update, push, runTransaction } from '@angular/fire/database';
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

  // Variables para el Modal de Bootstrap
  mostrarModal: boolean = false;
  modalTitulo: string = '';
  modalMensaje: string = '';
  modalEsError: boolean = false;

  ngOnInit(): void {
    this.cartService.getCart().subscribe(items => {
      this.cartItems = items;
      this.total = this.cartService.getTotal();
    });
  }

  mostrarAlerta(titulo: string, mensaje: string, esError: boolean = true) {
    this.modalTitulo = titulo;
    this.modalMensaje = mensaje;
    this.modalEsError = esError;
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
    if (this.modalTitulo === 'Falta Dirección') {
      this.router.navigate(['/perfil']);
    }
  }

  async validarCompra(): Promise<boolean> {
    const user = this.auth.currentUser;
    if (!user) {
      this.mostrarAlerta('Sesión necesaria', 'Inicia sesión para comprar.');
      return false;
    }

    const userRef = ref(this.db, `users/${user.uid}`);
    const userSnap = await get(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.val();
      if (!userData.address || !userData.address.street || !userData.address.city || !userData.address.zipCode) {
        this.mostrarAlerta('Falta Dirección', 'No tenemos tus datos de envío. Por favor, rellénalos en tu perfil.');
        return false;
      }
    }

    for (let item of this.cartItems) {
      const tallaKey = item.tallaElegida.toString().replace('.', '_');
      const stockRef = ref(this.db, `sneakers/${item.productId}/sizes/${tallaKey}`);
      const stockSnap = await get(stockRef);
      const stockReal = stockSnap.exists() ? stockSnap.val() : 0;

      if (stockReal < item.cantidad) {
        this.mostrarAlerta('Sin Stock', `Lo sentimos, solo quedan ${stockReal} unidades de "${item.name}" en talla ${item.tallaElegida}.`);
        return false;
      }
    }
    return true;
  }

  async procesarCompraExitosa() {
    const user = this.auth.currentUser;
    if (!user) return;

    try {
      // 1. INTENTAR DESCONTAR STOCK ATÓMICAMENTE
      for (const item of this.cartItems) {
        const tallaKey = item.tallaElegida.toString().replace('.', '_');
        const stockRef = ref(this.db, `sneakers/${item.productId}/sizes/${tallaKey}`);

        const result = await runTransaction(stockRef, (currentStock) => {
          if (currentStock === null) return 0;
          if (currentStock < item.cantidad) return; // ABORTAR si alguien compró mientras pagábamos
          return currentStock - item.cantidad;
        });

        if (!result.committed) {
          this.mostrarAlerta("¡Vendido!", `Lo sentimos, alguien ha comprado la última unidad de "${item.name}" mientras procesabas el pago. Contacta con soporte para la devolución.`);
          return;
        }
      }

      // 2. SI EL STOCK SE RESTÓ BIEN, GUARDAMOS EL PEDIDO
      const userRef = ref(this.db, `users/${user.uid}`);
      const userSnap = await get(userRef);
      const userData = userSnap.val();
      const orderId = push(ref(this.db, 'orders')).key;

      const nuevoPedido = {
        order_id: orderId,
        order_date: Date.now(),
        status: 'PAID',
        total: this.total,
        address: userData.address.street,
        city: userData.address.city,
        zipCode: userData.address.zipCode,
        purchased_sneakers: this.cartItems.map(item => ({
          name_snap: item.name,
          price_snap: item.price,
          imagen_snap: item.imageUrl,
          talla_elegida: item.tallaElegida.toString(),
          cantidad_comprada: item.cantidad
        }))
      };

      await update(ref(this.db, `orders/${user.uid}/${orderId}`), nuevoPedido);
      this.cartService.clearCart();
      this.router.navigate(['/success'], { state: { orderSuccess: true } });

    } catch (error) {
      this.mostrarAlerta("Error Crítico", "El pago se realizó pero hubo un error en la base de datos.");
    }
  }

async confirmarPago() {
    if (!this.stripe || !this.elements) return;
    this.isProcessing = true;

    // 1. INTENTAMOS APARTAR EL STOCK ANTES DE COBRAR
    const stockApartado = await this.apartarStock();
    
    if (!stockApartado) {
      this.isProcessing = false;
      this.cancelarPago();
      return; // Si no hemos podido restar el stock, ni siquiera llamamos a Stripe
    }

    // 2. SI TENEMOS EL STOCK APARTADO, LLAMAMOS A STRIPE
    const { error, paymentIntent } = await this.stripe.confirmPayment({
      elements: this.elements,
      confirmParams: { return_url: `${window.location.origin}/success` },
      redirect: 'if_required' 
    });

    if (error) {
      // 3. SI EL PAGO FALLA (Tarjeta rechazada, etc.), DEVOLVEMOS EL STOCK
      await this.devolverStock();
      this.mostrarAlerta('Pago fallido', error.message || 'Error al procesar la tarjeta');
      this.isProcessing = false;
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      // 4. PAGO OK -> GUARDAMOS EL PEDIDO FINAL
      await this.guardarPedidoFinal();
    }
  }

  // FUNCIÓN PARA RESTAR EL STOCK (ANTES DE COBRAR)
  async apartarStock(): Promise<boolean> {
    try {
      for (const item of this.cartItems) {
        const tallaKey = item.tallaElegida.toString().replace('.', '_');
        const stockRef = ref(this.db, `sneakers/${item.productId}/sizes/${tallaKey}`);

        const result = await runTransaction(stockRef, (currentStock) => {
          if (currentStock === null) return 0;
          if (currentStock < item.cantidad) return; // ABORTAR si no hay suficiente
          return currentStock - item.cantidad;
        });

        if (!result.committed) return false;
      }
      return true;
    } catch (e) { return false; }
  }

  // FUNCIÓN PARA DEVOLVER EL STOCK SI EL PAGO FALLA
  async devolverStock() {
    for (const item of this.cartItems) {
      const tallaKey = item.tallaElegida.toString().replace('.', '_');
      const stockRef = ref(this.db, `sneakers/${item.productId}/sizes/${tallaKey}`);
      await runTransaction(stockRef, (currentStock) => (currentStock || 0) + item.cantidad);
    }
  }

  async guardarPedidoFinal() {
    const user = this.auth.currentUser;
    const userRef = ref(this.db, `users/${user?.uid}`);
    const userData = (await get(userRef)).val();
    const orderId = push(ref(this.db, 'orders')).key;

    const nuevoPedido = {
      order_id: orderId,
      order_date: Date.now(),
      status: 'PAID',
      total: this.total,
      address: userData.address.street,
      city: userData.address.city,
      zipCode: userData.address.zipCode,
      purchased_sneakers: this.cartItems.map(item => ({
        name_snap: item.name,
        price_snap: item.price,
        imagen_snap: item.imageUrl,
        talla_elegida: item.tallaElegida.toString(),
        cantidad_comprada: item.cantidad
      }))
    };

    await update(ref(this.db, `orders/${user?.uid}/${orderId}`), nuevoPedido);
    this.cartService.clearCart();
    this.router.navigate(['/success'], { state: { orderSuccess: true } });
  }

  async checkout() {
    if (this.cartItems.length === 0) return;
    this.isProcessing = true;
    if (await this.validarCompra()) {
      this.clientSecret = await this.paymentService.obtenerClientSecret(this.cartItems, this.total);
      if (this.clientSecret) {
        this.stripe = await this.paymentService.getStripe();
        this.showPaymentForm = true;
        this.elements = this.stripe.elements({ clientSecret: this.clientSecret });
        this.paymentElement = this.elements.create('payment');
        setTimeout(() => { this.paymentElement.mount('#payment-element'); this.isProcessing = false; }, 0);
      }
    } else { this.isProcessing = false; }
  }

cancelarPago() {
    this.showPaymentForm = false;
    this.isProcessing = false;
    
    this.router.navigate(['/cancel'], { state: { orderCancelled: true } }); 
  }  incrementQuantity(item: CartItem) { if (this.showPaymentForm) this.cancelarPago(); this.cartService.updateQuantity(item.detalleCartId, item.cantidad + 1); }

calculateTotal() {
  this.total = this.cartItems.reduce((acc, item) => acc + (item.price * item.cantidad), 0);
}
  decrementQuantity(item: CartItem) { if (this.showPaymentForm) this.cancelarPago(); if (item.cantidad > 1) this.cartService.updateQuantity(item.detalleCartId, item.cantidad - 1); else this.removeItem(item.detalleCartId); }
  removeItem(id: string) { if (this.showPaymentForm) this.cancelarPago(); this.cartService.removeFromCart(id); }
}