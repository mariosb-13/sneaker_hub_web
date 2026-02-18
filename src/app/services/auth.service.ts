import { Injectable, inject } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut } from '@angular/fire/auth';
import { Database, ref, set } from '@angular/fire/database'; // Necesarios para guardar datos

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private db = inject(Database);

  async registerUser(email: string, pass: string, nombre: string, telefono: string) {
    // 1. Crea el usuario en Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(this.auth, email, pass);
    const user = userCredential.user;

    // Esto cumple con tu entidad "Usuario Base" y "Cliente"
    const userRef = ref(this.db, `users/${user.uid}`);
    
    return set(userRef, {
      nombre: nombre,
      telefono: telefono,
      email: email,
      fechaReg: new Date().toISOString(),
      rol: 'cliente' // Por defecto son clientes según tu ER
    });
  }

  loginUser(email: string, pass: string) {
    return signInWithEmailAndPassword(this.auth, email, pass);
  }

  loginWithGoogle() {
    return signInWithPopup(this.auth, new GoogleAuthProvider());
  }

  logout() {
    return signOut(this.auth);
  }
}