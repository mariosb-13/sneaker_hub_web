export interface Sneaker {
    id: number;
    brand: string;
    model: string;
    colorway: string;
    price: number;
    image: string;
    isNew?: boolean;
}