import { Routes } from '@angular/router';
import { AuthGuard, redirectUnauthorizedTo, redirectLoggedInTo } from '@angular/fire/auth-guard';

import { LoginComponent } from './components/auth/login/login.component';
import { SigninComponent } from './components/auth/signin/signin.component';
import { HomeComponent } from './components/home/home.component';
import { SneakerlistComponent } from './components/sneaker/sneakerlist/sneakerlist.component';
import { SneakersdetailsComponent } from './components/sneaker/sneakerdetails/sneakerdetails.component';

const redirectUnauthorizedToSignin = () => redirectUnauthorizedTo(['/signin']);
const redirectLoggedInToHome = () => redirectLoggedInTo(['/home']);

export const routes: Routes = [
    { path: 'home', component: HomeComponent, canActivate: [AuthGuard], data: { authGuardPipe: redirectUnauthorizedToSignin } },
    { path: 'login', component: LoginComponent, canActivate: [AuthGuard], data: { authGuardPipe: redirectLoggedInToHome } },
    { path: 'signin', component: SigninComponent, canActivate: [AuthGuard], data: { authGuardPipe: redirectLoggedInToHome } },
    
    // Fíjate bien en estos dos:
    { path: 'products/:category', component: SneakerlistComponent, canActivate: [AuthGuard], data: { authGuardPipe: redirectUnauthorizedToSignin } },
    { path: 'product/:id', component: SneakersdetailsComponent, canActivate: [AuthGuard], data: { authGuardPipe: redirectUnauthorizedToSignin } },

    { path: '', redirectTo: '/signin', pathMatch: 'full' },
    { path: '**', redirectTo: '/signin', pathMatch: 'full' }
];