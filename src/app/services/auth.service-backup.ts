import { Injectable } from '@angular/core';
import { CognitoIdentityProviderClient, InitiateAuthCommand, RespondToAuthChallengeCommand, AssociateSoftwareTokenCommand, VerifySoftwareTokenCommand } from '@aws-sdk/client-cognito-identity-provider';
import { AuthenticationDetails, CognitoUser, CognitoUserPool } from 'amazon-cognito-identity-js';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private client = new CognitoIdentityProviderClient({ region: 'eu-west-1' });
    //  userPoolId = 'eu-west-1_uF71SgNIE';
    //  clientId = '1hesrkm76r08f7gq7hbgufhkgi';

    userPoolId = 'eu-central-1_ddX92kkAd';
    clientId = '4gca0d9hmn8eojvmruv49gvb9m';

  constructor() { }


  async authenticateUser(username: string, password: string): Promise<any> {
    const authenticationData = {
      Username: username,
      Password: password,
    };
    const authenticationDetails = new AuthenticationDetails(authenticationData);
    const poolData = {
      UserPoolId: this.userPoolId,
      ClientId: this.clientId,
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
        // Handle MFA challenge
        this.handleMfaChallenge(cognitoUser);
      },
    });
  }

  private handleMfaChallenge(cognitoUser: CognitoUser) {
    // Implement logic to handle MFA challenge, e.g., prompt user for MFA code
    // For example, you can store the cognitoUser object and prompt the user to enter the MFA code
  }

  async respondToMfaChallenge(cognitoUser: CognitoUser, mfaCode: string): Promise<any> {
    const challengeResponses = {
      USERNAME: cognitoUser.getUsername(),
      SMS_MFA_CODE: mfaCode,
    };
    const params = {
      ChallengeName: 'SMS_MFA',
      ClientId: this.clientId,
      ChallengeResponses: challengeResponses,
      Session: cognitoUser.getSignInUserSession()?.getIdToken().getJwtToken(),
    };
    // const command = new RespondToAuthChallengeCommand(params);
    // try {
    //   const response = await this.client.send(command);
    //   console.log('MFA challenge response:', response);
    //   // Handle successful MFA response
    // } catch (error) {
    //   console.error('Error responding to MFA challenge:', error);
    // }
  }

  isAuthenticated(): boolean {
    // Retrieve the access token from local storage
    const accessToken = localStorage.getItem('accessToken');
    // Return true if the access token exists, indicating the user is authenticated
    return !!accessToken;
  }

}
