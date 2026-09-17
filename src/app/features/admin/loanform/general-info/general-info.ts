import { CommonModule } from '@angular/common';
import { Component, OnInit, Input, ChangeDetectorRef } from '@angular/core';
import { Loanformservice } from '../../../../core/service/loanformservice';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { Inputfield } from '../../../systemdesign/inputfield/inputfield';
import { Buttons } from '../../../systemdesign/buttons/buttons';
import { Radiobuttons } from '../../../systemdesign/radiobuttons/radiobuttons';
import { Datepickernew } from '../../../systemdesign/datepickernew/datepickernew';
import { Dropdown, DropdownOption } from '../../../systemdesign/dropdown/dropdown';
import { ActivatedRoute, Router } from '@angular/router';
import { Loanstepperservice } from '../../../../core/service/loanstepperservice';
import { Main } from '../../../../core/service/main';
import { generalerrors } from './generalerror';
import { findIndex, firstValueFrom } from 'rxjs';
import { Msgboxservice } from '../../../../core/service/msgboxservice';
import { Storage } from '../../../../core/service/storage';
import { Successbox } from '../../customer/successbox/successbox';
import { Messagebox } from "../../../systemdesign/messagebox/messagebox";
import moment from 'moment';
interface OptionItem {
  label: string;
  value: string;
  code?: string;
}

@Component({
  selector: 'app-general-info',
  imports: [CommonModule, Inputfield, Dropdown, Buttons, Radiobuttons, Datepickernew, ReactiveFormsModule, Successbox, Messagebox],
  standalone: true,
  templateUrl: './general-info.html',
  styleUrl: './general-info.scss'
})
export class GeneralInfo implements OnInit {

  allerrors = generalerrors;
  currenterror = ''

  openIndex: number | null = 0;
  accordions = [
    { title: 'General Info ', alwaysOpen: true },

  ];

  registerForm!: FormGroup;
  checkyes_rb = "option1"


  @Input() avatarUrl = '';
  @Input() hasAvatar = false;
  formData: any = {};

  occupationlabel: string = 'Current Occupation';
  selectoccupation: OptionItem[] = [];


  qualification: string = 'Last Qualification';
  seleactqualification: OptionItem[] = []

  state: string = 'State';

  university: string = 'University Name';
  selectuniversity: OptionItem[] = []

  coursetype: string = 'Course Type';
  selectcourse: OptionItem[] = []
  coursetypeId: any;

  coursename: string = 'Course Name';
  selectcoursename: OptionItem[] = []


  courseduration: string = 'Course Duration';
  selectcourseduration: DropdownOption[] = [
    { label: '1 Year', value: '1 Year', icon: '' },
    { label: '2 Years', value: '2 Years', icon: '' },
    { label: '3 Years', value: '3 Years', icon: '' },
    { label: '4 Years', value: '4 Years', icon: '' },
    { label: '4+ Years', value: '4+ Years', icon: '' },
  ]
  lendingpartner: string = 'Lending Partner';
  selectlendingpartner: OptionItem[] = []

  checkboxasset: any;


  Australianstate: OptionItem[] = [];
  AustralianUniversities: OptionItem[] = [];

  selectedStateLabel: string = '';
  selectedUniLabel: string = '';
  selectedcoursetypeLabel: string = '';
  selectedcourseNameLabel: string = '';

  selectrelationship: OptionItem[] = [];


  applicantId: any;
  applicationId: any;
  custName: any;
  custARN: any;

  calculatedEndDate!: Date;


  statesLoaded = false;


  isOtherstate = false;
  isOtherUniversity = false;
  isOthercoursetype = false;
  isOthercoursename = false;

  //coapplicant 
  isOtherRelationship = false;
  isCoApplicant: boolean = false;
  coapp_registerForm!: FormGroup;

  selectAnnualIncome: DropdownOption[] = [
    { label: '0-5 Lakhs', value: '0-5 Lakhs', icon: '' },
    { label: '5-10 Lakhs', value: '5-10 Lakhs', icon: '' },
    { label: '10-20 Lakhs', value: '10-20 Lakhs', icon: '' },
    { label: '20-30 Lakhs', value: '20-30 Lakhs', icon: '' },
    { label: '30-40 Lakhs', value: '30-40 Lakhs', icon: '' },
    { label: '40-50 Lakhs', value: '40-50 Lakhs', icon: '' },
    { label: '50-75 Lakhs', value: '50-75 Lakhs', icon: '' },
    { label: '75 Lakhs - 1 Crore', value: '75 Lakhs - 1 Crore', icon: '' },
    { label: '1 Crore- 2 Crore', value: '1 Crore - 2 Crore', icon: '' },
    { label: '2 Crore & Above', value: '2 Crore & Above', icon: '' },
    { label: 'No Income', value: 'No Income', icon: '' },

  ]
  selectrelation: DropdownOption[] = [
    { label: 'Father', value: 'Father', icon: '' },
    { label: 'Mother', value: 'Mother', icon: '' },
    { label: 'Spouse', value: 'Spouse', icon: '' },
    { label: 'Brother', value: 'Brother', icon: '' },
    { label: 'Sister', value: 'Sister', icon: '' },
    { label: 'Son', value: 'Son', icon: '' },
    { label: 'Daughter', value: 'Daughter', icon: '' },
    { label: 'Legal Guardian', value: 'Legal Guardian', icon: '' },


  ]
  formSubmitted = false;
  lastSavedPayload: any = null;
  isSummaryEditMode = false;
  viewOnly = false;
  minEndCourseDate: any = null;

  //edit from summary
  isFromSummary = false;
  isViewMode = false;
  isEditMode = false;
  originalFormValue: any = null;

  editSuccess: any = false;
  description1 = `Great ! Your General Info Details\n Uploaded Successfully.`;

  isDataLoading = true;
  loadError = '';
  loadedFromSaveExit = false;

