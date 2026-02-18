import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getDatabase, provideDatabase } from '@angular/fire/database';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes), 
    provideClientHydration(withEventReplay()), 
    provideFirebaseApp(() => initializeApp({ 
      projectId: "sneakerhub-3862d", 
      appId: "1:161400644046:web:cde4ab955fb4b66ba10b9f", 
      databaseURL: "https://sneakerhub-3862d-default-rtdb.firebaseio.com", 
      storageBucket: "sneakerhub-3862d.firebasestorage.app", 
      apiKey: "AIzaSyBy_YOW6m7lMKM4Rb4hRnrVkHO8A7oFIHk", 
      authDomain: "sneakerhub-3862d.firebaseapp.com", 
      messagingSenderId: "161400644046", 
      measurementId: "G-YGX8D3GP8E"
      // Fíjate que aquí hemos quitado el projectNumber y la version
    })), 
    provideAuth(() => getAuth()), 
    provideDatabase(() => getDatabase())
  ]
};