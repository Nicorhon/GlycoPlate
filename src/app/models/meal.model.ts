export interface MealPortion {
  label: string;
  weight: number;
  gl: number;
  status: string; 
  color: string;
  advice: string; // <--- Add this line!
}

export interface MealData {
  id?: string;
  userId: string;
  timestamp: any;
  items: MealPortion[];
  totalWeight: number;
  totalGL: number;
  imageUrl?: string;
}