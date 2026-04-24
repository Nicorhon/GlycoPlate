import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton, 
  IonIcon, IonChip, IonLabel, ModalController 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkCircle, refreshOutline } from 'ionicons/icons';

@Component({
  selector: 'app-meal-result-modal',
  standalone: true,
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon, IonChip, IonLabel],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Verify Meal</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <img [src]="photo" style="width: 100%; border-radius: 15px; margin-bottom: 20px;" />
      
      <div *ngFor="let p of portions" class="portion-item">
        <ion-chip [color]="p.gl > 15 ? 'danger' : 'success'">
          <ion-label><strong>{{p.label | titlecase}}</strong>: {{p.gl | number:'1.1-1'}} GL</ion-label>
        </ion-chip>
      </div>

      <ion-button expand="block" color="success" (click)="save()" class="ion-margin-top">
        <ion-icon slot="start" name="checkmark-circle"></ion-icon> LOG MEAL
      </ion-button>
      <ion-button expand="block" fill="outline" color="medium" (click)="dismiss(true)">
        <ion-icon slot="start" name="refresh-outline"></ion-icon> RETAKE
      </ion-button>
    </ion-content>
  `
})
export class MealResultModal {
  @Input() photo!: string;
  @Input() portions!: any[];
  private modalCtrl = inject(ModalController);

  constructor() { addIcons({ checkmarkCircle, refreshOutline }); }

  dismiss(retry = false) { this.modalCtrl.dismiss({ retry }); }
  save() { /* Your Firebase save logic here */ this.dismiss(); }
}