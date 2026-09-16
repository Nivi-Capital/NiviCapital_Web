import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Output, output, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Buttons } from '../../../systemdesign/buttons/buttons';
import { Checkbox } from '../../../systemdesign/checkbox/checkbox';
import { Dropdown } from '../../../systemdesign/dropdown/dropdown';
import { Inputfield } from '../../../systemdesign/inputfield/inputfield';
import { Radiobuttons } from '../../../systemdesign/radiobuttons/radiobuttons';
import { Uploadbtn, UploadConfig, UploadResult } from '../../../systemdesign/uploadbtn/uploadbtn';
import { Loanstepperservice } from '../../../../core/service/loanstepperservice';
import { Loanformservice } from '../../../../core/service/loanformservice';
import { ActivatedRoute, Router } from '@angular/router';
import { Main } from '../../../../core/service/main';
import { Msgboxservice } from '../../../../core/service/msgboxservice';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';
import { Storage } from '../../../../core/service/storage';
import { Successbox } from '../../customer/successbox/successbox';
import { Messagebox } from "../../../systemdesign/messagebox/messagebox";
interface Document {
  title: string;
  name?: string;
  url?: string;
  fileUrl?: string;
  fileName?: String;
  type?: string;
  documentId?: string;
  viewUrl?: string;
  objectKey?: string;
  slotIndex?: number;
  slotKey?: string;
  category?: string;
  subcategory?: string;

}
@Component({
  selector: 'app-incomeinfo',
  imports: [CommonModule, Buttons, ReactiveFormsModule, Uploadbtn, FormsModule, Inputfield, Successbox, Messagebox],
  standalone: true,
  templateUrl: './incomeinfo.html',
  styleUrl: './incomeinfo.scss'
})
export class Incomeinfo {
  // uploadedFiles = {};
  files: any = {};

  basicConfig: UploadConfig = {
    accept: '.svg, .png, .jpg, .jpeg, .pdf',
    maxSize: 10,
    helperText: 'JPG, JPEG, PDF, PNG, SVG (max. 10 MB)'
  };

  openIndex: number | null = 0;
  accordions = [
    { title: 'Income Details ', alwaysOpen: true },
  ];
  applicantId: any;
  applicationId: any;
  incomeForm!: FormGroup

  isbussiness: boolean = false

  @ViewChild(Uploadbtn) uploadComponent!: Uploadbtn;
  @Output() fileresponse = new EventEmitter<any>();
  handleresponse: any;

  requiredDocs = ['salary1', 'salary2', 'salary3', 'Form16', 'oneyearbankstatement', 'ay1', 'ay2', 'ay3'];   // only required ones
  requiredBusinessDocs = ['year1', 'year2', 'year3', 'businessITR1', 'businessITR2', 'businessITR3', 'businessGST', 'businessBankstatement'];   // only required ones

  optionalDocs = ['other'];
  uploadedFiles: Record<string, File | null> = {};
  uploadedrespfiles: any[] = [];
  allDocuments: any[] = [];
  documentMap: { [key: string]: any } = {};

  imgUrl: string = '';
  imgFileName: string = '';

  otherbusinessdoc: boolean = false;
  otherdoc: boolean = false;


  otherIncomeSlots: { id: number; key: string, title: string }[] = [];
  otherBusinessSlots: { id: number; key: string, title: string }[] = [];
  private slotCounter = 0;
  newOtherBusinessTitle: string = '';

  isCoApplicant: boolean = false;
  lastSavedPayload: any = null;
  //save exit saved here
  private incomeSectionMap: Record<string, any> = {
    // salaried
    salary1: {
      sectionKey: 'BATCH_UPLOAD_INCOME_LAST_3_MONTHS',
      category: 'INCOME',
      subcategory: 'LAST_3_MONTHS',
      type: 'SALARY_SLIP'
    },
    salary2: {
      sectionKey: 'BATCH_UPLOAD_INCOME_LAST_3_MONTHS',
      category: 'INCOME',
      subcategory: 'LAST_3_MONTHS',
      type: 'SALARY_SLIP'
    },
    salary3: {
      sectionKey: 'BATCH_UPLOAD_INCOME_LAST_3_MONTHS',
      category: 'INCOME',
      subcategory: 'LAST_3_MONTHS',
      type: 'SALARY_SLIP'
    },

    Form16: {
      sectionKey: 'BATCH_UPLOAD_INCOME_FORM_16',
      category: 'INCOME',
      subcategory: 'FORM_16',
      type: 'FORM_16'
    },

    oneyearbankstatement: {
      sectionKey: 'BATCH_UPLOAD_INCOME_BANK_STATEMENT_1_YEAR',
      category: 'INCOME',
      subcategory: 'BANK_STATEMENT_1_YEAR',
      type: 'BANK_STATEMENT'
    },

    ay1: {
      sectionKey: 'BATCH_UPLOAD_INCOME_BANK_ITR_LAST_3_YEARS',
      category: 'INCOME',
      subcategory: 'ITR_LAST_3_YEARS',
      type: 'ITR'
    },
    ay2: {
      sectionKey: 'BATCH_UPLOAD_INCOME_BANK_ITR_LAST_3_YEARS',
      category: 'INCOME',
      subcategory: 'ITR_LAST_3_YEARS',
      type: 'ITR'
    },
    ay3: {
      sectionKey: 'BATCH_UPLOAD_INCOME_BANK_ITR_LAST_3_YEARS',
      category: 'INCOME',
      subcategory: 'ITR_LAST_3_YEARS',
      type: 'ITR'
    },

    // business
    year1: {
      sectionKey: 'BATCH_UPLOAD_BUSINESS_FINANCE_3_YEARS',
      category: 'BUSINESS',
      subcategory: 'BUSINESS_FINANCE_3_YEARS',
      type: 'BUSINESS_FINANCE'
    },
    year2: {
      sectionKey: 'BATCH_UPLOAD_BUSINESS_FINANCE_3_YEARS',
      category: 'BUSINESS',
      subcategory: 'BUSINESS_FINANCE_3_YEARS',
      type: 'BUSINESS_FINANCE'
    },
    year3: {
      sectionKey: 'BATCH_UPLOAD_BUSINESS_FINANCE_3_YEARS',
      category: 'BUSINESS',
      subcategory: 'BUSINESS_FINANCE_3_YEARS',
      type: 'BUSINESS_FINANCE'
    },

    businessITR1: {
      sectionKey: 'BATCH_UPLOAD_BUSINESS_ITR_3_YEARS',
      category: 'BUSINESS',
      subcategory: 'BUSINESS_ITR_3_YEARS',
      type: 'BUSINESS_ITR'
    },
    businessITR2: {
      sectionKey: 'BATCH_UPLOAD_BUSINESS_ITR_3_YEARS',
      category: 'BUSINESS',
      subcategory: 'BUSINESS_ITR_3_YEARS',
      type: 'BUSINESS_ITR'
    },
    businessITR3: {
      sectionKey: 'BATCH_UPLOAD_BUSINESS_ITR_3_YEARS',
      category: 'BUSINESS',
      subcategory: 'BUSINESS_ITR_3_YEARS',
      type: 'BUSINESS_ITR'
    },

    businessGST: {
      sectionKey: 'BATCH_UPLOAD_BUSINESS_GST_1_YEAR',
      category: 'BUSINESS',
      subcategory: 'BUSINESS_GST_1_YEAR',
      type: 'BUSINESS_GST'
    },

    businessBankstatement: {
      sectionKey: 'BATCH_UPLOAD_BUSINESS_BANK_STATEMENT_1_YEAR',
      category: 'BUSINESS',
      subcategory: 'BUSINESS_BANK_STATEMENT_1_YEAR',
      type: 'BUSINESS_BANK_STATEMENT'
    }
  };

