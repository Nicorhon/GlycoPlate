import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonToolbar, IonTitle, IonItem, 
  IonLabel, IonInput, IonButton, IonIcon, IonList,
  IonSelect, IonSelectOption, IonToast 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  mailOutline, lockClosedOutline, logInOutline, personAddOutline,
  mailUnreadOutline, personOutline, checkmarkCircleOutline, 
  cloudUploadOutline, pulseOutline
} from 'ionicons/icons';
import { FirebaseService } from '../../services/firebase.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonHeader, IonToolbar, 
    IonTitle, IonItem, IonLabel, IonInput, IonButton, IonIcon, IonList,
    IonSelect, IonSelectOption, IonToast 
  ],
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss']
})
export class AuthPage {
  private fb = inject(FirebaseService);
  private router = inject(Router);

  email = '';
  password = '';
  isLogin = true;

  // Track page flow state
  authState: 'credentials' | 'verify' | 'profile' = 'credentials';

  // Target Health Metrics Storage
  healthProfile = {
    displayName: '',
    condition: ''
  };

  // Toast State Management
  isToastOpen = false;
  toastMessage = '';
  toastColor = 'dark';

  constructor() {
    addIcons({ 
      mailOutline, lockClosedOutline, logInOutline, personAddOutline,
      mailUnreadOutline, personOutline, checkmarkCircleOutline, 
      cloudUploadOutline, pulseOutline
    });
  }

  // FIX: Fires every time the page becomes active to prevent old data leaks
  ionViewWillEnter() {
    this.resetAuthPage();
  }

  // Form Reset Utility
  resetAuthPage() {
    this.email = '';
    this.password = '';
    this.isLogin = true;
    this.authState = 'credentials'; // Instantly restores the email/password state
    this.healthProfile = {
      displayName: '',
      condition: ''
    };
  }

  // Toast Utility Trigger
  showToast(message: string, color: 'success' | 'danger' | 'warning' | 'dark' = 'dark') {
    this.toastMessage = message;
    this.toastColor = color;
    this.isToastOpen = true;
  }

  async handleAuth() {
    if (!this.email || !this.password) {
      this.showToast('Please fill in all fields', 'warning');
      return;
    }

    try {
      if (this.isLogin) {
        // --- LOGIN FLOW ---
        const userCredential = await this.fb.login(this.email, this.password);
        
        // Block access if email verification is outstanding
        if (!userCredential.user?.emailVerified) {
          this.showToast('Please verify your email before logging in.', 'warning');
          this.authState = 'verify';
          return;
        }

        // Double check if health profile meta details exist in realtime db
        const hasProfile = await this.fb.checkProfileExists(userCredential.user.uid);
        if (!hasProfile) {
          this.authState = 'profile';
        } else {
          this.showToast('Welcome back to GlycoPlate!', 'success');
          this.router.navigate(['/tabs/home']);
        }

      } else {
        // --- SIGN UP FLOW ---
        await this.fb.signUp(this.email, this.password);
        // Send the native Firebase verification link via service trigger
        await this.fb.sendVerificationLink();
        
        this.showToast('Verification email dispatched! Please check your inbox.', 'success');
        // Push view immediately to step 2 verification check block
        this.authState = 'verify';
      }
      
    } catch (e: any) {
      console.error("Auth Error:", e);
      this.showToast(e.message || 'Authentication failed.', 'danger');
    }
  }

  async checkVerificationStatus() {
    try {
      const isVerified = await this.fb.reloadAndCheckVerification();
      if (isVerified) {
        this.showToast('Email confirmed successfully! Let\'s build your profile.', 'success');
        this.authState = 'profile';
      } else {
        this.showToast('Email not verified yet. Please click the link sent to your email address.', 'warning');
      }
    } catch (e: any) {
      this.showToast(e.message || 'Error checking verification status.', 'danger');
    }
  }

  async resendVerificationEmail() {
    try {
      await this.fb.sendVerificationLink();
      this.showToast('A new verification email has been dispatched.', 'success');
    } catch (e: any) {
      this.showToast(e.message || 'Failed to send verification link.', 'danger');
    }
  }

  async saveHealthProfile() {
    if (!this.healthProfile.displayName.trim()) {
      this.showToast('Please input your name to finalize your health profile.', 'warning');
      return;
    }
    if (!this.healthProfile.condition) {
      this.showToast('Please select a monitoring condition.', 'warning');
      return;
    }

    try {
      // Save data under users/${uid}/profile node via backend service injection
      await this.fb.saveUserProfileData(this.healthProfile);
      this.showToast('Health profile configured successfully!', 'success');
      this.router.navigate(['/tabs/home']);
    } catch (e: any) {
      this.showToast('Failed saving metadata profile: ' + e.message, 'danger');
    }
  }
}