  constructor(private fb: FormBuilder, private formSvc: Loanformservice, private router: Router, private cd: ChangeDetectorRef, private storageservice: Storage, private stepperService: Loanstepperservice, private msgBox: Msgboxservice, private route: ActivatedRoute, public mainservice: Main) { }
  async ngOnInit() {
    this.isDataLoading = true;
    this.loadError = '';
    try {
      this.isCoApplicant = this.router.url.includes('co-applicant');

      this.stepperService.setStepperType(
        this.isCoApplicant ? 'CO_APPLICANT' : 'MAIN'
      );

      if (this.isCoApplicant) {
        this.stepperService.restoreCoAppIdFromSession();
        // this.getRealtionShipwith()
      }
      this.stepperService.restoreLoanEditContext();
      this.stepperService.restoreLoanIdFromSession();

      let storedCoAppData: any = {};

      try {
        storedCoAppData = JSON.parse(sessionStorage.getItem('coAppIds') || '{}');
      } catch {
        storedCoAppData = {};
      }

      const index = Number(this.route.snapshot.queryParams['coApplicantIndex']) || storedCoAppData?.coApplicantIndex || 1;

      this.stepperService.setCurrentCoApplicantIndex(index);


      let Allids = this.stepperService.getLoanId();

      this.applicantId = Allids[0];
      this.applicationId = Allids[1];
      this.custName = Allids[2];
      this.custARN = Allids[3];

      let AllCoapp_ids = this.stepperService.getCo_appId();


      const queryParams = this.route.snapshot.queryParams;

      if (
        this.isCoApplicant &&
        (!AllCoapp_ids || !AllCoapp_ids[0] || !AllCoapp_ids[1])
      ) {

        const storedCoApp = sessionStorage.getItem('coAppIds');
        if (storedCoApp) {
          const parsed = JSON.parse(storedCoApp);
          if (parsed?.applicantId && parsed?.applicationId) {
            AllCoapp_ids = [
              parsed.applicantId,
              parsed.applicationId,
              parsed.fullName, parsed.custARN
            ];

            // restore back into service
            this.stepperService.setCurrentCoApplicantIndex(parsed.coApplicantIndex || 1);
            this.stepperService.setCo_appId(
              parsed.applicantId,
              parsed.applicationId,
              parsed.fullName, parsed.custARN,
              parsed.coApplicantIndex || 1);

          } else {
            console.error('Invalid coAppIds in sessionStorage:', parsed);
          }

        }
      }



      // this.applicantId = this.isCoApplicant ? AllCoapp_ids[0] : Allids[0];

      if (this.isCoApplicant) {
        this.applicantId = AllCoapp_ids?.[0];
        this.applicationId = AllCoapp_ids?.[1];
        this.custName = AllCoapp_ids?.[2];
        this.custARN = AllCoapp_ids?.[3] || this.custARN;
      } else {
        this.applicantId = Allids?.[0];
        this.applicationId = Allids?.[1];
        this.custName = Allids?.[2];
        this.custARN = Allids?.[3];
      }

      this.registerForm = this.fb.group({

        occupation: ['', Validators.required],
        // qualification: ['', Validators.required],
        // institutionName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
        state: ['', Validators.required],
        otherstatetitle: [''],
        university: ['', Validators.required],
        otherunititle: [''],
        coursetype: ['', Validators.required],
        othercoursetypetitle: [''],
        coursename: ['', Validators.required],
        othercoursenametitle: [''],
        // courseduration: [''],
        // coursestartdate: ['', [Validators.required, this.dateMinValidator(() => new Date())]],
        coursestartdate: ['', [Validators.required, this.dateMinValidator(() => this.getCourseStartMinDate())]],
        courseenddate: ['', [Validators.required, this.endDateValidator()]],
        checkedasset: [null, Validators.required],
        lendingpartner: ['', Validators.required],


      });


      this.coapp_registerForm = this.fb.group({

        occupation: ['', Validators.required],
        annualincome: ['', Validators.required],
        relationship: ['', Validators.required],
        OtherRelationship: [''],
        co_checkedasset: [null, Validators.required],
      });


      this.applyApplicantViewMode(queryParams)
      // Reset localStorage if applicant changed

      const currentUserKey = this.isCoApplicant
        ? 'currentCoApplicantId'
        : 'currentApplicantId';

      const previousId = localStorage.getItem(currentUserKey);

      if (previousId && previousId !== this.applicantId) {

        if (this.isCoApplicant) {
          localStorage.removeItem(`generalInfo_coapp_${previousId}`);
        } else {
          localStorage.removeItem(`generalInfo_main_${previousId}`);
        }

      }

      localStorage.setItem(currentUserKey, this.applicantId);
      // this.stepperService.rebuildSteps();

      // this.getOccupationdetails();
      await this.getOccupationdetailsAsync();
      if (this.isCoApplicant) {
        await this.getRealtionShipwithAsync();
      }
      else {
        this.states();
        this.getEducationdetails();
        this.getlendingpartnersdetails();
      }
      this.listenToChanges();
      await this.loadGeneralInfoForBothFlows()
      this.stepperService.rebuildSteps();

    } catch (error) {
      console.error(
        'Failed to initialize general page',
        error
      );

      this.loadError =
        'Unable to load general details. Please try again.';
    } finally {
      this.isDataLoading = false;

      /*
       * Apply the current mode only after data has been patched.
       */
      this.applyCurrentFormMode();

      this.cd.detectChanges();
    }

  }

  //loading data
  private applyCurrentFormMode(): void {
    if (!this.activeForm) {
      return;
    }

    if (this.isViewMode && !this.isEditMode) {
      this.activeForm.disable({
        emitEvent: false
      });
    } else {
      this.activeForm.enable({
        emitEvent: false
      });
    }
  }
  applyApplicantViewMode(queryParams: any) {
    const isFromSummaryRoute =
      queryParams['fromSummary'] === true ||
      queryParams['fromSummary'] === 'true';

    const cameFromSummary =
      isFromSummaryRoute ||
      this.formSvc.isSummaryEditFlow();

    // =========================
    // MAIN APPLICANT LOGIC
    // =========================
    if (!this.isCoApplicant) {
      this.isSummaryEditMode = cameFromSummary;
      this.isFromSummary = this.isSummaryEditMode;

      this.viewOnly =
        this.isSummaryEditMode &&
        queryParams['mode'] !== 'edit';

      if (this.isSummaryEditMode) {
        if (this.viewOnly) {
          this.isViewMode = true;
          this.isEditMode = false;
          this.activeForm.disable({ emitEvent: false });
        } else {
          this.isViewMode = false;
          this.isEditMode = true;
          this.activeForm.enable({ emitEvent: false });
        }
      } else {
        this.isFromSummary = false;
        this.isSummaryEditMode = false;
        this.viewOnly = false;
        this.isViewMode = false;
        this.isEditMode = false;

        this.activeForm.enable({ emitEvent: false });
      }

      return;
    }

    // =========================
    // CO-APPLICANT LOGIC
    // =========================
    let storedCoAppData: any = {};

    try {
      storedCoAppData = JSON.parse(sessionStorage.getItem('coAppIds') || '{}');
    } catch {
      storedCoAppData = {};
    }

    const coappStatus = (
      storedCoAppData?.status ||
      (isFromSummaryRoute ? 'COMPLETED' : '')
    ).toUpperCase();

    const isCompletedCoapp =
      coappStatus === 'COMPLETED' ||
      coappStatus === 'SUBMITTED';

    const isNewCoappFlow =
      storedCoAppData?.mode === 'new';

    const isDraftCoapp =
      !isNewCoappFlow &&
      !isCompletedCoapp;

    const coappCameFromSummary =
      isFromSummaryRoute ||
      storedCoAppData?.mode === 'view' ||
      storedCoAppData?.mode === 'edit' ||
      this.formSvc.isSummaryEditFlow();

    this.isSummaryEditMode =
      !isNewCoappFlow &&
      isCompletedCoapp &&
      coappCameFromSummary;

    this.isFromSummary = this.isSummaryEditMode;

    this.viewOnly =
      this.isSummaryEditMode &&
      queryParams['mode'] !== 'edit';

    if (isDraftCoapp || isNewCoappFlow) {
      this.formSvc.clearSummaryEditFlow();
      this.formSvc.clearSummaryEducationEditFlow?.();

      this.isFromSummary = false;
      this.isSummaryEditMode = false;
      this.viewOnly = false;
      this.isViewMode = false;
      this.isEditMode = false;

      this.activeForm.enable({ emitEvent: false });
    } else if (this.isSummaryEditMode) {
      if (this.viewOnly) {
        this.isViewMode = true;
        this.isEditMode = false;
        this.activeForm.disable({ emitEvent: false });
      } else {
        this.isViewMode = false;
        this.isEditMode = true;
        this.activeForm.enable({ emitEvent: false });
      }
    } else {
      this.isFromSummary = false;
      this.isSummaryEditMode = false;
      this.viewOnly = false;
      this.isViewMode = false;
      this.isEditMode = false;

      this.activeForm.enable({ emitEvent: false });
    }
  }

