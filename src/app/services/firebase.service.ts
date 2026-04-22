import { Injectable, inject } from '@angular/core';
import { 
  Firestore, collection, collectionData, query, 
  where, orderBy, addDoc, serverTimestamp, doc, deleteDoc 
} from '@angular/fire/firestore';
import { Database, ref, objectVal } from '@angular/fire/database';
import { Auth, user } from '@angular/fire/auth';
import { Observable, switchMap, of } from 'rxjs';
import { MealData } from '../models/meal.model'; 

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private firestore: Firestore = inject(Firestore);
  private database: Database = inject(Database);
  private auth: Auth = inject(Auth);
  
  // Observable for the current authenticated user
  user$ = user(this.auth);

  /**
   * Retrieves live weight data from the IoT Smart Plate.
   * @param plateId The unique ID of the plate (e.g., 'plate_01')
   */
  getLivePlateData(plateId: string): Observable<any> {
    const plateRef = ref(this.database, `plates/${plateId}`);
    return objectVal(plateRef); 
  }

  /**
   * Adds a completed meal to the Firestore database.
   * This now accepts the full MealData structure including the 'items' array.
   */
  async addMeal(meal: MealData) {
    const currentUser = this.auth.currentUser;
    const uid = currentUser ? currentUser.uid : 'guest_user';

    const mealsRef = collection(this.firestore, 'meals');
    
    // We strip the 'id' if it exists to let Firestore generate a new one
    const { id, ...mealData } = meal;

    return addDoc(mealsRef, {
      ...mealData,
      userId: uid,
      timestamp: serverTimestamp() // Overrides local time with server time for accuracy
    });
  }

  /**
   * Retrieves all historical meals for the logged-in user.
   * Useful for the History page to show the 3-portion breakdown.
   */
  getRecentMeals(): Observable<MealData[]> {
    return this.user$.pipe(
      switchMap(u => {
        if (!u) return of([]);
        
        const mealsRef = collection(this.firestore, 'meals');
        const q = query(
          mealsRef, 
          where('userId', '==', u.uid), 
          orderBy('timestamp', 'desc')
        );
        
        // idField: 'id' maps the Firestore document ID to the 'id' property in your model
        return collectionData(q, { idField: 'id' }) as Observable<MealData[]>;
      })
    );
  }

  /**
   * Deletes a specific meal record from history.
   * @param mealId The Firestore document ID
   */
  async deleteMeal(mealId: string) {
    const mealDocRef = doc(this.firestore, `meals/${mealId}`);
    return deleteDoc(mealDocRef);
  }
}