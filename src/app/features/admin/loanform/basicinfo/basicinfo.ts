import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { Inputfield } from '../../../systemdesign/inputfield/inputfield';
import { Buttons } from '../../../systemdesign/buttons/buttons';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Main } from '../../../../core/service/main';
import { Checkbox } from '../../../systemdesign/checkbox/checkbox';
import { interval, Subscription } from 'rxjs';
import { Addcustomerservice } from '../../../../core/service/addcustomerservice';
import { Otpsection } from '../../customer/otpsection/otpsection';
import { ActivatedRoute, Route, Router, NavigationEnd } from '@angular/router';
import { Loanformservice } from '../../../../core/service/loanformservice';
import { Loanstepper } from '../loanstepper/loanstepper';
import { Loanstepperservice } from '../../../../core/service/loanstepperservice';
import { firstValueFrom } from 'rxjs';
import { Messagebox } from '../../../systemdesign/messagebox/messagebox';
import { Msgboxservice } from '../../../../core/service/msgboxservice';
import { Storage } from '../../../../core/service/storage';
import { Successbox } from '../../customer/successbox/successbox';
import { filter } from 'rxjs/operators';


@Component({
  selector: 'app-basicinfo',
  imports: [CommonModule, Inputfield, Buttons, ReactiveFormsModule, Checkbox, Otpsection, Successbox],
  standalone: true,
  templateUrl: './basicinfo.html',
  styleUrl: './basicinfo.scss'
})
export class Basicinfo {

  openIndex: number | null = 0;
  accordions = [
    { title: 'Basic Info ', alwaysOpen: true },

  ];

  applicationId: any;
  applicantId: any;

  co_applicationId: any;
  co_applicantId: any;
  co_applicantName: any;
  co_custId: any;


  otpsent = false;
  otpVerifiedOk = false;
  sendotpId: any
  otpmsg: any;
  otpState: any;
  prefillPhone: any;

  timeLeft = 0;
  timerSub?: Subscription;
  otpVerified = false;
  isOtpComplete: boolean = false
  hasStarted: boolean = false
  resendSeconds = 60;
  isCounting = false;
  timerId: any;

  ismiddlename = false;
  showMiddleNameError = false;
  submitAttempted = false;
  registerForm!: FormGroup;

  isCoApplicant: boolean = false;
  lastSavedPayload: any = null;

  isSummaryEditMode = false;
  viewOnly = false;
  hasExistingCif = false;
  // @Input() prefillPhone: string = '';

  //edit from summary
  isFromSummary = false;
  isViewMode = false;
  isEditMode = false;
  originalFormValue: any = null;

  editSuccess: any = false;
  description1 = `Great ! Your Additional Info Details\n Uploaded Successfully.`;

  resetCounter = 0;
  maxResendAttempts = 5;
  resendLocked = false;
  isResendLoading = false;
  
  constructor(private fb: FormBuilder, public main: Main, private addcustomerservice: Addcustomerservice, private cd: ChangeDetectorRef, private msgBox: Msgboxservice,
    private router: Router, private loanform: Loanformservice, private stepperService: Loanstepperservice, private route: ActivatedRoute, private storageservice: Storage) { }


