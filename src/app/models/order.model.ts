import { SneakerCopy } from './sneakerCopy.model';

export interface Order {
  order_id?: string;
  order_date: number;
  status: string;
  total: number;
  purchased_sneakers: SneakerCopy[];
  
  address?: string;
  city?: string;
  zipCode?: string;
  door?: string;
  paymentMethod?: string;
}