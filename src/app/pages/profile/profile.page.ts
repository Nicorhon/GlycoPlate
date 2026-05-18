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
  // Pull core structural metrics out of active user profile streams
  this.firebaseService.getUserProfileObservable().subscribe(profile => {
    if (profile) {
      // No more hardcoded default strings! It maps directly to what is in your database.
      this.userData = {
        email: profile.email,
        displayName: profile.displayName,
        condition: profile.condition,
        photoURL: profile.photoURL
      };
    }
  });

  this.firebaseService.getRecentMeals().subscribe(meals => {
    this.totalMealsTracked = meals ? meals.length : 0;
  });
}
// Add this method to your ProfilePage class under loadProfileData()

async onFileSelected(event: any) {
  const file = event.target.files[0];
  if (!file) return;

  // Convert image to Base64 data url for easy database management
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = async () => {
    const base64Image = reader.result as string;

    try {
      // 1. Instantly update UI locally so user experiences no lagging wait times
      if (this.userData) {
        this.userData.photoURL = base64Image;
      }

      // 2. Commit the new photo URL string into the user's Realtime DB profile node
      await this.firebaseService.updateProfilePicture(base64Image);
      alert('Profile picture updated successfully!');
    } catch (error) {
      console.error('Failed uploading photo:', error);
      alert('Could not sync profile image.');
    }
  };
}


  async signOut() {
    // Uses your existing logout() which navigates to /login
    await this.firebaseService.logout();
  }
}