  getStorageKey() {
    const main_ApplicantId = this.stepperService.getLoanId()?.[0];
    const co_ApplicantId = this.stepperService.getCo_appId()?.[0];
    const index = this.stepperService.getCurrentCoApplicantIndex();

    return this.storageservice.getStorageKey(
      'generalInfo',
      this.applicationId,
      this.applicantId,
      this.isCoApplicant,

    );
  }

  getStepRoute() {
    return this.isCoApplicant ? 'co-generalinfo' : 'genralinfo';
  }

  //store data in form
  private async loadGeneralInfoForBothFlows() {
    const key = this.getStorageKey();



    const parsedLocal = this.storageservice.getStoredSectionData(
      'generalInfo',
      this.applicationId,
      this.applicantId,
      this.isCoApplicant
    );
    const draftData = await this.getSavedGeneralInfo();

    const summaryData = await this.getGeneralInfoFromSummaryForCurrentApplicant();

    let finalData = null;

    if (this.isSummaryEditMode) {
      // Summary edit flow: summary data must be latest source
      finalData =
        summaryData ||
        draftData ||
        (parsedLocal ? this.mapLocalToApiFormat(parsedLocal) : null);
    } else {
      // Resume partial flow: draft first, summary fallback, local fallback
      finalData =
        draftData ||
        summaryData ||
        (parsedLocal ? this.mapLocalToApiFormat(parsedLocal) : null);
    }

    this.loadedFromSaveExit = !!draftData;
    if (!finalData) {
      this.lastSavedPayload = null;
      return;
    }

    if (this.isCoApplicant) {
      this.patchCoApplicantInfo(finalData);

      // this.co_checkassetOnChange(finalData.hasAssets ? 'Yes' : 'No');
      const hasAssets = this.toBoolean(finalData.hasAssets);

      this.co_checkassetOnChange(
        hasAssets ? 'Yes' : 'No'
      );

      this.handleCoApplicantOccupationChange(
        finalData.currentOccupationId ||
        finalData.occupationId ||
        finalData.occupation
      );

      this.lastSavedPayload = this.buildCoApplicantPayload(
        this.coapp_registerForm.getRawValue()
      );
      if (this.coapp_registerForm.valid) {
        this.stepperService.markStepCompleted(this.getStepRoute());
      }

    } else {
      this.patchGeneralInfo(finalData);

      this.checkassetOnChange(finalData.hasAssets ? 'Yes' : 'No');

      this.handleOccupationChange(
        finalData.currentOccupationId ||
        finalData.occupationId ||
        finalData.occupation
      );

      this.lastSavedPayload = this.buildMainPayload(this.registerForm.getRawValue());
    }

    // localStorage.setItem(key, JSON.stringify(finalData));
    this.storageservice.saveSectionData(
      'generalInfo',
      this.applicationId,
      this.applicantId,
      this.isCoApplicant,
      finalData
    );
  }

  private async getGeneralInfoFromSummaryForCurrentApplicant(): Promise<any> {
    try {
      if (!this.applicationId) return null;

      const res: any = await firstValueFrom(
        this.formSvc.getSummary(this.applicationId)
      );

      if (!res || res.status !== 'success' || !res.data) {
        return null;
      }

      const applicants = Array.isArray(res.data?.applicants)
        ? res.data.applicants
        : [];

      let selectedApplicant: any = null;

      if (this.isCoApplicant) {
        const currentCoIndex = this.stepperService.getCurrentCoApplicantIndex();
        const currentCoApplicantId = this.stepperService.getCo_appId()?.[0];

        selectedApplicant =
          applicants.find((x: any) =>
            x?.applicantId &&
            currentCoApplicantId &&
            x.applicantId === currentCoApplicantId
          ) ||
          applicants.find((x: any) =>
            this.formSvc.getApplicantType(x).startsWith('CO_APPLICANT') &&
            this.formSvc.getCoApplicantIndexFromType(x) === Number(currentCoIndex)
          );
      } else {
        selectedApplicant = applicants.find((x: any) =>
          this.formSvc.getApplicantType(x) === 'PRIMARY'
        );
      }

      if (!selectedApplicant?.generalInfo) {
        return null;
      }

      return this.mapSummaryGeneralInfoToPatchData(
        selectedApplicant.generalInfo
      );

    } catch (error) {
      console.error('Failed to get summary general info:', error);
      return null;
    }
  }
  listenToChanges() {
    if (this.isCoApplicant) {
      this.coapp_registerForm.get('co_checkedasset')?.valueChanges.subscribe(value => {
        this.co_checkassetOnChange(value);
      });

      this.coapp_registerForm.get('occupation')?.valueChanges.subscribe(value => {
        this.handleCoApplicantOccupationChange(value);
      });
    } else {
      this.registerForm.get('checkedasset')?.valueChanges.subscribe(value => {
        this.checkassetOnChange(value);
      });

      this.registerForm.get('occupation')?.valueChanges.subscribe(value => {
        this.handleOccupationChange(value);
      });

      this.registerForm
        .get('coursestartdate')
        ?.valueChanges
        .subscribe(() => {
          const endDateControl =
            this.registerForm.get('courseenddate');

          endDateControl?.updateValueAndValidity({
            emitEvent: false
          });
        });
    }
  }

  buildCoApplicantPayload(formdata: any) {
    return {
      applicationId: this.applicationId,
      applicantId: this.applicantId,
      occupation: formdata.occupation,
      annualIncome: formdata.annualincome,
      relationWithApplicantId: formdata.relationship,
      relationship: formdata.relationship,
      hasAssets: formdata.co_checkedasset === 'Yes'
    };
  }

  get activeForm(): FormGroup {
    return this.isCoApplicant ? this.coapp_registerForm : this.registerForm;
  }

