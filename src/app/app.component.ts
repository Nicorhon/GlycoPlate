import { Component, inject, OnInit } from '@angular/core'; // Added OnInit
import { Router } from '@angular/router';
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
// 1. Import Auth and Anonymous Sign-in
import { Auth, signInAnonymously } from '@angular/fire/auth';

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
export class AppComponent implements OnInit { // 2. Implement OnInit
  private router = inject(Router);
  // 3. Inject the Auth service
  private auth = inject(Auth);

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

  // 4. Trigger silent login on startup
  async ngOnInit() {
    try {
      await signInAnonymously(this.auth);
      console.log('Demo: Anonymous user signed in successfully.');
    } catch (error) {
      console.error('Auth failed for demo:', error);
    }
  }

  goToCamera() {
    console.log('Camera button clicked - navigating now...');
    this.router.navigate(['/camera']);
  }
}