import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Main } from '../../../../core/service/main';
import { Inputfield } from '../../../systemdesign/inputfield/inputfield';
import { Uploadbtn, UploadConfig, UploadResult } from "../../../systemdesign/uploadbtn/uploadbtn";
import { Datepickernew } from "../../../systemdesign/datepickernew/datepickernew";
import { Dropdown } from "../../../systemdesign/dropdown/dropdown";
import { Checkbox } from "../../../systemdesign/checkbox/checkbox";
import { Buttons } from "../../../systemdesign/buttons/buttons";
import { Addcustomerservice } from '../../../../core/service/addcustomerservice';
import { ActivatedRoute, Router } from '@angular/router';
import { Loanformservice } from '../../../../core/service/loanformservice';
import moment from 'moment';
import { Msgboxservice } from '../../../../core/service/msgboxservice';
import { Loanstepperservice } from '../../../../core/service/loanstepperservice';
import { NgForm } from '@angular/forms';
import { Successbox } from '../successbox/successbox';
import { firstValueFrom } from 'rxjs';

interface OptionItem {
  label: string;
  value: string;
}
@Component({
  selector: 'app-uploadkyc',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, Inputfield, Uploadbtn, Datepickernew, Dropdown, Checkbox, Buttons, Successbox],
  templateUrl: './uploadkyc.html',
  styleUrl: './uploadkyc.scss'
})
export class Uploadkyc implements OnDestroy, AfterViewInit {
  basicConfig: UploadConfig = {
    accept: '.svg, .png, .jpg, .jpeg, .pdf, ',
    maxSize: 10,
    helperText: 'JPG, JPEG, PDF, PNG, SVG,  (max. 10 MB)'
  };
  selectedOption: any;
  addressType: 'same' | 'different' = 'same';
  ismailingaddress: 'same' | 'different' = 'same';
  isDifferentAddress: boolean = false;
  selectedSecondaryProof: any;
  permanentMailingFlag = 0;
  currentMailingFlag = 0;
  isPermanentMailingChecked = true;
  isCurrentMailingChecked = false;
  files: any = {};

  @Output() nextStep = new EventEmitter<void>();
  @Output() prevstep = new EventEmitter<void>();
  @Output() fileChange = new EventEmitter<File>();
  @Output() ncid = new EventEmitter<string>();
  @Output() kycid = new EventEmitter<string>();

  openIndex: number[] = [0, 1];
  accordions = [
    { title: 'Identity & Residency ', alwaysOpen: true },
    { title: 'Permanent Address ', alwaysOpen: false },
    { title: 'Current Address ', alwaysOpen: false },
  ];
  isMailingAddress: boolean = false;

  perStateSelectedOption: any;
  perCitySelectedOption: any;
  currStateSelectedOption: any;
  currCitySelectedOption: any;


  stateOptions: OptionItem[] = [];
  cityOptions: OptionItem[] = [];

  currstateOptions: OptionItem[] = [];
  currcityOptions: OptionItem[] = [];

  perselectedStateId!: string;
  currselectedStateId!: string;
  perselectedStateLabel!: string;
  currselectedStateLabel!: string;

  perselectedCityId!: string;
  currselectedCityId!: string;
  perselectedCityLabel!: string;
  currselectedCityLabel!: string;


  placeholderstate: string = 'Select State';
  placeholdercity: string = 'Select City';


  requiredDocs = ['aadharfront', 'aadharback', 'pan'];   // only required ones
  optionalDocs = ['passport', 'bill', 'secaddress'];

  uploadedFiles: Record<string, File | null> = {};
  uploadedPreviewUrls: Record<string, string> = {};

  // dob: any;
  selectstate_: any;
  selectcity_: any;
  userdata: any;
  userid: any;
  co_userid: any;
  NCId: any;
  custName: any;
  custId: any;
  firstName: any;
  lastName: any;

  editMode = false;
  editUserData: any = {};
  dobValid = false;
  dobTouched = false;
  @ViewChild('kycForm') kycForm!: NgForm;

  applicationId: any;
  applicantId: any;
  lastSavedPayload: any = null;
  isCoApplicant: boolean = false;
  uploadedFileMeta: Record<string, any> = {};
  issuccess: boolean = false;



  //edit from summary
  isViewMode = false;
  isEditMode = false;
  isSummaryEditMode = false;
  viewOnly = false;

  //on server kyc data is get removed
  private initReady = false;
private viewReady = false;
private kycLoaded = false;
private isPageRefresh = false;
isNewFlow = false;

  constructor(public main: Main, private addcustomerservice: Addcustomerservice, private cd: ChangeDetectorRef, private route: ActivatedRoute, public stepperService: Loanstepperservice, private loanservice: Loanformservice, private msgBox: Msgboxservice, private router: Router) { }

  async ngOnInit(): Promise<void> {

  this.isPageRefresh =
    (
      performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming | undefined
    )?.type === 'reload';

   const params = this.route.snapshot.queryParams;
this.isNewFlow = params['mode'] === 'new';
    const cameFromSummary =
      params['fromSummary'] === true ||
      params['fromSummary'] === 'true' ||
      this.loanservice.isSummaryEditFlow();

    this.isSummaryEditMode = cameFromSummary;


    this.viewOnly =
      this.isSummaryEditMode &&
      params['mode'] !== 'edit';

    this.isCoApplicant = this.router.url.includes('coapplicantinfo');
    this.stepperService.setStepperType(
      this.isCoApplicant ? 'CO_APPLICANT' : 'MAIN'
    );

    let Allids = this.stepperService.getLoanId();

    this.applicantId = Allids?.[0];
    this.applicationId = Allids?.[1];

    let AllCoapp_ids = this.stepperService.getCo_appId();

    if (
      this.isCoApplicant &&
      (!AllCoapp_ids || !AllCoapp_ids[0] || !AllCoapp_ids[1])
    ) {
      const storedCoApp = sessionStorage.getItem('coAppIds');

      if (storedCoApp) {
        const parsed = JSON.parse(storedCoApp);

        AllCoapp_ids = [
          parsed.applicantId,
          parsed.applicationId,
          parsed.fullName
        ];

        this.stepperService.setCo_appId(
          parsed.applicantId,
          parsed.applicationId,
          parsed.fullName,
          undefined, this.stepperService.getCurrentCoApplicantIndex()
        );
      }
    }

    if (this.isCoApplicant) {
      this.applicantId = AllCoapp_ids?.[0];
      this.applicationId = AllCoapp_ids?.[1];
    } else {
      this.applicantId = Allids?.[0];
      this.applicationId = Allids?.[1];
    }


    await this.states();


    const cifDetails = sessionStorage.getItem('cifdetails');
    this.userid = this.safeParse(cifDetails);

    const userDetails = sessionStorage.getItem('userdetails');
    this.userdata = this.safeParse(userDetails);

    const coapp_cifDetails = sessionStorage.getItem('coapp_cifdetails');
    this.co_userid = this.safeParse(coapp_cifDetails);

    const editUser = sessionStorage.getItem('editUser');

    if (editUser) {
      this.editMode = true;
      this.editUserData = JSON.parse(editUser);
    }
    this.requiredDocs.forEach(k => this.uploadedFiles[k] = null);
    this.optionalDocs.forEach(k => this.uploadedFiles[k] = null);

   

    if (this.isSummaryEditMode) {
      this.isViewMode = true;
      this.isEditMode = false;
      // this.kycForm.form.disable({ emitEvent: false });
      setTimeout(() => { this.applyKycViewMode(); });
    }

    this.initReady = true;
     this.tryLoadKyc();

  }

ngAfterViewInit(): void {
  this.viewReady = true;

  //  if (this.isPageRefresh && this.isNewFlow) {  setTimeout(() => {    
  //     this.clearKycFormOnRefresh();    });   return;  }

  this.tryLoadKyc();
}


  private tryLoadKyc(): void {
    const shouldClearFreshForm = this.isPageRefresh && this.isNewFlow;
  if (
    
    !this.initReady ||
    !this.viewReady ||
    this.kycLoaded ||
    !this.kycForm
  ) {
    return;
  }

  this.kycLoaded = true;

  this.loadKycForBothFlows().catch(error => {
    this.kycLoaded = false;
    console.error('Failed to load KYC data', error);
  });
}

