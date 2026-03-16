import { Routes } from '@angular/router';
import { AuthGuard, redirectLoggedInTo } from '@angular/fire/auth-guard';

import { LoginComponent } from './components/auth/login/login.component';
import { SigninComponent } from './components/auth/signin/signin.component';
import { HomeComponent } from './components/home/home.component';
import { SneakerlistComponent } from './components/sneaker/sneakerlist/sneakerlist.component';
import { SneakersdetailsComponent } from './components/sneaker/sneakerdetails/sneakerdetails.component';

// Solo necesitamos redirigir a los que ya están logueados (para que no vuelvan a entrar al login)
const redirectLoggedInToHome = () => redirectLoggedInTo(['/home']);

export const routes: Routes = [
    { path: 'home', component: HomeComponent },
    { path: 'products/:category', component: SneakerlistComponent },
    { path: 'product/:id', component: SneakersdetailsComponent },

    { path: 'login', component: LoginComponent, canActivate: [AuthGuard], data: { authGuardPipe: redirectLoggedInToHome } },
    { path: 'signin', component: SigninComponent, canActivate: [AuthGuard], data: { authGuardPipe: redirectLoggedInToHome } },
    
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: '**', redirectTo: '/home', pathMatch: 'full' }
];