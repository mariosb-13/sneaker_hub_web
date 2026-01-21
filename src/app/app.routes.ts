import { Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login/login.component';
import { SigninComponent } from './components/auth/signin/signin.component';
import { HomeComponent } from './components/home/home.component';
import { SneakerlistComponent } from './components/sneaker/sneakerlist/sneakerlist.component';
import { SneakersdetailsComponent } from './components/sneaker/sneakerdetails/sneakerdetails.component';

export const routes: Routes = [
    { path: 'home', component: HomeComponent },
    { path: 'login', component: LoginComponent },
    { path: 'signin', component: SigninComponent },
    
    { path: 'products/:category', component: SneakerlistComponent },
    { path: 'product/:id', component: SneakersdetailsComponent },

    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: '**', redirectTo: '/home', pathMatch: 'full' }
];