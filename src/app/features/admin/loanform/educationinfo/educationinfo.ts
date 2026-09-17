import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { Buttons } from '../../../systemdesign/buttons/buttons';
import { Checkbox } from '../../../systemdesign/checkbox/checkbox';
import { Dropdown, DropdownOption } from '../../../systemdesign/dropdown/dropdown';
import { AbstractControl, FormArray, FormBuilder, FormGroup, NgForm, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Uploadbtn, UploadConfig, UploadResult } from "../../../systemdesign/uploadbtn/uploadbtn";
import { Radiobuttons } from '../../../systemdesign/radiobuttons/radiobuttons';
import { Loanstepperservice } from '../../../../core/service/loanstepperservice';
import { Main } from '../../../../core/service/main';
import { Inputfield } from '../../../systemdesign/inputfield/inputfield';
import { Edusection } from './edusection/edusection';
import { Loanformservice } from '../../../../core/service/loanformservice';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, firstValueFrom, forkJoin, of } from 'rxjs';
import { Messagebox } from '../../../systemdesign/messagebox/messagebox';
import { Msgboxservice } from '../../../../core/service/msgboxservice';
import { catchError, map } from 'rxjs/operators';
import { Successbox } from '../../customer/successbox/successbox';
import { Storage } from '../../../../core/service/storage';

interface OptionItem {
  label: string;
  value: string;
  code?: string;
}
type StepKey = '10th' | '12th' | 'diploma10' | 'diploma12' | 'ug' | 'pg' | 'ielts' | 'offerletter' | 'others12' | 'othersdiploma';
type Subcategory = '_10TH' | '_12TH' | 'DIPLOMA' | 'UNDERGRADUATE' | 'POSTGRADUATE' | 'IELTS_PTE' | "OFFER_LETTER" | 'OTHER' | 'OTHER_AFTER_DIPLOMA' | 'OTHER_AFTER_12';
// type DocType = 'marksheet' | 'lc';
type ApiType = 'MARKSHEET' | 'SCHOOL_LEAVING_CERT';

interface OptionItem {
  label: string;
  value: string;
  code?: string;
}
type EducationType = 'IELTS_PTE' | 'OFFER_LETTER'


type DocType = 'marksheet' | 'lc' | 'offerletter' | 'ielts' | 'other';

interface RequiredDoc {
  doc: DocType;
  apiType: string;
  title: string;
  index?: number;
}
type ApiDocumentType =
  | 'MARKSHEET'
  | 'SCHOOL_LEAVING_CERT'
  | 'OTHER'
  | 'UPLOAD_CERTIFICATE'
  | 'IELTS'
  | 'OFFERLETTER';

@Component({
  selector: 'app-educationinfo',
  imports: [CommonModule, Buttons, ReactiveFormsModule, Uploadbtn, Inputfield, Edusection, Dropdown, Successbox, Messagebox],
  standalone: true,
  templateUrl: './educationinfo.html',
  styleUrl: './educationinfo.scss'
})
export class Educationinfo implements OnInit {

  applicantId: any;
  applicationId: any;
  custName: any;
  custARN: any;

  files: any = {};

  basicConfig: UploadConfig = {
    accept: '.svg, .png, .jpg, .jpeg, .pdf',
    maxSize: 10,
    helperText: 'JPG, JPEG, PDF, PNG,  SVG (max. 10 MB)'
  };
  qualification: string = 'Last Qualification';
  seleactqualification: OptionItem[] = []

  openIndex: number[] = [0];
  accordions = [
    { title: '10th Document ', alwaysOpen: true },
    { title: '12th Document ', alwaysOpen: false },
    { title: 'Bachelors / Undergraduate ', alwaysOpen: false },
    { title: 'Postgraduate ', alwaysOpen: false },
    { title: 'IELTS / PTE ', alwaysOpen: false },
    { title: 'University Offer Letter ', alwaysOpen: false },
  ];
  educationForm!: FormGroup

  @Input() group!: FormGroup;
  @Input() title!: string;
  @Input() isHigher: boolean = false;
  @Input() sectionType!: 'school' | 'diploma' | 'bachelors' | 'postgrad';



  //dropdowns
  @Input() avatarUrl = '';
  @Input() hasAvatar = false;
  passingyear: string = 'Year of Passing';
  selectpassingyr: DropdownOption[] = [
    { label: 'Loan', value: 'Loan', icon: '' },
  ];


  per_cgpa: string = 'Percentage / CGPA ';
  selectpercentage: DropdownOption[] = [
    { label: 'New Loan', value: 'newLoan', icon: '' },
    { label: 'Balance Transfer', value: 'balancetransfer', icon: '' },
  ]

  location: string = 'Location';
  selectlocation: DropdownOption[] = [
    { label: 'abc', value: 'educationloan', icon: '' },
  ]

  selectedLabel = '';
  selectedID = '';

  educationdetails: any;


  qualificationId!: string;

  tenthForm!: FormGroup;
  twelfthForm!: FormGroup;

  activeEducation: any;
  otherDocMap: Record<string, { title: string }> = {};
  stepToSubcategory: Record<StepKey, Subcategory> = {
    '10th': '_10TH',
    '12th': '_12TH',
    diploma10: 'DIPLOMA',
    diploma12: 'DIPLOMA',
    ug: 'UNDERGRADUATE',
    pg: 'POSTGRADUATE',
    ielts: 'IELTS_PTE',
    offerletter: 'OFFER_LETTER',
    others12: 'OTHER_AFTER_12',
    othersdiploma: 'OTHER_AFTER_DIPLOMA'
  };

  educationOrder1: Array<'10th' | '12th' | 'diploma10' | 'diploma12' | 'ug' | 'pg' | 'ielts' | 'offerletter' | 'others' | 'others12' | 'othersdiploma'> = ['10th', '12th', 'diploma10', 'diploma12', 'ug', 'pg', 'ielts', 'offerletter', 'others', 'others12', 'othersdiploma'];

  educationOrder: Array<
    '10th' | '12th' | 'diploma10' | 'diploma12' | 'ug' | 'pg' |
    'ielts' | 'offerletter' | 'others' | 'others12' | 'othersdiploma'
  > = [];

  educationForms: any = {};
  basicform!: FormGroup;

  private isEducationFlowInitialized = false;
  uploadedFiles: Record<string, File | null> = {};
  uploadedFiles1: Record<string, File | Record<string, any> | null> = {};
  private educationFormState: Record<string, any> = {};

  uploadeddata: any;

  private hasUnsavedChanges = false;

  private flowQualificationId: string | null = null;

  lastSavedPayload: any = null;

  @Input() savedFileMeta: Record<string, any> = {};

  //save exit 
  private educationSectionKeyMap: Record<string, string> = {
    '10th': 'BATCH_UPLOAD_10',
    '12th': 'BATCH_UPLOAD_12',

    diploma10: 'BATCH_UPLOAD_DIPLOMA',
    diploma12: 'BATCH_UPLOAD_DIPLOMA',

    ug: 'BATCH_UPLOAD_UNDERGRADUATE',
    pg: 'BATCH_UPLOAD_POSTGRADUATE',

    ielts: 'BATCH_UPLOAD_IELTS_PTE',
    offerletter: 'BATCH_UPLOAD_OFFER_LETTER',

    others12: 'BATCH_UPLOAD_12',
    othersdiploma: 'BATCH_UPLOAD_DIPLOMA'
  };
  //draft
  private readonly educationDraftGetRequests = [
    {
      step: '10th',
      sectionKey: 'BATCH_UPLOAD_10',
      category: 'EDUCATION',
      subcategory: '_10TH',
      documentType: 'MARKSHEET'
    },
    {
      step: '12th',
      sectionKey: 'BATCH_UPLOAD_12',
      category: 'EDUCATION',
      subcategory: '_12TH',
      documentType: 'MARKSHEET'
    },
    {
      step: 'diploma10',
      sectionKey: 'BATCH_UPLOAD_DIPLOMA',
      category: 'EDUCATION',
      subcategory: 'DIPLOMA',
      documentType: 'MARKSHEET'
    },
    {
      step: 'ug',
      sectionKey: 'BATCH_UPLOAD_UNDERGRADUATE',
      category: 'EDUCATION',
      subcategory: 'UNDERGRADUATE',
      documentType: 'MARKSHEET'
    },
    {
      step: 'pg',
      sectionKey: 'BATCH_UPLOAD_POSTGRADUATE',
      category: 'EDUCATION',
      subcategory: 'POSTGRADUATE',
      documentType: 'MARKSHEET'
    },
    {
      step: 'ielts',
      sectionKey: 'BATCH_UPLOAD_IELTS_PTE',
      category: 'EDUCATION',
      subcategory: 'IELTS_PTE',
      documentType: 'UPLOAD_CERTIFICATE'
    },
    {
      step: 'offerletter',
      sectionKey: 'BATCH_UPLOAD_OFFER_LETTER',
      category: 'EDUCATION',
      subcategory: 'OFFER_LETTER',
      documentType: 'UPLOAD_CERTIFICATE'
    }
  ];


  instituteOptions: { label: string; value: string }[] = [];
  cityOptions: { label: string; value: string }[] = [];
private summaryEducationLoaded = false;
  //edit from summary
  isFromSummary = false;
  isViewMode = false;
  isEditMode = false;
  originalFormValue: any = null;

  editSuccess: any = false;
  description1 = `Great ! Your Education Info Details\n Uploaded Successfully.`;

  private originalStepState: {
    step: StepKey | null;
    formValue: any;
    uploadedFiles: Record<string, any>;
    savedFileMeta: Record<string, any>;
    otherDocMap: Record<string, any>;
  } = {
      step: null,
      formValue: null,
      uploadedFiles: {},
      savedFileMeta: {},
      otherDocMap: {}
    };
  private persistedEducationSteps: Partial<Record<StepKey, boolean>> = {};


  isDataLoading = true;
loadError = '';
private forceNextApiForDraft = false;
  constructor(private fb: FormBuilder, private stepperService: Loanstepperservice, private cd: ChangeDetectorRef, private formSvc: Loanformservice, private msgBox: Msgboxservice,
    private route: ActivatedRoute, private router: Router, private msgbox: Msgboxservice, public main: Main, private storageservice: Storage) { }
  async ngOnInit(): Promise<void> {

 this.isDataLoading = true;
   this.loadError = '';
     try {
    let Allids = this.stepperService.getLoanId();

    this.applicantId = Allids[0];
    this.applicationId = Allids[1];

    //1.create forms for all education types
    this.educationForms = {
      '10th': this.createForm(),
      '12th': this.createForm(),
      diploma10: this.createForm(),
      diploma12: this.createForm(),
      ug: this.createForm(),
      pg: this.createForm(),
      ielts: this.createIeltsForm(),
      offerletter: this.fb.group({
        offerLetter: [null, Validators.required]
      }),
      others12: this.createForm(),
      othersdiploma: this.createForm()
    }
    await this.loadEducationFromSummary();

    combineLatest([
      this.formSvc.getInstitutesCached(),
      this.formSvc.getAllCities()
    ]).subscribe(([inst, citiesRes]: any) => {
      this.instituteOptions = inst || [];

      const list = citiesRes.data ?? citiesRes;
      // this.cityOptions = list.map((c: any) => ({
      //   value: c.id,
      //   label: c.name
      // }));

      this.cityOptions = list.map((c: any) => ({
  value: c.id || c.cityId || c.locationId || c.value,
  label: c.name || c.cityName || c.locationName || c.label
})).filter((x: any) => x.value && x.label);

      // optional, if you still use these elsewhere
      this.selectlocation = [...this.cityOptions];


      // re-normalize existing saved state to IDs after options load
      Object.keys(this.educationFormState || {}).forEach((stepKey) => {
        const stepState = this.educationFormState[stepKey];
        if (!stepState) return;

        this.educationFormState[stepKey] = {
          ...stepState,
          institutename: (stepState.institutename),
          location: this.resolveLocationId(stepState.location),
        };
      });

      if (this.activeEducation) {
        this.restoreFormState(this.activeEducation as StepKey);
        this.cd.detectChanges();
      }

    });



    //  2. QUERY PARAMS
    this.route.queryParams.subscribe(params => {
      this.applySummaryMode(params);
      if (params['qualificationlabel']) {

        const step = params['qualificationlabel'] as StepKey;

        this.activeEducation = step;

        // this.restoreEducationStateFromLocalStorage();
        setTimeout(async () => {

          await this.hydrateEducationStep(step);



          // ✅ keep currently active step enabled/disabled correctly
          if (this.isEditMode) {
            this.educationForms[step]?.enable({ emitEvent: false });
          } else if (this.isViewMode) {
            this.educationForms[step]?.disable({ emitEvent: false });
          }
          this.cd.detectChanges();
        }, 200);



        //   build submenu only when flow qualificationId changes
        const qid = params['qualificationId'];
        if (qid && qid !== this.flowQualificationId) {
          this.flowQualificationId = qid;
          this.educationOrder = [];
          this.formSvc.getselectedEducation(qid).subscribe((res: any) => {
            this.educationdetails = res.data ?? res;

            //   ONLY ONCE per flow
            this.stepperService.setEducationSubSteps(this.educationdetails);

            const orderFromApi = this.educationdetails
              .map((d: any) => this.normalizeQualification(d.qualificationName))
              .filter((x: StepKey | string) => !!x);

            this.educationOrder = [...new Set([...orderFromApi, 'ielts', 'offerletter'])] as Array<'10th' | '12th' | 'diploma10' | 'diploma12' | 'ug' | 'pg' | 'ielts' | 'offerletter' | 'others' | 'others12' | 'othersdiploma'>;

            this.syncPersistedStepsWithCurrentOrder();
            this.isEducationFlowInitialized = true;
            // this.saveEducationStateToLocalStorage();
            // this.restoreEducationStateFromLocalStorage();

            setTimeout(() => {
              this.restoreFormState(step);

              if (this.isEditMode) {
                this.educationForms[step]?.enable({ emitEvent: false });
              } else if (this.isViewMode) {
                this.educationForms[step]?.disable({ emitEvent: false });
              }
              this.cd.detectChanges();
            }, 200);

          });
        }

      }

    });

    // 3.
    Object.keys(this.educationForms).forEach(step => {
      const form = this.educationForms[step] as FormGroup;

      form.valueChanges.subscribe(() => {
        if (this.activeEducation === step) {
          const raw = form.getRawValue();

          this.hasUnsavedChanges = true;

         

          this.educationFormState[step] = {
            ...raw,

            instituteId: raw.instituteId || this.educationFormState[step]?.instituteId || '',
            instituteName: raw.instituteName || this.educationFormState[step]?.instituteName || raw.institutename || '',
            institutename: raw.institutename || this.educationFormState[step]?.instituteName || '',

            institutetitle: raw.institutetitle || '',
           location:this.resolveLocationId(raw.location) || raw.location || this.educationFormState[step]?.location || '',
            otherLocation: raw.otherLocation || '',

            passingyear: this.normalizeDropdownValue(raw.passingyear),
          };
          this.stepperService.setEducationStepData(
            step,
            this.educationFormState[step]
          );

          // this.saveEducationStateToLocalStorage();
        }
      });
    });




    this.getEducationdetails();

    if (this.selectedLabel.includes('postgraduate') || this.selectedLabel.includes('pg')) {
      this.group.get('institutename')?.clearValidators();
      this.group.get('passingyear')?.clearValidators();
      this.group.get('per_cgpa')?.clearValidators();
      this.group.get('location')?.clearValidators();
      this.group.get('otherLocation')?.clearValidators();

      this.group.get('institutename')?.updateValueAndValidity();
      this.group.get('passingyear')?.updateValueAndValidity();
      this.group.get('per_cgpa')?.updateValueAndValidity();
      this.group.get('location')?.updateValueAndValidity();
      this.group.get('otherLocation')?.updateValueAndValidity();
    }

      } catch (error) {
    console.error(
      'Failed to initialize education page',
      error
    );

    this.loadError =
      'Unable to load education details. Please try again.';
  } finally {
    this.isDataLoading = false;

    this.applyEducationFormMode();

    this.cd.detectChanges();
  }


  }
//load data
  private applyEducationFormMode(): void {
  Object.values(
    this.educationForms || {}
  ).forEach((form: any) => {
    if (!(form instanceof FormGroup)) {
      return;
    }

    if (this.isViewMode && !this.isEditMode) {
      form.disable({
        emitEvent: false
      });
    } else {
      form.enable({
        emitEvent: false
      });
    }
  });
}

