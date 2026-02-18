import { Component, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-signin',
  imports: [RouterLink, FormsModule],
  templateUrl: './signin.component.html',
  styleUrl: './signin.component.scss'
})
export class SigninComponent {
  nombre: string = '';
  correo: string = '';
  telefono: string = '';
  password: string = '';
  passwordRepeat: string = '';

  private authService = inject(AuthService);
  private router = inject(Router);

async registrar() {
  try {
    await this.authService.registerUser(this.correo, this.password, this.nombre, this.telefono);
    this.router.navigate(['/home']);
  } catch (error: any) {
    alert('Error: ' + error.message);
  }
}

  async continuarConGoogle() {
    try {
      await this.authService.loginWithGoogle();
      this.router.navigate(['/home']);
    } catch (error) {
      console.error(error);
    }
  }
  
}