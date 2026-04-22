import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, 
  IonContent, IonRow, IonCol, IonIcon, IonSearchbar, 
  IonList, IonItemSliding, IonItem, IonThumbnail, 
  IonLabel, IonBadge, IonItemOptions, IonItemOption, IonSpinner 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { calendar, restaurantOutline, timeOutline, trash } from 'ionicons/icons';
import { FirebaseService } from '../../services/firebase.service';
import { MealData } from '../../models/meal.model'; // IMPORT FROM MODELS
import { Observable } from 'rxjs';

@Component({
  selector: 'app-history',
  templateUrl: './history.page.html',
  styleUrls: ['./history.page.scss'],
  standalone: true,
  imports: [
    CommonModule, IonHeader, IonToolbar, IonTitle, IonButtons, 
    IonBackButton, IonContent, IonRow, IonCol, IonIcon, 
    IonSearchbar, IonList, IonItemSliding, IonItem, 
    IonThumbnail, IonLabel, IonBadge, IonItemOptions, 
    IonItemOption, IonSpinner
  ]
})
export class HistoryPage implements OnInit {
  private firebaseService = inject(FirebaseService);
  
  // Using the interface from our external model file
  meals$: Observable<MealData[]>; 
  today: number = Date.now(); 

  constructor() {
    addIcons({ calendar, restaurantOutline, timeOutline, trash });
    // Initialize the stream from our Firebase service
    this.meals$ = this.firebaseService.getRecentMeals();
  }

  ngOnInit() {}

  /**
   * Deletes a meal record from Firestore
   */
  async deleteMeal(id: string | undefined) {
    if (!id) {
      console.warn('Cannot delete: No ID provided');
      return;
    }
    
    try {
      console.log('Deleting meal ID:', id);
      // UNCOMMENTED: Now calls the service to actually delete the doc
      await this.firebaseService.deleteMeal(id);
    } catch (error) {
      console.error('Failed to delete meal:', error);
    }
  }
}