  private async loadKycForBothFlows() {
   

    const key = this.getStorageKey();
  
     const apiApplicantId = this.getApiApplicantId();
    if (!apiApplicantId) {  return; }



let parsedLocal: any = null;

try {
  const localData = localStorage.getItem(key);
  parsedLocal = localData ? JSON.parse(localData) : null;

  // Same index may belong to a newly created applicant.
  // Never use cache belonging to the deleted applicant.
  if (
    parsedLocal?.applicantId &&
    String(parsedLocal.applicantId) !== String(apiApplicantId)
  ) {
   

    localStorage.removeItem(key);
    parsedLocal = null;
  }
} catch {
  localStorage.removeItem(key);
  parsedLocal = null;
}

 const summaryApplicant = await this.getCurrentApplicantFromSummary();
   
   
    if (!apiApplicantId) {
      return;
    }

    this.custId =
      summaryApplicant?.customerId ||
      summaryApplicant?.custId ||
      summaryApplicant?.cifId ||
      parsedLocal?.custId ||
this.co_userid?.custId ||
this.co_userid?.cifId ||
this.co_userid?.customerId ||
      this.custId ||
      '';

    this.firstName = summaryApplicant?.firstName ||
      '';
    this.lastName = summaryApplicant?.lastName ||
      '';

const draftData = this.custId
  ? await this.getSavedKycInfo(
      apiApplicantId,
      this.custId
    )
  : null;
    const summarySection =
      summaryApplicant?.kyc ||
      summaryApplicant?.kycInfo ||
      summaryApplicant?.KYC ||
      summaryApplicant?.Kyc ||
      null;


    const normalizedSummary = this.normalizeSummaryKyc(summarySection);
    const hasSubmittedSummary =this.hasAnyKycData(normalizedSummary);
    const hasSavedDraft =this.hasAnyKycData(draftData);
    let finalData: any = null;

      /*
   * Rule 1:
   * Submitted KYC always wins, including:
   * - browser refresh
   * - mode=new remaining in the URL
   * - returning from Income to KYC
   */

   if (hasSubmittedSummary) {
  finalData = normalizedSummary;
  }

    /*
   * Rule 2:
   * Partial KYC saved using Save and Exit.
   */
 else if (hasSavedDraft) {
  finalData = draftData;
}

    /*
   * Rule 3:
   * Browser refresh with no Summary and no Save and Exit draft.
   */
 
  else if (this.isPageRefresh) {
  localStorage.removeItem(key);
  this.clearKycFormOnRefresh();
  return;
}
    /*
   * Rule 3:
    Restore local values so switching between tabs does not lose
    */
else if (this.hasAnyKycData(parsedLocal)) {
  finalData = parsedLocal;
}

  // flow change 12-08-2026
    // // 1) Full submitted summary should always win
    // if (this.isKycComplete(normalizedSummary)) {
    //   finalData = normalizedSummary;
    // }
    // // 2) Else draft data (partial save-exit)
    // else if (this.hasAnyKycData(draftData)) {
    //   finalData = draftData;
    // }
    // // // 3) Else local fallback
    // // else if (this.hasAnyKycData(parsedLocal)) {
    // //   // finalData = parsedLocal;
    // // }
    // // 4) Else partial summary fallback
    // else if (this.hasAnyKycData(normalizedSummary)) {
    //   finalData = normalizedSummary;
    // }

    if (!finalData) {
      this.lastSavedPayload = null;
      return; // fresh form remains empty
    }

    this.patchKycInfo(finalData);
    this.lastSavedPayload = this.normalizeKycPayload(finalData);

    localStorage.setItem(key, JSON.stringify(finalData));
    
    const stepRoute = this.isCoApplicant ? 'co-kyc' : 'kycinfo';

    if (this.isKycComplete(finalData)) {
      this.stepperService.markStepCompleted(stepRoute);
    }
    this.cd.detectChanges();
  }


  getStorageKey() {
    if (!this.isCoApplicant) {
      return `kycinfo_main_${this.applicationId}_${this.stepperService.getLoanId()?.[0]}`;
    }

    const coApplicantId = this.stepperService.getCo_appId()?.[0];
    const index = this.stepperService.getCurrentCoApplicantIndex();

    return coApplicantId
      ? `kycinfo_coapp_${this.applicationId}_${coApplicantId}`
      : `kycinfo_coapp_${this.applicationId}_temp_${index}`;
  }

 

  isPassportRequired(): boolean {
    // return !this.isCoApplicant && !this.editMode;
     return !this.isCoApplicant;
  }
  getCurrentCoApplicantFromList1() {
    const mainApplicantId = this.stepperService.getLoanId()?.[0];
    const index = this.stepperService.getCurrentCoApplicantIndex();

    const saved = localStorage.getItem(`coApplicants_${mainApplicantId}`);
    const list = saved ? JSON.parse(saved) : [];

    return list.find((x: any) => Number(x.index) === Number(index));
  }
  getCurrentCoApplicantFromList() {
  const index =
    Number(
      this.route.snapshot.queryParams['coApplicantIndex']
    ) ||
    this.stepperService.getCurrentCoApplicantIndex();

  const saved = localStorage.getItem(
    `coApplicants_${this.applicationId}`
  );

  const list = saved ? JSON.parse(saved) : [];

  return list.find(
    (item: any) =>
      Number(item.index) === Number(index)
  );
}

  getApiApplicantId() {
    if (!this.isCoApplicant) {
      return this.stepperService.getLoanId()?.[0];
    }

    return this.stepperService.getCo_appId()?.[0] || null;
  }

  goToDashboard() {

    this.msgBox.open({
      title: 'Are you sure want to go to Dashboard?',
      message: ``,
      showCancel: true,
      onOk: () => {
        this.prevstep.emit();

      }
    });

  }

