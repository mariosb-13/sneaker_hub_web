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

  // Objeto de usuario sincronizado con tu Realtime Database
  user = {
    fullName: '',
    email: '',
    phone: '',
    profileImageUrl: '' 
  };

  address = {
    street: '',
    city: '',
    zipCode: ''
  };

  passwords = {
    current: '',
    new: '',
    confirm: ''
  };

  passwordError = '';
  passwordSuccess = '';
  profileMessage = '';
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
          
          if (data.address) {
            this.address = data.address;
          }

          // Cargamos solo la foto de la base de datos (ignora la de Google)
          this.user.profileImageUrl = data.profileImageUrl || '';
          
        } else {
          this.user.profileImageUrl = '';
        }
      }
    });
  }

  async onFileSelected(event: any) {
    const file: File = event.target.files[0];
    const currentUser = this.auth.currentUser;

    if (!file || !currentUser) return;

    if (!file.type.startsWith('image/')) {
      this.profileMessage = 'Por favor, selecciona un archivo de imagen válido.';
      return;
    }

    this.uploadingImage = true;
    this.profileMessage = 'Subiendo imagen...';

    try {
      // Ruta actualizada a tu carpeta "profile_pics" en Storage
      const filePath = `profile_pics/${currentUser.uid}`;
      const fileRef = storageRef(this.storage, filePath);

      // Subida del archivo
      await uploadBytes(fileRef, file);
      
      // Obtención de la URL de descarga
      const downloadUrl = await getDownloadURL(fileRef);

      // Actualización en Realtime Database
      const userRef = ref(this.database, `users/${currentUser.uid}`);
      await update(userRef, { profileImageUrl: downloadUrl });

      // Actualización opcional del perfil de Auth para persistencia
      await updateProfile(currentUser, { photoURL: downloadUrl });

      this.user.profileImageUrl = downloadUrl;
      this.profileMessage = 'Foto de perfil actualizada correctamente.';
      
    } catch (error) {
      console.error('Error al subir la imagen:', error);
      this.profileMessage = 'Hubo un error al subir la imagen.';
    } finally {
      this.uploadingImage = false;
      setTimeout(() => this.profileMessage = '', 3000);
    }
  }

  async saveProfile() {
    const currentUser = this.auth.currentUser;
    if (!currentUser) return;

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
      console.error('Error al guardar el perfil:', error);
      this.profileMessage = 'Error al guardar los datos.';
    }
  }

  changeTab(tab: 'details' | 'address' | 'password') {
    this.activeTab = tab;
    this.passwordError = '';
    this.passwordSuccess = '';
    this.profileMessage = '';
  }

  async updatePassword() {
    this.passwordError = '';
    this.passwordSuccess = '';

    if (!this.passwords.current || !this.passwords.new || !this.passwords.confirm) {
      this.passwordError = 'Por favor, rellena todos los campos.';
      return;
    }
    if (this.passwords.new !== this.passwords.confirm) {
      this.passwordError = 'Las contraseñas nuevas no coinciden.';
      return;
    }
    if (this.passwords.new.length < 6) {
      this.passwordError = 'La nueva contraseña debe tener al menos 6 caracteres.';
      return;
    }

    try {
      await this.authService.changeUserPassword(this.passwords.current, this.passwords.new);
      
      this.passwordSuccess = 'Contraseña actualizada con éxito.';
      this.passwords = { current: '', new: '', confirm: '' };
      
      setTimeout(() => {
        this.changeTab('details');
      }, 2000);

    } catch (error: any) {
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        this.passwordError = 'La contraseña actual es incorrecta.';
      } else {
        this.passwordError = 'Error al actualizar la contraseña.';
        console.error(error);
      }
    }
  }
}