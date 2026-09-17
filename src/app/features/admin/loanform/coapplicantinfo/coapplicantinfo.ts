import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Loanstepper } from '../loanstepper/loanstepper';
import { Buttons } from '../../../systemdesign/buttons/buttons';
import { Inputfield } from '../../../systemdesign/inputfield/inputfield';
import { FormsModule, NgForm, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterOutlet ,NavigationEnd } from '@angular/router';
import { Addcustomerservice } from '../../../../core/service/addcustomerservice';
import { Main } from '../../../../core/service/main';
import { Coappstepper } from "./coappstepper/coappstepper";
import { LoanformModule } from '../loanform-module';
import { Loanformservice } from '../../../../core/service/loanformservice';
import { Loanstepperservice } from '../../../../core/service/loanstepperservice';
import { filter } from 'rxjs/operators';


@Component({
  selector: 'app-coapplicantinfo',
  imports: [CommonModule, Loanstepper, Buttons, FormsModule, ReactiveFormsModule, Inputfield, Coappstepper],
  standalone: true,
  templateUrl: './coapplicantinfo.html',
  styleUrl: './coapplicantinfo.scss'
})
export class Coapplicantinfo implements OnInit {
  applicantId: any;
  applicationId: any;
  custName: any;
  custARN: any;

  searchLoading = false;
  norecord: boolean = false;
  norecordfound: boolean = false;
  isexistinguser: boolean = false

  filteredData: any[] = [];
  mobilenumber: any;
  number_id: any
  prefillPhone: any;

  mobileSubmitted: boolean = false;
  coApplicantIndex: number = 1;
  showmsg: boolean = false;
  showmsgtext = '';
  constructor(public service: Main, private router: Router, private addcustomerservice: Addcustomerservice,
    private route: ActivatedRoute, private cd: ChangeDetectorRef, private loanform: Loanformservice, private loanStepper: Loanstepperservice) { }



  ngOnInit() {
    let Allids = this.loanStepper.getLoanId();

    this.applicantId = Allids[0];
    this.applicationId = Allids[1];
    this.custName = Allids[2];
    this.custARN = Allids[3];
// Run once on component load
  this.handleCoApplicantRoute();

  // Run again after every navigation is completed
  this.router.events
    .pipe(filter(event => event instanceof NavigationEnd))
    .subscribe(() => {
      this.handleCoApplicantRoute();
    });

    this.route.queryParams.subscribe(params => {

      const sessionCoApp = JSON.parse(sessionStorage.getItem('coAppIds') || '{}');

      this.coApplicantIndex = Number(
        params['coApplicantIndex'] ||
        sessionCoApp?.coApplicantIndex ||
        1
      );

      this.loanStepper.setCurrentCoApplicantIndex(this.coApplicantIndex);

      if (sessionCoApp?.applicantId) {
        this.loanStepper.setCo_appId(
          sessionCoApp.applicantId,
          sessionCoApp.applicationId,
          sessionCoApp.fullName || '',
          sessionCoApp.custARN,
          this.coApplicantIndex
        );
      }

      const mode = params['mode'] || '';

      const cleanUrl = this.router.url.split('?')[0];

      const isChildStepperRoute = this.coApplicantChildRoutes.some(route =>
        cleanUrl.includes(route)
      );

// New coapp parent screen only
      if (mode === 'new' && !isChildStepperRoute) {
        this.loanStepper.clearCoAppId?.();
        sessionStorage.removeItem('coAppIds');
        sessionStorage.removeItem('coapp_cifdetails');

        this.mobileSubmitted = false;
        this.prefillPhone = '';
        this.loanform.coapppmobile = '';
        this.loanform.coappStep = 1;

        this.cd.detectChanges();
        return;
      }

        //  Existing coapp child route should always show stepper
  if (isChildStepperRoute) {
    this.mobileSubmitted = true;
    this.loanform.coappStep = 2;
    this.restoreCoApplicantState();
    this.cd.detectChanges();
    return;
  }
      // reset first, then restore per index
      // this.mobileSubmitted = false;
      // this.prefillPhone = '';
      this.restoreCoApplicantState();
      this.cd.detectChanges();
    });

    // if (this.loanform.coappStep === 2) {
    //   // this.mobileSubmitted = true;
    //   this.mobileSubmitted = this.loanform.coappStep === 2;

    // }

  }
  private getCoApplicantListKey(): string {
    return `coApplicants_${this.applicationId}`;
  }

isPhoneValid(): boolean {
  const phone = String(this.prefillPhone || '').trim();

  return /^[6-9][0-9]{9}$/.test(phone);
}




