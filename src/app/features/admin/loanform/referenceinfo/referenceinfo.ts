import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { Buttons } from '../../../systemdesign/buttons/buttons';
import { AbstractControl, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Loanformservice } from '../../../../core/service/loanformservice';
import { Loanstepperservice } from '../../../../core/service/loanstepperservice';
import { Main } from '../../../../core/service/main';
import { Msgboxservice } from '../../../../core/service/msgboxservice';
import { Inputfield } from '../../../systemdesign/inputfield/inputfield';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { Addcustomerservice } from '../../../../core/service/addcustomerservice';
import { Checkbox } from '../../../systemdesign/checkbox/checkbox';
import * as bootstrap from 'bootstrap';
import { Dropdown } from '../../../systemdesign/dropdown/dropdown';
import { Successbox } from '../../customer/successbox/successbox';
import { firstValueFrom } from 'rxjs';
import { Messagebox } from "../../../systemdesign/messagebox/messagebox";

interface OptionItem {
  label: string;
  value: string;
}

@Component({
  selector: 'app-referenceinfo',
  imports: [CommonModule, Buttons, ReactiveFormsModule, Inputfield, Checkbox, FormsModule, Dropdown, Successbox,Messagebox],
  templateUrl: './referenceinfo.html',
  styleUrl: './referenceinfo.scss'
})
export class Referenceinfo implements OnInit {

  openIndex: number[] = [0];
  accordions = [
    { title: 'Reference 1', alwaysOpen: true },
    { title: 'Reference 2', alwaysOpen: false },
  ];
  referenceForm!: FormGroup

  isdata: boolean = false;

  private mobileSubject = new Subject<string>();
  ismiddlename: boolean[] = [false, false];

  perStateSelectedOption: any;
  perCitySelectedOption: any;

  selectedStateId: string[] = ['', ''];
  selectedCityId: string[] = ['', ''];


  stateOptions: OptionItem[] = [];
  cityOptions: OptionItem[] = [];

  perselectedStateId!: string;
  perselectedStateLabel!: string;

  perselectedCityId!: string;
  perselectedCityLabel!: string;

  perselectedStateLabelArr: string[] = ['', ''];
  perselectedCityLabelArr: string[] = ['', ''];

  // mobileNumber:any;
  popupStep = 1;
  currentRefIndex = 0;
  mobileNumber = '';
  private modalInstance: bootstrap.Modal | null = null;


  reference1Filled = false;
  reference2Filled = false;
  isSearchDone = false;

  applicantId: any;
  applicationId: any;

  showmiddlenameError = false;
  submitAttempted = false;
  reference1Touched = false;
  reference2Touched = false;

  savedReferenceData: any[] = [{}, {}];
  firstPhoneEnteredRef: 1 | 2 | null = null;
  private successModalInstance: bootstrap.Modal | null = null;
  @ViewChild('phone') phone!: any;

  isCoApplicant: boolean = false;
  lastSavedPayload: any = null;
  isSummaryEditMode = false;
  viewOnly = false;

  //edit from summary
   //edit from summary
  isFromSummary = false;
  isViewMode = false;
  isEditMode = false;
  originalFormValue: any = null;
  
  editSuccess: any = false;
  description1 = `Great ! Your Reference Info Details\n Uploaded Successfully.`;