  //check which data to display priority wise
  private async hydrateEducationStep(step: StepKey): Promise<void> {
    if (!step) return;
this.isDataLoading = true;
  try {
    // 1. local restore
    // this.restoreEducationStateFromLocalStorage();

    // 2. summary for completed sections
    await this.loadEducationFromSummary();

    // 3. current step draft should override summary
    await this.loadSavedEducationInfoFromApi(step);

    // 4. restore form UI
    this.restoreFormState(step);
    } catch (error) {
    console.error(
      `Failed to hydrate education step: ${step}`,
      error
    );
  } finally {
    this.isDataLoading = false;
    this.applyEducationFormMode();
    this.cd.detectChanges();
  }
 
  }

  toggle(index: number) {
    if (this.openIndex.includes(index)) {
      this.openIndex = this.openIndex.filter(i => i !== index);
    } else {
      this.openIndex.push(index);
    }
    this.cd.detectChanges();
  }


  onEducationSelect(value: any) {
    this.activeEducation = this.normalizeQualification(value.label.toLowerCase());
  }

  createForm(): FormGroup {
    return this.fb.group({

      instituteId: [''], instituteName: [''],
      institutename: ['', Validators.required],
      institutetitle: ['', [Validators.minLength(2), Validators.maxLength(100)]],
      passingyear: ['', Validators.required],
      per_cgpa: ['', [Validators.required, this.percentageOrCgpaValidator()]],
      location: ['', Validators.required],
      otherLocation: ['', [Validators.minLength(2), Validators.maxLength(100)]],
      marksheet: [null],
      lc: [null],

      // score: ['', [ this.ieltsScoreValidator()]],
    });
  }
  createIeltsForm(): FormGroup {
    return this.fb.group({
      score: ['', [Validators.required, this.ieltsScoreValidator()]],
    });
  }

  percentageOrCgpaValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;


      if (value === null || value === undefined || value === '') {
        return null;
      }

      const num = Number(value);
      if (isNaN(num)) {
        return { invalidPerCgpa: true };
      }

      const valueStr = value.toString();

      const isPercentage =
        num >= 35 &&
        num <= 100 &&
        /^\d+(\.\d{1,2})?$/.test(valueStr);

      const isCgpa =
        num >= 4 &&
        num <= 10 &&
        /^\d+(\.\d{1})?$/.test(valueStr);

