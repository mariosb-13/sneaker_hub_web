import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Database, ref, onValue, get, child, push, set, update, remove, list } from '@angular/fire/database';
import { map, Observable, of } from 'rxjs';
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

  addSneaker(sneaker: Sneaker) {
  const sneakersRef = ref(this.db, 'sneakers');
  const newSneakerRef = push(sneakersRef);
  return set(newSneakerRef, { ...sneaker, id: newSneakerRef.key });
}

updateSneaker(id: string, sneaker: Partial<Sneaker>) {
  const sneakerRef = ref(this.db, `sneakers/${id}`);
  return update(sneakerRef, sneaker);
}

deleteSneaker(id: string) {
  const sneakerRef = ref(this.db, `sneakers/${id}`);
  return remove(sneakerRef);
}

getBrands(): Observable<any[]> {
  const brandsRef = ref(this.db, 'brands');
  return list(brandsRef).pipe(
    map(changes => 
      changes.map(c => ({ 
        key: c.snapshot.key, 
        ...c.snapshot.val() 
      }))
    )
  );
}

addBrand(brand: any) {
  const brandKey = brand.name.toLowerCase().replace(/\s+/g, '_');
  const brandRef = ref(this.db, `brands/${brandKey}`);
  return set(brandRef, brand);
}
}