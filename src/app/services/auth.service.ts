import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireAuth} from '@angular/fire/compat/auth';
import { AngularFirestore, AngularFirestoreDocument 
} from '@angular/fire/compat/firestore';

import { User } from './users.model';

import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { SignatureAllModule } from '@syncfusion/ej2-angular-inputs';
import { resolve } from 'dns';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import { AngularFireObject } from '@angular/fire/compat/database';
@Injectable({
  providedIn: 'root'
})

export class AuthService {
  // userData: Observable<User | null | undefined>; // Save logged in user data
  userData: any;
  errorMSG: string = '';
  authState: any;
  private fireUser: any;
  constructor(
    public afs: AngularFirestore, // Inject Firestore service
    public afAuth: AngularFireAuth, // Inject Firebase auth service
    public router: Router,
    public ngZone: NgZone // NgZone service to remove outside scope warning
  ) {
    /* Saving user data in localstorage when 
    logged in and setting up null when logged out */
    this.afAuth.authState.subscribe((user) => {
      this.authState = user;
      this.SetUserData(user);
      if (user) {
        this.userData = user;
        localStorage.setItem('user', JSON.stringify(this.userData));
        JSON.parse(localStorage.getItem('user')!);
      } else {
        localStorage.setItem('user', 'null');
        JSON.parse(localStorage.getItem('user')!);
      }
    });

  }


  // Sign in with email/password
  SignIn(email: string, password: string) {
    return this.afAuth
      .signInWithEmailAndPassword(email, password)
      .then((result) => {
        this.ngZone.run(() => {
          this.SetUserData(result.user);
          this.setUser(result.user);
          this.router.navigate(['redirect']);
        });
        this.SetUserData(result.user);
        this.setUser(result.user);
      })
      .catch((error) => {
        // window.alert(error.message);
        this.errorMSG = this.getErrCode(error);
      });
  }

  // Sign up with email/password
  SignUp(fName: string, mail: string, cellP: string, pass: string, perm: number) {
    return this.afAuth
      .createUserWithEmailAndPassword(mail, pass)
      .then((result) => {
        /* Call the SendVerificaitonMail() function when new user sign 
        up and returns promise */
        // this.SendVerificationMail();
        const currentUser: User = {
          uid: result.user!.uid,
          fullName: fName,
          email: mail,
          password: pass,
          phone: cellP,
          permission: 0,
          timeframe: "7am - 6pm",
          days: "Mon - Fri"
        }
        this.SetUserData(currentUser);
        this.router.navigate(['redirect']);
      })
      .catch((error) => {
        window.alert("Password should be at least 6 characters.");
        this.errorMSG = "Please enter valid Email"
      });
  }

  // Returns true when user is logged in and email is verified
  get isLoggedIn(): boolean {
    const user = JSON.parse(localStorage.getItem('user')!);
    return user !== null
  }

  get currentUserId(): string {
    return this.isAuthenticated ? this.authState.uid : null;
  }

  get isAuthenticated(): boolean {
    return this.authState !== null;
  }

  async getPermission(id: any) {
    let data = this.getUserData(id);
    return await new Promise(async (resolve) => {
      data.subscribe((val) => {
        resolve(val.permission);
      });
    });
  }

  setUser(user) {
    this.fireUser = user;
  }

  getAuthenticated(): Observable<any> {
    return this.afAuth.user;
  }
  get error(): string {
    return this.errorMSG;
  }


  /* Setting up user data when sign in with username/password, 
  sign up with username/password and sign in with social auth  
  provider in Firestore database using AngularFirestore + AngularFirestoreDocument service */

  getUserData(id: any): Observable<User> {
    const users: AngularFirestoreDocument<any> = this.afs.doc(
      `users/${id}`);
    return users.snapshotChanges()
      .pipe(
        map(changes => {
          const data = changes.payload.data();
          const id = changes.payload.id;
          return { id, ...data };
        }))
  }



  SetUserData(user: any) {
    let userData: User = {
      uid: user.uid,
      fullName: user.fullName,
      email: user.email,
      password: user.password,
      phone: user.phone,
      permission: user.permission,
      timeframe: user.timeframe,
      days: user.days
    };

    let data = this.getUserData(user.uid);
    const userRef: AngularFirestoreDocument<any> = this.afs.doc(
      `users/${user.uid}`);

    firebase.auth().fetchSignInMethodsForEmail(user.email)
      .then((signInMethods) => {
        //email exists
        if (signInMethods.length) {
          let subscription = data.subscribe((val) => { userData.uid = val.uid,
            userData.fullName = val.fullName,
            userData.email = val.email,
            userData.password = val.password,
            userData.phone = val.phone,
            userData.permission = val.permission,
            userData.timeframe = val.timeframe,
            userData.days = val.days
          });
          this.finalizeSet(userRef, userData);
          subscription.unsubscribe();
        }
      }).catch((error) => {
        this.errorMSG = "Please enter valid Email"
      });
  }

  finalizeSet(userRef: any, userData: any){
    return userRef.set(userData, {
      merge: true,
    });
  }
  // Sign out
  SignOut() {
    return this.afAuth.signOut().then(() => {
      localStorage.removeItem('user');
      this.router.navigate(['login']);
    });
  }

  getErrCode(errorCode: string): string {
    let message: string;
    switch (errorCode) {
      case 'auth/wrong-password':
        message = 'Invalid login credentials.';
        break;
      case 'auth/network-request-failed':
        message = 'Please check your internet connection';
        break;
      case 'auth/too-many-requests':
        message =
          'We have detected too many requests from your device. Take a break please!';
        break;
      case 'auth/user-disabled':
        message =
          'Your account has been disabled or deleted. Please contact the system administrator.';
        break;
      case 'auth/requires-recent-login':
        message = 'Please login again and try again!';
        break;
      case 'auth/email-already-exists':
        message = 'Email address is already in use by an existing user.';
        break;
      case 'auth/user-not-found':
        message =
          'We could not find user account associated with the email address or phone number.';
        break;
      case 'auth/phone-number-already-exists':
        message = 'The phone number is already in use by an existing user.';
        break;
      case 'auth/invalid-phone-number':
        message = 'The phone number is not a valid phone number!';
        break;
      case 'auth/invalid-email  ':
        message = 'The email address is not a valid email address!';
        break;
      case 'auth/cannot-delete-own-user-account':
        message = 'You cannot delete your own user account.';
        break;
      default:
        message = 'Oops! Something went wrong. Try again later.';
        break;
    }

    return message;
  }

}