      return isPercentage || isCgpa
        ? null
        : { invalidPerCgpa: true };
    };
  }
  ieltsScoreValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (value === null || value === undefined || value === '') {
        return null;
      }

      const num = Number(value);
      if (isNaN(num)) {
        return { invalidIeltsScore: true };
      }

      const valueStr = value.toString();

      //  4.0–9.0
      const isValid =
        num >= 4.0 &&
        num <= 9.0 &&
        /^\d+(\.\d{1})?$/.test(valueStr);

      return isValid ? null : { invalidIeltsScore: true };


    };
  }

  submit() {

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



  Selectededucation(values: string | string[]) {
    const ids = Array.isArray(values) ? values : [values];

    const selected = this.seleactqualification.filter(s =>
      ids.includes(s.value)
    );

    this.selectedLabel = selected.map(s => s.label).join(', ');
    this.selectedID = selected.map(s => s.value).join(', ');

    this.formSvc.getselectedEducation(this.selectedID).subscribe((res: any) => {
      this.educationdetails = res.data ?? res;

      this.stepperService.setEducationSubSteps(this.educationdetails);




    });
  }

  isOtherSelected(fd: AbstractControl): boolean {
    const selectedId = fd.get('qualification')?.value;
    const found = this.seleactqualification.find(b => b.value === selectedId);
    return found?.label === 'Other';
  }


  normalizeQualification(name: string): string {
    const lower = name.toLowerCase();

    // School
    if (lower === '10th') return '10th';
    if (lower === '12th') return '12th';

    // Diploma
    if (lower.includes('diploma') && lower.includes('10')) return 'diploma10';
    if (lower.includes('diploma') && lower.includes('12')) return 'diploma12';


    // Others (must come BEFORE generic "other")
    if (lower.includes('others') && lower.includes('after 12th')) return 'others12';
    if (lower.includes('others') && lower.includes('diploma')) return 'othersdiploma';


    //PG
    if (lower.includes('postgraduate') || lower.includes('pg') || lower.includes('master')) return 'pg';

    // UG 
    if (lower.includes('undergraduate') || lower.includes('ug') || lower.includes('bachelor')) return 'ug';

    if (lower.includes('ielts') || lower.includes('pte')) return 'ielts';
    if (lower.includes('offer')) return 'offerletter';
    if (lower.includes('other')) return 'others';


    return 'others';


  }

  getMarksheetCount(step: StepKey): number {
    if (step === 'diploma10' || step === 'diploma12') return 3; // example
    if (step === 'ug') return 4;   // example
    if (step === 'pg' || step === 'others12' || step === 'othersdiploma') return 2;   // example
    return 0;
  }
  normalizeDocType(doc: string): DocType {
    if (doc === 'SCHOOL_LEAVING_CERT') {
      return 'lc';
    }
    if (doc === 'MARKSHEET') {
      return 'marksheet';
    }
    return doc as DocType;
  }



  requiredDocs(step: StepKey): RequiredDoc[] {
    //  PG → No documents required
    // if (step === 'pg') return [];

    //  UG → 2 marksheets + LC
    if (step === 'ug') {
      return [
        { doc: 'marksheet', apiType: 'MARKSHEET', index: 0, title: 'Marksheet 1' },
        { doc: 'marksheet', apiType: 'MARKSHEET', index: 1, title: 'Marksheet 2' },
        { doc: 'lc', apiType: 'SCHOOL_LEAVING_CERT', title: 'LC' }
      ];
    }

    //  10th, 12th, Diploma, Others → 1 marksheet + LC
    return [
      { doc: 'marksheet', apiType: 'MARKSHEET', index: 0, title: 'Marksheet' },
      { doc: 'lc', apiType: 'SCHOOL_LEAVING_CERT', title: 'LC' }
    ];
  }

  buildKey(step: StepKey, doc: DocType, index?: number) {
    return index !== undefined ? `${step}_${doc}_${index}` : `${step}_${doc}`;
  }

  onSectionFileChange(step: StepKey, doc: DocType, index: number | undefined, result: UploadResult) {
    if (!result?.file) return;
    this.hasUnsavedChanges = true;
    const doc1 = this.normalizeDocType(doc);

    const key = this.buildKey(step, doc1, index ?? 0);
    this.uploadedFiles[key] = result?.file ?? null;
    this.uploadedFiles = { ...this.uploadedFiles };

    this.saveCurrentFormState();
    // this.saveEducationStateToLocalStorage();

    this.cd.detectChanges();
  }


  onFileSelectedFromSection(e: {
    step: StepKey;
    control: 'marksheet' | 'lc' | 'other';
    index?: number;
    file: File | null;
    gropudata?: { title?: string };
  }) {
    const fg = this.educationForms[e.step] as FormGroup;

    fg?.get(e.control)?.setValue(e.file);
    fg?.get(e.control)?.markAsTouched();
    fg?.get(e.control)?.updateValueAndValidity();

    this.hasUnsavedChanges = true;

    // ✅ handle OTHER separately
    if (e.control === 'other') {
      const otherKey = `${e.step}_other_${e.index}`;

      if (e.file === null) {
        delete this.otherDocMap[otherKey];
        delete this.uploadedFiles[otherKey];
        delete this.savedFileMeta[otherKey];
      } else {
        this.otherDocMap[otherKey] = {
          title: e.gropudata?.title ?? ''
        };
        this.uploadedFiles[otherKey] = e.file;
      }

      this.otherDocMap = { ...this.otherDocMap };
      this.uploadedFiles = { ...this.uploadedFiles };
      this.savedFileMeta = { ...this.savedFileMeta };

      this.saveCurrentFormState();
      // this.saveEducationStateToLocalStorage();
      this.cd.detectChanges();
      return;
    }

    // ✅ normal docs
    const normalizedDoc = this.normalizeDocType(e.control);
    const idx = e.control === 'marksheet' ? (e.index ?? 0) : undefined;
    const key = this.buildKey(e.step, normalizedDoc, idx);

    this.uploadedFiles[key] = e.file;
    this.uploadedFiles = { ...this.uploadedFiles };

    this.saveCurrentFormState();
    // this.saveEducationStateToLocalStorage();
    this.cd.detectChanges();
  }


  getFile(step: StepKey, doc: DocType, index?: number) {
    return this.getStoredFileMeta(step, doc, index);
  }


  //resotre form data
  restoreFormState(step: StepKey) {
    const form = this.educationForms[step];
    const saved = this.educationFormState[step] || this.stepperService.getEducationStepData(step);;
    console.log("restoreFormState---saved----", saved)
    if (!form || !saved) return;


    form.patchValue({
      ...saved,
      instituteId: (saved?.instituteId),
      institutename: saved?.instituteName || saved?.institutename || '',
        instituteName: saved?.instituteName || saved?.institutename || '',
      institutetitle: saved?.institutetitle || saved?.otherInstituteName || saved?.title || '',
      location: this.getOptionValue(this.cityOptions, saved?.location),
      otherLocation: saved?.otherLocation || saved?.otherLocationName || '',
      passingyear: this.normalizeDropdownValue(saved?.passingyear),
    }, { emitEvent: false });



    setTimeout(() => {
      this.cd.detectChanges();
    });

    form.markAsDirty();
    form.markAsPristine();
    form.updateValueAndValidity({ emitEvent: false });

  }
  //on institute value changes
  onInstituteChanged(event: { id: string; name: string }) {
    const step = this.activeEducation as StepKey;
    const form = this.educationForms[step] as FormGroup;

    if (!form) return;

    form.patchValue({
      instituteId: event.id || '',
      instituteName: event.name || '',
      institutename: event.name || ''
    }, { emitEvent: false });

    this.educationFormState[step] = {
      ...(this.educationFormState[step] || {}),
      ...form.getRawValue(),
      instituteId: event.id || '',
      instituteName: event.name || '',
      institutename: event.name || ''
    };

    this.stepperService.setEducationStepData(step, this.educationFormState[step]);
    this.saveEducationStateToLocalStorage();
  }


isOtherInstituteSelected(step: StepKey): boolean {
  const form = this.educationForms[step] as FormGroup;
  if (!form) return false;

  const instituteName = form.get('instituteName')?.value;
  const institutename = form.get('institutename')?.value;

  const selectedOption = this.instituteOptions.find(
    x => x.value === institutename || x.label === institutename
  );

  return (
    instituteName?.toString().trim().toLowerCase() === 'other' ||
    institutename?.toString().trim().toLowerCase() === 'other' ||
    selectedOption?.label?.toString().trim().toLowerCase() === 'other'
  );
}
  getEducationGroup(key: string): FormGroup {
    return this.educationForm.get(key) as FormGroup;
  }
  onFileChange(step: StepKey, doc: DocType, result: UploadResult) {
    if (!result?.file) return;
    this.hasUnsavedChanges = true;
    const normalizedDoc = this.normalizeDocType(doc);
    const index = doc === 'marksheet' ? 0 : undefined;

    const key = this.buildKey(step, normalizedDoc, index);
    this.uploadedFiles[key] = result.file;
    this.uploadedFiles = { ...this.uploadedFiles };
    console.log("this.uploadedFiles--", this.uploadedFiles);

    const fg = this.educationForms[step] as FormGroup;
    fg?.get(doc)?.setValue(result.file);
    fg?.get(doc)?.updateValueAndValidity();
    this.cd.detectChanges();
  }

  buildDocKey(level: EducationType, docType: DocType, index?: number): string {
    // return index ? `${level}_${docType}_${index}` : `${level}_${docType}`;

    return index !== undefined
      ? `${level}_${docType}_${index}`
      : `${level}_${docType}`

  }
  getLocalFileUrl(level: EducationType, docType: DocType, index?: number): string {
    const key = this.buildDocKey(level, docType, index);
    const f = this.uploadedFiles[key] as File | null;
    return f ? URL.createObjectURL(f) : '';
  }


  viewLocal(level: any, docType: DocType, index?: number): void {
    const file: any = this.getStoredFileMeta(
      level as StepKey,
      docType,
      index
    );

    if (!file) return;

    if (file instanceof File) {
      const url = URL.createObjectURL(file);
      window.open(url, '_blank');

      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return;
    }

    const url =
      file.viewUrl ||
      file.fileUrl ||
      file.publicUrl ||
      '';

    if (url) {
      window.open(url, '_blank');
    }
  }

  onFileRemovedFromSection(e: {
    step: StepKey;
    control: 'marksheet' | 'lc' | 'other';
    index?: number;
  }) {

    let key = '';

    if (e.control === 'other') {
      key = `${e.step}_other_${e.index}`;
    } else {

      const normalizedDoc = this.normalizeDocType(e.control);
      const idx = e.control === 'marksheet' ? (e.index ?? 0) : undefined;
      key = this.buildKey(e.step, normalizedDoc, idx);
    }
    // remove from both stores
    delete this.uploadedFiles[key];
    delete this.savedFileMeta[key];

    // if other doc, also clear title map
    if (e.control === 'other') {
      delete this.otherDocMap[key];
    }

    this.uploadedFiles = { ...this.uploadedFiles };
    this.savedFileMeta = { ...this.savedFileMeta };
    this.otherDocMap = { ...this.otherDocMap };

    // clear control
    const fg = this.educationForms[e.step] as FormGroup;
    if (fg?.get(e.control)) {
      fg.get(e.control)?.setValue(null);
      fg.get(e.control)?.markAsDirty();
      fg.get(e.control)?.updateValueAndValidity();
    }

    this.hasUnsavedChanges = true;
    this.saveCurrentFormState();
    this.saveEducationStateToLocalStorage();
    this.cd.detectChanges();
  }
  removeLocal(level: any, docType: DocType, index?: number): void {
    this.msgbox.open({
      title: 'Are you sure want to Remove',
      message: ``,
      showCancel: true,
       okText:'Yes',
      onOk: () => {
        const key = this.buildKey(level as StepKey, this.normalizeDocType(docType), index);

        const deleteDoc =
this.uploadedFiles?.[key] ||
this.savedFileMeta?.[key] ||
null;
        if(deleteDoc?.documentId){
          this.deleteItemArr([deleteDoc?.documentId]);
        }

        delete this.uploadedFiles[key];
        delete this.savedFileMeta[key];

        this.uploadedFiles = { ...this.uploadedFiles };
        this.savedFileMeta = { ...this.savedFileMeta };

        this.saveEducationStateToLocalStorage();
        this.cd.detectChanges();
      }
    });
  }
  deleteItemArr(idArr: any){
    this.formSvc.deleteEducationDoc({
      applicationId: this.applicationId,
      applicantId: this.applicantId,
      documentIds: idArr
    }).subscribe({
      next: (res) => {
        console.log(res);
      },
      error: (error) => {
        console.log(error);
      }
    });
  }
  hasLocalFile(level: any, docType: DocType, index?: number): boolean {
    const file = this.getStoredFileMeta(
      level as StepKey,
      docType,
      index
    );

    return !!file;
  }

  getLocalFileName(level: any, docType: DocType, index?: number,truncate=true): string {
    const file: any = this.getStoredFileMeta(
      level as StepKey,
      docType,
      index
    );

    if (!file) return '';

   
     const fileName =
    file instanceof File
      ? file.name
      : file.fileName || file.name || '';


     if (!truncate || fileName.length <= 30) {
    return fileName;
  }

  return `${fileName.substring(0, 30)}...`;

  }
  private getStoredFileMeta(step: StepKey, docType: DocType, index?: number): any {
    const normalizedDoc = this.normalizeDocType(docType);

    const keyWithIndex = this.buildKey(step, normalizedDoc, index);
    const keyWithoutIndex = this.buildKey(step, normalizedDoc);

    return (
      this.uploadedFiles[keyWithIndex] ||
      this.savedFileMeta[keyWithIndex] ||
      this.uploadedFiles[keyWithoutIndex] ||
      this.savedFileMeta[keyWithoutIndex] ||
      null
    );
  }

  downloadLocal(level: any, docType: DocType, index?: number): void {
    const file: any = this.getStoredFileMeta(
      level as StepKey,
      docType,
      index
    );

    if (!file) return;

    if (file instanceof File) {
      const url = URL.createObjectURL(file);

      const a = document.createElement('a');
      a.href = url;
      a.download = file.name || 'document';
      a.click();

      URL.revokeObjectURL(url);
      return;
    }

    const url =
      file.viewUrl ||
      file.fileUrl ||
      file.publicUrl ||
      '';

    if (!url) return;

    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.download = file.fileName || file.name || 'document';
    a.click();
  }


  viewImage(url: string): void {
    window.open(url, '_blank');
  }

  get educationDetails(): FormArray {
    return this.educationForm.get('educationDetails') as FormArray;
  }

  onMarksheetUpload(event: any, eduIndex: number, semIndex: number) {
    const marksheets = this.educationDetails
      .at(eduIndex)
      .get('marksheets') as FormArray;

    marksheets.at(semIndex).setValue(event.file);
  }
  private getEducationProgressKey(): string {
    return `educationProgress_${this.applicantId}`;
  }

  // back btn functionality

  back() {
    const step = this.activeEducation as StepKey;
    if (this.hasUnsavedChanges) {
      this.msgbox.open({
        type: 'unsaved',
        title: 'Unsaved changes?',
        message:
          `You have unsaved data in this section.<br> Switching sections will cause your changes to be lost.`,
        okText: 'Yes, Discard',
        cancelText: 'Cancel',
        onOk: () => {
          // this.hasUnsavedChanges = false;
          this.clearUnsavedEducationStep(step);
          this.performEducationBack();
        }
      });
      return;
    }

    // this.saveCurrentFormState();
    this.performEducationBack();
  }

  saveCurrentFormState() {
    const step = this.activeEducation as StepKey;
    const form = this.educationForms[step] as FormGroup;

    if (!step || !form) return;

    const raw = form.getRawValue();

    if (!this.hasMeaningfulEducationValue(raw)) {
      return;
    }

    const normalized = {
      ...raw,
      instituteId: raw.instituteId || this.educationFormState[step]?.instituteId || '',
      instituteName: raw.instituteName || this.educationFormState[step]?.instituteName || raw.institutename || '',
      institutename: raw.institutename || this.educationFormState[step]?.instituteName || '',
      institutetitle: raw.institutetitle || '',
      // location: this.resolveLocationId(raw.location),
      location:this.resolveLocationId(raw.location) || raw.location || this.educationFormState[step]?.location || '',
      otherLocation: raw.otherLocation || '',


      passingyear: this.normalizeDropdownValue(raw.passingyear)
    };

    this.educationFormState[step] = normalized;

    this.stepperService.setEducationStepData(step, normalized);
  }
  private performEducationBack1() {

    if (!this.isEducationFlowInitialized) {
      this.stepperService.previous();
      return;
    }

    const index = this.educationOrder.indexOf(this.activeEducation);

    if (index > 0) {
      const prevEducation = this.educationOrder[index - 1];
      this.activeEducation = prevEducation;
      this.restoreFormState(this.activeEducation);
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {
          qualificationId: this.flowQualificationId,
          qualificationlabel: prevEducation
        },
        queryParamsHandling: 'merge'
      });

      return;
    }

    this.router.navigate(['/loanform/educationDetails'], {
      queryParams: {
        applicantId: this.applicantId,
        applicationId: this.applicationId,
        custName: this.custName,
        custARN: this.custARN
      }
    });
  }
  private performEducationBack(): void {
  const currentStep =
    this.activeEducation as StepKey;

  let previousStep: StepKey | null = null;

  // Offer Letter must always go back to IELTS/PTE.
  if (currentStep === 'offerletter') {
    previousStep = 'ielts';
  }

  // IELTS/PTE must go back to the previous education step,
  // normally PG or UG.
  else if (currentStep === 'ielts') {
    const ieltsIndex =
      this.educationOrder.indexOf('ielts');

    if (ieltsIndex > 0) {
      previousStep =
        this.educationOrder[ieltsIndex - 1] as StepKey;
    } else if (
      this.educationOrder.includes('pg')
    ) {
      previousStep = 'pg';
    } else if (
      this.educationOrder.includes('ug')
    ) {
      previousStep = 'ug';
    }
  }

  // Normal education-step navigation.
  else {
    const index =
      this.educationOrder.indexOf(currentStep);

    if (index > 0) {
      previousStep =
        this.educationOrder[index - 1] as StepKey;
    }
  }

  if (previousStep) {
    this.activeEducation = previousStep;

    this.restoreFormState(previousStep);

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        qualificationId:
          this.flowQualificationId,

        qualificationlabel:
          previousStep
      },
      queryParamsHandling: 'merge'
    });

    return;
  }

  // Only the first education step returns to education details.
  this.router.navigate(
    ['/loanform/educationDetails'],
    {
      queryParams: {
        applicantId: this.applicantId,
        applicationId: this.applicationId,
        custName: this.custName,
        custARN: this.custARN
      }
    }
  );
}
  private persistEducationState() {
    sessionStorage.setItem(
      'educationState',
      JSON.stringify({
        forms: this.educationFormState,
        active: this.activeEducation,
        uploadedFiles: Object.keys(this.uploadedFiles).reduce((acc, key) => {
          const f = this.uploadedFiles[key];
          if (f) {
            acc[key] = { name: f.name };
          }
          return acc;
        }, {} as any)
      })
    );
  }

