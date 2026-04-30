import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton, 
  IonIcon, IonChip, IonLabel, IonList, IonItem, IonBadge, IonThumbnail
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkCircle, refreshOutline, alertCircle } from 'ionicons/icons';
import { ModalController } from '@ionic/angular/standalone';

@Component({
  selector: 'app-meal-result-modal',
  standalone: true,
  imports: [
    CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, 
    IonButton, IonIcon, IonChip, IonLabel, IonList, IonItem, 
    IonBadge, IonThumbnail
  ],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar color="primary">
        <ion-title style="font-weight: 700;">VERIFY MEAL</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="image-container" style="position: relative; margin-bottom: 20px;">
        <img [src]="photo" style="width: 100%; border-radius: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);" />
      </div>
      
      <ion-list lines="full">
        <ion-item *ngFor="let p of portions" style="--padding-start: 0;">
          <ion-icon slot="start" 
            [name]="p.status === 'NORMAL' ? 'checkmark-circle' : 'alert-circle'" 
            [color]="p.color" 
            style="font-size: 24px;">
          </ion-icon>
          
          <ion-label>
            <h2 style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
              <strong>{{ p.label | titlecase }}</strong>
              <ion-badge color="light">{{ p.weight }}g</ion-badge>
            </h2>
            
            <div style="display: flex; gap: 10px; margin-bottom: 5px;">
              <ion-badge color="primary" mode="ios" style="font-size: 0.75em; padding: 4px 8px;">
                GI: {{ p.gi }}
              </ion-badge>
              <ion-badge [color]="p.color" mode="ios" style="font-size: 0.75em; padding: 4px 8px;">
                GL: {{ p.gl }}
              </ion-badge>
            </div>
            
            <p [style.color]="p.status === 'TOO MUCH' ? 'var(--ion-color-danger)' : 'var(--ion-color-medium)'" 
               style="font-size: 0.85em; margin: 0;">
              {{ p.advice }}
            </p>
          </ion-label>
        </ion-item>
      </ion-list>

      <div class="ion-margin-top">
        <ion-button expand="block" color="success" (click)="save()" style="--border-radius: 12px; height: 50px; font-weight: 700;">
          <ion-icon slot="start" name="checkmark-circle"></ion-icon> 
          CONFIRM & LOG MEAL
        </ion-button>
        
        <ion-button expand="block" fill="clear" color="medium" (click)="dismiss(true)" class="ion-margin-top">
          <ion-icon slot="start" name="refresh-outline"></ion-icon> 
          RETAKE PHOTO
        </ion-button>
      </div>
    </ion-content>
  `
})
export class MealResultModal {
  @Input() photo!: string;
  @Input() portions!: any[];
  private modalCtrl = inject(ModalController);

  constructor() { 
    addIcons({ checkmarkCircle, refreshOutline, alertCircle }); 
  }

  dismiss(retry = false) { 
    this.modalCtrl.dismiss({ retry }); 
  }

  save() { 
    // Logic to emit save event back to parent or service
    this.modalCtrl.dismiss({ save: true }); 
  }
}