import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, 
  IonContent, IonRow, IonCol, IonIcon, IonSearchbar, 
  IonList, IonItemSliding, IonItem, IonThumbnail, 
  IonLabel, IonBadge, IonItemOptions, IonItemOption, IonSpinner 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { calendar, restaurantOutline, timeOutline, trash, informationCircleOutline } from 'ionicons/icons';
import { FirebaseService } from '../../services/firebase.service';
import { MealData } from '../../models/meal.model'; 
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-history',
  templateUrl: './history.page.html',
  styleUrls: ['./history.page.scss'],
  standalone: true,
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent, IonRow, IonCol, IonIcon, IonSearchbar, IonList, IonItemSliding, IonItem, IonThumbnail, IonLabel, IonBadge, IonItemOptions, IonItemOption, IonSpinner]
})
export class HistoryPage implements OnInit {
  private firebaseService = inject(FirebaseService);
  
  // Search logic
  private searchTerm$ = new BehaviorSubject<string>('');
  meals$: Observable<MealData[]>; 
  today: number = Date.now(); 

  constructor() {
    addIcons({ calendar, restaurantOutline, timeOutline, trash, informationCircleOutline });
    
    // Combine search term with firebase data
    const rawMeals$ = this.firebaseService.getRecentMeals();
    this.meals$ = combineLatest([rawMeals$, this.searchTerm$]).pipe(
      map(([meals, term]) => {
        if (!term.trim()) return meals;
        return meals.filter(m => 
          m.items.some(item => item.label.toLowerCase().includes(term.toLowerCase()))
        );
      })
    );
  }

  ngOnInit() {}

  onSearch(event: any) {
    this.searchTerm$.next(event.detail.value || '');
  }

  async deleteMeal(id: string | undefined) {
    if (!id) return;
    try {
      await this.firebaseService.deleteMeal(id);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  }
}