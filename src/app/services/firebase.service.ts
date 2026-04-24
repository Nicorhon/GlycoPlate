import { Injectable, inject } from '@angular/core';
import { 
  Database, ref, push, set, query, 
  orderByChild, equalTo, listVal, remove, get, objectVal 
} from '@angular/fire/database';
import { Auth, user } from '@angular/fire/auth';
import { Observable, switchMap, map } from 'rxjs';
import { MealData } from '../models/meal.model';
import { filter } from 'rxjs/operators'; // Add this import

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private database: Database = inject(Database);
  private auth: Auth = inject(Auth);
  
  // Observable of the current authentication state
  user$ = user(this.auth);

  /** Retrieves live weight data from IoT scales */
  getLivePlateData(path: string): Observable<any> {
    const plateRef = ref(this.database, path); 
    return objectVal(plateRef); 
  }

  /** * Fetches nutrition data from the 'foods' node in RTDB 
   * KEPT AS REQUESTED
   */
  async getFoodData(foodName: string): Promise<any> {
    try {
      const foodRef = ref(this.database, `foods/${foodName.toLowerCase()}`);
      const snapshot = await get(foodRef);
      return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
      console.error("Error fetching nutrition:", error);
      return null;
    }
  }

  /** Adds meal to RTDB with Guest Fallback */
// Replace your addMeal and getRecentMeals with these:

async addMeal(meal: MealData) {
  // Use the actual anonymous UID provided by Firebase
  const uid = this.auth.currentUser?.uid;
  if (!uid) throw new Error("No user found");

  const mealsRef = ref(this.database, 'meals');
  const newMealRef = push(mealsRef);

  const finalMeal = {
    ...meal,
    id: newMealRef.key,
    userId: uid // Saves to the specific anonymous user
  };

  return set(newMealRef, finalMeal);
}

getRecentMeals(): Observable<MealData[]> {
  const mealsRef = ref(this.database, 'meals');

  return this.user$.pipe(
    // filter(u => !!u) ensures we don't query until the anonymous login finishes
    filter(u => !!u),
    switchMap(u => {
      const mealQuery = query(
        mealsRef, 
        orderByChild('userId'), 
        equalTo(u!.uid) // Use the real UID
      );
      return listVal(mealQuery, { keyField: 'id' }) as Observable<MealData[]>;
    }),
    map(meals => {
      if (!meals) return [];
      return meals.sort((a, b) => b.timestamp - a.timestamp);
    })
  );
}
  /** Removes a meal record from the database */
  async deleteMeal(mealId: string) {
    const mealRef = ref(this.database, `meals/${mealId}`);
    return remove(mealRef);
  }
}