import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular'; // 1. Import this

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [
    IonicModule, // 2. Add this to the imports array
    CommonModule
  ]
})
export class ProfilePage implements OnInit {
  constructor() { }

  ngOnInit() { }
}