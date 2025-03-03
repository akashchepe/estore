import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { CognitoUser, AuthenticationDetails, CognitoUserPool } from "amazon-cognito-identity-js";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username: string = 'ac3405';
  password: string = 'Test@123456789';
  mfaCode: string = '';
  isMfaRequired: boolean = false;
  session: string = "";

     userPoolId = 'eu-west-1_uF71SgNIE';
     clientId = '1hesrkm76r08f7gq7hbgufhkgi';

  constructor(private authService: AuthService) { }

  onLogin() {
    this.authService.authenticate(this.username, this.password).then(response => {
      
      // Call the function with user credentials
     authenticateUser(this.username, this.password);
      

      // if (response.isMfaRequired) {
      //   this.isMfaRequired = true;
      //   this.session = response.session;
      // }
    });
  }

  onMfaSubmit() {
    this.authService.respondToMfaChallenge(this.session, this.mfaCode).then(response => {
      // Handle successful MFA
    });
  }
}
function authenticateUser(username: string, password: string) {
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

