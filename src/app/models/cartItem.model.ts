export interface CartItem {
  detalleCartId: string;
  productId: string;
  name: string;
  brand?: string;
  price: number; 
  originalPrice?: number; 
  imageUrl: string;
  tallaElegida: string;
  cantidad: number;
}