import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { defineCustomElements } from '@ionic/pwa-elements/loader'; // <--- Add this

// Call the loader before bootstrapping
defineCustomElements(window);

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));