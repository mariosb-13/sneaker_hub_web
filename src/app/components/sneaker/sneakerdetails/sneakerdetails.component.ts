import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router'; 
import { SneakerService } from '../../../services/sneaker.service';
import { AuthService } from '../../../services/auth.service'; 
import { CartService } from '../../../services/cart.service'; // Inyectamos el cerebro del carrito
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
  
  // Array limpio solo con las tallas disponibles 
  availableSizes: string[] = [];

  // --- Variables para el visor 360 ---
  currentImageIndex: number = 0;
  isDragging: boolean = false;
  startX: number = 0;

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      if (isPlatformBrowser(this.platformId)) {
        this.sneaker = await this.sneakerService.getSneakerById(id);

        if (this.sneaker) {
          // Procesar el objeto de tallas para filtrar las que no tienen stock
          if (this.sneaker.sizes) {
            this.availableSizes = Object.keys(this.sneaker.sizes)
              .filter(key => this.sneaker!.sizes[key] > 0)
              .map(key => key.replace('_', '.'));
              
            this.availableSizes.sort((a, b) => parseFloat(a) - parseFloat(b));
          }

          // Precargar las 36 imágenes para el visor
          if (this.sneaker.images360) {
            this.sneaker.images360.forEach(url => {
              const img = new Image();
              img.src = url;
            });
          }
        }
      }
    }
  }

  selectSize(size: string) {
    this.selectedSize = size;
  }

  comprarZapatilla() {
    const usuario = this.authService.getCurrentUser(); 

    if (usuario) {
      // Si hay usuario, zapatilla y talla, lo mandamos al carrito
      if (this.sneaker && this.selectedSize) {
        this.cartService.addToCart(this.sneaker, this.selectedSize);
        // Te redirijo al carrito para que veas tu diseño en acción
        this.router.navigate(['/carrito']);
      }
    } else {
      alert('¡Tienes que iniciar sesión para poder comprar!');
      this.router.navigate(['/signin']); 
    }
  }

  // --- Lógica del Visor 360 ---
  onDragStart(event: MouseEvent | TouchEvent) {
    this.isDragging = true;
    this.startX = this.getClientX(event);
  }

  onDragMove(event: MouseEvent | TouchEvent) {
    if (!this.isDragging || !this.sneaker?.images360 || this.sneaker.images360.length === 0) return;

    if (window.TouchEvent && event instanceof TouchEvent) {
      event.preventDefault(); 
    }

    const currentX = this.getClientX(event);
    const diff = currentX - this.startX;

    if (Math.abs(diff) > 8) { 
      if (diff > 0) {
        this.currentImageIndex = (this.currentImageIndex - 1 + this.sneaker.images360.length) % this.sneaker.images360.length;
      } else {
        this.currentImageIndex = (this.currentImageIndex + 1) % this.sneaker.images360.length;
      }
      this.startX = currentX; 
    }
  }

  onDragEnd() {
    this.isDragging = false;
  }

  onSliderChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.currentImageIndex = parseInt(target.value, 10);
  }

  private getClientX(event: MouseEvent | TouchEvent): number {
    return 'touches' in event ? event.touches[0].clientX : (event as MouseEvent).clientX;
  }
}