  async ngOnInit() {
    this.isCoApplicant = this.router.url.includes('co-applicant');

    this.stepperService.setStepperType(
      this.isCoApplicant ? 'CO_APPLICANT' : 'MAIN'
    );
    this.stepperService.restoreLoanEditContext();
    this.stepperService.restoreLoanIdFromSession();



    // const index = Number(this.route.snapshot.queryParams['coApplicantIndex']) || 1;
    let sessionCoApp: any = {};
    try {
      sessionCoApp = JSON.parse(sessionStorage.getItem('coAppIds') || '{}');
    } catch {
      sessionCoApp = {};
    }
    const params = this.route.snapshot.queryParams;

    const routeIndex = Number(params['coApplicantIndex']);
    const sessionIndex = Number(sessionCoApp?.coApplicantIndex);

    const currentIndex =
      routeIndex ||
      sessionIndex ||
      this.stepperService.getCurrentCoApplicantIndex() ||
      1;

    this.stepperService.setCurrentCoApplicantIndex(currentIndex);

    const routeMode = params['mode'];

    const mode =
      routeMode ||
      sessionCoApp?.mode ||
      '';


    let Allids = this.stepperService.getLoanId();

    this.applicantId = Allids[0];
    this.applicationId = Allids[1];




    this.stepperService.setCurrentCoApplicantIndex(currentIndex);

    const currentCoapp = this.getCurrentCoApplicantFromList();

    if (this.isCoApplicant && mode !== 'new' && currentCoapp?.applicantId) {
      const fixedSessionCoApp = {
        applicantId: currentCoapp.applicantId,
        applicationId: currentCoapp.applicationId || this.applicationId,
        fullName: currentCoapp.fullName || currentCoapp.name || '',
        coApplicantIndex: currentIndex,
        status: currentCoapp.status || currentCoapp.uiStatus || '',
        phone: currentCoapp.phone || '',
        userInitiateId: currentCoapp.userInitiateId || '',
        custId: currentCoapp.custId || currentCoapp.cifId || currentCoapp.customerId || '',
        cifId: currentCoapp.cifId || currentCoapp.custId || currentCoapp.customerId || '',
        customerId: currentCoapp.customerId || currentCoapp.custId || currentCoapp.cifId || '',
        mode: mode || 'existing'
      };

      sessionStorage.setItem('coAppIds', JSON.stringify(fixedSessionCoApp));
      sessionStorage.setItem('coapp_cifdetails', JSON.stringify(fixedSessionCoApp));

      this.stepperService.setCo_appId(
        currentCoapp.applicantId,
        currentCoapp.applicationId || this.applicationId,
        currentCoapp.fullName || currentCoapp.name || '',
        undefined,
        currentIndex
      );
    }
    const existingCoAppApplicantId =
      sessionCoApp?.applicantId ||
      currentCoapp?.applicantId ||
      this.stepperService.getCo_appId()?.[0] ||
      null;

    const isNewCoappFlow1 =
      this.isCoApplicant &&
      mode === 'new' &&
      !existingCoAppApplicantId;

    const isExistingMode =
      mode === 'existing' ||
      mode === 'view' ||
      mode === 'edit';

    const isNewCoappFlow =
      this.isCoApplicant &&
      mode === 'new' &&
      !isExistingMode &&
      !existingCoAppApplicantId &&
      !currentCoapp?.applicantId;

    if (isNewCoappFlow) {
      this.loanform.clearSummaryEditFlow();
      this.isFromSummary = false;
      this.isSummaryEditMode = false;
      this.viewOnly = false;
      this.isViewMode = false;
      this.isEditMode = false;
    }







    //    restore old co-app only for EXISTING flow
    // if (this.isCoApplicant && !isNewCoappFlow) {
    //   this.stepperService.restoreCoAppIdFromSession();
    // }
    if (this.isCoApplicant && !isNewCoappFlow) {
      if (currentCoapp?.applicantId) {
        this.stepperService.setCo_appId(
          currentCoapp.applicantId,
          currentCoapp.applicationId || this.applicationId,
          currentCoapp.fullName || currentCoapp.name || '',
          undefined,
          currentIndex
        );
      } else {
        this.stepperService.restoreCoAppIdFromSession();
      }
    }
    else if (isNewCoappFlow) {
      this.stepperService.clearCoAppId?.();

      // clear only pending/new context, not stable CIF data
      sessionStorage.removeItem('coapp_cifdetails');
    }



    const pendingContextRaw = sessionStorage.getItem('pendingCoAppContext');
    const pendingContext = pendingContextRaw ? JSON.parse(pendingContextRaw) : null;


    this.sendotpId = isNewCoappFlow
      ? pendingContext?.userInitiateId || ''
      : params['id'];

    const queryPhone = isNewCoappFlow
      ? pendingContext?.phone || ''
      : params['phone'] || ''




    const coappStatus = (
      sessionCoApp?.status ||
      currentCoapp?.status ||
      currentCoapp?.uiStatus ||
      ''
    ).toUpperCase();

    const isCompletedCoapp =
      coappStatus === 'COMPLETED' ||
      coappStatus === 'SUBMITTED';

    const isDraftCoapp =
      this.isCoApplicant &&
      !isNewCoappFlow &&
      !isCompletedCoapp;

    if (isDraftCoapp) {
      this.loanform.clearSummaryEditFlow();
      this.loanform.clearSummaryEducationEditFlow?.();

      this.isFromSummary = false;
      this.isSummaryEditMode = false;
      this.viewOnly = false;
      this.isViewMode = false;
      this.isEditMode = false;
    }
    this.isSummaryEditMode = !isNewCoappFlow && !isDraftCoapp &&
      (params['fromSummary'] === true ||
        params['fromSummary'] === 'true' ||
        this.loanform.isSummaryEditFlow())


    this.viewOnly = this.isSummaryEditMode && !isDraftCoapp && (params['mode'] === 'view' || params['mode'] === undefined);


    this.registerForm = this.fb.group({
      fname: ['', [
        Validators.required,
        Validators.pattern('^[A-Za-z ]+$'),
        Validators.minLength(2),
        Validators.maxLength(25)
      ]],

      mname: ['', [
        Validators.pattern('^[A-Za-z ]+$'),
        Validators.minLength(2),
        Validators.maxLength(25)
      ]],

      lname: ['', [
        Validators.required,
        Validators.pattern('^[A-Za-z ]+$'),
        Validators.minLength(2),
        Validators.maxLength(25)
      ]],

      phone: ['', [
        Validators.required,
        Validators.pattern('^[6-9][0-9]{9}$')
      ]],

      email: ['', [
        Validators.pattern('[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}'),
        Validators.minLength(10),
        Validators.maxLength(40)
      ]]
    });


    const cameFromSummary =
      params['fromSummary'] === true ||
      params['fromSummary'] === 'true' ||
      sessionCoApp?.mode === 'view' ||
      this.loanform.isSummaryEditFlow();

    this.isSummaryEditMode =
      !isNewCoappFlow &&
      isCompletedCoapp &&
      cameFromSummary;

    this.isFromSummary = this.isSummaryEditMode;

    this.viewOnly =
      this.isSummaryEditMode &&
      params['mode'] !== 'edit';

    if (this.isSummaryEditMode) {
      this.isViewMode = true;
      this.isEditMode = false;
      this.registerForm.disable({ emitEvent: false });
    } else {
      this.isFromSummary = false;
      this.isViewMode = false;
      this.isEditMode = false;
      this.viewOnly = false;
      this.registerForm.enable({ emitEvent: false });
    }

    const existingCoApplicantId =
      currentCoapp?.applicantId ||
      this.stepperService.getCo_appId()?.[0] ||
      null;

    this.hasExistingCif = !!existingCoApplicantId;

    if (this.hasExistingCif) {
      this.otpVerifiedOk = true;
      this.otpsent = false;
    }


    if (!isNewCoappFlow && currentCoapp?.applicantId) {
      this.stepperService.setCo_appId(
        currentCoapp.applicantId,
        currentCoapp.applicationId || this.applicationId,
        currentCoapp.name || '',
        undefined,
        this.stepperService.getCurrentCoApplicantIndex()
      );
    }

    const finalPhone = isNewCoappFlow
      ? (queryPhone || '')
      : (queryPhone || currentCoapp?.phone || '');

    this.prefillPhone = finalPhone;

    this.registerForm.patchValue({
      phone: finalPhone
    }, { emitEvent: false });

    //    BRAND NEW COAPP: blank page, no old Roshan patch
    if (isNewCoappFlow) {
      this.hasExistingCif =false;
      this.otpVerifiedOk = false;
      this.resetBasicFormForNewCoapp(finalPhone);

      if (this.viewOnly) {
        this.registerForm.disable({ emitEvent: false });
      }

      return;
    }

    //    EXISTING COAPP: patch from summary/draft/local
    await this.loadBasicForBothFlows();

    const isSubmittedCoapp =
      ['COMPLETED', 'SUBMITTED'].includes(
        (currentCoapp?.status || '').toUpperCase()
      );

    // if (!this.lastSavedPayload && !isSubmittedCoapp) {
    //   this.resetBasicFormForNewCoapp(finalPhone);
    // }
   if (!this.lastSavedPayload && !isSubmittedCoapp) {
  if (existingCoAppApplicantId || currentCoapp?.applicantId) {
    // this.showMobileVerification = false;
    this.hasExistingCif = true;
    this.otpVerifiedOk = true;
    this.otpsent = false;

    this.patchBasicInfoFromCoappCard(currentCoapp || sessionCoApp);
  } else {
    // this.showMobileVerification = true;
    this.resetBasicFormForNewCoapp(finalPhone);
  }
}

    if (this.viewOnly) {
      this.registerForm.disable({ emitEvent: false });
    }



  }
  get f() {
    return this.registerForm.controls || {};
  }


