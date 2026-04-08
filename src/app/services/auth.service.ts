import { Injectable, inject } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword
} from '@angular/fire/auth';
import { Database, ref, set, get } from '@angular/fire/database';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private db = inject(Database);
  private firestore = inject(Firestore);

  // OBTENER USUARIO ACTUAL
  getCurrentUser() {
    return this.auth.currentUser;
  }

  // REGISTRO MANUAL
  async registerUser(email: string, pass: string, fullName: string, phone: string) {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, pass);
      const user = userCredential.user;
      const userRef = ref(this.db, `users/${user.uid}`);

      await set(userRef, {
        uid: user.uid,
        fullName: fullName,
        phone: phone,
        email: email,
        profileImageUrl: '',
        rol: 'cliente',
        fechaReg: new Date().toISOString(),
        address: { street: '', city: '', zipCode: '', country: '' }
      });

      this.sendWelcomeEmail(email, fullName).catch(err => 
        console.error('Error al encolar correo:', err)
      );

      return userCredential;
    } catch (error) {
      throw error;
    }
  }

  // INICIO DE SESIÓN MANUAL
  loginUser(email: string, pass: string) {
    return signInWithEmailAndPassword(this.auth, email, pass);
  }

  // INICIO DE SESIÓN CON GOOGLE
  async loginWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(this.auth, provider);
      const user = result.user;

      const userRef = ref(this.db, `users/${user.uid}`);
      const snapshot = await get(userRef);

      if (!snapshot.exists()) {
        const fullName = user.displayName || 'Usuario de Google';
        await set(userRef, {
          uid: user.uid,
          fullName: fullName,
          email: user.email,
          phone: '',
          profileImageUrl: '',
          rol: 'cliente',
          fechaReg: new Date().toISOString(),
          address: { street: '', city: '', zipCode: '', country: '' }
        });

        this.sendWelcomeEmail(user.email!, fullName).catch(err => 
          console.error('Error correo Google:', err)
        );
      }
      return result;
    } catch (error) {
      throw error;
    }
  }

  // MÉTODO PARA ENVIAR CORREO (CON LOGO Y URL DE RENDER)
  private async sendWelcomeEmail(userEmail: string, userName: string) {
    const mailCollection = collection(this.firestore, 'mail');
    const logoUrl = "https://firebasestorage.googleapis.com/v0/b/sneakerhub-3862d.firebasestorage.app/o/SneakerHub.png?alt=media&token=a42e0979-51b2-4a72-ad48-b8a9974ad37a";
    const webUrl = "https://sneaker-hub-web.onrender.com";

    const welcomeHtml = `
      <div style="background-color: #f4f4f4; padding: 40px 0; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e0e0e0;">
          <div style="padding: 40px 20px; text-align: center;">
            <img src="${logoUrl}" alt="SneakerHub" style="width: 200px; height: auto;">
          </div>
          <div style="padding: 0 40px 40px; text-align: center; color: #333333;">
            <h1 style="font-size: 26px; margin-bottom: 15px;">¡Bienvenido, ${userName}!</h1>
            <p style="font-size: 16px; line-height: 1.6; color: #555555;">Gracias por unirte a SneakerHub.</p>
            <div style="margin-top: 25px;">
              <a href="${webUrl}" style="background-color: #000000; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">IR A LA TIENDA</a>
            </div>
          </div>
        </div>
      </div>
    `;

    return addDoc(mailCollection, {
      to: userEmail,
      message: { subject: "¡Bienvenido a la familia SneakerHub! 🎉", html: welcomeHtml }
    });
  }

  async changeUserPassword(currentPassword: string, newPassword: string): Promise<void> {
    const currentUser = this.auth.currentUser;
    if (!currentUser || !currentUser.email) throw new Error('No hay usuario logueado');

    // Para cambiar la contraseña, Firebase exige re-autenticar al usuario por seguridad
    const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
    await reauthenticateWithCredential(currentUser, credential);
    await updatePassword(currentUser, newPassword);
  }

  // CERRAR SESIÓN
  logout() {
    return signOut(this.auth);
  }
}