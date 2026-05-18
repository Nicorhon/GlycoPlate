import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, 
  IonContent, IonIcon, IonChip, IonLabel, IonButton, IonBadge, 
  IonSpinner, IonModal, IonList, IonItem, IonTextarea, IonToggle, 
  IonSelect, IonSelectOption, IonInput, IonItemDivider,
  ToastController // Added ToastController for "Iconic" feedback
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  camera, refreshOutline, checkmarkCircle, alertCircle, 
  timeOutline, cloudUploadOutline, closeOutline, leafOutline, restaurantOutline,
  helpCircleOutline, flash, flashOff, moonOutline, discOutline, warningOutline,
  alertCircleOutline, sparklesOutline, scanOutline
} from 'ionicons/icons';
import { CameraPreview, CameraPreviewOptions } from '@capacitor-community/camera-preview';
import { Router } from '@angular/router';
import { FirebaseService } from '../../services/firebase.service';
import { GeminiService } from '../../services/gemini.service';
import { MealPortion } from '../../models/meal.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-camera',
  templateUrl: './camera.page.html',
  styleUrls: ['./camera.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonButtons, 
    IonBackButton, IonContent, IonIcon, IonChip, IonLabel, IonButton, 
    IonBadge, IonSpinner, IonModal, IonList, IonItem, IonTextarea, 
    IonToggle, IonSelect, IonSelectOption, IonInput, IonItemDivider
  ]
})
export class CameraPage implements OnInit, OnDestroy {
  private firebaseService = inject(FirebaseService);
  private geminiService = inject(GeminiService);
  private router = inject(Router);
  private toastCtrl = inject(ToastController); // Inject Toast

  public photo: string | undefined = undefined;
  public isCameraActive = false;
  private iotSubscription: Subscription | undefined;

  public p1 = 0; public p2 = 0; public p3 = 0;
  public portions: MealPortion[] = [];
  
  public isProcessing = false;
  public showHighGLModal = false;
  public showSuccessModal = false;
  public isFlashOn = false;
  public feedbackStatus = 'Initializing...';

  public mealNote: string = '';
  public hasExtraIngredient: boolean = false;
  public extraIngredientType: 'cheese' | 'sauce' | 'sugar' | 'none' = 'none';

 constructor() {
    addIcons({ 
      camera, refreshOutline, checkmarkCircle, 
      alertCircleOutline, // Match the HTML 'alert-circle-outline'
      sparklesOutline,    // Match the HTML 'sparkles-outline'
      scanOutline,
      timeOutline, cloudUploadOutline, closeOutline, leafOutline, 
      restaurantOutline, helpCircleOutline, flash, flashOff,
      moonOutline, discOutline, warningOutline 
    });
  }

  async ngOnInit() {
    this.startLiveCamera();
    this.listenToUserIoT();
  }

  ngOnDestroy() {
    if (this.iotSubscription) this.iotSubscription.unsubscribe();
    CameraPreview.stop();
  }

  async startLiveCamera() {
    const options: CameraPreviewOptions = {
      parent: 'camera-parent',
      position: 'rear',
      toBack: true,
      width: window.innerWidth,
      height: 380,
    };
    await CameraPreview.start(options);
    this.isCameraActive = true;
  }

  listenToUserIoT() {
    this.iotSubscription = this.firebaseService.getLivePlateData().subscribe(data => {
      if (data) {
        this.p1 = Number(data.scale1) || 0;
        this.p2 = Number(data.scale2) || 0;
        this.p3 = Number(data.scale3) || 0;
      }
    });
  }

  get canProceed(): boolean {
    const totalWeight = this.p1 + this.p2 + this.p3;
    
    if (totalWeight <= 10) { // Increased threshold to act as a "No Plate" proxy
      this.feedbackStatus = 'Place plate on scale';
      return false;
    }
    
    if (totalWeight > 3000) {
      this.feedbackStatus = 'Scale Overload';
      return false;
    }

    this.feedbackStatus = 'Ready to Analyze';
    return true;
  }

  async toggleFlash() {
    this.isFlashOn = !this.isFlashOn;
    await CameraPreview.setFlashMode({ 
      flashMode: this.isFlashOn ? 'on' : 'off' 
    });
  }

