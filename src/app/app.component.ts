import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  statsChartOutline, 
  calendarOutline, 
  bulbOutline, 
  personOutline, 
  camera, 
  alertCircle 
} from 'ionicons/icons';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    IonApp, 
    IonRouterOutlet
  ],
  templateUrl: 'app.component.html',
})
export class AppComponent {
  constructor() {
    // Icons are registered once here so they work everywhere in the app
    addIcons({ 
      statsChartOutline, 
      calendarOutline, 
      bulbOutline, 
      personOutline, 
      camera, 
      alertCircle 
    });
  }
}