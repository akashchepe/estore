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
    this.authService.authenticateUser(this.username, this.password).then(response => {

      if (response) {
        console.log(response);
        // this.isMfaRequired = true;
        // this.session = response.session;
      }
    });
  }

  onMfaSubmit() {
    // this.authService.respondToMfaChallenge(this.session, this.mfaCode).then(response => {
    //   // Handle successful MFA
    // });
  }
}