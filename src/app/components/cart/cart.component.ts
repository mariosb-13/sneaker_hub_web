import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { CartItem } from '../../models/cartItem.model';
import { PaymentService } from '../../services/payment.service';

// Realtime Database para stock y pedidos
import { Database, ref, get, update, push, runTransaction } from '@angular/fire/database';
import { Auth } from '@angular/fire/auth';

// Firestore para la extensión de correos
import { Firestore, collection, addDoc } from '@angular/fire/firestore';

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
  private firestore = inject(Firestore);

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
      for (const item of this.cartItems) {
        const tallaKey = item.tallaElegida.toString().replace('.', '_');
        const stockRef = ref(this.db, `sneakers/${item.productId}/sizes/${tallaKey}`);

        const result = await runTransaction(stockRef, (currentStock) => {
          if (currentStock === null) return 0;
          if (currentStock < item.cantidad) return; 
          return currentStock - item.cantidad;
        });

        if (!result.committed) {
          this.mostrarAlerta("¡Vendido!", `Alguien ha comprado la última unidad de "${item.name}" mientras procesabas el pago. Contacta con soporte.`);
          return;
        }
      }

      const userRef = ref(this.db, `users/${user.uid}`);
      const userSnap = await get(userRef);
      const userData = userSnap.val();
      const orderId = push(ref(this.db, 'orders')).key;

      const correoSeguro = user?.email || userData?.email || '';
      const nombreSeguro = userData?.fullName || user?.displayName || 'Usuario';

      const nuevoPedido = {
        order_id: orderId,
        order_date: Date.now(),
        status: 'PAID',
        total: this.total,
        userName: nombreSeguro,
        userEmail: correoSeguro,
        address: userData?.address?.street || '',
        city: userData?.address?.city || '',
        zipCode: userData?.address?.zipCode || '',
        purchased_sneakers: this.cartItems.map(item => ({
          name_snap: item.name,
          price_snap: item.price,
          imagen_snap: item.imageUrl,
          talla_elegida: item.tallaElegida.toString(),
          cantidad_comprada: item.cantidad
        }))
      };

      await update(ref(this.db, `orders/${user.uid}/${orderId}`), nuevoPedido);
      
      if (correoSeguro) {
        await this.enviarCorreoConfirmacion(correoSeguro, nombreSeguro, orderId!);
      }

      this.cartService.clearCart();
      this.router.navigate(['/success'], { state: { orderSuccess: true } });

    } catch (error) {
      this.mostrarAlerta("Error Crítico", "Hubo un error al procesar el pedido.");
    }
  }

  async confirmarPago() {
    if (!this.stripe || !this.elements) return;
    this.isProcessing = true;

    const stockApartado = await this.apartarStock();
    if (!stockApartado) {
      this.isProcessing = false;
      this.cancelarPago();
      return; 
    }

    const { error, paymentIntent } = await this.stripe.confirmPayment({
      elements: this.elements,
      confirmParams: { return_url: `${window.location.origin}/success` },
      redirect: 'if_required' 
    });

    if (error) {
      await this.devolverStock();
      this.mostrarAlerta('Pago fallido', error.message || 'Error en la tarjeta');
      this.isProcessing = false;
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      await this.guardarPedidoFinal();
    }
  }

  async apartarStock(): Promise<boolean> {
    try {
      for (const item of this.cartItems) {
        const tallaKey = item.tallaElegida.toString().replace('.', '_');
        const stockRef = ref(this.db, `sneakers/${item.productId}/sizes/${tallaKey}`);
        const result = await runTransaction(stockRef, (currentStock) => {
          if (currentStock === null) return 0;
          if (currentStock < item.cantidad) return; 
          return currentStock - item.cantidad;
        });
        if (!result.committed) return false;
      }
      return true;
    } catch (e) { return false; }
  }

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

    const correoSeguro = user?.email || userData?.email || '';
    const nombreSeguro = userData?.fullName || user?.displayName || 'Usuario';

    const nuevoPedido = {
      order_id: orderId,
      order_date: Date.now(),
      status: 'PAID',
      total: this.total,
      userName: nombreSeguro,
      userEmail: correoSeguro,
      address: userData?.address?.street || '',
      city: userData?.address?.city || '',
      zipCode: userData?.address?.zipCode || '',
      purchased_sneakers: this.cartItems.map(item => ({
        name_snap: item.name,
        price_snap: item.price,
        imagen_snap: item.imageUrl,
        talla_elegida: item.tallaElegida.toString(),
        cantidad_comprada: item.cantidad
      }))
    };

    await update(ref(this.db, `orders/${user?.uid}/${orderId}`), nuevoPedido);

    if (correoSeguro) {
      await this.enviarCorreoConfirmacion(correoSeguro, nombreSeguro, orderId!);
    }

    this.cartService.clearCart();
    this.router.navigate(['/success'], { state: { orderSuccess: true } });
  }

  async enviarCorreoConfirmacion(emailDestino: string, nombreCliente: string, orderId: string) {
    try {
      const mailRef = collection(this.firestore, 'mail'); 
      
      const productosHtml = this.cartItems.map(item => `
        <div style="display: flex; align-items: center; border-bottom: 1px solid #f0f0f0; padding: 15px 0;">
          <img src="${item.imageUrl}" style="width: 70px; height: 70px; object-fit: contain; margin-right: 15px;" alt="${item.name}">
          <div style="flex-grow: 1; text-align: left;">
            <p style="margin: 0; font-weight: bold; color: #333333; font-size: 14px;">${item.name}</p>
            <p style="margin: 4px 0 0 0; color: #888888; font-size: 11px;">Talla: ${item.tallaElegida.toString().replace('_', '.')} | Cantidad: ${item.cantidad}</p>
          </div>
          <div style="font-weight: bold; color: #333333; font-size: 14px; white-space: nowrap; margin-left: 10px;">
            ${(item.price * item.cantidad).toFixed(2).replace('.', ',')} €
          </div>
        </div>
      `).join('');

      await addDoc(mailRef, {
        to: emailDestino,
        message: {
          subject: '¡Gracias por tu compra en SneakerHub! 🚀',
          html: `
            <div style="background-color: #fcfcfc; padding: 40px 10px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
              <div style="max-width: 550px; margin: 0 auto; background-color: #ffffff; border-radius: 4px; overflow: hidden; border: 1px solid #eeeeee;">
                
                <div style="text-align: center; padding: 40px 30px 30px 30px;">
                  <img src="https://firebasestorage.googleapis.com/v0/b/sneakerhub-3862d.firebasestorage.app/o/SneakerHub.png?alt=media&token=a42e0979-51b2-4a72-ad48-b8a9974ad37a" 
                       alt="SneakerHub" style="width: 250px; margin-bottom: 40px;">
                  
                  <h1 style="color: #333333; font-size: 24px; margin: 0 0 15px 0; font-weight: bold;">¡Gracias por tu compra!</h1>
                  <p style="color: #666666; font-size: 15px; margin: 0;">Tu pedido <strong>#${orderId.substring(1, 20)}</strong> se ha procesado correctamente.</p>
                </div>

                <div style="padding: 0 40px;">
                  ${productosHtml}
                </div>

                <div style="padding: 30px 40px;">
                  <div style="background-color: #f9f9f9; border: 1px dashed #dddddd; border-radius: 8px; padding: 20px; text-align: right;">
                    <span style="color: #333333; font-size: 18px; margin-right: 10px;">Total pagado: </span>
                    <strong style="color: #000000; font-size: 22px;">${this.total.toFixed(2).replace('.', ',')} €</strong>
                  </div>
                </div>

                <div style="text-align: center; padding: 0 40px 40px 40px;">
                  <p style="color: #888888; font-size: 13px; margin-bottom: 30px;">En breve te enviaremos la información de seguimiento.</p>
                  
                  <a href="${window.location.origin}/home" 
                     style="background-color: #000000; color: #ffffff; text-decoration: none; padding: 15px 40px; font-weight: bold; font-size: 13px; border-radius: 4px; display: inline-block; text-transform: uppercase;">
                     SEGUIR COMPRANDO
                  </a>
                </div>

              </div>
            </div>
          `
        }
      });
    } catch (error) {
      console.error('Error al enviar el correo:', error);
    }
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
  }

  incrementQuantity(item: CartItem) { 
    if (this.showPaymentForm) this.cancelarPago(); 
    this.cartService.updateQuantity(item.detalleCartId, item.cantidad + 1); 
  }

  calculateTotal() {
    this.total = this.cartItems.reduce((acc, item) => acc + (item.price * item.cantidad), 0);
  }

  decrementQuantity(item: CartItem) { 
    if (this.showPaymentForm) this.cancelarPago(); 
    if (item.cantidad > 1) this.cartService.updateQuantity(item.detalleCartId, item.cantidad - 1); 
    else this.removeItem(item.detalleCartId); 
  }

  removeItem(id: string) { 
    if (this.showPaymentForm) this.cancelarPago(); 
    this.cartService.removeFromCart(id); 
  }
}