import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Auth, updateProfile } from '@angular/fire/auth';
import { Database, ref, get, update } from '@angular/fire/database';
import { Storage, ref as storageRef, uploadBytes, getDownloadURL } from '@angular/fire/storage';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private auth = inject(Auth);
  private database = inject(Database);
  private storage = inject(Storage);

  activeTab: 'details' | 'address' | 'password' = 'details';

  user = {
    fullName: '',
    email: '',
    phone: '',
    profileImageUrl: '' 
  };

  address = {
    street: '',
    city: '',
    zipCode: '',
    door: '' 
  };

  passwords = {
    current: '',
    new: '',
    confirm: ''
  };

  passwordError = '';
  passwordSuccess = '';
  profileMessage = '';
  errorMessage = ''; 
  uploadingImage = false;

  ngOnInit() {
    this.auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        this.user.email = currentUser.email || '';
        const userRef = ref(this.database, `users/${currentUser.uid}`);
        const snapshot = await get(userRef);

        if (snapshot.exists()) {
          const data = snapshot.val();
          this.user.fullName = data.fullName || '';
          this.user.phone = data.phone || '';
          this.user.profileImageUrl = data.profileImageUrl || '';
          if (data.address) {
            this.address = { ...this.address, ...data.address };
          }
        }
      }
    });
  }

  validarSoloNumeros(campo: 'phone' | 'zipCode', valor: string) {
    const limpio = valor.replace(/\D/g, ''); 
    if (campo === 'phone') this.user.phone = limpio;
    if (campo === 'zipCode') this.address.zipCode = limpio;
  }

  async onFileSelected(event: any) {
    const file: File = event.target.files[0];
    const currentUser = this.auth.currentUser;

    if (!file || !currentUser) return;
    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Selecciona una imagen válida.';
      return;
    }

    this.uploadingImage = true;
    try {
      const filePath = `profile_pics/${currentUser.uid}`;
      const fileRef = storageRef(this.storage, filePath);
      await uploadBytes(fileRef, file);
      const downloadUrl = await getDownloadURL(fileRef);

      const userRef = ref(this.database, `users/${currentUser.uid}`);
      await update(userRef, { profileImageUrl: downloadUrl });
      await updateProfile(currentUser, { photoURL: downloadUrl });

      this.user.profileImageUrl = downloadUrl;
      this.profileMessage = 'Foto actualizada.';
    } catch (error) {
      this.errorMessage = 'Error al subir la imagen.';
    } finally {
      this.uploadingImage = false;
      setTimeout(() => { this.profileMessage = ''; this.errorMessage = ''; }, 3000);
    }
  }

  async saveProfile() {
    const currentUser = this.auth.currentUser;
    if (!currentUser) return;

    this.errorMessage = '';
    this.profileMessage = '';

    if (!this.user.fullName || !this.user.phone || 
        !this.address.street || !this.address.city || 
        !this.address.zipCode || !this.address.door) {
      this.errorMessage = 'Todos los campos son obligatorios.';
      return;
    }

    try {
      const userRef = ref(this.database, `users/${currentUser.uid}`);
      await update(userRef, {
        fullName: this.user.fullName,
        phone: this.user.phone,
        address: this.address
      });

      this.profileMessage = 'Datos guardados correctamente.';
      setTimeout(() => this.profileMessage = '', 3000);
    } catch (error) {
      this.errorMessage = 'Error al guardar.';
    }
  }

  changeTab(tab: 'details' | 'address' | 'password') {
    this.activeTab = tab;
    this.passwordError = '';
    this.passwordSuccess = '';
    this.profileMessage = '';
    this.errorMessage = '';
  }

  async updatePassword() {
    this.passwordError = '';
    this.passwordSuccess = '';
    if (!this.passwords.current || !this.passwords.new || !this.passwords.confirm) {
      this.passwordError = 'Rellena todos los campos.';
      return;
    }
    if (this.passwords.new !== this.passwords.confirm) {
      this.passwordError = 'Las contraseñas no coinciden.';
      return;
    }
    try {
      await this.authService.changeUserPassword(this.passwords.current, this.passwords.new);
      this.passwordSuccess = 'Contraseña actualizada.';
      this.passwords = { current: '', new: '', confirm: '' };
      setTimeout(() => this.changeTab('details'), 2000);
    } catch (error: any) {
      this.passwordError = 'Error al actualizar.';
    }
  }
}