  toggle(i: number) {
    this.openIndex = this.openIndex === i ? null : i;
  }
  submit() { }
  onCheckboxChange(value: boolean) {
    this.ismiddlename = value;
    const mname = this.registerForm.get('mname');
    if (value) {
      mname?.disable();
      mname?.setValue('');
    } else {
      mname?.enable();
    }

  }

  createcustId() {
    if (this.registerForm.invalid || !this.otpVerifiedOk) {
      return;
    }

    console.log(this.registerForm.value);
  }
  isBasicInfoComplete(data: any): boolean {
    return !!(
      data?.firstName &&
      data?.lastName &&
      (data?.phoneNumber || data?.phone || data?.mobileNumber)
    );
  }

  resetBasicFormForNewCoapp(phone: string) {
    this.registerForm.reset({
      fname: '',
      mname: '',
      lname: '',
      email: '',
      phone: phone || ''
    }, { emitEvent: false });

    this.prefillPhone = phone || '';

    this.ismiddlename = false;
    this.registerForm.get('mname')?.enable({ emitEvent: false });

    this.lastSavedPayload = null;

  }
  async loadExistingCoappBasicInfo(currentCoapp: any) {
    const key = this.getStorageKey();

    const localData = localStorage.getItem(key);
    const parsedLocal = localData ? JSON.parse(localData) : null;

    let finalData = null;

    // first local indexed data
    if (parsedLocal && this.isBasicInfoComplete(parsedLocal)) {
      finalData = parsedLocal;
    }

    // then API using coapp applicantId only
    if (!finalData && currentCoapp?.applicantId) {
      const apiData = await this.getSavedbasicInfo(currentCoapp.applicantId);

      if (apiData && this.isBasicInfoComplete(apiData)) {
        finalData = apiData;
        // localStorage.setItem(key, JSON.stringify(apiData));

        this.storageservice.saveSectionData(
          'basicInfo',
          this.applicationId,
          this.applicantId,
          this.isCoApplicant,
          JSON.stringify(apiData),
          {
            mainApplicantId: this.stepperService.getLoanId()?.[0] ?? undefined,
            coApplicantId: this.stepperService.getCo_appId()?.[0] || null,
            coApplicantIndex: this.stepperService.getCurrentCoApplicantIndex()
          }

        );

      }
    }

    if (finalData) {
      this.patchBasicInfo(finalData);
      this.lastSavedPayload = this.buildBasicPayload(
        this.registerForm.getRawValue()
      );

      this.stepperService.markStepCompleted('co-basicinfo');
    }
  }
  get canResendOtp(): boolean {
    return (
      this.otpsent &&
      !this.otpVerifiedOk &&
      !this.isCounting &&
      !this.resendLocked &&
      !this.isResendLoading
    );
  }
  resendOtp() {
    if (!this.canResendOtp) { return; }
    if (this.resetCounter >= this.maxResendAttempts) {
      // this.startTimer(true); return;
    }
    this.isResendLoading = true;
    console.log("Resend OTP API call here");

    const input = {

      "phoneNumber": this.prefillPhone,
      "context": "SIGNUP",
      "sourceId": "WEB",
      "deviceId": "",
      "userId": this.sendotpId
    }
    this.startTimer(false);
    this.addcustomerservice.ResendOTP(input).subscribe({
      next: (res) => {
        this.isResendLoading = false;
        this.resetCounter++;
        const reachedMaxAttempts = this.resetCounter >= this.maxResendAttempts;
        if (reachedMaxAttempts) this.startTimer(reachedMaxAttempts);
      },
      error: (err) => {
        console.error("error msg", err);
      }
    })

  }

