import { Injectable, inject } from '@angular/core';
import { Database, ref, onValue, get, child } from '@angular/fire/database';
import { Observable } from 'rxjs';
import { Sneaker } from '../models/sneaker.model';

@Injectable({
  providedIn: 'root'
})
export class SneakerService {
  private db = inject(Database);

  getSneakers(): Observable<Sneaker[]> {
    const sneakersRef = ref(this.db, 'sneakers');
    
    return new Observable(observer => {
      onValue(sneakersRef, (snapshot) => {
        const data = snapshot.val();
        const sneakers: Sneaker[] = [];
        
        if (data) {
          Object.keys(data).forEach(key => {
            sneakers.push({ id: key, ...data[key] });
          });
        }
        observer.next(sneakers);
      });
    });
  }

  
// ... dentro de la clase SneakerService
async getSneakerById(id: string): Promise<Sneaker | null> {
  const dbRef = ref(this.db);
  const snapshot = await get(child(dbRef, `sneakers/${id}`));
  if (snapshot.exists()) {
    return { id, ...snapshot.val() } as Sneaker;
  }
  return null;
}
}