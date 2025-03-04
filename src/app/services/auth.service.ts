import { Injectable } from '@angular/core';
import { CognitoIdentityProviderClient, InitiateAuthCommand, RespondToAuthChallengeCommand, AssociateSoftwareTokenCommand, VerifySoftwareTokenCommand } from '@aws-sdk/client-cognito-identity-provider';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private client = new CognitoIdentityProviderClient({ region: 'eu-central-1' });
  private clientId = '4gca0d9hmn8eojvmruv49gvb9m';

  constructor() { }

  async authenticateUser(username: string, password: string): Promise<any> {
    const command = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
      },
      ClientId: this.clientId,
    });

    try {
      const response = await this.client.send(command);
      if (response.ChallengeName === 'SMS_MFA' || response.ChallengeName === 'SOFTWARE_TOKEN_MFA') {
        console.log('MFA required:', response.ChallengeParameters);
        // Handle MFA challenge
        if (response.Session) {
          this.handleMfaChallenge(response.Session);
        } else {
          console.error('Session is undefined');
        }
      } else if (response.ChallengeName === 'MFA_SETUP') {
        console.log('MFA setup required:', response.ChallengeParameters);
        // Handle MFA setup
        if (response.Session) {
          this.handleMfaSetup(response.Session);
        } else {
          console.error('Session is undefined');
        }
      } else {
        console.log('Authentication successful:', response.AuthenticationResult);
        // Store tokens in local storage
        localStorage.setItem('accessToken', response.AuthenticationResult?.AccessToken || '');
        localStorage.setItem('idToken', response.AuthenticationResult?.IdToken || '');
        localStorage.setItem('refreshToken', response.AuthenticationResult?.RefreshToken || '');
      }
    } catch (error) {
      console.error('Authentication failed:', error);
    }
  }

  private handleMfaChallenge(session: string) {
    // Implement logic to handle MFA challenge, e.g., prompt user for MFA code
    // For example, you can store the session and prompt the user to enter the MFA code
  }

  private async handleMfaSetup(session: string) {
    try {
      const response = await this.associateSoftwareToken(session);
      console.log('MFA setup response:', response);
      // Display the secret code to the user to configure their TOTP authenticator app
      const secretCode = response.SecretCode;
      alert(`Scan this QR code with your Google Authenticator app: otpauth://totp/YourAppName?secret=${secretCode}`);
      // Prompt user to enter the MFA code from their authenticator app
      const mfaCode = prompt('Enter the MFA code from your authenticator app:');
      if (mfaCode) {
        const isVerified = await this.verifyMfaToken(session, mfaCode);
        if (isVerified) {
          console.log('MFA setup and verification successful');
        } else {
          console.error('MFA verification failed');
        }
      }
    } catch (error) {
      console.error('Error during MFA setup:', error);
    }
  }

  async respondToMfaChallenge(session: string, mfaCode: string): Promise<any> {
    const command = new RespondToAuthChallengeCommand({
      ChallengeName: 'SMS_MFA',
      ChallengeResponses: {
        USERNAME: 'your-username', // Replace with the actual username
        SMS_MFA_CODE: mfaCode,
      },
      ClientId: this.clientId,
      Session: session,
    });

    try {
      const response = await this.client.send(command);
      console.log('MFA challenge response:', response);
      // Store tokens in local storage
      localStorage.setItem('accessToken', response.AuthenticationResult?.AccessToken || '');
      localStorage.setItem('idToken', response.AuthenticationResult?.IdToken || '');
      localStorage.setItem('refreshToken', response.AuthenticationResult?.RefreshToken || '');
    } catch (error) {
      console.error('Error responding to MFA challenge:', error);
    }
  }

  async associateSoftwareToken(session: string): Promise<any> {
    const command = new AssociateSoftwareTokenCommand({
      Session: session,
    });

    try {
      const response = await this.client.send(command);
      console.log('AssociateSoftwareToken response:', response);
      return response;
    } catch (error) {
      console.error('Error associating software token:', error);
      throw error;
    }
  }

  async verifyMfaToken(session: string, mfaCode: string): Promise<boolean> {
    const command = new VerifySoftwareTokenCommand({
      Session: session,
      UserCode: mfaCode,
      FriendlyDeviceName: 'AngularAppDevice',
    });

    try {
      const response = await this.client.send(command);
      return response.Status === 'SUCCESS';
    } catch (error) {
      console.error('MFA verification error:', error);
      return false;
    }
  }

  isAuthenticated(): boolean {
    // Retrieve the access token from local storage
    const accessToken = localStorage.getItem('accessToken');
    // Return true if the access token exists, indicating the user is authenticated
    return !!accessToken;
  }
}