  constructor(private fb: FormBuilder, private stepperService: Loanstepperservice, private cd: ChangeDetectorRef, private loanformservice: Loanformservice, private msgBox: Msgboxservice,
    private router: Router, private route: ActivatedRoute, public main: Main, private apiservice: Addcustomerservice) { }
  async ngOnInit() {
    this.isCoApplicant = this.router.url.includes('co-applicant');
    this.stepperService.setStepperType(
      this.isCoApplicant ? 'CO_APPLICANT' : 'MAIN'
    );
    if (this.isCoApplicant) {
      this.stepperService.restoreCoAppIdFromSession();
    }

    this.stepperService.restoreLoanEditContext();
    this.stepperService.restoreLoanIdFromSession();

    let Allids = this.stepperService.getLoanId();

    this.applicantId = Allids[0];
    this.applicationId = Allids[1];


    let AllCoapp_ids = this.stepperService.getCo_appId();

    const queryParams = this.route.snapshot.queryParams;

    this.isSummaryEditMode =
      queryParams['fromSummary'] === true ||
      queryParams['fromSummary'] === 'true' ||
      this.loanformservice.isSummaryEditFlow();

    this.viewOnly = this.isSummaryEditMode && (queryParams['mode'] === 'view' || queryParams['mode'] === undefined);
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

        // restore back into service
        this.stepperService.setCurrentCoApplicantIndex(parsed.coApplicantIndex || 1);
        this.stepperService.setCo_appId(
          parsed.applicantId,
          parsed.applicationId,
          parsed.fullName,
          undefined, parsed.coApplicantIndex || 1);
      }
    }
    if (this.isCoApplicant) {
      this.applicantId = AllCoapp_ids?.[0];
      this.applicationId = AllCoapp_ids?.[1];
    } else {
      this.applicantId = Allids?.[0];
      this.applicationId = Allids?.[1];
    }


    this.referenceForm = this.fb.group({
      reference1: this.fb.array([this.createReferenceGroup()]),
      reference2: this.fb.array([this.createReferenceGroup()])
    },

      {
        validators: this.referenceUniquenessValidator
      }
    )

    this.states()


    await this.statesAsync();

    if (this.viewOnly) {
      this.referenceForm.disable({ emitEvent: false });
    }

    await this.loadReferencesForBothFlows();

    this.isFromSummary = this.loanformservice.isSummaryEditFlow();

    if (this.isFromSummary) {
      this.isViewMode = true;
      this.referenceForm.disable();
    }

  }
  getStorageKey() {
    const index = this.stepperService.getCurrentCoApplicantIndex();
    // return this.isCoApplicant
    //   ? `referenceinfoData_coapp_${this.applicantId}_${index}`
    //   : `referenceinfoData_main_${this.applicantId}`;

    return `referenceinfoData_main_${this.applicationId}_${this.stepperService.getLoanId()?.[0]}`;
  }

  getStepRoute() {
    return this.isCoApplicant ? 'co-referenceinfo' : 'referenceinfo';
  }
  getApiApplicantId() {
    if (!this.isCoApplicant) {
      return this.stepperService.getLoanId()?.[0];
    }

    return this.stepperService.getCo_appId()?.[0] || null;
  }
  private async loadReferencesForBothFlows() {
    const key = this.getStorageKey();

    const localData = localStorage.getItem(key);
    const parsedLocal = localData ? JSON.parse(localData) : null;

    const draftData = await this.getSavedReferenceInfo();

    const summarySection = await this.getSummarySection('references');

    let finalData = null;

    if (this.isSummaryEditMode) {
      finalData =
        this.normalizeReferences(summarySection) ||
        this.normalizeReferences(draftData) ||
        this.normalizeReferences(parsedLocal);
    } else {
      finalData =
        this.normalizeReferences(draftData) ||
        this.normalizeReferences(summarySection) ||
        this.normalizeReferences(parsedLocal);
    }

    if (!finalData) {
      this.lastSavedPayload = null;
      return;
    }

    this.loanformservice.referenceInfoData = finalData;

    this.patchReferenceData();

    this.reference1Filled = finalData.reference1Filled || false;
    this.reference2Filled = finalData.reference2Filled || false;

    this.savedReferenceData[0] = finalData.reference1?.[0] || {};
    this.savedReferenceData[1] = finalData.reference2?.[0] || {};

    this.lastSavedPayload = this.buildReferencePayload();

    localStorage.setItem(key, JSON.stringify(finalData));

    this.stepperService.markStepCompleted(this.getStepRoute());
    this.cd.detectChanges();
  }

  private async getSummarySection(sectionKey: string): Promise<any> {
    if (!this.applicationId) return null;

    try {
      const res: any = await firstValueFrom(
        this.loanformservice.getSummary(this.applicationId)
      );

      if (!res || res.status !== 'success') return null;

      return this.loanformservice.getApplicantSectionFromSummary(
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
  private normalizeReferences(data: any): any {
    if (!data) return null;

    // Already local/draft format
    if (data.reference1 || data.reference2) {
      const reference1 = Array.isArray(data.reference1) ? data.reference1 : [];
      const reference2 = Array.isArray(data.reference2) ? data.reference2 : [];

      if (!reference1.length && !reference2.length) return null;

      return {
        reference1,
        reference2,
        reference1Filled: data.reference1Filled ?? reference1.length > 0,
        reference2Filled: data.reference2Filled ?? reference2.length > 0
      };
    }

    const references = Array.isArray(data) ? data : [];

    if (!references.length) return null;

    const mapReference = (r: any) => ({
      fname: r.firstName || r.fname || '',
      mname: r.middleName || r.mname || '',
      lname: r.lastName || r.lname || '',
      email: r.emailId || r.email || '',
      peraddressline1: r.addressLine1 || r.peraddressline1 || '',
      peraddressline2: r.addressLine2 || r.peraddressline2 || '',
      peraddressline3: r.addressLine3 || r.peraddressline3 || '',
      percountry: r.country || 'India',

      // If dropdown expects ID, map state/city name to ID separately.
      perstate: r.state || r.perstate || '',
      percity: r.city || r.percity || '',

      perpincode: r.pincode || r.perpincode || '',
      phone: r.mobileNumber || r.phone || ''
    });

    const ref1 =
      references.find((r: any) =>
        r.referenceType === 'reference1' ||
        r.referenceType === 'REFERENCE_1'
      ) ||
      references[0];

    const ref2 =
      references.find((r: any) =>
        r.referenceType === 'reference2' ||
        r.referenceType === 'REFERENCE_2'
      ) ||
      references[1];

    return {
      reference1: ref1 ? [mapReference(ref1)] : [],
      reference2: ref2 ? [mapReference(ref2)] : [],
      reference1Filled: !!ref1,
      reference2Filled: !!ref2
    };
  }

  get f() {
    return this.referenceForm.controls;
  }
  get reference1Array(): FormArray {
    return this.referenceForm.get('reference1') as FormArray;
  }

  get reference2Array(): FormArray {
    return this.referenceForm.get('reference2') as FormArray;
  }
  getRefControl(type: string, i: number, control: string) {
    return (this.referenceForm.get(type) as FormArray).at(i).get(control);
  }

  getRefControl1(type: string, i: number, control: string) {
    const array = this.referenceForm.get(type) as FormArray;
    if (!array || !array.at(i)) return null;
    return array.at(i).get(control);
  }

  onMobileInput(event: any) {
    const value = event.target.value;
    this.mobileSubject.next(value);
  }
  onmiddlename(value: boolean) {
    this.ismiddlename[this.currentRefIndex] = value;

    const array = this.currentRefIndex === 0 ? this.reference1Array : this.reference2Array;
    const mnameCtrl = array.at(0).get('mname');

    if (value) {
      // Checkbox is checked: Clear and disable the control
      mnameCtrl?.setValue('');
      mnameCtrl?.clearValidators();
      mnameCtrl?.updateValueAndValidity();
      mnameCtrl?.disable();
    } else {
      // Checkbox unchecked: Enable and require it again
      mnameCtrl?.enable();
      mnameCtrl?.setValidators([Validators.pattern('^[A-Za-z ]+$'), Validators.minLength(2), Validators.maxLength(25)]);
      mnameCtrl?.updateValueAndValidity();
    }
  }

  searchMobile(mobile: string) {
    const searchedMobile = String(mobile || '').trim();
     if (!/^[6-9][0-9]{9}$/.test(searchedMobile)) {    return;  }

    this.mobileNumber = mobile;
    let input = {
      identifier: mobile,
      type: "MOBILE",
      "applicantType": "PRIMARY", //// PRIMARY / CO_APPLICANT
      "coApplicantIndex": 0,

    }

    this.apiservice.customersearch(input).subscribe(res => {
 if (this.mobileNumber !== searchedMobile) {     return;   }

      const isExisting = res.message?.includes('Existing customer found');

      this.isdata = !isExisting;

      const currentArray =
        this.currentRefIndex === 0 ? this.reference1Array : this.reference2Array;

      if (currentArray.length === 0) {
        currentArray.push(this.createReferenceGroup());
      }

      currentArray.at(0).patchValue({
        phone: mobile,
        ...(isExisting ? res.data[0] : {})
      });

      this.isSearchDone = true;
      // this.popupStep = 2;
    });

  }

  goNext(): void {
  if (
    !this.isMobileValid ||
    !this.isSearchDone ||
    this.referenceForm.hasError('samePhone')
  ) {
    this.phone?.control?.markAsTouched();
    this.phone?.control?.updateValueAndValidity();
    return;
  }

  this.popupStep = 2;
}

handleMobileAction(): void {
  if (!this.isMobileValid) {
    this.phone?.control?.markAsTouched();
    this.phone?.control?.updateValueAndValidity();

    this.isSearchDone = false;
    this.isdata = false;
    return;
  }

  if (this.referenceForm.hasError('samePhone')) {
    return;
  }

  if (!this.isSearchDone) {
    this.searchReference();
    return;
  }

  this.goNext();
}
  createReferenceGroup(): FormGroup {
    return this.fb.group({
      fname: ['', [Validators.required, Validators.pattern('^[A-Za-z ]+$'), Validators.minLength(2), Validators.maxLength(25)]],
      mname: ['', [Validators.pattern('^[A-Za-z ]+$'), Validators.minLength(2), Validators.maxLength(25)]],
      lname: ['', [Validators.required, Validators.pattern('^[A-Za-z ]+$'), Validators.minLength(2), Validators.maxLength(25)]],
      email: ['', [Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'), Validators.minLength(10), Validators.maxLength(40)]],
      peraddressline1: ['', [Validators.minLength(2), Validators.maxLength(255)]],
      peraddressline2: ['', [Validators.minLength(2), Validators.maxLength(255)]],
      peraddressline3: ['', [Validators.minLength(2), Validators.maxLength(255)]],
      percountry: ['India'],
      perstate: ['',],
      percity: ['',],
      perpincode: ['', [Validators.minLength(6), Validators.maxLength(6), this.invalidPincodeValidator]],
      phone: ['', Validators.required]
    });
  }

  addReference(type: 'reference1' | 'reference2') {
    (this.referenceForm.get(type) as FormArray).push(this.createReferenceGroup());
  }

  removeReference(type: 'reference1' | 'reference2', index: number) {
    (this.referenceForm.get(type) as FormArray).removeAt(index);
  }


  states() {
    this.main.getIndianstates().subscribe((res: any) => {
      const list = res.data ?? res;

      this.stateOptions = list.map((s: any) => ({
        value: s.id,
        label: s.name
      }));

    });
  }
  private statesAsync(): Promise<void> {
    return new Promise((resolve) => {
      this.main.getIndianstates().subscribe((res: any) => {
        const list = res.data ?? res;

        this.stateOptions = list.map((s: any) => ({
          value: s.id,
          label: s.name
        }));

        resolve();
      });
    });
  }
  selectPerState(id: any) {


    const refIndex = this.currentRefIndex;

    this.selectedStateId[refIndex] = id;
    this.selectedCityId[refIndex] = '';


    const found = this.stateOptions.find(s => s.value === id);
    this.perselectedStateId = found?.value ?? ''
    this.perselectedStateLabel = found?.label ?? '';


    this.perselectedStateLabelArr[refIndex] = found?.label ?? '';

    // reset city for this form only
    this.perselectedCityLabelArr[refIndex] = '';


    const array =
      this.currentRefIndex === 0
        ? this.reference1Array
        : this.reference2Array;

    array.at(0).patchValue({
      perstate: this.perselectedStateId
    });


    this.perCitySelectedOption = null;
    this.perselectedCityId = '';
    this.perselectedCityLabel = '';
    this.cityOptions = [];
    this.loadPerCities(id);
  }

  loadPerCities(id: any, refIndex?: number) {
    this.main.getIndianstatescities(id).subscribe((res: any) => {
      const list = res.data ?? res;

      this.cityOptions = list.map((c: any) => ({
        value: c.id,
        label: c.name
      }));


      if (refIndex !== undefined) {
        const array =
          refIndex === 0 ? this.reference1Array : this.reference2Array;

        this.selectedCityId[refIndex] =
          array.at(0).value.percity || '';
      }

    });
  }

  selectPerCity(id: any) {


    const refIndex = this.currentRefIndex;

    this.selectedCityId[refIndex] = id;


    const found = this.cityOptions.find(c => c.value === id);
    this.perselectedCityId = found?.value ?? ''

    this.perselectedCityLabel = found?.label ?? '';

    this.perselectedCityLabelArr[this.currentRefIndex] = found?.label ?? '';



    const array =
      this.currentRefIndex === 0
        ? this.reference1Array
        : this.reference2Array;

    array.at(0).patchValue({
      percity: this.perselectedCityId
    });


  }


  invalidPincodeValidator(control: AbstractControl): ValidationErrors | null {
    if (control.value === '000000') {
      return { invalidPincode: true };
    }
    return null;
  }

  toggle(index: number) {
    if (this.openIndex.includes(index)) {
      this.openIndex = this.openIndex.filter(i => i !== index);
    } else {
      this.openIndex.push(index);
    }
    this.cd.detectChanges();
  }

  submit() {
  }

  // edit flow = patch from summary
  async patchFromSummary() {
    const section = await this.getSummarySection('references');
    const data = this.normalizeReferences(section);

    if (!data) return;

    this.loanformservice.referenceInfoData = data;

    this.patchReferenceData();

    this.reference1Filled = data.reference1Filled || false;
    this.reference2Filled = data.reference2Filled || false;

    this.savedReferenceData[0] = data.reference1?.[0] || {};
    this.savedReferenceData[1] = data.reference2?.[0] || {};

    this.lastSavedPayload = this.buildReferencePayload();

    this.stepperService.markStepCompleted(this.getStepRoute());

    this.cd.detectChanges();
  }


  patchReferenceData() {
    const data = this.loanformservice.referenceInfoData;
    if (!data) return;

    //    clear first
    this.reference1Array.clear();
    this.reference2Array.clear();

    // ---------------- REFERENCE 1 ----------------
    if (data.reference1?.length) {
      data.reference1.forEach((item: any) => {
        const group = this.createReferenceGroup();
        group.patchValue(item);
        this.reference1Array.push(group);
      });
    } else {
      this.reference1Array.push(this.createReferenceGroup());
    }

    // ---------------- REFERENCE 2 ----------------
    if (data.reference2?.length) {
      data.reference2.forEach((item: any) => {
        const group = this.createReferenceGroup();
        group.patchValue(item);
        this.reference2Array.push(group);
      });
    } else {
      this.reference2Array.push(this.createReferenceGroup());
    }

    this.cd.detectChanges();
  }
  onEmailChange() {

    if (this.currentRefIndex === 1) {
      this.reference2Touched = true;
    }
    if (this.currentRefIndex === 0) {
      this.reference1Touched = true;
    }
    this.referenceForm.updateValueAndValidity({ emitEvent: true });

  }
  get isMobileValid(): boolean {
  return /^[6-9][0-9]{9}$/.test(
    String(this.mobileNumber || '').trim()
  );
}
  onMobileChange(value: string) {
    this.mobileNumber = String(value || '').trim();
    this.isSearchDone = false;
      this.isdata = false;

    if (this.currentRefIndex === 1) {
      this.reference2Touched = true;

      if (!this.firstPhoneEnteredRef && value.length === 10) {
        this.firstPhoneEnteredRef = 2;
      }

    }
    if (this.currentRefIndex === 0) {
      this.reference1Touched = true;

      if (!this.firstPhoneEnteredRef && value.length === 10) {
        this.firstPhoneEnteredRef = 1;
      }

    }
    const array =
      this.currentRefIndex === 0
        ? this.reference1Array
        : this.reference2Array;

    const phoneCtrl = array.at(0).get('phone');

    if (phoneCtrl) {
      phoneCtrl.setValue(value);
      phoneCtrl.markAsTouched();
      phoneCtrl.updateValueAndValidity({ emitEvent: true });
    }

    this.referenceForm.updateValueAndValidity({ emitEvent: true });
  }



  referenceUniquenessValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const ref1 = control.get('reference1') as FormArray;
    const ref2 = control.get('reference2') as FormArray;

    if (!ref1?.length || !ref2?.length) return null;
    const errors: any = {};
    const r1 = ref1.at(0);
    const r2 = ref2.at(0);

    const phone1 = r1.get('phone')?.value;
    const phone2 = r2.get('phone')?.value;
    const emailCtrl1 = r1.get('email');
    const emailCtrl2 = r2.get('email');

    const email1 = emailCtrl1?.value?.trim().toLowerCase();
    const email2 = emailCtrl2?.value?.trim().toLowerCase();

    // emailCtrl1?.setErrors(null);
    // emailCtrl2?.setErrors(null);

    if (phone1 && phone2 && phone1 === phone2) {
      errors.samePhone = true;
    }


    if (email1 && email2 && email1 === email2) {
      // errors.sameEmail = true;

      this.setMergedError(emailCtrl1, { sameEmail: true });
      this.setMergedError(emailCtrl2, { sameEmail: true });
      return { sameEmail: true };

    }

    return Object.keys(errors).length ? errors : null;


  };
  setMergedError = (ctrl: AbstractControl | null, error: any) => {
    if (!ctrl) return;
    const existingErrors = ctrl.errors || {};
    ctrl.setErrors(Object.keys(existingErrors).length || error ? {
      ...existingErrors,
      ...error
    } : null);
  };

  private finishAfterSaveOrNoChange() {
    if (this.isSummaryEditMode) {
      this.loanformservice.clearSummaryEditFlow();

      this.router.navigate(['/loanform', 'summaryinfo'], {
        queryParamsHandling: 'merge'
      });

      return;
    }

    this.stepperService.next();
  }

  // ==================== OPEN MODAL ====================
  openModal(index: number = 0) {
    this.currentRefIndex = index;
    if (this.phone) {
      this.phone.resetForm?.();
      this.phone.control?.markAsPristine();
      this.phone.control?.markAsUntouched();
    }
    this.mobileNumber = '';
    this.submitAttempted = false;
    if (index === 1) {
      this.reference2Touched = false;
      // this.ismiddlename[1] = false;
    }





    const isAlreadySaved =
      index === 0 ? this.reference1Filled : this.reference2Filled;

    const currentArray =
      index === 0 ? this.reference1Array : this.reference2Array;

    if (isAlreadySaved && currentArray.at(0)?.value?.phone) {
      this.popupStep = 2;
      this.isSearchDone = true;
      this.mobileNumber = currentArray.at(0).value.phone;


      this.selectedStateId[index] = currentArray.at(0).value.perstate || '';
      this.selectedCityId[index] = '';

      this.perStateSelectedOption = this.selectedStateId[index];

      if (this.selectedStateId[index]) {
        this.loadPerCities(this.selectedStateId[index], index);

        setTimeout(() => {
          this.perCitySelectedOption = this.selectedCityId[index];
        }, 300);
      }

    } else {
      this.popupStep = 1;
      this.mobileNumber = '';
      this.isSearchDone = false;
    }

    this.isdata = false;


    setTimeout(() => {
      const modalElement = document.getElementById('referenceModal');
      if (modalElement) {
        this.modalInstance = new bootstrap.Modal(modalElement, {
          backdrop: 'static',
          keyboard: false
        });
        this.modalInstance.show();
      }
    }, 100);
  }

  // ==================== SEARCH BUTTON ====================
 searchReference(): void {
  if (
    !this.isMobileValid ||
    this.referenceForm.hasError('samePhone')
  ) {
    this.phone?.control?.markAsTouched();
    this.phone?.control?.updateValueAndValidity();

    this.isSearchDone = false;
    this.isdata = false;
    return;
  }

  this.searchMobile(this.mobileNumber);
}

  // ==================== BACK TO MOBILE STEP ====================
  backToMobileStep() {
    this.popupStep = 1;
  }

  // ==================== SAVE REFERENCE ====================
  saveReference(edit: boolean) {
    this.submitAttempted = true;
    const isRef1 = this.currentRefIndex === 0;
    const currentArray = isRef1
      ? this.reference1Array
      : this.reference2Array;

    const group = currentArray.at(0);
    const middleNameOk =
      this.ismiddlename[this.currentRefIndex] ||
      !!group.get('mname')?.value;

    if (!middleNameOk) {
      group.get('mname')?.markAsTouched();
      return;
    }
    if (group.invalid) {
      group.markAllAsTouched();
      return;
    }

    currentArray.at(0).patchValue({
      phone: this.mobileNumber,

    });

    if (!this.canSaveReference) {
      currentArray.at(0).markAllAsTouched();
      return;
    }

    this.savedReferenceData[this.currentRefIndex] = JSON.parse(JSON.stringify(currentArray.at(0).value));

    console.log(`Reference  Saved:`, currentArray.at(0).value);
    const custID = localStorage.getItem('custId')
    const refForm = currentArray.at(0).value;

    let input: any = {
      reference: {
        referenceType: isRef1 ? 'reference1' : 'reference2',
        mobileNumber: refForm.phone,
        firstName: refForm.fname,
        middleName: refForm.mname,
        lastName: refForm.lname,
        emailId: refForm.email,
        addressLine1: refForm.peraddressline1,
        addressLine2: refForm.peraddressline2,
        addressLine3: refForm.peraddressline3,
        country: 'India',
        // state: this.perselectedStateLabel,
        // city: this.perselectedCityLabel,
        state: this.perselectedStateLabelArr[this.currentRefIndex],
        city: this.perselectedCityLabelArr[this.currentRefIndex],
        pincode: refForm.perpincode,
        customerCifId: custID,
        isNewCustomer: this.isdata ? 1 : 0,
        applicantId: this.applicantId,
      }
    };

    const editInput = {
      applicantId: this.applicantId,
      items: [input.reference]
    }

    if (edit) {
      input = editInput;
    }


    this.loanformservice.saveReference(input, this.applicationId, edit).subscribe({
      next: (res: any) => {
        if (res.status === 'success') {
          if (isRef1) {
            this.reference1Filled = true;
          } else {
            this.reference2Filled = true;
          }
          if (edit) {
            this.isViewMode = false;
            this.isEditMode = false;
          }
          this.closeReferenceModalOnly();
          setTimeout(() => {
            const successEl = document.getElementById('successModal');
            if (successEl) {
              this.successModalInstance = new bootstrap.Modal(successEl, {
                backdrop: 'static',
                keyboard: false
              });
              this.successModalInstance.show();
            }
          }, 300);


        }
      }
    });
  }
  isFormChanged(): boolean {
    const index = this.currentRefIndex;

    const array =
      index === 0 ? this.reference1Array : this.reference2Array;

    return JSON.stringify(array.at(0).value) !==
      JSON.stringify(this.savedReferenceData[index]);
  }


  // ==================== CLOSE MODAL ====================
  closeSuccessModal() {
    if (this.successModalInstance) {
      this.successModalInstance.hide();
      this.successModalInstance = null;
    }
  }
  closeModal() {
    if (this.modalInstance) {
      this.modalInstance.hide();
      this.modalInstance = null;
    }
    if (this.phone) {
      // this.phone.reset();
      this.phone.resetForm?.();
    }
    // this.referenceForm.reset();
    // this.reference1Array.clear();
    // this.reference2Array.clear();
    // this.reference1Array.push(this.createReferenceGroup());
    // this.reference2Array.push(this.createReferenceGroup());


    const index = this.currentRefIndex;
    const array = index === 0 ? this.reference1Array : this.reference2Array;

    const isSaved =
      index === 0 ? this.reference1Filled : this.reference2Filled;

    //  Only reset if NOT saved
    if (!isSaved) {
      array.clear();
      array.push(this.createReferenceGroup());
      this.savedReferenceData[index] = {};
    }

    this.popupStep = 1;
    this.mobileNumber = '';
    this.isSearchDone = false;
    this.isdata = false;
    this.submitAttempted = false;
    this.reference2Touched = false;
    this.ismiddlename = [false, false];
    this.perStateSelectedOption = null;
    this.perCitySelectedOption = null;
    this.perselectedStateLabel = '';
    this.perselectedCityLabel = '';
    this.cityOptions = [];

    this.referenceForm.updateValueAndValidity({ emitEvent: false });
  }
  closeReferenceModalOnly() {
    if (this.modalInstance) {
      this.modalInstance.hide();
      this.modalInstance = null;
    }

    // DO NOT reset form or arrays here
    this.popupStep = 1;
    this.isSearchDone = false;
    this.submitAttempted = false;
  }

  handleCloseModal() {
    const isSaved =
      this.currentRefIndex === 0
        ? this.reference1Filled
        : this.reference2Filled;

    if (isSaved) {
      this.closeReferenceModalOnly();
    } else {
      this.closeModal();
    }
  }

  back() {
    this.stepperService.previous();
  }
  //disabled
  get canSaveReference1(): boolean {
    const array =
      this.currentRefIndex === 0
        ? this.reference1Array
        : this.reference2Array;

    if (!array || !array.at(0)) return false;

    const errors: any = {};

    if (this.currentRefIndex === 1) {
      if (this.referenceForm.hasError('sameEmail') || this.referenceForm.hasError('samePhone')
      ) {
        errors.sameEmail = true;
        return false;
      }
    }

    const group = array.at(0) as FormGroup;

    const middleNameOk =
      this.ismiddlename[this.currentRefIndex] ||
      !!group.get('mname')?.value;


    const fname = group.get('fname')?.value?.trim();
    const lname = group.get('lname')?.value?.trim();
    const phone = group.get('phone')?.value?.trim();

    const hasSameEmail = this.referenceForm.hasError('sameEmail');

    return (
      (fname && lname && middleNameOk) || hasSameEmail
    );
  }

  get canSaveReference(): boolean {
    const array = this.currentRefIndex === 0 ? this.reference1Array : this.reference2Array;
    if (!array || !array.at(0)) return false;

    const group = array.at(0) as FormGroup;

    if (!group.valid) return false;

    if (!this.ismiddlename[this.currentRefIndex]) {
      const mname = group.get('mname')?.value?.trim();
      if (!mname || mname.length < 2) return false;
    }

    if (this.currentRefIndex === 1) {
      if (this.referenceForm.hasError('sameEmail')) return false;
      if (this.referenceForm.hasError('samePhone')) return false;
    }

    return true;
  }


  isPayloadChanged(current: any, saved: any) {
    return JSON.stringify(current) !== JSON.stringify(saved);
  }

  buildReferencePayload() {
    return {
      reference1: this.reference1Array.getRawValue(),
      reference2: this.reference2Array.getRawValue(),
      reference1Filled: this.reference1Filled,
      reference2Filled: this.reference2Filled,

    };
  }

  //get saved data from api
  getSavedReferenceInfo(): Promise<any> {
    return new Promise((resolve) => {
      this.loanformservice.getSavedData(
        this.applicationId,
        this.applicantId,
        "SAVE_REFERENCES"
      ).subscribe({
        next: (res) => {
          if (res.status === 'success') {
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

          } else {
            resolve(null);
          }
        },
        error: () => resolve(null)
      });
    });
  }
  saveExit() {
    this.msgBox.open({
      title: 'Are you sure you want to exit?',
      message: ``,
      showCancel: true, okText:'Yes',
      onOk: () => {
        const input = this.buildReferencePayload();

        const key = this.getStorageKey();
        localStorage.setItem(key, JSON.stringify(input));


        const applicantId = this.getApiApplicantId();

        if (!applicantId) {
          this.lastSavedPayload = { ...input };
          return;
        }

        const inputdata = {
          action: "auto-save",
          sectionKey: "SAVE_REFERENCES",
          applicationId: this.applicationId,
          applicantId: applicantId,
          jsonData: input
        };

        this.loanformservice.saveandExit(inputdata).subscribe({

          next: () => {
            this.lastSavedPayload = { ...input };
            console.log('Reference draft saved successfully');
          },
          error: (err) => {
            console.error('Save & Exit failed', err);
          }

        });
        this.router.navigate(['/admin/losoperation']);
      }
    });
  }

  next() {
    if (!(this.reference1Filled && this.reference2Filled)) {
      return;
    }

    const payload = this.buildReferencePayload();

    const key = this.getStorageKey();
    localStorage.setItem(key, JSON.stringify(payload));

    this.loanformservice.referenceInfoData = payload;
    this.lastSavedPayload = { ...payload };

    this.stepperService.markStepCompleted('referenceinfo');
    this.stepperService.setStepData('referenceinfo', payload);
    // this.stepperService.next();

    this.finishAfterSaveOrNoChange();
  }



  //edit from summary enable and disbale
   enableForm(){
    this.isViewMode = false;
    this.isEditMode = true;
    this.referenceForm.enable();
  }

  cancelSummaryEdit() {
    if (this.isEditMode && this.originalFormValue) {
      this.referenceForm.patchValue(this.originalFormValue);
    }

    this.isViewMode = true;
    this.isEditMode = false;
    this.referenceForm.disable();
  }

  saveSummaryEdit() {
    this.next();
  }

  // edit sucess popup
   onCancel() {
    this.editSuccess = false;
  }

  handleSuccessAction(action: string){
    if(action === "OK"){
      this.editSuccess = false;
      this.isViewMode = true;
      this.isEditMode = false;
       this.referenceForm.disable();
    }
  }
}