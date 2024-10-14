import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideStorage, getStorage } from '@angular/fire/storage';


import { routes } from './app.routes';
import {provideHttpClient} from "@angular/common/http";
import {NgModel} from "@angular/forms";
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { environment } from '../environments/environment';

// @ts-ignore
export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes), provideHttpClient(), NgModel, provideAnimationsAsync(), provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideStorage(() => getStorage())]
};
