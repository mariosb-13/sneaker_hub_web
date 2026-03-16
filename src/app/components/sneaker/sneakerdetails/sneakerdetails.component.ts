import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router'; 
import { SneakerService } from '../../../services/sneaker.service';
import { AuthService } from '../../../services/auth.service'; 
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
  
  // Inyectamos el ID de la plataforma para saber si estamos en el Server o en el Browser
  private platformId = inject(PLATFORM_ID); 

  sneaker: Sneaker | null = null; 
  selectedSize: string | null = null;

  // --- Variables para el visor 360 ---
  currentImageIndex: number = 0;
  isDragging: boolean = false;
  startX: number = 0;

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.sneaker = await this.sneakerService.getSneakerById(id);

      // Precargar las 36 imágenes SOLO si estamos en el navegador
      if (this.sneaker && this.sneaker.images360) {
        if (isPlatformBrowser(this.platformId)) {
          this.sneaker.images360.forEach(url => {
            const img = new Image();
            img.src = url;
          });
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
      alert(`¡Añadido al carrito, ${usuario.email}! (Lógica de carrito pendiente)`);
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

    // Evitar que la pantalla haga scroll al arrastrar en móviles
    if (window.TouchEvent && event instanceof TouchEvent) {
      event.preventDefault(); 
    }

    const currentX = this.getClientX(event);
    const diff = currentX - this.startX;

    // Bajamos la sensibilidad a 8 para que gire más fluido
    if (Math.abs(diff) > 8) { 
      if (diff > 0) {
        // Arrastre hacia la derecha (gira a la izquierda)
        this.currentImageIndex = (this.currentImageIndex - 1 + this.sneaker.images360.length) % this.sneaker.images360.length;
      } else {
        // Arrastre hacia la izquierda (gira a la derecha)
        this.currentImageIndex = (this.currentImageIndex + 1) % this.sneaker.images360.length;
      }
      this.startX = currentX; // Actualizamos la posición inicial
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