 async captureImage() {
  // Ensure scales have stabilized and at least one section has weight
  if (!this.canProceed) return;

  try {
    this.isProcessing = true;
    
    // Capture from Capacitor Camera Preview
    const result = await CameraPreview.capture({ quality: 85 });
    this.photo = `data:image/jpeg;base64,${result.value}`;
    
    // Stop preview to save resources during AI processing
    this.isCameraActive = false;
    await CameraPreview.stop();
    
    await this.analyzePlate(this.photo);
  } catch (e) {
    console.error("Capture failed", e);
    await this.showValidationToast('ERR_UNKNOWN');
    this.restartScan();
  }
}

async analyzePlate(base64: string) {
    try {
      const aiResult = await this.geminiService.analyzeMealImage(base64);

      // 1. Handle explicit validation errors from AI (like ERR_LIGHT or ERR_NON_FOOD)
      if (aiResult.error) {
        await this.showValidationToast(aiResult.error);
        this.restartScan();
        return;
      }

      // 2. NEW: If items array is empty, it means the AI saw something but recognized it wasn't food
      if (!aiResult.items || aiResult.items.length === 0) {
        await this.showValidationToast('ERR_NON_FOOD');
        this.restartScan();
        return;
      }

      // Map AI items to their corresponding IoT scale weights
      this.portions = aiResult.items.map((item: any) => {
        let weight = 0;
        
        // Match section to specific hardware scale
        if (item.section === 1) weight = Math.max(0, this.p1); 
        if (item.section === 2) weight = Math.max(0, this.p2); 
        if (item.section === 3) weight = Math.max(0, this.p3); 

        // NEW: Check if item is unidentified by AI
        const isUnknown = item.foodName.toLowerCase().includes('unknown');

        const netCarbs = weight * (item.carbsPer100g / 100);
        const calculatedGL = (item.gi * netCarbs) / 100;

        // NEW: If unknown, we pass specific flags to formatPortion or handle here
        return this.formatPortion(
          isUnknown ? `Unknown (Scale ${item.section})` : item.foodName,
          weight,
          isUnknown ? 0 : calculatedGL, // Set GL to 0 until user identifies
          isUnknown ? 'Please identify food.' : 'Analyzed by GlycoPlate AI',
          item.gi
        );
      });

      this.isProcessing = false;

      // Logic: If ANY portion is high GL, show the warning modal.
      const hasHighGL = this.portions.some(p => p.status === 'TOO MUCH');
      
      if (hasHighGL) {
        this.showHighGLModal = true;
        this.showSuccessModal = false; 
      } else {
        this.showSuccessModal = true;
        this.showHighGLModal = false; 
      }

    } catch (err) {
      console.error("Analysis Error:", err);
      // If we catch a 429 or network error here, it triggers "Analysis Failed"
      await this.showValidationToast('ERR_UNKNOWN');
      this.restartScan();
    }
  }
  /**
   * Updated toast logic to ensure icon names match registered icons
   */
  async showValidationToast(errorCode: string) {
    const config: any = {
      'ERR_LIGHT': { msg: 'Too dark! Please move to a better lit area.', icon: 'moon-outline' },
      'ERR_NO_PLATE': { msg: 'No plate detected.', icon: 'disc-outline' },
      'ERR_MISALIGNED': { 
      msg: 'Food in middle! Place on partitions and align with camera.', 
      icon: 'scan-outline' 
    },
      'ERR_PARSE_FAILED': { msg: 'AI formatting error.', icon: 'alert-circle-outline' },
      'ERR_UNKNOWN': { msg: 'Analysis failed.', icon: 'alert-circle-outline' },
      'ERR_NON_FOOD': { 
  msg: 'Non-food item detected. Please place actual food on the plate.', 
  icon: 'warning-outline' 
},
    };

    const info = config[errorCode] || config['ERR_UNKNOWN'];

    const toast = await this.toastCtrl.create({
      message: info.msg,
      duration: 10000,
      position: 'top',
      icon: info.icon,
      cssClass: 'glyco-toast-error',
      buttons: [{ text: 'OK', role: 'cancel' }]
    });
    await toast.present();
  }

  formatPortion(foodName: string, weight: number, gl: number, dbAdvice: string, gi: number): MealPortion {
    const status = gl > 15 ? 'TOO MUCH' : 'NORMAL'; 
    return {
      label: foodName, 
      weight, 
      gl: Number(gl.toFixed(2)),
      gi: Number(gi) || 0,
      status,
      color: status === 'NORMAL' ? 'success' : 'danger',
      advice: status === 'NORMAL' ? dbAdvice : 'Portion exceeds recommended Glycemic Load.'
    };
  }