  sendOtp() {
    console.log("send otp");

    if (this.hasExistingCif) return;
    this.resetCounter = 0;
    this.resendLocked = false;
    this.loanform.setMobileNumber(this.prefillPhone);
    this.otpsent = true;
    const input = {

      "phoneNumber": this.prefillPhone,
      "context": "SIGNUP",
      "sourceId": "WEB",
      "deviceId": "",
      "userId": this.sendotpId
    }
    this.startTimer(false)
    this.addcustomerservice.SendOTP(input).subscribe({
      next: (res) => {
        console.log(res);


      },
      error: (err) => {
        console.error("error msg", err);
      }
    })

  }

  startTimer(reachedMaxAttempts: boolean) {

    // stop any existing timer first
    if (this.timerSub) {
      this.timerSub.unsubscribe();
      this.timerSub = undefined;
    }

    this.resendSeconds = 60;
    if (reachedMaxAttempts) {
      this.resendSeconds = 180;
      this.resetCounter = 0;
    }
    this.isCounting = true;



    this.timerSub = interval(1000).subscribe(() => {
      this.resendSeconds--;
      this.cd.detectChanges();


      if (this.resendSeconds <= 0) {
        this.isCounting = false;
        if (this.resendLocked) {
          this.resendLocked = false;
          this.resetCounter = 0;
        }
        this.timerSub?.unsubscribe();
        this.timerSub = undefined;
        this.cd.detectChanges();
      }
    });
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  }

  onTimer(timeLeft: number) {
    console.log('Time left:', timeLeft);
    this.timeLeft = timeLeft;
  }

  onOtpSubmit(otp: string) {

    console.log('OTP submitted:', otp);


  }

  onOtpVerifiedSuccess(val: any) {
    console.log("onOtpVerifiedSuccess--", val);

    // this.otpVerifiedOk = val;

    if (val.status === "success") {
      this.otpVerifiedOk = true;
      this.otpState = "success";
    } else {
      this.otpVerifiedOk = false;
      this.otpState = "error";
    }

    this.otpmsg = val.message;


    setTimeout(() => {
      this.otpmsg = '';
    }, 1000);
  }


  getTempStorageKey() {
    const index = this.stepperService.getCurrentCoApplicantIndex();
    return `basicInfoData_coapp_temp_${this.applicationId}_${index}`;
  }



  getStorageKey() {
    const main_ApplicantId = this.stepperService.getLoanId()?.[0];
    const co_ApplicantId = this.stepperService.getCo_appId()?.[0];
    const index = this.stepperService.getCurrentCoApplicantIndex();

    return this.storageservice.getStorageKey(
      'basicInfo',
      this.applicationId,
      this.applicantId,
      this.isCoApplicant,

      {
        mainApplicantId: main_ApplicantId ?? undefined,
        coApplicantId: co_ApplicantId ?? null,
        coApplicantIndex: index
      }


    );
  }
  getMainApplicantId() {
    return this.stepperService.getLoanId()?.[0];
  }

  getCoApplicantApplicantId() {
    return this.stepperService.getCo_appId()?.[0] || this.getCurrentCoApplicantFromList()?.applicantId || null;
  }