private clearUnsavedEducationStep(step: StepKey): void {
  const form = this.educationForms[step] as FormGroup;
  const prefix = `${step}_`;

  // Reset all form fields for the active education step.
  if (step === 'ielts') {
    form?.reset(
      {
        score: ''
      },
      {
        emitEvent: false
      }
    );
  } else if (step === 'offerletter') {
    form?.reset(
      {
        offerLetter: null
      },
      {
        emitEvent: false
      }
    );
  } else {
    form?.reset(
      {
        instituteId: '',
        instituteName: '',
        institutename: '',
        institutetitle: '',
        passingyear: '',
        per_cgpa: '',
        location: '',
        otherLocation: '',
        marksheet: null,
        lc: null
      },
      {
        emitEvent: false
      }
    );
  }

  // Remove all newly selected files for this step.
  Object.keys(this.uploadedFiles || {})
    .filter(key => key.startsWith(prefix))
    .forEach(key => {
      delete this.uploadedFiles[key];
    });

  // Remove file metadata for an unsaved step.
  if (!this.isStepPersisted(step)) {
    Object.keys(this.savedFileMeta || {})
      .filter(key => key.startsWith(prefix))
      .forEach(key => {
        delete this.savedFileMeta[key];
      });
  }

  // Remove other document rows for this step.
  Object.keys(this.otherDocMap || {})
    .filter(key => key.startsWith(prefix))
    .forEach(key => {
      delete this.otherDocMap[key];
    });

  // Remove current form values from component cache.
  delete this.educationFormState[step];

  // Remove current form values from the stepper service.
  this.stepperService.setEducationStepData(step, null);

  // Remove current step values from local storage.
  const storageKey = this.getEducationStateKey();
  const storedValue = localStorage.getItem(storageKey);

  if (storedValue) {
    try {
      const parsed = JSON.parse(storedValue);

      if (parsed.educationFormState) {
        delete parsed.educationFormState[step];
      }

      if (parsed.uploadedFileMeta) {
        Object.keys(parsed.uploadedFileMeta)
          .filter(key => key.startsWith(prefix))
          .forEach(key => {
            delete parsed.uploadedFileMeta[key];
          });
      }

      if (parsed.otherDocMap) {
        Object.keys(parsed.otherDocMap)
          .filter(key => key.startsWith(prefix))
          .forEach(key => {
            delete parsed.otherDocMap[key];
          });
      }

      localStorage.setItem(
        storageKey,
        JSON.stringify(parsed)
      );
    } catch (error) {
      console.error(
        'Failed to clear discarded education state:',
        error
      );
    }
  }

  this.uploadedFiles = {
    ...this.uploadedFiles
  };

  this.savedFileMeta = {
    ...this.savedFileMeta
  };

  this.otherDocMap = {
    ...this.otherDocMap
  };

  form?.markAsPristine();
  form?.markAsUntouched();
  form?.updateValueAndValidity({
    emitEvent: false
  });

  this.hasUnsavedChanges = false;

  this.cd.detectChanges();
}

  //-----------------disable next btn --------------------

  canProceedToNext(): boolean {
    const step = this.activeEducation as StepKey;
    const form = this.educationForms[step];


    if (!form) return false;

    //  PG → Nothing mandatory
    if (step === 'pg') return true;

    //  IELTS
    if (step === 'ielts') {

      return (
        form.valid &&
        this.hasFileOrSavedMeta(step, 'ielts')
      );

    }

    //  Offer Letter
    if (step === 'offerletter') {

      return this.hasFileOrSavedMeta(step, 'offerletter');
    }

    if (form.invalid) return false;


    const otherDocs = this.getOtherDocumentsForStep(step);


    if (otherDocs.length > 0) {
      const invalid = otherDocs.some(doc => !doc.title || !doc.file);
      if (invalid) return false;
    }

    //  Required documents check
    const reqDocs = this.requiredDocs(step);


    return reqDocs.every(doc =>
      this.hasFileOrSavedMeta(step, doc.doc, doc.index)
    );
  }
  showValidationErrors(step: StepKey): void {
    const form = this.educationForms[step] as FormGroup | undefined;

    if (form) {
      (Object.values(form.controls) as AbstractControl[]).forEach(control => {
        control.markAsTouched();
        control.updateValueAndValidity();
      });
    }

    const missingDocs = this.requiredDocs(step).filter(doc =>
      !this.getFile(step, doc.doc, doc.index)
    );

    let message = 'Please fill all required fields';

    if (missingDocs.length) {
      message += ' and upload required documents.';
    } else {
      message += '.';
    }


  }
  private getOtherDocumentsForStep(step: StepKey) {
    return Object.keys(this.otherDocMap)
      .filter(key => key.startsWith(`${step}_other_`))
      .map(key => ({
        title: this.otherDocMap[key]?.title,
        file: this.uploadedFiles[key] || this.savedFileMeta[key]
      }));
  }
  onOtherDocAdded(rowId: number) {
    const step = this.activeEducation as StepKey;
    const key = `${step}_other_${rowId}`;
    if (this.otherDocMap[key]) return;
    this.otherDocMap[key] = { title: '' };
    this.uploadedFiles[key] = null;
  }
  private ensureOtherDocEntry(step: StepKey, index: number, title: string = 'Other Document') {
    const key = this.buildKey(step, 'other', index);

    if (!this.otherDocMap[key]) {
      this.otherDocMap[key] = { title };
    }

    if (!(key in this.uploadedFiles) && this.savedFileMeta[key]) {
      this.uploadedFiles[key] = this.savedFileMeta[key] as any;
    }
  }
  //check for pg data
  private hasPgData(form: FormGroup, step: StepKey): boolean {

    const hasFormValue = Object.values(form.getRawValue() || {}).some(
      v => v !== null && v !== undefined && v !== ''
    );

    // check uploaded files (required + other)
    const hasFiles =
      this.requiredDocs(step).some(r => this.getFile(step, r.doc, r.index)) ||
      Object.keys(this.uploadedFiles).some(
        key => key.startsWith(`${step}_`) && !!this.uploadedFiles[key]
      );

    return hasFormValue || hasFiles;
  }

  private getEducationStateKey(): string {
    return `educationState_${this.applicantId}`;
  }

  private saveEducationStateToLocalStorage() {
    if (!this.applicantId) return;

    const storageKey = this.getEducationStateKey();

    const oldSaved = localStorage.getItem(storageKey);
    const oldParsed = oldSaved ? JSON.parse(oldSaved) : {};

    const forms: Record<string, any> = {
      ...(oldParsed.educationFormState || {}),
      ...(this.educationFormState || {})
    };

    const activeStep = this.activeEducation as StepKey;

    if (activeStep && this.educationForms[activeStep]) {
      const form = this.educationForms[activeStep] as FormGroup;
      const raw = form.getRawValue();

      const hasValue = this.hasMeaningfulEducationValue(raw);

      // only save current form if it has real values
      if (hasValue) {
        forms[activeStep] = {
          ...forms[activeStep],
          ...raw,
          instituteId: raw.instituteId || this.educationFormState[activeStep]?.instituteId || '',
          instituteName: raw.instituteName || this.educationFormState[activeStep]?.instituteName || raw.institutename || '',
          institutename: raw.institutename || this.educationFormState[activeStep]?.instituteName || '',
          institutetitle: raw.institutetitle || '',
           location: this.resolveLocationId(raw.location) ||  raw.location ||  forms[activeStep]?.location || this.educationFormState[activeStep]?.location || '',
          otherLocation: raw.otherLocation || '',


          passingyear: this.normalizeDropdownValue(raw.passingyear)
        };

        this.educationFormState[activeStep] = forms[activeStep];
      }
    }

    const uploadedFileMeta: Record<string, any> = {
      ...(oldParsed.uploadedFileMeta || {}),
      ...(this.savedFileMeta || {})
    };

    Object.keys(this.uploadedFiles || {}).forEach(key => {
      const file: any = this.uploadedFiles[key];

      // important: only real File should update metadata
      if (file instanceof File) {
        uploadedFileMeta[key] = {
          ...(uploadedFileMeta[key] || {}),
          key,
          fileName: file.name,
          name: file.name,
          uploaded: true
        };
      }
    });

    const payload = {
      activeEducation: activeStep || oldParsed.activeEducation,
      educationFormState: forms,
      uploadedFileMeta,
      otherDocMap: {
        ...(oldParsed.otherDocMap || {}),
        ...(this.otherDocMap || {})
      },
      educationOrder: this.educationOrder?.length
        ? this.educationOrder
        : oldParsed.educationOrder,
      flowQualificationId: this.flowQualificationId || oldParsed.flowQualificationId || null,

      persistedEducationSteps: {
        ...(oldParsed.persistedEducationSteps || {}),
        ...(this.persistedEducationSteps || {})
      }

    };

    localStorage.setItem(storageKey, JSON.stringify(payload));
  }
  private hasMeaningfulEducationValue(raw: any): boolean {
    if (!raw) return false;

    const ignoredKeys = ['marksheet', 'lc', 'offerLetter'];

    return Object.keys(raw).some(key => {
      if (ignoredKeys.includes(key)) return false;

      const value = raw[key];

      return value !== null &&
        value !== undefined &&
        value !== '' &&
        !(Array.isArray(value) && value.length === 0);
    });
  }

  private restoreEducationStateFromLocalStorage() {
    if (!this.applicantId) return;
    const savedFileMeta: Record<string, any> = {};
    const saved = localStorage.getItem(this.getEducationStateKey());
    if (!saved) return;

    const parsed = JSON.parse(saved);

    // this.educationFormState = parsed.educationFormState || {};
    // this.otherDocMap = parsed.otherDocMap || {};

    this.flowQualificationId = this.flowQualificationId || parsed.flowQualificationId || null;

    this.educationFormState = {
      ...(this.educationFormState || {}),
      ...(parsed.educationFormState || {})
    };

    this.otherDocMap = {
      ...(this.otherDocMap || {}),
      ...(parsed.otherDocMap || {})
    };
    this.persistedEducationSteps = {
      ...(parsed.persistedEducationSteps || {}),
      ...(this.persistedEducationSteps || {})
    };
    if (!this.educationOrder || !this.educationOrder.length) {
      this.educationOrder = parsed.educationOrder || [];
    }    // this.activeEducation = parsed.activeEducation || this.activeEducation;
    this.activeEducation = this.activeEducation || parsed.activeEducation;

    Object.keys(this.educationFormState).forEach(step => {
      const form = this.educationForms[step];
      const savedValue = this.educationFormState[step];

      if (!form || !savedValue) return;

      form.patchValue({
        ...savedValue,
        instituteId: savedValue?.instituteId || '',
        institutename: savedValue?.institutename || savedValue?.instituteName || '',
        institutetitle: savedValue?.institutetitle || savedValue?.otherInstituteName || savedValue?.title || '',
        location: this.getOptionValue(this.cityOptions, savedValue?.location),
        otherLocation: savedValue?.otherLocation || savedValue?.otherLocationName || '',
        passingyear: this.normalizeDropdownValue(savedValue?.passingyear),
      }, { emitEvent: false });


    });


    if (parsed.uploadedFileMeta) {
      // this.savedFileMeta = {
      //   ...(this.savedFileMeta || {}),
      //   ...(parsed.uploadedFileMeta || {})
      // };
      this.savedFileMeta = {
        ...(parsed.uploadedFileMeta || {}),
        ...(this.savedFileMeta || {})
      };

    }

    if (this.activeEducation) {

      setTimeout(() => {
        this.restoreFormState(this.activeEducation);
        this.cd.detectChanges();
      }, 200);

    }

    this.cd.detectChanges();
  }
  private getOptionValue(
    list: { label: string; value: string }[],
    rawValue: any
  ): string {
    const value = this.normalizeDropdownValue(rawValue);
    if (!value) return '';

    // already ID
    const matchByValue = list.find(x => x.value === value);
    if (matchByValue) return matchByValue.value;

    // label -> convert to ID
    const matchByLabel = list.find(
      x =>
        x.label?.toString().trim().toLowerCase() ===
        value.toString().trim().toLowerCase()
    );
    if (matchByLabel) return matchByLabel.value;

    return value; // fallback
  }


  private async loadSavedEducationInfoFromApi(step: StepKey,forceNextApi: boolean = true) {
    if (!this.applicationId || !this.applicantId || !step) return;

    const savedData = await this.getSavedSectionEducationInfo();

    if (!savedData) return;

    console.log('Saved education data from API:', savedData);

    this.patchSavedEducationData(step, savedData);

    const sectionKey = this.getCurrentEducationSectionKey();
    const localKey = `educationInfoData_${this.applicantId}_${sectionKey}`;
    localStorage.setItem(localKey, JSON.stringify(savedData));
    this.saveEducationStateToLocalStorage();
    if(forceNextApi){
      this.forceNextApiForDraft = true;
    }
    this.cd.detectChanges();

  }
  private patchSavedEducationData(step: StepKey, savedData: any) {
    this.clearOtherDocsForStep(step);
    const form = this.educationForms[step] as FormGroup;
    if (!form) return;

    const data = savedData?.jsonData || savedData;
    const prev = this.educationFormState[step] || {};

    const instituteId =
      data.instituteId ||
      data.institutionId ||
      prev.instituteId ||
      '';

    const instituteName =
      data.instituteName ||
      data.institutename ||
      prev.instituteName ||
      prev.institutename ||
      '';
      const apiLocation =  data.locationId ||  data.location ||  data.locationName ||  prev.location ||  '';

    if (!data) return;

    if (step === 'ielts') {
      form.patchValue({
        score: data.score || ''
      }, { emitEvent: false });
    } else if (step === 'offerletter') {
      // no normal form fields except file display
    } else {


      form.patchValue({
        instituteId,
        instituteName,
        institutename: instituteName,


        institutetitle: data.title || data.otherInstituteName || data.institutetitle || '',
        passingyear: this.normalizeDropdownValue(data.passingyear || data.yearOfPassing),
        per_cgpa: data.percentageCgpa || data.per_cgpa || '',

        location: this.getOptionValue(
          this.cityOptions,
         apiLocation
        ),
        otherLocation: data.otherLocation || data.otherLocationName || ''
      }, { emitEvent: false });
    }

    // this.educationFormState[step] = form.getRawValue();
    this.educationFormState[step] = {
      ...form.getRawValue(),
      instituteId,
      instituteName,
      institutename: instituteName,

       location:
    form.get('location')?.value ||
    apiLocation ||
    prev.location ||
    '',

  otherLocation:
    form.get('otherLocation')?.value ||
    data.otherLocationName ||
    data.otherLocation ||
    prev.otherLocation ||
    ''
    
    };

    if (data.otherDocMap) {
      this.otherDocMap = {
        ...this.otherDocMap,
        ...data.otherDocMap
      };
    }



    const uploadedDocuments =
      data.uploadedDocuments ||
      data.documents ||
      [];

    const uploadedFiles =
      data.uploadedFiles ||
      data.files ||
      [];

    const documentsToRestore =
      Array.isArray(uploadedDocuments) && uploadedDocuments.length > 0
        ? uploadedDocuments
        : uploadedFiles;

    let marksheetCounter = 0;
    let otherCounter = 0;

    documentsToRestore.forEach((doc: any, index: number) => {
      const fallbackFile = uploadedFiles[index] || {};

      const type = doc.type || fallbackFile.type;
      if (!type) return;

      // let key = '';

      const key = this.getFileKeyFromApiType(
        step,
        type,
        marksheetCounter,
        otherCounter
      );

      if (type === 'MARKSHEET') {
        // key = this.buildKey(step, 'marksheet', marksheetCounter);
        marksheetCounter++;
      } else if (
        type === 'SCHOOL_LEAVING_CERT' ||
        type === 'LEAVING_CERTIFICATE'
      ) {
        // key = this.buildKey(step, 'lc');
      } else if (type === 'OTHER') {
        // key = this.buildKey(step, 'other', otherCounter);
        this.ensureOtherDocEntry(
          step,
          otherCounter,
          doc.title || fallbackFile.title || 'Other Document'
        );
        otherCounter++;

        this.otherDocMap[key] = {
          title: doc.title || fallbackFile.title || 'Other Document'
        };
      } else if (
        type === 'UPLOAD_CERTIFICATE' ||
        type === 'IELTS'
      ) {
        if (step === 'ielts') {
          // key = this.buildKey(step, 'ielts');
        } else if (step === 'offerletter') {
          // key = this.buildKey(step, 'offerletter');
        }
      } else if (type === 'OFFERLETTER') {
        // key = this.buildKey(step, 'offerletter');
      }

      if (!key) return;

      const meta = {
        key,
        name:
          doc.fileName ||
          fallbackFile.fileName ||
          doc.name ||
          fallbackFile.name ||
          '',
        fileName:
          doc.fileName ||
          fallbackFile.fileName ||
          doc.name ||
          fallbackFile.name ||
          '',
        title:
          doc.title ||
          fallbackFile.title ||
          type,
        type,
        viewUrl:
          doc.viewUrl ||
          fallbackFile.viewUrl ||
          '',
        fileUrl:
          doc.fileUrl ||
          fallbackFile.fileUrl ||
          '',
        publicUrl:
          doc.publicUrl ||
          fallbackFile.publicUrl ||
          '',
        objectKey:
          doc.objectKey ||
          fallbackFile.objectKey ||
          '',
        documentId:
          doc.documentId ||
          fallbackFile.documentId,
        uploaded: true
      };

      this.savedFileMeta[key] = meta;
      this.uploadedFiles[key] = meta as any;
    });

    this.savedFileMeta = { ...this.savedFileMeta };
    this.uploadedFiles = { ...this.uploadedFiles };
    this.otherDocMap = { ...this.otherDocMap };

    this.stepperService.setEducationStepData(step, form.getRawValue());

    const hasData =
      !!data &&
      (
        this.hasMeaningfulEducationValue(form.getRawValue()) ||
        documentsToRestore.length > 0
      );

    if (hasData) {
      this.markStepPersisted(step);
    }

    this.cd.detectChanges();
  }
  private hasFileOrSavedMeta(step: StepKey, doc: DocType, index?: number): boolean {
    const key = this.buildKey(step, this.normalizeDocType(doc), index);

    return this.uploadedFiles[key] instanceof File || !!this.savedFileMeta[key];
  }
  private normalizeDropdownValue(value: any): any {
    if (Array.isArray(value)) {
      return value.length ? value[0] : '';
    }

    return value ?? '';
  }

  private getCurrentEducationSectionKey(): string {
    const step = this.activeEducation as StepKey;
    return this.educationSectionKeyMap[step] || 'BATCH_UPLOAD_10';
  }
  buildEducationInfoPayload() {

    const step = this.activeEducation as StepKey;
    const form = this.educationForms[step] as FormGroup;

    if (!form) return {};

    const raw = form.getRawValue();
    const sectionKey = this.getCurrentEducationSectionKey();
    const filesMeta: any[] = [];

    Object.keys(this.uploadedFiles)
      .filter(key => key.startsWith(`${step}_`))
      .forEach(key => {
        const file: any = this.uploadedFiles[key];

        if (!file) return;

        filesMeta.push({
          key,
          type: this.getEducationDocumentType(key),
          fileName: file.name || file.fileName || '',
          title: this.otherDocMap[key]?.title || '',
          isUploadedFile: !(file instanceof File)
        });
      });

    return {

      applicationId: this.applicationId,
      applicantId: this.applicantId,
      sectionKey,
      step,
      category: 'EDUCATION',
      subcategory: this.stepToSubcategory[step],
      institutename: (raw.institutename),
      location: this.resolveLocationId(raw.location),
      passingyear: this.normalizeDropdownValue(raw.passingyear),
      files: filesMeta,
      otherDocMap: this.otherDocMap
    };
  }
  private getFileKeyFromApiType(
    step: StepKey,
    type: string,
    marksheetCounter: number = 0,
    index: number = 0
  ): string {

    if (type === 'MARKSHEET') {
      return this.buildKey(step, 'marksheet', marksheetCounter);
    }

    if (
      type === 'SCHOOL_LEAVING_CERT' ||
      type === 'LEAVING_CERTIFICATE'
    ) {
      return this.buildKey(step, 'lc');
    }

    if (type === 'OTHER') {
      // return `${step}_other_${index + 1}`;
      return this.buildKey(step, 'other', index);
    }

    if (
      type === 'UPLOAD_CERTIFICATE' ||
      type === 'IELTS'
    ) {
      if (step === 'ielts') {
        return this.buildKey(step, 'ielts');
      }

      if (step === 'offerletter') {
        return this.buildKey(step, 'offerletter');
      }

      return this.buildKey(step, 'lc');
    }

    if (type === 'OFFERLETTER') {
      return this.buildKey(step, 'offerletter');
    }

    return '';
  }
  getEducationDocumentType(key: string): string {
    const lowerKey = key.toLowerCase();

    if (lowerKey.includes('marksheet')) {
      return 'MARKSHEET';
    }

    if (

      lowerKey.includes('_lc') ||
      lowerKey.endsWith('lc') ||
      lowerKey.includes('school_leaving') ||
      lowerKey.includes('leaving') ||
      lowerKey.includes('schoolleaving')
    ) {
      return 'SCHOOL_LEAVING_CERT';
    }

    if (lowerKey.includes('ielts')) {
      return 'UPLOAD_CERTIFICATE';
    }

    if (lowerKey.includes('offerletter')) {
      return 'UPLOAD_CERTIFICATE';
    }


    if (lowerKey.includes('other')) {
      return 'OTHER';
    }

    return 'OTHER';
  }

  private getEducationSectionKeyForStep(step: StepKey): string {
    return this.educationSectionKeyMap[step] || 'BATCH_UPLOAD_10';
  }

  getSavedSectionEducationInfo(): Promise<any> {
    const sectionkey = this.getCurrentEducationSectionKey();

    return new Promise((resolve) => {
      this.formSvc.getSavedData(this.applicationId, this.applicantId, sectionkey).pipe()

        .subscribe({
          next: (res) => {

            console.log(res)
            if (res.status === "success") {
              resolve(res.data.data);

            }
            else {
              resolve(null);
            }
          }, error: () => resolve(null)
        });
    });
  }

  getSavedEducationDrafts(): Promise<any[]> {
    const requests: any[] = [];

    const draftRequests = [
      {
        step: '10th',
        sectionKey: 'BATCH_UPLOAD_10',
        category: 'EDUCATION',
        subcategory: '_10TH',
        documentType: 'MARKSHEET'
      },
      {
        step: '12th',
        sectionKey: 'BATCH_UPLOAD_12',
        category: 'EDUCATION',
        subcategory: '_12TH',
        documentType: 'MARKSHEET'
      },
      {
        step: 'diploma10',
        sectionKey: 'BATCH_UPLOAD_DIPLOMA',
        category: 'EDUCATION',
        subcategory: 'DIPLOMA',
        documentType: 'MARKSHEET'
      },
      {
        step: 'ug',
        sectionKey: 'BATCH_UPLOAD_UNDERGRADUATE',
        category: 'EDUCATION',
        subcategory: 'UNDERGRADUATE',
        documentType: 'MARKSHEET'
      },
      {
        step: 'pg',
        sectionKey: 'BATCH_UPLOAD_POSTGRADUATE',
        category: 'EDUCATION',
        subcategory: 'POSTGRADUATE',
        documentType: 'MARKSHEET'
      },
      {
        step: 'ielts',
        sectionKey: 'BATCH_UPLOAD_IELTS_PTE',
        category: 'EDUCATION',
        subcategory: 'IELTS_PTE',
        documentType: 'UPLOAD_CERTIFICATE'
      },
      {
        step: 'offerletter',
        sectionKey: 'BATCH_UPLOAD_OFFER_LETTER',
        category: 'EDUCATION',
        subcategory: 'OFFER_LETTER',
        documentType: 'UPLOAD_CERTIFICATE'
      }
    ];

    draftRequests.forEach(section => {
      requests.push(
        this.formSvc.getUploadedData(
          this.applicationId,
          this.applicantId,
          section.sectionKey,
          section.category,
          section.subcategory,
          section.documentType
        ).pipe(
          map((res: any) => {
            return {
              section: { ...section },
              data: res?.status === 'success'
                ? (res.data?.data || res.data || null)
                : null
            };
          }),
          catchError(err => {
            console.error(
              'Education draft get failed for:',
              section.sectionKey,
              section.subcategory,
              section.documentType,
              err
            );

            return of({
              section: { ...section },
              data: null
            });
          })
        )
      );
    });

    return new Promise(resolve => {
      forkJoin(requests).subscribe({
        next: (responses: any[]) => resolve(responses),
        error: () => resolve([])
      });
    });
  }

  private restoreEducationDraftData(savedResponses: any[]): void {
    if (!savedResponses?.length) return;

    savedResponses.forEach(item => {
      const section = item?.section;
      const draft = item?.data;

      if (!section || !draft) return;

      let draftData =
        draft?.jsonData ||
        draft?.data ||
        draft;

      // If jsonData comes as string from API
      if (typeof draftData === 'string') {
        try {
          draftData = JSON.parse(draftData);
        } catch (e) {
          console.error('Invalid draft jsonData:', draftData);
          return;
        }
      }

      if (!draftData) return;

      const step = section.step || this.getStepFromSection(
        section.sectionKey,
        section.subcategory
      );

      if (!step) return;

      const form = this.educationForms[step] as FormGroup;

      // -----------------------------
      // 1. PATCH FORM DATA
      // -----------------------------
      if (form) {
        if (step === 'ielts') {
          form.patchValue({
            score:
              draftData.score ||
              draftData?.jsonData?.score ||
              ''
          }, { emitEvent: false });
        } else if (step !== 'offerletter') {
          form.patchValue({

            institutename: this.getOptionValue(
              this.instituteOptions,
              draftData.instituteId ||
              draftData.instituteName ||
              draftData.institutename ||
              draftData.institutionId ||
              ''
            ),
            institutetitle:
              draftData.otherInstituteName ||
              draftData.title ||
              draftData.institutetitle ||
              '',


            passingyear: this.normalizeDropdownValue(
              draftData.yearOfPassing ||
              draftData.passingyear ||
              ''
            ),

            per_cgpa:
              draftData.percentageCgpa ||
              draftData.per_cgpa ||
              '',


            location: this.getOptionValue(
              this.cityOptions,
              draftData.locationId ||
              draftData.locationName ||
              draftData.location ||
              ''
            ),
            otherLocation:
              draftData.otherLocationName ||
              draftData.otherLocation ||
              ''

          }, { emitEvent: false });
        }

        this.educationFormState[step] = form.getRawValue();

        this.stepperService.setEducationStepData(
          step,
          this.educationFormState[step]
        );
      }

      // -----------------------------
      // 2. PATCH FILE DATA
      // -----------------------------
      const uploadedDocuments =
        draftData.uploadedDocuments ||
        draftData.documents ||
        [];

      const uploadedFiles =
        draftData.uploadedFiles ||
        draftData.files ||
        [];

      // uploadedDocuments has actual viewUrl, so use it first
      const documentsToRestore =
        Array.isArray(uploadedDocuments) && uploadedDocuments.length > 0
          ? uploadedDocuments
          : uploadedFiles;

      let marksheetCounter = 0;
      let otherCounter = 0;

      documentsToRestore.forEach((doc: any, index: number) => {
        const fallbackFile = uploadedFiles[index] || {};

        const type =
          doc.type ||
          fallbackFile.type ||
          section.documentType ||
          draftData.documentType ||
          draftData.type;

        if (!type) return;

        // let key = '';

        const key = this.getFileKeyFromApiType(
          step,
          type,
          marksheetCounter,
          otherCounter
        );
        if (!key) return;
        if (type === 'MARKSHEET') {
          // key = this.buildKey(step, 'marksheet', marksheetCounter);
          marksheetCounter++;
        } else if (
          type === 'SCHOOL_LEAVING_CERT' ||
          type === 'LEAVING_CERTIFICATE'
        ) {
          // key = this.buildKey(step, 'lc');
        } else if (type === 'OTHER') {
          // key = `${step}_other_${otherCounter}`;
          // key = this.buildKey(step, 'other', otherCounter);

          this.ensureOtherDocEntry(
            step,
            otherCounter,
            doc.title || fallbackFile.title || 'Other Document'
          );

          this.otherDocMap[key] = {
            title:
              doc.title ||
              fallbackFile.title ||
              'Other Document'
          };
          otherCounter++;
        }
        else if (
          type === 'UPLOAD_CERTIFICATE' ||
          type === 'IELTS'
        ) {
          if (step === 'ielts') {
            // key = this.buildKey(step, 'ielts');
          } else if (step === 'offerletter') {
            // key = this.buildKey(step, 'offerletter');
          }
        } else if (type === 'OFFERLETTER') {
          // key = this.buildKey(step, 'offerletter');
        }

        if (!key) return;

        const meta = {
          key,

          name:
            doc.fileName ||
            fallbackFile.fileName ||
            doc.name ||
            fallbackFile.name ||
            '',

          fileName:
            doc.fileName ||
            fallbackFile.fileName ||
            doc.name ||
            fallbackFile.name ||
            '',

          title:
            doc.title ||
            fallbackFile.title ||
            type,

          type,

          viewUrl:
            doc.viewUrl ||
            fallbackFile.viewUrl ||
            '',

          fileUrl:
            doc.fileUrl ||
            fallbackFile.fileUrl ||
            '',

          publicUrl:
            doc.publicUrl ||
            fallbackFile.publicUrl ||
            '',

          objectKey:
            doc.objectKey ||
            fallbackFile.objectKey ||
            '',

          documentId:
            doc.documentId ||
            fallbackFile.documentId,

          uploaded: true
        };

        this.savedFileMeta[key] = meta;

        // Optional but useful if child upload component only checks uploadedFiles
        this.uploadedFiles[key] = meta as any;
      });
    });

    // -----------------------------
    // 3. FINAL REFRESH
    // -----------------------------
    this.savedFileMeta = { ...this.savedFileMeta };
    this.otherDocMap = { ...this.otherDocMap };

    this.saveEducationStateToLocalStorage();

    Object.keys(this.educationFormState).forEach(step => {
      this.stepperService.setEducationStepData(
        step,
        this.educationFormState[step]
      );
    });

    if (this.activeEducation) {
      this.restoreFormState(this.activeEducation);
    }


    this.cd.detectChanges();
    console.log('savedFileMeta after restore:', this.savedFileMeta);
  }
  //patch from summary 
  private async loadEducationFromSummary(): Promise<void> {
    if (!this.applicationId || this.summaryEducationLoaded) return;

    try {
      const res: any = await firstValueFrom(
        this.formSvc.getSummary(this.applicationId)
      );

      if (!res || res.status !== 'success') return;


      const applicants = res?.data?.applicants || [];

      if (!Array.isArray(applicants) || !applicants.length) return;

      //    for main applicant page
      const selectedApplicant =
        applicants.find((a: any) => a.applicantType === 'PRIMARY') || null;

      const summaryEducation =
        selectedApplicant?.educationDetails || null;


      if (!summaryEducation) return;

      this.patchEducationFromSummary(summaryEducation);
       this.summaryEducationLoaded = true;
    } catch (error) {
      console.error('Failed to load education summary:', error);
    }
  }
  private patchEducationFromSummary(summaryEducation: any): void {
    if (!summaryEducation) return;

    const mapping: Array<{ summaryKey: string; step: StepKey }> = [
      { summaryKey: 'tenth', step: '10th' },
      { summaryKey: 'twelfth', step: '12th' },

      {
        summaryKey: 'diploma',
        step: this.educationOrder.includes('diploma10') ? 'diploma10' : 'diploma12'
      },
      { summaryKey: 'bachelors', step: 'ug' },
      { summaryKey: 'postgraduate', step: 'pg' },
      { summaryKey: 'others', step: 'others12' },  // othersdiploma
      { summaryKey: 'ieltsPte', step: 'ielts' },
      { summaryKey: 'offerLetter', step: 'offerletter' },
    ];

    mapping.forEach(({ summaryKey, step }) => {
      this.clearOtherDocsForStep(step);
      const docs = summaryEducation?.[summaryKey];

      if (!Array.isArray(docs) || !docs.length) return;

      const form = this.educationForms[step] as FormGroup;
      if (!form) return;

      // -----------------------------
      // 1. Patch form fields from first row
      // -----------------------------
      const first = docs[0];

      if (step === 'ielts') {
        form.patchValue({
          score: first.score || ''
        }, { emitEvent: false });
        const hasData =
          !!docs?.length &&
          (
            this.hasMeaningfulEducationValue(form.getRawValue()) ||
            docs.length > 0
          );

        if (hasData) {
          this.markStepPersisted(step);
        }
      } else {

        //  this.formSvc.instituteCache.push({
        //   label: first.instituteName,
        //   value: first.instituteId
        // });

        // this.instituteOptions = this.formSvc.instituteCache;

        form.patchValue({
          instituteId: first.instituteId,
          institutename: first.instituteName || '',
           instituteName: first.instituteName || '',
          institutetitle: first.otherInstituteName || '',
          passingyear: this.normalizeDropdownValue(
            first.yearOfPassing || ''
          ),
          per_cgpa: first.percentageOrCgpa || '',
          location: this.getOptionValue(
            this.cityOptions,
            first.locationId || first.location || ''
          ),
          otherLocation: first.otherLocationName || ''
        }, { emitEvent: false });
        const hasData =
          !!docs?.length &&
          (
            this.hasMeaningfulEducationValue(form.getRawValue()) ||
            docs.length > 0
          );

        if (hasData) {
          this.markStepPersisted(step);
        }
      }

      // this.educationFormState[step] = form.getRawValue();
      this.educationFormState[step] = {
        ...form.getRawValue(),
        instituteId: first.instituteId || '',
        instituteName: first.instituteName || '',
         institutename: first.instituteName || '',
           institutetitle: first.otherInstituteName || ''
      };

      this.stepperService.setEducationStepData(step, this.educationFormState[step]);

      // -----------------------------
      // 2. Patch files into savedFileMeta
      // -----------------------------
      let marksheetCounter = 0;
      let otherCounter = 0;

      docs.forEach((doc: any) => {
        const type = doc.type;
        if (!type) return;

        let key = '';

        if (type === 'MARKSHEET') {
          key = this.buildKey(step, 'marksheet', marksheetCounter);
          marksheetCounter++;
        } else if (
          type === 'SCHOOL_LEAVING_CERT' ||
          type === 'LEAVING_CERTIFICATE'
        ) {
          key = this.buildKey(step, 'lc');
        } else if (type === 'OTHER') {
          key = this.buildKey(step, 'other', otherCounter);

          this.ensureOtherDocEntry(
            step,
            otherCounter,
            doc.title || 'Other Document'
          );

          this.otherDocMap[key] = {
            title: doc.title || 'Other Document'
          };

          otherCounter++;
        } else if (type === 'UPLOAD_CERTIFICATE') {
          if (step === 'ielts') {
            key = this.buildKey(step, 'ielts');
          }
          else if (step === 'offerletter') {
            key = this.buildKey(step, 'offerletter');
          }
        }

        if (!key) return;

        this.savedFileMeta[key] = {
          key,
          name: doc.fileName || doc.marksheetUrl || '',
          fileName: doc.fileName || doc.marksheetUrl || '',
          title: doc.title || type,
          type: doc.type || '',
          viewUrl: doc.viewUrl || '',
          fileUrl: doc.viewUrl || '',
          publicUrl: doc.viewUrl || '',
          objectKey: doc.objectKey || '',
          documentId: doc.documentId || '',
          uploaded: true
        };

        // so child component can use uploadedFiles OR savedFileMeta
        this.uploadedFiles[key] = this.savedFileMeta[key] as any;
      });
    });

    // -----------------------------
    // 3. Offer letter (special case)
    // -----------------------------
    if (summaryEducation?.offerLetter) {
      const key = this.buildKey('offerletter', 'offerletter');

      this.savedFileMeta[key] = {
        key,
        name: summaryEducation.offerLetter,
        fileName: summaryEducation.offerLetter[0].fileName,
        title: 'Offer Letter',
        type: 'UPLOAD_CERTIFICATE',
        viewUrl: summaryEducation.offerLetter[0].viewUrl, // no viewUrl available in summary
        fileUrl: '',
        publicUrl: '',
        objectKey: summaryEducation.offerLetter[0].objectKey,
        documentId: summaryEducation.offerLetter[0].documentId,
        uploaded: true
      };

      this.uploadedFiles[key] = this.savedFileMeta[key] as any;

      this.markStepPersisted('offerletter');

    }

    this.savedFileMeta = { ...this.savedFileMeta };
    this.uploadedFiles = { ...this.uploadedFiles };
    this.otherDocMap = { ...this.otherDocMap };

    this.saveEducationStateToLocalStorage();
    this.cd.detectChanges();
  }

  private getOptionLabel(
    list: { label: string; value: string }[],
    rawValue: any,
    fallbackLabel: string = ''
  ): string {
    const value = this.normalizeDropdownValue(rawValue);
    if (!value && !fallbackLabel) return '';

    const matchByValue = list.find(x => x.value === value);
    if (matchByValue) return matchByValue.label;

    const matchByLabel = list.find(
      x =>
        x.label?.toString().trim().toLowerCase() ===
        value?.toString().trim().toLowerCase()
    );
    if (matchByLabel) return matchByLabel.label;

    return fallbackLabel || value || '';
  }
  private clearOtherDocsForStep(step: StepKey): void {
    const prefix = `${step}_`;

    Object.keys(this.otherDocMap || {})
      .filter(key => key.startsWith(prefix))
      .forEach(key => delete this.otherDocMap[key]);

    Object.keys(this.savedFileMeta || {})
      .filter(key => key.startsWith(prefix))
      .forEach(key => delete this.savedFileMeta[key]);

    Object.keys(this.uploadedFiles || {})
      .filter(key => key.startsWith(prefix))
      .forEach(key => delete this.uploadedFiles[key]);

    this.otherDocMap = { ...this.otherDocMap };
    this.savedFileMeta = { ...this.savedFileMeta };
    this.uploadedFiles = { ...this.uploadedFiles };
  }

  private getStepFromSection(sectionKey: string, subcategory?: string): StepKey | null {
    if (sectionKey === 'BATCH_UPLOAD_10') return '10th';
    if (sectionKey === 'BATCH_UPLOAD_12') {
      if (subcategory === 'OTHER_AFTER_12') return 'others12';
      return '12th';
    }

    if (sectionKey === 'BATCH_UPLOAD_DIPLOMA') {
      if (subcategory === 'OTHER_AFTER_DIPLOMA') return 'othersdiploma';

      // choose based on active flow/order if both exist
      if (this.educationOrder.includes('diploma10')) return 'diploma10';
      return 'diploma12';
    }

    if (sectionKey === 'BATCH_UPLOAD_UNDERGRADUATE') return 'ug';
    if (sectionKey === 'BATCH_UPLOAD_POSTGRADUATE') return 'pg';
    if (sectionKey === 'BATCH_UPLOAD_IELTS_PTE') return 'ielts';
    if (sectionKey === 'BATCH_UPLOAD_OFFER_LETTER') return 'offerletter';

    return null;
  }
  saveExit() {
    this.msgBox.open({
      title: 'Are you sure you want to exit?',
      message: ``,
      showCancel: true, okText:'Yes',
      onOk: async () => {

        const step = this.activeEducation as StepKey;
        const form = this.educationForms[step] as FormGroup;

        if (!form) return;

        this.saveCurrentFormState();
        this.saveEducationStateToLocalStorage();

        const sectionKey = this.getCurrentEducationSectionKey()
        const payload = this.buildEducationInfoPayload();

        const localKey = `educationInfoData_${this.applicantId}_${sectionKey}`;
        localStorage.setItem(localKey, JSON.stringify(payload));

        const fd = await this.buildEducationSaveExitFormData(sectionKey);
        // fd.append('sectionKey', sectionKey);

        this.formSvc.saveandExit(fd).subscribe({
          next: async (res: any) => {

            console.log('Education save and exit success:', res);

            if (res?.data) {
              this.restoreEducationDraftData([
                {
                  section: {
                    sectionKey,
                    category: 'EDUCATION',
                    subcategory: this.stepToSubcategory[step]
                  },
                  data: res.data
                }
              ]);
            }


            // summary first for completed steps
            await this.loadEducationFromSummary();

            // current draft step overrides summary
            await this.loadSavedEducationInfoFromApi(step);


            this.hasUnsavedChanges = false;

          },
          error: (err: any) => {
            console.error('Education save and exit failed:', err);
            alert('Failed to save education details.');
          }
        });

        this.router.navigate(['/admin/losoperation']);
      }
    });
  }


  private async buildEducationSaveExitFormData(sectionKey: string): Promise<FormData> {
    const step = this.activeEducation as StepKey;
    const form = this.educationForms[step] as FormGroup;
    const fd = new FormData();

    const subcategory = this.stepToSubcategory[step];

    fd.append('sectionKey', sectionKey);
    fd.append('applicationId', this.applicationId);
    fd.append('applicantId', this.applicantId);
    fd.append('category', 'EDUCATION');
    fd.append('subcategory', subcategory);

    let fileIndex = 0;

    // IELTS
    if (step === 'ielts') {
      fd.append('score', form.get('score')?.value || '');

      fileIndex = await this.appendEducationFileForSaveExit(
        fd,
        fileIndex,
        step,
        'ielts',
        'UPLOAD_CERTIFICATE'
      );

      return fd;
    }

    // Offer Letter
    if (step === 'offerletter') {
      fileIndex = await this.appendEducationFileForSaveExit(
        fd,
        fileIndex,
        step,
        'offerletter',
        'UPLOAD_CERTIFICATE'
      );

      return fd;
    }

    const raw = form.getRawValue();

    const instituteId =
      raw.instituteId ||
      this.educationFormState[step]?.instituteId ||
      '';

    fd.append('instituteId', instituteId);
    fd.append('otherInstituteName', form.get('institutetitle')?.value || '');
    fd.append('yearOfPassing', form.get('passingyear')?.value || '');
    fd.append('percentageCgpa', form.get('per_cgpa')?.value || '');
    fd.append('locationId', this.resolveLocationId(form.get('location')?.value) || '');
    fd.append('otherLocationName', form.get('otherLocation')?.value || '');

    // ✅ Required docs: Marksheet + LC
    const reqDocs = this.requiredDocs(step);

    for (const r of reqDocs) {
      fileIndex = await this.appendEducationFileForSaveExit(
        fd,
        fileIndex,
        step,
        r.doc,
        r.apiType,
        r.index
      );
    }

    // ✅ Extra marksheets from savedFileMeta/uploadedFiles
    const requiredMarksheetIndexes = new Set(
      this.requiredDocs(step)
        .filter(d => d.doc === 'marksheet')
        .map(d => d.index ?? -1)
    );

    const maxAllowedMarksheetCount = this.getMarksheetCount(step);

    const extraMarksheetKeys = Array.from(
      new Set([
        ...Object.keys(this.savedFileMeta || {}),
        ...Object.keys(this.uploadedFiles || {})
      ])
    )
      .filter(key => key.startsWith(`${step}_marksheet_`))
      .map(key => {
        const match = key.match(/marksheet_(\d+)/);
        const index = match ? Number(match[1]) : -1;
        return { key, index };
      })
      .filter(({ index }) =>
        index >= 0 &&
        index < maxAllowedMarksheetCount &&
        !requiredMarksheetIndexes.has(index)
      )
      .sort((a, b) => a.index - b.index);

    for (const { index } of extraMarksheetKeys) {
      fileIndex = await this.appendEducationFileForSaveExit(
        fd,
        fileIndex,
        step,
        'marksheet',
        'MARKSHEET',
        index
      );
    }

    // ✅ Other docs
    for (const key of Object.keys({
      ...this.uploadedFiles,
      ...this.savedFileMeta
    }).filter(k => k.startsWith(`${step}_other_`))) {

      const match = key.match(/_other_(\d+)$/);
      const index = match ? Number(match[1]) : undefined;

      const title =
        this.otherDocMap[key]?.title ||
        (this.savedFileMeta[key] as any)?.title ||
        (this.uploadedFiles[key] as any)?.title ||
        'Other Document';

      fileIndex = await this.appendEducationFileForSaveExit(
        fd,
        fileIndex,
        step,
        'other',
        'OTHER',
        index,
        title
      );
    }

    return fd;
  }
  private async appendEducationFileForSaveExit(
    fd: FormData,
    fileIndex: number,
    step: StepKey,
    doc: DocType,
    apiType: string,
    index?: number,
    title?: string
  ): Promise<number> {
    const key = this.buildKey(step, doc, index);
    const fileOrMeta: any =
      this.uploadedFiles[key] ||
      this.savedFileMeta[key];

    if (!fileOrMeta) return fileIndex;

    fd.append(`files[${fileIndex}].type`, apiType);

    if (title) {
      fd.append(`files[${fileIndex}].title`, title);
    }

    if (fileOrMeta instanceof File) {
      fd.append(`files[${fileIndex}].file`, fileOrMeta, fileOrMeta.name);
      return fileIndex + 1;
    }

    const viewUrl =
      fileOrMeta.viewUrl ||
      fileOrMeta.fileUrl ||
      fileOrMeta.publicUrl ||
      '';

    if (viewUrl) {
      const fileFromUrl = await this.urlToFile(
        viewUrl,
        fileOrMeta.fileName || fileOrMeta.name || 'document'
      );

      fd.append(`files[${fileIndex}].file`, fileFromUrl, fileFromUrl.name);
      return fileIndex + 1;
    }

    return fileIndex;
  }
  //------------convert viewurl to binary file
  async urlToFile(url: string, filename: string, fallbackType: string = 'application/octet-stream') {
    const res = await fetch(url);
    const blob = await res.blob();

    return new File([blob], filename || 'document', {
      type: blob.type || fallbackType
    });
  }

  async next() {
    console.log("next---");

    const step = this.activeEducation as StepKey;
    const form = this.educationForms[step];
    console.log("form---", form);


    if (step === 'pg' && !this.hasPgData(form, step)) {
      const idx = this.educationOrder.indexOf(step);
      const nextEducation = this.educationOrder[idx + 1];

      this.activeEducation = nextEducation;
      this.restoreFormState(this.activeEducation);

      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {
          qualificationId: this.flowQualificationId,
          qualificationlabel: nextEducation
        },
        queryParamsHandling: 'merge'
      });

      return;
    }



    if (!this.canProceedToNext()) {
      this.showValidationErrors(step);
      return;
    }
    if (!this.shouldCallNextApi(step)) {
      this.saveCurrentFormState();
      this.persistEducationState();
      const rawStep = this.educationForms[step].getRawValue();

      this.stepperService.setEducationStepData(step, {
        ...rawStep,
        institutename: rawStep.institutename,
        instituteId: rawStep.instituteId || this.educationFormState[step]?.instituteId || '',
        instituteName: rawStep.instituteName || this.educationFormState[step]?.instituteName || rawStep.institutename || '',

        location: this.resolveLocationId(rawStep.location),
        institutetitle: rawStep.institutetitle || '',
        otherLocation: rawStep.otherLocation || ''
      });


      this.stepperService.markEducationSectionComplete(step);

      const index = this.educationOrder.indexOf(step);
      for (let i = 0; i <= index; i++) {
        const prevStep = this.educationOrder[i];
        this.stepperService.markEducationSectionComplete(prevStep);
      }

      this.moveToNextEducationStep(step);
      return;
    }
    this.saveCurrentFormState();
    this.persistEducationState();

    this.stepperService.setEducationStepData(
      step,
      // this.educationFormState[step]
      // this.educationForms[step].getRawValue()

      {
        ...this.educationForms[step].getRawValue(),
        institutename: (this.educationForms[step].get('institutename')?.value),
        location: this.resolveLocationId(this.educationForms[step].get('location')?.value),
        institutetitle: this.educationForms[step].get('institutetitle')?.value || '',
        otherLocation: this.educationForms[step].get('otherLocation')?.value || ''
      });

    this.stepperService.markEducationSectionComplete(step);

    //   ALSO mark ALL previous steps as completed
    const index = this.educationOrder.indexOf(step);

    for (let i = 0; i <= index; i++) {
      const prevStep = this.educationOrder[i];
      this.stepperService.markEducationSectionComplete(prevStep);
    }

    const fd = new FormData();
    const subcategory = this.stepToSubcategory[step];

    fd.append('category', 'EDUCATION');
    fd.append('subcategory', subcategory);
    fd.append('applicantId', this.applicantId);

    if (step === 'ielts') {

      const score = form.get('score')?.value;

      const key = this.buildKey(step, 'ielts');
      const file = this.uploadedFiles[key];



      if (!score || !this.hasFileOrSavedMeta(step, 'ielts')) {
        alert('Please enter score and upload IELTS certificate.');
        return;
      }


      fd.append('score', score);
      if (file instanceof File) {
        fd.append('files[0].type', 'UPLOAD_CERTIFICATE');
        fd.append('files[0].file', file);

      } else if (this.savedFileMeta[key]) {
        console.log('Already saved file, skipping upload:', key);

        const meta = this.savedFileMeta[key];


        if (meta.viewUrl) {
          const fileFromUrl = await this.urlToFile(
            meta.viewUrl,
            meta.fileName || 'file.jpg'
          );
          fd.append(`files[0].type`, meta.type);
          fd.append(`files[0].file`, fileFromUrl, fileFromUrl.name);

        } else {
          console.warn('No viewUrl to convert file:', key);
        }

      }


    }

    else if (step === 'offerletter') {
      const key = this.buildKey(step, 'offerletter');
      const file = this.uploadedFiles[key];

      if (!this.hasFileOrSavedMeta(step, 'offerletter')) {
        alert('Please upload offer letter.');
        return;
      }

      if (file instanceof File) {
        fd.append('files[0].type', 'UPLOAD_CERTIFICATE');
        fd.append('files[0].file', file);
      } else if (this.savedFileMeta[key]) {
        console.log('Already saved file, skipping upload:', key);

        const meta = this.savedFileMeta[key];


        if (meta.viewUrl) {
          const fileFromUrl = await this.urlToFile(
            meta.viewUrl,
            meta.fileName || 'file.jpg'
          );
          fd.append(`files[0].type`, meta.type);
          fd.append(`files[0].file`, fileFromUrl, fileFromUrl.name);

        } else {
          console.warn('No viewUrl to convert file:', key);
        }

      }
    }
    else {
      const reqDocs = this.requiredDocs(step);
      console.log('reqdoc-', reqDocs);

      if (step !== 'pg') {
        const missingFiles = reqDocs.filter(r => !this.getFile(step, r.doc, r.index));
        if (missingFiles.length > 0) {
          alert('Please upload all required documents.');
          return;
        }
      }


      let fileIndex = 0;

      for (const r of reqDocs) {
        const key = this.buildKey(step, r.doc as DocType, r.index);
        const file = this.uploadedFiles[key];

        if (file instanceof File) {
          fd.append(`files[${fileIndex}].type`, r.apiType);
          fd.append(`files[${fileIndex}].file`, file, file.name);
          fileIndex++;
          continue;
        }

        const meta = this.savedFileMeta[key];
        if (meta) {
          console.log('Restoring saved file for upload:', key, meta);

          if (meta.viewUrl) {
            const fileFromUrl = await this.urlToFile(
              meta.viewUrl,
              meta.fileName || 'file.jpg',
              meta.mimeType || meta.contentType || 'image/jpeg'
            );

            fd.append(`files[${fileIndex}].type`, r.apiType);
            fd.append(`files[${fileIndex}].file`, fileFromUrl, fileFromUrl.name);
            fileIndex++;
          } else {
            console.warn('No viewUrl to convert file:', key, meta);
          }
        }
      }


      //  ADD EXTRA MARKSHEETS (after required ones)
      const requiredMarksheetIndexes = new Set(
        this.requiredDocs(step)
          .filter(d => d.doc === 'marksheet')
          .map(d => d.index ?? -1)
      );

      const maxAllowedMarksheetCount = this.getMarksheetCount(step);

      const extraMarksheetKeys = Array.from(
        new Set([
          ...Object.keys(this.savedFileMeta || {}),
          ...Object.keys(this.uploadedFiles || {})
        ])
      )
        .filter(key => key.startsWith(`${step}_marksheet_`))
        .map(key => {
          const match = key.match(/marksheet_(\d+)/);
          const index = match ? Number(match[1]) : -1;
          return { key, index };
        })
        .filter(({ index }) =>
          index >= 0 &&
          index < maxAllowedMarksheetCount &&
          !requiredMarksheetIndexes.has(index)
        )
        .sort((a, b) => a.index - b.index);

      for (const { key } of extraMarksheetKeys) {
        const file =
          this.uploadedFiles[key] instanceof File
            ? this.uploadedFiles[key]
            : null;


        if (file instanceof File) {
          fd.append(`files[${fileIndex}].type`, 'MARKSHEET');
          fd.append(`files[${fileIndex}].file`, file, file.name);
          fileIndex++;
        } else if (this.savedFileMeta[key]?.viewUrl) {
          const saved = this.savedFileMeta[key];

          const fileFromUrl = await this.urlToFile(
            saved.viewUrl,
            saved.fileName || 'file.jpg',
            saved.mimeType || saved.contentType || 'image/jpeg'
          );

          fd.append(`files[${fileIndex}].type`, 'MARKSHEET');
          fd.append(`files[${fileIndex}].file`, fileFromUrl, fileFromUrl.name);
          fileIndex++;
        }
      }


      Object.keys(this.uploadedFiles)
        .filter(key => key.startsWith(`${step}_other_`))


      for (const key of Object.keys(this.uploadedFiles)
        .filter(key => key.startsWith(`${step}_other_`))) {

        const file = this.uploadedFiles[key];
        if (!file) continue;

        const meta = this.otherDocMap[key];

        if (file instanceof File) {
          fd.append(`files[${fileIndex}].type`, 'OTHER');
          fd.append(`files[${fileIndex}].title`, meta?.title || 'Other Document');
          fd.append(`files[${fileIndex}].file`, file);
        } else if (this.savedFileMeta[key]?.viewUrl) {
          const saved = this.savedFileMeta[key];

          const fileFromUrl = await this.urlToFile(
            saved.viewUrl,
            saved.fileName
          );

          fd.append(`files[${fileIndex}].type`, 'OTHER');
          fd.append(`files[${fileIndex}].title`, meta?.title || 'Other Document');
          fd.append(`files[${fileIndex}].file`, fileFromUrl);
        }

        fileIndex++;
      }
      const instituteId1 = this.resolveInstituteId(form.get('institutename')?.value);
      const locationId = this.resolveLocationId(form.get('location')?.value);

      const raw = form.getRawValue();

      const instituteId =
        raw.instituteId ||
        this.educationFormState[step]?.instituteId ||
        '';



      // fd.append('instituteId', form.get('institutename')?.value);
      fd.append('instituteId', instituteId || '');
      fd.append('otherInstituteName', form.get('institutetitle')?.value);
      fd.append('yearOfPassing', form.get('passingyear')?.value);
      fd.append('percentageCgpa', form.get('per_cgpa')?.value);
      // fd.append('locationId', form.get('location')?.value);

      fd.append('locationId', locationId || '');

      fd.append('otherLocationName', form.get('otherLocation')?.value);

    }



    for (const [key, value] of fd.entries()) {
      if (value instanceof File) {
        console.log(key, 'FILE =>', {
          name: value.name,
          type: value.type,
          size: value.size
        });
      } else {
        console.log(key, '=>', value);
      }
    }

    this.formSvc.uploadIncome(fd, this.applicationId, false).subscribe({
      next: async (res) => {

        this.markStepPersisted(step);
        this.hasUnsavedChanges = false;

        this.saveCurrentFormState();
        this.saveEducationStateToLocalStorage();


        //  refresh current step data from saved section API
        await this.loadSavedEducationInfoFromApi(step,false);

        //  then refresh summary (if summary now contains latest saved docs)
        await this.loadEducationFromSummary();

        this.uploadedFiles = { ...this.uploadedFiles };
        this.cd.detectChanges();
        const idx = this.educationOrder.indexOf(step);

        if (idx === -1) {
          console.error('Invalid education step:', step);
          return;
        }

        if (idx < this.educationOrder.length - 1) {
          const nextEducation = this.educationOrder[idx + 1];
          this.activeEducation = nextEducation;
          this.restoreFormState(this.activeEducation);
          // this.router.navigate(['/loanform/educationinfo'], {

          this.router.navigate([], {
            relativeTo: this.route,

            queryParams: {
              qualificationId: this.flowQualificationId,
              qualificationlabel: nextEducation,

            },
            queryParamsHandling: 'merge'
          });

        }
        else {
          sessionStorage.removeItem(
'educationFlowQualificationId'
);
          this.stepperService.markStepCompleted('educationDetails');
          this.stepperService.next();
        }
      },
      error: (err) => {
        console.error("Upload Failed", err);
        alert("Failed to upload documents.");
      }
    });
  }

  //move to next if nothing changes
  private moveToNextEducationStep(step: StepKey): void {
    const idx = this.educationOrder.indexOf(step);

    if (idx === -1) {
      console.error('Invalid education step:', step);
      return;
    }

    if (idx < this.educationOrder.length - 1) {
      const nextEducation = this.educationOrder[idx + 1];
      this.activeEducation = nextEducation;
      this.restoreFormState(this.activeEducation);

      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {
          qualificationId: this.flowQualificationId,
          qualificationlabel: nextEducation,
        },
        queryParamsHandling: 'merge'
      });
    } else {
  
      this.stepperService.markStepCompleted('educationDetails');
      this.stepperService.next();
    }
  }

  //select location and institute id from dropdown

  private resolveInstituteId(rawValue: any): string {
    return this.resolveOptionValue(this.instituteOptions, rawValue);
  }

  private resolveLocationId(rawValue: any): string {
    return this.resolveOptionValue(this.cityOptions, rawValue);
  }


  private resolveOptionValue(list: any[], rawValue: any): string {
  const normalized = this.normalizeDropdownValue(rawValue);

  if (!normalized) return '';

  // Important for SIT/server slow API case
  if (!list || !list.length) {
    return normalized;
  }

  // already ID
  const existsAsValue = list.some((x: any) => x.value === normalized);
  if (existsAsValue) return normalized;

  // label to ID
  const valueByLabel = this.getValueByLabel(list, normalized);

  // Important: do not return blank if label not found
  return valueByLabel || normalized;
}
  private getValueByLabel(list: any[], label: string) {
    if (!label || !list?.length) return '';

    return list.find((x: any) =>
      x.label?.toString().trim().toLowerCase() ===
      label.toString().trim().toLowerCase()
    )?.value || '';
  }
  //edit from summary enable and disbale
  private applySummaryMode(params: any): void {
    this.isFromSummary =
      params['fromSummary'] === true ||
      params['fromSummary'] === 'true' ||
      this.formSvc.isSummaryEditFlow();

    this.isEditMode = this.isFromSummary && params['mode'] === 'edit';
    this.isViewMode = this.isFromSummary && !this.isEditMode;

    // keep sidemenu clickable in summary flow
    if (this.isFromSummary) {
      this.stepperService.unlockSummaryEducationSubsteps();
    }
this.disableAllEducationForms()
    const form = this.getCurrentForm();
    if (!form) return;

     if (this.isEditMode) {
    form.enable({
      emitEvent: false
    });
  } else {
    form.disable({
      emitEvent: false
    });
  }

  this.cd.detectChanges();

    // if (this.isEditMode) {
    //   this.enableAllEducationForms();
    // } else if (this.isViewMode) {
    //   this.disableAllEducationForms();
    // }
  }

  enableForm() {
    const step = this.getCurrentStep();
    const form = this.getCurrentForm();

    const stepKeys = this.getStepKeys(step);

    const uploadedFiles: Record<string, any> = {};
    const savedFileMeta: Record<string, any> = {};
    const otherDocMap: Record<string, any> = {};

    stepKeys.forEach(key => {
      if (key in this.uploadedFiles) uploadedFiles[key] = this.uploadedFiles[key];
      if (key in this.savedFileMeta) savedFileMeta[key] = this.savedFileMeta[key];
      if (key in this.otherDocMap) otherDocMap[key] = this.otherDocMap[key];
    });

    this.originalStepState = {
      step,
      formValue: form.getRawValue(),
      uploadedFiles: { ...uploadedFiles },
      savedFileMeta: { ...savedFileMeta },
      otherDocMap: { ...otherDocMap }
    };

    this.isViewMode = false;
    this.isEditMode = true;
    form.enable({ emitEvent: false });

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        fromSummary: true,
        mode: 'edit'
      },
      queryParamsHandling: 'merge'
    });

    this.cd.detectChanges();
  }

  private disableAllEducationForms(): void {
    Object.keys(this.educationForms).forEach((key) => {
      const form = this.educationForms[key];
      if (form) {
        form.disable({ emitEvent: false });
      }
    });
  }

  private enableAllEducationForms(): void {
    Object.keys(this.educationForms).forEach((key) => {
      const form = this.educationForms[key];
      if (form) {
        form.enable({ emitEvent: false });
      }
    });
  }

 
  onEditClick(): void {
  if (this.isDataLoading) {
    return;
  }

  const step =
    this.activeEducation as StepKey;

  const currentForm =
    this.educationForms[step] as FormGroup;

  if (!currentForm) {
    return;
  }

  this.originalFormValue =
    currentForm.getRawValue();

  this.isViewMode = false;
  this.isEditMode = true;
  this.isFromSummary = true;

  currentForm.enable({
    emitEvent: false
  });

  this.stepperService
    .unlockSummaryEducationSubsteps();

  this.router.navigate([], {
    relativeTo: this.route,
    queryParams: {
      fromSummary: true,
      mode: 'edit',
       section: 'education'
    },
    queryParamsHandling: 'merge'
  });

  this.cd.detectChanges();
}
  cancelSummaryEdit() {


    const step = this.originalStepState.step as StepKey | null;
    if (!step) return;

    const form = this.educationForms[step] as FormGroup;
    if (!form) return;

    // restore form
    form.reset(this.originalStepState.formValue, { emitEvent: false });

    // clear current step keys
    this.getStepKeys(step).forEach(key => {
      delete this.uploadedFiles[key];
      delete this.savedFileMeta[key];
      delete this.otherDocMap[key];
    });

    // restore old values
    Object.assign(this.uploadedFiles, this.originalStepState.uploadedFiles);
    Object.assign(this.savedFileMeta, this.originalStepState.savedFileMeta);
    Object.assign(this.otherDocMap, this.originalStepState.otherDocMap);

    this.uploadedFiles = { ...this.uploadedFiles };
    this.savedFileMeta = { ...this.savedFileMeta };
    this.otherDocMap = { ...this.otherDocMap };

    this.isViewMode = true;
    this.isEditMode = false;
    form.disable({ emitEvent: false });


    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        fromSummary: true,
        mode: 'view'
      },
      queryParamsHandling: 'merge'
    });
  }

  private getMetaForUpdate(
    key: string,
    apiType: string,
    fileOrMeta: any,
    title?: string
  ): any {
    // 1) direct lookup
    const direct =
      this.savedFileMeta[key] ||
      this.uploadedFiles[key] ||
      fileOrMeta ||
      null;

    if (direct?.documentId) {
      return direct;
    }

    const allMeta = Object.values(this.savedFileMeta || {}) as any[];

    const currentObjectKey =
      fileOrMeta?.objectKey ||
      direct?.objectKey ||
      '';

    const currentViewUrl =
      fileOrMeta?.viewUrl ||
      direct?.viewUrl ||
      '';

    const currentFileName = (
      fileOrMeta?.fileName ||
      fileOrMeta?.name ||
      direct?.fileName ||
      direct?.name ||
      ''
    ).toString().trim().toLowerCase();

    const currentTitle = (
      title ||
      this.otherDocMap[key]?.title ||
      fileOrMeta?.title ||
      direct?.title ||
      ''
    ).toString().trim().toLowerCase();

    // ✅ OTHER docs need fallback because key/index may shift
    if (apiType === 'OTHER') {
      const matchedOther = allMeta.find((m: any) =>
        m?.type === 'OTHER' &&
        !!m?.documentId &&
        (
          (currentObjectKey && m?.objectKey === currentObjectKey) ||
          (currentViewUrl && m?.viewUrl === currentViewUrl) ||
          (
            currentFileName &&
            (m?.fileName || m?.name || '').toString().trim().toLowerCase() === currentFileName
          ) ||
          (
            currentTitle &&
            (m?.title || '').toString().trim().toLowerCase() === currentTitle
          )
        )
      );

      if (matchedOther) {
        return matchedOther;
      }
    }

    // ✅ Generic fallback for IELTS / OfferLetter / etc.
    const matchedGeneric = allMeta.find((m: any) =>
      !!m?.documentId &&
      (
        (currentObjectKey && m?.objectKey === currentObjectKey) ||
        (currentViewUrl && m?.viewUrl === currentViewUrl) ||
        (
          currentFileName &&
          (m?.fileName || m?.name || '').toString().trim().toLowerCase() === currentFileName
        )
      )
    );

    return matchedGeneric || direct;
  }
  private getExistingSingleDocMeta(step: StepKey, doc: 'ielts' | 'offerletter'): any {
    const key = this.buildKey(step, doc);

    // exact key match first
    const direct =
      this.savedFileMeta[key] ||
      (!(this.uploadedFiles[key] instanceof File) ? this.uploadedFiles[key] : null);

    if (direct?.documentId) {
      return direct;
    }

    // fallback search by type
    const allMeta = Object.values(this.savedFileMeta || {}) as any[];

    if (doc === 'ielts') {
      return allMeta.find((m: any) =>
        !!m?.documentId &&
        (m?.type === 'UPLOAD_CERTIFICATE' || m?.type === 'IELTS')
      ) || null;
    }

    if (doc === 'offerletter') {
      return allMeta.find((m: any) =>
        !!m?.documentId &&
        (m?.type === 'UPLOAD_CERTIFICATE' || m?.type === 'OFFERLETTER')
      ) || null;
    }

    return null;
  }
 
  private async appendUpdateItem(
    fd: FormData,
    fileIndex: number,
    step: StepKey,
    doc: DocType,
    apiType: string,
    index?: number,
    title?: string
  ): Promise<number> {
    const key = this.buildKey(step, doc, index);

    const fileOrMeta: any =
      this.uploadedFiles[key] ||
      this.savedFileMeta[key];

    if (!fileOrMeta) {
      console.warn('No file/meta found for key:', key);
      return fileIndex;
    }

    fd.append(`files[${fileIndex}].type`, apiType);

    if (title) {
      fd.append(`files[${fileIndex}].title`, title);
    }

    
    const documentId =
      fileOrMeta.documentId ||
      this.savedFileMeta[key]?.documentId ||
      '';

    if (documentId) {
      fd.append(`files[${fileIndex}].documentId`, documentId);
    }

    // Case 1: user uploaded new file
    if (fileOrMeta instanceof File) {
      fd.append(`files[${fileIndex}].file`, fileOrMeta, fileOrMeta.name);
      return fileIndex + 1;
    }

    // Case 2: file came from summary/API as metadata
    const viewUrl =
      fileOrMeta.viewUrl ||
      fileOrMeta.fileUrl ||
      fileOrMeta.publicUrl ||
      '';

    if (!viewUrl) {
      console.warn('No viewUrl found for existing file:', key, fileOrMeta);
      return fileIndex;
    }

    try {
      const fileFromUrl = await this.urlToFile(
        viewUrl,
        fileOrMeta.fileName || fileOrMeta.name || 'document',
        fileOrMeta.mimeType || fileOrMeta.contentType || 'application/octet-stream'
      );

      fd.append(`files[${fileIndex}].file`, fileFromUrl, fileFromUrl.name);

      return fileIndex + 1;
    } catch (error) {
      console.error('Failed to convert viewUrl to File:', key, error);
      return fileIndex;
    }
  }
 
  private async buildEducationUpdateFormData(): Promise<FormData> {
    const step = this.getCurrentStep();
    const form = this.getCurrentForm();
    const fd = new FormData();

    const subcategory = this.stepToSubcategory[step];

    fd.append('category', 'EDUCATION');
    fd.append('subcategory', subcategory);
    fd.append('applicantId', this.applicantId);

    let fileIndex = 0;

    // IELTS
    if (step === 'ielts') {
      fd.append('score', form.get('score')?.value || '');

      fileIndex = await this.appendUpdateItem(
        fd,
        fileIndex,
        step,
        'ielts',
        'UPLOAD_CERTIFICATE'
      );

      return fd;
    }

    // Offer Letter
    if (step === 'offerletter') {
      fileIndex = await this.appendUpdateItem(
        fd,
        fileIndex,
        step,
        'offerletter',
        'UPLOAD_CERTIFICATE'
      );

      return fd;
    }

    const raw = form.getRawValue();

    const instituteId =
      raw.instituteId ||
      this.educationFormState[step]?.instituteId ||
      '';

    const locationId = this.resolveLocationId(form.get('location')?.value);

    fd.append('instituteId', instituteId || '');
    fd.append('otherInstituteName', form.get('institutetitle')?.value || '');
    fd.append('yearOfPassing', form.get('passingyear')?.value || '');
    fd.append('percentageCgpa', form.get('per_cgpa')?.value || '');
    fd.append('locationId', locationId || '');
    fd.append('otherLocationName', form.get('otherLocation')?.value || '');

    // Required docs: marksheet + LC
    const reqDocs = this.requiredDocs(step);

    for (const r of reqDocs) {
      fileIndex = await this.appendUpdateItem(
        fd,
        fileIndex,
        step,
        r.doc,
        r.apiType,
        r.index
      );
    }

    // Extra marksheets
    const requiredMarksheetIndexes = new Set(
      this.requiredDocs(step)
        .filter(d => d.doc === 'marksheet')
        .map(d => d.index ?? -1)
    );

    const maxAllowedMarksheetCount = this.getMarksheetCount(step);

    const extraMarksheetKeys = Array.from(
      new Set([
        ...Object.keys(this.savedFileMeta || {}),
        ...Object.keys(this.uploadedFiles || {})
      ])
    )
      .filter(key => key.startsWith(`${step}_marksheet_`))
      .map(key => {
        const match = key.match(/marksheet_(\d+)/);
        const index = match ? Number(match[1]) : -1;
        return { key, index };
      })
      .filter(({ index }) =>
        index >= 0 &&
        index < maxAllowedMarksheetCount &&
        !requiredMarksheetIndexes.has(index)
      )
      .sort((a, b) => a.index - b.index);

    for (const { index } of extraMarksheetKeys) {
      fileIndex = await this.appendUpdateItem(
        fd,
        fileIndex,
        step,
        'marksheet',
        'MARKSHEET',
        index
      );
    }

    // Other documents
    const otherKeys = Object.keys({
      ...this.uploadedFiles,
      ...this.savedFileMeta
    })
      .filter(key => key.startsWith(`${step}_other_`))
      .sort();

    for (const key of otherKeys) {
      const match = key.match(/_other_(\d+)$/);
      const index = match ? Number(match[1]) : undefined;

      const fileOrMeta =
        this.uploadedFiles[key] ||
        this.savedFileMeta[key];

      const title =
        this.otherDocMap[key]?.title ||
        fileOrMeta?.title ||
        'Other Document';

      fileIndex = await this.appendUpdateItem(
        fd,
        fileIndex,
        step,
        'other',
        'OTHER',
        index,
        title
      );
    }

    return fd;
  }
  //check step is copleted or not
  private markStepPersisted(step: StepKey): void {
    this.persistedEducationSteps[step] = true;
  }

  private isStepPersisted(step: StepKey): boolean {
    return !!this.persistedEducationSteps[step];
  }

  private shouldCallNextApi(step: StepKey): boolean {
    return  this.forceNextApiForDraft || this.hasUnsavedChanges || !this.isStepPersisted(step);
  }
  private syncPersistedStepsWithCurrentOrder(): void {
    const allowed = new Set(this.educationOrder as StepKey[]);

    Object.keys(this.persistedEducationSteps).forEach((key) => {
      if (!allowed.has(key as StepKey)) {
        delete this.persistedEducationSteps[key as StepKey];
      }
    });
  }
  async saveSummaryEdit() {

    const step = this.getCurrentStep();
    const form = this.getCurrentForm();

    if (!form || !this.canProceedToNext()) {
      this.showValidationErrors(step);
      return;
    }

    const fd = await this.buildEducationUpdateFormData();

    // debug payload
    for (const [key, value] of fd.entries()) {
      if (value instanceof File) {
        console.log(key, 'FILE =>', {
          name: value.name,
          type: value.type,
          size: value.size
        });
      } else {
        console.log(key, '=>', value);
      }
    }

    this.formSvc.uploadIncome(fd, this.applicationId, true).subscribe({
      next: async (res: any) => {
        if (res?.status === 'success') {
          this.forceNextApiForDraft = false;
          this.markStepPersisted(step);
          this.hasUnsavedChanges = false;

          await this.loadSavedEducationInfoFromApi(step);
          await this.loadEducationFromSummary();

          this.isViewMode = true;
          this.isEditMode = false;
          form.disable({ emitEvent: false });


          this.editSuccess = true;
          this.cd.detectChanges();
        }
      },
      error: (err) => {
        console.error('PUT update failed', err);
      }
    });
  }
  // edit sucess popup
  onCancel() {
    this.editSuccess = false;
  }

  handleSuccessAction(action: string) {
    if (action === 'OK') {
      this.editSuccess = false;

      this.isViewMode = true;
      this.isEditMode = false;

      this.disableAllEducationForms();

      if (this.isFromSummary) {
        this.stepperService.unlockSummaryEducationSubsteps();
      }


      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {
          fromSummary: true,
          mode: 'view'
        },
        queryParamsHandling: 'merge'
      });

      this.cd.detectChanges();
    }
  }

  // check current step for edit
  private getCurrentStep(): StepKey {
    return this.activeEducation as StepKey;
  }

  private getCurrentForm(): FormGroup {
    return this.educationForms[this.getCurrentStep()] as FormGroup;
  }

  private getStepKeys(step: StepKey): string[] {
    const prefix = `${step}_`;

    return [
      ...Object.keys(this.uploadedFiles || {}).filter(k => k.startsWith(prefix)),
      ...Object.keys(this.savedFileMeta || {}).filter(k => k.startsWith(prefix)),
      ...Object.keys(this.otherDocMap || {}).filter(k => k.startsWith(prefix))
    ].filter((v, i, arr) => arr.indexOf(v) === i);
  }
}