  private coApplicantChildRoutes = [
    'co-basicinfo',
    'co-generalinfo',
    'co-additionalinfo',
    'co-kyc',
    'co-incomeinfo',
    'co-assetsinfo',
    'co-liabilitiesinfo',
    'co-monthlyexpinfo',
    'co-summaryinfo'
  ];
  //on refresh page redirecting to number page so storing here 

restoreCoApplicantState() {
  const cleanUrl = this.router.url.split('?')[0];

  const isChildStepperRoute = this.coApplicantChildRoutes.some(route =>
    cleanUrl.includes(route)
  );

  const listKey = this.getCoApplicantListKey();
  const savedList = localStorage.getItem(listKey);
  const coApplicants = savedList ? JSON.parse(savedList) : [];

  const current = coApplicants.find(
    (x: any) => Number(x.index) === Number(this.coApplicantIndex)
  );

  const pendingContextRaw = sessionStorage.getItem('pendingCoAppContext');
  const pendingContext = pendingContextRaw ? JSON.parse(pendingContextRaw) : null;

  if (
    pendingContext &&
    Number(pendingContext.coApplicantIndex) === Number(this.coApplicantIndex)
  ) {
    this.prefillPhone = pendingContext.phone || '';
    this.loanform.coapppmobile = pendingContext.phone || '';
  } else if (current?.phone) {
    this.prefillPhone = current.phone;
    this.loanform.coapppmobile = current.phone;
  }

  // ✅ Important fix:
  // If URL is already inside co-basicinfo / co-kyc / etc.,
  // never show mobile number screen.
  if (isChildStepperRoute) {
    this.mobileSubmitted = true;
    this.loanform.coappStep = 2;

    if (current?.applicantId) {
      this.loanStepper.setCo_appId(
        current.applicantId,
        current.applicationId || this.applicationId,
        current.fullName || current.name || '',
        current.custARN,
        this.coApplicantIndex
      );
    }

    return;
  }

  const saved = localStorage.getItem(
    `coapp_mobile_submitted_${this.applicantId}_${this.coApplicantIndex}`
  );

  this.mobileSubmitted = saved === 'true';

  if (!this.mobileSubmitted) {
    this.prefillPhone = '';
    this.loanform.coapppmobile = '';
    this.loanform.coappStep = 1;
  } else {
    this.loanform.coappStep = 2;
  }

  if (current?.phone && !this.prefillPhone) {
    this.prefillPhone = current.phone;
  }
}
  getPhoneFieldState(phone: any): 'default' | 'error' | 'success' {
    if (phone.touched && phone.invalid) {
      return 'error';
    }
    if (this.norecordfound && phone.valid) {
      return 'error';
    }

    return 'default';
  }
  private handleCoApplicantRoute(): void {
  const params = this.route.snapshot.queryParams;

  const sessionCoApp = JSON.parse(sessionStorage.getItem('coAppIds') || '{}');

  this.coApplicantIndex = Number(
    params['coApplicantIndex'] ||
    sessionCoApp?.coApplicantIndex ||
    1
  );

  this.loanStepper.setCurrentCoApplicantIndex(this.coApplicantIndex);

  if (sessionCoApp?.applicantId) {
    this.loanStepper.setCo_appId(
      sessionCoApp.applicantId,
      sessionCoApp.applicationId,
      sessionCoApp.fullName || '',
      sessionCoApp.custARN,
      this.coApplicantIndex
    );
  }

  const mode = params['mode'] || '';

  const cleanUrl = this.router.url.split('?')[0];

  const isChildStepperRoute = this.coApplicantChildRoutes.some(route =>
    cleanUrl.includes(route)
  );

  // console.log('Coapp route check:', {
  //   cleanUrl,
  //   mode,
  //   isChildStepperRoute
  // });

  /**
   * Parent page + mode=new means show mobile number page
   */
  if (mode === 'new' && !isChildStepperRoute) {
    this.loanStepper.clearCoAppId?.();

    sessionStorage.removeItem('coAppIds');
    sessionStorage.removeItem('coapp_cifdetails');

    this.mobileSubmitted = false;
    this.prefillPhone = '';
    this.loanform.coapppmobile = '';

    // step 1 for mobile screen, 2 for stepper screen
    this.loanform.coappStep = 1;

    this.cd.detectChanges();
    return;
  }

  /**
   * Child route means show co-applicant stepper
   */
  if (isChildStepperRoute) {
    this.mobileSubmitted = true;
    this.cd.detectChanges();
    return;
  }

  /**
   * Otherwise restore saved state
   */
  this.mobileSubmitted = false;
  this.prefillPhone = '';

  this.restoreCoApplicantState();
  this.cd.detectChanges();
}
  back() {

  
 this.router.navigate(['/loanform/co-applicantdetails']);
   }

