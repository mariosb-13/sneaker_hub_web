import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Auth, authState } from '@angular/fire/auth';
import { Database, ref, set, onValue, off, remove } from '@angular/fire/database';
import { Sneaker } from '../models/sneaker.model';
import { CartItem } from '../models/cartItem.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private auth = inject(Auth);
  private db = inject(Database);

  private cartItems: CartItem[] = [];
  private cartSubject = new BehaviorSubject<CartItem[]>([]);
  private cartRef: any;

  constructor() {
    authState(this.auth).subscribe(user => {
      if (user) {
        this.listenToCart(user.uid);
      } else {
        if (this.cartRef) off(this.cartRef);
        this.cartItems = [];
        this.cartSubject.next([]);
      }
    });
  }

  private listenToCart(uid: string) {
    this.cartRef = ref(this.db, `cart/${uid}`);
    onValue(this.cartRef, (snapshot) => {
      const data = snapshot.val();
      this.cartItems = data ? Object.values(data) : [];
      this.cartSubject.next(this.cartItems);
    });
  }

  getCart() {
    return this.cartSubject.asObservable();
  }

private calcularPrecioFinal(sneaker: Sneaker): number {
  if (sneaker.discount?.isActive && sneaker.discount.percentage > 0) {
    return sneaker.price * (1 - sneaker.discount.percentage / 100);
  }
  return sneaker.price;
}

addToCart(sneaker: Sneaker, size: string) {
  const user = this.auth.currentUser;
  if (!user) return;

  const tallaFormateada = size.replace('.', '_');
  const detalleCartId = `${sneaker.id}_${tallaFormateada}`;
  const existingItem = this.cartItems.find(item => item.detalleCartId === detalleCartId);

  const precioFinal = this.calcularPrecioFinal(sneaker);

  if (existingItem) {
    const itemRef = ref(this.db, `cart/${user.uid}/${detalleCartId}/cantidad`);
    set(itemRef, existingItem.cantidad + 1);
  } else {
    const newItem = {
      detalleCartId: detalleCartId,
      productId: sneaker.id,
      name: sneaker.name,
      brand: sneaker.brand,
      price: precioFinal,
      originalPrice: sneaker.price, 
      imageUrl: sneaker.imageUrl,
      tallaElegida: size,
      cantidad: 1
    };

    const itemRef = ref(this.db, `cart/${user.uid}/${detalleCartId}`);
    set(itemRef, newItem);
  }
}

  updateQuantity(detalleCartId: string, nuevaCantidad: number) {
    const user = this.auth.currentUser;
    if (user && nuevaCantidad > 0) {
      const itemRef = ref(this.db, `cart/${user.uid}/${detalleCartId}/cantidad`);
      set(itemRef, nuevaCantidad);
    }
  }

  removeFromCart(detalleCartId: string) {
    const user = this.auth.currentUser;
    if (user) {
      const itemRef = ref(this.db, `cart/${user.uid}/${detalleCartId}`);
      remove(itemRef);
    }
  }

  clearCart() {
    const user = this.auth.currentUser;
    if (user) {
      const userCartRef = ref(this.db, `cart/${user.uid}`);
      remove(userCartRef);
    }
  }

  getTotal(): number {
    return this.cartItems.reduce((acc, item) => acc + (item.price * item.cantidad), 0);
  }
}