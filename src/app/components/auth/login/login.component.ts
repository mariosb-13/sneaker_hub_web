import { Component, inject } from '@angular/core';
import { RouterLink, Router } from "@angular/router";
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [RouterLink, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  correo: string = '';
  password: string = '';

  private authService = inject(AuthService);
  private router = inject(Router);

  async iniciarSesion() {
    try {
      await this.authService.loginUser(this.correo, this.password);
      this.router.navigate(['/home']);
    } catch (error: any) {
      alert('Credenciales incorrectas');
    }
  }

  async loginConGoogle() {
    try {
      await this.authService.loginWithGoogle();
      this.router.navigate(['/home']);
    } catch (error) {
      console.error(error);
    }
  }
}