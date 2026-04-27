export interface Discount {
  percentage: number;
  isActive: boolean;
}

export interface Sneaker {
  id?: string;
  brand: string;
  model: string;
  gender: string;
  name: string;
  price: number;
  sizes: { [key: string]: number }; 
  isTrending: boolean;
  imageUrl: string;
  images360: string[];
  discount?: Discount;
}