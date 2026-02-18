export interface UserProfile {
  uid: string;
  email: string | null;
  nombre: string;
  telefono: string;
  fechaReg: string;
  rol: 'cliente' | 'admin';
}