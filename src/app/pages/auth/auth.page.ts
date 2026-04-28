import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonToolbar, IonTitle, IonItem, 
  IonLabel, IonInput, IonButton, IonIcon, IonList 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  mailOutline, 
  lockClosedOutline, 
  logInOutline, 
  personAddOutline 
} from 'ionicons/icons';
import { FirebaseService } from '../../services/firebase.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    IonContent, IonHeader, IonToolbar, IonTitle, IonItem, 
    IonLabel, IonInput, IonButton, IonIcon, IonList
  ],
  templateUrl: './auth.page.html', // Pointing to your newly designed HTML file
  styleUrls: ['./auth.page.scss']   // Pointing to your custom palette SCSS
})
export class AuthPage {
  private fb = inject(FirebaseService);
  private router = inject(Router);

  email = '';
  password = '';
  isLogin = true;

  constructor() {
    // Registering the icons for the new design
    addIcons({ 
      mailOutline, 
      lockClosedOutline, 
      logInOutline, 
      personAddOutline 
    });
  }

  async handleAuth() {
    if (!this.email || !this.password) {
      alert('Please fill in all fields');
      return;
    }

    try {
      if (this.isLogin) {
        // Handle Login
        await this.fb.login(this.email, this.password);
      } else {
        // Handle Registration
        await this.fb.signUp(this.email, this.password);
      }
      
      // Navigate to the tabs layout where the navbar lives
      this.router.navigate(['/tabs/history']);
      
    } catch (e: any) {
      // Direct and simple error handling for the demo
      console.error("Auth Error:", e);
      alert(e.message);
    }
  }
}