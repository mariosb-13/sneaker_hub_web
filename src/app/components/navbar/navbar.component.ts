import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Auth, authState, signOut } from '@angular/fire/auth';
import { Database, ref, onValue, get } from '@angular/fire/database'; 
import { map, switchMap, from, of, Observable } from 'rxjs'; 
import { CartService } from '../../services/cart.service';

interface Brand {
  name: string;
  route: string;
  icon?: string;
  iconHeight?: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit {
  private auth = inject(Auth);
  private router = inject(Router);
  private db = inject(Database); 
  private cartService = inject(CartService);

  isLoggedIn$ = authState(this.auth).pipe(map(user => !!user));
  
  isAdmin$ = authState(this.auth).pipe(
    switchMap(user => {
      if (!user) return of(false);
      const userRef = ref(this.db, `users/${user.uid}/rol`);
      return from(get(userRef)).pipe(
        map(snapshot => snapshot.exists() && snapshot.val() === 'admin')
      );
    })
  );

  // CORRECCIÓN: Usamos 'cantidad' para que coincida con la interfaz CartItem de Android
  cartCount$: Observable<number> = this.cartService.getCart().pipe(
    map(items => items.reduce((acc, item) => acc + item.cantidad, 0))
  );

  brands: Brand[] = [ { name: 'All', route: '/products/all' } ];

  ngOnInit() {
    this.cargarMarcas();
  }

  cargarMarcas() {
    const brandsRef = ref(this.db, 'brands');
    onValue(brandsRef, (snapshot) => {
      const data = snapshot.val();
      this.brands = [ { name: 'All', route: '/products/all' } ];
      if (data) {
        Object.values(data).forEach((brand: any) => {
          const nombreRuta = brand.name.toLowerCase().replace(/\s+/g, '-');
          this.brands.push({
            name: brand.name,
            route: `/products/${nombreRuta}`, 
            icon: brand.icon, 
            iconHeight: brand.iconHeight 
          });
        });
      }
    });
  }

  async logout() {
    await signOut(this.auth);
    this.router.navigate(['/signin']);
  }
}