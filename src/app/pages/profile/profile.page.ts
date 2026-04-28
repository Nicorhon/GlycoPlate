import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonCard, 
  IonButton, IonIcon, IonBadge, IonAvatar, IonList, 
  IonItem, IonLabel, IonGrid, IonRow, IonCol, IonButtons
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { settingsOutline, cameraReverse, pulseOutline, nutritionOutline, logOutOutline } from 'ionicons/icons';
import { FirebaseService } from '../../services/firebase.service';
import { Router } from '@angular/router';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [
    CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, 
    IonButton, IonIcon, IonBadge, IonAvatar, IonList, 
    IonItem, IonLabel, IonGrid, IonRow, IonCol, IonButtons
  ]
})
export class ProfilePage implements OnInit {
  private firebaseService = inject(FirebaseService);
  private router = inject(Router);

  // userData matches the 'profile' node in your signUp method
  userData: any = null;
  totalMealsTracked: number = 0;

  constructor() {
    addIcons({ settingsOutline, cameraReverse, pulseOutline, nutritionOutline, logOutOutline });
  }

  ngOnInit() {
    this.loadProfileData();
  }

  loadProfileData() {
    // 1. Get Profile Info from users/${uid}/profile
    this.firebaseService.user$.subscribe(user => {
      if (user) {
        // You might need to add a 'getProfile' method to your service 
        // Or access the data directly if you store it in the service
        this.userData = {
          email: user.email,
          displayName: user.displayName || 'GlycoPlate User',
          uid: user.uid
        };
      }
    });

    // 2. Use your existing getRecentMeals() from the service
    this.firebaseService.getRecentMeals().subscribe(meals => {
      this.totalMealsTracked = meals ? meals.length : 0;
    });
  }

  async signOut() {
    // Uses your existing logout() which navigates to /login
    await this.firebaseService.logout();
  }
}