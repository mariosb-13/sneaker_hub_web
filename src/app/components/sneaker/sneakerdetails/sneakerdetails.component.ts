import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router'; 
import { SneakerService } from '../../../services/sneaker.service';
import { AuthService } from '../../../services/auth.service'; 
import { CartService } from '../../../services/cart.service';
import { Sneaker } from '../../../models/sneaker.model';

@Component({
  selector: 'app-sneakersdetails',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sneakerdetails.component.html',
  styleUrls: ['./sneakerdetails.component.scss']
})
export class SneakersdetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sneakerService = inject(SneakerService);
  private authService = inject(AuthService);
  private cartService = inject(CartService); 
  
  private platformId = inject(PLATFORM_ID); 

  sneaker: Sneaker | null = null; 
  selectedSize: string | null = null;
  
  availableSizes: string[] = [];
  currentImageIndex: number = 0;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadSneaker(id);
    }
  }

  async loadSneaker(id: string): Promise<void> {
    try {
      const data = await this.sneakerService.getSneakerById(id);
      if (data) {
        this.sneaker = data;
        
        if (this.sneaker && this.sneaker.sizes) {
          this.availableSizes = Object.keys(this.sneaker.sizes)
            .sort((a, b) => parseFloat(a.replace('_', '.')) - parseFloat(b.replace('_', '.')));
        }
      } else {
        console.error('Zapatilla no encontrada');
      }
    } catch (error) {
      console.error('Error al cargar la zapatilla:', error);
    }
  }

  formatSize(size: string): string {
    return size.replace('_', '.');
  }

  isOutOfStock(size: string): boolean {
    if (!this.sneaker || !this.sneaker.sizes) return true;
    return this.sneaker.sizes[size] <= 0;
  }

  selectSize(size: string): void {
    if (!this.isOutOfStock(size)) {
      this.selectedSize = size;
    }
  }

  addToCart(): void {
    if (this.authService.getCurrentUser()) {
      if (!this.selectedSize) {
        alert('Por favor, selecciona una talla antes de añadir al carrito.');
        return;
      }

      if (this.sneaker) {
        const stockDisponible = this.sneaker.sizes![this.selectedSize];
        if (stockDisponible <= 0) {
           alert('Lo sentimos, esta talla está agotada.');
           return;
        }

        this.cartService.addToCart(this.sneaker, this.selectedSize);
        this.router.navigate(['/carrito']);
      }
    } else {
      alert('¡Tienes que iniciar sesión para poder comprar!');
      this.router.navigate(['/signin']); 
    }
  }

  updateImageIndex(event: Event) {
    this.currentImageIndex = Number((event.target as HTMLInputElement).value);
  }
}