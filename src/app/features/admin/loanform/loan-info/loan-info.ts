import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { Buttons } from '../../../systemdesign/buttons/buttons';
import { ActivatedRoute, Router } from '@angular/router';
import { Loanstepperservice } from '../../../../core/service/loanstepperservice';
import { Dropdown, DropdownOption } from '../../../systemdesign/dropdown/dropdown';
import { FormsModule, NgForm } from '@angular/forms';
import { Charts } from "../../../systemdesign/charts/charts";
import { Loanformservice } from '../../../../core/service/loanformservice';
import { loanErrors } from './loanerror';
import { Successbox } from '../../customer/successbox/successbox';


@Component({
  selector: 'app-loan-info',
  imports: [CommonModule, Buttons, Dropdown, FormsModule, Charts,Successbox],
  standalone: true,
  templateUrl: './loan-info.html',
  styleUrl: './loan-info.scss'
})
export class LoanInfo implements OnInit {


  applicantId: any;
  applicationId: any;
  custName: any;
  custARN: any;

  @Input() avatarUrl = '';
  @Input() hasAvatar = false;
  selectIncome: DropdownOption[] = [
    { label: '0-5 Lakhs', value: '0-5 Lakhs', icon: '' },
    { label: '5-10 Lakhs', value: '5-10 Lakhs', icon: '' },
    { label: '10-20 Lakhs', value: '10-20 Lakhs', icon: '' },
    { label: '20-30 Lakhs', value: '20-30 Lakhs', icon: '' },
    { label: '30-40 Lakhs', value: '30-40 Lakhs', icon: '' },
    { label: '40-50 Lakhs', value: '40-50 Lakhs', icon: '' },
    { label: '50-75 Lakhs', value: '50-75 Lakhs', icon: '' },
    { label: '75 Lakhs - 1 Crore', value: '75 Lakhs - 1 Crore', icon: '' },
    { label: '1 Crore & Above', value: '1 Crore & Above', icon: '' },
    { label: 'No Income', value: 'No Income', icon: '' },

  ]

  selectTenure: DropdownOption[] = [
    { label: '1yr', value: '1yr', icon: '' },
    { label: '2yr', value: '2yr', icon: '' },
    { label: '3yr', value: '3yr', icon: '' },
    { label: '4yr', value: '4yr', icon: '' },
    { label: '5yr', value: '5yr', icon: '' },
    { label: '6yr', value: '6yr', icon: '' },
    { label: '7yr', value: '7yr', icon: '' },
  ]

  selectpaymentmode: DropdownOption[] = [
    { label: 'EMI-Start Repaying Immediately', value: 'EMI', icon: '' },
    { label: 'SI–Pay Only Simple Interest During Study', value: 'SI', icon: '' },
    { label: 'Moratorium – No Payment During Study', value: 'Moratorium', icon: '' },

  ]

  occupation: any;
  annualIncome: number | null = null;
  rateOfInterest = 9.5;
  loanAmount = 100000;
  tenure = 1;
  modeOfPayment = '';


  totalInterestPayable = 173969;
  totalPrincipalAmount = 1000000;
  totalEmiAmount = 19566;

  annual_Income!: string;
  paymentmode!: string;

  interestPercentage = Math.round((this.totalInterestPayable / (this.totalPrincipalAmount + this.totalInterestPayable)) * 100);

  get totalPayable() {
    return this.totalPrincipalAmount + this.totalInterestPayable;
  }

  chartData1 = [
    { label: 'Total Principle amount', value: 25, color: '#0D4472' },
    { label: 'Total Interest payable', value: 75, color: '#F33B48' },
  ]

  errormsg = loanErrors;
  currenterror = ''
  loanError: string = '';
  tenureError: string = '';
   issuccess: boolean = false;
  constructor(private router: Router, private stepperService: Loanstepperservice, private route: ActivatedRoute, private loanformservice: Loanformservice) { }


