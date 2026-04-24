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
import { MealData } from '../../models/meal.model'; 
import { Observable } from 'rxjs';

@Component({
  selector: 'app-history',
  templateUrl: './history.page.html',
  styleUrls: ['./history.page.scss'],
  standalone: true,
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent, IonRow, IonCol, IonIcon, IonSearchbar, IonList, IonItemSliding, IonItem, IonThumbnail, IonLabel, IonBadge, IonItemOptions, IonItemOption, IonSpinner]
})
export class HistoryPage implements OnInit {
  private firebaseService = inject(FirebaseService);
  meals$: Observable<MealData[]>; 
  today: number = Date.now(); 

  constructor() {
    addIcons({ calendar, restaurantOutline, timeOutline, trash });
    this.meals$ = this.firebaseService.getRecentMeals();
  }

  ngOnInit() {}

  async deleteMeal(id: string | undefined) {
    if (!id) return;
    try {
      await this.firebaseService.deleteMeal(id);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  }
}