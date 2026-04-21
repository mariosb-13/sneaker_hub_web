import { Routes } from '@angular/router';
import { AuthGuard, redirectLoggedInTo, redirectUnauthorizedTo } from '@angular/fire/auth-guard';

import { LoginComponent } from './components/auth/login/login.component';
import { SigninComponent } from './components/auth/signin/signin.component';
import { HomeComponent } from './components/home/home.component';
import { SneakerlistComponent } from './components/sneaker/sneakerlist/sneakerlist.component';
import { SneakersdetailsComponent } from './components/sneaker/sneakerdetails/sneakerdetails.component';
import { ProfileComponent } from './components/profile/profile.component';
import { CartComponent } from './components/cart/cart.component';
import { SuccessComponent } from './components/success/success.component';
import { OrdersComponent } from './components/orders/orders.component';
import { OrdersDetailsComponent } from './components/orders/orders-details/orders-details.component';
import { AdminComponent } from './components/admin/admin.component';
import { AdminDashboardComponent } from './components/admin/admin-dashboard/admin-dashboard.component';
import { AdminUsersComponent } from './components/admin/admin-users/admin-users.component';
import { AdminProductsComponent } from './components/admin/admin-products/admin-products.component';
import { AdminOrdersComponent } from './components/admin/admin-orders/admin-orders.component';

import { adminGuard } from './guards/admin.guard';
import { successGuard } from './guards/success.guard';
import { CancelComponent } from './components/cancel/cancel.component';
import { cancelGuard } from './guards/cancel.guard';
import { AdminStorageComponent } from './components/admin/admin-storage/admin-storage.component';

// Guardias de navegación de Firebase
const redirectLoggedInToHome = () => redirectLoggedInTo(['/home']);
const redirectUnauthorizedToLogin = () => redirectUnauthorizedTo(['/login']);

export const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'home', component: HomeComponent },
    
    // Productos y Categorías
    { path: 'products/:category', component: SneakerlistComponent },
    { path: 'product/:id', component: SneakersdetailsComponent },
    
    // Autenticación
    { 
      path: 'login', 
      component: LoginComponent, 
      canActivate: [AuthGuard], 
      data: { authGuardPipe: redirectLoggedInToHome } 
    },
    { 
      path: 'signin', 
      component: SigninComponent, 
      canActivate: [AuthGuard], 
      data: { authGuardPipe: redirectLoggedInToHome } 
    },
    
    // Rutas Protegidas de Usuario
    { 
      path: 'perfil', 
      component: ProfileComponent, 
      canActivate: [AuthGuard], 
      data: { authGuardPipe: redirectUnauthorizedToLogin } 
    },
    { 
      path: 'carrito', 
      component: CartComponent, 
      canActivate: [AuthGuard], 
      data: { authGuardPipe: redirectUnauthorizedToLogin } 
    },
    { 
      path: 'success', 
      component: SuccessComponent, 
      canActivate: [AuthGuard, successGuard], 
      data: { authGuardPipe: redirectUnauthorizedToLogin } 
    },
    { 
      path: 'cancel', 
      component: CancelComponent, 
      canActivate: [AuthGuard, cancelGuard], 
      data: { authGuardPipe: redirectUnauthorizedToLogin } 
    },
    { 
      path: 'mis-pedidos', 
      component: OrdersComponent, 
      canActivate: [AuthGuard], 
      data: { authGuardPipe: redirectUnauthorizedToLogin } 
    },
    
    // DETALLES DE PEDIDO 
    { 
      path: 'pedido/:id', 
      component: OrdersDetailsComponent, 
      canActivate: [AuthGuard], 
      data: { authGuardPipe: redirectUnauthorizedToLogin } 
    },
    { 
      path: 'admin', 
      component: AdminComponent,
      canActivate: [AuthGuard, adminGuard], 
      data: { authGuardPipe: redirectUnauthorizedToLogin },
      children: [
        { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
        { path: 'dashboard', component: AdminDashboardComponent },
        { path: 'usuarios', component: AdminUsersComponent },
        { path: 'zapatillas', component: AdminProductsComponent },
        { path: 'pedidos', component: AdminOrdersComponent },
        { path: 'storage', component: AdminStorageComponent }
      ]
    },

    // Comodín para rutas no encontradas
    { path: '**', redirectTo: '/home' }
];