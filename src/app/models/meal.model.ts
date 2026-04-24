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
  userId?: string; // Add the '?' to make it optional
  timestamp: number;
  items: any[];
  totalWeight: number;
  totalGL: number;
  imageUrl?: string;
}