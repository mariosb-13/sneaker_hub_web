import { Component, inject, NgZone } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';

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
  private router = inject(Router);
  private zone = inject(NgZone);

  async registrar() {
    // 1. Validaciones básicas
    if (!this.nombre || !this.correo || !this.password) {
      alert('Rellena los campos obligatorios, fiera');
      return;
    }

    if (this.password !== this.passwordRepeat) {
      alert('Las contraseñas no coinciden');
      return;
    }

    this.cargando = true;

    try {
      // 2. Ejecutar registro
      await this.authService.registerUser(this.correo, this.password, this.nombre, this.telefono);
      
      console.log('Registro completado con éxito');

      // 3. Redirección forzada dentro de la zona de Angular
      this.zone.run(() => {
        this.router.navigate(['/home']).then(() => {
          console.log('Navegado a Home correctamente');
        });
      });

    } catch (error: any) {
      this.cargando = false;
      console.error('Error en el registro:', error);
      alert('Error al registrar: ' + error.message);
    }
  }

  async continuarConGoogle() {
    this.cargando = true;
    try {
      await this.authService.loginWithGoogle();
      
      this.zone.run(() => {
        this.router.navigate(['/home']);
      });
      
    } catch (error: any) {
      this.cargando = false;
      console.error('Error Google:', error);
      alert('Error con Google: ' + error.message);
    }
  }
}