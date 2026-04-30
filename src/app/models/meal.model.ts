export interface MealPortion {
  label: string;
  weight: number;
  gi: number;      // Glycemic Index from Database
  gl: number;      // Calculated Glycemic Load
  status: string;  // 'NORMAL' or 'TOO MUCH'
  color: string;   // 'success' or 'danger'
  advice: string;
}

export interface MealData {
  id?: string;
  timestamp: number;
  items: MealPortion[];
  totalWeight: number;
  totalGL: number;
  imageUrl: string;
  userId?: string;
}