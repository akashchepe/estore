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


  async authenticateUser(username: string, password: string): Promise<any> {
    const authenticationData = {
      Username: username,
      Password: password,
    };
    const authenticationDetails = new AuthenticationDetails(authenticationData);
    const poolData = {
      UserPoolId: 'eu-west-1_uF71SgNIE',
      ClientId: '1hesrkm76r08f7gq7hbgufhkgi',
    };
    const userPool = new CognitoUserPool(poolData);
    const userData = {
      Username: username,
      Pool: userPool,
    };
    const cognitoUser = new CognitoUser(userData);
  
    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (result) => {
        console.log('Authentication successful:', result);
      },
      onFailure: (err) => {
        console.error('Authentication failed:', err);
      },
      mfaRequired: (codeDeliveryDetails) => {
        console.log('MFA required:', codeDeliveryDetails);
      },
    });
  }


  isAuthenticated(): boolean {
    // Retrieve the access token from local storage
    const accessToken = localStorage.getItem('accessToken');
    // Return true if the access token exists, indicating the user is authenticated
    return !!accessToken;
  }

}