  isPayloadChanged(currentPayload: any, savedPayload: any): boolean {
    return JSON.stringify(currentPayload) !== JSON.stringify(savedPayload);
  }
  private async loadBasicForBothFlows() {
    const key = this.getStorageKey();

    // const localData = localStorage.getItem(key);
    // const parsedLocal = localData ? JSON.parse(localData) : null;

    const parsedLocal = this.storageservice.getStoredSectionData(
      'basicInfo',
      this.applicationId,
      this.applicantId,
      this.isCoApplicant,

      {
        coApplicantId: this.stepperService.getCo_appId()?.[0] || null,
        coApplicantIndex: this.stepperService.getCurrentCoApplicantIndex()
      }

    );


    const currentCoapp = this.getCurrentCoApplicantFromList();

    // const isSubmittedCoapp =
    //   ['COMPLETED', 'SUBMITTED'].includes(
    //     (currentCoapp?.status || '').toUpperCase()
    //   );

    const sessionCoApp = JSON.parse(sessionStorage.getItem('coAppIds') || '{}');

    const isSubmittedCoapp =
      ['COMPLETED', 'SUBMITTED'].includes(
        (
          sessionCoApp?.status ||
          currentCoapp?.status ||
          currentCoapp?.uiStatus ||
          ''
        ).toUpperCase()
      );
    const coApplicantApplicantId = this.getCoApplicantApplicantId();

  
    const summaryApplicant = await this.getSummaryApplicantForCurrentCoapp();
 this.prefillPhone = summaryApplicant?.phoneNumber || summaryApplicant?.phone || summaryApplicant?.mobileNumber || this.prefillPhone || '';

   const draftData = coApplicantApplicantId
      ? await this.getSavedbasicInfo(coApplicantApplicantId)
      : null;

    let finalData = null;

    if (isSubmittedCoapp || this.isSummaryEditMode) {
      finalData =
        this.normalizeBasicInfo(summaryApplicant) ||
        this.normalizeBasicInfo(draftData) ||
        this.normalizeBasicInfo(parsedLocal);
    } else {
      finalData =
        this.normalizeBasicInfo(draftData) ||
        this.normalizeBasicInfo(summaryApplicant) ||
        this.normalizeBasicInfo(parsedLocal);
    }

    if (!finalData) {
      this.lastSavedPayload = null;
      return;
    }

    this.loanform.co_basicInfoData = finalData;

    this.patchBasicInfo(finalData);

    this.lastSavedPayload = this.buildBasicPayload(
      this.registerForm.getRawValue()
    );

    // localStorage.setItem(key, JSON.stringify(finalData));

    this.storageservice.saveSectionData(
      'basicInfo',
      this.applicationId,
      this.applicantId,
      this.isCoApplicant,
      finalData,

      {

        mainApplicantId: this.stepperService.getLoanId()?.[0] ?? undefined,
        coApplicantId: this.stepperService.getCo_appId()?.[0] || null,
        coApplicantIndex: this.stepperService.getCurrentCoApplicantIndex()

      }

    );


    this.stepperService.markStepCompleted('co-basicinfo');
    this.cd.detectChanges();
  }
  //edit flow patch from summary
  async patchFromSummary() {
    const summaryApplicant = await this.getSummaryApplicantForCurrentCoapp();
    const data = this.normalizeBasicInfo(summaryApplicant);

    if (!data) return;

    this.patchBasicInfo(data);

    this.lastSavedPayload = this.buildBasicPayload(
      this.registerForm.getRawValue()
    );

    // localStorage.setItem(
    //   this.getStorageKey(),
    //   JSON.stringify(this.lastSavedPayload)
    // );

    this.storageservice.saveSectionData(
      'basicInfo',
      this.applicationId,
      this.applicantId,
      this.isCoApplicant,
      this.lastSavedPayload,
      {

        mainApplicantId: this.stepperService.getLoanId()?.[0] ?? undefined,
        coApplicantId: this.stepperService.getCo_appId()?.[0] || null,
        coApplicantIndex: this.stepperService.getCurrentCoApplicantIndex()

      }
    );

  }
  private patchBasicInfoFromCoappCard(coapp: any): void {
    if (!coapp || !this.registerForm) return;

    const fullName =
      coapp.fullName ||
      coapp.name ||
      '';

    const parts = fullName.trim().split(/\s+/);

    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '';

    const payload = {
      firstName,
      middleName: '',
      lastName,
      emailId: coapp.emailId || coapp.email || '',
      phoneNumber: coapp.phone || coapp.mobileNumber || this.prefillPhone || '',
      source: 'WEB',
      applicationId: this.applicationId
    };

    this.patchBasicInfo(payload);

    this.lastSavedPayload = this.buildBasicPayload(
      this.registerForm.getRawValue()
    );
  }
  patchBasicInfo(data: any) {
    if (!data || !this.registerForm) return;

    this.prefillPhone =
      data.phoneNumber ||
      data.mobileNumber ||
      data.phone ||
      this.prefillPhone ||
      '';

    this.registerForm.patchValue({
      fname: data.firstName || data.fname || '',
      mname: data.middleName || data.mname || '',
      lname: data.lastName || data.lname || '',
      email: data.emailId || data.email || '',
      phone: this.prefillPhone
    }, { emitEvent: false });

    if (!data.middleName && !data.mname) {
      this.ismiddlename = true;
      this.registerForm.get('mname')?.disable({ emitEvent: false });
    }

    this.lastSavedPayload = this.buildBasicPayload(
      this.registerForm.getRawValue()
    );

    this.loanform.co_basicInfoData = this.lastSavedPayload;

    this.stepperService.markStepCompleted('co-basicinfo');
  }
  buildBasicPayload(formdata: any) {
    return {
      firstName: formdata.fname || '',
      middleName: formdata.mname || '',
      lastName: formdata.lname || '',
      emailId: formdata.email || '',
      phoneNumber: formdata.phone || this.prefillPhone || '',
      source: 'WEB',
      applicationId: this.applicationId,
    };
  }
  updateCoApplicantListAfterCif() {
    const index = this.stepperService.getCurrentCoApplicantIndex();

    const listKey = `coApplicants_${this.applicationId}`;

    const saved = localStorage.getItem(listKey);

    let list: any[] = [];

    try {
      const parsed = saved ? JSON.parse(saved) : [];
      list = Array.isArray(parsed) ? parsed : [];
    } catch {
      list = [];
    }

    const existingIndex = list.findIndex(
      (x: any) => Number(x.index) === Number(index)
    );

    const formValue = this.registerForm.getRawValue();

    const item = {
      index,
      userInitiateId: this.sendotpId,
      applicantId: this.co_applicantId,
      applicationId: this.co_applicationId,
      phone: formValue.phone || this.prefillPhone,
      custId: this.co_custId || '',
      cifId: this.co_custId || '',
      customerId: this.co_custId || '',
      name:
        this.co_applicantName ||
        `${formValue.fname || ''} ${formValue.lname || ''}`.trim(),

      fullName:
        this.co_applicantName ||
        `${formValue.fname || ''} ${formValue.lname || ''}`.trim(),
      status: 'DRAFT'
    };

    if (existingIndex > -1) {
      list[existingIndex] = {
        ...list[existingIndex],
        ...item
      };
    } else {
      list.push(item);
    }

    list = list.sort((a: any, b: any) => Number(a.index) - Number(b.index));

    localStorage.setItem(listKey, JSON.stringify(list));
  }

