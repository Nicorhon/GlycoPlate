import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonCard, 
  IonCardHeader, IonCardSubtitle, IonCardTitle, 
  IonButton, IonIcon, IonBadge, IonList, IonItem, IonLabel, 
  IonModal, IonButtons, IonText,
  IonRow, IonCol, IonChip, IonNote 
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
    CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, 
    IonCardHeader, IonCardSubtitle, IonCardTitle, IonButton, IonIcon, 
    IonBadge, IonList, IonItem, IonLabel, IonModal, IonButtons, 
    IonText, IonRow, IonCol, IonChip, IonNote
  ]
})
export class SuggestionsPage implements OnInit {
  private firebaseService = inject(FirebaseService);
  
  suggestedMeals: any[] = [];
  selectedMeal: any = null;
  isModalOpen = false;
  userStatus: string = 'balanced';

  // UPDATED: SOLID FILIPINO FOODS ONLY
  private recipes = [
    {
      id: 1,
      name: 'Adobong Sitaw w/ Tofu',
      gl: 7,
      type: 'Fiber & Protein',
      image: 'assets/meals/adobo.jpg',
      prep: '15 mins',
      ingredients: ['200g String beans (Sitaw)', '150g Firm Tofu', 'Garlic', 'Soy sauce', 'Vinegar'],
      instructions: 'Fry tofu cubes until crispy. Sauté garlic, add sitaw and fried tofu. Pour soy sauce and vinegar. Simmer until sauce reduces.'
    },
    {
      id: 2,
      name: 'Grilled Liempo w/ Ensalada',
      gl: 3,
      type: 'Low Carb / Keto',
      image: 'assets/meals/liempo.jpg',
      prep: '25 mins',
      ingredients: ['250g Pork Belly', '100g Tomatoes', '50g Onions', 'Salt & Pepper'],
      instructions: 'Season pork and grill until cooked. Chop tomatoes and onions for a side salad. Serve without rice for lowest GL impact.'
    },
    {
      id: 3,
      name: 'Cauliflower Fried Rice',
      gl: 5,
      type: 'Rice Alternative',
      image: 'assets/meals/cauli.jpg',
      prep: '20 mins',
      ingredients: ['300g Cauliflower (grated)', '50g Carrots', '2 Eggs', 'Garlic', 'Green onions'],
      instructions: 'Sauté garlic and carrots. Add grated cauliflower and stir-fry for 5 minutes. Mix in scrambled eggs and season.'
    },
    {
      id: 4,
      name: 'Tortang Talong (Eggplant Omelet)',
      gl: 4,
      type: 'Vegetable Focus',
      image: 'assets/meals/torta.jpg',
      prep: '15 mins',
      ingredients: ['2 Large Eggplants', '2 Eggs', 'Salt', 'Garlic'],
      instructions: 'Grill and peel the eggplants. Flatten them and dip in beaten eggs. Fry until golden brown on both sides.'
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
        // Suggest the lowest GL solid options
        this.suggestedMeals = this.recipes.filter(r => r.gl <= 5);
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