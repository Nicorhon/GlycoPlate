import { Injectable, inject } from '@angular/core';
import { 
  Database, ref, push, set, get, objectVal, listVal, remove 
} from '@angular/fire/database';
import { 
  Auth, user, createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, signOut 
} from '@angular/fire/auth';
import { Observable, switchMap, map, of } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Router } from '@angular/router';
import { MealData, MealPortion } from '../models/meal.model';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private database: Database = inject(Database);
  private auth: Auth = inject(Auth);
  private router = inject(Router);
  
  user$ = user(this.auth);

  async signUp(email: string, pass: string) {
    const credential = await createUserWithEmailAndPassword(this.auth, email, pass);
    const uid = credential.user.uid;

    return set(ref(this.database, `users/${uid}`), {
      profile: {
        email: email,
        createdAt: new Date().toISOString()
      },
      scale_data: {
        scale1: 0,
        scale2: 0,
        scale3: 0
      }
    });
  }

  async login(email: string, pass: string) {
    return signInWithEmailAndPassword(this.auth, email, pass);
  }

  async logout() {
    await signOut(this.auth);
    this.router.navigate(['/login']);
  }

  /**
   * Retrieves live weight data from the physical IoT scales
   */
  getLivePlateData(): Observable<any> {
    return this.user$.pipe(
      filter(u => !!u),
      switchMap(u => {
        const plateRef = ref(this.database, `users/${u?.uid}/scale_data`); 
        return objectVal(plateRef);
      })
    );
  }

  /**
   * NEW: Saves "user invented meals" or custom food data to the library
   * This allows the app to recognize the food in future scans.
   */
  async saveCustomFood(foodName: string, foodData: { carbsPer100g: number, glycemicIndex: number, advice: string }) {
    const searchKey = foodName.toLowerCase().trim();
    const foodRef = ref(this.database, `foods/${searchKey}`);
    return set(foodRef, {
      ...foodData,
      isCustom: true,
      dateAdded: new Date().toISOString()
    });
  }

  /**
   * Fetches nutrition facts based on AI classification results
   */
  async getFoodData(foodName: string): Promise<any> {
    try {
      const searchKey = foodName.toLowerCase().trim();
      const foodRef = ref(this.database, `foods/${searchKey}`);
      const snapshot = await get(foodRef);

      if (snapshot.exists()) {
        return snapshot.val();
      } else {
        console.warn(`Food not found in library: ${searchKey}`);
        return null;
      }
    } catch (error) {
      console.error("Firebase Fetch Error:", error);
      return null;
    }
  }

  /**
   * Saves a full meal scan to history, including detailed GI and GL
   */
  async addMeal(meal: MealData) {
    const user = this.auth.currentUser;
    const uid = user?.uid;

    if (!uid) throw new Error("No authenticated user found");

    try {
      const userHistoryRef = ref(this.database, `users/${uid}/history`);
      const newMealRef = push(userHistoryRef);

      const processedItems = meal.items.map((item: MealPortion) => ({
        label: String(item.label),
        weight: Number(item.weight) || 0,
        gi: Number(item.gi) || 0,
        gl: Number(item.gl) || 0,
        status: String(item.status),
        advice: String(item.advice)
      }));

      const finalMeal = {
        id: newMealRef.key,
        userId: uid,
        timestamp: meal.timestamp || Date.now(),
        items: processedItems,
        totalWeight: Number(meal.totalWeight) || 0,
        totalGL: Number(meal.totalGL) || 0,
        imageUrl: meal.imageUrl || '',
        note: meal.note || ''
      };

      return await set(newMealRef, JSON.parse(JSON.stringify(finalMeal)));
    } catch (error) {
      console.error("Firebase History Save Error:", error);
      throw error;
    }
  }

  getRecentMeals(): Observable<MealData[]> {
    return this.user$.pipe(
      filter(u => !!u),
      switchMap(u => {
        if (!u) return of([]);
        const userHistoryRef = ref(this.database, `users/${u.uid}/history`);
        return listVal(userHistoryRef, { keyField: 'id' }) as Observable<MealData[]>;
      }),
      map(meals => (meals || []).sort((a, b) => b.timestamp - a.timestamp))
    );
  }

  async deleteMeal(mealId: string) {
    const uid = this.auth.currentUser?.uid;
    const mealRef = ref(this.database, `users/${uid}/history/${mealId}`);
    return remove(mealRef);
  }

  getUserProfileData(): Observable<any> {
    return this.user$.pipe(
      filter(u => !!u),
      switchMap(u => {
        const profileRef = ref(this.database, `users/${u?.uid}/profile`);
        return objectVal(profileRef);
      })
    );
  }
}