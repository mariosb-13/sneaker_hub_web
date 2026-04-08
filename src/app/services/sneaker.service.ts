import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Database, ref, onValue, get, child } from '@angular/fire/database';
import { Observable, of } from 'rxjs';
import { Sneaker } from '../models/sneaker.model';

@Injectable({
  providedIn: 'root'
})
export class SneakerService {
  private db = inject(Database);
  private platformId = inject(PLATFORM_ID);

  getSneakers(): Observable<Sneaker[]> {
    if (!isPlatformBrowser(this.platformId)) {
      return of([]); 
    }

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

  async getSneakerById(id: string): Promise<Sneaker | null> {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    const dbRef = ref(this.db);
    const snapshot = await get(child(dbRef, `sneakers/${id}`));
    if (snapshot.exists()) {
      return { id, ...snapshot.val() } as Sneaker;
    }
    return null;
  }
}