  // Handles manual updates or saving "User Invented Meals" to DB
async saveToLibrary() {
  // 1. Filter for items that actually have names and valid GI values
  const validItems = this.portions.filter(p => 
    p.label && 
    !p.label.toLowerCase().includes('unknown') && 
    p.gi > 0
  );

  if (validItems.length === 0) {
    console.warn("No valid identified food items to save.");
    return;
  }

  try {
    for (const item of validItems) {
      // 2. Calculate carb density
      // Safety check: Avoid division by zero if weight or GI is missing
      let density = 15; // Default to 15% if math fails
      if (item.gi > 0 && item.weight > 0) {
        density = (item.gl * 100) / (item.gi * (item.weight / 100));
      }

      const newFood = {
        carbsPer100g: Number(density.toFixed(2)),
        glycemicIndex: item.gi,
        advice: item.advice || 'User-saved custom meal.'
      };

      // 3. Save to Firebase using the existing service
      await this.firebaseService.saveCustomFood(item.label, newFood);
    }

    // 4. Feedback to user
    const savedNames = validItems.map(i => i.label).join(', ');
    console.log(`Saved to library: ${savedNames}`);
    
    // Optional: Only alert if it's a single item, or use a toast for multiple
    if (validItems.length === 1) {
      alert(`${validItems[0].label} saved to your database!`);
    }
  } catch (error) {
    console.error("Error saving to library:", error);
  }
}

  get canLog() { 
    return this.portions.length > 0 && this.portions.every(p => p.status === 'NORMAL'); 
  }

  async updateUnidentifiedItem(index: number, typedName: any, typedGI: any) {
  const name = String(typedName || '').trim();
  const giValue = Number(typedGI);

  if (!name || isNaN(giValue) || giValue <= 0) {
    alert("Please fill out both the Food Name and a valid GI number.");
    return;
  }

  // Use a temporary default carb density estimate of 15% for unknown metrics
  const weight = this.portions[index].weight;
  const estimatedCarbsDensity = 15; 
  const netCarbs = weight * (estimatedCarbsDensity / 100);
  const calculatedGL = (giValue * netCarbs) / 100;

  // Remap the targeted slice directly out of yellow warning block
  this.portions[index] = this.formatPortion(
    name,
    weight,
    calculatedGL,
    'Manually declared item',
    giValue
  );

  // Re-evaluate if the newly typed metrics spike the global threshold limits
  const hasHighGL = this.portions.some(p => p.status === 'TOO MUCH');
  if (hasHighGL) {
    this.showHighGLModal = true;
    this.showSuccessModal = false;
  } else {
    this.showSuccessModal = true;
    this.showHighGLModal = false;
  }
}

  async confirmAndSave() {
    try {
      const finalItems = this.portions.map(p => {
        let finalGL = p.gl;
        let finalGI = p.gi;
        let finalLabel = p.label;

        if (this.hasExtraIngredient && this.extraIngredientType !== 'none') {
          if (this.extraIngredientType === 'cheese') {
             finalGL += 1.2;
             finalLabel += " (w/ Cheese)";
          } else if (this.extraIngredientType === 'sauce') {
             finalGL += 3.5;
             finalGI += 5;
             finalLabel += " (w/ Sauce)";
          } else if (this.extraIngredientType === 'sugar') {
             finalGL += 6.0;
             finalGI += 15;
             finalLabel += " (Glazed/Sweet)";
          }
        }

        return {
          label: String(finalLabel),
          weight: Number(p.weight) || 0,
          gl: Number(finalGL.toFixed(2)),
          gi: Number(finalGI) || 0,
          status: finalGL > 15 ? 'TOO MUCH' : 'NORMAL',
          advice: String(p.advice)
        };
      });

      const mealData: any = {
        timestamp: Date.now(),
        items: finalItems,
        totalWeight: Number((this.p1 + this.p2 + this.p3).toFixed(2)),
        totalGL: Number(finalItems.reduce((sum, p) => sum + p.gl, 0).toFixed(2)),
        imageUrl: this.photo || '',
        note: this.mealNote || '' 
      };

      await this.firebaseService.addMeal(mealData);
      this.resetVariables();
      this.router.navigate(['/tabs/history']);
    } catch (error) {
      console.error("Save failed:", error);
      alert("Save Error: Please check connection.");
    }
  }

  private resetVariables() {
    this.showSuccessModal = false;
    this.showHighGLModal = false;
    this.mealNote = '';
    this.hasExtraIngredient = false;
    this.extraIngredientType = 'none';
    this.photo = undefined;
    this.portions = [];
    this.isProcessing = false;
  }

  restartScan() {
    this.resetVariables();
    this.startLiveCamera();
  }
}