  getCurrentCoApplicantFromList() {
    const mainApplicantId = this.stepperService.getLoanId()?.[0];
    const index = this.stepperService.getCurrentCoApplicantIndex();

    const key = `coApplicants_${this.applicationId}`;
    const saved = localStorage.getItem(key);

    let list: any[] = [];

    try {
      const parsed = saved ? JSON.parse(saved) : [];
      list = Array.isArray(parsed) ? parsed : [];
    } catch {
      list = [];
    }

    return list.find((x: any) => Number(x.index) === Number(index));
  }

  private async getSummaryApplicantForCurrentCoapp(): Promise<any> {
    if (!this.applicationId) return null;

    try {
      const res: any = await firstValueFrom(
        this.loanform.getSummary(this.applicationId)
      );

      if (!res || res.status !== 'success') return null;

      return this.loanform.getApplicantFromSummaryResponse(
        res,
        {
          isCoApplicant: true,
          coApplicantId: this.stepperService.getCo_appId()?.[0],
          coApplicantIndex: this.stepperService.getCurrentCoApplicantIndex()
        }
      );
    } catch (error) {
      console.error('Failed to get summary applicant for basic info:', error);
      return null;
    }
  }

  private normalizeBasicInfo(data: any): any {
    if (!data) return null;

    const fullName =
      data.fullName ||
      data.name ||
      '';

    const parts = fullName.trim().split(/\s+/);

    const firstName =
      data.firstName ||
      data.fname ||
      parts[0] ||
      '';

    const lastName =
      data.lastName ||
      data.lname ||
      parts.slice(1).join(' ') ||
      '';

    const phone =
      data.phoneNumber ||
      data.mobileNumber ||
      data.phone ||
      '';

    const normalized = {
      firstName: firstName || '',
      middleName: data.middleName || data.mname || '',
      lastName: lastName || '',
      emailId: data.emailId || data.email || '',
      phoneNumber: phone,
      source: data.source || 'WEB',
      applicationId: data.applicationId || this.applicationId
    };

    if (!this.isBasicInfoComplete(normalized)) {
      return null;
    }

    return normalized;
  }
  private finishAfterSaveOrNoChange() {
    if (this.isSummaryEditMode) {
      this.loanform.clearSummaryEditFlow();

      this.router.navigate(['/loanform', 'summaryinfo'], {
        queryParamsHandling: 'merge'
      });

      return;
    }

    this.stepperService.next();
  }
  saveExit() {
    this.msgBox.open({
      title: 'Are you sure you want to exit?',
      message: ``,
      showCancel: true, okText:'Yes',
      onOk: () => {
        let formdata = this.registerForm.getRawValue();
        const input = this.buildBasicPayload(formdata);

        const key = this.getStorageKey();
        // localStorage.setItem(key, JSON.stringify(input));

        this.storageservice.saveSectionData(
          'basicInfo',
          this.applicationId,
          this.applicantId,
          this.isCoApplicant,
          input,
          {

            mainApplicantId: this.stepperService.getLoanId()?.[0] ?? undefined,
            coApplicantId: this.stepperService.getCo_appId()?.[0] || null,
            coApplicantIndex: this.stepperService.getCurrentCoApplicantIndex()

          }
        );

        this.loanform.co_basicInfoData = input;


        const coApplicantApplicantId = this.stepperService.getCo_appId()?.[0];

        // Before CIF, save only local
        if (!coApplicantApplicantId) {
          this.lastSavedPayload = { ...input };
          return;
        }

        const jsonData = {

          emailId: input.emailId,
          firstName: input.firstName,
          lastName: input.lastName,
          middleName: input.middleName,

        }
        const inputdata = {
          action: "auto-save",
          sectionKey: "BASIC_INFO",
          applicationId: this.applicationId,
          applicantId: coApplicantApplicantId,
          phoneNumber: input.phoneNumber,
          source: input.source,
          jsonData: jsonData
        };

        this.loanform.saveandExitBasicinfo(inputdata).subscribe({
          next: () => {
            this.lastSavedPayload = { ...input };
          }
        });
        this.router.navigate(['/admin/losoperation']);
      }
    });
  }
  getSavedbasicInfo(coApplicantApplicantId: any): Promise<any> {
    let sectionkey = "BASIC_INFO"
    return new Promise((resolve) => {
      this.loanform.getSavedBasicInfo(this.applicationId, coApplicantApplicantId, sectionkey, this.prefillPhone).pipe()

        .subscribe({
          next: (res) => {

            console.log(res)
            if (res.status === "success") {
              // resolve(res.data.data);


              let data = res.data.data;

              if (typeof data === 'string') {
                try {
                  data = JSON.parse(data);
                } catch {
                  data = null;
                }
              }

              resolve(data);

            }
            else {
              resolve(null);
            }
          }, error: () => resolve(null)
        });
    });
  }


