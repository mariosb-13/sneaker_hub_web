import { Component } from '@angular/core';
import { NavbarComponent } from './components/navbar/navbar.component';
import { FooterComponent } from "./components/footer/footer.component";
import { AlertContainerComponent } from './components/shared/alert-container/alert-container.component';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router'; 
import { filter } from 'rxjs/operators'; 
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [NavbarComponent, FooterComponent, AlertContainerComponent, RouterOutlet, CommonModule], 
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'sneaker_hub_web';
  showLayout: boolean = true; // Variable para controlar la visibilidad

  constructor(private router: Router) {
    // Escuchamos los cambios de ruta
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      // Si la URL es login o signin, ocultamos el layout (nav y footer)
      const hiddenRoutes = ['/login', '/signin', '/admin'];
      // Verificamos si la URL actual incluye alguna de las rutas ocultas
      const currentUrl = event.urlAfterRedirects;
      
      // Si estamos en login o signin, showLayout será false
      this.showLayout = !hiddenRoutes.some(route => currentUrl.includes(route));
    });
  }
}