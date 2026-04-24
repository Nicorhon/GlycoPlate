import { Component, inject, OnInit, OnDestroy, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, 
  IonContent, IonIcon, IonChip, IonLabel, IonButton, IonBadge, 
  IonSpinner, IonModal, IonList, IonItem 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { camera, refreshOutline, checkmarkCircle, alertCircle, timeOutline, cloudUploadOutline } from 'ionicons/icons';
import { CameraPreview, CameraPreviewOptions } from '@capacitor-community/camera-preview';
import { Router } from '@angular/router';
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as tf from '@tensorflow/tfjs';
import { FirebaseService } from '../../services/firebase.service';
import { MealData, MealPortion } from '../../models/meal.model';

@Component({
  selector: 'app-camera',
  templateUrl: './camera.page.html',
  styleUrls: ['./camera.page.scss'],
  standalone: true,
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent, IonIcon, IonChip, IonLabel, IonButton, IonBadge, IonSpinner, IonModal, IonList, IonItem]
})
export class CameraPage implements OnInit, OnDestroy {
  private firebaseService = inject(FirebaseService);
  private router = inject(Router);
  private injector = inject(EnvironmentInjector);

  public photo: string | undefined = undefined;
  public isCameraActive = false;
  private model: any;

  public p1 = 0; public p2 = 0; public p3 = 0;
  public portions: MealPortion[] = [];
  
  public stabilityTimer: any = null;
  public isProcessing = false;
  public countdown = 10;
  public showHighGLModal = false;
  public showSuccessModal = false;

  constructor() {
    addIcons({ camera, refreshOutline, checkmarkCircle, alertCircle, timeOutline, cloudUploadOutline });
    this.listenToIoT();
  }

  async ngOnInit() {
    await this.initAI();
    this.startLiveCamera();
  }

  ngOnDestroy() {
    this.resetStability();
    CameraPreview.stop();
  }

  async initAI() {
    await tf.ready();
    this.model = await mobilenet.load();
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

  listenToIoT() {
    // Listens to your 'scales' node in RTDB
    this.firebaseService.getLivePlateData('scales').subscribe(data => {
      if (data) {
        this.p1 = Number(data.scale1) || 0;
        this.p2 = Number(data.scale2) || 0;
        this.p3 = Number(data.scale3) || 0;
        if (this.isAligned && !this.photo && !this.isProcessing) this.handleAutoCapture();
        else if (!this.isAligned) this.resetStability();
      }
    });
  }

  get isAligned(): boolean {
    return this.p1 > 10 && this.p2 > 10 && this.p3 > 10;
  }

  private handleAutoCapture() {
    if (this.stabilityTimer) return;
    this.stabilityTimer = setInterval(async () => {
      this.countdown--;
      if (this.countdown <= 0) {
        this.resetStability();
        this.isProcessing = true;
        await this.captureImage();
      }
    }, 1000);
  }

  private resetStability() {
    if (this.stabilityTimer) clearInterval(this.stabilityTimer);
    this.stabilityTimer = null;
    this.countdown = 10;
  }

  async captureImage() {
    const result = await CameraPreview.capture({ quality: 85 });
    this.photo = `data:image/jpeg;base64,${result.value}`;
    this.isCameraActive = false;
    await CameraPreview.stop();
    await this.analyzePlate(this.photo);
  }

  async analyzePlate(base64: string) {
    const img = new Image();
    img.src = base64;
    img.onload = async () => {
      await runInInjectionContext(this.injector, async () => {
        const pred = await this.model.classify(img);
        const mainFood = pred[0].className.split(',')[0].toLowerCase();
        const labels = ['Brocolli', 'Pasta', 'Chicken'];
        const weights = [this.p1, this.p2, this.p3];
        const tempPortions: MealPortion[] = [];

        for (let i = 0; i < labels.length; i++) {
          const nutrition = await this.firebaseService.getFoodData(labels[i]);
          const gi = nutrition?.glycemicIndex ?? 50; 
          const netCarbs = weights[i] * ((nutrition?.carbsPer100g ?? 15) / 100);
          const gl = (gi * netCarbs) / 100;
          tempPortions.push(this.formatPortion(labels[i], weights[i], gl));
        }
        
        this.portions = tempPortions;
        this.isProcessing = false;
        if (this.canLog) this.showSuccessModal = true;
        else this.showHighGLModal = true;
      });
    };
  }

  formatPortion(foodName: string, weight: number, gl: number): MealPortion {
    const status = gl > 15 ? 'TOO MUCH' : 'NORMAL';
    return {
      label: foodName, weight, gl, status,
      color: status === 'NORMAL' ? 'success' : 'danger',
      advice: status === 'NORMAL' ? 'Safe portion.' : `Reduce ${foodName} portion.`
    };
  }

  get canLog() { return this.portions.length > 0 && this.portions.every(p => p.status === 'NORMAL'); }

 async confirmAndSave() {
  // 1. Create data object
  const mealData = {
    timestamp: Date.now(),
    items: this.portions,
    totalWeight: this.p1 + this.p2 + this.p3,
    totalGL: this.portions.reduce((sum, p) => sum + p.gl, 0),
    imageUrl: this.photo || ''
  };

  try {
    // 2. Clear state BEFORE navigating to prevent loops
    this.showSuccessModal = false;
    
    // 3. Perform the save
    await this.firebaseService.addMeal(mealData);
    
    // 4. Navigate away
    this.router.navigate(['/history']);
  } catch (error) {
    console.error("Save failed:", error);
    alert("Could not save meal. Please try again.");
  }
}

  restartScan() {
    this.photo = undefined;
    this.portions = [];
    this.isProcessing = false;
    this.showHighGLModal = false;
    this.showSuccessModal = false;
    this.resetStability();
    this.startLiveCamera();
  }
}