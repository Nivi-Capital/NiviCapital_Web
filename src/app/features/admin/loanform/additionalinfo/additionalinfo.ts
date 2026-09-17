import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, input, Input, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormGroup, Validators, FormBuilder, MinLengthValidator, MaxLengthValidator } from '@angular/forms';
import { Buttons } from '../../../systemdesign/buttons/buttons';
import { Checkbox } from '../../../systemdesign/checkbox/checkbox';
import { Dropdown, DropdownOption } from '../../../systemdesign/dropdown/dropdown';
import { Radiobuttons } from '../../../systemdesign/radiobuttons/radiobuttons';
import { Uploadbtn, UploadConfig, UploadResult } from '../../../systemdesign/uploadbtn/uploadbtn';
import { Main } from '../../../../core/service/main';
import { Inputfield } from '../../../systemdesign/inputfield/inputfield';
import { Loanstepperservice } from '../../../../core/service/loanstepperservice';
import { Loanformservice } from '../../../../core/service/loanformservice';
import { ActivatedRoute, Router } from '@angular/router';
import { Msgboxservice } from '../../../../core/service/msgboxservice';
import { firstValueFrom } from 'rxjs';
import { Storage } from '../../../../core/service/storage';
import { Successbox } from '../../customer/successbox/successbox';
import { Messagebox } from "../../../systemdesign/messagebox/messagebox";
@Component({
  selector: 'app-additionalinfo',
  imports: [CommonModule, Buttons, Checkbox, Dropdown, ReactiveFormsModule, Uploadbtn, Radiobuttons, Inputfield, Successbox, Messagebox],
  standalone: true,
  templateUrl: './additionalinfo.html',
  styleUrl: './additionalinfo.scss'
})
export class Additionalinfo implements OnInit {
  openIndex: number | null = 0;
  // accordions = [
  //   { title: 'Main Applicant ', alwaysOpen: true },

  // ];
  accordions: any[] = [];

  @Input() avatarUrl = '';
  @Input() hasAvatar = false;
  maritalstatus: string = 'Marital Status';
  marital_status: DropdownOption[] = [
    { label: 'Single', value: 'Single', icon: '' },
    { label: 'Married', value: 'Married', icon: '' },
    { label: 'Divorced', value: 'Divorced', icon: '' },
    { label: 'Widowed', value: 'Widowed', icon: '' },
    { label: 'Separated', value: 'Separated', icon: '' },
  ];

  dependents: string = 'Number Of Dependents';
  dependentscount: DropdownOption[] = [
    { label: '1', value: '1', icon: '' },
    { label: '2', value: '2', icon: '' },
  ];


  additionalinfoForm!: FormGroup;

  uploadedFiles: Record<string, File | null> = {};
  uploadedPreviewUrls: Record<string, string> = {};
  files: any = {};
  basicConfig: UploadConfig = {
    accept: '.jpg, .jpeg',
    maxSize: 2,
    minSize: 50,
    helperText: 'JPG, JPEG (max. 2MB,min. 50KB)'
  };
  genderchecked: string = '';
  gendercheckvalue = ''
  isspousemiddlename = false
  isfathermiddlename = false
  ismothermiddlename = false

  requiredDocs = ['applicantphoto'];
  applicationId: any;
  applicantId: any;
  profilePhotoUrl: any;
  objectName: any;
  fileName: any;


  showMotherError = false;
  showFatherError = false;
  showSpouseError = false;
  submitAttempted = false;

  isCoApplicant: boolean = false;
  lastSavedPayload: any = null;

  photoPreviewUrl: string | null = null;
  uploadedFileName: string | null = null;
  localFiles: any = {};

  //edit from summary
  isFromSummary = false;
  isViewMode = false;
  isEditMode = false;
  originalFormValue: any = null;
  isSummaryEditMode = false;
  viewOnly = false;

  editSuccess: any = false;

  description1 = `Great ! Your Additional Info Details\n Uploaded Successfully.`;

   isDataLoading = true;
loadError = '';
loadedFromSaveExit = false;

