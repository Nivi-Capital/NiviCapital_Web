import { Component } from '@angular/core';
import { Buttons } from '../../features/systemdesign/buttons/buttons';
import { FormsModule, NgForm } from '@angular/forms';
import { Checkbox } from '../../features/systemdesign/checkbox/checkbox';
import { Router } from '@angular/router';
import { Main } from '../../core/service/main';
import { Msgboxservice } from '../../core/service/msgboxservice';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [Buttons, FormsModule, Checkbox],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  isloginChecked: boolean = false;
  isLoading: boolean = false;

  constructor(private router: Router, private main: Main, private msgBox: Msgboxservice) { }

  loginData = {
    username: '',
    password: '',
    isloginChecked: true
  };

  onCheckboxChange(value: boolean): void {
    this.isloginChecked = value;
  }

  onSubmit(form: NgForm): void {
    //  this.router.navigate(['admin/dashboard']);
    // Validate form before submission
    if (!form.valid) {
      this.msgBox.open({
        title: 'Validation Error',
        message: `Please fill in all required fields`,
        showCancel: false,
        onOk: () => { }
      });
      return;
    }

    // Prevent duplicate submissions
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;

    const inputobj = {
      username: form.value.username,
      password: form.value.password
    };

    this.main.getLogin(inputobj).subscribe({
      next: (res) => {
        this.isLoading = false;
        const lastLogin = res.lastLoginDateTime;
        const fullName = res.fullName;
        if (fullName) {
          this.main.setFullName(fullName);
        }
        if (lastLogin) {
          this.main.setLastLogin(lastLogin);
        }

        this.router.navigate(['admin/dashboard']);

      },
      error: (err) => {
        this.isLoading = false;
        this.msgBox.open({
          title: 'Login Error',
          message: err.error?.message || `Invalid credentials. Please try again.`,
          showCancel: false,
          onOk: () => { }
        });
      }
    });
  }
}
