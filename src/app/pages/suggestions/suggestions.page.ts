import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonCard, 
  IonCardHeader, IonCardSubtitle, IonCardTitle, 
  IonButton, IonIcon, IonBadge, IonList, IonItem, IonLabel, 
  IonModal, IonButtons, IonText,
  IonRow, IonCol, IonChip, IonNote // Added IonNote to fix NG8001
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { leafOutline, restaurantOutline, flameOutline, closeOutline, timeOutline } from 'ionicons/icons';
import { FirebaseService } from '../../services/firebase.service';

@Component({
  selector: 'app-suggestions',
  templateUrl: './suggestions.page.html',
  styleUrls: ['./suggestions.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    IonHeader, IonToolbar, IonTitle, IonContent, IonCard, 
    IonCardHeader, IonCardSubtitle, IonCardTitle, 
    IonButton, IonIcon, IonBadge, IonList, IonItem, IonLabel, 
    IonModal, IonButtons, IonText,
    IonRow, IonCol, IonChip, IonNote // Synchronized with template
  ]
})
export class SuggestionsPage implements OnInit {
  private firebaseService = inject(FirebaseService);
  
  suggestedMeals: any[] = [];
  selectedMeal: any = null;
  isModalOpen = false;
  userStatus: string = 'balanced';

  private recipes = [
    {
      id: 1,
      name: 'Quinoa & Kale Salad',
      gl: 8,
      type: 'Low GL',
      image: 'assets/meals/quinoa.jpg',
      prep: '15 mins',
      ingredients: ['1 cup cooked quinoa', '2 cups kale', 'Lemon vinaigrette', 'Chickpeas'],
      instructions: 'Massage kale with lemon juice, toss with quinoa and chickpeas. Season to taste.'
    },
    {
      id: 2,
      name: 'Grilled Salmon & Asparagus',
      gl: 2,
      type: 'Protein Focus',
      image: 'assets/meals/salmon.jpg',
      prep: '20 mins',
      ingredients: ['Salmon fillet', 'Bunch of asparagus', 'Olive oil', 'Garlic'],
      instructions: 'Grill salmon for 6 mins per side. Sauté asparagus with garlic until tender.'
    }
  ];

  constructor() {
    addIcons({ leafOutline, restaurantOutline, flameOutline, closeOutline, timeOutline });
  }

  ngOnInit() {
    this.generateSuggestions();
  }

  generateSuggestions() {
    this.firebaseService.getRecentMeals().subscribe(meals => {
      const today = new Date().setHours(0, 0, 0, 0);
      const todayTotalGL = meals
        .filter(m => m.timestamp >= today)
        .reduce((sum, m) => sum + (m.totalGL || 0), 0);

      if (todayTotalGL > 50) {
        this.userStatus = 'high-gl';
        this.suggestedMeals = this.recipes.filter(r => r.gl < 5);
      } else {
        this.userStatus = 'balanced';
        this.suggestedMeals = this.recipes;
      }
    });
  }

  openRecipe(meal: any) {
    this.selectedMeal = meal;
    this.isModalOpen = true;
  }
}