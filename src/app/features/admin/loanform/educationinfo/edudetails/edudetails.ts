import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Buttons } from '../../../../systemdesign/buttons/buttons';
import { Dropdown } from '../../../../systemdesign/dropdown/dropdown';
import { Inputfield } from '../../../../systemdesign/inputfield/inputfield';
import { Uploadbtn, UploadConfig } from '../../../../systemdesign/uploadbtn/uploadbtn';
import { Edusection } from '../edusection/edusection';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { Loanformservice } from '../../../../../core/service/loanformservice';
import { Loanstepperservice } from '../../../../../core/service/loanstepperservice';
import { Msgboxservice } from '../../../../../core/service/msgboxservice';
import { firstValueFrom } from 'rxjs';
import { Successbox } from '../../../customer/successbox/successbox';
import { Messagebox } from "../../../../systemdesign/messagebox/messagebox";
import { Storage } from '../../../../../core/service/storage';
interface OptionItem {
  label: string;
  value: string;
  code?: string;
}

interface CourseTypeSelection {
  isAsset: boolean;
  isIncome: boolean;
  issalaried: boolean;
  coursetypeug: boolean;
}
@Component({
  selector: 'app-edudetails',
  imports: [CommonModule, Buttons, ReactiveFormsModule, Uploadbtn, Inputfield, Edusection, Dropdown, RouterOutlet, Successbox, Messagebox],
  standalone: true,
  templateUrl: './edudetails.html',
  styleUrl: './edudetails.scss'
})
export class Edudetails {

  uploadedFiles = {};
  files: any = {};

  basicConfig: UploadConfig = {
    accept: '.svg, .png, .jpg, .jpeg, .pdf, ',
    maxSize: 10,
    helperText: 'JPG, JPEG, PDF, PNG,  SVG (max. 10 MB)'
  };
  qualification: string = 'Last Qualification';
  seleactqualification: OptionItem[] = []
  selectedLabel = '';
  selectedID = '';

  seleactInstitute: OptionItem[] = []

  filteredInstitutes: any[] = [];

  selectedInstituteID = '';
  selectedInstituteLabel = '';
  selectedQualificationLabel = ''

  educationdetails: any;
  qualificationId!: string;

  applicantId: any;
  applicationId: any;
  custName: any;
  custARN: any;

  activeEducation!: '10th' | '12th' | 'diploma10' | 'diploma12' | 'ug' | 'pg';

  educationOrder: Array<'10th' | '12th' | 'diploma10' | 'diploma12' | 'ug' | 'pg'> = ['10th', '12th', 'diploma10', 'diploma12', 'ug', 'pg'];

  private educationRank: Record<string, number> = {
    '10th': 1,
    '12th': 2,
    'diploma10': 3,
    'diploma12': 4,
    'ug': 5,
    'ugdiploma': 6,
    'pg': 6,
    'pgafterdiploma': 7,
    'other12': 7,
    'otherdiploma': 8,

  };
  private educationDisplayLabel: Record<string, string> = {
    '10th': '10th',
    '12th': '12th',
    'diploma10': 'Diploma (After 10th)',
    'diploma12': 'Diploma (After 12th)',
    'ug': 'Undergraduate (After 12th)',
    'ugdiploma': 'Undergraduate (After Diploma)',
    'pg': 'Postgraduate (After Undergraduate)',
    'pgafterdiploma': 'Postgraduate (After Diploma and Undergraduate)',
    'others12': 'Others (After 12th)',
    'othersdiploma': 'Others (After Diploma)'

  };

  private qualificationFlowOrder = [
    '12th',
    'diploma (after 10th)',
    'diploma (after 12th)',
    'undergraduate (after 12th)',
    'undergraduate (after diploma)',
    'postgraduate (after undergraduate)',
    'postgraduate (after diploma and undergraduate)',
    'others (after 12th)',
    'others (after diploma)'
  ];

  educationForms: any = {};
  isChildRouteActive = false;

  isOtherQualification = false;
  isOtherEducation = false;

  selectedcoursetype: any;
  basicform!: FormGroup;

  hasProceededOnce = false;

  private previousEducationId: string | null = null;

  isCoApplicant: boolean = false;
  lastSavedPayload: any = null;
  isSummaryEditMode = false;
  viewOnly = false;
  //edit from summary
  isFromSummary = false;
  isViewMode = false;
  isEditMode = false;
  originalFormValue: any = null;

  editSuccess: any = false;
  description1 = `Great ! Your Additional Info Details\n Uploaded Successfully.`;

  isDataLoading = true;
  loadError = '';

