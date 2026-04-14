import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { CartItem } from '../../models/cartItem.model';
import { Auth, authState } from '@angular/fire/auth'; 
import { Firestore, collection, addDoc } from '@angular/fire/firestore'; 
import { Database, ref, set, get, push } from '@angular/fire/database'; 
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-success',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './success.component.html',
  styleUrls: ['./success.component.scss']
})
export class SuccessComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private cartService = inject(CartService);
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private db = inject(Database);

  status: string | null = null;
  correoEnviado = false;

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.status = params['redirect_status'];

      // Stripe devuelve 'succeeded' cuando el pago externo ha ido bien
      if (this.status === 'succeeded' || !this.status) {
        
        // 1. ESPERAMOS A QUE FIREBASE RECUERDE LA SESIÓN DEL USUARIO
        authState(this.auth).pipe(take(1)).subscribe(async user => {
          if (user) {
            await this.procesarPedido(user); // Le pasamos el usuario verificado
          } else {
            console.error("No se pudo recuperar la sesión del usuario tras el pago.");
          }
        });
      }
    });
  }

  // 2. RECIBIMOS EL USUARIO POR PARÁMETRO
  async procesarPedido(user: any) {
    if (this.correoEnviado) return; // Evitamos duplicados

    try {
      // 3. LEEMOS EL CARRITO DIRECTAMENTE DE LA BASE DE DATOS
      // Así evitamos el retraso del CartService al recargar la página
      const cartRef = ref(this.db, `cart/${user.uid}`);
      const snapshot = await get(cartRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        const cartItems = Object.values(data) as CartItem[];

        if (cartItems.length > 0) {
          this.correoEnviado = true; 
          await this.guardarYEnviarCorreo(cartItems, user); // Pasamos el usuario
          this.cartService.clearCart(); // Borramos el carrito
        }
      } else {
        console.log("El carrito ya estaba vacío (posible recarga de página).");
      }
    } catch (error) {
      console.error("Error al procesar el pedido tras redirección:", error);
    }
  }

  // 4. USAMOS EL USUARIO QUE LE HEMOS PASADO
  async guardarYEnviarCorreo(items: CartItem[], user: any) {
    if (!user || !user.email) return;

    let userAddress: any = {
      street: "Dirección web",
      city: "Ciudad web",
      zipCode: "00000",
      door: ""
    };

    try {
      const userRef = ref(this.db, `users/${user.uid}/address`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        userAddress = snapshot.val();
      }
    } catch (error) {
      console.warn("No se pudo leer la dirección del perfil, usando valores por defecto.");
    }

    const totalPagado = items.reduce((acc, item) => acc + (item.price * item.cantidad), 0);
    const ordersRef = ref(this.db, `orders/${user.uid}`);
    const orderId = push(ordersRef).key || 'ORD-FALLBACK-' + Date.now(); 

    const purchased_sneakers = items.map(item => {
      const uuidCorto = 'C-' + Math.random().toString(36).substring(2, 9);
      return {
        copia_id: uuidCorto,
        id_producto_original: item.productId,
        name_snap: item.name,
        brand_snap: item.brand || '',
        price_snap: item.price,
        talla_elegida: item.tallaElegida,
        imagen_snap: item.imageUrl,
        cantidad_comprada: item.cantidad
      };
    });

    const itemsListFormatted = items.map(item => `• ${item.name}`).join('\n');

    // Detectamos si viene de un método con redirección para guardarlo en el historial
    const metodoPago = this.status ? 'Stripe (Amazon Pay / 3D Secure)' : 'Stripe (Tarjeta)';

    const orderData = {
      order_id: orderId,
      order_date: Date.now(),
      total: totalPagado,
      status: 'PAID',
      paymentMethod: metodoPago,
      address: userAddress.street || '',
      city: userAddress.city || '',
      zipCode: userAddress.zipCode || '',
      door: userAddress.door || '',
      itemsListFormatted: itemsListFormatted,
      purchased_sneakers: purchased_sneakers
    };

    const newOrderRef = ref(this.db, `orders/${user.uid}/${orderId}`);
    await set(newOrderRef, orderData);

    const logoUrl = "https://firebasestorage.googleapis.com/v0/b/sneakerhub-3862d.firebasestorage.app/o/SneakerHub.png?alt=media&token=a42e0979-51b2-4a72-ad48-b8a9974ad37a";
    const webUrl = "https://sneaker-hub-web.onrender.com";

    const tablaProductos = `
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 20px;">
        ${items.map(item => {
          const precioLinea = item.price * item.cantidad;
          return `
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee; width: 70px;">
                <img src="${item.imageUrl}" alt="Zapato" style="width: 60px; height: auto; border-radius: 6px;">
              </td>
              <td style="padding: 10px; border-bottom: 1px solid #eeeeee; text-align: left;">
                <p style="margin: 0; font-weight: bold; font-size: 14px; color: #333333;">${item.name}</p>
                <p style="margin: 4px 0 0; font-size: 12px; color: #777777;">Talla: ${item.tallaElegida} | Cantidad: ${item.cantidad}</p>
              </td>
              <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee; text-align: right; font-weight: bold; font-size: 14px; color: #333333;">
                ${precioLinea.toFixed(2)} €
              </td>
            </tr>
          `;
        }).join('')}
      </table>
    `;

    const shortOrderId = orderId.length > 6 ? orderId.substring(1, 7).toUpperCase() : orderId;

    const orderHtml = `
      <div style="background-color: #f4f4f4; padding: 40px 0; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e0e0e0;">
          <div style="padding: 40px 20px; text-align: center;">
            <img src="${logoUrl}" alt="SneakerHub" style="width: 200px; height: auto;">
          </div>
          <div style="padding: 0 40px 40px; text-align: center; color: #333333;">
            <h1 style="font-size: 26px;">¡Gracias por tu compra! </h1>
            <p style="font-size: 16px;">Tu pedido <strong>#${shortOrderId}</strong> se ha procesado correctamente.</p>
            ${tablaProductos}
            <div style="margin: 20px 0; padding: 15px; background-color: #f9f9f9; border-radius: 8px; border: 1px dashed #cccccc; text-align: right;">
               <h2 style="margin: 0; font-size: 20px; color: #000000;">Total pagado: ${totalPagado.toFixed(2)} €</h2>
            </div>
            <p style="font-size: 14px; color: #666666;">En breve te enviaremos la información de seguimiento a tu dirección en ${userAddress.city || 'tu perfil'}.</p>
            <div style="margin-top: 30px;">
              <a href="${webUrl}" style="background-color: #000000; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">SEGUIR COMPRANDO</a>
            </div>
          </div>
        </div>
      </div>
    `;

    const emailData = {
      to: user.email,
      message: {
        subject: "¡Confirmación de tu pedido en SneakerHub! 🎉",
        html: orderHtml
      }
    };

    const mailRef = collection(this.firestore, 'mail');
    try {
      await addDoc(mailRef, emailData);
      console.log(`¡Correo puesto en cola para ${user.email}!`);
    } catch (error) {
      console.error('Fallo al poner el correo en cola', error);
    }
  }
}