  private restoreDependentDropdowns(data: any) {
    if (!data?.stateId) return;

    this.registerForm.patchValue({
      state: data.stateId,
      otherstatetitle: data.otherStateName ?? ''
    });
    this.selectPerState(data.stateId);


    const found = this.Australianstate.find(s => s.value === data.stateId);
    this.isOtherstate = found?.label?.toLowerCase().includes('other') ?? false;;

    this.formSvc.getAustralianstatescities(data.stateId).subscribe(res => {
      this.AustralianUniversities = res.data.map((u: any) => ({
        value: u.id,
        label: u.universityName
      }));

      this.registerForm.patchValue({ university: data.universityId });
      this.selecteduniversity(data.universityId);

      this.formSvc.getCoursetype(data.universityId).subscribe(ct => {
        this.selectcourse = ct.data.map((c: string) => ({
          label: c,
          value: c
        }));

        this.registerForm.patchValue({ coursetype: data.coursetype });
        this.selectedcoursetype(data.coursetype);

        this.formSvc.getCourseName(data.universityId, data.coursetype).subscribe(cn => {
          this.selectcoursename = cn.data.map((c: any) => ({
            value: c.id,
            label: c.courseName
          }));

          this.registerForm.patchValue({ coursename: data.courseId });
          this.selectedCoursename(data.courseId);
        });
      });
    });
  }

  parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;

    const parts = dateStr.split('/');

    if (parts.length !== 3) return null;

    const [day, month, year] = parts;

