import { Injectable } from '@angular/core';
import { CognitoIdentityProviderClient, InitiateAuthCommand, RespondToAuthChallengeCommand, AssociateSoftwareTokenCommand, VerifySoftwareTokenCommand, SetUserMFAPreferenceCommand, AdminUpdateUserAttributesCommand } from '@aws-sdk/client-cognito-identity-provider';
import * as QRCode from 'qrcode';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private client = new CognitoIdentityProviderClient({ region: 'eu-central-1' });
  private clientId = '4gca0d9hmn8eojvmruv49gvb9m';
  private userPoolId = 'eu-central-1_example'; // Replace with your user pool ID

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
          return { isMfaRequired: true, session: response.Session, username };
        } else {
          console.error('Session is undefined');
        }
      } else if (response.ChallengeName === 'MFA_SETUP') {
        console.log('MFA setup required:', response.ChallengeParameters);
        // Handle MFA setup
        if (response.Session) {
          const qrCodeUrl = await this.handleMfaSetup(response.Session);
          return { isMfaSetupRequired: true, qrCodeUrl, session: response.Session, username };
        } else {
          console.error('Session is undefined');
        }
      } else {
        console.log('Authentication successful:', response.AuthenticationResult);
        // Store tokens in local storage
        localStorage.setItem('accessToken', response.AuthenticationResult?.AccessToken || '');
        localStorage.setItem('idToken', response.AuthenticationResult?.IdToken || '');
        localStorage.setItem('refreshToken', response.AuthenticationResult?.RefreshToken || '');
        return { isAuthenticated: true };
      }
    } catch (error) {
      console.error('Authentication failed:', error);
      return { isAuthenticated: false };
    }
  }

  private async handleMfaSetup(session: string): Promise<string> {
    try {
      const response = await this.associateSoftwareToken(session);
      console.log('MFA setup response:', response);
      // Display the secret code to the user to configure their TOTP authenticator app
      const secretCode = response.SecretCode;
      const otpauthUrl = `otpauth://totp/EStore?secret=${secretCode}`;

      // Generate QR code
      const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
      return qrCodeDataUrl;
    } catch (error) {
      console.error('Error during MFA setup:', error);
      throw error;
    }
  }

  async respondToMfaChallenge(username: string, session: string, mfaCode: string): Promise<any> {
    const command = new RespondToAuthChallengeCommand({
      ChallengeName: 'SOFTWARE_TOKEN_MFA',
      ChallengeResponses: {
        USERNAME: username,
        SOFTWARE_TOKEN_MFA_CODE: mfaCode,
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
      return { isAuthenticated: true };
    } catch (error) {
      console.error('Error responding to MFA challenge:', error);
      return { isAuthenticated: false };
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

  async setUserMfaPreference(username: string, accessToken: string, enableMfa: boolean): Promise<void> {
    const command = new SetUserMFAPreferenceCommand({
      AccessToken: accessToken,
      SoftwareTokenMfaSettings: {
        Enabled: enableMfa,
        PreferredMfa: enableMfa,
      },
    });

    try {
      await this.client.send(command);
      console.log(`MFA ${enableMfa ? 'enabled' : 'disabled'} for user: ${username}`);
    } catch (error) {
      console.error(`Error setting MFA preference for user: ${username}`, error);
      throw error;
    }
  }

  async updateUserAttributes(username: string, attributes: { Name: string, Value: string }[]): Promise<void> {
    const command = new AdminUpdateUserAttributesCommand({
      UserPoolId: this.userPoolId,
      Username: username,
      UserAttributes: attributes,
    });

    try {
      await this.client.send(command);
      console.log(`User attributes updated for user: ${username}`);
    } catch (error) {
      console.error(`Error updating user attributes for user: ${username}`, error);
      throw error;
    }
  }

  isAuthenticated(): boolean {
    // Retrieve the access token from local storage
    const accessToken = localStorage.getItem('accessToken');
    // Return true if the access token exists, indicating the user is authenticated
    return !!accessToken;
  }
}