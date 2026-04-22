import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastController } from '@ionic/angular';

// 1. Import Standalone Components
import { 
  IonHeader, IonToolbar, IonTitle, IonButtons, IonBadge, 
  IonContent, IonNote, IonIcon, IonCard, IonCardHeader, 
  IonCardSubtitle, IonCardTitle, IonCardContent, IonRow, 
  IonCol, IonProgressBar, IonChip, IonItem, IonSpinner, 
  IonSegment, IonSegmentButton, IonLabel 
} from '@ionic/angular/standalone';

// 2. Import Icons specifically for Standalone mode
import { addIcons } from 'ionicons';
import { 
  radioOutline, 
  warning, 
  fastFood, 
  bulb, 
  alertCircle 
} from 'ionicons/icons';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonBadge, 
    IonContent, IonNote, IonIcon, IonCard, IonCardHeader, 
    IonCardSubtitle, IonCardTitle, IonCardContent, IonRow, 
    IonCol, IonProgressBar, IonChip, IonItem, IonSpinner, 
    IonSegment, IonSegmentButton, IonLabel
  ]
})
export class HomePage implements OnInit {
  // IoT Sensor Data (Simulated)
  currentWeight: number = 420; 
  
  // Daily Tracking Data
  dailyIntake: number = 1850;   
  maxDailyLimit: number = 2000; 
  
  // Portion Control Logic (Threshold)
  idealPortion: number = 350; 

  constructor(private toastCtrl: ToastController) {
    /** * 3. Register Icons
     * This ensures icons appear correctly on the live Firebase site
     **/
    addIcons({ 
      radioOutline, 
      warning, 
      fastFood, 
      bulb, 
      alertCircle 
    });
  }

  ngOnInit() {
    this.checkDailyLimit();
  }

  // Getter to check if weight exceeds the limit in the UI
  get weightStatus(): 'too-much' | 'ok' {
    return this.currentWeight > this.idealPortion ? 'too-much' : 'ok';
  }

  // Getter to calculate how much to remove
  get weightDiff(): number {
    return Math.max(0, this.currentWeight - this.idealPortion);
  }

  async checkDailyLimit() {
    if (this.dailyIntake >= this.maxDailyLimit) {
      const toast = await this.toastCtrl.create({
        message: 'Daily intake limit reached! Avoid further heavy meals.',
        duration: 3000,
        color: 'danger',
        position: 'top',
        buttons: [{ text: 'OK', role: 'cancel' }]
      });
      await toast.present();
    }
  }

  filterChange(event: any) {
    const filter = event.detail.value;
    console.log('Filter changed to:', filter);
    // Future integration: fetch filtered data from Firebase Firestore
  }
}