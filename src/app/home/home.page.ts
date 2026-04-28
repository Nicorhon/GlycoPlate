import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastController } from '@ionic/angular';
import { 
  IonHeader, IonToolbar, IonTitle, IonButtons, IonBadge, 
  IonContent, IonNote, IonIcon, IonCard, IonCardHeader, 
  IonCardSubtitle, IonCardTitle, IonCardContent, IonRow, 
  IonCol, IonProgressBar, IonChip, IonItem, IonSpinner, 
  IonSegment, IonSegmentButton, IonLabel 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { radioOutline, warning, fastFood, bulb, alertCircle } from 'ionicons/icons';

// 1. Import Firebase Service and Subscription
import { FirebaseService } from '../services/firebase.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule, IonHeader, IonToolbar, IonTitle, IonButtons, IonBadge, 
    IonContent, IonNote, IonIcon, IonCard, IonCardHeader, 
    IonCardSubtitle, IonCardTitle, IonCardContent, IonRow, 
    IonCol, IonProgressBar, IonChip, IonItem, IonSpinner, 
    IonSegment, IonSegmentButton, IonLabel
  ]
})
export class HomePage implements OnInit, OnDestroy {
  private firebaseService = inject(FirebaseService);
  private toastCtrl = inject(ToastController);
  
  private iotSubscription: Subscription | undefined;
  private historySubscription: Subscription | undefined;

  // IoT Sensor Data (Live from Database)
  currentWeight: number = 0; 
  
  // Daily Tracking Data (Calculated from History)
  dailyGLIntake: number = 0;   
  maxDailyLimit: number = 100; // GL daily limit is usually 100
  
  // Portion Control Logic (Threshold in grams)
  idealPortion: number = 500; 

  constructor() {
    addIcons({ radioOutline, warning, fastFood, bulb, alertCircle });
  }

  ngOnInit() {
    this.listenToIoT();
    this.calculateDailyTotal();
  }

  ngOnDestroy() {
    if (this.iotSubscription) this.iotSubscription.unsubscribe();
    if (this.historySubscription) this.historySubscription.unsubscribe();
  }

  // 2. Fetch live scale data from users/UID/scale_data
  listenToIoT() {
    this.iotSubscription = this.firebaseService.getLivePlateData().subscribe(data => {
      if (data) {
        // Summing scale1, scale2, and scale3 for total plate weight
        const total = (Number(data.scale1) || 0) + (Number(data.scale2) || 0) + (Number(data.scale3) || 0);
        this.currentWeight = Math.max(0, Number(total.toFixed(2)));
      }
    });
  }

  // 3. Fetch meal history and sum up GL for TODAY only
  calculateDailyTotal() {
    this.historySubscription = this.firebaseService.getRecentMeals().subscribe(meals => {
      const today = new Date().setHours(0, 0, 0, 0);
      
      this.dailyGLIntake = meals
        .filter(meal => meal.timestamp >= today)
        .reduce((sum, meal) => sum + (meal.totalGL || 0), 0);

      this.dailyGLIntake = Number(this.dailyGLIntake.toFixed(1));
      this.checkDailyLimit();
    });
  }

  // Status Getters
  get weightStatus(): 'too-much' | 'ok' {
    return this.currentWeight > this.idealPortion ? 'too-much' : 'ok';
  }

  get weightDiff(): number {
    return Math.max(0, this.currentWeight - this.idealPortion);
  }

  // Calculate Progress Bar (0.0 to 1.0)
  get progress(): number {
    return Math.min(1, this.dailyGLIntake / this.maxDailyLimit);
  }

  async checkDailyLimit() {
    if (this.dailyGLIntake >= this.maxDailyLimit) {
      const toast = await this.toastCtrl.create({
        message: 'Daily GL limit reached! Monitor your intake.',
        duration: 3000,
        color: 'warning',
        position: 'top'
      });
      await toast.present();
    }
  }
  // inside home.page.ts class
filterChange(event: any) {
  const value = event.detail.value;
  console.log('Filter changed to:', value);
  // You can use this later to switch between Daily/Weekly views
}
}