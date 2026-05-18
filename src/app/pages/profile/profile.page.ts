import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { ToastController } from '@ionic/angular'; // 1. INJECT ToastController
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonCard, 
  IonButton, IonIcon, IonBadge, IonAvatar, IonList, 
  IonItem, IonLabel, IonGrid, IonRow, IonCol, IonButtons,
  IonInput, IonSelect, IonSelectOption 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  settingsOutline, cameraReverse, pulseOutline, nutritionOutline, 
  logOutOutline, bodyOutline, createOutline, saveOutline, closeOutline, personOutline 
} from 'ionicons/icons';
import { FirebaseService } from '../../services/firebase.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, 
    IonButton, IonIcon, IonBadge, IonAvatar, IonList, 
    IonItem, IonLabel, IonGrid, IonRow, IonCol, IonButtons,
    IonInput, IonSelect, IonSelectOption
  ]
})
export class ProfilePage implements OnInit {
  private firebaseService = inject(FirebaseService);
  private router = inject(Router);
  private toastCtrl = inject(ToastController); // 2. Bind to Component Context

  userData: any = null;
  totalMealsTracked: number = 0;

  isEditing = false;
  editData: any = {};

  constructor() {
    addIcons({ 
      settingsOutline, cameraReverse, pulseOutline, nutritionOutline, 
      logOutOutline, bodyOutline, createOutline, saveOutline, closeOutline, personOutline 
    });
  }

  ngOnInit() {
    this.loadProfileData();
  }

  loadProfileData() {
    this.firebaseService.getUserProfileObservable().subscribe(profile => {
      if (profile) {
        this.userData = {
          email: profile.email,
          displayName: profile.displayName,
          condition: profile.condition,
          photoURL: profile.photoURL,
          weight: profile.weight || null, 
          height: profile.height || null,
          age: profile.age || null
        };
      }
    });

    this.firebaseService.getRecentMeals().subscribe(meals => {
      this.totalMealsTracked = meals ? meals.length : 0;
    });
  }

  toggleEdit() {
    this.isEditing = true;
    this.editData = { ...this.userData }; 
  }

  cancelEdit() {
    this.isEditing = false;
    this.editData = {};
  }

  // 3. Helper utility to summon the updated, palette-accurate toast
  async presentSuccessToast(msg: string) {
    const toast = await this.toastCtrl.create({
      message: msg,
      duration: 2500,
      position: 'top',
      cssClass: 'glyco-profile-success-toast',
      mode: 'ios'
    });
    await toast.present();
  }

  // 4. Clean up alert calls within changes processing actions
  async saveProfileChanges() {
    if (!this.editData.displayName?.trim()) {
      return;
    }
    if (!this.editData.condition) {
      return;
    }

    try {
      await this.firebaseService.saveUserProfileData({
        displayName: this.editData.displayName,
        condition: this.editData.condition,
        weight: this.editData.weight ? Number(this.editData.weight) : null,
        height: this.editData.height ? Number(this.editData.height) : null,
        age: this.editData.age ? Number(this.editData.age) : null
      });

      this.isEditing = false;
      // Triggering aesthetic toast component overlay
      await this.presentSuccessToast('Profile updated successfully!');
    } catch (error: any) {
      console.error('Failed to update profile data parameters:', error);
    }
  }

  get bmi(): number {
    if (!this.userData?.weight || !this.userData?.height) return 0;
    const heightInMeters = this.userData.height / 100;
    return parseFloat((this.userData.weight / (heightInMeters * heightInMeters)).toFixed(1));
  }

  get bmiStatus(): string {
    const score = this.bmi;
    if (score === 0) return 'Unknown';
    if (score < 18.5) return 'Underweight';
    if (score < 24.9) return 'Normal Weight';
    if (score < 29.9) return 'Overweight';
    return 'Obese';
  }

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Image = reader.result as string;
      try {
        if (this.userData) this.userData.photoURL = base64Image;
        await this.firebaseService.updateProfilePicture(base64Image);
        // Swapped file picture upload alert confirmation for toast theme asset variant
        await this.presentSuccessToast('Profile picture updated successfully!');
      } catch (error) {
        console.error('Failed uploading photo:', error);
      }
    };
  }

  async signOut() {
    await this.firebaseService.logout();
  }
}