  constructor(private fb: FormBuilder, private stepperService: Loanstepperservice, private cd: ChangeDetectorRef, private formSvc: Loanformservice, private msgBox: Msgboxservice, private msgbox: Msgboxservice,
    private route: ActivatedRoute, private router: Router, private storageservice: Storage) { }
  async ngOnInit() {

    this.isDataLoading = true;
    this.loadError = '';
    try {
      let Allids = this.stepperService.getLoanId();

      this.applicantId = Allids[0];
      this.applicationId = Allids[1];
      this.custName = Allids[2];
      this.custARN = Allids[3];



      this.selectedcoursetype = localStorage.getItem('coursetypeug') === 'true';
      console.log('aaaaaaaaaaaaa', this.selectedcoursetype)

      this.basicform = this.fb.group({
        qualification: ['', [Validators.required, this.qualificationVsCourseTypeValidator()]],
        // qualification: ['', [Validators.required]],
        qualificationtitle: ['', [Validators.minLength(2), Validators.maxLength(100)]],
        institute: ['', Validators.required],
        institutetitle: ['', [Validators.minLength(2), Validators.maxLength(100)]]
      })



      this.route.queryParams.subscribe((params) => {
        this.isFromSummary =
          params['fromSummary'] === true ||
          params['fromSummary'] === 'true' ||
          this.formSvc.isSummaryEditFlow();

        this.isViewMode = this.isFromSummary && params['mode'] !== 'edit';
        this.isEditMode = this.isFromSummary && params['mode'] === 'edit';

        if (this.isFromSummary) {
          this.stepperService.startSummaryEducationEditFlow();
        }

        if (this.isViewMode) {
          this.basicform.disable({ emitEvent: false });
        } else {
          this.basicform.enable({ emitEvent: false });
        }
      });



      await this.loadEducationMasters();

      await this.loadEducationBasicForBothFlows();

      // if (this.viewOnly) {
      //   this.basicform.disable({ emitEvent: false });
      // }

      this.hasProceededOnce = !!this.previousEducationId;

      const savedQualificationId = this.previousEducationId
        || this.route.snapshot.queryParams['qualificationId'];

      if (savedQualificationId) {
        sessionStorage.setItem('educationFlowQualificationId',savedQualificationId
);
        this.formSvc.getselectedEducation(savedQualificationId).subscribe(res => {
          this.educationdetails = res.data ?? res;
          this.stepperService.setEducationSubSteps(this.educationdetails);
        });
      }

    } catch (error) {
      console.error(
        'Failed to initialize education details page',
        error
      );

      this.loadError =
        'Unable to load education details. Please try again.';
    } finally {
      this.isDataLoading = false;

      /*
       * Apply the current mode only after data has been patched.
       */
      this.applyCurrentFormMode();

      this.cd.detectChanges();
    }
  }


  private applyCurrentFormMode(): void {
    if (!this.basicform) {
      return;
    }

    if (this.isViewMode && !this.isEditMode) {
      this.basicform.disable({
        emitEvent: false
      });
    } else {
      this.basicform.enable({
        emitEvent: false
      });
    }
  }

  private getEducationDetailsStorageKey(): string {
    return `educationdetailsData_main_${this.stepperService.getLoanId()?.[0]}`;
  }
  private async loadEducationBasicForBothFlows() {
    const key = this.getEducationDetailsStorageKey();

    const localData = localStorage.getItem(key);
    const parsedLocal = localData ? JSON.parse(localData) : null;


    const draftData = await this.getSavedEducationalDetails();
    const summaryData = await this.getEducationBasicFromSummary();

    const normalizedSummary = this.normalizeEducationBasic(summaryData);
    const normalizedDraft = this.normalizeEducationBasic(draftData);
    const normalizedLocal = this.normalizeEducationBasic(parsedLocal);

    let finalData: any = null;

    // 1) If final summary exists, always prefer summary
    if (this.isEducationBasicComplete(normalizedSummary)) {
      finalData = normalizedSummary;
    }
    // 2) Otherwise use draft (partial save-exit)
    else if (this.hasAnyEducationBasicData(normalizedDraft)) {
      finalData = normalizedDraft;
    }
    // 3) Otherwise use local fallback
    else if (this.hasAnyEducationBasicData(normalizedLocal)) {
      finalData = normalizedLocal;
    }
    // 4) Otherwise use partial summary if available
    else if (this.hasAnyEducationBasicData(normalizedSummary)) {
      finalData = normalizedSummary;
    }

    if (!finalData) {
      this.lastSavedPayload = null;

      // fresh new form should remain empty
      this.basicform.reset({
        qualification: '',
        qualificationtitle: '',
        institute: '',
        institutetitle: ''
      }, { emitEvent: false });

      this.selectedQualificationLabel = '';
      this.selectedInstituteLabel = '';
      this.isOtherQualification = false;
      this.isOtherEducation = false;
      this.previousEducationId = null;
      this.hasProceededOnce = false;

      this.cd.detectChanges();
      return;
    }

    this.formSvc.educationdetailsData = finalData;

    this.patchSavedEducation(finalData);


    this.lastSavedPayload = this.buildEduDetailsPayload();

    localStorage.setItem(key, JSON.stringify(finalData));

    this.saveEducationBasic();

    this.hasProceededOnce = !!this.previousEducationId;

    this.cd.detectChanges();
  }

  private hasAnyEducationBasicData(data: any): boolean {
    if (!data) return false;

    return !!(
      data.lastQualificationId ||
      data.otherQualification ||
      data.lastInstitutionId ||
      data.otherInstitutionName
    );
  }

  private isEducationBasicComplete(data: any): boolean {
    if (!data) return false;

    return !!(
      data.lastQualificationId &&
      data.lastInstitutionId
    );
  }