  constructor(private fb: FormBuilder, public main: Main, private route: ActivatedRoute, private router: Router, private stepperService: Loanstepperservice,
    private formSvc: Loanformservice, private msgBox: Msgboxservice, private storageservice: Storage,private cd: ChangeDetectorRef) { }
  async ngOnInit() {
 this.isDataLoading = true;
  this.loadError = '';
try {
    this.isCoApplicant = this.router.url.includes('co-applicant');

    this.stepperService.setStepperType(
      this.isCoApplicant ? 'CO_APPLICANT' : 'MAIN'
    );
    this.accordions = [
      {
        title: this.isCoApplicant ? 'Co-Applicant' : 'Main Applicant',
        alwaysOpen: true
      }
    ];

    if (this.isCoApplicant) {
      this.stepperService.restoreCoAppIdFromSession();
    }

    this.stepperService.restoreLoanEditContext();
    this.stepperService.restoreLoanIdFromSession();

    let storedCoAppData: any = {};

    try {
      storedCoAppData = JSON.parse(sessionStorage.getItem('coAppIds') || '{}');
    } catch {
      storedCoAppData = {};
    }

    const index =
  Number(this.route.snapshot.queryParams['coApplicantIndex']) ||
  Number(storedCoAppData?.coApplicantIndex) ||
  this.stepperService.getCurrentCoApplicantIndex() ||
  1;

    this.stepperService.setCurrentCoApplicantIndex(index);

    //application and applicant id of main-applicant 
    let Allids = this.stepperService.getLoanId();

    this.applicantId = Allids[0];
    this.applicationId = Allids[1];

    //application and applicant id of co-applicant  

    let AllCoapp_ids = this.stepperService.getCo_appId();

    const queryParams = this.route.snapshot.queryParams;


    if (this.isCoApplicant && (!AllCoapp_ids || !AllCoapp_ids[0] || !AllCoapp_ids[1])) {

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


    this.additionalinfoForm = this.fb.group({

      uploadphoto: [''],
      maritalstatus: ['', Validators.required,],
      gender: ['', Validators.required,],
      dependents: ['', [Validators.required]],
      s_fname: ['', [Validators.pattern('^[A-Za-z ]+$'), Validators.minLength(2), Validators.maxLength(25)]],
      s_mname: ['', [Validators.pattern('^[A-Za-z ]+$'), Validators.minLength(2), Validators.maxLength(25)]],
      s_lname: ['', [Validators.pattern('^[A-Za-z ]+$'), Validators.minLength(2), Validators.maxLength(25)]],
      spouseNoMiddleName: [false],
      f_fname: ['', [Validators.required, Validators.pattern('^[A-Za-z ]+$'), Validators.minLength(2), Validators.maxLength(25)]],
      f_mname: ['', [Validators.pattern('^[A-Za-z ]+$'), Validators.minLength(2), Validators.maxLength(25)]],
      f_lname: ['', [Validators.required, Validators.pattern('^[A-Za-z ]+$'), Validators.minLength(2), Validators.maxLength(25)]],
      fatherNoMiddleName: [false],
      m_fname: ['', [Validators.required, Validators.pattern('^[A-Za-z ]+$'), Validators.minLength(2), Validators.maxLength(25)]],
      m_mname: ['', [Validators.pattern('^[A-Za-z ]+$'), Validators.minLength(2), Validators.maxLength(25)]],
      m_lname: ['', [Validators.required, Validators.pattern('^[A-Za-z ]+$'), Validators.minLength(2), Validators.maxLength(25)]],
      motherNoMiddleName: [false],

    });
    this.stepperService.rebuildSteps();
    
    this.applyApplicantViewMode(queryParams)

    this.additionalinfoForm.get('maritalstatus')?.valueChanges.subscribe(value => {

      this.updateSpouseValidators(value);


    });


    await this.loadAdditionalInfoForBothFlows();

    // if (this.viewOnly) {
    //   this.additionalinfoForm.disable({ emitEvent: false });
    // }
} catch (error) {
    console.error(
      'Failed to initialize additional info page',
      error
    );

    this.loadError =
      'Unable to load additional details. Please try again.';
  } finally {
    this.isDataLoading = false;

    
    this.applyCurrentFormMode();

    this.cd.detectChanges();
  }

  }

//loading data
  private applyCurrentFormMode(): void {
  if (!this.additionalinfoForm) {
    return;
  }

  if (this.isViewMode && !this.isEditMode) {
    this.additionalinfoForm.disable({
      emitEvent: false
    });
  } else {
    this.additionalinfoForm.enable({
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

  // ✅ MAIN APPLICANT LOGIC
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
        this.additionalinfoForm.disable({ emitEvent: false });
      } else {
        this.isViewMode = false;
        this.isEditMode = true;
        this.additionalinfoForm.enable({ emitEvent: false });
      }
    } else {
      this.isFromSummary = false;
      this.isSummaryEditMode = false;
      this.viewOnly = false;
      this.isViewMode = false;
      this.isEditMode = false;
      this.additionalinfoForm.enable({ emitEvent: false });
    }

    return;
  }

  // ✅ CO-APPLICANT LOGIC
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

    this.additionalinfoForm.enable({ emitEvent: false });
  } else if (this.isSummaryEditMode) {
    if (this.viewOnly) {
      this.isViewMode = true;
      this.isEditMode = false;
      this.additionalinfoForm.disable({ emitEvent: false });
    } else {
      this.isViewMode = false;
      this.isEditMode = true;
      this.additionalinfoForm.enable({ emitEvent: false });
    }
  } else {
    this.isFromSummary = false;
    this.isSummaryEditMode = false;
    this.viewOnly = false;
    this.isViewMode = false;
    this.isEditMode = false;

    this.additionalinfoForm.enable({ emitEvent: false });
  }
}