  //get saved data
  incomeDraftSections = [
    // Salaried
    {
      sectionKey: 'BATCH_UPLOAD_INCOME_LAST_3_MONTHS',
      category: 'INCOME',
      subcategory: 'LAST_3_MONTHS',
      documentType: 'SALARY_SLIP'
    },
    {
      sectionKey: 'BATCH_UPLOAD_INCOME_FORM_16',
      category: 'INCOME',
      subcategory: 'FORM_16',
      documentType: 'FORM_16'
    },
    {
      sectionKey: 'BATCH_UPLOAD_INCOME_BANK_STATEMENT_1_YEAR',
      category: 'INCOME',
      subcategory: 'BANK_STATEMENT_1_YEAR',
      documentType: 'BANK_STATEMENT'
    },
    {
      sectionKey: 'BATCH_UPLOAD_INCOME_BANK_ITR_LAST_3_YEARS',
      category: 'INCOME',
      subcategory: 'ITR_LAST_3_YEARS',
      documentType: 'ITR'
    },

    // Other salaried income documents
    {
      sectionKey: 'BATCH_UPLOAD_OTHER_INCOME',
      category: 'OTHER',
      subcategory: 'OTHER_INCOME',
      documentType: 'OTHER'
    },

    // Business
    {
      sectionKey: 'BATCH_UPLOAD_BUSINESS_FINANCE_3_YEARS',
      category: 'BUSINESS',
      subcategory: 'BUSINESS_FINANCE_3_YEARS',
      documentType: 'BUSINESS_FINANCE'
    },
    {
      sectionKey: 'BATCH_UPLOAD_BUSINESS_ITR_3_YEARS',
      category: 'BUSINESS',
      subcategory: 'BUSINESS_ITR_3_YEARS',
      documentType: 'BUSINESS_ITR'
    },
    {
      sectionKey: 'BATCH_UPLOAD_BUSINESS_GST_1_YEAR',
      category: 'BUSINESS',
      subcategory: 'BUSINESS_GST_1_YEAR',
      documentType: 'BUSINESS_GST'
    },
    {
      sectionKey: 'BATCH_UPLOAD_BUSINESS_BANK_STATEMENT_1_YEAR',
      category: 'BUSINESS',
      subcategory: 'BUSINESS_BANK_STATEMENT_1_YEAR',
      documentType: 'BUSINESS_BANK_STATEMENT'
    },

    // Other business income documents
    {
      sectionKey: 'BATCH_UPLOAD_OTHER_BUSSINESS_INCOME',
      category: 'OTHER',
      subcategory: 'OTHER_BUSSINESS_INCOME',
      documentType: 'OTHER'
    }
  ];

  isSummaryEditMode = false;
  viewOnly = false;

  //edit from summary
  //edit from summary
  isFromSummary = false;
  isViewMode = false;
  isEditMode = false;
  originalFormValue: any = null;

  editSuccess: any = false;
  description1 = `Great ! Your Income Details\n Uploaded Successfully.`;
  deletedDocs: any = []

  isDataLoading = true;
  loadError = '';
  isDocumentUploading = false;
  uploadingFiles: Record<string, boolean> = {};
  uploadingDocs: Record<string, boolean> = {};

  constructor(private fb: FormBuilder, private stepperService: Loanstepperservice, private router: Router, private cd: ChangeDetectorRef, private msgBox: Msgboxservice, public loanformservice: Loanformservice, private route: ActivatedRoute, public main: Main, private storageservice: Storage) { }
  async ngOnInit(): Promise<void> {

    this.isDataLoading = true;
    this.loadError = '';
    try {
      this.isCoApplicant = this.router.url.includes('co-applicant');

      const queryParams =
        this.route.snapshot.queryParams;

      if (this.isCoApplicant) {
        const coApplicantIndex =
          Number(queryParams['coApplicantIndex']);

        if (
          Number.isInteger(coApplicantIndex) &&
          coApplicantIndex > 0
        ) {
          this.stepperService.setCurrentCoApplicantIndex(
            coApplicantIndex
          );
        }
      }

      this.stepperService.setStepperType(
        this.isCoApplicant ? 'CO_APPLICANT' : 'MAIN'
      );
      this.restoreStepperFlagsAfterRefresh();


      let Allids = this.stepperService.getLoanId();
      this.applicantId = Allids[0];
      this.applicationId = Allids[1];


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

          // restore back into service
          this.stepperService.setCurrentCoApplicantIndex(parsed.coApplicantIndex || 1);
          this.stepperService.setCo_appId(
            parsed.applicantId,
            parsed.applicationId,
            parsed.fullName,
            undefined, parsed.coApplicantIndex || 1);
        }
      }
      // this.applicantId = this.isCoApplicant ? AllCoapp_ids[0] : Allids[0];
      if (this.isCoApplicant) {
        this.applicantId = this.stepperService.getCo_appId()?.[0];
        this.applicationId = this.stepperService.getCo_appId()?.[1];

        if (!this.applicantId) {
          console.error('Co-applicant applicantId not found. BasicInfo CIF not generated.');
          return;
        }

      } else {

        this.applicantId = this.stepperService.getLoanId()?.[0];
        this.applicationId = this.stepperService.getLoanId()?.[1];

      }

      this.stepperService.rebuildSteps();
      this.incomeForm = this.fb.group({
        assettitle: ['', [Validators.minLength(2), Validators.maxLength(25)]]


      });
      this.applyApplicantViewMode(queryParams);

      this.requiredDocs.forEach(k => this.uploadedFiles[k] = null);
      this.optionalDocs.forEach(k => this.uploadedFiles[k] = null);
      this.requiredBusinessDocs.forEach(k => this.uploadedFiles[k] = null);
      this.resetIncomeDocuments();
      await this.loadIncomeForBothFlows();

