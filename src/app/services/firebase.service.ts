import { Injectable, inject } from '@angular/core';
import { 
  Database, ref, push, set, query, 
  orderByChild, equalTo, listVal, remove, get, objectVal 
} from '@angular/fire/database';
import { 
  Auth, user, createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, signOut 
} from '@angular/fire/auth';
import { Observable, switchMap, map, of } from 'rxjs';
import { MealData } from '../models/meal.model';
import { filter } from 'rxjs/operators';
import { Router } from '@angular/router';

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

  getLivePlateData(): Observable<any> {
    return this.user$.pipe(
      filter(u => !!u),
      switchMap(u => {
        const plateRef = ref(this.database, `users/${u?.uid}/scale_data`); 
        return objectVal(plateRef);
      })
    );
  }

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

  /** * UPDATED: Cleans the meal object to prevent 'Maximum call stack' errors
   */
 async addMeal(meal: MealData) {
  // 1. Get current UID and force it to a string for the path
  const user = this.auth.currentUser;
  const uid = user?.uid;

  if (!uid) {
    console.error("Save failed: No authenticated user");
    throw new Error("No authenticated user found");
  }

  try {
    // 2. Reference the exact path allowed by your rules: users/$uid/history
    const userHistoryRef = ref(this.database, `users/${uid}/history`);
    const newMealRef = push(userHistoryRef);

    // 3. THE FIX: Double-clean the data. 
    // JSON.stringify removes hidden circular references from TensorFlow/Angular
    const cleanedMeal = JSON.parse(JSON.stringify(meal));

    // 4. Attach metadata and ensure all numbers are formatted correctly
    const finalMeal = {
      ...cleanedMeal,
      id: newMealRef.key,
      userId: uid,
      // Ensure the timestamp is fresh if not provided
      timestamp: cleanedMeal.timestamp || Date.now()
    };

    // 5. Save to the user-specific history node
    return await set(newMealRef, finalMeal);
  } catch (error) {
    console.error("Firebase Set Error:", error);
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

  // Add this to your FirebaseService class
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