  saveCoApplicantToList(userid: any) {
    const key = this.getCoApplicantListKey();

    const saved = localStorage.getItem(key);
    let list = saved ? JSON.parse(saved) : [];

    const index = Number(this.loanStepper.getCurrentCoApplicantIndex());

    const existingIndex = list.findIndex(
      (x: any) => Number(x.index) === index
    );

    const data = {
      index: this.coApplicantIndex,
      userInitiateId: userid,
      phone: this.prefillPhone,
      name: '',
      status: 'IN_PROGRESS'
    };

    if (existingIndex > -1) {
      list[existingIndex] = {
        ...list[existingIndex],
        ...data
      };
    } else {
      list.push(data);
    }

    list = list.sort((a: any, b: any) => Number(a.index) - Number(b.index));

    localStorage.setItem(key, JSON.stringify(list));
  }

  next() {
    if (!this.isPhoneValid() || this.searchLoading) return;

    this.searchLoading = true;
    this.norecordfound = false;
    this.showmsg = false;
    this.showmsgtext = ''

    const input = {
      identifier: this.prefillPhone,
      type: "MOBILE",
      isSearch: false,
      applicantType: "CO_APPLICANT",
      coApplicantIndex: this.coApplicantIndex,
      applicationId: this.applicationId
    };

    this.addcustomerservice.customersearch(input).subscribe({

      next: (res) => {
        console.log(res);
        if (res.status === 'success') {
          const userid = res.data[0].userInitiateId || ''

          this.loanform.coapppmobile = this.prefillPhone;
          this.loanform.coappStep = 2;
          this.mobileSubmitted = true;

          localStorage.setItem(

            `coapp_mobile_submitted_${this.applicantId}_${this.coApplicantIndex}`,
            'true'

          );

          sessionStorage.setItem(
            'pendingCoAppContext',
            JSON.stringify({
              userInitiateId: userid,
              phone: this.prefillPhone,
              coApplicantIndex: this.coApplicantIndex,

            })
          );

          this.loanStepper.clearCoAppId?.();
          this.loanStepper.setStepperType('CO_APPLICANT');
          this.loanStepper.setCurrentCoApplicantIndex(this.coApplicantIndex);

          this.saveCoApplicantToList(userid);

          this.router.navigate(
            ['co-basicinfo'],
            {
              relativeTo: this.route,
              queryParams: {


                mode: 'new',
                coApplicantIndex: this.coApplicantIndex
              }, replaceUrl: true
              // queryParamsHandling: 'merge'
            }
          );

          this.searchLoading = false;
        }
        else {
          this.showmsg = true;
          this.showmsgtext = ' Main Applicant and Co-Applicant mobile numbers cannot be the same. Please enter a different mobile number for the Co-Applicant.'
          this.searchLoading = false;
        }

      },
      error: (err) => {
        console.error("error msg", err);
        this.searchLoading = false;
        this.norecordfound = true;
        this.showmsg = true;
       this.showmsgtext = err.error.message ;

        // this.showmsgtext = err.error.message == "Mobile number already used in this application" ? "Main Applicant and Co-Applicant mobile numbers cannot be the same. Please enter a different mobile number for the Co-Applicant." : err.error.message;
      }
    });
  }

}
