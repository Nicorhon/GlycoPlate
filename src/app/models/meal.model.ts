export interface MealPortion {
  label: string;
  weight: number;
  gi: number;      // Glycemic Index (either from Firebase or Gemini AI)
  gl: number;      // Calculated Glycemic Load (GI * Carbs / 100)
  status: 'NORMAL' | 'TOO MUCH'; // Strict typing for status
  color: 'success' | 'danger' | 'warning' | 'medium'; 
  advice: string;
}

export interface MealData {
  id?: string;
  userId?: string;
  timestamp: number;
  items: MealPortion[];
  totalWeight: number;
  totalGL: number;
  imageUrl: string;
  note?: string;   // Stores the "mealNote" from the camera page
  isCustom?: boolean; // Flag to identify if this was a "user invented meal"
}