  // getEducationdetails() {
  //   this.formSvc.getEducation().subscribe((res: any) => {
  //     const list = res.data ?? res;

  //     this.seleactqualification = list.map((s: any) => ({
  //       value: s.qualificationId,
  //       label: s.qualificationName,

  //     }));
  //   });
  // }

  // getInstituteName() {
  //   this.formSvc.getInstitutes().subscribe((res: any) => {
  //     const list = res.data ?? res;

  //     this.seleactInstitute = list.map((s: any) => ({
  //       value: s.id,
  //       label: s.instituteName,

  //     }));
  //       this.filteredInstitutes = [...this.seleactInstitute];

  //   });
  // }

  private async loadEducationMasters() {
    const qualificationsPromise = new Promise<void>((resolve) => {
      this.formSvc.getEducation().subscribe((res: any) => {
        const list = res.data ?? res;

        this.seleactqualification = list.map((s: any) => ({
          value: s.qualificationId,
          label: s.qualificationName
        }));

        resolve();
      });
    });

    const institutesPromise = new Promise<void>((resolve) => {
      this.formSvc.getInstitutesCached().subscribe(list => {
        this.seleactInstitute = list;
        this.filteredInstitutes = [...list];

        resolve();
      });
    });

    await Promise.all([
      qualificationsPromise,
      institutesPromise
    ]);
  }

  SelectedInstitute(values: string | string[]) {
    const ids = Array.isArray(values) ? values : [values];

    const selected = this.seleactInstitute.filter(s =>
      ids.includes(s.value)
    );

    this.selectedInstituteLabel = selected.map(s => s.label).join(', ');
    this.selectedInstituteID = selected.map(s => s.value).join(', ');

    this.basicform.patchValue({
      institute: this.selectedInstituteLabel
    }, { emitEvent: false });

    this.isOtherEducation = selected.some(
      s => s.label.trim().toLowerCase() === 'other');

    const titleControl = this.basicform.get('institutetitle');

    if (this.isOtherEducation) {
      titleControl?.setValidators([
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100)
      ]);
    } else {
      titleControl?.clearValidators();
      titleControl?.setValue('', { emitEvent: false });
    }

    titleControl?.updateValueAndValidity({ emitEvent: false });

    this.saveEducationBasic();



