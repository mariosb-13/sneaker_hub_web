import { Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login/login.component';
import { SigninComponent } from './components/auth/signin/signin.component';
import { HomeComponent } from './components/home/home.component';

export const routes: Routes = [
    {path:'login',component:LoginComponent},
    {path:'signin',component:SigninComponent},
    {path:'home',component:HomeComponent},
    {path:'', redirectTo:'/home', pathMatch:'full'},
    {path:'**', redirectTo:'/home', pathMatch:'full'}
];