    return new Date(+year, +month - 1, +day);
  }
  get form() {
    return this.formSvc.form.get('loanInfo') as FormGroup;
  }

  onSelectionChange(selectedkey: string, value: string) {
    this.formData[selectedkey] = value;
    console.log('Changed:', selectedkey, value);
  }

  toggle(i: number) {
    this.openIndex = this.openIndex === i ? null : i;
  }

  submit() {
    if (this.registerForm.invalid) return;

    console.log(this.registerForm.value);
  }
  //main applicant radiobutton for assets

  checkassetOnChange(value: any) {
    const isAsset = value === 'Yes';

    this.checkboxasset = value;

    this.registerForm.get('checkedasset')?.setValue(value, {
      emitEvent: false
    });

    this.stepperService.setApplicantValues('main', {
      isasset: isAsset,
      isincome: this.formSvc.applicantState.isincome,
      issalaried: this.formSvc.applicantState.issalaried,
      coursetypeug: this.formSvc.applicantState.coursetypeug
    });

    localStorage.setItem('main_isasset', JSON.stringify(isAsset));
  }


  //co-applicant radiobutton for assets
  co_checkassetOnChange(value: any) {
    // const isAsset = value === 'Yes';

    // this.checkboxasset = value;
    const isAsset = this.toBoolean(value);
    this.checkboxasset = isAsset ? 'Yes' : 'No';

    this.coapp_registerForm.get('co_checkedasset')?.setValue(value, {
      emitEvent: false
    });

    this.stepperService.setApplicantValues('coapp', {
      isasset: isAsset,
      isincome: this.formSvc.coApplicantState.isincome,
      issalaried: this.formSvc.coApplicantState.issalaried
    });

    // localStorage.setItem('co_isasset', JSON.stringify(isAsset));
  }


  handleOccupationChange(value: any) {
    const selected = this.selectoccupation.find(o => o.value === value);


    const isIncome =
      selected?.label === 'Employed' || selected?.label === 'Self-employed';
    const isSalaried = selected?.label === 'Employed';

    // this.stepperService.rebuildSteps();

    if (this.isCoApplicant) {
      this.formSvc.coApplicantState.isincome = isIncome;
      this.formSvc.coApplicantState.issalaried = isSalaried;

      localStorage.setItem(
        this.stepperService.getCoApplicantStateKey(),
        JSON.stringify(this.formSvc.coApplicantState)
      );

      this.stepperService.setApplicantValues('coapp', this.formSvc.coApplicantState);
    } else {
      this.formSvc.applicantState.isincome = isIncome;
      this.formSvc.applicantState.issalaried = isSalaried;


      localStorage.setItem(
        'applicantState',
        JSON.stringify(this.formSvc.applicantState)
      );


      this.stepperService.setApplicantValues('main', this.formSvc.applicantState);
    }

  }

  handleCoApplicantOccupationChange1(value: any) {
    const selected = this.selectoccupation.find(o => o.value === value);

    const isIncome =
      selected?.label === 'Employed' || selected?.label === 'Self-employed';

    const isSalaried = selected?.label === 'Employed';

    this.formSvc.coApplicantState.isincome = isIncome;
    this.formSvc.coApplicantState.issalaried = isSalaried;
    localStorage.setItem(
      'coApplicantState',
      JSON.stringify(this.formSvc.coApplicantState)
    );

    this.stepperService.setApplicantValues('coapp', {
      isincome: isIncome,
      issalaried: isSalaried,
      isasset: this.formSvc.coApplicantState.isasset
    });

  }
  handleCoApplicantOccupationChange(value: any): void {
    const selected = this.selectoccupation.find(
      option => String(option.value) === String(value)
    );

    const occupation = (selected?.label || '')
      .trim()
      .toLowerCase();

    const isIncome =
      occupation === 'employed' ||
      occupation === 'self-employed' ||
      occupation === 'self employed';

    const isSalaried = occupation === 'employed';

    const assetFormValue = this.coapp_registerForm
      .get('co_checkedasset')
      ?.value;

    const isAsset = this.toBoolean(assetFormValue);

    const currentState = {
      isincome: isIncome,
      issalaried: isSalaried,
      isasset: isAsset
    };

    this.formSvc.coApplicantState = {
      ...this.formSvc.coApplicantState,
      ...currentState
    };

    const stateKey = this.stepperService.getCoApplicantStateKey(
      // this.applicationId,
      // this.applicantId
    );

    localStorage.setItem(
      stateKey,
      JSON.stringify(currentState)
    );

    this.stepperService.setApplicantValues(
      'coapp',
      currentState
    );

    // this.stepperService.rebuildSteps();
  }

  private toBoolean(value: unknown): boolean {
    if (value === true || value === 1) {
      return true;
    }

    if (typeof value === 'string') {
      return ['true', 'yes', '1'].includes(
        value.trim().toLowerCase()
      );
    }

    return false;
  }

  get f() {
    return this.registerForm.controls;
  }

  getOccupationdetails() {
    this.formSvc.getOccupations().subscribe((res: any) => {
      const list = res.data ?? res;

      this.selectoccupation = list.map((s: any) => ({
        value: s.occupationId,
        label: s.occupationName,

      }));


      if (this.formSvc.isEditFlow()) {
        this.patchFromSummary();
      }

    });


  }
  getOccupationdetailsAsync(): Promise<void> {
    return new Promise((resolve) => {
      this.formSvc.getOccupations().subscribe({
        next: (res: any) => {
          const list = res.data ?? res;

          this.selectoccupation = list.map((s: any) => ({
            value: s.occupationId,
            label: s.occupationName,
          }));

          resolve();
        },
        error: () => {
          this.selectoccupation = [];
          resolve();
        }
      });
    });
  }
  getRealtionShipwithAsync(): Promise<void> {
    return new Promise((resolve) => {
      this.formSvc.getRelationShip().subscribe({
        next: (res: any) => {
          const list = res.data ?? res;

          this.selectrelationship = list.map((s: any) => ({
            value: s.id,
            label: s.relationWithApplicant,
          }));

          resolve();
        },
        error: () => {
          this.selectrelationship = [];
          resolve();
        }
      });
    });
  }
  getEducationdetails() {
    this.formSvc.getEducation().subscribe((res: any) => {
      const list = res.data ?? res;

      this.seleactqualification = list.map((s: any) => ({
        value: s.qualificationId,
        label: s.qualificationName,

      }));
    });
  }

  getlendingpartnersdetails() {
    this.formSvc.getlendingpartners().subscribe((res: any) => {
      const list = res.data ?? res;

      this.selectlendingpartner = list.map((s: any) => ({
        value: s.partnerId,
        label: s.partnerName,
        code: s.partnerCode
      }));
    });
  }

  restoreDropdownLabels(data: any) {

    const occ = this.selectoccupation.find(o => o.value == data.occupation);
    this.occupationlabel = 'Current Occupation';

    const qual = this.seleactqualification.find(q => q.value == data.qualification);
    this.qualification = 'Last Qualification';

    const state = this.Australianstate.find(s => s.value == data.state);
    this.selectedStateLabel = state?.label || '';

    const uni = this.AustralianUniversities.find(u => u.value == data.university);
    this.selectedUniLabel = uni?.label || '';

    const courseType = this.selectcourse.find(c => c.value == data.coursetype);
    this.selectedcoursetypeLabel = courseType?.label || '';

    const courseName = this.selectcoursename.find(c => c.value == data.coursename);
    this.selectedcourseNameLabel = courseName?.label || '';

  }

  //australian state and universities
  states() {
    this.formSvc.getAustralianstates().subscribe((res: any) => {
      const list = res.data ?? res;

      this.Australianstate = list.map((s: any) => ({
        value: s.id,
        label: s.stateName,
        code: s.stateCode
      }));

      this.statesLoaded = true;

      if (this.formSvc.generalInfoData) {

        const data = this.formSvc.generalInfoData;


        setTimeout(() => {
          this.registerForm.patchValue({
            state: data.stateId
          });



          this.selectPerState(data.stateId, true);
        });


        // this.restoreDependentDropdowns(this.formSvc.generalInfoData);
      }


    });
  }

  selectPerState(id: any, isRestore: boolean = false) {

    const found = this.Australianstate.find(s => s.value === id);
    this.selectedStateLabel = found?.label ?? '';
    this.isOtherstate = this.selectedStateLabel.toLowerCase().includes('other');

    if (!isRestore) {
      this.AustralianUniversities = [];
      this.selectedUniLabel = '';
      this.registerForm.get('university')?.setValue(null);

      this.selectcourse = [];
      this.selectedcoursetypeLabel = '';
      this.registerForm.get('coursetype')?.setValue(null);

      this.selectcoursename = [];
      this.selectedcourseNameLabel = '';
      this.registerForm.get('coursename')?.setValue(null);
    }
    this.selectuniveristy(id);
  }

  selectuniveristy(id: any) {
    this.formSvc.getAustralianstatescities(id).subscribe((res: any) => {
      const list = res.data ?? res;

      this.AustralianUniversities = list.map((c: any) => ({
        value: c.id,
        label: c.universityName,
        code: c.universityCode
      }));
    });
  }

  selecteduniversity(id: any) {

    const found = this.AustralianUniversities.find(s => s.value === id);
    this.selectedUniLabel = found?.label ?? '';

    this.isOtherUniversity = this.selectedUniLabel.toLowerCase().includes('other');


    this.selectcourse = [];
    this.selectedcoursetypeLabel = '';
    this.registerForm.get('coursetype')?.setValue(null);

    this.selectcoursename = [];
    this.selectedcourseNameLabel = '';
    this.registerForm.get('coursename')?.setValue(null);

    this.selectCourseType(id);
  }


  selectCourseType(id: any) {
    this.coursetypeId = id;
    this.formSvc.getCoursetype(id).subscribe((res: any) => {
      const list = res.data ?? res;

      this.selectcourse = list.map((course: string) => ({
        label: course,
        value: course
      }));


      const savedType = this.formSvc.generalInfoData?.coursetype;
      if (savedType) {
        this.registerForm.patchValue({ coursetype: savedType });
        this.selectedcoursetype(savedType);
      }


    });
  }
  selectedcoursetype(id: any) {

    const found = this.selectcourse.find(s => s.value === id);
    this.selectedcoursetypeLabel = found?.label ?? '';
    this.isOthercoursetype = this.selectedcoursetypeLabel.toLowerCase().includes('other');
    this.formSvc.coursetypeug = this.selectedcoursetypeLabel.includes('UG') ? true : false;

    localStorage.setItem(
      'coursetypeug',
      JSON.stringify(this.formSvc.coursetypeug)
    );

    this.stepperService.setvalues(
      this.formSvc.isasset, this.formSvc.isincome, this.formSvc.issalaried, this.formSvc.coursetypeug
    );

    this.selectcoursename = [];
    this.selectedcourseNameLabel = '';
    this.registerForm.get('coursename')?.setValue(null);

    this.select_CourseName(this.coursetypeId, id);
  }


  select_CourseName(id: string, name: string) {
    this.formSvc.getCourseName(id, name).subscribe((res: any) => {
      const list = res.data ?? res;

      this.selectcoursename = list.map((c: any) => ({
        value: c.id,
        label: c.courseName,
        code: c.courseCode
      }));

      const savedCourseId = this.formSvc.generalInfoData?.courseId;
      if (savedCourseId) {
        this.registerForm.patchValue({ coursename: savedCourseId });
        this.selectedCoursename(savedCourseId);
      }

    });
  }

  selectedCoursename(id: any) {

    const found = this.selectcoursename.find(s => s.value === id);
    this.selectedcourseNameLabel = found?.label ?? '';
    this.isOthercoursename = this.selectedcourseNameLabel.toLowerCase().includes('other');


    // this.selectcourse = [];
    // this.selectCourseType(id);
  }

  getRealtionShipwith() {
    this.formSvc.getRelationShip().subscribe((res: any) => {
      const list = res.data ?? res;

      this.selectrelationship = list.map((s: any) => ({
        value: s.id,
        label: s.relationWithApplicant,

      }));

    });


  }
  Selectedrelation(values: string | string[]) {
    const ids = Array.isArray(values) ? values : [values];

    const selected = this.selectrelationship.filter(s =>
      ids.includes(s.value)
    );

    // this.selectedLocationLabel = selected.map(s => s.label).join(', ');
    // this.selectedInstituteID = selected.map(s => s.value).join(', ');

    // this.group.get('location')?.setValue(this.selectedLocationLabel);

    this.isOtherRelationship = selected.some(
      s => s.label.trim().toLowerCase() === 'other'
    )

    const control = this.coapp_registerForm.get('relationship');
    control?.setValue(ids[0]);
    control?.markAsTouched();
    control?.updateValueAndValidity();

  }

  calculateEndDate() {
    const startDate = this.registerForm.get('coursestartdate')?.value;
    const duration = this.registerForm.get('courseduration')?.value;

    if (!startDate || !duration) return;

    if (duration.includes('4+')) {
      this.registerForm.patchValue(
        { courseenddate: null },
        { emitEvent: false }
      );
      this.registerForm.get('courseenddate')?.updateValueAndValidity();
      return;
    }

    const years = parseInt(duration);
    if (isNaN(years)) return;

    const start = new Date(startDate);
    const end = new Date(start);
    end.setFullYear(start.getFullYear() + years);

    this.calculatedEndDate = end;

    this.registerForm.patchValue(
      { courseenddate: end },
      { emitEvent: false }
    );
    this.registerForm.get('courseenddate')?.updateValueAndValidity();

  }

