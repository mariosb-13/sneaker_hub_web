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
  errorMessage: string = '';

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

  resetPassword(event: Event) {
    event.preventDefault();
    
    if (!this.correo) {
      this.errorMessage = 'Por favor, escribe tu correo arriba para enviarte el enlace de recuperación.';
      alert(this.errorMessage); 
      return;
    }

    this.authService.resetPassword(this.correo)
      .then(() => {
        this.errorMessage = ''; 
        alert('¡Correo de recuperación enviado! Revisa tu bandeja de entrada (y la carpeta de Spam).');
      })
      .catch((error: any) => {
        this.errorMessage = 'Error al enviar el correo. Verifica que la dirección esté bien escrita y registrada.';
        alert(this.errorMessage);
        console.error('Error reset password:', error);
      });
  }
}