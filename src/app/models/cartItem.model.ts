export interface CartItem {
  detalleCartId: string; // Ej: "idProducto_42"
  productId: string;
  name: string;
  brand?: string;
  price: number;
  imageUrl: string;
  tallaElegida: string;
  cantidad: number;
}