  getStorageKey() {
    const main_ApplicantId = this.stepperService.getLoanId()?.[0];
    const co_ApplicantId = this.stepperService.getCo_appId()?.[0];
    const index = this.stepperService.getCurrentCoApplicantIndex();

    return this.storageservice.getStorageKey(
      'additionalinfo',
      this.applicationId,
      this.applicantId,
      this.isCoApplicant,

    );
  }

  private async loadAdditionalInfoForBothFlows() {
    const key = this.getStorageKey();

    const parsedLocal = this.storageservice.getStoredSectionData(
      'additionalinfo',
      this.applicationId,
      this.applicantId,
      this.isCoApplicant,


    );

    const apiApplicantId = this.getApiApplicantId();

    const draftData = apiApplicantId
      ? await this.getSavedAdditionalInfo(apiApplicantId)
      : null;

    const summarySection = await this.getSummarySection('additionalInfo');


    const normalizedSummary = this.normalizeAdditionalInfo(summarySection);
    const normalizedDraft = this.normalizeAdditionalInfo(draftData);
    const normalizedLocal = this.normalizeAdditionalInfo(parsedLocal);

     this.loadedFromSaveExit = !!normalizedDraft;

    let finalData: any = null;

    // 1) If summary has complete/final data -> always use summary
    if (this.isAdditionalInfoComplete(normalizedSummary)) {
      finalData = normalizedSummary;
    }
    // 2) Else if draft has any partial data -> use draft
    else if (this.hasAnyAdditionalInfoData(normalizedDraft)) {
      finalData = normalizedDraft;
    }
    // 3) Else if local has any partial data -> use local
    else if (this.hasAnyAdditionalInfoData(normalizedLocal)) {
      finalData = normalizedLocal;
    }
    // 4) Else if summary has partial data -> use summary
    else if (this.hasAnyAdditionalInfoData(normalizedSummary)) {
      finalData = normalizedSummary;
    }

    // If nothing exists -> fresh empty form
    if (!finalData) {
      this.lastSavedPayload = null;

      this.additionalinfoForm.reset({
        uploadphoto: '',
        maritalstatus: '',
        gender: '',
        dependents: '',
        s_fname: '',
        s_mname: '',
        s_lname: '',
        spouseNoMiddleName: false,
        f_fname: '',
        f_mname: '',
        f_lname: '',
        fatherNoMiddleName: false,
        m_fname: '',
        m_mname: '',
        m_lname: '',
        motherNoMiddleName: false
      }, { emitEvent: false });

      this.gendercheckvalue = '';
      this.profilePhotoUrl = '';
      this.fileName = '';
      this.objectName = '';
      this.isspousemiddlename = false;
      this.isfathermiddlename = false;
      this.ismothermiddlename = false;

      return;
    }


    //    patch partial or full saved data
    if (this.isCoApplicant) {
      this.formSvc.co_additionalInfoData = finalData;
    } else {
      this.formSvc.additionalInfoData = finalData;
    }

    this.patchAdditionalInfo(finalData);

    this.updateSpouseValidators(
      this.additionalinfoForm.get('maritalstatus')?.value
    );

    this.lastSavedPayload = this.buildAdditionalPayload(
      this.additionalinfoForm.getRawValue()
    );

    // localStorage.setItem(key, JSON.stringify(finalData));
    this.storageservice.saveSectionData(
      'additionalinfo',
      this.applicationId,
      this.applicantId,
      this.isCoApplicant,
      finalData,


    );

    // Blue tick only if fully completed
  const isFromSummaryRoute =
  this.route.snapshot.queryParams['fromSummary'] === true ||
  this.route.snapshot.queryParams['fromSummary'] === 'true';

const storedCoAppData = JSON.parse(sessionStorage.getItem('coAppIds') || '{}');
  const coappStatus = (
      storedCoAppData?.status || (isFromSummaryRoute ? 'COMPLETED' : '')

    ).toUpperCase();

    const isCompletedCoapp =
      coappStatus === 'COMPLETED' ||
      coappStatus === 'SUBMITTED';
if (
  this.isAdditionalInfoComplete(finalData) ||
  (this.isCoApplicant && isFromSummaryRoute && isCompletedCoapp)
) {
  this.stepperService.markStepCompleted(this.getStepRoute());
}


    this.additionalinfoForm.markAsPristine();
  }