    this.isOtherEducation = selected.some(
      s => s.label.trim().toLowerCase() === 'other'
    )



  }


  filterInstitutes(searchText: any) {
    const value = searchText.trim().toLowerCase();

    if (!value) {
      this.filteredInstitutes = [...this.seleactInstitute];
      return;
    }

    if (value.length >= 3) {
      this.formSvc.getInstitutesBySearch(searchText).subscribe((res: any) => {
        this.filteredInstitutes = [...res];
        this.seleactInstitute = [...res];
      });
    }

  }


  //current selected section (1popup left box)
  private getCurrentSections(): string[] {
    if (!this.educationdetails) return [];

    const sections = this.educationdetails.map((d: any) =>
      d.qualificationName.includes('Others')
        ? d.qualificationName
        : d.qualificationName
    );

    sections.push("IELTS / PTE")
    sections.push("University Offer Letter")
    return sections;
  }

  //all selected selection in 2nd popup


  private getSectionRequiredList(newQualificationId: string): string[] {

    const newLabel = this.getAddingSectionLabel(newQualificationId);
    const newKey = this.normalizeQualification(newLabel);

    let path: string[] = [];

    switch (newKey) {

      case 'diploma10':
        path = ['10th', 'diploma10'];
        break;

      case '12th':
        path = ['10th', '12th'];
        break;

      //  DIPLOMA AFTER 12TH
      case 'diploma12':
        path = ['10th', '12th', 'diploma12'];
        break;

      //  UG CASES
      case 'ug':
        if (newLabel.toLowerCase().includes('diploma')) {
          // UG after diploma
          path = ['10th', 'diploma10', 'ugdiploma'];
        } else {
          // UG after 12th
          path = ['10th', '12th', 'ug'];
        }
        break;

      //  PG CASES
      case 'pg':
        if (newLabel.toLowerCase().includes('diploma')) {
          // PG after diploma + UG
          path = ['10th', 'diploma10', 'ug', 'pgafterdiploma'];
        } else {
          // PG after UG
          path = ['10th', '12th', 'ug', 'pg'];
        }
        break;

      //  OTHERS AFTER 12TH
      case 'others12':
        path = ['10th', '12th', 'others12'];
        break;

      //  OTHERS AFTER DIPLOMA
      case 'othersdiploma':
        path = ['10th', 'diploma10', 'othersdiploma'];
        break;

      //  DEFAULT (fallback safe)
      default:
        path = ['10th'];
    }

    //  Map to labels
    const sections = path.map(key => this.educationDisplayLabel[key]);

    //  Always append
    sections.push('IELTS / PTE');
    sections.push('University Offer Letter');

    return sections;
  }

  private getHighestQualification(): string {
    if (!this.educationdetails?.length) return '';

    return this.educationdetails[this.educationdetails.length - 1]
      .qualificationName;
  }

  private getAddingSectionLabel(newId: string): string {
    return (
      this.seleactqualification.find(q => q.value === newId)?.label || ''
    );
  }

  Selectededucation(values: string | string[]) {
    const newId = Array.isArray(values) ? values[0] : values;


    const selected = this.seleactqualification.filter(s =>
      newId.includes(s.value)
    );

    this.selectedQualificationLabel = selected.map(s => s.label).join(', ');

    this.isOtherQualification = this.selectedQualificationLabel.toLowerCase().includes('other');

    const titleControl = this.basicform.get('qualificationtitle');

    if (this.isOtherQualification) {
      titleControl?.setValidators([
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100)
      ]);
    } else {
      titleControl?.clearValidators();
      titleControl?.setValue('', { emitEvent: false });
    }

    titleControl?.updateValueAndValidity({ emitEvent: false });

    if (!this.hasProceededOnce) {
      this.previousEducationId = newId;
      this.applyEducationChange(newId);
      return;
    }

    if (!this.previousEducationId) {
      this.previousEducationId = newId;
      this.hasProceededOnce = true;
      this.applyEducationChange(newId);
      return;
    }

    this.basicform.get('qualification')?.updateValueAndValidity();

    if (this.basicform.get('qualification')?.hasError('invalidEducation')) {
      // this.stepperService.resetEducationSubSteps();
      return;
    }


    if (newId === this.previousEducationId) return;


    const currentLabel = this.getAddingSectionLabel(this.previousEducationId);
    const newLabel = this.getAddingSectionLabel(newId);
    const currentId = this.previousEducationId!;
    if (this.isRemovingQualification(currentLabel, newLabel)) {
      const removed = this.getRemovedSections(currentId, newId);
      this.showRemovalConfirmationPopup(newId, currentLabel, newLabel, removed);
      return;
    }


    if (!this.educationdetails && this.previousEducationId) {
      this.formSvc.getselectedEducation(this.previousEducationId).subscribe(res => {
        this.educationdetails = res.data ?? res;

        this.handleEducationChangeFlow(newId);
      });
      return;
    }

    //   if already available
    this.handleEducationChangeFlow(newId);
    this.saveEducationBasic();

    // this.showAdditionPopup(newId, newLabel);

  }

  private handleEducationChangeFlow(newId: string) {

    if (newId === this.previousEducationId) return;

    const currentLabel = this.getAddingSectionLabel(this.previousEducationId!);
    const newLabel = this.getAddingSectionLabel(newId);
    const currentId = this.previousEducationId!;

    if (this.isRemovingQualification(currentLabel, newLabel)) {
      const removed = this.getRemovedSections(currentId, newId);
      this.showRemovalConfirmationPopup(newId, currentLabel, newLabel, removed);
      return;
    }

    this.showAdditionPopup(newId, [newLabel]);
  }


  //new education is added (ug-pg)
  private showAdditionPopup(newId: string, addingLabel: string[]) {
    this.msgbox.open({
      type: 'warning',
      title: 'Are you sure you want to change this?',
      mode: 'comparison',
      message: `
      You originally selected ${this.getHighestQualification()} as your last qualification.<br>
      Adding a ${addingLabel} section will update your highest qualification.
    `,
      okText: 'Yes, Update',
      cancelText: 'No',
      showCancel: true,

      comparisonData: {
        currentSections: this.getCurrentSections(),
        addingSections: addingLabel,
        removingSections: []
      },

      onOk: () => {

        this.openPostUpdateInfoPopup(newId, {
          mode: 'add',
          addingLabel
        });

      },

      onCancel: () => {
        this.basicform.patchValue({
          qualification: this.previousEducationId
        });
      }
    });
  }


  private normalizeFlowLabel(label: string): string {
    return (label || '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }
  private getRemovedSections(prevId: string, newId: string): string[] {
    const currentList = this.getSectionRequiredList(prevId);
    const newList = this.getSectionRequiredList(newId);

    // These are always present in both flows (you always append them)
    const alwaysKeep = new Set([
      this.normalizeFlowLabel('IELTS / PTE'),
      this.normalizeFlowLabel('University Offer Letter')
    ]);

    const newSet = new Set(newList.map(x => this.normalizeFlowLabel(x)));

    return currentList
      .filter(x => !alwaysKeep.has(this.normalizeFlowLabel(x)))       // ignore always steps
      .filter(x => !newSet.has(this.normalizeFlowLabel(x)));          // keep only removed
  }
  private getCurrentSectionsForPopup(currentId: string): string[] {
    return this.getSectionRequiredList(currentId);
  }

  private isRemovingQualification(currentLabel: string, newLabel: string): boolean {
    const curr = this.normalizeFlowLabel(currentLabel);
    const next = this.normalizeFlowLabel(newLabel);

    const currIndex = this.qualificationFlowOrder.indexOf(curr);
    const nextIndex = this.qualificationFlowOrder.indexOf(next);

    // If either is not found in the list, fallback to your old logic OR treat as no-removal
    if (currIndex === -1 || nextIndex === -1) {
      // fallback (optional)
      if (curr.includes('postgraduate') && (next.includes('undergraduate') || next.includes('diploma'))) return true;
      if (curr.includes('undergraduate') && next.includes('diploma')) return true;

      // IMPORTANT extra case: diploma after 12th -> diploma after 10th (should remove)
      if (curr.includes('diploma') && curr.includes('12th') && next.includes('diploma') && next.includes('10th')) return true;

      return false;
    }

    //    If moving upwards in the flow list => removing
    return nextIndex < currIndex;
  }


  private showRemovalConfirmationPopup(
    newId: string,
    oldLabel: string,
    newLabel: string,
    removedSections: string[]
  ) {
    this.msgbox.open({
      type: 'warning',
      title: 'Are you sure you want to change this?',
      mode: 'comparison',
      message: `
      You originally selected ${oldLabel}as your last qualification.<br>
      Adding a${newLabel} section will update your highest qualification.`,
 

      okText: 'Yes, Update',
      cancelText: 'No',

      comparisonData: {
        currentSections: this.getCurrentSectionsForPopup(this.previousEducationId!), //    stable
        addingSections: [],
        removingSections: removedSections  //    pass correct array
      },


      onOk: () => {


        this.openPostUpdateInfoPopup(newId, {
          mode: 'remove',
          removingLabels: removedSections //[oldLabel]
        });

      },

      onCancel: () => {
        //   rollback selection
        this.basicform.patchValue({
          qualification: this.previousEducationId
        });
      }
    });
  }


  //second confirmation popup

  private openPostUpdateInfoPopup(
    newId: string,
    options: {
      mode: 'add' | 'remove';
      addingLabel?: string[];
      removingLabels?: string[];
    }
  ) {
    const isAdd = options.mode === 'add';

    this.msgbox.open({
      type: 'warning',
      title: '',
      mode: 'required',
      message: `
      You have updated your selection.<br>
      The following sections now need to be filled.
    `,
      okText: 'Proceed',
      cancelText: 'No',
      showCancel: true,

      comparisonData: {
        currentSections: this.getSectionRequiredList(newId),
        addingSections: isAdd ? options.addingLabel : [],
        removingSections: !isAdd ? options.removingLabels : []
      },

      // onOk: () => {
      //   this.previousEducationId = newId;
      //   this.applyEducationChange(newId);
      //   this.navigateToFirstEducationStep(newId);
      // },
      onOk: () => {
        this.previousEducationId = newId;

        this.basicform.patchValue({
          qualification: newId
        }, { emitEvent: false });

        this.persistChangedEducationAndNavigate(newId);
      },
      // onOk: () => {
      //   this.previousEducationId = newId;

      //   this.basicform.patchValue({
      //     qualification: newId
      //   }, { emitEvent: false });

      //   this.persistChangedEducationAndNavigate(newId);
      // },
      onCancel: () => {
        this.basicform.patchValue({
          qualification: this.previousEducationId
        });
      }
    });
  }

  private persistChangedEducationAndNavigate(
    newQualificationId: string
  ): void {
    const input = this.buildEduDetailsPayload();

    const inputdata = {
      action: 'auto-save',
      sectionKey: 'SAVE_LAST_QUALIFICATION',
      applicationId: this.applicationId,
      applicantId: this.applicantId,
      jsonData: input
    };

    this.formSvc.saveandExit(inputdata).subscribe({
      next: () => {
        this.previousEducationId = newQualificationId;
        this.hasProceededOnce = true;

        this.formSvc.educationdetailsData = {
          ...input
        };

        const key = this.getEducationDetailsStorageKey();

        localStorage.setItem(
          key,
          JSON.stringify(input)
        );

        this.saveEducationBasic();

        this.applyEducationChange(newQualificationId);

        this.navigateToFirstEducationStep(
          newQualificationId
        );
      },
      error: error => {
        console.error(
          'Failed to save updated education selection',
          error
        );
      }
    });
  }
  private applyEducationChange(qualificationId: string) {
    if (this.basicform.invalid) return;
    this.selectedID = qualificationId;

    this.formSvc.getselectedEducation(qualificationId).subscribe(res => {
      this.educationdetails = res.data ?? res;

      this.stepperService.resetEducationSubSteps();
      this.stepperService.setEducationSubSteps(this.educationdetails);
    });
  }
  //after selecting new education start from first
  private navigateToFirstEducationStep(newId: string) {
    const stepKey = this.normalizeQualification(
      this.getAddingSectionLabel(newId)
    );
sessionStorage.setItem('educationFlowQualificationId',newId);
    this.router.navigate(['/loanform/educationinfo'], {
      queryParams: {
        qualificationId: newId,
        qualificationlabel: '10th'
      },
      queryParamsHandling: 'merge'
    });
  }

  //check selected qualification on the basis of ug-pg
  qualificationVsCourseTypeValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const isUG = localStorage.getItem('coursetypeug') === 'true';

      const label =
        this.getAddingSectionLabel(control.value).toLowerCase();

      //for UG - PG not allowed
      if (isUG) {
        if (
          label.includes('postgraduate (after undergraduate)') ||
          label.includes('postgraduate (after diploma and undergraduate)')
        ) {
          return { invalidEducation: true };
        }
      }
      //for PG - 12th,diploma and others not allowed

      if (!isUG) {
        if (
          label === '10th' ||
          label === '12th' ||
          (label.includes('diploma') && label.includes('10th')) ||
          (label.includes('diploma ') && label.includes('12th')) ||
          label.includes('others')
        ) {
          return { invalidEducation: true };
        }
      }

      return null;
    };
  }

  //label name change here
  normalizeQualification(name: string): string {
    const lower = name.toLowerCase();

    // School
    if (lower === '10th') return '10th';
    if (lower === '12th') return '12th';

    // Diploma
    if (lower.includes('diploma') && lower.includes('10')) return 'diploma10';
    if (lower.includes('diploma') && lower.includes('12')) return 'diploma12';

    //others
    if (lower.includes('others') && lower.includes('after 12th')) return 'others12';
    if (lower.includes('others') && lower.includes('diploma')) return 'othersdiploma';
    // PG
    if ((lower.includes('postgraduate')) || (lower.includes('postgraduate') && lower.includes('undergraduate'))) return 'pg';

    // UG
    if (lower.includes('undergraduate') || (lower.includes('undergraduate') && lower.includes('after 12th'))) return 'ug';

    // IELTS / PTE
    if (lower.includes('ielts') || lower.includes('pte')) return 'ielts';

    // Offer letter / Others
    if (lower.includes('offer')) return 'offerletter';
    if (lower.includes('others')) return 'others';

    console.warn('Unknown qualification:', name);
    return 'others';
  }

  onEducationSelect(value: any) {
    this.activeEducation = value.label.toLowerCase();
  }

  onChildActivate() {
    this.isChildRouteActive = true;
  }
  get isChildActive(): boolean {
    return !!this.route.firstChild; // child route exists => educationinfo is active
  }

  onChildDeactivate() {
    this.isChildRouteActive = false;
  }


  submit() {

  }
  back() {


    this.stepperService.previous();
  }

  private getEducationBasicKey(): string {
    return `educationBasic_${this.applicantId}`;
  }

  private saveEducationBasic() {
    if (!this.applicantId || !this.basicform) return;

    localStorage.setItem(
      this.getEducationBasicKey(),
      JSON.stringify({
        form: this.basicform.getRawValue(),
        selectedQualificationLabel: this.selectedQualificationLabel,
        selectedInstituteLabel: this.selectedInstituteLabel,
        isOtherQualification: this.isOtherQualification,
        isOtherEducation: this.isOtherEducation,
        previousEducationId: this.previousEducationId,
        hasProceededOnce: this.hasProceededOnce
      })
    );
  }


  //edit flow =patch from summary
  patchSavedEducation(data: any) {
    if (!data) return;

    // this.basicform.patchValue({
    //   qualification: data.lastQualificationId || '',
    //   qualificationtitle: data.otherQualification || '',
    //   institute: data.lastInstitutionId || '',
    //   institutetitle: data.otherInstitutionName || ''
    // }, { emitEvent: false });

    // ensure searched institute exists in dropdown options
    if (data.lastInstitutionId && data.lastInstitutionName) {
      const exists = this.seleactInstitute.some(x => x.value === data.lastInstitutionId);

      if (!exists) {
        this.seleactInstitute = [
          ...this.seleactInstitute,
          {
            value: data.lastInstitutionId,
            label: data.lastInstitutionName
          }
        ];

        this.filteredInstitutes = [...this.seleactInstitute];
      }
    }

    this.basicform.patchValue({
      qualification: data.lastQualificationId || '',
      qualificationtitle: data.otherQualification || '',


      institute:
        data.lastInstitutionName
      ,
      institutetitle: data.otherInstitutionName || ''
    }, { emitEvent: false });

    this.isOtherQualification = !!data.otherQualification;
    this.isOtherEducation = !!data.otherInstitutionName;
    this.previousEducationId = data.lastQualificationId || null;
    this.hasProceededOnce = !!this.previousEducationId;

    const qual = this.seleactqualification.find(q => q.value === data.lastQualificationId);
    this.selectedQualificationLabel = qual?.label || '';

    // const inst = this.seleactInstitute.find(i => i.value === data.lastInstitutionId);
    // this.selectedInstituteLabel = inst?.label || '';

    if (this.previousEducationId) {
      this.formSvc.getselectedEducation(this.previousEducationId).subscribe(res => {
        this.educationdetails = res.data ?? res;
        this.stepperService.resetEducationSubSteps();
        this.stepperService.setEducationSubSteps(this.educationdetails);
      });
    }

    this.cd.detectChanges();
  }

  private getLabelByValue(
    list: { label: string; value: string }[],
    value: any,
    fallbackLabel: string = ''
  ): string {
    if (!value && !fallbackLabel) return '';

    const found = list.find(x => x.value === value);
    if (found) return found.label;

    return fallbackLabel || value || '';
  }

  private resolveOptionValue(
    list: { label: string; value: string }[],
    rawValue: any
  ): string {
    if (!rawValue) return '';

    // already id
    const byValue = list.find(x => x.value === rawValue);
    if (byValue) return byValue.value;

    // label to id
    const byLabel = list.find(x =>
      x.label?.toString().trim().toLowerCase() ===
      rawValue.toString().trim().toLowerCase()
    );

    return byLabel?.value || rawValue;
  }

  private resolveInstituteId(rawValue: any): string {
    return this.resolveOptionValue(this.seleactInstitute, rawValue);
  }

  private resolveQualificationId(rawValue: any): string {
    return this.resolveOptionValue(this.seleactqualification, rawValue);
  }

  buildEduDetailsPayload() {
    // this.previousEducationId = this.basicform.value.qualification;


    // return {
    //   applicantId: this.applicantId,
    //   lastQualificationId: this.basicform.value.qualification,
    //   otherQualification: this.isOtherQualification
    //     ? this.basicform.value.qualificationtitle
    //     : '',
    //   lastInstitutionId: this.basicform.value.institute,
    //   otherInstitutionName: this.isOtherEducation
    //     ? this.basicform.value.institutetitle
    //     : ''
    // };
    const raw = this.basicform.getRawValue();

    const qualificationId = this.resolveQualificationId(raw.qualification);
    const instituteId = this.resolveInstituteId(raw.institute);

    const instituteLabel = this.selectedInstituteLabel || this.getLabelByValue(this.seleactInstitute, instituteId, raw.institute);

    this.previousEducationId = qualificationId;

    return {
      applicantId: this.applicantId,
      lastQualificationId: qualificationId,
      otherQualification: this.isOtherQualification
        ? raw.qualificationtitle
        : '',
      lastInstitutionId: instituteId,
      otherInstitutionName: this.isOtherEducation
        ? raw.institutetitle
        : ''
    };

  }

  getSavedEducationalDetails(): Promise<any> {
    let sectionkey = "SAVE_LAST_QUALIFICATION"
    return new Promise((resolve) => {
      this.formSvc.getSavedData(this.applicationId, this.applicantId, sectionkey).pipe()

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
  private async getEducationBasicFromSummary(): Promise<any> {
    if (!this.applicationId) return null;

    try {
      const res: any = await firstValueFrom(
        this.formSvc.getSummary(this.applicationId)
      );

      if (!res || res.status !== 'success') return null;

      const applicant = this.formSvc.getApplicantFromSummaryResponse(
        res,
        {
          isCoApplicant: this.isCoApplicant,
          coApplicantId: this.stepperService.getCo_appId()?.[0],
          coApplicantIndex: this.stepperService.getCurrentCoApplicantIndex()
        }
      );

      if (!applicant) return null;

      return (
        applicant.qualificationDetail ||
        applicant.educationInfo ||

        null
      );

    } catch (error) {
      console.error('Failed to get education basic from summary:', error);
      return null;
    }
  }
  private normalizeEducationBasic(data: any): any {
    if (!data) return null;

    const qualificationName =
      data.lastQualification ||
      data.qualificationName ||
      data.qualification ||
      data.lastQualificationName ||
      '';

    const instituteName =
      data.lastInstitution ||
      data.lastInstitutionName ||
      data.institutionName ||
      data.instituteName ||
      data.institute ||
      '';

    const qualificationId =
      data.lastQualificationId ||
      data.qualificationId ||
      this.getValueByLabel(this.seleactqualification, qualificationName);

    const instituteId =
      data.lastInstitutionId ||
      data.instituteId ||
      data.institutionId;

    const normalized = {
      applicantId: this.applicantId,
      lastQualificationId: qualificationId || '',
      lastQualificationName: qualificationName || '',
      otherQualification:
        data.otherQualification ||
        data.otherQualificationName ||
        '',
      lastInstitutionId: instituteId || '',
      lastInstitutionName: instituteName || '',
      otherInstitutionName:
        data.otherInstitutionName ||
        data.otherInstituteName ||
        ''
    };

    if (!normalized.lastQualificationId && !normalized.lastInstitutionId) {
      return null;
    }

    return normalized;
  }
  private getValueByLabel(list: any[], label: string) {
    if (!label || !list?.length) return '';

    return list.find((x: any) =>
      x.label?.toString().trim().toLowerCase() ===
      label.toString().trim().toLowerCase()
    )?.value || '';
  }
  saveExit() {
    this.msgBox.open({
      title: 'Are you sure you want to exit?',
      message: ``,
      showCancel: true, okText: 'Yes',
      onOk: () => {
        if (!this.basicform) return;
        // const key = `educationdetailsData_${this.applicantId}`;
        const key = this.getEducationDetailsStorageKey();
        let input = this.buildEduDetailsPayload();

        localStorage.setItem(key, JSON.stringify(input));

        this.saveEducationBasic();
        const inputdata = {
          action: "auto-save",
          sectionKey: "SAVE_LAST_QUALIFICATION",
          applicationId: this.applicationId,
          applicantId: this.applicantId,
          jsonData: input
        };


        this.formSvc.saveandExit(inputdata).subscribe({
          next: () => {
            this.lastSavedPayload = { ...input };
          },
          error: (err) => {
            console.error('Education saveExit failed', err);
          }
        });

        this.router.navigate(['/admin/losoperation']);
      }
    });
  }


  private isActualSummaryEducationFlow(): boolean {
    const params = this.route.snapshot.queryParams;

    const hasSummaryQuery =
      params['fromSummary'] === true ||
      params['fromSummary'] === 'true';

    return (
      hasSummaryQuery &&
      this.formSvc.isSummaryEditFlow() &&
      this.stepperService.isSummaryEducationEditFlow()
    );
  }
  next() {
    if (this.basicform.invalid) return;

    this.hasProceededOnce = true;
    this.previousEducationId = this.basicform.value.qualification;

    const raw = this.basicform.getRawValue();

    const qualificationId = this.resolveQualificationId(raw.qualification);
    const instituteId = this.resolveInstituteId(raw.institute);

    const instituteLabel = this.selectedInstituteLabel || this.getLabelByValue(this.seleactInstitute, instituteId, raw.institute);

    let input = {
      applicantId: this.applicantId,
      lastQualificationId: qualificationId,
      otherQualification: this.isOtherQualification ? raw.qualificationtitle : '',
      lastInstitutionId: instituteId,
      otherInstitutionName: this.isOtherEducation ? raw.institutetitle : ''
    };

    this.formSvc.selectedqualification(input, this.applicationId).subscribe({
      next: (res) => {
        console.log(res);
        if (res.status == "success") {
          const firstStep = '10th';
          this.formSvc.educationdetailsData = input;
          const key = this.getEducationDetailsStorageKey()
          localStorage.setItem(key, JSON.stringify(this.formSvc.educationdetailsData));

          localStorage.setItem(
            this.getEducationDetailsStorageKey(),
            JSON.stringify(input)
          );
          this.lastSavedPayload = { ...input };
          this.saveEducationBasic();
          // if (this.isFromSummary || this.stepperService.isSummaryEducationEditFlow()) {
          const isSummaryFlow = this.isActualSummaryEducationFlow();
          if (isSummaryFlow) {
            this.router.navigate(['educationinfo'], {
              relativeTo: this.route,
              queryParams: {

                fromSummary: true,
                mode: 'view',
                section: 'education',
                qualificationId: qualificationId,
                qualificationlabel: firstStep

              },
              queryParamsHandling: 'merge'
            });

            return;
          }

          this.router.navigate(['educationinfo'], {
            relativeTo: this.route,
            queryParams: {
              qualificationId: qualificationId,
              qualificationlabel: firstStep
            },
            queryParamsHandling: 'merge'
          });

        }

      },
      error: (err) => {
        console.error("error msg", err);
      }

    });



  }

  //edit from summary

  private applySummaryMode(params: any): void {
    this.isFromSummary =
      params['fromSummary'] === true ||
      params['fromSummary'] === 'true' ||
      this.formSvc.isSummaryEditFlow();

    this.isViewMode = this.isFromSummary && params['mode'] !== 'edit';
    this.isEditMode = this.isFromSummary && params['mode'] === 'edit';

    if (this.isViewMode) {
      this.basicform.disable({ emitEvent: false });
    } else {
      this.basicform.enable({ emitEvent: false });
    }
  }


  enableForm1() {
    this.isViewMode = false;
    this.isEditMode = true;
    this.basicform.enable({ emitEvent: false });
    this.stepperService.unlockSummaryEducationSubsteps();
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        fromSummary: true,
        mode: 'edit',
        section: 'education'
      },
      queryParamsHandling: 'merge'
    });
  }

  enableForm(): void {
    if (this.isDataLoading) {
      return;
    }

    this.originalFormValue =
      this.basicform.getRawValue();

    this.isViewMode = false;
    this.isEditMode = true;
    this.viewOnly = false;

    this.basicform.enable({
      emitEvent: false
    });

    this.stepperService.unlockSummaryEducationSubsteps();
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        fromSummary: true,
        mode: 'edit',
        section: 'education'
      },
      // queryParamsHandling: 'merge'
    });
    this.cd.detectChanges();
  }
  disableAdditionalInfoForm() {
    this.basicform.disable({ emitEvent: false });
  }

  enableAdditionalInfoForm() {
    this.basicform.enable({ emitEvent: false });


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
      this.basicform.patchValue(this.originalFormValue);
    }

    this.isViewMode = true;
    this.isEditMode = false;
    this.basicform.disable({ emitEvent: false });

    this.stepperService.clearSummaryEducationEditFlow();

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        fromSummary: true,
        mode: 'view',
        section: 'education'
      },
      queryParamsHandling: 'merge'
    });
  }
  saveSummaryEdit() {
    this.next()
  }
  saveSummaryEdit1() {


    const formdata = this.basicform.getRawValue();
    const input = this.buildEduDetailsPayload();

    this.formSvc.selectedqualification(input, this.applicationId).subscribe({
      next: (res: any) => {
        if (res.status === 'success') {
          // const key = this.getStorageKey();
          // localStorage.setItem(key, JSON.stringify(input));
          this.storageservice.saveSectionData(
            'additionalinfo',
            this.applicationId,
            this.applicantId,
            this.isCoApplicant,
            input
          );

          this.formSvc.educationdetailsData = input;


          this.lastSavedPayload = { ...input };


          // this.editSuccess = true;


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
    if (action === 'OK') {
      this.editSuccess = false;
      this.isViewMode = true;
      this.isEditMode = false;

      this.basicform.disable({ emitEvent: false });

      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {
          fromSummary: true,
          mode: 'view',
          section: 'education'
        },
        queryParamsHandling: 'merge'
      });
    }
  }
}
