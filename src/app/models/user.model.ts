export interface Address {
  street: string;
  city: string;
  zipCode: string;
  door?: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  fullName: string; 
  phone: string;    
  fechaReg: string;
  rol: 'cliente' | 'admin';
  profileImageUrl?: string;
  address?: Address; 
}