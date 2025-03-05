import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username: string = 'ac8180';
  password: string = 'Test@123456789';
  isMfaRequired: boolean = false;
  isMfaSetupRequired: boolean = false;
  qrCodeUrl: string | null = null;
  mfaCode: string = '';
  session: string | null = null;
  enableMfa: boolean = false;

  constructor(private authService: AuthService) { }

  async onLogin() {
    const response = await this.authService.authenticateUser(this.username, this.password);
    if (response.isMfaRequired) {
      this.isMfaRequired = true;
      this.session = response.session;
    } else if (response.isMfaSetupRequired) {
      this.isMfaSetupRequired = true;
      this.qrCodeUrl = response.qrCodeUrl;
      this.session = response.session;
    } else if (response.isAuthenticated) {
      console.log('Login successful');
      if (this.enableMfa) {
        // Ensure the user has a verified email or phone number
        await this.authService.updateUserAttributes(this.username, [
          { Name: 'email_verified', Value: 'true' },
          { Name: 'phone_number_verified', Value: 'true' }
        ]);
        await this.authService.setUserMfaPreference(this.username, localStorage.getItem('accessToken')!, true);
      }
    } else {
      console.error('Login failed');
    }
  }

  async verifyMfaCode() {
    if (this.session && this.mfaCode) {
      const isVerified = await this.authService.verifyMfaToken(this.session, this.mfaCode);
      if (isVerified) {
        console.log('MFA setup and verification successful');
        this.isMfaSetupRequired = false;
        this.isMfaRequired = false;
      } else {
        console.error('MFA verification failed');
      }
    }
  }

  async onMfaSubmit() {
    if (this.session && this.mfaCode) {
      const response = await this.authService.respondToMfaChallenge(this.username, this.session, this.mfaCode);
      if (response.isAuthenticated) {
        console.log('MFA challenge response successful');
        this.isMfaRequired = false;
      } else {
        console.error('MFA challenge response failed');
      }
    }
  }
}