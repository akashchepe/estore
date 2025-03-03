import { Injectable } from '@angular/core';
import { CognitoIdentityProviderClient, InitiateAuthCommand, RespondToAuthChallengeCommand, AssociateSoftwareTokenCommand, VerifySoftwareTokenCommand } from '@aws-sdk/client-cognito-identity-provider';
import { AuthenticationDetails, CognitoUser, CognitoUserPool } from 'amazon-cognito-identity-js';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private client = new CognitoIdentityProviderClient({ region: 'eu-west-1' });
  private userPoolId = 'eu-west-1_uF71SgNIE';
  private clientId = '1hesrkm76r08f7gq7hbgufhkgi';

  constructor() { }


  async authenticate(username: string, password: string): Promise<any> {
      // Replace these values with your actual User Pool ID and App Client ID
      // const poolData = {
      //   UserPoolId: 'eu-west-1_uF71SgNIE', // e.g., "us-east-1_AbCdEfGhI"
      //   ClientId: '1hesrkm76r08f7gq7hbgufhkgi', // e.g., "123abc456def789ghi012jkl"
      // };
      
      // const userPool = new CognitoUserPool(poolData);
      
      // // Function to authenticate user using SRP
      // const authenticateUser = (username: string, password: string) => {
      //   const authenticationDetails = new AuthenticationDetails({
      //     Username: username,
      //     Password: password,
      //   });
      
      //   const cognitoUser = new CognitoUser({
      //     Username: username,
      //     Pool: userPool,
      //   });
      //   cognitoUser
      //   cognitoUser.authenticateUser(authenticationDetails, {
      //     onSuccess: (session) => {
      //       console.log("Authentication successful!");
      //       console.log("ID Token:", session.getIdToken().getJwtToken());
      //       console.log("Access Token:", session.getAccessToken().getJwtToken());
      //       console.log("Refresh Token:", session.getRefreshToken().getToken());
      //     },
      //     onFailure: (err) => {
      //       console.error("Authentication failed:", err);
      //     },
      //   });
      // };
  }

  // async authenticate(username: string, password: string): Promise<any> {
  //   const authCommand = new InitiateAuthCommand({
  //     AuthFlow: 'USER_PASSWORD_AUTH',
  //     AuthParameters: {
  //       USERNAME: username,
  //       PASSWORD: password
  //     },
  //     ClientId: this.clientId
  //   });

  //   try {
  //     const data = await this.client.send(authCommand);
  //     if (data.ChallengeName === 'MFA_SETUP') {
  //       // Handle MFA setup
  //       return { isMfaRequired: true, session: data.Session };
  //     } else if (data.ChallengeName === 'SOFTWARE_TOKEN_MFA') {
  //       // Prompt user for MFA code
  //       return { isMfaRequired: true, session: data.Session };
  //     }
  //     // Store tokens in local storage
  //     if (data.AuthenticationResult) {
  //       if (data.AuthenticationResult.AccessToken) {
  //         localStorage.setItem('accessToken', data.AuthenticationResult.AccessToken);
  //       }
  //       if (data.AuthenticationResult.IdToken) {
  //         localStorage.setItem('idToken', data.AuthenticationResult.IdToken);
  //       }
  //       if (data.AuthenticationResult.RefreshToken) {
  //         localStorage.setItem('refreshToken', data.AuthenticationResult.RefreshToken);
  //       }
  //     }
  //     return { isMfaRequired: false };
  //   } catch (error) {
  //     console.error('Authentication error:', error);
  //     return { isMfaRequired: false };
  //   }
  // }

  async respondToMfaChallenge(session: string, mfaCode: string): Promise<any> {
    const challengeCommand = new RespondToAuthChallengeCommand({
      ChallengeName: 'SOFTWARE_TOKEN_MFA',
      ChallengeResponses: {
        SOFTWARE_TOKEN_MFA_CODE: mfaCode,
        USERNAME: 'your-username'
      },
      ClientId: this.clientId,
      Session: session
    });

    try {
      const data = await this.client.send(challengeCommand);
      // Store tokens in local storage
      if (data.AuthenticationResult) {
        if (data.AuthenticationResult.AccessToken) {
          localStorage.setItem('accessToken', data.AuthenticationResult.AccessToken);
        }
        if (data.AuthenticationResult.IdToken) {
          localStorage.setItem('idToken', data.AuthenticationResult.IdToken);
        }
        if (data.AuthenticationResult.RefreshToken) {
          localStorage.setItem('refreshToken', data.AuthenticationResult.RefreshToken);
        }
      }
      return { isMfaRequired: false };
    } catch (error) {
      console.error('MFA challenge response error:', error);
      return { isMfaRequired: true, session };
    }
  }

  async setupMfa(): Promise<any> {
    const command = new AssociateSoftwareTokenCommand({});
    try {
      const data = await this.client.send(command);
      return { mfaSecret: data.SecretCode, session: data.Session };
    } catch (error) {
      console.error('MFA setup error:', error);
      return null;
    }
  }

  async verifyMfaToken(session: string, mfaCode: string): Promise<boolean> {
    const command = new VerifySoftwareTokenCommand({
      Session: session,
      UserCode: mfaCode,
      FriendlyDeviceName: 'AngularAppDevice'
    });
    try {
      const data = await this.client.send(command);
      return data.Status === 'SUCCESS';
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
