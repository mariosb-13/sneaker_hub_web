import { Component, inject } from '@angular/core';
import { RouterLink, Router } from "@angular/router";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { AlertService } from '../../../services/alert.service';

@Component({
  selector: 'app-login',
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  correo: string = '';
  password: string = '';
  cargando: boolean = false;

  private authService = inject(AuthService);
  private alertService = inject(AlertService);
  private router = inject(Router);

  async iniciarSesion() {
    // Validar campos
    if (!this.correo || !this.password) {
      this.alertService.warning('Campos incompletos', 'Por favor, completa todos los campos requeridos.');
      return;
    }

    // Validar formato de correo básico
    if (!this.isValidEmail(this.correo)) {
      this.alertService.warning('Correo inválido', 'Por favor, ingresa un correo electrónico válido.');
      return;
    }

    this.cargando = true;

    try {
      await this.authService.loginUser(this.correo, this.password);
      this.alertService.success('Bienvenido', 'Sesión iniciada correctamente.');
      this.router.navigate(['/home']);
    } catch (error: any) {
      this.cargando = false;
      this.alertService.error('Acceso denegado', 'Las credenciales proporcionadas son incorrectas. Verifica tu correo y contraseña.');
      console.error('Error login:', error);
    }
  }

  async loginConGoogle() {
    this.cargando = true;
    try {
      await this.authService.loginWithGoogle();
      this.alertService.success('Bienvenido', 'Sesión iniciada correctamente con Google.');
      this.router.navigate(['/home']);
    } catch (error: any) {
      this.cargando = false;
      this.alertService.error('Error de autenticación', 'No fue posible completar el inicio de sesión con Google. Intenta de nuevo.');
      console.error('Error Google login:', error);
    }
  }

  resetPassword(event: Event) {
    event.preventDefault();
    
    if (!this.correo) {
      this.alertService.warning('Correo requerido', 'Por favor, ingresa tu correo electrónico para resetear tu contraseña.');
      return;
    }

    if (!this.isValidEmail(this.correo)) {
      this.alertService.warning('Correo inválido', 'Por favor, ingresa un correo electrónico válido.');
      return;
    }

    this.cargando = true;

    this.authService.resetPassword(this.correo)
      .then(() => {
        this.cargando = false;
        this.alertService.success('Correo enviado', 'Se ha enviado un enlace de recuperación. Revisa tu bandeja de entrada (incluyendo la carpeta de Spam).');
      })
      .catch((error: any) => {
        this.cargando = false;
        this.alertService.error('Error', 'No fue posible enviar el correo de recuperación. Verifica que el correo esté registrado.');
        console.error('Error reset password:', error);
      });
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}