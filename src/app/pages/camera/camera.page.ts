// src/app/pages/camera/camera.page.ts

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
import * as tf from '@tensorflow/tfjs'; 
import * as tmImage from '@teachablemachine/image';
import { FirebaseService } from '../../services/firebase.service';
import { MealPortion } from '../../models/meal.model';
import { Subscription } from 'rxjs';

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
  private model: tmImage.CustomMobileNet | undefined;
  private iotSubscription: Subscription | undefined;

  public p1 = 0; public p2 = 0; public p3 = 0;
  public portions: MealPortion[] = [];
  
  public stabilityTimer: any = null;
  public isProcessing = false;
  public countdown = 10;
  public showHighGLModal = false;
  public showSuccessModal = false;

  constructor() {
    addIcons({ camera, refreshOutline, checkmarkCircle, alertCircle, timeOutline, cloudUploadOutline });
  }

  async ngOnInit() {
    await this.initAI();
    this.startLiveCamera();
    this.listenToUserIoT();
  }

  ngOnDestroy() {
    this.resetStability();
    if (this.iotSubscription) this.iotSubscription.unsubscribe();
    CameraPreview.stop();
  }

  async initAI() {
    try {
      await tf.ready();
      // Your Teachable Machine Model URL
      const modelURL = 'https://teachablemachine.withgoogle.com/models/luq75XfwN/';
      const checkpointURL = modelURL + "model.json";
      const metadataURL = modelURL + "metadata.json";

      this.model = await tmImage.load(checkpointURL, metadataURL);
      console.log("Teachable Machine Model Loaded!");
    } catch (e) {
      console.error("AI Initialization failed:", e);
    }
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

        if (this.isAligned && !this.photo && !this.isProcessing) {
          this.handleAutoCapture();
        } else if (!this.isAligned) {
          this.resetStability();
        }
      }
    });
  }

  get isAligned(): boolean {
    return this.p1 > 0 || this.p2 > 0 || this.p3 > 0;
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
    try {
      const result = await CameraPreview.capture({ quality: 85 });
      this.photo = `data:image/jpeg;base64,${result.value}`;
      this.isCameraActive = false;
      await CameraPreview.stop();
      await this.analyzePlate(this.photo);
    } catch (e) {
      console.error("Capture failed", e);
      this.restartScan();
    }
  }

async analyzePlate(base64: string) {
  const img = new Image();
  img.src = base64;
  img.onload = async () => {
    await runInInjectionContext(this.injector, async () => {
      this.isProcessing = true;
      const tempPortions: MealPortion[] = [];

      const regions = [
        { id: 1, name: 'Scale 1', weight: this.p1, x: 0, y: 0, w: 0.5, h: 0.5 },
        { id: 2, name: 'Scale 2', weight: this.p2, x: 0.5, y: 0, w: 0.5, h: 0.5 },
        { id: 3, name: 'Scale 3', weight: this.p3, x: 0, y: 0.5, w: 1, h: 0.5 }
      ];

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      for (const reg of regions) {
        if (reg.weight > 0 && this.model) {
          const sw = img.width * reg.w;
          const sh = img.height * reg.h;
          const sx = img.width * reg.x;
          const sy = img.height * reg.y;

          canvas.width = sw;
          canvas.height = sh;
          ctx?.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

          const predictions = await this.model.predict(canvas);
          predictions.sort((a, b) => b.probability - a.probability);
          const topResult = predictions[0];

          let matchedKey: string | null = null;
          let nutritionData: any = null;

          if (topResult.probability > 0.60) {
            const aiGuess = topResult.className.toLowerCase().replace('_', ' ').trim();
            const data = await this.firebaseService.getFoodData(aiGuess);
            if (data) {
              matchedKey = aiGuess;
              nutritionData = data;
            }
          }

          if (matchedKey && nutritionData) {
            const netCarbs = reg.weight * (nutritionData.carbsPer100g / 100);
            const gl = (nutritionData.glycemicIndex * netCarbs) / 100;
            
            // UPDATED: Added nutritionData.glycemicIndex here
            tempPortions.push(this.formatPortion(
              matchedKey, 
              reg.weight, 
              gl, 
              nutritionData.advice, 
              nutritionData.glycemicIndex 
            ));
          } else {
            tempPortions.push({
              label: `Unknown (Scale ${reg.id})`,
              weight: reg.weight,
              gl: 0,
              gi: 0, // Default to 0 for unknown
              status: 'NORMAL',
              color: 'medium',
              advice: 'Food not recognized.'
            });
          }
        }
      }

      this.portions = tempPortions;
      this.isProcessing = false;

      if (this.portions.length > 0) {
        this.canLog ? this.showSuccessModal = true : this.showHighGLModal = true;
      } else {
        this.restartScan();
      }
    });
  };
}

// UPDATED: Added gi parameter
formatPortion(foodName: string, weight: number, gl: number, dbAdvice: string, gi: number): MealPortion {
  const status = gl > 15 ? 'TOO MUCH' : 'NORMAL';
  return {
    label: foodName, 
    weight, 
    gl: Number(gl.toFixed(2)), // Clean decimal
    gi: Number(gi) || 0,        // Store the GI from Firebase
    status,
    color: status === 'NORMAL' ? 'success' : 'danger',
    advice: status === 'NORMAL' ? dbAdvice || 'Safe portion.' : `Reduce ${foodName} portion.`
  };
}

  get canLog() { 
    return this.portions.length > 0 && this.portions.every(p => p.status === 'NORMAL'); 
  }

 async confirmAndSave() {
  try {
    const cleanItems = this.portions.map(p => ({
      label: String(p.label),
      weight: Number(p.weight) || 0,
      gl: Number(p.gl) || 0,    // Already formatted in formatPortion
      gi: Number(p.gi) || 0,    // NEW: Save GI to history
      status: String(p.status),
      advice: String(p.advice)
    }));

    const mealData: any = {
      timestamp: Date.now(),
      items: cleanItems,
      totalWeight: Number((this.p1 + this.p2 + this.p3).toFixed(2)),
      totalGL: Number(cleanItems.reduce((sum, p) => sum + p.gl, 0).toFixed(2)),
      imageUrl: this.photo || ''
    };

    const pureMealData = JSON.parse(JSON.stringify(mealData));
    this.showSuccessModal = false;
    
    await this.firebaseService.addMeal(pureMealData);
    this.router.navigate(['/tabs/history']);
  } catch (error) {
    console.error("Save failed:", error);
    alert("Save Error: Check Firebase configuration.");
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