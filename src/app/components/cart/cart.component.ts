import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { CartItem } from '../../models/cartItem.model';
import { PaymentService } from '../../services/payment.service';

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

  async checkout() {
    if (this.cartItems.length === 0) return;
    this.isProcessing = true;

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
      this.router.navigate(['/success']);
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