//today- 3 years allowed for start date
private getCourseStartMinDate(): Date {
  const minDate = new Date();

  minDate.setFullYear(minDate.getFullYear() - 3);
  minDate.setHours(0, 0, 0, 0);

  return minDate;
}


  dateMinValidator = (getMinDate: () => Date): ValidatorFn => {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const selected = this.parseStrictDate(control.value);
      const min = getMinDate();

      if (!selected || Number.isNaN(min.getTime())) {
        return { invalidDate: true };
      }

      selected.setHours(0, 0, 0, 0);
      min.setHours(0, 0, 0, 0);

      return selected < min
        ? { minDateError: true }
        : null;
    };
  };
  endDateValidator = (): ValidatorFn => {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }
      const endValue = control.value;
      const startValue = control.parent?.get('coursestartdate')?.value;

      if (!endValue) {
        return null;
      }
      if (!startValue) {
        return null;
      }


      const start = this.parseStrictDate(startValue);
      const end = this.parseStrictDate(control.value);

      if (!start || !end) {
        return { invalidDate: true };
      }

      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      return end <= start
        ? { invalidEndDate: true }
        : null;
    };
  };

  private parseStrictDate(value: unknown): Date | null {
    if (!value) {
      return null;
    }

    // JavaScript Date
    if (value instanceof Date) {
      if (Number.isNaN(value.getTime())) {
        return null;
      }

      const result = new Date(
        value.getFullYear(),
        value.getMonth(),
        value.getDate()
      );

      result.setHours(0, 0, 0, 0);
      return result;
    }

    // Moment-like object
    if (
      typeof value === 'object' &&
      value !== null &&
      '_isAMomentObject' in value
    ) {
      const momentValue = value as any;
      const convertedDate = momentValue.toDate();

      if (
        !(convertedDate instanceof Date) ||
        Number.isNaN(convertedDate.getTime())
      ) {
        return null;
      }

      convertedDate.setHours(0, 0, 0, 0);
      return convertedDate;
    }

    if (typeof value !== 'string') {
      return null;
    }

    const text = value.trim();

    let day: number;
    let month: number;
    let year: number;

    // DD/MM/YYYY
    const displayFormatMatch = text.match(
      /^(\d{2})\/(\d{2})\/(\d{4})$/
    );

    // YYYY-MM-DD
    const isoFormatMatch = text.match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );

    if (displayFormatMatch) {
      day = Number(displayFormatMatch[1]);
      month = Number(displayFormatMatch[2]);
      year = Number(displayFormatMatch[3]);
    } else if (isoFormatMatch) {
      year = Number(isoFormatMatch[1]);
      month = Number(isoFormatMatch[2]);
      day = Number(isoFormatMatch[3]);
    } else {
      return null;
    }

    if (
      year < 1000 ||
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > 31
    ) {
      return null;
    }

    const parsedDate = new Date(year, month - 1, day);

    // Prevent rollover:
    // 31/02/2026 must not become a valid date in March.
    if (
      parsedDate.getFullYear() !== year ||
      parsedDate.getMonth() !== month - 1 ||
      parsedDate.getDate() !== day
    ) {
      return null;
    }

    parsedDate.setHours(0, 0, 0, 0);
    return parsedDate;
  }
  private validDateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      // Let Validators.required handle empty values.
      if (value === null || value === undefined || value === '') {
        return null;
      }

      return this.parseStrictDate(value)
        ? null
        : { invalidDate: true };
    };
  }

  formatDate(date: any): string | null {
    if (!date) return null;

    const d = new Date(date);
    if (isNaN(d.getTime())) return null;

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    return `${day}/${month}/${year}`;
  }

  buildMainPayload(formdata: any) {
    return {
      applicationId: this.applicationId,
      applicantId: this.applicantId,
      currentOccupationId: formdata.occupation || formdata.occupationId,
      stateId: formdata.state || formdata.stateId,
      otherStateName: formdata.otherstatetitle || formdata.otherStateName || formdata.otherstatetitle,
      universityId: formdata.university || formdata.universityId,
      otherUniversityName: formdata.otherunititle || formdata.otherUniversityName,
      courseId: formdata.coursename || formdata.courseId,
      otherCourseName: formdata.othercoursenametitle || formdata.otherCourseName,
      courseStartDate: this.formatDate(formdata.coursestartdate),
      courseEndDate: this.formatDate(formdata.courseenddate),
      hasAssets: this.checkboxasset === 'Yes',
      lendingPartnerId: formdata.lendingpartner || formdata.lendingPartnerId,
      coursetype: formdata.coursetype
    };
  }
  mapLocalToApiFormat(local: any) {
    return {
      currentOccupationId: local.currentOccupationId || local.occupationId || local.occupation,

      occupationId:
        local.occupationId ||
        local.currentOccupationId ||
        local.occupation,

      stateId: local.stateId || local.state,
      otherStateName: local.otherStateName || local.otherstatetitle,
      universityId: local.universityId || local.university,
      otherUniversityName: local.otherUniversityName || local.otherunititle,
      courseId: local.courseId || local.coursename,
      otherCourseName: local.otherCourseName || local.othercoursenametitle,
      coursetype: local.coursetype,
      // hasAssets: local.hasAssets ?? (local.checkedasset === 'Yes'),
      courseStartDate: local.courseStartDate,
      courseEndDate: local.courseEndDate,
      lendingPartnerId: local.lendingPartnerId || local.lendingpartner,
      annualIncome: local.annualIncome || local.annualincome,
      relationship: local.relationship || this.formatRelation(local.relationWithApplicant),
      relationshipWithId: local?.relationshipWithId,
      hasAssets:
        local.hasAssets === true ||
        local.hasAssets === 'true' ||
        local.checkedasset === 'Yes' ||
        local.co_checkedasset === 'Yes',

    };
  }

  //edit flow - get data from summary
  async patchFromSummary() {
    const summaryGeneralInfo = await this.getGeneralInfoFromSummaryForCurrentApplicant();

    if (!summaryGeneralInfo) return;

    if (this.isCoApplicant) {
      this.patchCoApplicantInfo(summaryGeneralInfo);
      this.co_checkassetOnChange(summaryGeneralInfo.hasAssets ? 'Yes' : 'No');
    } else {
      this.patchGeneralInfo(summaryGeneralInfo);
      this.checkassetOnChange(summaryGeneralInfo.hasAssets ? 'Yes' : 'No');
    }
  }
  private mapSummaryGeneralInfoToPatchData(generalInfo: any): any {
    const occupation = generalInfo?.occupationInfo || {};
    const course = generalInfo?.courseDetails || {};

    if (this.isCoApplicant) {
      const occupationId = this.getValueByLabel(
        this.selectoccupation,
        occupation.occupation
      );

      return {
        currentOccupationId: occupationId || occupation.occupation || '',
        occupationId: occupationId || occupation.occupation || '',
        occupation: occupationId || occupation.occupation || '',
        annualIncome: generalInfo?.annualIncome || '',
        relationship: this.formatRelation(generalInfo?.relationWithApplicant),
        relationWithApplicant: this.formatRelation(generalInfo?.relationWithApplicant),
        relationWithApplicantId: generalInfo?.relationWithApplicantId,
        hasAssets: generalInfo?.hasAssets === true
      };
    }

    const occupationId = this.getValueByLabel(
      this.selectoccupation,
      occupation.occupation
    );

    const stateId = this.getValueByLabel(
      this.Australianstate,
      course.state
    );


    const lendingPartnerId = this.getValueByLabel(
      this.selectlendingpartner,
      course.lendingPartner
    );

    return {
      currentOccupationId: occupationId || occupation.occupation || '',
      occupationId: occupationId || occupation.occupation || '',

      stateId: stateId || course.state || '',
      otherStateName: course.otherStateName || '',

      // these may still be names if dropdown child data is not loaded yet
      universityId: course.universityId || course.universityName || '',
      universityName: course.universityName || '',
      otherUniversityName: course.otherUniversityName || '',

      coursetype: course.courseType || '',

      courseId: course.courseId || course.courseName || '',
      courseName: course.courseName || '',
      otherCourseName: course.otherCourseName || '',

      courseStartDate: course.startDate || '',
      courseEndDate: course.endDate || '',

      hasAssets: generalInfo?.hasAssets === true,

      lendingPartnerId: lendingPartnerId || course.lendingPartner || ''
    };
  }

  getValueByLabel(list: any[], label: string) {
    if (!label || !list?.length) return '';

    return list.find((x: any) =>
      x.label?.toString().trim().toLowerCase() ===
      label.toString().trim().toLowerCase()
    )?.value || '';
  }
  //patch main form data
  patchGeneralInfo(data: any) {
    if (!data) return;

    this.registerForm.patchValue({

      occupation: data.currentOccupationId,
      state: data.stateId,

      otherstatetitle: data.otherStateName ?? '',
      university: data.universityId,
      otherunititle: data.otherUniversityName ?? '',
      coursename: data.courseId || data.courseName,
      othercoursenametitle: data.otherCourseName ?? '',
      checkedasset: data.hasAssets ? 'Yes' : 'No',
      coursestartdate: this.parseDate(data.courseStartDate),
      courseenddate: this.parseDate(data.courseEndDate),
      lendingpartner: data.lendingPartnerId
    }, { emitEvent: false });


    this.checkboxasset = data.hasAssets ? 'Yes' : 'No';

    this.restoreDependentDropdowns(data);
  }


  //patch co-applicant form
  patchCoApplicantInfo(data: any) {
    if (!data) return;

    const occupation =
      data.currentOccupationId ||
      data.occupationId ||
      data.occupation ||
      '';

    const annualIncome =
      data.annualIncome ||
      data.annualincome ||
      '';

    const relationship =
      data.relationWithApplicantId || data.relationship ||
      this.formatRelation(data.relationWithApplicant) ||
      '';

    const hasAssets1 =
      data.hasAssets === true ||
      data.hasAssets === 'true';
    const hasAssets = this.toBoolean(data.hasAssets);

    this.coapp_registerForm.patchValue({
      occupation: occupation,
      annualincome: annualIncome,
      relationship: relationship,
      co_checkedasset: hasAssets ? 'Yes' : 'No'
    }, { emitEvent: false });

    this.checkboxasset = hasAssets ? 'Yes' : 'No';


    // important for custom dropdown display
    const selectedOccupation = this.selectoccupation.find(
      x => x.value === occupation
    );

    this.occupationlabel =
      'Current Occupation';

    const selectedRelation = this.selectrelationship.find(
      x => x.value === relationship || x.label === relationship
    );

    this.isOtherRelationship =
      selectedRelation?.label?.trim().toLowerCase() === 'other';
  }

  formatRelation(value: any): string {
    if (!value) return '';

    const text = value.toString().toLowerCase();

    return text.charAt(0).toUpperCase() + text.slice(1);
  }
  //save and exit 

  saveExit() {
    this.msgBox.open({
      title: 'Are you sure you want to exit?',
      message: ``,
      showCancel: true, okText:'Yes',
      onOk: () => {
        const formdata = this.activeForm.value;

        const key = this.getStorageKey();

        let input: any;

        if (this.isCoApplicant) {
          input = {

            applicationId: this.applicationId,
            applicantId: this.applicantId,
            occupationId: formdata.occupation,
            occupation: formdata.occupation,
            annualIncome: formdata.annualincome,
            relationship: formdata.relationship,
            relationWithApplicant: formdata.relationship,
            hasAssets: this.checkboxasset === 'Yes'

          };
        } else {

          input = this.buildMainPayload(formdata);

        }

        // localStorage.setItem(key, JSON.stringify(input));
        this.storageservice.saveSectionData(
          'generalInfo',
          this.applicationId,
          this.applicantId,
          this.isCoApplicant,
          input
        );

        const inputdata = {
          action: "auto-save",
          sectionKey: "GENERAL_INFO",
          applicationId: this.applicationId,
          applicantId: this.applicantId,
          jsonData: input
        };

        this.formSvc.saveandExit(inputdata).subscribe();
        this.router.navigate(['/admin/losoperation']);
      }
    });

  }

  //get api for saved data
  getSavedGeneralInfo(): Promise<any> {
    let sectionkey = "GENERAL_INFO"
    return new Promise((resolve) => {
      this.formSvc.getSavedData(this.applicationId, this.applicantId, sectionkey).pipe()

        .subscribe({
          next: (res) => {

            console.log(res)

            if (res.status === "success" && res.data?.data) {
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
  back() {
    this.stepperService.previous();
  }

  //main applicant data
  saveMainApplicant(formdata: any) {

    let input = this.buildMainPayload(formdata);

    this.formSvc.submitGenralInfo(input, this.applicationId, false).subscribe(res => {
      if (res.status === "success") {
        this.lastSavedPayload = { ...input };

        this.stepperService.next();

        this.formSvc.generalInfoData = { ...input, coursetype: formdata.coursetype };

        // localStorage.setItem(
        //   this.getStorageKey(),
        //   JSON.stringify(this.formSvc.generalInfoData)
        // );
        this.storageservice.saveSectionData(
          'generalInfo',
          this.applicationId,
          this.applicantId,
          this.isCoApplicant,
          input
        );

        this.stepperService.markStepCompleted(this.getStepRoute());
        this.stepperService.setStepData(this.getStepRoute(), formdata);

      }
    });
  }

  //coapplicant data
  saveCoApplicant(formdata: any) {
    const payload = this.buildCoApplicantPayload(formdata);

    const coApplicantId = this.stepperService.getCo_appId()?.[0] || this.applicantId;
    const input = {
      applicationId: this.applicationId,
      applicantId: coApplicantId,
      occupationId: payload.occupation,
      annualIncome: payload.annualIncome,
      relationWithApplicantId: payload.relationWithApplicantId,
      hasAssets: payload.hasAssets// this.checkboxasset === "Yes",
    };

    this.formSvc.submit_Coapp_GenralInfo(input, this.applicationId, false).subscribe(res => {
      if (res.status === "success") {

        const localPayload = {
          ...input,
          relationship: payload.relationship
        };

        this.lastSavedPayload = { ...payload };

        this.formSvc.co_generalInfoData = { ...localPayload };

        this.storageservice.saveSectionData(
          'generalInfo',
          this.applicationId,
          this.applicantId,
          this.isCoApplicant,
          localPayload
        );

        this.stepperService.markStepCompleted(this.getStepRoute());
        this.stepperService.setStepData(this.getStepRoute(), formdata);
        this.stepperService.next();





      }
    });


  }

  isPayloadChanged(currentPayload: any, savedPayload: any): boolean {
    return JSON.stringify(currentPayload) !== JSON.stringify(savedPayload);
  }



  next() {
    this.formSubmitted = true;
    const form = this.activeForm;


  form.markAllAsTouched();

  if (!this.isCoApplicant) {
    this.registerForm
      .get('coursestartdate')
      ?.updateValueAndValidity({
        emitEvent: false
      });

    this.registerForm
      .get('courseenddate')
      ?.updateValueAndValidity({
        emitEvent: false
      });
  }
  form.updateValueAndValidity({
    emitEvent: false
  });
    // form.updateValueAndValidity();

    if (!form.valid) {
      console.log("form invalid");
      return;
    }

    if (form.value.occupation && this.isCoApplicant) {
      const occupationType: any = this.selectoccupation.filter((item: any) => item.value === form.value.occupation);
      console.log(occupationType, this.checkboxasset);
      if ((occupationType?.[0]?.label === "Housewife / Homemaker" || occupationType?.[0]?.label === "Unemployed") && this.checkboxasset === "No") {
        this.msgBox.open({
          title: 'You are not eligible as a co-applicant. Please ask the main applicant to add another co-applicant.',
          message: ``,

          okText: '+ Add Co-applicant',
          cancelText: 'No',
          showCancel: false,
          onOk: () => {
            this.router.navigate(['/loanform/co-applicantdetails']);
          }
        });
        return;
      }


    }

    const currentPayload = this.isCoApplicant
      ? this.buildCoApplicantPayload(form.value)
      : this.buildMainPayload(form.value);

    const hasChanged = this.isPayloadChanged(currentPayload, this.lastSavedPayload);

    if (!hasChanged && !this.loadedFromSaveExit) {
      console.log('No changes detected, skipping API call');

      if (this.isCoApplicant) {
        this.stepperService.markStepCompleted(this.getStepRoute());
        this.stepperService.setStepData(this.getStepRoute(), form.value);
      } else {
        this.stepperService.markStepCompleted(this.getStepRoute());
        this.stepperService.setStepData(this.getStepRoute(), form.value);
      }

      this.stepperService.next();
      return;
    }

    if (this.isCoApplicant) {
      this.saveCoApplicant(form.value);
    } else {
      this.saveMainApplicant(form.value);
    }
  }

  //edit from summary enable and disbale


  enableForm(): void {
    if (this.isDataLoading) {
      return;
    }

    this.originalFormValue =
      this.activeForm.getRawValue();

    this.isViewMode = false;
    this.isEditMode = true;
    this.viewOnly = false;

    this.activeForm.enable({
      emitEvent: false
    });

    this.cd.detectChanges();
  }

  cancelSummaryEdit() {
    if (this.isEditMode && this.originalFormValue) {
      this.activeForm.patchValue(this.originalFormValue);
    }

    this.isViewMode = true;
    this.isEditMode = false;
    this.viewOnly = true;
    this.activeForm.disable();
  }
  saveSummaryEdit() {
    const form = this.activeForm;
    form.updateValueAndValidity();
    if (!form.valid) {
      console.log("form invalid");
      return;
    }

    if (form.value.occupation && this.isCoApplicant) {
      const occupationType: any = this.selectoccupation.filter((item: any) => item.value === form.value.occupation);
      console.log(occupationType, this.checkboxasset);
      if ((occupationType?.[0]?.label === "Housewife / Homemaker" || occupationType?.[0]?.label === "Unemployed") && this.checkboxasset === "No") {
        this.msgBox.open({
          title: 'You are not eligible as a co-applicant. Please ask the main applicant to add another co-applicant.',
          message: ``,
          showCancel: false,
          okText: '+ Add Co-applicant',
          onOk: () => {
            this.router.navigate(['/loanform/co-applicantdetails']);
          }
        });
        return;
      }


    }

    const input = this.isCoApplicant
      ? this.buildCoApplicantPayload(form.value)
      : this.buildMainPayload(form.value);

    const relationObject: any = this.selectrelationship.find((item: any) => item.label === form.value.relationship || item.value === form.value.relationship);

    if (this.isCoApplicant) {
      const apiInput = {
        applicationId: this.applicationId,
        applicantId: this.applicantId,
        occupationId: form.value.occupation,
        annualIncome: form.value.annualincome,
        relationWithApplicantId: relationObject.value,
        relationship: form.value.relationship,
        hasAssets: form.value.co_checkedasset === 'Yes'
      };

      this.formSvc.submit_Coapp_GenralInfo(apiInput, this.applicationId, true).subscribe({
        next: (res: any) => {
          if (res.status === 'success') {
            this.formSvc.co_generalInfoData = input;
            this.lastSavedPayload = { ...input };
            this.editSuccess = true;
          }
        },
        error: (err) => {
          console.error('General info update failed', err);
        }
      });

    } else {
      this.formSvc.submitGenralInfo(input, this.applicationId, true).subscribe({
        next: (res: any) => {
          if (res.status === 'success') {
            this.formSvc.generalInfoData = input;
            this.lastSavedPayload = { ...input };
            this.editSuccess = true;
          }
        },
        error: (err) => {
          console.error('General info update failed', err);
        }
      });
    }
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
      this.activeForm.disable();
    }
  }

  onDateChanged1($event: any) {
    this.registerForm.patchValue({
      courseenddate: ''
    }, { emitEvent: false });
  }

onStartDateChanged(event: unknown): void {
  const startControl =
    this.registerForm.get('coursestartdate');

  const endControl =
    this.registerForm.get('courseenddate');

  startControl?.updateValueAndValidity({
    emitEvent: false
  });

  endControl?.updateValueAndValidity({
    emitEvent: false
  });

  if (endControl?.value && endControl.invalid) {
endControl.markAsTouched();
}
}

onEndDateChanged(event: unknown): void {
  const endControl =
    this.registerForm.get('courseenddate');

  endControl?.markAsTouched();

  endControl?.updateValueAndValidity({
    emitEvent: false
  });
}
}