      // if (this.viewOnly) {
      //   this.incomeForm.disable({ emitEvent: false });
      // }
    } catch (error) {
      console.error(
        'Failed to initialize income page',
        error
      );

      this.loadError =
        'Unable to load income details. Please try again.';
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
    if (!this.incomeForm) {
      return;
    }

    if (this.isViewMode && !this.isEditMode) {
      this.incomeForm.disable({
        emitEvent: false
      });
    } else {
      this.incomeForm.enable({
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
      this.loanformservice.isSummaryEditFlow();

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
          this.incomeForm.disable({ emitEvent: false });
        } else {
          this.isViewMode = false;
          this.isEditMode = true;
          this.incomeForm.enable({ emitEvent: false });
        }
      } else {
        this.isFromSummary = false;
        this.isSummaryEditMode = false;
        this.viewOnly = false;
        this.isViewMode = false;
        this.isEditMode = false;
        this.incomeForm.enable({ emitEvent: false });
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
      this.loanformservice.isSummaryEditFlow();

    this.isSummaryEditMode =
      !isNewCoappFlow &&
      isCompletedCoapp &&
      coappCameFromSummary;

    this.isFromSummary = this.isSummaryEditMode;

    this.viewOnly =
      this.isSummaryEditMode &&
      queryParams['mode'] !== 'edit';

    if (isDraftCoapp || isNewCoappFlow) {
      this.loanformservice.clearSummaryEditFlow();
      this.loanformservice.clearSummaryEducationEditFlow?.();

      this.isFromSummary = false;
      this.isSummaryEditMode = false;
      this.viewOnly = false;
      this.isViewMode = false;
      this.isEditMode = false;

      this.incomeForm.enable({ emitEvent: false });
    } else if (this.isSummaryEditMode) {
      if (this.viewOnly) {
        this.isViewMode = true;
        this.isEditMode = false;
        this.incomeForm.disable({ emitEvent: false });
      } else {
        this.isViewMode = false;
        this.isEditMode = true;
        this.incomeForm.enable({ emitEvent: false });
      }
    } else {
      this.isFromSummary = false;
      this.isSummaryEditMode = false;
      this.viewOnly = false;
      this.isViewMode = false;
      this.isEditMode = false;

      this.incomeForm.enable({ emitEvent: false });
    }
  }
  getStorageKey() {
    const main_ApplicantId = this.stepperService.getLoanId()?.[0];
    const co_ApplicantId = this.stepperService.getCo_appId()?.[0];
    const index = this.stepperService.getCurrentCoApplicantIndex();

    return this.storageservice.getStorageKey(
      'IncomeInfoData',
      this.applicationId,
      this.applicantId,
      this.isCoApplicant,

    );
  }
  private async loadIncomeForBothFlows() {

    const requestedApplicantId = this.getApiApplicantId();

    if (!requestedApplicantId) {
      console.error(
        'ApplicantId not found for income restore'
      );

      this.resetIncomeDocuments();
      return;
    }

    /*
     * Start with an empty UI. This is important if Angular
     * reuses the same Incomeinfo component while changing
     * co-applicants.
     */
    this.resetIncomeDocuments(); this.cd.detectChanges();

    const stepData = this.stepperService.getStepData1(this.getStepRoute());

    const parsedLocal = this.storageservice.getStoredSectionData(
      'IncomeInfoData',
      this.applicationId,
      this.applicantId,
      this.isCoApplicant
    );
    let safeLocal = parsedLocal;

    if (typeof safeLocal === 'string') {
      try {
        safeLocal = JSON.parse(safeLocal);
      } catch {
        safeLocal = null;
      }
    }

    // if (stepData) {
    //   this.restoreIncomeStepData(stepData);
    // } else if (parsedLocal) {
    //   this.restoreIncomeStepData(parsedLocal);
    // }

    const applicantId = this.getApiApplicantId();

    if (!applicantId) {
      console.error('ApplicantId not found for income restore');
      return;
    }


    const [savedDraftData, summaryIncome, summaryBusiness] = await Promise.all([
      this.getSavedIncomeData(applicantId),
      this.getSummarySection('incomeDetails'),
      this.getSummarySection('incomeBusinessDetails')
    ]);

    const hasCompleteSummary = this.hasCompleteSummaryIncome(summaryIncome, summaryBusiness);
    const hasDraftData = this.hasIncomeDraftData(savedDraftData);

    // 1) Final submitted docs should always win
    if (hasCompleteSummary) {
      this.patchFromSummaryData(summaryIncome, summaryBusiness);
      this.markIncomeStepCompletedIfValid()
      return;
    }

    // 2) Otherwise use saved draft
    if (hasDraftData) {
      this.restoreIncomeDraftData(savedDraftData);
      this.markIncomeStepCompletedIfValid()
      return;
    }

    // 3) If draft not available, but summary has partial docs, still patch them
    if (this.hasAnySummaryIncome(summaryIncome, summaryBusiness)) {
      this.patchFromSummaryData(summaryIncome, summaryBusiness);
      this.markIncomeStepCompletedIfValid()
      return;
    }

    if (this.isIncomeCacheForCurrentApplicant(stepData)) {
      this.restoreIncomeStepData(stepData);
      return;
    }

    if (this.isIncomeCacheForCurrentApplicant(safeLocal)) {
      this.restoreIncomeStepData(safeLocal);
      return;
    }

    this.resetIncomeDocuments();

    this.stepperService.removeStepCompleted(
      this.getStepRoute()
    );

    this.cd.detectChanges();

  }

  private isIncomeCacheForCurrentApplicant(data: any
  ): boolean {
    if (!data) {
      return false;
    }

    const currentApplicantId = String(
      this.getApiApplicantId() || ''
    );
    const ownerApplicantId = String(data.ownerApplicantId ||
      data.applicantId ||
      ''
    );

    /*
     * Old cache may not contain ow*erApplicantId.
     * For co-applica*ts, do not use an unowned cache be*ause it
     * can belong to another*co-applicant.
     */
    if (this.isCoApplicant && !ownerApplicantId) {
      return false;
    }

    return (
      !this.isCoApplicant ||
      ownerApplicantId === currentApplicantId
    );
  }

  private markIncomeStepCompletedIfValid() {
    const isFromSummaryRoute =
      this.route.snapshot.queryParams['fromSummary'] === true ||
      this.route.snapshot.queryParams['fromSummary'] === 'true';

    let storedCoAppData: any = {};

    try {
      storedCoAppData = JSON.parse(sessionStorage.getItem('coAppIds') || '{}');
    } catch {
      storedCoAppData = {};
    }

    const isCompletedCoapp =
      ['COMPLETED', 'SUBMITTED'].includes(
        (storedCoAppData?.status || '').toUpperCase()
      );

    if (
      this.allRequiredFilesUploaded ||
      (this.isCoApplicant && isFromSummaryRoute && isCompletedCoapp)
    ) {
      this.stepperService.markStepCompleted(this.getStepRoute());
    }
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
  private hasAnySummaryIncome(income: any, business: any): boolean {
    return !!(
      income?.salarySlips?.length ||
      income?.bankStatements?.length ||
      income?.form16?.length ||
      income?.itrs?.length ||
      income?.otherIncome?.length ||
      business?.business_finance_3_years?.length ||
      business?.business_itr_3_years?.length ||
      business?.business_gst_1_year?.length ||
      business?.business_bank_statement_1_year?.length ||
      business?.otherBussinessincome?.length
    );
  }


  private hasCompleteSummaryIncome(income: any, business: any): boolean {
    const hasCompleteIncome =
      !!(
        income?.salarySlips?.length >= 3 &&
        income?.bankStatements?.length >= 1 &&
        income?.form16?.length >= 1 &&
        income?.itrs?.length >= 3
      );

    const hasCompleteBusiness =
      !!(
        business?.business_finance_3_years?.length >= 3 &&
        business?.business_itr_3_years?.length >= 3 &&
        business?.business_gst_1_year?.length >= 1 &&
        business?.business_bank_statement_1_year?.length >= 1
      );

    return hasCompleteIncome || hasCompleteBusiness;
  }
  private restoreIncomeStepData(data: any) {
    if (!data) return;


    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch {
        return;
      }
    }

    this.uploadedrespfiles = data.uploadedFiles || data || [];
    this.allDocuments = data.allDocuments || [];
    this.otherIncomeSlots = data.otherIncomeSlots || [];
    this.otherBusinessSlots = data.otherBusinessSlots || [];

    // this.getAllDocuments();

    if (!this.allDocuments.length && this.uploadedrespfiles.length) {
      this.getAllDocuments();
    }

    this.rebuildDocumentMap();

    this.restoreSlotsFromDocuments();

    this.cd.detectChanges();
  }
  private hasIncomeDraftData(savedResponses: any[]): boolean {
    if (!Array.isArray(savedResponses)) return false;

    return savedResponses.some(item => {
      const draft = item?.data;
      if (!draft) return false;

      let draftData = draft?.jsonData || draft?.data || draft;

      if (typeof draftData === 'string') {
        try {
          draftData = JSON.parse(draftData);
        } catch {
          draftData = null;
        }
      }

      const uploadedFiles =
        draftData?.uploadedFiles ||
        draftData?.files ||
        draft?.uploadedFiles ||
        [];

      const uploadedDocuments =
        draftData?.uploadedDocuments ||
        draft?.uploadedDocuments ||
        [];

      return uploadedFiles.length > 0 || uploadedDocuments.length > 0;
    });
  }


  getCurrentCoApplicantFromList() {
    const mainApplicantId = this.stepperService.getLoanId()?.[0];
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

  get currentApplicantState() {
    return this.isCoApplicant
      ? this.loanformservice.coApplicantState
      : this.loanformservice.applicantState;
  }
  toggle(i: number) {
    this.openIndex = this.openIndex === i ? null : i;
  }

  get f() {
    return this.incomeForm.controls;
  }
  //clear data
  private resetIncomeDocuments(): void {
    this.uploadedFiles = {};

    this.requiredDocs.forEach(key => {
      this.uploadedFiles[key] = null;
    });

    this.optionalDocs.forEach(key => {
      this.uploadedFiles[key] = null;
    });

    this.requiredBusinessDocs.forEach(key => {
      this.uploadedFiles[key] = null;
    });

    this.uploadedrespfiles = [];
    this.allDocuments = [];
    this.documentMap = {};

    this.otherIncomeSlots = [];
    this.otherBusinessSlots = [];

    this.slotCounter = 0;
    this.handleresponse = null;
  }

  removeOtherDocument(type: 'other' | 'otherbusiness', id: number): void {

    const slots =
      type === 'other'
        ? this.otherIncomeSlots
        : this.otherBusinessSlots;

    const slot = slots.find(x => x.id === id);

    if (!slot) return;

    const doc = this.allDocuments.find(
      d =>
        d.slotKey === slot.key ||
        d.title === slot.title
    );

    if (doc) {
      this.deleteImage(slot.key, type, id);
      return;
    }

    if (type === 'other') {
      this.otherIncomeSlots =
        this.otherIncomeSlots.filter(x => x.id !== id);
    } else {
      this.otherBusinessSlots =
        this.otherBusinessSlots.filter(x => x.id !== id);
    }

    this.cd.detectChanges();
  }
  onFileChange(result: UploadResult, key: string,
    subcategory: 'LAST_3_MONTHS' | 'FORM_16' | 'BANK_STATEMENT_1_YEAR' | 'ITR_LAST_3_YEARS' | 'OTHER_INCOME',
    type: 'SALARY_SLIP' | 'FORM_16' | 'BANK_STATEMENT' | 'ITR' | 'OTHER') {

    if (!result.file) return;


    const apiApplicantId = this.getApiApplicantId();

    if (!apiApplicantId) {
      console.error('ApplicantId not found for income upload');
      return;
    }

    const fd = new FormData();
    fd.append('category', 'INCOME');
    fd.append('subcategory', subcategory);
    fd.append('title', subcategory);
    fd.append('applicantId', apiApplicantId);
    fd.append('files[0].type', type);
    fd.append('files[0].file', result.file);

    this.loanformservice.uploadIncome(fd, this.applicationId, false).subscribe({
      next: (res) => {
        console.log("onFileChange", res);

        // this.uploadComponent.setSuccess(res);     
      },
      error: (err) => {

        const errorMsg = err.error?.message || 'Failed to upload file';
        this.uploadComponent.setErrorFromApi(errorMsg);
      }
    });
  }


  onUploadStarted(
    result: UploadResult, key: string, category: 'INCOME' | 'BUSINESS' | 'OTHER',
    subcategory: 'LAST_3_MONTHS' | 'FORM_16' | 'BANK_STATEMENT_1_YEAR' | 'ITR_LAST_3_YEARS' | 'OTHER_INCOME' | 'BUSINESS_BANK_STATEMENT_1_YEAR' | 'BUSINESS_ITR_3_YEARS' | 'BUSINESS_GST_1_YEAR' | 'BUSINESS_FINANCE_3_YEARS' | 'OTHER_BUSSINESS_INCOME',
    type: 'SALARY_SLIP' | 'FORM_16' | 'BANK_STATEMENT' | 'ITR' | 'OTHER' | 'BUSINESS_BANK_STATEMENT' | 'BUSINESS_ITR' | 'BUSINESS_GST' | 'BUSINESS_FINANCE',
    othertitle?: any, index: number = 0) {

    if (!result.file) return;

    const apiApplicantId = this.getApiApplicantId();

    if (!apiApplicantId) {
      console.error('ApplicantId not found for income upload');
      return;
    }
    this.uploadedFiles[key] = result.file;

    this.uploadingFiles[key] = true;
    this.isDocumentUploading = true;

    const fd = new FormData();
    fd.append('category', category);
    fd.append('subcategory', subcategory);
    fd.append('applicantId', apiApplicantId);

    if (subcategory === "OTHER_INCOME" || subcategory === "OTHER_BUSSINESS_INCOME") {
      if (this.otherIncomeSlots.length > 0) {
        index = this.otherIncomeSlots.length - 1;
      } else if (this.otherBusinessSlots.length > 0) {
        index = this.otherBusinessSlots.length - 1;
      }
    }

    const finalTitle =
      (othertitle && othertitle.toString().trim())
        ? othertitle.toString().trim()
        : key;


    fd.append(`files[${index}].title`, finalTitle);
    fd.append(`files[${index}].type`, type);
    fd.append(`files[${index}].file`, result.file);

    this.startDocUpload(key);
    
    this.loanformservice.uploadIncome(fd, this.applicationId, this.isEditMode).subscribe({
      next: (res) => {


        this.fileresponse.emit(res)
        this.handleresponse = res
        // this.uploadedrespfiles.push(res.data)

        const uploadedData = this.normalizeUploadResponse(res.data, key, category, subcategory, type, othertitle);

        const responseDocs: Document[] =
          uploadedData?.uploadedDocuments || [];

        const newDocs = responseDocs.filter(newDoc =>
          !this.allDocuments.some(existingDoc =>
            existingDoc.documentId === newDoc.documentId
          )
        );

        this.uploadedrespfiles.push({
          ...uploadedData,
          uploadedDocuments: newDocs
        });

        // this.uploadedrespfiles.push(uploadedData);

        // const newDocs = uploadedData?.uploadedDocuments;

        this.allDocuments = [...this.allDocuments, ...newDocs];
        this.rebuildDocumentMap();
        // this.restoreSlotsFromDocuments();
        this.cd.detectChanges();

        this.uploadedFiles = { ...  this.uploadedFiles }


        const key1 = this.getStorageKey()
        // localStorage.setItem(key1, JSON.stringify(this.uploadedrespfiles));
        const stepData = {
          ownerApplicantId: this.applicantId,
          uploadedFiles: this.uploadedrespfiles,
          allDocuments: this.allDocuments,
          otherIncomeSlots: this.otherIncomeSlots,
          otherBusinessSlots: this.otherBusinessSlots
        };

        // localStorage.setItem(this.getStorageKey(), JSON.stringify(stepData));
        this.storageservice.saveSectionData(
          'IncomeInfoData',
          this.applicationId,
          this.applicantId,
          this.isCoApplicant,
          stepData
        );
        this.stepperService.setStepData1(this.getStepRoute(), stepData);
        this.uploadingFiles[key] = false;

        this.isDocumentUploading =
          Object.values(this.uploadingFiles)
            .some(v => v);

        // this.getAllDocuments();
        this.cd.detectChanges();
      },
      error: (err) => {
        this.uploadingFiles[key] = false;

        this.isDocumentUploading =
          Object.values(this.uploadingFiles)
            .some(v => v);
        const errorMsg = err.error?.message || 'Failed to upload file';
        this.uploadComponent.setErrorFromApi(errorMsg);
      }
    });
  }

  private normalizeUploadResponse(
    data: any,
    slotKey: string,
    category: string,
    subcategory: string,
    type: string,
    title?: any
  ): any {
    if (!data) return data;

    //  const finalTitle =(title && title.toString().trim())? title.toString().trim(): slotKey;
    const finalTitle = title?.trim() || slotKey;
    // const uploadedDocuments = data.uploadedDocuments || [];
    const uploadedDocuments = Array.isArray(data.uploadedDocuments) ? data.uploadedDocuments : []
    const normalizedDocuments11 = uploadedDocuments.map((doc: any, index: number) => ({
      ...doc,
      slotKey,
      title: doc.title || finalTitle || slotKey,
      type: doc.type || type,
      category: doc.category || category,
      subcategory: doc.subcategory || subcategory,
      slotIndex: index
    }));
    const normalizedDocuments = uploadedDocuments.map(
      (doc: any, index: number): Document => {
        // Check whether this document already exists.
        const existingDoc = this.allDocuments.find(existing =>
          existing.documentId === doc.documentId
        );

        // Existing summary document keeps its original slotKey.
        if (existingDoc) {
          return {
            ...existingDoc,
            ...doc,
            slotKey: existingDoc.slotKey,
            title: existingDoc.title,
            fileName:
              doc.fileName ||
              doc.url ||
              existingDoc.fileName
          };
        }

        // Only the newly uploaded document gets the current row key.
        return {
          ...doc,
          slotKey,
          title: finalTitle,
          fileName:
            doc.fileName ||
            doc.url ||
            doc.name ||
            '',
          type: doc.type || type,
          category: doc.category || category,
          subcategory: doc.subcategory || subcategory,
          slotIndex: index
        };
      }
    );

    return {
      ...data,
      category,
      subcategory,
      uploadedDocuments: normalizedDocuments
    };
  }


  getAllDocuments() {
    const uploadDocs: Document[] = [];

    this.uploadedrespfiles.forEach(item => {
      if (item.uploadedDocuments?.length > 0) {
        uploadDocs.push(...item.uploadedDocuments);
      }
    });

    // keep existing summary docs and merge uploaded docs
    const existingDocs = this.allDocuments || [];

    const merged = [...existingDocs];

    uploadDocs.forEach(uploadDoc => {
      const exists = merged.some(d => d.documentId === uploadDoc.documentId);
      if (!exists) {
        merged.push(uploadDoc);
      }
    });

    this.allDocuments = merged;
    this.rebuildDocumentMap();
  }


  getDocumentName(
    key: any, truncate = true
  ): any {
    const file = this.getDocumentByKey(key);

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

  getDocumentUrl(key: string): string {
    const doc = this.getDocumentByKey(key);
    // return doc?.viewUrl || '';  // Use viewUrl!


    const url = doc?.viewUrl || '';

    if (!url || url === 'NA') return '';

    if (url.startsWith('http')) {
      return url;
    }

    return `${window.location.origin}${url}`;

  }


  get allRequiredFilesUploaded1(): boolean {
    if (this.currentApplicantState.issalaried) {
      return this.requiredDocs.every(key => !!this.getDocumentByKey(key));
    } else {
      return this.requiredBusinessDocs.every(key => !!this.getDocumentByKey(key));
    }
    // return this.requiredDocs.every(key => !!this.getDocumentByKey(key));
  }

  get allRequiredFilesUploaded(): boolean {
    const required = this.currentApplicantState.issalaried
      ? this.requiredDocs
      : this.requiredBusinessDocs;

    const missing = required.filter(key => !this.getDocumentByKey(key));

    return missing.length === 0;
  }




  get isOtherSelected(): boolean {
    if (this.currentApplicantState.issalaried) {
      return Array.isArray(this.otherIncomeSlots) && this.otherIncomeSlots.length > 0;

    }
    return Array.isArray(this.otherBusinessSlots) && this.otherBusinessSlots.length > 0;
  }


  isOtherDocumentValid(): boolean {

    if (this.currentApplicantState.issalaried) {
      return this.otherIncomeSlots.every(slot =>
        slot.title &&
        slot.title.trim().length > 0 &&
        !!this.getDocumentByKey(slot.key)
      );
    }

    return this.otherBusinessSlots.every(slot =>
      slot.title &&
      slot.title.trim().length > 0 &&
      !!this.getDocumentByKey(slot.key)
    );
  }
  getDocumentByKeyold(key: string): Document | null {
    if (!this.allDocuments?.length) return null;

    // let doc = this.allDocuments.find(doc => doc.title === key);
    let doc = this.allDocuments.find(doc => doc.type === key);

    if (!doc) {
      doc = this.allDocuments.find(doc =>
        doc.type?.includes(key) ||
        doc.title?.includes(key) ||
        doc.fileName?.includes(key)
      );
    }

    return doc || null;
  }

  getDocumentByKey1(key: string): Document | null {
    if (!key || !key.trim() || !this.allDocuments?.length) return null;


    if (this.documentMap[key]) {
      return this.documentMap[key];
    }


    let doc = this.allDocuments.find(d => d.type === key || d.title === key || d.fileName === key || d.slotKey === key);
    const normalizedKey = key.toLowerCase();
    if (!doc) {
      doc = this.allDocuments.find(d =>

        d.slotKey?.toLowerCase() === normalizedKey ||
        d.title?.toLowerCase() === normalizedKey ||
        d.fileName?.toLowerCase() === normalizedKey ||
        d.type?.toLowerCase() === normalizedKey

      );
    }

    return doc || null;


  }

  getDocumentByKey(key: string): Document | null {
    const normalizedKey = String(key || '').trim();

    if (!normalizedKey || !this.allDocuments?.length) {
      return null;
    }

    return (
      this.documentMap[normalizedKey] ||
      this.allDocuments.find(doc =>
        doc.slotKey === normalizedKey ||
        doc.documentId === normalizedKey
      ) ||
      null
    );
  }

  hasDocument(documentKey: string): boolean {
    return !!this.getDocumentByKey(documentKey);
  }
  viewImage(url: string): void {
    window.open(url, '_blank');
  }


  downloadImage(url: string, filename: string): void {
    if (!url || url === 'NA') {
      console.error('Invalid document URL');
      return;
    }

    fetch(url)
      .then(res => {
        if (!res.ok) {
          throw new Error('Download failed');
        }
        return res.blob();
      })
      .then(blob => {
        const blobUrl = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename || 'document';
        link.click();

        window.URL.revokeObjectURL(blobUrl);
      })
      .catch(err => {
        console.error('Download failed:', err);
      });
  }

  deleteImage(key: string, otherDocType: string = '', id: number = 0): void {
    this.msgBox.open({
      title: 'Are you sure want to Remove?',
      message: ``,
      showCancel: true, okText: 'Yes',
      onOk: () => {
        const docToDelete = this.getDocumentByKey(key);
        if (!docToDelete) return;
        console.log("Deleting document:", docToDelete, this.allDocuments);

        if (this.isEditMode) {
          this.deletedDocs.push(this.allDocuments.find(doc =>
            doc.documentId === docToDelete.documentId
          ));
        }

        this.allDocuments = this.allDocuments.filter(doc =>
          doc.documentId !== docToDelete.documentId
        );
        console.log(this.allDocuments);

        if (docToDelete?.documentId) {
          this.deleteItemArr([docToDelete.documentId]);
        }

        this.rebuildDocumentMap();

        this.uploadedrespfiles = this.uploadedrespfiles.filter(item => {
          if (item.uploadedDocuments) {
            item.uploadedDocuments = item.uploadedDocuments.filter((doc: { documentId: string | undefined; }) =>
              doc.documentId !== docToDelete.documentId
            );
            return item.uploadedDocuments.length > 0;
          }
          return true;
        });
        const keyLocal = this.getStorageKey();
        const stepData = {
          ownerApplicantId: String(this.applicantId || ''),
          uploadedFiles: this.uploadedrespfiles,
          allDocuments: this.allDocuments,
          otherIncomeSlots: this.otherIncomeSlots,
          otherBusinessSlots: this.otherBusinessSlots
        };

        // localStorage.setItem(this.getStorageKey(), JSON.stringify(stepData));
        this.storageservice.saveSectionData(
          'IncomeInfoData',
          this.applicationId,
          this.applicantId,
          this.isCoApplicant,
          stepData
        );

        this.stepperService.setStepData1(this.getStepRoute(), stepData);

        // localStorage.setItem(keyLocal, JSON.stringify(this.uploadedrespfiles));

        if (otherDocType === 'other') {
          this.otherIncomeSlots = this.otherIncomeSlots.filter(slot => slot.id !== id);
        } else if (otherDocType === 'otherbusiness') {
          this.otherBusinessSlots = this.otherBusinessSlots.filter(slot => slot.id !== id);
        }

        this.cd.detectChanges();


        return true;
      }
    });
  }

  deleteItemArr(idArr: any) {
    this.loanformservice.deleteIncome({
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


  restoreSlotsFromDocuments() {
    this.otherIncomeSlots = [];
    this.otherBusinessSlots = [];

    let incomeCounter = 0;
    let businessCounter = 0;

    this.allDocuments.forEach(doc => {
      if (doc.type !== 'OTHER') return;

      const subcategory = doc.subcategory || doc.documentSubcategory || '';

      if (
        subcategory === 'OTHER_BUSSINESS_INCOME' ||
        subcategory === 'OTHER_BUSINESS_INCOME'
      ) {
        businessCounter++;

        this.otherBusinessSlots.push({
          id: businessCounter,
          key: doc.title || `other_business_${businessCounter}`,
          title: doc.title || ''
        });
      } else {
        incomeCounter++;

        this.otherIncomeSlots.push({
          id: incomeCounter,
          key: doc.title || `other_income_${incomeCounter}`,
          title: doc.title || ''
        });
      }
    });

    this.slotCounter = incomeCounter + businessCounter;
  }

  // edit flow =patch from summary

  async patchFromSummary() {
    const income = await this.getSummarySection('incomeDetails');
    const business = await this.getSummarySection('incomeBusinessDetails');

    if (!income && !business) return;

    this.patchFromSummaryData(income, business);
  }
  private patchFromSummaryData(income: any, business: any) {
    this.allDocuments = [];
    this.otherIncomeSlots = [];
    this.otherBusinessSlots = [];
    this.uploadedrespfiles = [];

    const hasIncomeDocs =
      !!income?.salarySlips?.length ||
      !!income?.form16?.length ||
      !!income?.bankStatements?.length ||
      !!income?.itrs?.length ||
      !!income?.otherIncome?.length;

    const hasBusinessDocs =
      !!business?.business_finance_3_years?.length ||
      !!business?.business_itr_3_years?.length ||
      !!business?.business_gst_1_year?.length ||
      !!business?.business_bank_statement_1_year?.length ||
      !!business?.otherBussinessincome?.length;

    if (hasIncomeDocs && income) {
      //  if (this.isSalariedUser() && income) {
      // salary slips -> salary1, salary2, salary3
      (income.salarySlips || []).forEach((item: any, i: number) => {
        this.allDocuments.push(
          this.buildSummaryDoc(
            item,
            item.name,
            'SALARY_SLIP',
            'INCOME',
            'LAST_3_MONTHS',
            item.name
          )
        );
      });

      // form16
      (income.form16 || []).forEach((item: any) => {
        this.allDocuments.push(
          this.buildSummaryDoc(
            item,
            'Form16',
            'FORM_16',
            'INCOME',
            'FORM_16',
            'Form16'
          )
        );
      });

      // bank statement
      (income.bankStatements || []).forEach((item: any) => {
        this.allDocuments.push(
          this.buildSummaryDoc(
            item,
            'oneyearbankstatement',
            'BANK_STATEMENT',
            'INCOME',
            'BANK_STATEMENT_1_YEAR',
            'oneyearbankstatement'
          )
        );
      });

      // ITR -> ay1 ay2 ay3
      (income.itrs || []).forEach((item: any, i: number) => {
        this.allDocuments.push(
          this.buildSummaryDoc(
            item,
            item.name,
            'ITR',
            'INCOME',
            'ITR_LAST_3_YEARS',
            item.name
          )
        );
      });

      // Other income
      (income.otherIncome || []).forEach((item: any, i: number) => {
        const title = item.name || `Other Income ${i + 1}`;
        const slotKey = `other_income_${i + 1}`;
        this.otherIncomeSlots.push({
          id: i + 1,
          key: slotKey,
          title
        });

        this.allDocuments.push(
          this.buildSummaryDoc(
            item,
            slotKey,
            'OTHER',
            'OTHER',
            'OTHER_INCOME',
            title
          )
        );
      });
      // }
    }

    if (hasBusinessDocs && business) {
      // if (!this.isSalariedUser() && business) {
      // Business finance -> year1 year2 year3
      (business.business_finance_3_years || []).forEach((item: any, i: number) => {
        this.allDocuments.push(
          this.buildSummaryDoc(
            item,
            `year${i + 1}`,
            'BUSINESS_FINANCE',
            'BUSINESS',
            'BUSINESS_FINANCE_3_YEARS',
            `year${i + 1}`
          )
        );
      });

      // Business ITR -> businessITR1 businessITR2 businessITR3
      (business.business_itr_3_years || []).forEach((item: any, i: number) => {
        this.allDocuments.push(
          this.buildSummaryDoc(
            item,
            `businessITR${i + 1}`,
            'BUSINESS_ITR',
            'BUSINESS',
            'BUSINESS_ITR_3_YEARS',
            `businessITR${i + 1}`
          )
        );
      });

      // GST
      (business.business_gst_1_year || []).forEach((item: any) => {
        this.allDocuments.push(
          this.buildSummaryDoc(
            item,
            'businessGST',
            'BUSINESS_GST',
            'BUSINESS',
            'BUSINESS_GST_1_YEAR',
            'businessGST'
          )
        );
      });

      // bank statement
      (business.business_bank_statement_1_year || []).forEach((item: any) => {
        this.allDocuments.push(
          this.buildSummaryDoc(
            item,
            'businessBankstatement',
            'BUSINESS_BANK_STATEMENT',
            'BUSINESS',
            'BUSINESS_BANK_STATEMENT_1_YEAR',
            'businessBankstatement'
          )
        );
      });

      // other business income
      (business.otherBussinessincome || []).forEach((item: any, i: number) => {
        const title = item.name || `Other Business ${i + 1}`;
        const slotKey = `other_business_${i + 1}`;
        this.otherBusinessSlots.push({
          id: i + 1,
          key: slotKey,
          title
        });

        this.allDocuments.push(
          this.buildSummaryDoc(
            item,
            slotKey,
            'OTHER',
            'OTHER',
            'OTHER_BUSSINESS_INCOME',
            title
          )
        );
      });
      // }
    }

    this.rebuildDocumentMap();

    const stepData = {
      ownerApplicantId: String(this.applicantId || ''),
      uploadedFiles: [], // summary docs are already in allDocuments
      allDocuments: this.allDocuments,
      otherIncomeSlots: this.otherIncomeSlots,
      otherBusinessSlots: this.otherBusinessSlots
    };

    // localStorage.setItem(this.getStorageKey(), JSON.stringify(stepData));
    this.storageservice.saveSectionData(
      'IncomeInfoData',
      this.applicationId,
      this.applicantId,
      this.isCoApplicant,
      stepData
    );
    this.stepperService.setStepData1(this.getStepRoute(), stepData);
    this.markIncomeStepCompletedIfValid();


    if (this.isCoApplicant) {
      this.loanformservice.co_incomeInfoData = stepData;
    } else {
      this.loanformservice.incomeInfoData = stepData;
    }

    this.cd.detectChanges();
  }
  private buildSummaryDoc(
    item: any,
    slotKey: string,
    type: string,
    category: string,
    subcategory: string,
    title?: string
  ): Document {
    return {
      documentId: item.documentId || slotKey,
      title: title || item.name || slotKey,
      slotKey,
      fileName: item.url || item.fileName || item.name || '',
      type,
      objectKey: item.objectKey || '',
      viewUrl: item.viewUrl || '',
      category,
      subcategory,
      url: item.url || '',
      fileUrl: item.viewUrl || '',
    };
  }

  buildViewUrl(fileName: string): string {
    if (!fileName) return '';

    if (fileName.startsWith('http')) {
      return fileName;
    }

    return `${window.location.origin}/files/${fileName}`;
  }


  isSalariedUser(): boolean {
    return this.currentApplicantState?.issalaried;
  }



  restoreIncomeDraftData(savedResponses: any[]): void {
    if (!savedResponses?.length) return;

    const restoredUploadedRespFiles: any[] = [];
    const restoredDocuments: Document[] = [];

    this.otherIncomeSlots = [];
    this.otherBusinessSlots = [];

    let salaryCounter = 0;
    let itrCounter = 0;
    let businessFinanceCounter = 0;
    let businessItrCounter = 0;
    let incomeOtherCounter = 0;
    let businessOtherCounter = 0;

    savedResponses.forEach(item => {
      const section = item?.section;
      const draft = item?.data;

      if (!section || !draft) return;

      let draftData =
        draft?.jsonData ||
        draft?.data ||
        draft;

      if (typeof draftData === 'string') {
        try {
          draftData = JSON.parse(draftData);
        } catch {
          draftData = null;
        }
      }

      if (!draftData) return;

      const uploadedFiles =
        draftData.uploadedFiles ||
        draftData.files ||
        draft.uploadedFiles ||
        [];

      const uploadedDocuments =
        draftData.uploadedDocuments ||
        draft.uploadedDocuments ||
        [];

      const documentsToRestore =
        Array.isArray(uploadedDocuments) && uploadedDocuments.length
          ? uploadedDocuments
          : uploadedFiles;

      if (!documentsToRestore.length) return;

      const normalizedDocs: Document[] = [];

      documentsToRestore.forEach((doc: any, index: number) => {
        const fallbackFile = uploadedFiles[index] || {};

        const documentType =
          doc.type ||
          doc.documentType ||
          fallbackFile.type ||
          section.documentType;

        let slotKey = '';

        switch (documentType) {
          case 'SALARY_SLIP':
            salaryCounter++;
            slotKey = `salary${salaryCounter}`;
            break;

          case 'FORM_16':
            slotKey = 'Form16';
            break;

          case 'BANK_STATEMENT':
            slotKey = 'oneyearbankstatement';
            break;

          case 'ITR':
            itrCounter++;
            slotKey = `ay${itrCounter}`;
            break;

          case 'BUSINESS_FINANCE':
            businessFinanceCounter++;
            slotKey = `year${businessFinanceCounter}`;
            break;

          case 'BUSINESS_ITR':
            businessItrCounter++;
            slotKey = `businessITR${businessItrCounter}`;
            break;

          case 'BUSINESS_GST':
            slotKey = 'businessGST';
            break;

          case 'BUSINESS_BANK_STATEMENT':
            slotKey = 'businessBankstatement';
            break;

          case 'OTHER':
            if (
              section.sectionKey === 'BATCH_UPLOAD_OTHER_BUSSINESS_INCOME' ||
              section.subcategory === 'OTHER_BUSSINESS_INCOME' ||
              section.subcategory === 'OTHER_BUSINESS_INCOME'
            ) {
              businessOtherCounter++;

              const title =
                doc.title ||
                fallbackFile.title ||
                doc.fileName ||
                fallbackFile.fileName ||
                `Other Business ${businessOtherCounter}`;

              slotKey = title;

              this.otherBusinessSlots.push({
                id: businessOtherCounter,
                key: title || `other_business_${businessOtherCounter}`,
                title
              });
            } else {
              incomeOtherCounter++;

              const title =
                doc.title ||
                fallbackFile.title ||
                doc.fileName ||
                fallbackFile.fileName ||
                `Other Income ${incomeOtherCounter}`;

              slotKey = title;

              this.otherIncomeSlots.push({
                id: incomeOtherCounter,
                key: `other_income_${incomeOtherCounter}`,
                title
              });
            }
            break;

          default:
            slotKey =
              doc.slotKey ||
              doc.title ||
              doc.fileName ||
              fallbackFile.fileName ||
              section.documentType;
        }

        const normalizedDoc: Document = {
          documentId:
            doc.documentId ||
            fallbackFile.documentId ||
            slotKey,

          title:
            doc.title ||
            fallbackFile.title ||
            slotKey,

          slotKey,

          fileName:
            doc.fileName ||
            fallbackFile.fileName ||
            doc.name ||
            fallbackFile.name ||
            '',

          type: documentType,

          objectKey:
            doc.objectKey ||
            fallbackFile.objectKey ||
            '',

          viewUrl:
            doc.viewUrl ||
            fallbackFile.viewUrl ||
            doc.fileUrl ||
            fallbackFile.fileUrl ||
            doc.publicUrl ||
            fallbackFile.publicUrl ||
            '',

          fileUrl:
            doc.fileUrl ||
            fallbackFile.fileUrl ||
            '',

          url:
            doc.url ||
            fallbackFile.url ||
            '',

          category:
            draftData.category ||
            section.category,

          subcategory:
            draftData.subcategory ||
            section.subcategory,

          slotIndex: index
        };

        normalizedDocs.push(normalizedDoc);
      });

      if (normalizedDocs.length) {
        restoredDocuments.push(...normalizedDocs);

        restoredUploadedRespFiles.push({
          ...draftData,
          category: draftData.category || section.category,
          subcategory: draftData.subcategory || section.subcategory,
          uploadedDocuments: normalizedDocs
        });
      }
    });

    this.uploadedrespfiles = restoredUploadedRespFiles;
    this.allDocuments = restoredDocuments;

    this.slotCounter = incomeOtherCounter + businessOtherCounter;

    this.rebuildDocumentMap();

    const stepData = {
      ownerApplicantId: String(this.applicantId || ''),
      uploadedFiles: this.uploadedrespfiles,
      otherIncomeSlots: this.otherIncomeSlots,
      otherBusinessSlots: this.otherBusinessSlots
    };

    if (this.isCoApplicant) {
      this.loanformservice.co_incomeInfoData = stepData;
    } else {
      this.loanformservice.incomeInfoData = stepData;
    }

    this.stepperService.setStepData1(this.getStepRoute(), stepData);
    // localStorage.setItem(this.getStorageKey(), JSON.stringify(stepData));
    this.storageservice.saveSectionData(
      'IncomeInfoData',
      this.applicationId,
      this.applicantId,
      this.isCoApplicant,
      stepData
    );

    this.cd.detectChanges();

    console.log('Income draft restored:', {
      documents: this.allDocuments,
      documentMap: this.documentMap,
      otherIncomeSlots: this.otherIncomeSlots,
      otherBusinessSlots: this.otherBusinessSlots
    });
  }
  private rebuildDocumentMap1(): void {
    this.documentMap = {};

    for (const doc of this.allDocuments || []) {
      const keys = [
        doc.slotKey,
        doc.title,
        doc.fileName,
        doc.documentId,
        doc.type
      ].filter(Boolean);

      keys.forEach((k: any) => {
        this.documentMap[String(k)] = doc;
      });
    }
  }
  private rebuildDocumentMap(): void {
    this.documentMap = {};

    for (const doc of this.allDocuments || []) {
      if (doc.slotKey) {
        this.documentMap[String(doc.slotKey)] = doc;
      }

      if (doc.documentId) {
        this.documentMap[String(doc.documentId)] = doc;
      }
    }
  }


  submit() { }

  onTitleInput(event: any) {
    const value = (event.target as HTMLInputElement).value;
    this.newOtherBusinessTitle = value;

  }

  addOtherIncomeDocument(): void {
    const id = ++this.slotCounter;

    this.otherIncomeSlots.push({
      id,
      key: `other_income_${id}`,
      title: ''

    });
  }

  addOtherBusinessDocument(): void {


    const id = ++this.slotCounter;
    this.otherBusinessSlots.push({
      id,
      key: `other_business_${id}`,
      title: ''

    });
    // this.newOtherBusinessTitle = '';
  }


  getDocumentBySlot(key: string): any | null {
    if (!this.allDocuments?.length) return null;

    return this.allDocuments.find(doc =>
      doc.title === key ||
      doc.type === key
    ) || null;
  }


  back() {
    this.stepperService.previous();
  }

  //get api for saved data
  getSavedIncomeData1(applicantId: any): Promise<any[]> {
    const requests = this.incomeDraftSections.map(section => {
      return this.loanformservice.getUploadedData(
        this.applicationId,
        applicantId,
        section.sectionKey,
        section.category,
        section.subcategory,
        section.documentType
      ).pipe(
        map((res: any) => {
          if (res?.status === 'success') {
            return {
              section,
              data: res.data?.data || res.data || null
            };
          }

          return {
            section,
            data: null
          };
        }),
        catchError(err => {
          console.error('Draft get failed for section:', section.sectionKey, err);

          return of({
            section,
            data: null
          });
        })
      );
    });

    return new Promise(resolve => {
      forkJoin(requests).subscribe({
        next: (responses: any[]) => {
          resolve(responses);
        },
        error: () => resolve([])
      });
    });
  }
  getSavedIncomeData(applicantId: any): Promise<any[]> {
    const requests = this.incomeDraftSections.map(section => {
      return this.loanformservice.getUploadedData(
        this.applicationId,
        applicantId,
        section.sectionKey,
        section.category,
        section.subcategory,
        section.documentType
      ).pipe(
        map((res: any) => {
          let data =
            res?.status === 'success'
              ? (res.data?.data || res.data || null)
              : null;

          if (typeof data === 'string') {
            try {
              data = JSON.parse(data);
            } catch {
              data = null;
            }
          }

          return {
            section, applicantId,
            data
          };
        }),
        catchError(err => {
          console.error(
            'Draft get failed for section:',
            section.sectionKey,
            section.subcategory,
            section.documentType,
            err
          );

          return of({
            section, applicantId,
            data: null
          });
        })
      );
    });

    return new Promise(resolve => {
      forkJoin(requests).subscribe({
        next: (responses: any[]) => resolve(responses),
        error: () => resolve([])
      });
    });
  }

  private getIncomeMetaByFileKey(fileKey: string): any {
    // 1. Fixed document mapping
    if (this.incomeSectionMap[fileKey]) {
      return this.incomeSectionMap[fileKey];
    }

    // 2. Other salaried income documents
    const isOtherIncome1 =
      this.otherIncomeSlots?.some(slot =>
        slot.key === fileKey || slot.title === fileKey
      );
    const isOtherIncome = this.otherIncomeSlots?.find(slot => slot.key === fileKey || slot.title === fileKey);

    if (isOtherIncome) {
      return {
        sectionKey: 'BATCH_UPLOAD_OTHER_INCOME',
        category: 'OTHER',
        subcategory: 'OTHER_INCOME',
        type: 'OTHER',
        title: isOtherIncome.title || fileKey
      };
    }

    // 3. Other business income documents
    const isOtherBusiness1 =
      this.otherBusinessSlots?.some(slot =>
        slot.key === fileKey || slot.title === fileKey
      );
    const isOtherBusiness = this.otherBusinessSlots?.find(slot => slot.key === fileKey || slot.title === fileKey);

    if (isOtherBusiness) {
      return {
        sectionKey: 'BATCH_UPLOAD_OTHER_BUSSINESS_INCOME',
        category: 'OTHER',
        subcategory: 'OTHER_BUSSINESS_INCOME',
        type: 'OTHER',
        title: isOtherBusiness.title || fileKey
      };
    }

    return null;
  }
  private restoreStepperFlagsAfterRefresh(): void {
    if (this.isCoApplicant) {
      // const coState = JSON.parse(localStorage.getItem('coApplicantState') || '{}');
      const coState = JSON.parse(localStorage.getItem(this.stepperService.getCoApplicantStateKey()) || '{}');

      this.loanformservice.coApplicantState = {
        ...this.loanformservice.coApplicantState,
        ...coState
      };

      this.stepperService.setApplicantValues('coapp', {
        isasset: this.loanformservice.coApplicantState.isasset,
        isincome: this.loanformservice.coApplicantState.isincome,
        issalaried: this.loanformservice.coApplicantState.issalaried
      });

    } else {
      const mainState = JSON.parse(localStorage.getItem('applicantState') || '{}');

      this.loanformservice.applicantState = {
        ...this.loanformservice.applicantState,
        ...mainState
      };

      this.stepperService.setApplicantValues('main', {
        isasset: this.loanformservice.applicantState.isasset,
        isincome: this.loanformservice.applicantState.isincome,
        issalaried: this.loanformservice.applicantState.issalaried,
        coursetypeug: this.loanformservice.applicantState.coursetypeug
      });
    }
  }
  saveExit() {
    this.msgBox.open({
      title: 'Are you sure you want to exit?',
      message: ``,
      showCancel: true, okText: 'Yes',
      onOk: () => {
        const key = this.getStorageKey();

        const stepData = {
          ownerApplicantId: String(this.applicantId || ''),
          uploadedFiles: this.uploadedrespfiles,
          allDocuments: this.allDocuments,
          otherIncomeSlots: this.otherIncomeSlots,
          otherBusinessSlots: this.otherBusinessSlots
        };

        // localStorage.setItem(key, JSON.stringify(stepData));
        this.storageservice.saveSectionData(
          'IncomeInfoData',
          this.applicationId,
          this.applicantId,
          this.isCoApplicant,
          stepData
        );
        const requests = this.buildDraftUploadRequests();

        if (!requests.length) {
          console.log('No files selected for draft save');

          return;
        }

        forkJoin(requests).subscribe({
          next: (responses) => {
            console.log('Income draft saved successfully:', responses);


            if (this.isCoApplicant) {
              this.loanformservice.co_incomeInfoData = stepData;
            } else {
              this.loanformservice.incomeInfoData = stepData;
            }


            this.stepperService.setStepData1(this.getStepRoute(), stepData);


          },
          error: (err) => {
            console.error('Income draft save failed:', err);

            const errorMsg = err.error?.message || 'Failed to save income draft';
            this.msgBox.open({
              title: 'Error',
              message: errorMsg,
              showCancel: false
            });
          }
        });
        this.router.navigate(['/admin/losoperation']);
      }
    });
  }

  private buildDraftUploadRequests() {
    const grouped: Record<string, any> = {};
    const apiApplicantId = this.getApiApplicantId();

    if (!apiApplicantId) {
      console.error('ApplicantId missing for income draft');
      return [];
    }
    Object.keys(this.uploadedFiles).forEach(fileKey => {
      const file = this.uploadedFiles[fileKey];

      if (!file) return;

      const meta = this.getIncomeMetaByFileKey(fileKey);

      if (!meta) {
        console.warn('No section mapping found for:', fileKey);
        return;
      }

      const groupKey = meta.sectionKey;

      if (!grouped[groupKey]) {
        grouped[groupKey] = {
          sectionKey: meta.sectionKey,
          category: meta.category,
          subcategory: meta.subcategory,
          files: []
        };
      }

      grouped[groupKey].files.push({
        file,
        type: meta.type,
        title: meta.title || fileKey
      });
    });


    return Object.values(grouped).map((group: any) => {
      const fd = new FormData();

      fd.append('applicationId', this.applicationId);
      fd.append('applicantId', apiApplicantId);
      fd.append('sectionKey', group.sectionKey);
      fd.append('category', group.category);
      fd.append('subcategory', group.subcategory);

      group.files.forEach((item: any, index: number) => {
        fd.append(`files[${index}].type`, item.type);
        fd.append(`files[${index}].title`, item.title);
        fd.append(`files[${index}].file`, item.file);
      });

      return this.loanformservice.saveandExit(fd);
    });
  }



  getStepRoute() {
    return this.isCoApplicant ? 'co-incomeinfo' : 'incomeinfo';
  }
  private getStepRoute11(): string {
    if (!this.isCoApplicant) {
      return 'incomeinfo';
    }

    return `co-incomeinfo_${this.applicantId}`;
  }


  next() {

    console.log('allRequiredFilesUploaded:', this.allRequiredFilesUploaded);
    if (!this.allRequiredFilesUploaded) return;
    if (this.allRequiredFilesUploaded) {

      const stepData = {
        ownerApplicantId: String(this.applicantId || ''),
        uploadedFiles: this.uploadedrespfiles,
        allDocuments: this.allDocuments,
        otherIncomeSlots: this.otherIncomeSlots,
        otherBusinessSlots: this.otherBusinessSlots
      };


      const key = this.getStorageKey();
      const stepRoute = this.getStepRoute();
      const completedRoute = this.isCoApplicant ? 'co-incomeinfo' : 'incomeinfo';

      // localStorage.setItem(key, JSON.stringify(stepData));
      this.storageservice.saveSectionData(
        'IncomeInfoData',
        this.applicationId,
        this.applicantId,
        this.isCoApplicant,
        stepData
      );
      if (this.isCoApplicant) {
        this.loanformservice.co_incomeInfoData = stepData;

      } else {
        this.loanformservice.incomeInfoData = stepData;

      }

      this.stepperService.setStepData1(stepRoute, stepData);
      this.stepperService.markStepCompleted(completedRoute);

      // this.stepperService.next();

      const beforeUrl = this.router.url;

      console.log('Before stepperService.next()', beforeUrl);

      this.stepperService.next();

      setTimeout(() => {

      }, 100);


    }
  }

  //edit from summary enable and disbale
  enableForm(): void {
    if (this.isDataLoading) {
      return;
    }

    this.originalFormValue =
      this.incomeForm.getRawValue();

    this.isViewMode = false;
    this.isEditMode = true;
    this.viewOnly = false;

    this.incomeForm.enable({
      emitEvent: false
    });

    this.cd.detectChanges();
  }

  cancelSummaryEdit() {
    if (this.isEditMode && this.originalFormValue) {
      this.incomeForm.patchValue(this.originalFormValue);
    }

    this.isViewMode = true;
    this.isEditMode = false;
    this.incomeForm.disable();
  }

  saveSummaryEdit() {
    this.editSuccess = true;
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
      this.incomeForm.disable();
    }
  }

isDocUploading(docKey: string): boolean {
  return this.uploadingDocs[docKey] === true;
}

startDocUpload(docKey: string): void {
  this.uploadingDocs[docKey] = true;
}

finishDocUpload(docKey: string): void {
  this.uploadingDocs[docKey] = false;
}
  isCurrentStepUploading(): boolean {
    return Object.values(this.uploadingFiles).some(
      uploading => uploading
    );
  }

}

