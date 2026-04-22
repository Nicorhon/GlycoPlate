import { Component, inject } from '@angular/core'; // Added inject
import { Router } from '@angular/router'; // Added Router
import { IonApp, IonRouterOutlet, IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonFab, IonFabButton } from '@ionic/angular/standalone';
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
    IonRouterOutlet, 
    IonTabs, 
    IonTabBar, 
    IonTabButton, 
    IonIcon, 
    IonLabel, 
    IonFab, 
    IonFabButton
  ],
  templateUrl: 'app.component.html',
})
export class AppComponent {
  // Use the modern 'inject' method for Standalone components
  private router = inject(Router);

  constructor() {
    addIcons({ 
      statsChartOutline, 
      calendarOutline, 
      bulbOutline, 
      personOutline, 
      camera, 
      alertCircle 
    });
  }

  // The Navigation Function
  goToCamera() {
    console.log('Camera button clicked - navigating now...');
    this.router.navigate(['/camera']);
  }
}