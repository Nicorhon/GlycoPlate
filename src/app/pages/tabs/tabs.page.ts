import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router'; // Added RouterLinkActive for UI feedback
import { 
  IonTabs, 
  IonTabBar, 
  IonTabButton, 
  IonIcon, 
  IonLabel, 
  IonFab, 
  IonFabButton,
  IonRouterOutlet 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons'; // Required for icons to show
import { statsChartOutline, calendarOutline, bulbOutline, personOutline, camera } from 'ionicons/icons';

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [
    IonTabs, 
    IonTabBar, 
    IonTabButton, 
    IonIcon, 
    IonLabel, 
    IonFab, 
    IonFabButton,
    IonRouterOutlet,
    RouterLink,
    RouterLinkActive
  ],
  template: `
    <ion-tabs>
      <ion-tab-bar slot="bottom">
        
        <ion-tab-button tab="home" routerLink="/tabs/home" routerLinkActive="active-link">
          <ion-icon name="stats-chart-outline"></ion-icon>
          <ion-label>Dashboard</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="history" routerLink="/tabs/history" routerLinkActive="active-link">
          <ion-icon name="calendar-outline"></ion-icon>
          <ion-label>History</ion-label>
        </ion-tab-button>

        <div style="width: 70px; pointer-events: none;"></div>

        <ion-tab-button tab="suggestions" routerLink="/tabs/suggestions">
          <ion-icon name="bulb-outline"></ion-icon>
          <ion-label>Suggestions</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="profile" routerLink="/tabs/profile">
          <ion-icon name="person-outline"></ion-icon>
          <ion-label>Profile</ion-label>
        </ion-tab-button>
      </ion-tab-bar>

      <ion-fab vertical="bottom" horizontal="center" slot="fixed" style="margin-bottom: 5px;">
        <ion-fab-button (click)="goToCamera()" color="primary">
          <ion-icon name="camera"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-tabs>
  `
})
export class TabsPage {
  private router = inject(Router);

  constructor() {
    // 4. Register the icons used in the template
    addIcons({ 
      statsChartOutline, 
      calendarOutline, 
      bulbOutline, 
      personOutline, 
      camera 
    });
  }

  goToCamera() { 
    this.router.navigate(['/camera']); 
  }
}