  ngOnInit(): void {
    this.stepperService.rebuildSteps();

    const loandata = sessionStorage.getItem('loanContextData');

    if (loandata) {
      const parsed = JSON.parse(loandata);

      this.applicantId = parsed.applicantId;
      this.applicationId = parsed.applicationId;
      this.custName = parsed.custName;
      this.custARN = parsed.custARN;
      this.stepperService.setLoanId(this.applicantId, this.applicationId, this.custName, this.custARN);

    }

    const currentUserKey = 'currentApplicantId';
    const previousId = localStorage.getItem(currentUserKey);

    if (previousId && previousId !== this.applicantId) {
      Object.keys(localStorage).forEach(key => {
        if (key.includes('_')) {  // cleaner approach
          localStorage.removeItem(key);
        }
      });
    }

    localStorage.setItem(currentUserKey, this.applicantId);


    let data = this.loanformservice.loanInfoData;

    if (!data) {
      // const storedData = localStorage.getItem('loanInfoData');
      const key = `loanInfoData_${this.applicantId}`;
      const storedData = localStorage.getItem(key);

      if (storedData) {
        data = JSON.parse(storedData);
        this.loanformservice.loanInfoData = data;
        this.stepperService.markStepCompleted('loaninfo');
      }
    }

    if (!data) return;
    this.annual_Income = data.annualIncome;
    this.rateOfInterest = data.interestRate;
    this.loanAmount = data.requestedAmount;
    this.tenure = data.requestedTenureMonths / 12;
    this.paymentmode = data.modeOfPayment;
    //  setTimeout(() => this.updateSliderBackground(), 0);

  }

  limitLoanAmount(event: any, slider: any) {

    let value = event.target.value.replace(/[^0-9]/g, '');
    this.loanAmount = value;
    if (!value) {
      this.loanAmount = 0;
      this.loanError = '';
      slider.value = 100000;
      this.updateSliderBackground({ target: slider });
      return;
    }
    value = value.replace(/\D/g, '');
    let num = Number(value);
    this.loanError = '';
    if (num > 4500000) {
      // num = 4500000;
      this.loanError = this.errormsg.maxLoan;
    }

    if (num < 100000) {
      // num = 100000;
      this.loanError = this.errormsg.minLoan;
    }

    this.loanAmount = num;

    slider.value = num;

    this.updateSliderBackground({ target: slider });
  }
  limitTenureAmount(event: any, slider: any) {
    let value = event.target.value;
    if (!value) {
      this.tenure = 1;
      this.tenureError = '';
      slider.value = 1;
      this.updateSliderBackground({ target: slider });
      return;
    }
    let num = Number(value);
    this.tenureError = '';
    if (num > 7) {
      num = 7;
      this.tenureError = this.errormsg.maxTenure;
    }

    if (num < 1) {
      // num = 1;
      this.tenureError = this.errormsg.minTenure;
    }


    this.tenure = num;

    slider.value = num;

    this.updateSliderBackground({ target: slider });

  }


  submitForm(data: NgForm) {

    if (!data.valid) {
      console.log("form invalid");
      return;
    }

    console.log(data);
    let input = {
      "annualIncome": data.value.annual_Income,
      "requestedAmount": data.value.loanamt,
      "interestRate": data.value.rate,
      "requestedTenureMonths": data.value.tenureInput * 12,
      "modeOfPayment": data.value.paymentmode,
      "emiAmount": '',
      "totalInterest": '',
      "totalPrincipal": ''
    }

    console.log(input);

    this.loanformservice.submitLoanInfo(input, this.applicationId).subscribe({
      next: (data) => {
        console.log(data);
        if (data.status == "success") {
          this.loanformservice.loanInfoData = input;
          const key = `loanInfoData${this.applicantId}`;
          localStorage.setItem(key, JSON.stringify(input));
          this.issuccess = true;
          // this.stepperService.markStepCompleted('loaninfo');
          // this.stepperService.next();
        }

      },
      error: (error) => {
        console.log(error);
      }
    });

  }

  get isFormInvalid(): boolean {
    return (
      !this.annual_Income ||
      !this.paymentmode ||
      !this.loanAmount ||
      this.loanAmount < 100000 ||
      this.loanAmount > 4500000 ||
      !this.tenure ||
      this.tenure < 1 ||
      this.tenure > 7 ||
      !!this.loanError ||
      !!this.tenureError
    );
  }

  updateSliderBackground(event: any) {
    const value = Number(event.target.value);
    const min = Number(event.target.min);
    const max = Number(event.target.max);

    const percent = ((value - min) / (max - min)) * 100;

    event.target.style.background = `linear-gradient(to right, #1e3a5f ${percent}%, #e5e7eb ${percent}%)`;
  }

 handleSuccessAction(action: string) {
    if (action === 'letsstart') {

      
 const payload = {
      applicantId: this.applicantId,
      applicationId: this.applicationId,
      custName: this.custName,
      custARN: this.custARN
    };

    sessionStorage.setItem('loanContextData', JSON.stringify(payload));
 this.stepperService.markStepCompleted('loaninfo');
          this.stepperService.next();


       


    
    }
  }
}
