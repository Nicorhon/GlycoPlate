import { Injectable, inject } from '@angular/core';
import { 
  Database, ref, push, set, get, objectVal, listVal, remove, child 
} from '@angular/fire/database';
import { 
  Auth, user, createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, signOut, sendEmailVerification
} from '@angular/fire/auth';
import { Observable, switchMap, map, of, from } from 'rxjs';
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

  /**
   * Registers a user account using basic credentials.
   * Note: We removed the initial default 'profile' generation block from here 
   * so it doesn't conflict with the manual health setup onboarding step.
   */
  async signUp(email: string, pass: string) {
    const credential = await createUserWithEmailAndPassword(this.auth, email, pass);
    const uid = credential.user.uid;

    // Initialize only the hardware scale layout configurations for the IoT stream on signup
    await set(ref(this.database, `users/${uid}/scale_data`), {
      scale1: 0,
      scale2: 0,
      scale3: 0
    });

    return credential;
  }

  async login(email: string, pass: string) {
    return signInWithEmailAndPassword(this.auth, email, pass);
  }

  async logout() {
    await signOut(this.auth);
    window.location.href = '/login';
  }

  /**
   * Sends the native Firebase account activation confirmation link
   */
  async sendVerificationLink() {
    if (this.auth.currentUser) {
      await sendEmailVerification(this.auth.currentUser);
    }
  }

  /**
   * Refreshes the user session to verify if they have completed email authentication
   */
  async reloadAndCheckVerification(): Promise<boolean> {
    if (this.auth.currentUser) {
      await this.auth.currentUser.reload();
      return this.auth.currentUser.emailVerified;
    }
    return false;
  }

  /**
   * Validates if a user's health profile information already exists in the system
   */
  async checkProfileExists(uid: string): Promise<boolean> {
    const snapshot = await get(child(ref(this.database), `users/${uid}/profile`));
    return snapshot.exists();
  }

  /**
   * Commits the custom GlycoPlate onboarding health parameters to the user's profile node.
   * UPDATED: Accepts weight, height, and age explicitly.
   */
  async saveUserProfileData(profileData: { 
    displayName: string, 
    condition: string, 
    weight: number | null, 
    height: number | null, 
    age: number | null 
  }) {
    const currentUser = this.auth.currentUser;
    if (!currentUser) throw new Error("Session expired. Please log in again.");
    
    const nodeRef = ref(this.database, `users/${currentUser.uid}/profile`);
    return set(nodeRef, {
      email: currentUser.email,
      displayName: profileData.displayName,
      condition: profileData.condition,
      weight: profileData.weight ? Number(profileData.weight) : 0,
      height: profileData.height ? Number(profileData.height) : 0,
      age: profileData.age ? Number(profileData.age) : 0,
      uid: currentUser.uid,
      photoURL: '',
      createdAt: new Date().toISOString()
    });
  }

  /**
   * Core reactive stream that returns full profile metadata 
   * to populate the "My Health ID" badge layout
   */
  getUserProfileObservable(): Observable<any> {
    return this.user$.pipe(
      filter(u => !!u),
      switchMap(u => {
        if (!u) return of(null);
        const profileRef = ref(this.database, `users/${u.uid}/profile`);
        return objectVal(profileRef);
      })
    );
  }

  /**
   * Legacy method template matching your ProfilePage structure references
   */
  getUserProfileData(): Observable<any> {
    return this.getUserProfileObservable();
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
   * Saves "user invented meals" or custom food data to the library
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

  async updateProfilePicture(base64String: string) {
    const uid = this.auth.currentUser?.uid;
    if (!uid) throw new Error("No active user session");

    // Targets users/${uid}/profile/photoURL node directly
    const photoNodeRef = ref(this.database, `users/${uid}/profile/photoURL`);
    return set(photoNodeRef, base64String);
  }
}