  safeParse(value: string | null) {
    try {
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  }
  toggle(index: number) {
    if (this.openIndex.includes(index)) {
      this.openIndex = this.openIndex.filter(i => i !== index);
    } else {
      this.openIndex.push(index);
    }
  }


  checkSequential(value: string, control: any) {

    if (!value || value.length < 12) return;

    if (this.isSequential(value)) {
      control.control.setErrors({ sequential: true });
    } else {

      const errors = control.control.errors;

      if (errors) {
        delete errors['sequential'];
        if (Object.keys(errors).length === 0) {
          control.control.setErrors(null);
        } else {
          control.control.setErrors(errors);
        }
      }
    }

  }
  isSequential(num: string) {

    const ascSeq = "01234567890123456789";
    const descSeq = "98765432109876543210";

    for (let i = 0; i <= num.length - 6; i++) {
      const part = num.substring(i, i + 6);

      if (ascSeq.includes(part) || descSeq.includes(part)) {
        return true;
      }
    }

    return false;
  }

  selectSameAddress(checked: boolean) {

    if (this.isViewMode) return;
    this.addressType = 'same';
    this.isDifferentAddress = false;
    this.selectedSecondaryProof = null;
    this.isCurrentMailingChecked = false;
    this.isPermanentMailingChecked = true;
    if (this.kycForm) {
      const input = this.buildKycPayload(this.kycForm.value);
      localStorage.setItem(this.getStorageKey(), JSON.stringify(input));
    }
  }

  selectDifferentAddress(checked: boolean) {
    if (this.isViewMode) return;

    this.addressType = 'different';
    this.currstateOptions = [];
    this.currcityOptions = [];
    this.isDifferentAddress = true;

    this.isCurrentMailingChecked = true;
    this.isPermanentMailingChecked = false;
    this.states();
    if (this.kycForm) {
      const input = this.buildKycPayload(this.kycForm.value);
      localStorage.setItem(this.getStorageKey(), JSON.stringify(input));
    }
  }

  checkDob(value: any) {
    this.dobTouched = true;
    if (!value) {
      this.dobValid = true;
      return;
    }

    this.dobValid = this.isAdult(value);
  }
  isAdult(date: any): boolean {

    if (!date) return false;

    const age = moment().diff(date, 'years');

    return age >= 18;


  }

  async kycupload(form: any) {
    console.log(form.value);

    if (this.isPassportRequired() && !form.value.Passport) {
      console.log('Passport number is mandatory for fresh main applicant');
      return;
    }
    if (!form.valid) {
      console.log("form invalid");
      return;
    }


    const kycPayload = this.buildKycPayload(form.value);

    if (!kycPayload.custId) {
      console.error('custId missing. Basic Info CIF is not generated for this co-applicant.');



      return;
    }

    let key = this.getStorageKey();
    localStorage.setItem(key, JSON.stringify(kycPayload));
    this.lastSavedPayload = { ...kycPayload };


    sessionStorage.setItem(
      'userdetails',
      JSON.stringify({
        ...kycPayload,
        dob: kycPayload.dob
      })
    );

    console.log("this.files----", this.files);

    const fd = new FormData();


    // text fields
    fd.append('kycData', JSON.stringify({


      firstName: kycPayload.firstName,
      lastName: kycPayload.lastName,
      dob: kycPayload.dob,
      aadhaarNumber: kycPayload.aadhaarNumber,
      panNumber: kycPayload.panNumber,
      passportNo: kycPayload.passportNo,
      addresses: kycPayload.addresses,
      secondaryAddressProof: kycPayload.selectedSecondaryProof ,


    }));


    fd.append('custId', kycPayload.custId);

    // Append new files OR summary URL converted files
    await this.appendKycFile(fd, 'pan', 'panFile', 'application/pdf');
    await this.appendKycFile(fd, 'aadharfront', 'aadharFrontFile', 'application/pdf');
    await this.appendKycFile(fd, 'aadharback', 'aadharBackFile', 'application/pdf');
    await this.appendKycFile(fd, 'passport', 'passportFile', 'application/pdf');

    fd.forEach((value, key) => { console.log('FD:', key, value); });
    if (this.files.secaddress) {
      // fd.append('utilityBillFile', this.files.secaddress);
      await this.appendKycFile(fd, 'secaddress', 'utilityBillFile', 'application/pdf');

    }



    this.addcustomerservice.uploadkycdocuments(fd).subscribe({
      next: res => {
        console.log("KYC uploaded", res);
        this.ncid.emit(res.ncId);
        this.kycid.emit(res.kycId);
        this.loanservice.setKycId(res.kycId);
        this.lastSavedPayload = this.normalizeKycPayload(kycPayload);
       localStorage.setItem(
this.getStorageKey(),JSON.stringify(kycPayload)
)
        if (this.isCoApplicant) {
          this.custName = res.name
          this.NCId = res.ncId
          this.issuccess = true;
          this.stepperService.markStepCompleted('co-kyc');
          this.stepperService.setStepData('co-kyc', kycPayload);

        } else {
          this.nextStep.emit();
        }
      },
      error: err => {
        console.error(err);
      }
    });

    this.editMode = false;
  }


  onFileChange(result: UploadResult, key: string) {
    if (this.viewOnly) return;
    if (!result.file) {
      this.uploadedFiles[key] = null;

      if (this.uploadedPreviewUrls[key]) {
        URL.revokeObjectURL(this.uploadedPreviewUrls[key]);
        delete this.uploadedPreviewUrls[key];
      }

      delete this.files[key];
      delete this.uploadedFileMeta[key];
      return;
    }

    this.files[key] = result.file;
    this.uploadedFiles[key] = result.file;

    // Clear old preview URL if same key uploaded again
    if (this.uploadedPreviewUrls[key]) {
      URL.revokeObjectURL(this.uploadedPreviewUrls[key]);
    }


    const previewUrl = URL.createObjectURL(result.file);
    this.uploadedPreviewUrls[key] = previewUrl;

    this.uploadedFileMeta[key] = {
      fileName: result.file.name,
      // fileUrl: previewUrl,
      uploaded: true,
      localOnly: true
    };
    this.uploadedPreviewUrls[key] = previewUrl;
    if (this.kycForm) {
      const input = this.buildKycPayload(this.kycForm.value);
      localStorage.setItem(this.getStorageKey(), JSON.stringify(input));
    }

  }

  get allRequiredFilesUploaded(): boolean {

    let docsToCheck = [...this.requiredDocs];

    if (this.addressType === 'different') {
      docsToCheck.push('secaddress');
    }

    return docsToCheck.every(k => !!this.uploadedFiles[k] || !!this.uploadedFileMeta[k]?.fileName);
  }

  permailcheck(event: any) {
    console.log("--permant", event);
    this.isPermanentMailingChecked = event;
    this.permanentMailingFlag = event ? 1 : 0;

    if (event) {
      this.isCurrentMailingChecked = false;
      this.currentMailingFlag = 0;
    }
  }
  currentmailcheck(event: any) {
    console.log("--current", event);
    // this.currentMailingFlag = event ? 1 : 0;

    this.isCurrentMailingChecked = event;
    this.currentMailingFlag = event ? 1 : 0;

    if (event) {
      this.isPermanentMailingChecked = false;
      this.permanentMailingFlag = 0;
    }

  }

  // Dropdown options
  secondaryaddproof = [
    { value: 'Electricitybill', label: 'Electricity Bill' },
    { value: 'gasbill', label: 'Gas Bill' },
    { value: 'mobilebill', label: 'Mobile Bill' },
    { value: 'rentalagreement', label: 'Rental Agreement' },
    { value: 'Bankpassbook', label: 'Bank Passbook' },
    { value: 'voterID', label: 'Voter ID' }
  ];

  onSelectionChange(value: any) {
    console.log('Selected secondary address proof:', value);

    this.selectedSecondaryProof =
      typeof value === 'object'
        ? value?.value || ''
        : value || '';
  }



  states(): Promise<void> {
    return new Promise((resolve) => {
      this.main.getIndianstates().subscribe((res: any) => {
        const list = res.data ?? res;

        this.stateOptions = list.map((s: any) => ({
          value: s.id,
          label: s.name
        }));

        this.currstateOptions = [...this.stateOptions];
        resolve();
      });
    });
  }

  selectPerState(id: any) {

    const found = this.stateOptions.find(s => s.value === id);
    this.perselectedStateLabel = found?.label ?? '';

    this.perCitySelectedOption = null;
    this.perselectedCityId = '';
    this.perselectedCityLabel = '';

    this.cityOptions = [];
    this.loadPerCities(id);
  }

  loadPerCities(id: any, cityName?: string) {
    this.main.getIndianstatescities(id).subscribe((res: any) => {
      const list = res.data ?? res;

      this.cityOptions = list.map((c: any) => ({
        value: c.id,
        label: c.name
      }));

      if (cityName) {
        const matched = this.cityOptions.find(
          (c: any) => c.label?.trim().toLowerCase() === cityName.trim().toLowerCase()
        );

        if (matched) {
          this.perCitySelectedOption = matched.value;
          this.perselectedCityId = matched.value;
          this.perselectedCityLabel = matched.label;

          this.kycForm.form.patchValue({
            percity: matched.value
          }, { emitEvent: false });
        }
      }

    });
  }

  selectPerCity(id: any) {

    const found = this.cityOptions.find(c => c.value === id);
    this.perselectedCityLabel = found?.label ?? '';
  }

  selectCurrState(id: any) {
    const found = this.currstateOptions.find(s => s.value === id);
    this.currselectedStateLabel = found?.label ?? '';

    this.currCitySelectedOption = null;
    this.currselectedCityId = '';
    this.currselectedCityLabel = '';

    this.currcityOptions = [];

    this.loadCurrCities(id);
  }

  loadCurrCities(id: any, cityName?: string) {
    this.main.getIndianstatescities(id).subscribe((res: any) => {
      const list = res.data ?? res;

      this.currcityOptions = list.map((c: any) => ({
        value: c.id,
        label: c.name
      }));

      if (cityName) {
        const matched = this.currcityOptions.find(
          (c: any) => c.label?.trim().toLowerCase() === cityName.trim().toLowerCase()
        );

        if (matched) {
          this.currCitySelectedOption = matched.value;
          this.currselectedCityId = matched.value;
          this.currselectedCityLabel = matched.label;

          this.kycForm.form.patchValue({
            currcity: matched.value
          }, { emitEvent: false });
        }
      }

    });
  }

  selectCurrCity(id: any) {
    const found = this.currcityOptions.find(c => c.value === id);
    this.currselectedCityLabel = found?.label ?? '';
  }

  //file upload img to show preview
  hasLocalFile(key: string): boolean {
    return !!this.uploadedFiles[key] || !!this.uploadedFileMeta[key]?.fileName;;
  }

  getLocalFileName1(key: string): string {
    return this.uploadedFiles[key]?.name || this.uploadedFileMeta[key]?.fileName || 'No file uploaded';
  }

  getLocalFileName(
  key: any,truncate=true
  ): any {
    // const file = this.getDocumentByKey(key);

    // if (!file) return '';

    const fileName =
      this.uploadedFiles[key]?.name || this.uploadedFileMeta[key]?.fileName || '';


    if (!truncate || fileName.length <= 30) {
      return fileName;
    }
    return `${fileName.substring(0, 30)}...`;
  }

 
  getLocalFileUrl(key: string): string {

    if (this.uploadedPreviewUrls[key]) {
      return this.uploadedPreviewUrls[key];
    }

    return (
      this.uploadedFileMeta[key]?.viewUrl ||
      this.uploadedFileMeta[key]?.fileUrl ||
      ''
    );
  }
  viewLocalFile(key: string): void {
    const url = this.getLocalFileUrl(key);

    if (!url) return;

    window.open(url, '_blank');
  }

  downloadLocalFile(key: string): void {
    const file = this.uploadedFiles[key] || this.uploadedFileMeta[key];
    const meta = this.uploadedFileMeta[key];
    if (!file) return;

    const url = this.getLocalFileUrl(key);
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = file?.name || meta?.fileName;
    link.click();
  }

  deleteLocalFile(key: string): void {

    this.msgBox.open({
      title: 'Are you sure want to Remove',
      message: ``,
      showCancel: true,
      okText: 'Yes',

      onOk: () => {
        this.uploadedFiles[key] = null;
        delete this.files[key];

        if (this.uploadedPreviewUrls[key]) {
          URL.revokeObjectURL(this.uploadedPreviewUrls[key]);
          delete this.uploadedPreviewUrls[key];
        }
        delete this.uploadedFileMeta[key];
        if (this.kycForm) {
          const input = this.buildKycPayload(this.kycForm.value);
          localStorage.setItem(this.getStorageKey(), JSON.stringify(input));
        }

      }
    });
  }


  back() {
    this.stepperService.previous();
  }
  //------------convert viewurl to binary file
  async urlToFile(
    url: string,
    filename: string,
    fallbackType: string = 'application/octet-stream'
  ): Promise<File> {
    const res = await fetch(url);

    if (!url) { throw new Error('Document URL is missing'); }

    if (url.startsWith('blob:')) {
      throw new Error('Invalid persisted blob URL');
    }

    if (!res.ok) {
      throw new Error(`Failed to fetch file from URL: ${url}`);
    }

    const blob = await res.blob();

    return new File([blob], filename || 'document', {
      type: blob.type || fallbackType
    });
  }
  private async urlToFile1(
    url: string,
    filename: string,
    fallbackType = 'application/octet-stream'
  ): Promise<File> {
    if (!url) {
      throw new Error('Document URL is missing');
    }

    if (
      url.startsWith('blob:') ||
      url.startsWith('data:')
    ) {
      throw new Error(
        `Temporary document URL cannot be restored: ${url}`
      );
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch document. HTTP ${response.status}: ${url}`
      );
    }

    const blob = await response.blob();

    return new File(
      [blob],
      filename || 'document',
      {
        type:
          blob.type ||
          fallbackType
      }
    );
  }

  private async appendKycFile(
    fd: FormData,
    key: string,
    formDataKey: string,
    fallbackType: string = 'application/octet-stream'
  ): Promise<void> {
    // Case 1: user newly selected file
    const file = this.files?.[key];
    if (file instanceof File) {
      fd.append(formDataKey, this.files[key]);
      return;
    }

    // Case 2: file came from summary patch as URL/meta
    const meta = this.uploadedFileMeta?.[key];

    const fileUrl =
      meta?.viewUrl ||
      meta?.fileUrl ||
      meta?.url ||
      this.uploadedPreviewUrls?.[key];

    if (fileUrl && meta?.fileName) {
      const fileFromUrl = await this.urlToFile(
        fileUrl,
        meta.fileName,
        meta.type || fallbackType
      );

      fd.append(formDataKey, fileFromUrl, fileFromUrl.name);
    }
  }
  private getCurrentCoApplicantStoredData(): any {
   const index =
  Number(
    this.route.snapshot.queryParams['coApplicantIndex']
  ) ||
  this.stepperService.getCurrentCoApplicantIndex() ||
  1;

    const key = `coApplicants_${this.applicationId}`;
    const saved = localStorage.getItem(key);

    let list: any[] = [];

    try {
      const parsed = saved ? JSON.parse(saved) : [];
      list = Array.isArray(parsed) ? parsed : [];
    } catch {
      list = [];
    }

    return list.find((x: any) => Number(x.index) === Number(index)) || null;
  }

  next() {

    if (!this.kycForm) {
      console.error('KYC form not found');
      return;
    }

    const formValue = this.kycForm.value;

    if (this.isPassportRequired() && !formValue.Passport) {
      console.log('Passport number is mandatory for fresh main applicant');
      return;
    }


    if (
      !this.kycForm.valid ||
      !this.allRequiredFilesUploaded ||
      !(this.isPermanentMailingChecked || this.isCurrentMailingChecked)
    ) {
      console.log('KYC form invalid');
      return;
    }

    const currentPayload = this.buildKycPayload(this.kycForm.value);

    const hasChanged = this.isKycPayloadChanged(
      currentPayload,
      this.lastSavedPayload
    );


    const hasNewFiles = this.hasNewKycFiles();

    const stepRoute = this.isCoApplicant ? 'co-kyc' : 'kycinfo';

    //  No changes + no new files = skip API
    if (!hasChanged && !hasNewFiles) {
      console.log('No KYC changes detected, skipping API');

      this.stepperService.markStepCompleted(stepRoute);
      this.stepperService.setStepData(stepRoute, currentPayload);
      this.stepperService.next();

      return;
    }


    this.kycupload(this.kycForm);

  }
  handleSuccessAction() {
    this.stepperService.next();
  }
  onCancel() {
    this.issuccess = false;
  }
  buildKycPayload(formValue: any) {
    const storedCoApp = this.isCoApplicant
      ? this.getCurrentCoApplicantStoredData()
      : null;

    const custId = this.editMode
  ? this.editUserData.custId :
  this.userid? this.userid.cifId
  : this.isCoApplicant
    ? (
      storedCoApp?.custId ||
      storedCoApp?.cifId ||
      storedCoApp?.customerId ||
      this.custId ||
      this.co_userid?.custId ||
      this.co_userid?.cifId ||
      this.co_userid?.customerId ||
      ''
    )
    : (
      this.userid?.custId ||
      this.userid?.cifId ||
      this.userid?.customerId ||
      this.custId ||
      ''
    );

    const firstName = this.editMode
      ? this.editUserData.fname
      : this.isCoApplicant
        ? this.co_userid?.fullName
        : this.userdata?.fname;

    const lastName = this.editMode
      ? this.editUserData.lname
      : this.isCoApplicant
        ? this.co_userid?.fullName
        : this.userdata?.lname;

    const custId1 = this.editMode
      ? this.editUserData.custId
      : this.isCoApplicant
        ? this.co_userid?.cifId
        : this.userid?.cifId;

    const permanentAddress = {
      addressType: 'PERMANENT',
      addressLine: formValue.addressline1 || '',
      addressLine1: formValue.addressline2 || '',
      addressLine2: formValue.addressline3 || '',
      city: this.perselectedCityLabel || '',
      cityId: this.perselectedCityId || this.perCitySelectedOption || '',
      state: this.perselectedStateLabel || '',
      stateId: this.perselectedStateId || this.perStateSelectedOption || '',
      isPreferredAddress: this.isDifferentAddress === false ? 1 : 0,
      isMailingAddress: this.isDifferentAddress ? 1 : 0,
      zipCode: formValue.perpincode || '',
      country: 'India'
    };


    const currentAddress = {
      addressType: 'CURRENT',
      addressLine: formValue.addressline1 || '',
      addressLine1: formValue.addressline2 || '',
      addressLine2: formValue.addressline3 || '',
      city: this.perselectedCityLabel || '',
      cityId: this.perselectedCityId || this.perCitySelectedOption || '',
      state: this.perselectedStateLabel || '',
      stateId: this.perselectedStateId || this.perStateSelectedOption || '',
      isPreferredAddress: this.isDifferentAddress == false ? 1 : 0,
      isMailingAddress: this.isDifferentAddress == false ? 1 : 0,
      zipCode: formValue.perpincode || '',
      country: 'India'
    };


    const otherAddress = {
      addressType: 'OTHER',
      addressLine: formValue.currentaddressline1 || '',
      addressLine1: formValue.currentaddressline2 || '',
      addressLine2: formValue.currentaddressline3 || '',
      city: this.currselectedCityLabel,
      cityId: this.currselectedCityId || this.currCitySelectedOption || '',
      state: this.currselectedStateLabel,
      stateId: this.currselectedStateId || this.currStateSelectedOption || '',
      isPreferredAddress: this.isDifferentAddress == true ? 1 : 0,
      isMailingAddress: this.isDifferentAddress == true ? 1 : 0,
      zipCode: formValue.currpincode || '',
      country: 'India'
    };


    return {
      applicationId: this.applicationId,
      applicantId: this.applicantId,
      custId: custId || this.custId,

      firstName: firstName || this.firstName,
      lastName: lastName || this.lastName,

      dob: formValue.dob
        ? moment.isMoment(formValue.dob)
          ? formValue.dob.format('YYYY-MM-DD')
          : moment(formValue.dob).format('YYYY-MM-DD')
        : null,

      aadhaarNumber: formValue.aadharnum || '',
      panNumber: formValue.pan ? formValue.pan.toUpperCase() : '',
      passportNo: formValue.Passport || '',

      addressType: this.addressType,
      isDifferentAddress: this.isDifferentAddress,
      isPermanentMailingChecked: this.isPermanentMailingChecked,
      isCurrentMailingChecked: this.isCurrentMailingChecked,

      selectedSecondaryProof: this.selectedSecondaryProof || '',

      addresses: this.isDifferentAddress
        ? [permanentAddress, currentAddress, otherAddress]
        : [permanentAddress, currentAddress],



      fileMeta: {
        pan: this.uploadedFileMeta['pan'] || {
          fileName: this.uploadedFiles['pan']?.name || '',
          fileUrl: this.uploadedPreviewUrls['pan'] || '',
          uploaded: !!this.uploadedFiles['pan']
        },

        aadharfront: this.uploadedFileMeta['aadharfront'] || {
          fileName: this.uploadedFiles['aadharfront']?.name || '',
          fileUrl: this.uploadedPreviewUrls['aadharfront'] || '',
          uploaded: !!this.uploadedFiles['aadharfront']
        },

        aadharback: this.uploadedFileMeta['aadharback'] || {
          fileName: this.uploadedFiles['aadharback']?.name || '',
          fileUrl: this.uploadedPreviewUrls['aadharback'] || '',
          uploaded: !!this.uploadedFiles['aadharback']
        },

        passport: this.uploadedFileMeta['passport'] || {
          fileName: this.uploadedFiles['passport']?.name || '',
          fileUrl: this.uploadedPreviewUrls['passport'] || '',
          uploaded: !!this.uploadedFiles['passport']
        },

        secaddress: this.uploadedFileMeta['secaddress'] || {
          fileName: this.uploadedFiles['secaddress']?.name || '',
          fileUrl: this.uploadedPreviewUrls['secaddress'] || '',
          uploaded: !!this.uploadedFiles['secaddress']
        }
      }

    };
  }
private createKycLocalCache(input: any): any {
  if (!input) {
    return null;
  }

  const cleanFileMeta: Record<string, any> = {};

  Object.entries(
    input.fileMeta || {}
  ).forEach(([key, rawMeta]) => {
    const meta: any = rawMeta;

    const url =
      meta?.viewUrl ||
      meta?.fileUrl ||
      meta?.url ||
      '';

    const isTemporary =
      url.startsWith('blob:') ||
      url.startsWith('data:');

    cleanFileMeta[key] = {
      fileName: meta?.fileName || '',
      viewUrl: isTemporary ? '' : url,
      fileUrl: isTemporary ? '' : url,
      documentId: meta?.documentId || '',
      objectKey: meta?.objectKey || '',
      uploaded:
        !isTemporary &&
        !!meta?.fileName,
      localOnly: isTemporary
    };
  });

  return {
    applicationId: input.applicationId || '',
    applicantId: input.applicantId || '',
    custId: input.custId || '',

    ...this.buildKycApiData_saveexit(input),

    fileMeta: cleanFileMeta
  };
}



  saveExit(): void {
    const storedCoApp = this.isCoApplicant
      ? this.getCurrentCoApplicantStoredData()
      : null;
const custId = this.editMode
  ? this.editUserData.custId
  : this.isCoApplicant
    ? (
      storedCoApp?.custId ||
      storedCoApp?.cifId ||
      storedCoApp?.customerId ||
      this.custId ||
      this.co_userid?.custId ||
      this.co_userid?.cifId ||
      this.co_userid?.customerId ||
      ''
    )
    : (
      this.userid?.custId ||
      this.userid?.cifId ||
      this.userid?.customerId ||
      this.custId ||
      ''
    );

    this.msgBox.open({
      title: 'Are you sure you want to exit?',
      message: '',
      showCancel: true,
      okText: 'Yes',

      // Required because appendKycFile() is asynchronous
      onOk: async () => {
        if (!this.kycForm) {
          console.error('KYC form not found');
          return;
        }

        const apiApplicantId = this.getApiApplicantId();

        if (!apiApplicantId) {
          console.error('Applicant ID is missing');
          return;
        }

        if (!custId) {
          console.error('Customer ID is missing');
          return;
        }

        const formValue = this.kycForm.value;
        const input = this.buildKycPayload(formValue);

        const hasChanged = this.isKycPayloadChanged(
          input,
          this.lastSavedPayload
        );

        const hasNewFiles = this.hasNewKycFiles();

        const localCache = this.createKycLocalCache(input);

        localStorage.setItem(
          this.getStorageKey(),
          JSON.stringify(localCache)
        );

        // No changes: API call is unnecessary, but exit should continue.
        if (!hasChanged && !hasNewFiles) {
          console.log(
            'No KYC changes detected, skipping save-exit API'
          );

          this.router.navigate(['/admin/losoperation']);
          return;
        }

        try {
          const formData = new FormData();


          formData.append('applicationId', this.applicationId);
          formData.append('applicantId', apiApplicantId);
          formData.append('custId', String(custId));
          formData.append('sectionKey', 'KYC');


          const kycData = this.buildKycApiData_saveexit(input);

          formData.append(
            'kycData',
            JSON.stringify(kycData)
          );


          await Promise.all([
            this.appendNewOrExistingKycFile(
              formData,
              'pan',
              'panFile'
            ),

            this.appendNewOrExistingKycFile(
              formData,
              'aadharfront',
              'aadharFrontFile'
            ),

            this.appendNewOrExistingKycFile(
              formData,
              'aadharback',
              'aadharBackFile'
            ),

            this.appendNewOrExistingKycFile(
              formData,
              'passport',
              'passportFile'
            ),

            this.appendNewOrExistingKycFile(
              formData,
              'secaddress',
              'utilityBillFile'
            )
          ]);

          // Debug multipart payload.
          formData.forEach((value, key) => {
            if (value instanceof File) {
              console.log(
                `FormData file: ${key}`,
                value.name,
                value.type,
                value.size
              );
            } else {
              console.log(`FormData text: ${key}`, value);
            }
          });

          this.loanservice.saveandExitKYCData(formData).subscribe({
            next: (response: any) => {
              console.log(
                'KYC save and exit successful',
                response
              );

              this.lastSavedPayload =
                this.normalizeKycPayload(input);

              this.router.navigate(['/admin/losoperation']);
            },

            error: (error: any) => {
              console.error(
                'KYC save and exit failed',
                error
              );
            }
          });
        } catch (error) {
          console.error(
            'Failed to prepare KYC save-exit payload',
            error
          );
        }
      }
    });
  }

  private buildKycApiData_saveexit(input: any): any {
    return {
      firstName: input?.firstName || '',
      lastName: input?.lastName || '',
      dob: input?.dob || null,
      panNumber: input?.panNumber || '',
      aadhaarNumber: input?.aadhaarNumber || '',
      passportNo: input?.passportNo || '',
      custId: input?.custId || '',
      addresses: Array.isArray(input?.addresses)
        ? input.addresses.map((address: any) => ({
          addressType: address?.addressType || '',
          addressLine: address?.addressLine || '',
          addressLine1: address?.addressLine1 || '',
          addressLine2: address?.addressLine2 || '',
          city: address?.city || '',
          cityId: address?.cityId || '',
          state: address?.state || '',
          stateId: address?.stateId || '',
          isPreferredAddress: Number(
            address?.isPreferredAddress || 0
          ),
          isMailingAddress: Number(
            address?.isMailingAddress || 0
          ),
          zipCode: address?.zipCode || '',
          country: address?.country || 'India'
        }))
        : []
    };
  }
  private async appendNewOrExistingKycFile(
    formData: FormData,
    localKey: string,
    apiFieldName: string
  ): Promise<void> {
    /*
     * Priority 1:
     * The user selected a new file during the current session.
     */
    const newFile = this.files?.[localKey];

    if (newFile instanceof File) {
      formData.append(
        apiFieldName,
        newFile,
        newFile.name
      );

      return;
    }

    /*
     * Priority 2:
     * The file was previously saved and restored from getSavedKycInfo().
     */
    const meta = this.uploadedFileMeta?.[localKey];

    if (!meta?.fileName) {
      console.log(
        `No new or existing file available for ${localKey}`
      );

      return;
    }

    const backendUrl =
      meta?.viewUrl ||
      meta?.fileUrl ||
      meta?.url ||
      '';

    if (!backendUrl) {
      console.warn(
        `Existing ${localKey} has a file name but no backend URL`,
        meta
      );

      return;
    }

    /*
     * Never attempt to restore expired local browser URLs.
     */
    if (
      backendUrl.startsWith('blob:') ||
      backendUrl.startsWith('data:')
    ) {
      console.warn(
        `Ignoring temporary URL for ${localKey}`,
        backendUrl
      );

      return;
    }

    try {
      const existingFile = await this.urlToFile(
        backendUrl,
        meta.fileName,
        meta.type || 'application/octet-stream'
      );

      formData.append(
        apiFieldName,
        existingFile,
        existingFile.name
      );
    } catch (error) {
      console.error(
        `Could not restore existing ${localKey} file`,
        {
          fileName: meta.fileName,
          backendUrl,
          error
        }
      );
      throw error;
    }
  }

 getSavedKycInfo(
    applicantId: any,
    custId: any
  ): Promise<any> {
    const sectionKey = 'KYC';

    return new Promise(resolve => {
      this.loanservice
        .getSavedkYCData(custId, sectionKey)
        .subscribe({
          next: (res: any) => {
            if (
              res?.status !== 'success' ||
              !res?.data?.data
            ) {
              resolve(null);
              return;
            }

            const responseData = res.data.data;

            let data: any = {};

            try {
              const rawKycData =
                responseData.kycData ??
                responseData.kycdata ??
                {};

              data =
                typeof rawKycData === 'string'
                  ? JSON.parse(rawKycData)
                  : rawKycData || {};
            } catch (error) {
              console.error(
                'Invalid KYC data returned by API',
                error
              );

              data = {};
            }

            const documents = Array.isArray(
              responseData.uploadedDocuments
            )
              ? responseData.uploadedDocuments
              : [];

            const getDocument = (
              ...acceptedTypes: string[]
            ) => {
              const normalizedTypes =
                acceptedTypes.map(type =>
                  this.normalizeDocumentType(type)
                );

              return documents.find((document: any) => {
                const documentType =
                  this.normalizeDocumentType(
                    document?.docType ||
                    document?.documentType ||
                    document?.type
                  );

                return normalizedTypes.includes(
                  documentType
                );
              });
            };

            const toMeta = (document: any) => {
              if (!document) {
                return {
                  fileName: '',
                  fileUrl: '',
                  viewUrl: '',
                  documentId: '',
                  objectKey: '',
                  uploaded: false,
                  localOnly: false
                };
              }

              const permanentUrl =
                document?.viewUrl ||
                document?.fileUrl ||
                document?.downloadUrl ||
                document?.url ||
                '';

              return {
                fileName:
                  document?.fileName ||
                  document?.originalFileName ||
                  document?.name ||
                  '',

                fileUrl: permanentUrl,
                viewUrl: permanentUrl,

                documentId:
                  document?.documentId ||
                  document?.id ||
                  '',

                objectKey:
                  document?.objectKey ||
                  '',

                type:
                  document?.contentType ||
                  document?.mimeType ||
                  '',

                uploaded: true,
                localOnly: false
              };
            };

            if (
  data?.applicantId &&
  String(data.applicantId) !== String(applicantId)
) {
  console.warn('Ignoring KYC returned for another applicant', {
    requestedApplicantId: applicantId,
    returnedApplicantId: data.applicantId
  });

  resolve(null);
  return;
}

            data = {
              ...data,

              applicationId:
                data.applicationId ||
                this.applicationId,

              applicantId:
                data.applicantId ||
                applicantId,

              custId:
                data.custId ||
                custId,

              fileMeta: {
                pan: toMeta(
                  getDocument('PAN', 'PAN_CARD')
                ),

                aadharfront: toMeta(
                  getDocument(
                    'AADHAAR_FRONT',
                    'AADHAR_FRONT'
                  )
                ),

                aadharback: toMeta(
                  getDocument(
                    'AADHAAR_BACK',
                    'AADHAR_BACK'
                  )
                ),

                passport: toMeta(
                  getDocument('PASSPORT')
                ),

                secaddress: toMeta(
                  getDocument(
                    'UTILITY_BILL',
                    'SECONDARY_ADDRESS_PROOF'
                  )
                )
              }
            };

            resolve(data);
          },

          error: (error: any) => {
            console.error(
              'Unable to retrieve saved KYC data',
              error
            );

            resolve(null);
          }
        });
    });
  }
  private normalizeDocumentType(value: any): string {
    return String(value || '')
      .trim()
      .toUpperCase()
      .replace(/[\s-]+/g, '_');
  }
  private mergeFileMeta(
    existingMeta: Record<string, any> = {},
    incomingMeta: Record<string, any> = {}
  ): Record<string, any> {
    const keys = [
      'pan',
      'aadharfront',
      'aadharback',
      'passport',
      'secaddress'
    ];

    const result: Record<string, any> = {};

    keys.forEach(key => {
      const incoming = incomingMeta?.[key];
      const existing = existingMeta?.[key];

      result[key] =
        incoming?.fileName
          ? incoming
          : existing || {
            fileName: '',
            fileUrl: '',
            viewUrl: '',
            uploaded: false
          };
    });

    return result;
  }
  async restoreKycData() {
    const key = this.getStorageKey();

    const localData = localStorage.getItem(key);
    const parsedLocal = localData ? JSON.parse(localData) : null;
    const apiApplicantId = this.getApiApplicantId();
    const apiData = await this.getSavedKycInfo(apiApplicantId, parsedLocal.custid || this.custId || '');

    if (!apiApplicantId) {

      return;
    }

    let finalData = null;

    if (apiData) {
      finalData = apiData;
      localStorage.setItem(key, JSON.stringify(apiData));
    } else if (parsedLocal) {
      finalData = parsedLocal;
    }

    if (!finalData) {
      this.lastSavedPayload = null;
      return;
    }

    setTimeout(() => {
      this.patchKycInfo(finalData);
      this.lastSavedPayload = this.normalizeKycPayload(finalData);


      if (this.isCoApplicant) {
        this.stepperService.markStepCompleted('co-kyc');
      }

    }, 0);
  }
//clear data on refresh
private clearKycFormOnRefresh(): void {
  Object.values(this.uploadedPreviewUrls).forEach(url => {
    if (url?.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  });

  this.files = {};
  this.uploadedFiles = {};
  this.uploadedFileMeta = {};
  this.uploadedPreviewUrls = {};

  this.requiredDocs.forEach(key => {
    this.uploadedFiles[key] = null;
  });

  this.optionalDocs.forEach(key => {
    this.uploadedFiles[key] = null;
  });

  this.lastSavedPayload = null;

  this.addressType = 'same';
  this.isDifferentAddress = false;
  this.selectedSecondaryProof = null;

  this.isPermanentMailingChecked = true;
  this.isCurrentMailingChecked = false;

  this.kycForm?.resetForm();

  this.cd.detectChanges();
}

  // edit flow = patch from summary

  patchKycInfo(data: any) {
    if (!data || !this.kycForm) return;

    const permanentAddress1 = data.addresses?.find((a: any) => a.addressType === 'PERMANENT');
    const currentAddress1 = data.addresses?.find((a: any) => a.addressType === 'CURRENT');
    const otherAddress1 = data.addresses?.find((a: any) => a.addressType === 'OTHER');

    const addresses = Array.isArray(data.addresses)
      ? data.addresses
      : [];

    const permanentAddress = addresses.find(
      (a: any) => a.addressType === 'PERMANENT'
    );

    const currentAddress = addresses.find(
      (a: any) => a.addressType === 'CURRENT'
    );

    const otherAddress = addresses.find(
      (a: any) => a.addressType === 'OTHER'
    );


    const permanentStateId =
      permanentAddress?.stateId ||
      this.stateOptions.find(
        state =>
          state.label?.trim().toLowerCase() ===
          permanentAddress?.state?.trim().toLowerCase()
      )?.value ||
      '';


    const isDifferent =
      data.isDifferentAddress === true ||
      data.addressType === 'different' ||
      !!otherAddress;

    const currentFormAddress = isDifferent
      ? otherAddress || currentAddress || permanentAddress
      : currentAddress || permanentAddress;


    this.addressType = isDifferent ? 'different' : 'same';
    this.isDifferentAddress = isDifferent;

    this.isPermanentMailingChecked =
      data.isPermanentMailingChecked ?? permanentAddress?.isMailingAddress === 1;

    this.isCurrentMailingChecked =
      data.isCurrentMailingChecked ?? currentFormAddress?.isMailingAddress === 1;

    this.selectedSecondaryProof = data.selectedSecondaryProof || null;

    // State values
    this.perStateSelectedOption = permanentStateId || permanentAddress?.stateId || '';
    this.perselectedStateId = permanentStateId || permanentAddress?.stateId || '';
    this.perselectedStateLabel = permanentAddress?.state || '';

    this.currStateSelectedOption =  currentFormAddress?.stateId || '';
    this.currselectedStateId = currentFormAddress?.stateId || '';
    this.currselectedStateLabel = currentFormAddress?.state || '';


    this.perCitySelectedOption = permanentAddress?.cityId || '';
    this.perselectedCityId = permanentAddress?.cityId || '';
    this.perselectedCityLabel = permanentAddress?.city || '';

    this.currCitySelectedOption = currentFormAddress?.cityId || '';

    this.currselectedCityId = currentFormAddress?.cityId || '';
    this.currselectedCityLabel = currentFormAddress?.city || '';

    this.kycForm.form.patchValue({
      dob: data.dob ? moment(data.dob, 'YYYY-MM-DD') : null,
      aadharnum: data.aadhaarNumber || '',
      pan: data.panNumber || '',
      Passport: data.passportNo || '',

      addressline1: permanentAddress?.addressLine || '',
      addressline2: permanentAddress?.addressLine1 || '',
      addressline3: permanentAddress?.addressLine2 || '',
      perpincode: permanentAddress?.zipCode || '',

      currentaddressline1: currentFormAddress?.addressLine || '',
      currentaddressline2: currentFormAddress?.addressLine1 || '',
      currentaddressline3: currentFormAddress?.addressLine2 || '',
      currpincode: currentFormAddress?.zipCode || ''


    });

    if (isDifferent) {
      setTimeout(() => {
        this.kycForm.form.patchValue({
          currentaddressline1: currentFormAddress?.addressLine || '',
          currentaddressline2: currentFormAddress?.addressLine1 || '',
          currentaddressline3: currentFormAddress?.addressLine2 || '',
          currpincode: currentFormAddress?.zipCode || ''
        }, { emitEvent: false });

        this.applyKycViewMode();
      }, 0);
    } else {
      setTimeout(() => {
        this.applyKycViewMode();
      }, 0);
    }
    if (data.dob) {
      this.dobValid = this.isAdult(moment(data.dob, 'YYYY-MM-DD'));
      this.dobTouched = false;
    }

    if (this.perselectedStateId) {
      this.loadPerCities(this.perselectedStateId, permanentAddress?.city || '');
    }

    if (this.currselectedStateId) {
      this.loadCurrCities(this.currselectedStateId, currentFormAddress?.city || '');
    }
    if (data.fileMeta) {
      this.uploadedFileMeta = data.fileMeta;

      Object.keys(data.fileMeta).forEach(key => {
        const file = data.fileMeta[key];

        if (file?.fileName) {
          const url =
            file.viewUrl ||
            file.fileUrl ||
            file.url ||
            '';

          this.uploadedFiles[key] = null;

          this.uploadedFileMeta[key] = {
            ...file,
            fileUrl: url,
            viewUrl: url
          };
        }
      });
    }
  }

  private normalizeKycPayload(payload: any) {
    if (!payload) return null;

    return {
      applicationId: payload.applicationId || '',
      applicantId: payload.applicantId || '',
      custId: payload.custId || '',

      firstName: payload.firstName || '',
      lastName: payload.lastName || '',
      dob: payload.dob || '',
      aadhaarNumber: payload.aadhaarNumber || '',
      panNumber: payload.panNumber || '',
      passportNo: payload.passportNo || '',

      addressType: payload.addressType || '',
      isDifferentAddress: !!payload.isDifferentAddress,
      isPermanentMailingChecked: !!payload.isPermanentMailingChecked,
      isCurrentMailingChecked: !!payload.isCurrentMailingChecked,
      selectedSecondaryProof: payload.selectedSecondaryProof || null,

      addresses: (payload.addresses || []).map((a: any) => ({
        addressType: a.addressType || '',
        addressLine: a.addressLine || '',
        addressLine1: a.addressLine1 || '',
        addressLine2: a.addressLine2 || '',
        city: a.city || '',
        state: a.state || '',
        zipCode: a.zipCode || '',
        country: a.country || 'India',
        isPreferredAddress: Number(a.isPreferredAddress || 0),
        isMailingAddress: Number(a.isMailingAddress || 0)
      })),

      // compare only filename, not blob URL
      fileMeta: {
        pan: payload.fileMeta?.pan?.fileName || '',
        aadharfront: payload.fileMeta?.aadharfront?.fileName || '',
        aadharback: payload.fileMeta?.aadharback?.fileName || '',
        passport: payload.fileMeta?.passport?.fileName || '',
        secaddress: payload.fileMeta?.secaddress?.fileName || ''
      }
    };
  }

  private isKycPayloadChanged(current: any, saved: any): boolean {
    return JSON.stringify(this.normalizeKycPayload(current)) !==
      JSON.stringify(this.normalizeKycPayload(saved));
  }

  private hasNewKycFiles(): boolean {
    return Object.values(this.files || {}).some(value => value instanceof File);
  }
  //to get cif from summary
  private async getCurrentApplicantFromSummary(): Promise<any | null> {
    if (!this.applicationId) {
      return null;
    }

    try {
      const res: any = await firstValueFrom(
        this.loanservice.getSummary(this.applicationId)
      );

      if (res?.status !== 'success' || !res?.data) {
        return null;
      }

      /*
       * Support both common response structures:
       * 1. res.data.applicants
       * 2. res.data directly being an array
       */
      const applicants = Array.isArray(res.data?.applicants)
        ? res.data.applicants
        : Array.isArray(res.data)
          ? res.data
          : [];

      if (!applicants.length) {
        return null;
      }

      if (!this.isCoApplicant) {
        const mainApplicantId =
          this.stepperService.getLoanId()?.[0] ||
          this.applicantId;

        return (
          applicants.find(
            (applicant: any) =>
              String(applicant?.applicantId) ===
              String(mainApplicantId)
          ) ||
          applicants.find(
            (applicant: any) =>
              String(applicant?.applicantType || '')
                .toUpperCase() === 'PRIMARY'
          ) ||
          null
        );
      }

      const coApplicantId =
        this.stepperService.getCo_appId()?.[0] ||
        this.applicantId;

      const coApplicantIndex =
        Number(this.route.snapshot.queryParams['coApplicantIndex'] ) ||
        this.stepperService.getCurrentCoApplicantIndex() ;

      


// return (
//   // First match the co-applicant currently shown in the URL
//   applicants.find((applicant: any) => {
//     const applicantType =
//       String(applicant?.applicantType || '').toUpperCase();

//     const indexFromType = Number(
//       applicantType.match(/\d+/)?.[0]
//     );

//     return (
//       applicantType.startsWith('CO_APPLICANT') &&
//       indexFromType === Number(coApplicantIndex)
//     );
//   }) ||

//   // Fallback to applicant ID
//   applicants.find(
//     (applicant: any) =>
//       coApplicantId &&
//       String(applicant?.applicantId) ===
//       String(coApplicantId)
//   ) ||

//   null
// );

return (
  // Applicant ID is the unique owner of KYC data
  applicants.find(
    (applicant: any) =>
      coApplicantId &&
      String(applicant?.applicantId) ===
        String(coApplicantId)
  ) ||

  // Use index only when there is no applicant ID
  (!coApplicantId
    ? applicants.find((applicant: any) => {
        const applicantType =
          String(
            applicant?.applicantType || ''
          ).toUpperCase();

        const indexFromType = Number(
          applicantType.match(/\d+/)?.[0]
        );

        return (
          applicantType.startsWith('CO_APPLICANT') &&
          indexFromType === Number(coApplicantIndex)
        );
      })
    : null) ||

  null
);

    } catch (error) {
      console.error(
        'Failed to get applicant from summary:',
        error
      );

      return null;
    }
  }

  private normalizeSummaryKyc(data: any): any {
    if (!data) return null;

    const identity = data.identityAndResidency || {};
    const permanent = data.permanentAddress || {};
    const current = data.currentAddress || {};
    const other = data.otherAddress || null;


    const isDifferent =
      !!other ||
      identity.isOtherAddress === 1;

    const findStateId = (stateName: string) =>
      this.stateOptions.find(s =>
        s.label?.toLowerCase() === stateName?.toLowerCase()
      )?.value || '';

    const permanentStateId = findStateId(permanent.state);

    const currentStateId = findStateId(current.state);

    const otherStateId = findStateId(other?.state || current.state);

    return {
      applicationId: this.applicationId,
      applicantId: this.applicantId,
      custId: this.isCoApplicant
        ? (
          this.co_userid?.custId ||
          this.co_userid?.cifId ||
          this.co_userid?.customerId ||
          this.custId ||
          ''
        )
        : (
          this.userid?.custId ||
          this.userid?.cifId ||
          this.userid?.customerId ||
          this.custId ||
          ''
        ),

      firstName: this.isCoApplicant
        ? this.co_userid?.fullName || this.firstName
        : this.userdata?.fname || this.firstName,

      lastName: this.isCoApplicant
        ? this.co_userid?.fullName || this.lastName
        : this.userdata?.lname || this.lastName,

      dob: identity.dob
        ? moment(identity.dob, 'DD/MM/YYYY').format('YYYY-MM-DD')
        : null,

      aadhaarNumber: identity.aadhaarNumber || '',
      panNumber: identity.panNumber || '',
      passportNo: identity.passportNumber || '',

      addressType: isDifferent ? 'different' : 'same',
      isDifferentAddress: isDifferent,

      isPermanentMailingChecked:
        permanent.isMailingAddress === 1 || !isDifferent,

      isCurrentMailingChecked:
        isDifferent
          ? other?.isMailingAddress === 1
          : current.isMailingAddress === 1,

      selectedSecondaryProof: null,

      addresses: [
        {
          addressType: 'PERMANENT',
          addressLine: permanent.addressLine || '',
          addressLine1: permanent.addressLine1 || '',
          addressLine2: permanent.addressLine2 || '',
          city: permanent.city || '',
          cityId: '',
          state: permanent.state || '',
          stateId: permanentStateId,
          isPreferredAddress: permanent.isPreferredAddress ?? 1,
          isMailingAddress: permanent.isMailingAddress ?? 1,
          zipCode: permanent.pincode || '',
          country: permanent.country || 'India'
        },
        {
          addressType: 'CURRENT',
          addressLine: current.addressLine || '',
          addressLine1: current.addressLine1 || '',
          addressLine2: current.addressLine2 || '',
          city: current.city || '',
          cityId: '',
          state: current.state || '',
          stateId: findStateId(current.state),
          isPreferredAddress: current.isPreferredAddress ?? 0,
          isMailingAddress: current.isMailingAddress ?? 0,
          zipCode: current.pincode || '',
          country: current.country || 'India'
        },
        ...(isDifferent
          ? [{
            addressType: 'OTHER',
            addressLine: other.addressLine || '',
            addressLine1: other.addressLine1 || '',
            addressLine2: other.addressLine2 || '',
            city: other.city || '',
            cityId: '',
            state: other.state || '',
            stateId: otherStateId,
            isPreferredAddress: other.isPreferredAddress ?? 1,
            isMailingAddress: other.isMailingAddress ?? 1,
            zipCode: other.pincode || '',
            country: other.country || 'India'
          }]
          : [])
      ],

     
      fileMeta: {
  aadharfront: {
    fileName:
      identity?.aadhaarFrontDocument?.fileName ||
      this.getFileNameFromUrl(
        identity?.aadhaarFrontUrl
      ) ||
      '',

    fileUrl:
      identity?.aadhaarFrontDocument?.viewUrl ||
      identity?.aadhaarFrontDocument?.fileUrl ||
      identity?.aadhaarFrontUrl ||
      '',

    viewUrl:
      identity?.aadhaarFrontDocument?.viewUrl ||
      identity?.aadhaarFrontDocument?.fileUrl ||
      identity?.aadhaarFrontUrl ||
      '',

    uploaded: !!(
      identity?.aadhaarFrontDocument?.fileName ||
      identity?.aadhaarFrontUrl
    )
  },

  aadharback: {
    fileName:
      identity?.aadhaarBackDocument?.fileName ||
      this.getFileNameFromUrl(
        identity?.aadhaarBackUrl
      ) ||
      '',

    fileUrl:
      identity?.aadhaarBackDocument?.viewUrl ||
      identity?.aadhaarBackDocument?.fileUrl ||
      identity?.aadhaarBackUrl ||
      '',

    viewUrl:
      identity?.aadhaarBackDocument?.viewUrl ||
      identity?.aadhaarBackDocument?.fileUrl ||
      identity?.aadhaarBackUrl ||
      '',

    uploaded: !!(
      identity?.aadhaarBackDocument?.fileName ||
      identity?.aadhaarBackUrl
    )
  },

  pan: {
    fileName:
      identity?.panDocument?.fileName ||
      this.getFileNameFromUrl(
        identity?.panCardUrl
      ) ||
      '',

    fileUrl:
      identity?.panDocument?.viewUrl ||
      identity?.panDocument?.fileUrl ||
      identity?.panCardUrl ||
      '',

    viewUrl:
      identity?.panDocument?.viewUrl ||
      identity?.panDocument?.fileUrl ||
      identity?.panCardUrl ||
      '',

    uploaded: !!(
      identity?.panDocument?.fileName ||
      identity?.panCardUrl
    )
  },

  passport: {
    fileName:
      identity?.passportDocument?.fileName ||
      this.getFileNameFromUrl(
        identity?.passportUrl
      ) ||
      '',

    fileUrl:
      identity?.passportDocument?.viewUrl ||
      identity?.passportDocument?.fileUrl ||
      identity?.passportUrl ||
      '',

    viewUrl:
      identity?.passportDocument?.viewUrl ||
      identity?.passportDocument?.fileUrl ||
      identity?.passportUrl ||
      '',

    uploaded: !!(
      identity?.passportDocument?.fileName ||
      identity?.passportUrl
    )
  },

  secaddress: {
    fileName:
      other?.supportingDocument?.fileName ||
      current?.supportingDocument?.fileName ||
      permanent?.supportingDocument?.fileName ||
      this.getFileNameFromUrl(
        other?.supportingDocumentUrl ||
        current?.supportingDocumentUrl ||
        permanent?.supportingDocumentUrl
      ) ||
      '',

    fileUrl:
      other?.supportingDocument?.viewUrl ||
      current?.supportingDocument?.viewUrl ||
      permanent?.supportingDocument?.viewUrl ||
      other?.supportingDocumentUrl ||
      current?.supportingDocumentUrl ||
      permanent?.supportingDocumentUrl ||
      '',

    viewUrl:
      other?.supportingDocument?.viewUrl ||
      current?.supportingDocument?.viewUrl ||
      permanent?.supportingDocument?.viewUrl ||
      other?.supportingDocumentUrl ||
      current?.supportingDocumentUrl ||
      permanent?.supportingDocumentUrl ||
      '',

    uploaded: !!(
      other?.supportingDocument?.fileName ||
      current?.supportingDocument?.fileName ||
      permanent?.supportingDocument?.fileName ||
      other?.supportingDocumentUrl ||
      current?.supportingDocumentUrl ||
      permanent?.supportingDocumentUrl
    )
  }
}
    };
  }

  private getFileNameFromUrl(url: any): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  try {
    const cleanUrl = url.split('?')[0];
    return decodeURIComponent(cleanUrl.substring(cleanUrl.lastIndexOf('/') + 1));
  } catch {
    return '';
  }
}
  private hasAnyKycData(data: any): boolean {
    if (!data) return false;

    return !!(
      data.dob ||
      data.aadhaarNumber ||
      data.panNumber ||
      data.passportNo ||
      data.addresses?.length ||
      data.fileMeta?.aadharfront?.fileName ||
      data.fileMeta?.aadharback?.fileName ||
      data.fileMeta?.pan?.fileName ||
      data.fileMeta?.passport?.fileName ||
      data.fileMeta?.secaddress?.fileName
    );
  }

  private isKycComplete(data: any): boolean {
    if (!data) return false;

    const hasBase =
      !!data.dob &&
      !!data.aadhaarNumber &&
      !!data.panNumber &&
      !!data.fileMeta?.aadharfront?.fileName &&
      !!data.fileMeta?.aadharback?.fileName &&
      !!data.fileMeta?.pan?.fileName;

    const passportOk = this.isPassportRequired()
      ? !!data.passportNo
      : true;

    const permanent = data.addresses?.find((a: any) => a.addressType === 'PERMANENT');
    const other = data.addresses?.find((a: any) => a.addressType === 'OTHER');

    const permanentOk =
      !!permanent?.addressLine &&
      !!permanent?.state &&
      !!permanent?.city &&
      !!permanent?.zipCode;

    const otherOk = !data.isDifferentAddress
      ? true
      : !!other?.addressLine &&
      !!other?.state &&
      !!other?.city &&
      !!other?.zipCode &&
      !!data.fileMeta?.secaddress?.fileName;

    return hasBase && passportOk && permanentOk && otherOk;
  }

  // disable mode when came from summary
  private applyKycViewMode(): void {
    if (!this.kycForm?.form) return;

    if (this.viewOnly || (this.isSummaryEditMode && !this.isEditMode)) {
      this.kycForm.form.disable({ emitEvent: false });

      Object.keys(this.kycForm.form.controls).forEach(key => {
        this.kycForm.form.get(key)?.disable({ emitEvent: false });
      });
    }

    this.cd.detectChanges();
  }
  ngOnDestroy(): void {
    sessionStorage.removeItem('kycs');

    Object.values(this.uploadedPreviewUrls).forEach(url => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    });

  }

}
