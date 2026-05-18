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
  private profileSubscription: Subscription | undefined; // Added subscription tracker for health profiles

  // IoT Sensor Data
  currentWeight: number = 0; 
  idealPortion: number = 500; 

  // Tracking Data
  allMeals: any[] = [];
  displayGLTotal: number = 0; 
  currentFilter: 'daily' | 'weekly' | 'monthly' = 'daily';

  // Smart Thresholds base configuration metrics
  userCondition: string = 'General Health Tracking';
  dailyMaxGL: number = 100; // Base baseline value if no record exists

  constructor() {
    addIcons({ radioOutline, warning, fastFood, bulb, alertCircle });
  }

  ngOnInit() {
    this.loadUserProfileMetrics();
    this.listenToIoT();
    this.fetchMealHistory();
  }

  ngOnDestroy() {
    if (this.iotSubscription) this.iotSubscription.unsubscribe();
    if (this.historySubscription) this.historySubscription.unsubscribe();
    if (this.profileSubscription) this.profileSubscription.unsubscribe();
  }

  /**
   * Tracks active biometric conditions to scale thresholds intelligently
   */
  loadUserProfileMetrics() {
    this.profileSubscription = this.firebaseService.getUserProfileObservable().subscribe(profile => {
      if (profile) {
        this.userCondition = profile.condition || 'General Health Tracking';
        
        // Intelligent Threshold Assignment:
        // Diabetes management protocols require restrictive daily targets (approx 40-50 GL units total)
        if (this.userCondition.includes('Diabetes')) {
          this.dailyMaxGL = 45; 
        } else if (this.userCondition.includes('Prediabetes')) {
          this.dailyMaxGL = 60;
        } else {
          this.dailyMaxGL = 100; // General health tracker baseline
        }
        
        // Re-calculate the totals and limits based on newly bound rules
        this.applyFilter();
      }
    });
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
      startTime = new Date(now.setDate(now.getDate() - 7)).getTime();
    } else if (this.currentFilter === 'monthly') {
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

  // Dynamic Limit for Progress Bar (UPDATED: Integrates dynamic daily custom limits)
  get dynamicLimit(): number {
    if (this.currentFilter === 'weekly') return this.dailyMaxGL * 7; 
    if (this.currentFilter === 'monthly') return this.dailyMaxGL * 30;
    return this.dailyMaxGL; 
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

  // UPDATED: Now fires relative to their smart health condition configuration threshold
  async checkDailyLimit() {
    if (this.displayGLTotal >= this.dailyMaxGL) {
      const toast = await this.toastCtrl.create({
        message: `Daily GL limit (${this.dailyMaxGL}) reached for your profile tracking profile! Monitor your intake.`,
        duration: 3500,
        color: 'warning',
        position: 'top'
      });
      await toast.present();
    }
  }
}