  private async getSummarySection(sectionKey: string): Promise<any> {
    if (!this.applicationId) return null;

    try {
      const res: any = await firstValueFrom(
        this.formSvc.getSummary(this.applicationId)
      );

      if (!res || res.status !== 'success') return null;

      return this.formSvc.getApplicantSectionFromSummary(
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

  private normalizeAdditionalInfo(data: any): any {
    if (!data) return null;

    // If data already came from draft/local flat format, return same shape
    if (
      data.maritalStatus !== undefined ||
      data.fatherFirstName !== undefined ||
      data.motherFirstName !== undefined
    ) {
      return data;
    }

    // Summary format
    const applicantDetails = data?.applicantDetails || {};
    const spouse = data?.spouse || {};
    const father = data?.father || {};
    const mother = data?.mother || {};

    return {
      applicantId: this.getApiApplicantId(),

      profilePhotoUrl: applicantDetails.photoUrl || '',
      uploadphoto: applicantDetails.photoUrl || applicantDetails.fileName || '',
      fileName: applicantDetails.fileName || '',
      objectName: applicantDetails.objectName || '',

      maritalStatus: applicantDetails.maritalStatus || '',
      gender: applicantDetails.gender || '',
      numberOfDependents:
        applicantDetails.numberofDependents ??
        applicantDetails.numberOfDependents ??
        '',

      spouseFirstName: spouse.firstName || '',
      spouseMiddleName: spouse.middleName || '',
      spouseLastName: spouse.lastName || '',
      spouseNoMiddleName: !!spouse.spouseNoMiddleName,

      fatherFirstName: father.firstName || '',
      fatherMiddleName: father.middleName || '',
      fatherLastName: father.lastName || '',
      fatherNoMiddleName: !!father.fatherNoMiddleName,

      motherFirstName: mother.firstName || '',
      motherMiddleName: mother.middleName || '',
      motherLastName: mother.lastName || '',
      motherNoMiddleName: !!mother.motherNoMiddleName
    };
  }
  updateSpouseValidators(value: string) {
    const sFname = this.additionalinfoForm.get('s_fname');
    const sLname = this.additionalinfoForm.get('s_lname');

    if (value === 'Married') {
      sFname?.setValidators([
        Validators.required,
        Validators.pattern('^[A-Za-z ]+$'),
        Validators.minLength(2),
        Validators.maxLength(25)
      ]);

      sLname?.setValidators([
        Validators.required,
        Validators.pattern('^[A-Za-z ]+$'),
        Validators.minLength(2),
        Validators.maxLength(25)
      ]);
    } else {
      sFname?.clearValidators();
      sLname?.clearValidators();

      sFname?.setValue('');
      sLname?.setValue('');
    }

    sFname?.updateValueAndValidity();
    sLname?.updateValueAndValidity();
  }
  //check exiting value present or not
  private hasAnyAdditionalInfoData(data: any): boolean {
    if (!data) return false;

    return !!(
      data.profilePhotoUrl ||
      data.uploadphoto ||
      data.fileName ||
      data.maritalStatus ||
      data.gender ||
      data.numberOfDependents ||
      data.spouseFirstName ||
      data.spouseMiddleName ||
      data.spouseLastName ||
      data.fatherFirstName ||
      data.fatherMiddleName ||
      data.fatherLastName ||
      data.motherFirstName ||
      data.motherMiddleName ||
      data.motherLastName
    );
  }

  private isAdditionalInfoComplete(data: any): boolean {
    if (!data) return false;

    const maritalStatus = data.maritalStatus || '';
    const gender = data.gender || '';
    const dependents = data.numberOfDependents || '';

    const fatherOk =
      !!data.fatherFirstName &&
      !!data.fatherLastName &&
      (!!data.fatherMiddleName || !!data.fatherNoMiddleName);

    const motherOk =
      !!data.motherFirstName &&
      !!data.motherLastName &&
      (!!data.motherMiddleName || !!data.motherNoMiddleName);

    const spouseOk =
      maritalStatus !== 'MARRIED' && maritalStatus !== 'Married'
        ? true
        : !!data.spouseFirstName &&
        !!data.spouseLastName &&
        (!!data.spouseMiddleName || !!data.spouseNoMiddleName);

    return !!(
      maritalStatus &&
      gender &&
      dependents &&
      fatherOk &&
      motherOk &&
      spouseOk
    );
  }
  get f() {
    return this.additionalinfoForm.controls;
  }
  toggle(i: number) {
    this.openIndex = this.openIndex === i ? null : i;
  }

  submit() {
    if (this.additionalinfoForm.invalid) return;

    console.log(this.additionalinfoForm.value);
  }

  onmiddlename(value: boolean): void {
    this.isspousemiddlename = value;
  }
  onfathermiddlename(value: boolean): void {
    this.isfathermiddlename = value;
  }
  onmothermiddlename(value: boolean): void {
    this.ismothermiddlename = value;
  }
  onFileChange(result: UploadResult, key: string) {
    console.log(result);


    if (!result || !result.file) {
      this.profilePhotoUrl = null;
      this.objectName = null;
      this.fileName = null;
      this.additionalinfoForm.get('uploadphoto')?.setValue(null);
      this.additionalinfoForm.get('uploadphoto')?.markAsTouched();
      return;
    }
    if (result?.file) {
      this.uploadedFiles[key] = result.file;
      this.uploadedPreviewUrls[key] = URL.createObjectURL(result.file);
    }
    const applicantId = this.getApiApplicantId();

    if (!applicantId) {
      console.error('ApplicantId not found for photo upload');
      return;
    }


    const fd = new FormData();
    fd.append('applicantId', applicantId);
    fd.append('file', result.file);

    this.formSvc.uploadPhoto(fd).subscribe({
      next: (res) => {
        console.log(res);
        this.profilePhotoUrl = res.data.publicUrl;
        this.objectName = res.data.objectName;
        this.fileName = res.data.fileName;

        this.additionalinfoForm.patchValue({
          uploadphoto: this.profilePhotoUrl
        });
        // this.additionalinfoForm.get('uploadphoto')?.setValue(this.profilePhotoUrl);
        this.additionalinfoForm.get('uploadphoto')?.markAsDirty();
        this.additionalinfoForm.get('uploadphoto')?.updateValueAndValidity();


      },
      error: (error) => {
        console.log(error);
      }
    });


  }


  gendercheck(value: string): void {
    this.gendercheckvalue = value;

    this.additionalinfoForm.get('gender')?.setValue(value, {
      emitEvent: false
    });

    this.additionalinfoForm.get('gender')?.markAsDirty();
    this.additionalinfoForm.get('gender')?.updateValueAndValidity();
  }
  private normalizeGenderToUi(value: any): string {
    if (!value) return '';

    const gender = value.toString().trim().toUpperCase();

    if (gender === 'M' || gender === 'MALE') return 'Male';
    if (gender === 'F' || gender === 'FEMALE') return 'Female';
    if (gender === 'O' || gender === 'THIRD GENDER' || gender === 'THIRD') {
      return 'Third Gender';
    }

    return '';
  }


  //file upload preview
  hasLocalFile(key: string): boolean {
    return !!this.uploadedFiles[key] || !!this.localFiles[key];
  }


  setExistingFile(type: string, fileName: string, fileUrl: string) {
    this.localFiles[type] = {
      name: fileName,
      url: fileUrl,
      isExisting: true
    };
  }

  getLocalFileName(
  key: any,truncate=true
): any {
  let filename ='';
 if (this.uploadedFiles[key]) {
      filename = this.uploadedFiles[key].name;
    }
    if (this.localFiles[key]) {
      filename = this.localFiles[key].name;
    }

  const fileName =filename;

  
    if (!truncate || fileName.length <= 30) {
          return fileName; }
            return `${fileName.substring(0, 30)}...`;
}

  getLocalFileUrl(key: string): string {
    if (this.uploadedPreviewUrls[key]) {
      return this.uploadedPreviewUrls[key];
    }
    if (this.localFiles[key]) {
      return this.localFiles[key].url;
    }
    return '';
  }


  viewLocalFile(key: string): void {
    const url = this.getLocalFileUrl(key);

    if (!url) return;

    window.open(url, '_blank');
  }

  downloadLocalFile(key: string): void {
    const file = this.uploadedFiles[key];

    if (!file) return;

    const url = this.getLocalFileUrl(key);

    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    link.click();
  }

  deleteLocalFile(key: string): void {
    this.msgBox.open({
      title: 'Are you sure want to Remove',
      message: ``,
      showCancel: true,
       okText:'Yes',
      onOk: () => {
        this.uploadedFiles[key] = null;
        delete this.files[key];
        delete this.localFiles[key];

        if (this.uploadedPreviewUrls[key]) {
          URL.revokeObjectURL(this.uploadedPreviewUrls[key]);
          delete this.uploadedPreviewUrls[key];
        }
      }
    });
  }

  back() {
    this.stepperService.previous();
  }
  //edit flow =patch from summary
  patchFromSummary() {
    if (!this.formSvc.isEditFlow()) return;

    const data = this.formSvc.getSummarySection('additionalInfo');
    console.log("patch", data)
    if (!data) return;
    const applicantDetails = data.applicantDetails || {};
    const spouse = data.spouse || {};
    const father = data.father || {};
    const mother = data.mother || {};


    if (applicantDetails.photoUrl && applicantDetails.fileName) {
      this.setExistingFile(
        'applicantphoto',
        applicantDetails.fileName,
        applicantDetails.photoUrl
      );
    }

    const genderValue =
      applicantDetails.gender == "M" ? "Male" :
        applicantDetails.gender == "F" ? "Female" : "Third Gender";


    this.photoPreviewUrl = applicantDetails.photoUrl || null;
    this.uploadedFileName = applicantDetails.fileName || null;


    this.additionalinfoForm.patchValue({

      uploadphoto: applicantDetails.fileName || '',
      maritalstatus: applicantDetails.maritalStatus ? applicantDetails.maritalStatus.charAt(0) + applicantDetails.maritalStatus.slice(1).toLowerCase() : '',
      // gender: data.gender == "M" ? "Male" : data.gender == "F" ? "Female" : 'O',
      dependents: applicantDetails.numberofDependents,

      s_fname: spouse.firstName,
      s_mname: spouse.middleName,
      s_lname: spouse.lastName,
      spouseNoMiddleName: spouse.spouseNoMiddleName,
      f_fname: father.firstName,
      f_mname: father.middleName,
      f_lname: father.lastName,
      fatherNoMiddleName: father.fatherNoMiddleName,
      m_fname: mother.firstName,
      m_mname: mother.middleName,
      m_lname: mother.lastName,
      motherNoMiddleName: mother.motherNoMiddleName,



    });
    this.additionalinfoForm.get('gender')?.setValue(genderValue, { emitEvent: false });
    this.gendercheck(genderValue);


    this.isfathermiddlename = !!father.fatherNoMiddleName;
    this.ismothermiddlename = !!mother.motherNoMiddleName;
    this.isspousemiddlename = !!spouse.spouseNoMiddleName;

    this.restoreMiddleNameState();

  }
  patchAdditionalInfo(data: any) {
    // const data = this.formSvc.additionalInfoData;

    if (!data) return;

    this.profilePhotoUrl = data.profilePhotoUrl || data.uploadphoto || '';
    this.fileName = data.fileName || '';
    this.objectName = data.objectName || '';


    if (this.profilePhotoUrl || this.fileName) {
      this.setExistingFile(
        'applicantphoto',
        this.fileName || 'Applicant Photo',
        this.profilePhotoUrl
      );
    }


    const genderValue1 =
      data.gender == "M" ? "Male" :
        data.gender == "F" ? "Female" : "Third Gender";
    const genderValue = this.normalizeGenderToUi(data.gender);

    console.log('fatherNoMiddleName', data.fatherNoMiddleName);

    const noSpouseMiddleName = 
  !data.spouseMiddleName || data.spouseMiddleName.trim() === '' ;

const noFatherMiddleName =
  !data.fatherMiddleName || data.fatherMiddleName.trim() === '';

const noMotherMiddleName =
  !data.motherMiddleName || data.motherMiddleName.trim() === '';

this.additionalinfoForm.patchValue({
  spouseNoMiddleName: noSpouseMiddleName,
  fatherNoMiddleName: noFatherMiddleName,
  motherNoMiddleName: noMotherMiddleName
});

this.isspousemiddlename = noSpouseMiddleName;
this.isfathermiddlename = noFatherMiddleName;
this.ismothermiddlename = noMotherMiddleName;

    this.additionalinfoForm.patchValue({

      uploadphoto: this.profilePhotoUrl || '',
      maritalstatus: data.maritalStatus ? data.maritalStatus.charAt(0) + data.maritalStatus.slice(1).toLowerCase() : '',
      // gender: data.gender == "M" ? "Male" : data.gender == "F" ? "Female" : 'O',
      dependents: data.numberOfDependents,

      s_fname: data.spouseFirstName || '',
      s_mname: data.spouseMiddleName || '',
      s_lname: data.spouseLastName || '',
      spouseNoMiddleName: noSpouseMiddleName, //!data.spouseNoMiddleName,
      f_fname: data.fatherFirstName || '',
      f_mname: data.fatherMiddleName || '',
      f_lname: data.fatherLastName || '',
      fatherNoMiddleName: noFatherMiddleName,
      m_fname: data.motherFirstName || '',
      m_mname: data.motherMiddleName || '',
      m_lname: data.motherLastName || '',
      motherNoMiddleName: noMotherMiddleName, //!data.motherNoMiddleName,



    });
    this.gendercheckvalue = genderValue;
    this.additionalinfoForm.get('gender')?.setValue(genderValue, { emitEvent: false });
    // this.gendercheck(genderValue);



    this.restoreMiddleNameState();

}

  private restoreMiddleNameState() {
    const form = this.additionalinfoForm;

    if (form.get('motherNoMiddleName')?.value) {
      form.get('m_mname')?.reset();
      form.get('m_mname')?.disable();
    }
     else {    form.get('m_mname')?.enable({ emitEvent: false });  }

    if (form.get('fatherNoMiddleName')?.value) {
      form.get('f_mname')?.reset();
      form.get('f_mname')?.disable();
    }else {    form.get('f_mname')?.enable({ emitEvent: false });  }

    if (form.get('spouseNoMiddleName')?.value) {
      form.get('s_mname')?.reset();
      form.get('s_mname')?.disable();
    } else {  form.get('s_mname')?.enable({ emitEvent: false });}
  }

  onMotherNoMiddleNameChange(checked: boolean) {
    const ctrl = this.additionalinfoForm.get('m_mname');
    checked ? ctrl?.disable() : ctrl?.enable();
  }
  onFatherNoMiddleNameChange(checked: boolean) {
    const ctrl = this.additionalinfoForm.get('f_mname');
    checked ? ctrl?.disable() : ctrl?.enable();
  }
  onSpouseNoMiddleNameChange(checked: boolean) {
    const ctrl = this.additionalinfoForm.get('s_mname');
    checked ? ctrl?.disable() : ctrl?.enable();
  }


  get canProceed(): boolean {
    const f = this.additionalinfoForm.value;

    const fatherOk =
      this.isfathermiddlename || !!f.f_mname;

    const motherOk =
      this.ismothermiddlename || !!f.m_mname;

    const spouseOk =
      this.additionalinfoForm.get('maritalstatus')?.value !== 'Married' ||
      this.isspousemiddlename || !!f.s_mname;

    return (
      this.additionalinfoForm.valid &&
      fatherOk &&
      motherOk &&
      spouseOk
    );
  }

  saveExit() {
    this.msgBox.open({
      title: 'Are you sure you want to exit?',
      message: ``,
      showCancel: true, okText:'Yes',
      onOk: () => {
        let formdata = this.additionalinfoForm.getRawValue();
        const input = this.buildAdditionalPayload(formdata);

        const key = this.getStorageKey();
        // localStorage.setItem(key, JSON.stringify(input));
        this.storageservice.saveSectionData(
          'additionalinfo',
          this.applicationId,
          this.applicantId,
          this.isCoApplicant,
          input,

        );

        if (this.isCoApplicant) {
          this.formSvc.co_additionalInfoData = input;
        } else {
          this.formSvc.additionalInfoData = input;
        }

        const apiApplicantId = this.getApiApplicantId();


        if (!apiApplicantId) {
          this.lastSavedPayload = { ...input };
          return;
        }

        const inputdata = {
          action: "auto-save",
          sectionKey: "PERSONAL_INFO",
          applicationId: this.applicationId,
          applicantId: apiApplicantId,
          jsonData: input
        };

        this.formSvc.saveandExit(inputdata).subscribe({
          next: () => {
            this.lastSavedPayload = { ...input };
          }
        });
        this.router.navigate(['/admin/losoperation']);
      }
    });
  }
  getSavedAdditionalInfo(applicantId: any): Promise<any> {
    let sectionkey = "PERSONAL_INFO"
    return new Promise((resolve) => {
      this.formSvc.getSavedData(this.applicationId, applicantId, sectionkey).pipe()

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

  isPayloadChanged(currentPayload: any, savedPayload: any): boolean {
    return JSON.stringify(currentPayload) !== JSON.stringify(savedPayload);
  }
  buildAdditionalPayload(formdata: any) {

    const existingData1 = this.isCoApplicant
      ? this.formSvc.co_additionalInfoData
      : this.formSvc.additionalInfoData;
    const existingData = this.lastSavedPayload || {};
    console.log(this.gendercheckvalue);
    return {
      applicantId: this.getApiApplicantId(),
      profilePhotoUrl: this.profilePhotoUrl || formdata.uploadphoto || existingData?.profilePhotoUrl || '',
      fileName: this.fileName || this.formSvc.additionalInfoData?.fileName || this.formSvc.co_additionalInfoData?.fileName || existingData?.fileName || '',
      objectName: this.objectName || this.formSvc.additionalInfoData?.objectName || this.formSvc.co_additionalInfoData?.objectName || existingData?.objectName || '',

      maritalStatus: formdata.maritalstatus?.toUpperCase() || '',
      gender:
        this.gendercheckvalue === "Male"
          ? "M"
          : this.gendercheckvalue === "Female"
            ? "F"
            : this.gendercheckvalue === "Third Gender"
              ? "O" : '',

      numberOfDependents: formdata.dependents || '',

      spouseFirstName: formdata.s_fname || '',
      spouseMiddleName: formdata.s_mname || '',
      spouseLastName: formdata.s_lname || '',
      spouseNoMiddleName: this.isspousemiddlename,

      fatherFirstName: formdata.f_fname || '',
      fatherMiddleName: formdata.f_mname || '',
      fatherLastName: formdata.f_lname || '',
      fatherNoMiddleName: this.isfathermiddlename,

      motherFirstName: formdata.m_fname || '',
      motherMiddleName: formdata.m_mname || '',
      motherLastName: formdata.m_lname || '',
      motherNoMiddleName: this.ismothermiddlename
    };
  }
  getStepRoute() {
    return this.isCoApplicant ? 'co-additionalinfo' : 'additionalinfo';
  }
  private goToNextStep1(): void {
  if (this.isCoApplicant) {

    let storedCoAppData: any = {};

    try {
      storedCoAppData = JSON.parse(
        sessionStorage.getItem('coAppIds') || '{}'
      );
    } catch {
      storedCoAppData = {};
    }

     const index =
      Number(
        this.route.snapshot.queryParamMap.get(
          'coApplicantIndex'
        )
      ) ||
      Number(storedCoAppData?.coApplicantIndex) ||
      Number(
        this.stepperService.getCurrentCoApplicantIndex()
      ) ||
      1;

    this.stepperService.setCurrentCoApplicantIndex(index);

    this.router.navigate(
      ['../co-kyc'],
      {
        relativeTo: this.route,
        queryParams: {
          coApplicantIndex: index,
          mode:
            this.route.snapshot.queryParamMap.get('mode') ||
            'existing'
        }
      }
    );

    return;
  }

  this.stepperService.next();
}

private goToNextStep(): void {
   const currentMode = this.route.snapshot.queryParamMap.get('mode') || 'existing';
  if (this.isCoApplicant) {
    const index =
      Number(
        this.route.snapshot.queryParamMap.get(
          'coApplicantIndex'
        )
      ) ||
      this.stepperService.getCurrentCoApplicantIndex();

    this.stepperService.setCurrentCoApplicantIndex(index);

    this.router.navigate(
      ['../co-kyc'],
      {
        relativeTo: this.route,
        queryParams: {
          coApplicantIndex: index,
          mode: currentMode
        }
      }
    );

    return;
  }

  this.stepperService.next();
}
  next() {
    this.submitAttempted = true;
    let formdata = this.additionalinfoForm.getRawValue();

    if (!this.canProceed) {
      return;
    }

    if (this.additionalinfoForm.invalid) {
      this.additionalinfoForm.markAllAsTouched();
      return;
    }
    const apiApplicantId = this.getApiApplicantId();

    if (!apiApplicantId) {
      console.error('Co-applicant applicantId not found. CIF not generated.');
      return;
    }


    //new input 
    // const input = this.buildAdditionalPayload(formdata);
    const input = {
      ...this.buildAdditionalPayload(formdata),
      applicantId: apiApplicantId
    };
    const hasChanged = this.isPayloadChanged(input, this.lastSavedPayload);

    const stepRoute = this.getStepRoute();
    if (!hasChanged && !this.loadedFromSaveExit) {
      console.log('No changes detected, skipping API');

      this.stepperService.markStepCompleted(stepRoute);
      this.stepperService.setStepData(stepRoute, formdata);

      // this.stepperService.next();
      this.goToNextStep();
      return;
    }



    this.formSvc.submitAdditionalInfo(input, this.applicationId, false).subscribe({
      next: (res) => {
        console.log(res);
        if (res.status == "success") {

          const key = this.getStorageKey();

          // localStorage.setItem(key, JSON.stringify(input));
          this.storageservice.saveSectionData(
            'additionalinfo',
            this.applicationId,
            this.applicantId,
            this.isCoApplicant,
            input
          );

          if (this.isCoApplicant) {
            this.formSvc.co_additionalInfoData = input;
          } else {
            this.formSvc.additionalInfoData = input;
          }
          this.lastSavedPayload = { ...input };

          this.stepperService.markStepCompleted(stepRoute);
          this.stepperService.setStepData(stepRoute, formdata);

          // this.stepperService.next();
          this.goToNextStep();
        }

      },
      error: (err) => {
        console.error("error msg", err);
      }

    });


    // this.stepperService.setStepData('educationDetails', this.registerForm.value);

    // this.stepperService.next();

  }

  getCurrentCoApplicantFromList() {
    const index = this.stepperService.getCurrentCoApplicantIndex();

    const saved = localStorage.getItem(`coApplicants_${this.applicationId}`);
    const list = saved ? JSON.parse(saved) : [];

    return list.find((x: any) => Number(x.index) === Number(index));
  }

  getApiApplicantId() {
    if (!this.isCoApplicant) {
      return this.stepperService.getLoanId()?.[0];
    }

    return this.stepperService.getCo_appId()?.[0] || null;
  }

  //edit from summary enable and disbale
 enableForm(): void {
  if (this.isDataLoading) {
    return;
  }

  this.originalFormValue =
    this.additionalinfoForm.getRawValue();

  this.isViewMode = false;
  this.isEditMode = true;
  this.viewOnly = false;

  this.additionalinfoForm.enable({
    emitEvent: false
  });

  this.cd.detectChanges();
}

  disableAdditionalInfoForm() {
    this.additionalinfoForm.disable({ emitEvent: false });
  }

  enableAdditionalInfoForm() {
    this.additionalinfoForm.enable({ emitEvent: false });

    this.restoreMiddleNameState();
    this.updateSpouseValidators(this.additionalinfoForm.get('maritalstatus')?.value);
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
      this.additionalinfoForm.patchValue(this.originalFormValue);
    }
    this.isViewMode = true;
    this.isEditMode = false;
    this.additionalinfoForm.disable({ emitEvent: false });
  }
  saveSummaryEdit() {
    this.submitAttempted = true;

    if (!this.canProceed) {
      this.additionalinfoForm.markAllAsTouched();
      return;
    }

    const formdata = this.additionalinfoForm.getRawValue();
    const input = this.buildAdditionalPayload(formdata);

    this.formSvc.submitAdditionalInfo(input, this.applicationId, true).subscribe({
      next: (res: any) => {
        if (res.status === 'success') {
          const key = this.getStorageKey();
          // localStorage.setItem(key, JSON.stringify(input));
          this.storageservice.saveSectionData(
            'additionalinfo',
            this.applicationId,
            this.applicantId,
            this.isCoApplicant,
            input
          );
          if (this.isCoApplicant) {
            this.formSvc.co_additionalInfoData = input;
          } else {
            this.formSvc.additionalInfoData = input;
          }

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
      this.additionalinfoForm.disable({ emitEvent: false });
    }
  }

}
