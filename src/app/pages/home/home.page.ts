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
import { FirebaseService } from '../../services/firebase.service';
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

  // IoT Sensor Data
  currentWeight: number = 0; 
  idealPortion: number = 500; 

  // Tracking Data
  allMeals: any[] = [];
  displayGLTotal: number = 0; 
  currentFilter: 'daily' | 'weekly' | 'monthly' = 'daily';

  constructor() {
    addIcons({ radioOutline, warning, fastFood, bulb, alertCircle });
  }

  ngOnInit() {
    this.listenToIoT();
    this.fetchMealHistory();
  }

  ngOnDestroy() {
    if (this.iotSubscription) this.iotSubscription.unsubscribe();
    if (this.historySubscription) this.historySubscription.unsubscribe();
  }

  listenToIoT() {
    this.iotSubscription = this.firebaseService.getLivePlateData().subscribe(data => {
      if (data) {
        const total = (Number(data.scale1) || 0) + (Number(data.scale2) || 0) + (Number(data.scale3) || 0);
        this.currentWeight = Math.max(0, Number(total.toFixed(2)));
      }
    });
  }

  fetchMealHistory() {
    this.historySubscription = this.firebaseService.getRecentMeals().subscribe(meals => {
      this.allMeals = meals;
      this.applyFilter();
    });
  }

  // Logic to handle switching between Daily, Weekly, and Monthly
  applyFilter() {
    const now = new Date();
    let startTime = 0;

    if (this.currentFilter === 'daily') {
      startTime = new Date().setHours(0, 0, 0, 0);
    } else if (this.currentFilter === 'weekly') {
      // Last 7 days
      startTime = new Date(now.setDate(now.getDate() - 7)).getTime();
    } else if (this.currentFilter === 'monthly') {
      // Last 30 days
      startTime = new Date(now.setMonth(now.getMonth() - 1)).getTime();
    }

    this.displayGLTotal = this.allMeals
      .filter(meal => meal.timestamp >= startTime)
      .reduce((sum, meal) => sum + (meal.totalGL || 0), 0);

    this.displayGLTotal = Number(this.displayGLTotal.toFixed(1));
    
    if (this.currentFilter === 'daily') {
      this.checkDailyLimit();
    }
  }

  filterChange(event: any) {
    this.currentFilter = event.detail.value;
    this.applyFilter();
  }

  // Dynamic Limit for Progress Bar
  get dynamicLimit(): number {
    if (this.currentFilter === 'weekly') return 700; 
    if (this.currentFilter === 'monthly') return 3000;
    return 100; // Daily default
  }

  get progress(): number {
    return Math.min(1, this.displayGLTotal / this.dynamicLimit);
  }

  get weightStatus(): 'too-much' | 'ok' {
    return this.currentWeight > this.idealPortion ? 'too-much' : 'ok';
  }

  get weightDiff(): number {
    return Math.max(0, this.currentWeight - this.idealPortion);
  }

  async checkDailyLimit() {
    if (this.displayGLTotal >= 100) {
      const toast = await this.toastCtrl.create({
        message: 'Daily GL limit reached! Monitor your intake.',
        duration: 3000,
        color: 'warning',
        position: 'top'
      });
      await toast.present();
    }
  }
}