import { Routes } from '@angular/router';
import { AuthGuard, redirectLoggedInTo } from '@angular/fire/auth-guard';

import { LoginComponent } from './components/auth/login/login.component';
import { SigninComponent } from './components/auth/signin/signin.component';
import { HomeComponent } from './components/home/home.component';
import { SneakerlistComponent } from './components/sneaker/sneakerlist/sneakerlist.component';
import { SneakersdetailsComponent } from './components/sneaker/sneakerdetails/sneakerdetails.component';
import { ProfileComponent } from './components/profile/profile.component';
import { AdminComponent } from './components/admin/admin.component';
import { AdminDashboardComponent } from './components/admin/admin-dashboard/admin-dashboard.component';
import { AdminUsersComponent } from './components/admin/admin-users/admin-users.component';
import { AdminProductsComponent } from './components/admin/admin-products/admin-products.component';
import { AdminOrdersComponent } from './components/admin/admin-orders/admin-orders.component';

// Solo necesitamos redirigir a los que ya están logueados (para que no vuelvan a entrar al login)
const redirectLoggedInToHome = () => redirectLoggedInTo(['/home']);

export const routes: Routes = [
    { path: 'home', component: HomeComponent },
    { path: 'products/:category', component: SneakerlistComponent },
    { path: 'product/:id', component: SneakersdetailsComponent },
    { path: 'perfil', component: ProfileComponent },
    { 
      path: 'admin', 
      component: AdminComponent,
      children: [
        { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
        { path: 'dashboard', component: AdminDashboardComponent },
        { path: 'usuarios', component: AdminUsersComponent },
        { path: 'zapatillas', component: AdminProductsComponent },
        { path: 'pedidos', component: AdminOrdersComponent }
      ]
    },

    { path: 'login', component: LoginComponent, canActivate: [AuthGuard], data: { authGuardPipe: redirectLoggedInToHome } },
    { path: 'signin', component: SigninComponent, canActivate: [AuthGuard], data: { authGuardPipe: redirectLoggedInToHome } },
    
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: '**', redirectTo: '/home', pathMatch: 'full' }
];