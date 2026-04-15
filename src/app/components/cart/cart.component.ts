import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { CartItem } from '../../models/cartItem.model';
import { PaymentService } from '../../services/payment.service';
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

  mostrarModal: boolean = false;
  modalTitulo: string = '';
  modalMensaje: string = '';

  ngOnInit(): void {
    this.cartService.getCart().subscribe(items => {
      this.cartItems = items;
      this.total = this.cartService.getTotal();
    });
  }

  mostrarAlerta(titulo: string, mensaje: string) {
    this.modalTitulo = titulo;
    this.modalMensaje = mensaje;
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
      this.mostrarAlerta('Sesión requerida', 'Debes iniciar sesión para poder comprar.');
      return false;
    }

    const userRef = ref(this.db, `users/${user.uid}`);
    const userSnap = await get(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.val();
      if (!userData.address || !userData.address.street || !userData.address.city || !userData.address.zipCode) {
        this.mostrarAlerta('Falta Dirección', 'No sabemos dónde enviarlo. Por favor, rellena tu dirección de envío antes de pagar.');
        return false; 
      }
    } else {
      return false;
    }

    for (let item of this.cartItems) {
      const tallaKey = item.tallaElegida.toString().replace('.', '_');
      const stockRef = ref(this.db, `sneakers/${item.productId}/sizes/${tallaKey}`);
      const stockSnap = await get(stockRef);
      
      let stockReal = 0;
      if (stockSnap.exists()) {
        stockReal = stockSnap.val();
      }

      if (stockReal < item.cantidad) {
        this.mostrarAlerta('Problema de Stock', `¡Vaya! Solo nos quedan ${stockReal} unidades de "${item.name}" en talla ${item.tallaElegida}. Por favor, ajusta tu carrito.`);
        return false;
      }
    }

    return true; 
  }

  async checkout() {
    if (this.cartItems.length === 0) return;
    this.isProcessing = true;

    const compraValida = await this.validarCompra();
    if (!compraValida) {
      this.isProcessing = false;
      return; 
    }

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
      this.mostrarAlerta('Error del servidor', 'Hubo un error al conectar con la pasarela de pago.');
      this.isProcessing = false;
    }
  }

  async confirmarPago() {
    if (!this.stripe || !this.elements) return;
    this.isProcessing = true;

    // Doble validación por si han modificado el carrito con el form abierto
    const compraValida = await this.validarCompra();
    if (!compraValida) {
      this.isProcessing = false;
      this.cancelarPago(); 
      return; 
    }

    const { error, paymentIntent } = await this.stripe.confirmPayment({
      elements: this.elements,
      confirmParams: {
        return_url: `${window.location.origin}/success`, 
      },
      redirect: 'if_required' 
    });

    if (error) {
      this.mostrarAlerta('Error en el pago', error.message || 'Error al procesar la tarjeta');
      this.isProcessing = false;
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      
      await this.procesarCompraExitosa();
      
    }
  }

  async procesarCompraExitosa() {
    const user = this.auth.currentUser;
    if (!user) return;

    try {
      const userRef = ref(this.db, `users/${user.uid}`);
      const userSnap = await get(userRef);
      const userData = userSnap.val();

      // Transacción Atómica (Anti-Hackers)
      for (const item of this.cartItems) {
        const tallaKey = item.tallaElegida.toString().replace('.', '_');
        const stockRef = ref(this.db, `sneakers/${item.productId}/sizes/${tallaKey}`);

        const result = await runTransaction(stockRef, (currentStock) => {
          if (currentStock === null) return 0; 
          if (currentStock < item.cantidad) return; // Aborta si no hay stock
          return currentStock - item.cantidad; // Resta seguro
        });

        if (!result.committed) {
          this.mostrarAlerta("¡Stock Agotado en el último segundo!", `Lo sentimos, alguien acaba de comprar las últimas unidades de "${item.name}".`);
          this.isProcessing = false;
          return; 
        }
      }

      // Si el stock se restó bien, creamos el Ticket
      const orderId = push(ref(this.db, 'orders')).key;
      const itemsListFormatted = this.cartItems.map(item => `• ${item.name}`).join('\n');

      const nuevoPedido = {
        order_id: orderId,
        order_date: Date.now(),
        status: 'PAID',
        total: this.total,
        paymentMethod: 'Stripe (Tarjeta)',
        address: userData.address.street,
        city: userData.address.city,
        zipCode: userData.address.zipCode,
        itemsListFormatted: itemsListFormatted,
        purchased_sneakers: this.cartItems.map(item => ({
          id_producto_original: item.productId,
          name_snap: item.name,
          price_snap: item.price,
          imagen_snap: item.imageUrl,
          talla_elegida: item.tallaElegida.toString(),
          cantidad_comprada: item.cantidad
        }))
      };

      await update(ref(this.db, `orders/${user.uid}/${orderId}`), nuevoPedido);

      // Limpiar y salir
      this.cartService.clearCart();
      this.router.navigate(['/success'], { state: { orderSuccess: true } });

    } catch (error) {
      console.error("Error crítico en la compra:", error);
      this.mostrarAlerta("Error Interno", "Hubo un problema al procesar tu pedido en la base de datos.");
      this.isProcessing = false;
    }
  }

  cancelarPago() {
    this.showPaymentForm = false;
    this.isProcessing = false;
  }

  incrementQuantity(item: CartItem) {
    if (this.showPaymentForm) this.cancelarPago();
    this.cartService.updateQuantity(item.detalleCartId, item.cantidad + 1);
  }

  decrementQuantity(item: CartItem) {
    if (this.showPaymentForm) this.cancelarPago();
    if (item.cantidad > 1) {
      this.cartService.updateQuantity(item.detalleCartId, item.cantidad - 1);
    } else {
      this.removeItem(item.detalleCartId);
    }
  }

  removeItem(id: string) {
    if (this.showPaymentForm) this.cancelarPago();
    this.cartService.removeFromCart(id);
  }
}