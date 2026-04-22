import { Component, inject, OnInit, OnDestroy, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, 
  IonContent, IonIcon, IonChip, IonLabel, IonButton, IonBadge 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { camera, refreshOutline, checkmarkCircle, alertCircle } from 'ionicons/icons';
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
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent, IonIcon, IonChip, IonLabel, IonButton, IonBadge]
})
export class CameraPage implements OnInit, OnDestroy {
  private firebaseService = inject(FirebaseService);
  private router = inject(Router);

  photo: string | undefined = undefined;
  isCameraActive = false;
  model: any;

  p1Weight = 0; p2Weight = 0; p3Weight = 0;
  portions: MealPortion[] = [];
  readonly ALIGNMENT_THRESHOLD = 10;

  constructor() {
    addIcons({ camera, refreshOutline, checkmarkCircle, alertCircle });
    this.listenToIoT();
  }

  async ngOnInit() {
    await this.initAI();
    this.startLiveCamera();
  }

  ngOnDestroy() {
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
      toBack: false,
      width: window.innerWidth,
      height: 380, // Match SCSS height
    };
    await CameraPreview.start(options);
    this.isCameraActive = true;
  }

  listenToIoT() {
    this.firebaseService.getLivePlateData('plate_01').subscribe(data => {
      if (data) {
        this.p1Weight = data.p1 || 0;
        this.p2Weight = data.p2 || 0;
        this.p3Weight = data.p3 || 0;
      }
    });
  }

  get isAligned(): boolean {
    return this.p1Weight > this.ALIGNMENT_THRESHOLD && 
           this.p2Weight > this.ALIGNMENT_THRESHOLD && 
           this.p3Weight > this.ALIGNMENT_THRESHOLD;
  }

  async captureImage() {
    const result = await CameraPreview.capture({ quality: 85 });
    this.photo = `data:image/jpeg;base64,${result.value}`;
    this.isCameraActive = false;
    await CameraPreview.stop();
    this.analyzePlate(this.photo);
  }

  async analyzePlate(base64: string) {
    const img = new Image();
    img.src = base64;
    img.onload = async () => {
      const pred = await this.model.classify(img);
      const mainFood = pred[0].className.split(',')[0].toLowerCase();
      const labels = [mainFood, 'chicken', 'broccoli'];
      const weights = [this.p1Weight, this.p2Weight, this.p3Weight];
      
      this.portions = labels.map((name, i) => this.calculateGL(name, weights[i]));
    };
  }

  calculateGL(foodName: string, weight: number): MealPortion {
    // Basic logic - can be expanded with NUTRITION_DB
    const gl = (50 * (weight * 0.2)) / 100; 
    let status = gl > 15 ? 'TOO MUCH' : 'NORMAL';
    return {
      label: foodName,
      weight: weight,
      gl: gl,
      status: status,
      color: status === 'NORMAL' ? 'success' : 'danger',
      advice: status === 'NORMAL' ? 'Safe portion.' : `Reduce ${foodName} weight.`
    };
  }

  get canLog() { return this.portions.every(p => p.status === 'NORMAL'); }

  async confirmAndSave() {
    const mealData: MealData = {
      userId: '',
      timestamp: Date.now(),
      items: this.portions,
      totalWeight: this.p1Weight + this.p2Weight + this.p3Weight,
      totalGL: this.portions.reduce((sum, p) => sum + p.gl, 0),
      imageUrl: this.photo
    };
    await this.firebaseService.addMeal(mealData);
    this.router.navigate(['/home']);
  }

  restartScan() {
    this.photo = undefined;
    this.portions = [];
    this.startLiveCamera();
  }
}