  private async getSummarySection(sectionKey: string): Promise<any> {
    if (!this.applicationId) return null;

    try {
      const res: any = await firstValueFrom(
        this.loanform.getSummary(this.applicationId)
      );

      if (!res || res.status !== 'success') return null;

      return this.loanform.getApplicantSectionFromSummary(
        res,
        sectionKey,
        {
          isCoApplicant: this.isCoApplicant,
          coApplicantId: this.stepperService.getCo_appId()?.[0],
          coApplicantIndex: this.stepperService.getCurrentCoApplicantIndex()
        }
      );
    } catch (error) {
      console.error(`Failed to get summary section: ${sectionKey}`, error);
      return null;
    }
  }

  reloadFormForCoapp() {
    const key = this.getStorageKey();

    const saved = localStorage.getItem(key);
    const parsed = saved ? JSON.parse(saved) : null;

    if (!parsed) {
      this.registerForm.reset();
      return;
    }

    this.patchBasicInfo(parsed);
  }

  
  back() {
    const currentIndex =
      this.stepperService.getCurrentCoApplicantIndex() ||
      Number(this.route.snapshot.queryParams['coApplicantIndex']) ||
      1;

    this.loanform.coappStep = 1;

    this.router.navigate(
      ['/loanform/co-applicantdetails/coapplicantinfo'],
      {
        queryParams: {
          coApplicantIndex: currentIndex,
          mode: 'new'
        },
        replaceUrl: true
      }
    );
  }
  next() {
    console.log('FNAME =>', this.registerForm.get('fname')?.value);
 const currentMode =this.route.snapshot.queryParamMap.get('mode') || 'existing';

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    let formdata = this.registerForm.getRawValue();


    const input = this.buildBasicPayload(formdata);
    const hasChanged = this.isPayloadChanged(input, this.lastSavedPayload);

    const existingCoApplicantId = this.getCoApplicantApplicantId();


    if (!hasChanged) {
      console.log('No changes detected, skipping API');
      this.stepperService.markStepCompleted('co-basicinfo');
      this.stepperService.setStepData('co-basicinfo', formdata);
      this.stepperService.next();
      return;
    }


    if (existingCoApplicantId) {
      // localStorage.setItem(this.getStorageKey(), JSON.stringify(input));

      this.storageservice.saveSectionData(
        'basicInfo',
        this.applicationId,
        this.applicantId,
        this.isCoApplicant,
        input,
        {

          mainApplicantId: this.stepperService.getLoanId()?.[0] ?? undefined,
          coApplicantId: this.stepperService.getCo_appId()?.[0] || null,
          coApplicantIndex: this.stepperService.getCurrentCoApplicantIndex()

        }
      );

      this.loanform.co_basicInfoData = input;
      this.lastSavedPayload = { ...input };

      this.stepperService.markStepCompleted('co-basicinfo');
      this.stepperService.setStepData('co-basicinfo', formdata);
      this.stepperService.next();
      return;
    }

    this.addcustomerservice.generateCIF(input).subscribe({
      next: (res) => {
        console.log("cif genrated", res);
        this.hasExistingCif = true;
        this.otpVerifiedOk = true;
        this.otpsent = false;
        this.loanform.co_basicInfoData = input

        const index = this.stepperService.getCurrentCoApplicantIndex();
        sessionStorage.setItem('coapp_cifdetails', JSON.stringify(res.data));

        this.co_applicantId = res.data.applicantId
        this.co_applicationId = res.data.applicationId
        this.co_applicantName = res.data.fullName || `${formdata.fname} ${formdata.lname}`.trim();
        this.co_custId = res.data.cifId

        this.stepperService.setCo_appId(this.co_applicantId, this.co_applicationId, this.co_applicantName, undefined, this.stepperService.getCurrentCoApplicantIndex());

        const currentIndex = this.stepperService.getCurrentCoApplicantIndex();

        this.storageservice.migrateCoApplicantTempToStable(
          'basicInfo',
          this.applicationId,
          this.co_applicantId,
          currentIndex
        );

        const coAppData = {
          applicantId: this.co_applicantId,
          applicationId: this.co_applicationId,
          fullName: this.co_applicantName,
          coApplicantIndex: this.stepperService.getCurrentCoApplicantIndex(),
          custId: this.co_custId,
          status: 'DRAFT',
          mode: 'existing'
        };
        sessionStorage.setItem('coAppIds', JSON.stringify(coAppData));

        const payload = {
          applicantId: this.co_applicantId,
          applicationId: this.co_applicationId,
          fullName: this.co_applicantName,
          custId: this.co_custId,
        };

        sessionStorage.setItem('co-loanContextData', JSON.stringify(payload));


        // const finalKey = `basicInfoData_coapp_${this.co_applicantId}`;
        const tempKey = this.getTempStorageKey();

        // localStorage.setItem(finalKey, JSON.stringify(input));

        this.storageservice.saveSectionData(
          'basicInfo',
          this.applicationId,
          this.applicantId,
          this.isCoApplicant,
          {
            ...input,
            applicantId: this.co_applicantId,
            applicationId: this.co_applicationId,
            custId: this.co_custId
          },
          {

            mainApplicantId: this.stepperService.getLoanId()?.[0] ?? undefined,
            coApplicantId: this.stepperService.getCo_appId()?.[0] || null,
            coApplicantIndex: this.stepperService.getCurrentCoApplicantIndex(),


          }
        );
        this.updateCoApplicantListAfterCif();
        sessionStorage.removeItem('pendingCoAppContext');

        localStorage.removeItem(tempKey);



        this.lastSavedPayload = { ...input };

        this.stepperService.markStepCompleted('co-basicinfo');
        this.stepperService.setStepData('co-basicinfo', formdata);


        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {
            mode: currentMode,
            coApplicantIndex: this.stepperService.getCurrentCoApplicantIndex(),

          },
          queryParamsHandling: 'merge',
          replaceUrl: true
        }).then(() => { this.stepperService.next(); });;

        // this.stepperService.next();
        // this.finishAfterSaveOrNoChange()
      },
      error: (err) => {
        console.error("error msg", err);
      }
    })




  }

  //edit from summary enable and disbale
  enableForm() {
    this.isViewMode = false;
    this.isEditMode = true;
    this.registerForm.enable();
  }

  disableAdditionalInfoForm() {
    this.registerForm.disable({ emitEvent: false });
  }

  enableAdditionalInfoForm() {
    this.registerForm.enable({ emitEvent: false });
  }

  onEditClick() {
    this.isViewMode = false;
    this.isEditMode = true;

    this.enableAdditionalInfoForm();

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        fromSummary: true,
        mode: 'edit'
      },
      queryParamsHandling: 'merge'
    });
  }
  cancelSummaryEdit() {
    if (this.isEditMode && this.originalFormValue) {
      this.registerForm.patchValue(this.originalFormValue);
    }
    this.isViewMode = true;
    this.isEditMode = false;
  }
  saveSummaryEdit() {
    this.submitAttempted = true;

    if (!this.registerForm.valid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const formdata = this.registerForm.getRawValue();
    const input = this.buildBasicPayload(formdata);

    this.addcustomerservice.generateCIF(input).subscribe({
      next: (res: any) => {
        if (res.status === 'success') {
          const key = this.getStorageKey();
          // localStorage.setItem(key, JSON.stringify(input));
          this.storageservice.saveSectionData(
            'basicInfo',
            this.applicationId,
            this.applicantId,
            this.isCoApplicant,
            input
          );

          this.loanform.co_basicInfoData = input;


          this.lastSavedPayload = { ...input };


          this.editSuccess = true;


        }
      },
      error: (err) => {
        console.error('Additional info update failed', err);
      }
    });
  }

  // edit sucess popup
  onCancel() {
    this.editSuccess = false;
  }

  handleSuccessAction(action: string) {
    if (action === "OK") {
      this.editSuccess = false;
      this.isViewMode = true;
      this.isEditMode = false;
      this.registerForm.disable({ emitEvent: false });
    }
  }
}
