import { Component, inject, NgZone } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { AlertService } from '../../../services/alert.service';

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule],
  templateUrl: './signin.component.html',
  styleUrl: './signin.component.scss'
})
export class SigninComponent {
  nombre: string = '';
  correo: string = '';
  telefono: string = '';
  password: string = '';
  passwordRepeat: string = '';
  
  cargando: boolean = false;

  private authService = inject(AuthService);
  private alertService = inject(AlertService);
  private router = inject(Router);
  private zone = inject(NgZone);

  async registrar() {
    // 1. Validaciones básicas
    if (!this.nombre || !this.correo || !this.password || !this.passwordRepeat) {
      this.alertService.warning('Campos incompletos', 'Por favor, completa todos los campos obligatorios.');
      return;
    }

    // 2. Validar nombre
    if (this.nombre.length < 2) {
      this.alertService.warning('Nombre inválido', 'El nombre debe tener al menos 2 caracteres.');
      return;
    }

    // 3. Validar formato de correo
    if (!this.isValidEmail(this.correo)) {
      this.alertService.warning('Correo inválido', 'Por favor, ingresa un correo electrónico válido.');
      return;
    }

    // 4. Validar longitud de contraseña
    if (this.password.length < 6) {
      this.alertService.warning('Contraseña débil', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    // 5. Validar coincidencia de contraseñas
    if (this.password !== this.passwordRepeat) {
      this.alertService.warning('Contraseñas no coinciden', 'Las contraseñas ingresadas no son iguales.');
      return;
    }

    this.cargando = true;

    try {
      // 6. Ejecutar registro
      await this.authService.registerUser(this.correo, this.password, this.nombre, this.telefono);
      
      console.log('Registro completado con éxito');
      this.alertService.success('Bienvenido', 'Tu cuenta ha sido creada exitosamente.');

      // 7. Redirección forzada dentro de la zona de Angular
      this.zone.run(() => {
        this.router.navigate(['/home']).then(() => {
          console.log('Navegado a Home correctamente');
        });
      });

    } catch (error: any) {
      this.cargando = false;
      const errorMsg = this.getErrorMessage(error);
      this.alertService.error('Error en el registro', errorMsg);
      console.error('Error en el registro:', error);
    }
  }

  async continuarConGoogle() {
    this.cargando = true;
    try {
      await this.authService.loginWithGoogle();
      this.alertService.success('Bienvenido', 'Tu cuenta ha sido creada exitosamente con Google.');
      
      this.zone.run(() => {
        this.router.navigate(['/home']);
      });
      
    } catch (error: any) {
      this.cargando = false;
      this.alertService.error('Error de autenticación', 'No fue posible completar el registro con Google. Intenta de nuevo.');
      console.error('Error Google:', error);
    }
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private getErrorMessage(error: any): string {
    if (error.message?.includes('email-already-in-use')) {
      return 'Este correo ya está registrado. Por favor, inicia sesión o usa otro correo.';
    }
    if (error.message?.includes('weak-password')) {
      return 'La contraseña es muy débil. Utiliza una combinación de letras, números y símbolos.';
    }
    if (error.message?.includes('invalid-email')) {
      return 'El formato del correo electrónico no es válido.';
    }
    return error.message || 'No fue posible completar el registro. Intenta de nuevo.';
  }
}