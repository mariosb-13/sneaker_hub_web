import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Auth, authState, signOut } from '@angular/fire/auth';
import { Database, ref, onValue, get } from '@angular/fire/database'; 
// Imports de RxJS para encadenar la búsqueda del rol
import { map, switchMap, from, of } from 'rxjs'; 

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
  styleUrl: './navbar.component.scss' // Asegúrate de que cuadra con tu archivo de estilos
})
export class NavbarComponent implements OnInit {
  private auth = inject(Auth);
  private router = inject(Router);
  private db = inject(Database); 

  // Saber si hay alguien logueado (Devuelve true o false)
  isLoggedIn$ = authState(this.auth).pipe(map(user => !!user));
  
  //  Saber si es Admin mirando en la BD
  isAdmin$ = authState(this.auth).pipe(
    switchMap(user => {
      // Si no hay usuario logueado, devolvemos false directamente
      if (!user) return of(false);
      
      // Si hay usuario, cogemos su UID y buscamos su campo 'rol' en la base de datos
      const userRef = ref(this.db, `users/${user.uid}/rol`);
      
      // Convertimos la promesa de Firebase en un Observable y comprobamos si es "admin"
      return from(get(userRef)).pipe(
        map(snapshot => snapshot.exists() && snapshot.val() === 'admin')
      );
    })
  );

  // Array inicial que siempre tiene el botón "All"
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
          
          // Convertimos a minúsculas y cambiamos espacios por guiones (New Balance -> new-balance)
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