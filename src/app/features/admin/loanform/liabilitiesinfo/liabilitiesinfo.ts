import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Buttons } from '../../../systemdesign/buttons/buttons';
import { Dropdown, DropdownOption } from '../../../systemdesign/dropdown/dropdown';
import { Inputfield } from '../../../systemdesign/inputfield/inputfield';
import { ActivatedRoute, Router } from '@angular/router';
import { Loanformservice } from '../../../../core/service/loanformservice';
import { Loanstepperservice } from '../../../../core/service/loanstepperservice';
import { Main } from '../../../../core/service/main';
import { Msgboxservice } from '../../../../core/service/msgboxservice';
import { Title } from '@angular/platform-browser';
import { forkJoin, firstValueFrom } from 'rxjs';
import { Storage } from '../../../../core/service/storage';
import { Successbox } from '../../customer/successbox/successbox';
import { Messagebox } from "../../../systemdesign/messagebox/messagebox";
interface Bank_lenderOption {
  value: string;
  label: string;
}
interface LiabilityOption {
  code: string;
  name: string;
  id: string;
  displayOrder?: number;
}

@Component({
  selector: 'app-liabilitiesinfo',
  imports: [CommonModule, ReactiveFormsModule, Buttons, Dropdown, Inputfield, Successbox, Messagebox],
  standalone: true,
  templateUrl: './liabilitiesinfo.html',
  styleUrl: './liabilitiesinfo.scss'
})
export class Liabilitiesinfo {

  applicantId: any;
  applicationId: any;

  openIndex: number[] = [0];
  accordions = [
    { title: 'Existing Loans ', alwaysOpen: true, key: 'ExistingLoans' },
    { title: 'Credit Card Outstanding ', alwaysOpen: true, key: 'CreditCardOutstanding' },
    { title: 'Buy Now Pay Later (BNPL)', alwaysOpen: true, key: 'BuyNowPayLater' },
    { title: 'Other Liabilities', alwaysOpen: true, key: 'OtherLiabilities' },
  ];

  @Input() avatarUrl = '';
  @Input() hasAvatar = false;
  maritalstatus: string = 'Marital Status';
  liabilitiesCatagories: DropdownOption[] = [];
  selectedliabilities: string[] = [];
  selectedliabilities1: LiabilityOption[] = [];
  selectedlibilitiesIds: string[] = [];
  selectedliabilityLabel = ''
  liabilityForm!: FormGroup;

  liabilityOrder: string[] = [
    'Existing Loans',
    'Credit Card Outstanding',
    'Buy Now Pay Later (BNPL)',
    'Other Liabilities',
  ];


  fieldMap: any = {
    'EXISTING_LOAN': { form: 'loans', api: 'Existing_Loans' },
    'CREDIT_CARD_OUTSTANDING': { form: 'creditcard', api: 'Credit_Card_Outstanding' },
    'BNPL': { form: 'bnpl', api: 'Buy_Now_Pay_Later' },
    'OTHER_LIABILITY': { form: 'other', api: 'Other_Liabilities' }
  };

  summaryFieldMap: any = {
    'EXISTING_LOAN': { keyName: 'existingLoans' },
    'CREDIT_CARD_OUTSTANDING': { keyName: 'creditCardOutstanding' },
    'BNPL': { keyName: 'bnpl' },
    'OTHER_LIABILITY': { keyName: 'otherLiabilities' }
  }
  private liabilityFormMap: Record<string, string> = {
    'EXISTING_LOAN': 'loans',
    'CREDIT_CARD_OUTSTANDING': 'creditcard',
    'BNPL': 'bnpl',
    'OTHER_LIABILITY': 'other'
  };


  private readonly NO_LIABILITY_CODE = 'I_DONT_HAVE_LIABILITIES';

  private readonly REAL_LIABILITY_CODES = [
    'EXISTING_LOAN',
    'CREDIT_CARD_OUTSTANDING',
    'BNPL',
    'OTHER_LIABILITY'
  ];


  selectedloantype: string[] = [];
  loanoptions: DropdownOption[] = [];
  selectedloantypeLabel = ''

  groupIdMap: { [key: string]: string[] } = {};
  liabilityCodeMap: { [key: string]: string } = {};

  c: any;
  totalloans = 0;
  totalcc = 0;
  totalbnpl = 0;
  totalother = 0;
  totalINRamt: any;

  selectBanks: Bank_lenderOption[] = [];
  selectedbankIds: string[] = [];
  selectedbakname!: string;


  selectLenders: Bank_lenderOption[] = [];
  selectedLenderIds: string[] = [];
  selectedlendername!: string;

  loanerror: boolean = false;
  isCoApplicant: boolean = false;
  lastSavedPayload: any = null;
  isSummaryEditMode = false;
  viewOnly = false;
  private isPatching = false;

  //edit from summary
  //edit from summary
  isFromSummary = false;
  isViewMode = false;
  isEditMode = false;
  originalFormValue: any = null;

  editSuccess: any = false;
  description1 = `Great ! Your Liabilities Info Details\n Uploaded Successfully.`;
  summarySection: any = [];

  isDataLoading = true;
loadError = '';

loadedFromSaveExit = false;
  constructor(private fb: FormBuilder, public main: Main, private route: ActivatedRoute, private msgBox: Msgboxservice, private router: Router, private storageservice: Storage,
    private stepperService: Loanstepperservice, private formSvc: Loanformservice, private cd: ChangeDetectorRef) { }


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
    }

    this.stepperService.restoreLoanEditContext();
    this.stepperService.restoreLoanIdFromSession();

    let Allids = this.stepperService.getLoanId();

    this.applicantId = Allids[0];
    this.applicationId = Allids[1];


    let AllCoapp_ids = this.stepperService.getCo_appId();

    const queryParams = this.route.snapshot.queryParams;

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
          undefined, parsed.coApplicantIndex || 1
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
    this.stepperService.rebuildSteps();


    this.liabilityForm = this.fb.group({
      loans: this.fb.array([]),
      creditcard: this.fb.array([]),
      bnpl: this.fb.array([]),
      other: this.fb.array([]),

    });
    this.applyApplicantViewMode(queryParams);

    this.liabilityForm.get('loans')?.valueChanges.subscribe(() => {
      this.calculateGrandTotal();
    });
    this.liabilityForm.get('creditcard')?.valueChanges.subscribe(() => {
      this.calculateGrandTotal();

    });

    this.liabilityForm.get('bnpl')?.valueChanges.subscribe(() => {
      this.calculateGrandTotal();
    });

    this.liabilityForm.get('other')?.valueChanges.subscribe(() => {
      this.calculateGrandTotal();
    });

    await this.loadMasters();
    await this.loadliabilityForBothFlows()
    // if (this.viewOnly) {
    //   this.liabilityForm.disable({ emitEvent: false });
    // }

 } catch (error) {
    console.error(
      'Failed to initialize liability page',
      error
    );

    this.loadError =
      'Unable to load liability details. Please try again.';
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
  if (!this.liabilityForm) {
    return;
  }

  if (this.isViewMode && !this.isEditMode) {
    this.liabilityForm.disable({
      emitEvent: false
    });
  } else {
    this.liabilityForm.enable({
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
          this.liabilityForm.disable({ emitEvent: false });
        } else {
          this.isViewMode = false;
          this.isEditMode = true;
          this.liabilityForm.enable({ emitEvent: false });
        }
      } else {
        this.isFromSummary = false;
        this.isSummaryEditMode = false;
        this.viewOnly = false;
        this.isViewMode = false;
        this.isEditMode = false;
        this.liabilityForm.enable({ emitEvent: false });
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

      this.liabilityForm.enable({ emitEvent: false });
    } else if (this.isSummaryEditMode) {
      if (this.viewOnly) {
        this.isViewMode = true;
        this.isEditMode = false;
        this.liabilityForm.disable({ emitEvent: false });
      } else {
        this.isViewMode = false;
        this.isEditMode = true;
        this.liabilityForm.enable({ emitEvent: false });
      }
    } else {
      this.isFromSummary = false;
      this.isSummaryEditMode = false;
      this.viewOnly = false;
      this.isViewMode = false;
      this.isEditMode = false;

      this.liabilityForm.enable({ emitEvent: false });
    }
  }

  getStorageKey() {
    const main_ApplicantId = this.stepperService.getLoanId()?.[0];
    const co_ApplicantId = this.stepperService.getCo_appId()?.[0];
    const index = this.stepperService.getCurrentCoApplicantIndex();

    return this.storageservice.getStorageKey(
      'liabilitiesinfoData',
      this.applicationId,
      this.applicantId,
      this.isCoApplicant,

    );
  }
  getCurrentCoApplicantFromList() {
    const mainApplicantId = this.stepperService.getLoanId()?.[0];
    const index = this.stepperService.getCurrentCoApplicantIndex();

    const saved = localStorage.getItem(`coApplicants_${mainApplicantId}`);
    const list = saved ? JSON.parse(saved) : [];

    return list.find((x: any) => Number(x.index) === Number(index));
  }

  getApiApplicantId() {
    if (!this.isCoApplicant) {
      return this.stepperService.getLoanId()?.[0];
    }

    return this.stepperService.getCo_appId()?.[0] || null;
  }

  get loans(): FormArray {
    return this.liabilityForm.get('loans') as FormArray;
  }
  get creditcard(): FormArray {
    return this.liabilityForm.get('creditcard') as FormArray;
  }

  get bnpl(): FormArray {
    return this.liabilityForm.get('bnpl') as FormArray;
  }
  get other(): FormArray {
    return this.liabilityForm.get('other') as FormArray;
  }

  getFormArray(name: string): FormArray {
    return this.liabilityForm.get(name) as FormArray;
  }

  Selectedvalue(values: string | string[]) {
    const ids = Array.isArray(values) ? values : [values];

    const selected = this.liabilitiesCatagories.filter(s => ids.includes(s.value));

    this.selectedliabilityLabel = selected.map(s => s.label).join(', ');

    console.log("selectedliabilityLabel:", this.selectedliabilityLabel);

  }

  async loadMasters() {
    const res: any = await firstValueFrom(
      forkJoin({
        liabilities: this.formSvc.getAllLiabilities(),
        loanTypes: this.formSvc.getloan_type(),
        banks: this.formSvc.getallBanks(),
        lenders: this.formSvc.getalllenders()
      })
    );

    const liabilitiesList = res.liabilities.data ?? res.liabilities;
    const loanTypeList = res.loanTypes.data ?? res.loanTypes;
    const bankList = res.banks.data ?? res.banks;
    const lenderList = res.lenders.data ?? res.lenders;

    this.groupIdMap = liabilitiesList.reduce((acc: any, item: any) => {
      if (!acc[item.code]) acc[item.code] = [];
      acc[item.code].push(item.id);
      return acc;
    }, {});

    this.liabilitiesCatagories = liabilitiesList.map((a: any) => ({
      value: a.code,
      label: this.accordianTitle(a.code),
      code: a.code,
      disabled: false
    }));

    this.accordions = liabilitiesList.map((group: any) => ({
      title: this.accordianTitle(group.code),
      alwaysOpen: true,
      key: group.code,
      disabled: false
    }));

    this.liabilityCodeMap = liabilitiesList.reduce((acc: any, item: any) => {
      acc[item.code] = item.code;
      return acc;
    }, {});

    this.loanoptions = loanTypeList.map((a: any) => ({
      value: a.id,
      label: a.name,
      code: a.code
    }));

    this.selectBanks = bankList.map((s: any) => ({
      value: s.id,
      label: s.name,
      code: s.code
    }));

    this.selectLenders = lenderList.map((s: any) => ({
      value: s.id,
      label: s.lenderName,
      code: s.lenderName
    }));

    this.cd.detectChanges();
  }

  private async loadliabilityForBothFlows() {
    const key = this.getStorageKey();

    // const localData = localStorage.getItem(key);
    // const parsedLocal = localData ? JSON.parse(localData) : null;

    const parsedLocal = this.storageservice.getStoredSectionData(
      'liabilitiesinfoData',
      this.applicationId,
      this.applicantId,
      this.isCoApplicant
    );

    const apiApplicantId = this.getApiApplicantId();



    const [draftData, summarySection] = await Promise.all([
      apiApplicantId ? this.getSavedLiability(apiApplicantId) : Promise.resolve(null),
      this.getSummarySection('liabilities')
    ]);

    this.summarySection = summarySection;
    const normalizedSummary = this.normalizeLiabilities(summarySection);
    const normalizedDraft = this.normalizeLiabilities(draftData);
    const normalizedLocal = this.normalizeLiabilities(parsedLocal);

 this.loadedFromSaveExit = !!normalizedDraft?.items?.length;

    const finalData = this.mergeLiabilityData(
      normalizedSummary,
      normalizedDraft,
      normalizedLocal
    );



    if (finalData?.noLiabilities === true || finalData?.items?.length === 0) {
  this.lastSavedPayload = this.normalizeLiabilityPayload({
    applicantId: this.getApiApplicantId(),
    items: []
  });


      this.selectedliabilities = [this.NO_LIABILITY_CODE];
      this.selectedloantype = [];
      this.openIndex = [];

      this.loans.clear();
      this.creditcard.clear();
      this.bnpl.clear();
      this.other.clear();

      // keep default empty rows only for arrays you want visible by default
      this.creditcard.push(this.createCreditcard());
      this.bnpl.push(this.createBNPL());
      this.other.push(this.createOther());

      this.calculateGrandTotal();
      this.cd.detectChanges();
      return;
    }


    if (this.isCoApplicant) {
      this.formSvc.co_liabilitiesInfoData = finalData;
    } else {
      this.formSvc.liabilitiesInfoData = finalData;
    }



    this.patchLiabilitiesData(finalData);

    const snapshot = this.buildLiabilityPayloadWithApplicantId();

    this.lastSavedPayload = snapshot.invalid
      ? null
      : this.normalizeLiabilityPayload({
        applicantId: snapshot.applicantId,
        items: snapshot.items
      });

    // localStorage.setItem(key, JSON.stringify(finalData));
    this.storageservice.saveSectionData(
      'liabilitiesinfoData',
      this.applicationId,
      this.applicantId,
      this.isCoApplicant,
      (finalData)
    );

    this.liabilityForm.markAsPristine();
    this.calculateGrandTotal();

    //  mark complete only if strict valid payload can be built
    if (!snapshot.invalid && snapshot.items.length > 0) {
      this.stepperService.markStepCompleted(this.getStepRoute());
    }
    this.cd.detectChanges();

  }
  private mergeLiabilityData(...sources: any[]): any {
    const validSources = sources.filter(Boolean);
    if (!validSources.length) return null;
    // Important:
    // If any latest/local source says user has no liabilities,
    // do not merge old draft data.
    const explicitNoLiabilities = validSources.find(source =>
      source?.noLiabilities === true ||
      (Array.isArray(source?.items) && source.items.length === 0)
    );

    if (explicitNoLiabilities) {
      return {
        applicantId: explicitNoLiabilities.applicantId || this.getApiApplicantId(),
        items: [],
        noLiabilities: true,
        totalLiabilities: 0
      };
    }

    const mergedItems: any[] = [];

    validSources.forEach(source => {
      const items = Array.isArray(source?.items) ? source.items : [];
      mergedItems.push(...items);
    });

    const dedupedItems = this.dedupeLiabilityItems(mergedItems);

    return {
      applicantId:
        validSources.find(x => x?.applicantId)?.applicantId || this.getApiApplicantId(),
      totalLiabilities: dedupedItems.reduce((sum, item) => {
        return sum +
          Number(item.outstandingBalanceInr || 0) +
          Number(item.amountInr || 0);
      }, 0),
      items: dedupedItems
    };
  }
  private dedupeLiabilityItems(items: any[]): any[] {
    const map = new Map<string, any>();

    items.forEach(item => {
      const key = [
        item.liabilityType || '',
        item.bankId || '',
        item.liabilityTypeText || '',
        item.remainingTenureMonths || '',
        item.title || '',
        item.outstandingBalanceInr || 0,
        item.creditLimitInr || 0,
        item.monthlyEmiInr || 0,
        item.amountInr || 0,
        item.monthlyRepaymentInr || 0
      ].join('|');

      if (!map.has(key)) {
        map.set(key, item);
      }
    });

    return Array.from(map.values());
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

  private normalizeLiabilities(data: any): any {
    if (!data) return null;

    // Already in saved/draft/local payload format
    // Example: { applicantId: '...', items: [...] }
    if (Array.isArray(data.items)) {
      return {
        applicantId: data.applicantId || this.getApiApplicantId(),
        items: data.items || [],
        noLiabilities: data.noLiabilities === true || data.items.length === 0
      };
    }

    const cleanAmount = (value: any): number => {
      if (value === null || value === undefined || value === '') return 0;

      return Number(
        value
          .toString()
          .replace(/,/g, '')
      ) || 0;
    };

    const items: any[] = [];

    // Existing Loans
    (data.existingLoans || []).forEach((item: any) => {
      items.push({
        liabilityType: 'EXISTING_LOAN',

        bankId: this.findId(
          this.selectBanks,
          item.bankId ||
          item.bankLender ||
          item.bankName ||
          item.lenderName
        ),

        outstandingBalanceInr: cleanAmount(
          item.outstandingBalanceInr ||
          item.outstandingBalance
        ),

        emiAmountInr: cleanAmount(
          item.emiAmountInr ||
          item.emiAmount
        ),

        remainingTenureMonths:
          item.remainingTenureMonths ||
          item.remainingTenure ||
          '',

        liabilityTypeText:
          item.liabilityTypeText ||
          item.loanType ||
          item.type ||
          '',

        title: item.title || ''
      });
    });

    // Credit Card Outstanding
    (data.creditCardOutstanding || []).forEach((item: any, index: number) => {
      items.push({
        liabilityType: 'CREDIT_CARD_OUTSTANDING',

        bankId: this.findId(
          this.selectBanks,
          item.bankId ||
          item.bankName
        ),

        outstandingBalanceInr: cleanAmount(
          item.outstandingBalanceInr ||
          item.outstandingBalance
        ),

        creditLimitInr: cleanAmount(
          item.creditLimitInr ||
          item.creditLimit
        ),

        liabilityTypeText:
          item.liabilityTypeText ||
          `CREDIT_CARD_OUTSTANDING ${index + 1}`,

        title: item.title || ''
      });
    });

    // BNPL
    (data.bnpl || []).forEach((item: any, index: number) => {
      items.push({
        liabilityType: 'BNPL',

        bankId: this.findId(
          this.selectLenders,
          item.bankId ||
          item.lenderId ||
          item.lenderName ||
          item.bankName
        ),

        outstandingBalanceInr: cleanAmount(
          item.outstandingBalanceInr ||
          item.outstandingBalance
        ),

        creditLimitInr: cleanAmount(
          item.creditLimitInr ||
          item.creditLimit
        ),

        monthlyEmiInr: cleanAmount(
          item.monthlyEmiInr ||
          item.monthlyEMI ||
          item.monthlyEmi
        ),

        liabilityTypeText:
          item.liabilityTypeText ||
          `BNPL ${index + 1}`,

        title: item.title || ''
      });
    });

    // Other Liabilities
    (data.otherLiabilities || []).forEach((item: any) => {
      items.push({
        liabilityType: 'OTHER_LIABILITY',

        liabilityTypeText:
          item.liabilityType ||
          item.liabilityTypeText ||
          item.name ||
          item.liabilityName ||
          item.type ||
          '',

        amountInr: cleanAmount(
          item.amountInr ||
          item.amount
        ),

        monthlyRepaymentInr: cleanAmount(
          item.monthlyRepaymentInr ||
          item.monthlyRepayment
        )
      });
    });

    if (!items.length) return null;

    return {
      applicantId: this.getApiApplicantId(),
      totalLiabilities: data.totalLiabilities || 0,
      items
    };
  }
  //existing loans
  createLoan(type: string): FormGroup {
    const selected1 = this.loanoptions.find(l => l.value === type);

    const selected = this.loanoptions.find((l: any) =>
      l.value === type || l.label === type || l.code === type
    );

    return this.fb.group({
      type: [selected?.label || type],
      showBank: [true],
      bankname: ['', Validators.required],
      outstanding: ['', Validators.required],
      emiamount: ['', Validators.required],
      remtenure: ['', Validators.required],
      title: ['']
    });
  }

  //credit card Liabilities
  createCreditcard(): FormGroup {
    return this.fb.group({
      creditcardbankName: ['', Validators.required],
      title: [''],
      ccoutstandingBalance: ['', Validators.required],
      cccreditLimit: ['', Validators.required],
    });
  }
  addCard() {
    this.creditcard.push(this.createCreditcard());
  }


  // bnpl Liabilities
  createBNPL(): FormGroup {
    return this.fb.group({
      bnplbankName: ['', Validators.required],
      outstandingBalance: ['', Validators.required],
      creditLimit: ['', Validators.required],
      monthlyEMI: ['', Validators.required],
      title: ['']
    });
  }
  addBNPL() {
    this.bnpl.push(this.createBNPL());
  }


  // other Liabilities
  createOther(): FormGroup {
    return this.fb.group({
      LiabilityType: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      libamount: ['', Validators.required],
      MonthlyRepaymentLimit: ['', Validators.required],
    });
  }
  addOther() {
    this.other.push(this.createOther());
  }

  // common function for adding new data

  addRow(arrayName: string, createFn: () => FormGroup) {
    const arr = this.getFormArray(arrayName);
    console.log(arr.length);
    const last = arr.at(arr.length - 1);

    arr.push(createFn());
    this.cd.detectChanges();
  }


  getbanks() {
    this.formSvc.getallBanks().subscribe((res: any) => {
      const list = res.data ?? res;

      this.selectBanks = list.map((s: any) => ({
        value: s.id,
        label: s.name,
        code: s.code
      }));

    });
  }

  onBankSelected(selectedId: any, fd: AbstractControl) {
    const fg = fd as FormGroup;

    const found = this.selectBanks.find(
      (b: Bank_lenderOption) => b.value === selectedId
    );
    const bankLabel = found?.label ?? '';
    this.selectedbakname = bankLabel;

    const titleCtrl = fg.get('title');

    if (bankLabel === 'Other') {
      titleCtrl?.setValidators([Validators.required]);
    } else {
      titleCtrl?.clearValidators();
      titleCtrl?.setValue('');
    }

    titleCtrl?.updateValueAndValidity();
  }

  //existing loan
  isOtherSelected(fd: AbstractControl): boolean {
    const selectedId = fd.get('bankname')?.value;
    const found = this.selectBanks.find(b => b.value === selectedId);
    return found?.label === 'Other';
  }

  //creditcard
  isOtherSelectedcc(fd: AbstractControl): boolean {
    const selectedId = fd.get('creditcardbankName')?.value;
    const found = this.selectBanks.find(b => b.value === selectedId);
    return found?.label?.toLowerCase() === 'other';
  }

  //bnpl
  isOtherSelectedbnpl(fd: AbstractControl): boolean {
    const selectedId = fd.get('bnplbankName')?.value;
    const found = this.selectLenders.find(b => b.value === selectedId);
    return found?.label?.toLowerCase() === 'other';
  }


  getlender() {
    this.formSvc.getalllenders().subscribe((res: any) => {
      const list = res.data ?? res;

      this.selectLenders = list.map((s: any) => ({
        value: s.id,
        label: s.lenderName,
        code: s.lenderName
      }));

    });
  }
  onlenderSelected(selectedId: any, fd: AbstractControl) {

    fd.get('bnplbankName')?.setValue(selectedId);

    const found = this.selectLenders.find(l => l.value === selectedId);
    const bankLabel = found?.label?.toLowerCase();

    const titleCtrl = fd.get('title');

    // const bankLabel = found?.label ?? '';
    // this.selectedlendername = bankLabel;


    if (bankLabel === 'other') {
      titleCtrl?.setValidators([Validators.required]);
    } else {
      titleCtrl?.clearValidators();
      titleCtrl?.setValue('');
    }

    titleCtrl?.updateValueAndValidity();
  }


  toggle(index: number) {
    if (this.openIndex.includes(index)) {
      this.openIndex = this.openIndex.filter(i => i !== index);
    } else {
      this.openIndex.push(index);
    }
    // this.cd.detectChanges();
  }

  submit() {
    if (this.liabilityForm.invalid) return;

    console.log(this.liabilityForm.value);
  }





  handleEmptyAccordion(type: 'loantype' | 'creditcard' | 'bnpl' | 'other') {
    let array: FormArray;
    let accKey: string;

    switch (type) {
      case 'loantype':
        array = this.loans;
        // accKey = 'Existing Loans';
        accKey = 'EXISTING_LOAN';
        break;
      case 'creditcard':
        array = this.creditcard;
        // accKey = 'Credit Card Outstanding';
        accKey = 'CREDIT_CARD_OUTSTANDING';
        break;
      case 'bnpl':
        array = this.bnpl;
        // accKey = 'Buy Now Pay Later (BNPL)';
        accKey = 'BNPL';
        break;
      case 'other':
        array = this.other;
        // accKey = 'Other Liabilities';

        accKey = 'OTHER_LIABILITY';

        break;
    }

    if (array && array.length === 0) {
      this.selectedliabilities = this.selectedliabilities.filter(k => k !== accKey);
      this.selectedliabilities = [...this.selectedliabilities];

      const accIndex = this.accordions.findIndex(a => a.key === accKey);
      if (accIndex !== -1) {
        this.openIndex = this.openIndex.filter(i => i !== accIndex);
      }
    }
  }



  alllibilitiy_type() {
    this.formSvc.getAllLiabilities().subscribe((res: any) => {
      const list = res.data ?? res;

      this.groupIdMap = list.reduce((acc: any, item: any) => {
        if (!acc[item.code]) {
          acc[item.code] = [];
        }
        acc[item.code].push(item.id);
        return acc;
      }, {});

      this.liabilitiesCatagories = list.map((a: any) => ({
        value: a.code,
        label: this.accordianTitle(a.code),
        code: a.code
      }));

      this.accordions = list.map((group: any) => ({
        title: this.accordianTitle(group.code),
        alwaysOpen: true,
        key: group.code
      }));

      this.liabilityCodeMap = list.reduce((acc: any, item: any) => {
        acc[item.code] = item.code;
        return acc;
      }, {});

      const savedData = this.isCoApplicant
        ? this.formSvc.co_liabilitiesInfoData
        : this.formSvc.liabilitiesInfoData;

      if (savedData) {
        this.patchLiabilitiesData(savedData);
      }

      this.cd.detectChanges();

    });


  }

  formatTitle(text: string): string {

    return text
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }
  accordianTitle(text: string) {

    switch (text) {
      case 'EXISTING_LOAN':
        return 'Existing Loans';
      case 'CREDIT_CARD_OUTSTANDING':
        return 'Credit Card Outstanding';
      case 'BNPL':
        return 'Buy Now Pay Later (BNPL)';
      case 'OTHER_LIABILITY':
        return 'Other Liabilities';
      case 'I_DONT_HAVE_LIABILITIES':
        return `I don't have liabilities`;
      default:
        return text;
    }
  }


  getloantype() {
    this.formSvc.getloan_type().subscribe((res: any) => {
      const list = res.data ?? res;
      this.loanoptions = list.map((s: any) => s.code);
      console.log("loanoptions", this.loanoptions);

      this.loanoptions = list.map((a: any) => ({
        value: a.id,
        label: a.name,
        code: a.code
      }));



    });
  }



  Selectedloanvalue(values: string | string[]) {
    const ids = Array.isArray(values) ? values : [values];
    const selected = this.loanoptions.filter(s => ids.includes(s.value));
    this.selectedloantypeLabel = selected.map(s => s.label).join(', ');
    console.log("selectedloantypeLabel:", this.selectedloantypeLabel);
  }

  calculateGrandTotal() {

    this.totalloans = this.calculateTotal('loans', 'outstanding');
    this.totalcc = this.calculateTotal('creditcard', 'ccoutstandingBalance');
    this.totalbnpl = this.calculateTotal('bnpl', 'outstandingBalance');
    this.totalother = this.calculateTotal('other', 'libamount');

    const total =
      this.totalloans +
      this.totalcc +
      this.totalbnpl +
      this.totalother;

    this.totalINRamt = this.formatIndian(total.toString());
  }

  calculateTotal(formArrayName: string, controlName: string): number {

    let total = 0;

    const formArray = this.liabilityForm.get(formArrayName) as FormArray;

    formArray.controls.forEach((grp: any) => {
      const val = grp.get(controlName)?.value;

      if (val) {
        const clean = Number(val.toString().replace(/,/g, ''));
        total += clean;
      }
    });

    return total;
  }

  handleAmountInput(event: any, controlName: string, ctrl?: any) {
    this.main.restrictInput(event, 'decimal');

    if (ctrl) {
      this.formatAmountfromarray(event, controlName, ctrl);
    } else {
      this.formatAmount(controlName);
    }

    setTimeout(() => {
      this.calculateGrandTotal();
    });


  }
  formatIndian2(x: string): string {
    const parts = x.split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1] ? '.' + parts[1].substring(0, 2) : '';

    if (!integerPart || integerPart === '0') return '0' + decimalPart;

    const bigIntValue = BigInt(integerPart);
    let str = bigIntValue.toString();
    let length = str.length;

    let groups: string[] = [];

    let lastGroup = str.substring(Math.max(0, length - 3), length);
    groups.unshift(lastGroup);

    let remaining = str.substring(0, Math.max(0, length - 3));
    for (let i = remaining.length; i > 0; i -= 2) {
      let start = Math.max(0, i - 2);
      let group = remaining.substring(start, i).replace(/^0+/, '') || '0';
      groups.unshift(group);
    }

    return groups.join(',') + decimalPart;
  }
  formatIndian(x: string): string {
    const parts = x.split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1] ? '.' + parts[1].substring(0, 2) : '';

    if (!integerPart) return '';

    const str = integerPart;
    const len = str.length;

    if (len <= 3) return str + decimalPart;

    const lastThree = str.slice(-3);
    let remaining = str.slice(0, -3);

    remaining = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',');

    return remaining + ',' + lastThree + decimalPart;
  }

  // Updated formatAmount - SAFE FOR LARGE NUMBERS
  formatAmount2(event: any, controlName: string) {
    let value = event.target.value;
    if (!value) {
      this.liabilityForm.get(controlName)?.setValue('');
      return;
    }

    value = value.replace(/,/g, '');
    value = value.replace(/[^0-9.]/g, '');
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }

    const decimalIndex = value.indexOf('.');
    if (decimalIndex !== -1 && value.length - decimalIndex > 3) {
      value = value.substring(0, decimalIndex + 3);
    }

    const formatted = this.formatIndian(value);
    this.liabilityForm.get(controlName)?.setValue(formatted, { emitEvent: false });
  }
  formatAmount(controlName: string) {

    const control = this.liabilityForm.get(controlName);
    if (!control) return;

    let value = control.value;

    if (!value) {
      control.setValue('', { emitEvent: false });
      return;
    }

    // remove commas & invalid chars
    value = value.toString().replace(/,/g, '').replace(/[^0-9.]/g, '');

    const parts = value.split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1] ? '.' + parts[1].slice(0, 2) : '';

    if (/^0+$/.test(integerPart)) {
      control.setValue(integerPart + decimalPart, { emitEvent: false });
      return;
    }

    const formatted = this.formatIndian(integerPart + decimalPart);

    control.setValue(formatted, { emitEvent: false });
  }

  // Updated formatAmountfromarray
  formatAmountfromarray(event: any, controlName: string, control: AbstractControl) {
    let value = event.target.value;
    if (!value) return;

    // Same cleaning logic
    value = value.replace(/,/g, '').replace(/[^0-9.]/g, '');
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }

    const decimalIndex = value.indexOf('.');
    if (decimalIndex !== -1 && value.length - decimalIndex > 3) {
      value = value.substring(0, decimalIndex + 3);
    }

    const formatted = this.formatIndian(value);

    if (control && (control as FormGroup)?.get(controlName)) {
      (control as FormGroup).get(controlName)?.setValue(formatted, { emitEvent: false });
    } else {
      this.liabilityForm.get(controlName)?.setValue(formatted, { emitEvent: false });
    }
  }

  //format amount 2000000 to 20,00,000
  formatAmount1(event: any, controlName: string) {
    let value = event.target.value;
    if (!value) return;
    value = value.replace(/,/g, '');
    value = value.replace(/[^0-9.]/g, '');
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }

    let integerPart = parts[0];
    let decimalPart = parts[1] ? '.' + parts[1] : '';

    let num = Number(value);
    const formatted = this.formatIndian(num.toString());
    this.liabilityForm.get(controlName)?.setValue(formatted, { emitEvent: false });


  }

  formatAmountfromarray1(event: any, controlName: string, control: AbstractControl) {
    const group = control as FormGroup;
    let value = event.target.value;

    if (!value) return;

    value = value.replace(/,/g, '');
    value = value.replace(/[^0-9.]/g, '');
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }

    let integerPart = parts[0];
    let decimalPart = parts[1] ? '.' + parts[1] : '';


    let num = Number(value);



    const formatted = this.formatIndian(num.toString());

    if (group) {
      group.get(controlName)?.setValue(formatted, { emitEvent: false });
    } else {
      this.liabilityForm.get(controlName)?.setValue(formatted, { emitEvent: false });
    }

  }


  formatIndian1(x: string): string {
    return new Intl.NumberFormat('en-IN').format(Number(x));
  }
  private getLoanTypeValue(savedType: string): string {
    if (!savedType) return '';

    const found = this.loanoptions.find((opt: any) =>
      opt.value === savedType ||
      opt.label === savedType ||
      opt.code === savedType
    );

    return found?.value || savedType;
  }

  convertFormToItems(formData: any) {
    const result: any = { items: [] };

    const clean = (v: any) =>
      v ? Number(v.toString().replace(/,/g, '')) : 0;

    formData.loans?.forEach((loan: any) => {
      result.items.push({
        liabilityType: 'EXISTING_LOAN',
        bankId: loan.bankname,
        outstandingBalanceInr: clean(loan.outstanding),
        emiAmountInr: clean(loan.emiamount),
        remainingTenureMonths: loan.remtenure,
        liabilityTypeText: loan.type,
        title: loan.title
      });
    });

    formData.creditcard?.forEach((c: any, i: number) => {
      result.items.push({
        liabilityType: 'CREDIT_CARD_OUTSTANDING',
        bankId: c.creditcardbankName,
        outstandingBalanceInr: clean(c.ccoutstandingBalance),
        creditLimitInr: clean(c.cccreditLimit),
        liabilityTypeText: `CC ${i + 1}`
      });
    });

    formData.bnpl?.forEach((b: any, i: number) => {
      result.items.push({
        liabilityType: 'BNPL',
        bankId: b.bnplbankName,
        outstandingBalanceInr: clean(b.outstandingBalance),
        creditLimitInr: clean(b.creditLimit),
        monthlyEmiInr: clean(b.monthlyEMI),
        liabilityTypeText: `BNPL ${i + 1}`
      });
    });

    formData.other?.forEach((o: any) => {
      result.items.push({
        liabilityType: 'OTHER_LIABILITY',
        liabilityTypeText: o.LiabilityType,
        amountInr: clean(o.libamount),
        monthlyRepaymentInr: clean(o.MonthlyRepaymentLimit)
      });
    });

    return result;
  }

  // edit flow = patch from summary
  async patchFromSummary() {
    const section = await this.getSummarySection('liabilities');
    const data = this.normalizeLiabilities(section);

    if (!data) return;

    if (this.isCoApplicant) {
      this.formSvc.co_liabilitiesInfoData = data;
    } else {
      this.formSvc.liabilitiesInfoData = data;
    }

    this.patchLiabilitiesData(data);

    const snapshot = this.buildLiabilityPayloadWithApplicantId();

    this.lastSavedPayload = snapshot.invalid
      ? null
      : this.normalizeLiabilityPayload({
        applicantId: snapshot.applicantId,
        items: snapshot.items
      });

    this.calculateGrandTotal();
    this.cd.detectChanges();
  }
  findId(list: any[], value: any) {
    if (!value || !list?.length) return '';

    const normalize = (v: any) =>
      v?.toString()
        .trim()
        .toLowerCase()
        .replace(/\./g, '')
        .replace(/\s+/g, ' ')
        .replace(/limited/g, 'ltd');

    const input = normalize(value);

    const byId = list.find(x => x.value === value);
    if (byId) return byId.value;

    const exact = list.find(x => normalize(x.label) === input);
    if (exact) return exact.value;

    const partial = list.find(x =>
      normalize(x.label).includes(input) ||
      input.includes(normalize(x.label))
    );

    return partial?.value || '';
  }
  normalizeLiabilityPayload(payload: any) {
    return {
      applicantId: payload?.applicantId || this.getApiApplicantId(),
      items: (payload?.items || [])
        .map((item: any) => ({
          liabilityType: item.liabilityType || '',
          bankId: item.bankId || '',
          outstandingBalanceInr: Number(item.outstandingBalanceInr || 0),
          emiAmountInr: Number(item.emiAmountInr || 0),
          remainingTenureMonths: item.remainingTenureMonths || '',
          creditLimitInr: Number(item.creditLimitInr || 0),
          monthlyEmiInr: Number(item.monthlyEmiInr || 0),
          liabilityTypeText: item.liabilityTypeText || '',
          amountInr: Number(item.amountInr || 0),
          monthlyRepaymentInr: Number(item.monthlyRepaymentInr || 0),
          title: item.title || ''
        }))
        .sort((a: any, b: any) =>
          `${a.liabilityType}-${a.liabilityTypeText}-${a.bankId}`
            .localeCompare(`${b.liabilityType}-${b.liabilityTypeText}-${b.bankId}`)
        )
    };
  }

  patchLiabilitiesData(inputData?: any) {
    this.isPatching = true;

    let data = inputData || (this.isCoApplicant
      ? this.formSvc.co_liabilitiesInfoData
      : this.formSvc.liabilitiesInfoData);


    if (data && !data.items) {
      data = this.convertFormToItems(data);
    }

    if (!data || !data.items) return;

    const items = data.items;

    this.selectedliabilities = [];
    this.selectedloantype = [];
    this.loans.clear();
    this.creditcard.clear();
    this.bnpl.clear();
    this.other.clear();

    const loansArray = this.fb.array([]);
    const creditcardArray = this.fb.array([]);
    const bnplArray = this.fb.array([]);
    const otherArray = this.fb.array([]);


    items.forEach((item: any) => {


      if (item.liabilityType === 'EXISTING_LOAN' || item.liabilityType === 'loans') {

        this.selectedliabilities.push('EXISTING_LOAN');

        //  this is the child dropdown value
        const loanTypeValue = this.getLoanTypeValue(item.liabilityTypeText);

        //  patch selected loan type dropdown
        if (loanTypeValue) {
          this.selectedloantype.push(loanTypeValue);
        }

        const selectedLoan = this.loanoptions.find((opt: any) =>
          opt.value === loanTypeValue ||
          opt.label === item.liabilityTypeText ||
          opt.code === item.liabilityTypeText
        );

        const group = this.createLoan(loanTypeValue);

        group.patchValue({
          type: selectedLoan?.label || item.liabilityTypeText,
          showBank: true,

          //  saved key is bankId, not bankName
          bankname: item.bankId,

          outstanding: this.formatIndian(item.outstandingBalanceInr?.toString() || '0'),
          emiamount: this.formatIndian(item.emiAmountInr?.toString() || '0'),
          remtenure: item.remainingTenureMonths,
          title: item.title || ''
        });

        this.loans.push(group);
      }
      // ---------------- CREDIT_CARD_OUTSTANDING ----------------

      if (item.liabilityType === 'CREDIT_CARD_OUTSTANDING' || item.liabilityType === 'creditcard') {

        this.selectedliabilities.push('CREDIT_CARD_OUTSTANDING');

        const group = this.createCreditcard();

        group.patchValue({
          creditcardbankName: item.bankId,
          ccoutstandingBalance: this.formatIndian(item.outstandingBalanceInr.toString()),
          cccreditLimit: this.formatIndian(item.creditLimitInr.toString()),
          title: item.title || ''

        });

        this.creditcard.push(group);
        // creditcardArray.push(group)
      }

      // ---------------- BNPL ----------------
      if (item.liabilityType === 'BNPL' || item.liabilityType === 'bnpl') {

        this.selectedliabilities.push('BNPL');

        const group = this.createBNPL();

        group.patchValue({
          bnplbankName: item.bankId,
          outstandingBalance: this.formatIndian(item.outstandingBalanceInr.toString()),
          creditLimit: this.formatIndian(item.creditLimitInr.toString()),
          monthlyEMI: this.formatIndian(item.monthlyEmiInr.toString()),
          title: item.title || ''
        });

        this.bnpl.push(group);
      }

      // ---------------- OTHER ----------------
      if (item.liabilityType === 'OTHER_LIABILITY' || item.liabilityType === 'other') {

        this.selectedliabilities.push('OTHER_LIABILITY');

        const group = this.createOther();

        group.patchValue({
          LiabilityType: item.liabilityTypeText,
          libamount: this.formatIndian(item.amountInr.toString()),
          MonthlyRepaymentLimit: this.formatIndian(item.monthlyRepaymentInr.toString())
        });

        this.other.push(group);
      }

    });

    this.selectedliabilities = [...new Set(this.selectedliabilities)];

    this.openIndex = [];
    this.selectedliabilities.forEach(val => {
      const index = this.accordions.findIndex(a => a.key === val);
      if (index !== -1) {
        this.openIndex.push(index);
      }
    });

    if (this.creditcard.length === 0) this.creditcard.push(this.createCreditcard());
    if (this.bnpl.length === 0) this.bnpl.push(this.createBNPL());
    if (this.other.length === 0) this.other.push(this.createOther());
    this.liabilityForm.updateValueAndValidity();
    this.cd.detectChanges();

    this.isPatching = false;
  }
  back() {
    this.stepperService.previous();
  }

  get isNextDisabled(): boolean {

    if (this.hasNoLiabilitiesSelected) {
      return false;
    }

    if (!this.selectedliabilities?.length) {
      return true;
    }

    return !(
      this.hasValidLoans() ||
      this.hasValidCreditCards() ||
      this.hasValidBNPL() ||
      this.hasValidOther()
    );
  }

  private hasValidLoans(): boolean {
    return this.loans.controls.some(c =>
      c.get('outstanding')?.valid &&
      c.get('bankname')?.valid
    );
  }

  private hasValidCreditCards(): boolean {
    return this.creditcard.controls.some(c =>
      c.get('ccoutstandingBalance')?.valid &&
      c.get('creditcardbankName')?.valid
    );
  }

  private hasValidBNPL(): boolean {
    return this.bnpl.controls.some(c =>
      c.get('outstandingBalance')?.valid &&
      c.get('bnplbankName')?.valid
    );
  }

  private hasValidOther(): boolean {
    return this.other.controls.some(c =>
      c.get('libamount')?.valid &&
      c.get('LiabilityType')?.valid &&
      c.get('MonthlyRepaymentLimit')?.valid
    );
  }



  // 1. onLoanChange - COMPLETE REBUILD

  onLoanChange(values: string | string[]): void {
    const groups = Array.isArray(values) ? values : [values];


    if (values && (Array.isArray(values) ? values.length : true)) {
      this.loanerror = false;
    }


    this.selectedloantype = groups;

    const loanArray = this.loans;

    // Get currently existing loan types in form
    const existingTypes: string[] = loanArray.controls.map((ctrl: any) => {
      const label = ctrl.get('type')?.value;
      const opt = this.loanoptions.find(o => o.label === label);
      return opt ? opt.value : label;
    });

    // 1. REMOVE loans that are no longer selected
    for (let i = loanArray.length - 1; i >= 0; i--) {
      const ctrl = loanArray.at(i);
      const label = ctrl.get('type')?.value;
      const opt = this.loanoptions.find(o => o.label === label);
      const typeId = opt ? opt.value : label;

      if (!groups.includes(typeId)) {
        loanArray.removeAt(i);
      }
    }

    // 2. ADD newly selected loans (preserve existing ones)
    groups.forEach(typeId => {
      if (!existingTypes.includes(typeId)) {
        const selectedOption = this.loanoptions.find(opt => opt.value === typeId);
        const loanGroup = this.createLoan(selectedOption?.label || typeId);
        loanGroup.get('showBank')?.setValue(true);
        loanArray.push(loanGroup);
      }
    });

    this.calculateGrandTotal();
    this.cd.detectChanges();
  }

  removeAccordion(acc: any, index: number, $event: Event) {
    $event.stopPropagation();
    $event.preventDefault();

    console.log(acc, index);

    let accArr: any = [];

    if (this.summaryFieldMap?.[acc?.key]) {
      this.summarySection[this.summaryFieldMap[acc.key].keyName].forEach((item: any) => {
        accArr.push(item.id);
      });
    }

    this.msgBox.open({
      title: 'Are you sure want to Remove',
      message: ``,
      showCancel: true, okText:'Yes',
      onOk: () => {
        const key = acc.key;
        const title = acc.title;

        this.selectedliabilities = this.selectedliabilities.filter(k => k !== key && k !== title);
        this.openIndex = this.openIndex.filter(i => i !== index);

        if (title.includes('Existing') || key.includes('Existing')) {
          this.loans.clear();
          this.selectedloantype = [];
          if (this.selectedliabilities.some(k => k.includes('Existing'))) {
            this.loans.push(this.createLoan(''));
          }
        } else if (title.includes('Credit') || key.includes('Credit')) {
          this.creditcard.clear();
          if (this.selectedliabilities.some(k => k.includes('Credit'))) {
            this.creditcard.push(this.createCreditcard());
          }
        } else if (title.includes('Buy') || key.includes('BNPL')) {
          this.bnpl.clear();
          if (this.selectedliabilities.some(k => k.includes('BNPL'))) {
            this.bnpl.push(this.createBNPL());
          }
        } else if (title.includes('Other') || key.includes('Other')) {
          this.other.clear();
          if (this.selectedliabilities.some(k => k.includes('Other'))) {
            this.other.push(this.createOther());
          }
        }

        this.calculateGrandTotal();

        if (accArr) {
          this.deleteItemArr(accArr);
        }

        this.cd.detectChanges();
      }
    });
  }



  // 2. removeitem - FULL LOAN RESET
  removeitem(index: number, type: 'loantype' | 'creditcard' | 'bnpl' | 'other') {
    let item: any = {};
    if (this.summarySection?.existingLoans && type === 'loantype') {
      item = this.summarySection.existingLoans[index];
    }
    if (this.summarySection?.creditCardOutstanding && type === 'creditcard') {
      item = this.summarySection.creditCardOutstanding[index];
    }
    if (this.summarySection?.bnpl && type === 'bnpl') {
      item = this.summarySection.bnpl[index];
    }
    if (this.summarySection?.otherLiabilities && type === 'other') {
      item = this.summarySection.otherLiabilities[index];
    }

    this.msgBox.open({
      title: 'Are you sure want to Remove',
      message: ``,
      showCancel: true, okText:'Yes',
      onOk: () => {
        switch (type) {
          case 'loantype':
            this.loans.removeAt(index);
            this.resetLoanDropdownState();

            break;

          case 'creditcard':
            this.creditcard.removeAt(index);
            break;
          case 'bnpl':
            this.bnpl.removeAt(index);
            break;
          case 'other':
            this.other.removeAt(index);
            break;
        }
        this.checkAndDeselectEmptyArray(type);
        this.calculateGrandTotal();

        if (item) {
          this.deleteItemArr([item.id]);
        }

        this.cd.detectChanges();
      }
    });
  }

  deleteItemArr(idArr: any) {
    this.formSvc.deleteLiability({
      applicationId: this.applicationId,
      applicantId: this.applicantId,
      ids: idArr
    }).subscribe({
      next: (res) => {
        console.log(res);
      },
      error: (error) => {
        console.log(error);
      }
    });
  }


  // 3. NEW METHOD - RESET DROPDOWN STATE
  resetLoanDropdownState() {
    const currentLoanTypes = this.loans.controls
      .map((control: any) => {
        const typeLabel = control.get('type')?.value;
        const option = this.loanoptions.find(opt => opt.label === typeLabel);
        return option ? option.value : typeLabel;
      })
      .filter(Boolean);

    this.selectedloantype = [...currentLoanTypes];

    this.cd.detectChanges();
  }

  // 4. onChange - Handle Existing Loans properly



  onChange(values: string | string[]): void {
    let selectedCodes = Array.isArray(values) ? [...values] : [values];

    this.liabilitiesCatagories.forEach((item: any) => {
      item.disabled = false;
    });

    const hasNoLiabilities = selectedCodes.find((item: any) => item === this.NO_LIABILITY_CODE);

    const totalLiability = this.liabilitiesCatagories.length;

    this.liabilitiesCatagories.forEach((item: any) => {
      if (
        (!hasNoLiabilities && selectedCodes.length === totalLiability - 1) ||
        (hasNoLiabilities && selectedCodes.length === totalLiability)
      ) {
        item.disabled = item.value === this.NO_LIABILITY_CODE;

      } else if (hasNoLiabilities) {
        item.disabled = item.value !== this.NO_LIABILITY_CODE;

      } else {
        item.disabled = false;
      }
    });

    // If "No liabilities" is selected together with any real liability,
    // remove "No liabilities".

    // const hasRealLiability = selectedCodes.some(code =>
    //   this.REAL_LIABILITY_CODES.includes(code)
    // );

    // if (selectedCodes.includes(this.NO_LIABILITY_CODE) && hasRealLiability) {
    //   selectedCodes = selectedCodes.filter(code => code !== this.NO_LIABILITY_CODE);
    // }

    let realLiab = selectedCodes.filter(
      x => x !== this.NO_LIABILITY_CODE
    );


    const allRealLiabSelected = this.REAL_LIABILITY_CODES.every(asset =>
      realLiab.includes(asset)
    );

    if (allRealLiabSelected) {
      realLiab = [...this.REAL_LIABILITY_CODES];
      this.selectedliabilities = realLiab;

      // initialize accordions/forms for all real assets
      this.selectedliabilities.forEach(key => {
        const config = this.fieldMap[key];
        if (!config) return;

        const control = this.liabilityForm.get(config.form);

        if (control instanceof FormArray && control.length === 0) {
          if (key === 'CREDIT_CARD_OUTSTANDING') control.push(this.createCreditcard());
          if (key === 'BNPL') control.push(this.createBNPL());
          if (key === 'OTHER_LIABILITY') control.push(this.createOther());
        }
      });

      this.openIndex = this.selectedliabilities
        .map(val => this.accordions.findIndex(a => a.key === val))
        .filter(i => i !== -1);

      this.calculateGrandTotal();
      this.cd.detectChanges();
      return;
    }

    // If only "No liabilities" is selected
    if (hasNoLiabilities) {
      this.selectedliabilities = [this.NO_LIABILITY_CODE];
      this.selectedloantype = [];
      this.openIndex = [];

      this.loans.clear();
      this.creditcard.clear();
      this.bnpl.clear();
      this.other.clear();

      this.calculateGrandTotal();
      this.cd.detectChanges();
      return;
    }

    // Normal liabilities flow
    this.selectedliabilities = selectedCodes.filter(
      code => code !== this.NO_LIABILITY_CODE
    );

    const mapping: any = {
      'EXISTING_LOAN': { array: this.loans, createFn: () => this.createLoan('') },
      'CREDIT_CARD_OUTSTANDING': { array: this.creditcard, createFn: () => this.createCreditcard() },
      'BNPL': { array: this.bnpl, createFn: () => this.createBNPL() },
      'OTHER_LIABILITY': { array: this.other, createFn: () => this.createOther() }
    };

    Object.keys(mapping).forEach(code => {
      const { array, createFn } = mapping[code];
      const isSelected = this.selectedliabilities.includes(code);

      if (isSelected) {
        if (array.length === 0) {
          if (code !== 'EXISTING_LOAN') {
            array.push(createFn());
          }
        }
      } else {
        array.clear();
        if (code === 'EXISTING_LOAN') {
          this.selectedloantype = [];
        }
      }
    });

    this.openIndex = this.selectedliabilities
      .map(code => this.accordions.findIndex(acc => acc.key === code))
      .filter(i => i !== -1);

    this.calculateGrandTotal();
    this.cd.detectChanges();
  }
  // 5 checkAndDeselectEmptyArray
  checkAndDeselectEmptyArray(type: 'loantype' | 'creditcard' | 'bnpl' | 'other') {
    let isEmpty = false;
    let accKey = '';

    switch (type) {
      case 'loantype':
        isEmpty = this.loans.length === 0;
        // accKey = 'ExistingLoans';
        accKey = 'EXISTING_LOAN';
        break;
      case 'creditcard':
        isEmpty = this.creditcard.length === 0;
        // accKey = 'CreditCardOutstanding';
        accKey = 'CREDIT_CARD_OUTSTANDING';
        break;
      case 'bnpl':
        isEmpty = this.bnpl.length === 0;
        // accKey = 'BuyNowPayLater';
        accKey = 'BNPL';
        break;
      case 'other':
        isEmpty = this.other.length === 0;
        // accKey = 'OtherLiabilities';

        accKey = 'OTHER_LIABILITY';

        break;
    }

    // FIX: If empty, remove from selectedliabilities
    if (isEmpty) {
      this.selectedliabilities = this.selectedliabilities.filter(k => k !== accKey);

      // Close accordion
      const accIndex = this.accordions.findIndex(a => a.key === accKey || a.title.includes(accKey));
      if (accIndex !== -1) {
        this.openIndex = this.openIndex.filter(i => i !== accIndex);
      }
    }
  }

  //get saved data from api
  getSavedLiability(applicantId: any): Promise<any> {
    return new Promise((resolve) => {
      this.formSvc.getSavedData(
        this.applicationId,
        applicantId,
        "SAVE_LIABILITIES"
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


        if (this.hasNoLiabilitiesSelected) {
          const input = {
            applicantId: this.getApiApplicantId(),
            items: []
          };

          // localStorage.setItem(this.getStorageKey(), JSON.stringify(input));
          this.storageservice.saveSectionData(
            'liabilitiesinfoData',
            this.applicationId,
            this.applicantId,
            this.isCoApplicant,
            (input)
          );

          if (this.isCoApplicant) {
            this.formSvc.co_liabilitiesInfoData = input;
          } else {
            this.formSvc.liabilitiesInfoData = input;
          }

          const inputdata = {
            action: 'auto-save',
            sectionKey: 'SAVE_LIABILITIES',
            applicationId: this.applicationId,
            applicantId: this.getApiApplicantId(),
            jsonData: input
          };

          this.formSvc.saveandExit(inputdata).subscribe({
            next: () => {
              this.lastSavedPayload = { ...input };
            },
            error: (err) => {
              console.error('Liabilities saveExit error:', err);
            }
          });

          return;
        }

        // const result = this.buildLiabilityPayloadWithApplicantId();
        const result = this.buildDraftLiabilityPayloadWithApplicantId();
        if (result.invalid) return;

        const input = { items: result.items, applicantId: result.applicantId, };


        const key = this.getStorageKey();
        // localStorage.setItem(key, JSON.stringify(input));
        this.storageservice.saveSectionData(
          'liabilitiesinfoData',
          this.applicationId,
          this.applicantId,
          this.isCoApplicant,
          (input)
        );

        if (this.isCoApplicant) {
          this.formSvc.co_liabilitiesInfoData = input;
        } else {
          this.formSvc.liabilitiesInfoData = input;
        }

        const applicantId = this.getApiApplicantId();

        if (!applicantId) {
          console.error('ApplicantId not found for photo upload');
          return;
        }

        const inputdata = {
          action: "auto-save",
          sectionKey: "SAVE_LIABILITIES",
          applicationId: this.applicationId,
          applicantId: applicantId,
          jsonData: input
        };

        this.formSvc.saveandExit(inputdata).subscribe({
          next: () => {
            this.lastSavedPayload = { ...input };
          },

          error: (err) => {
            console.error('Liabilities saveExit error:', err);
          }

        });
        this.router.navigate(['/admin/losoperation']);
      }
    });
  }
  buildLiabilityPayload(): {
    invalid: boolean;
    items: any[];
    applicantId?: any;
  } {
    let form = this.liabilityForm.getRawValue();
    const items: any[] = [];
    this.loanerror = false;
    let invalid = false;

    const addItem = (code: string, value: any, extra: any = null) => {
      if (!value) return;

      items.push({
        assetItemMasterId: this.liabilityCodeMap[code],
        valueInr: Number(value),
        ...extra
      });
    };

    const cleanAmount = (val: any) =>
      val ? Number(val.toString().replace(/,/g, '')) : 0;

    const markInvalid = (path: string) => {
      this.liabilityForm.get(path)?.markAsTouched();
      invalid = true;

    };

    //  EXISTING LOANS
    // if (this.selectedliabilities.some((l: any) => l.code === 'EXISTING_LOAN')) {
    if (this.selectedliabilities.includes('EXISTING_LOAN')) {

      if (this.loans.length === 0) {
        invalid = true;

        this.loanerror = true;
      } else {
        this.loanerror = false;
      }

      this.loans.controls.forEach((loan: any) => {
        if (loan.invalid) {
          loan.markAllAsTouched();
          invalid = true;
        } else {
          items.push({
            liabilityType: "EXISTING_LOAN",
            bankId: loan.value.bankname,
            ...(this.isOtherSelected(loan) && { title: loan.value.title }),
            outstandingBalanceInr: cleanAmount(loan.value.outstanding),
            emiAmountInr: cleanAmount(loan.value.emiamount),
            remainingTenureMonths: loan.value.remtenure,
            liabilityTypeText: loan.value.type,
            liabilityId: this.liabilityCodeMap["EXISTING_LOAN"],
          });
        }
      });
    }

    //  CREDIT CARD
    // if (this.selectedliabilities.some((l: any) => l.code === 'CREDIT_CARD_OUTSTANDING')) {
    if (this.selectedliabilities.includes('CREDIT_CARD_OUTSTANDING')) {
      if (this.creditcard.length === 0) invalid = true;

      this.creditcard.controls.forEach((card: any, index: number) => {
        if (card.invalid) {
          card.markAllAsTouched();
          invalid = true;
        } else {
          items.push({
            liabilityType: 'CREDIT_CARD_OUTSTANDING',
            bankId: card.value.creditcardbankName,
            ...(this.isOtherSelectedcc(card) && { title: card.value.title }),
            outstandingBalanceInr: cleanAmount(card.value.ccoutstandingBalance),
            creditLimitInr: cleanAmount(card.value.cccreditLimit),
            liabilityTypeText: `CREDIT_CARD_OUTSTANDING ${index + 1}`,
            liabilityId: this.liabilityCodeMap["CREDIT_CARD_OUTSTANDING"],
          });
        }
      });
    }

    //  BNPL
    // if (this.selectedliabilities.some((l: any) => l.code === 'BNPL')) {
    if (this.selectedliabilities.includes('BNPL')) {
      if (this.bnpl.length === 0) invalid = true;

      this.bnpl.controls.forEach((bnpl: any, index: number) => {
        if (bnpl.invalid) {
          bnpl.markAllAsTouched();
          invalid = true;
        } else {
          items.push({
            liabilityType: 'BNPL',
            bankId: bnpl.value.bnplbankName,
            outstandingBalanceInr: cleanAmount(bnpl.value.outstandingBalance),
            creditLimitInr: cleanAmount(bnpl.value.creditLimit),
            monthlyEmiInr: cleanAmount(bnpl.value.monthlyEMI),
            ...(this.isOtherSelectedbnpl(bnpl) && { title: bnpl.value.title }),
            liabilityTypeText: `BNPL ${index + 1}`,
            liabilityId: this.liabilityCodeMap["BNPL"],
          });
        }
      });
    }

    //  OTHER
    if (this.selectedliabilities.includes('OTHER_LIABILITY')) {
      if (this.other.length === 0) invalid = true;

      this.other.controls.forEach((other: any, index: number) => {
        if (other.invalid) {
          other.markAllAsTouched();
          invalid = true;
        } else {
          items.push({
            liabilityType: "OTHER_LIABILITY",
            liabilityTypeText: other.value.LiabilityType,
            amountInr: cleanAmount(other.value.libamount),
            monthlyRepaymentInr: cleanAmount(other.value.MonthlyRepaymentLimit),
            liabilityId: this.liabilityCodeMap["OTHER_LIABILITY"],

          });
        }
      });
    }



    if (invalid) {
      return { invalid: true, items: [] };
    }

    const applicantId = this.getApiApplicantId();



    return {
      invalid: false,
      items,
      applicantId: applicantId,
    };

  }
  //draft payload for saveexit
  buildDraftLiabilityPayloadWithApplicantId(): {
    invalid: boolean;
    applicantId?: any;
    items: any[];
  } {
    const items: any[] = [];

    const cleanAmount = (val: any) =>
      val ? Number(val.toString().replace(/,/g, '')) : 0;

    // EXISTING LOANS
    if (this.selectedliabilities.includes('EXISTING_LOAN')) {
      this.loans.controls.forEach((loan: any) => {
        const row = loan.getRawValue();

        if (this.hasAnyValue(row, ['type', 'bankname', 'title', 'outstanding', 'emiamount', 'remtenure'])) {
          items.push({
            liabilityType: 'EXISTING_LOAN',
            bankId: row.bankname || '',
            ...(row.title ? { title: row.title } : {}),
            outstandingBalanceInr: cleanAmount(row.outstanding),
            emiAmountInr: cleanAmount(row.emiamount),
            remainingTenureMonths: row.remtenure || '',
            liabilityTypeText: row.type || ''
          });
        }
      });
    }

    // CREDIT CARD
    if (this.selectedliabilities.includes('CREDIT_CARD_OUTSTANDING')) {
      this.creditcard.controls.forEach((card: any, index: number) => {
        const row = card.getRawValue();

        if (this.hasAnyValue(row, ['creditcardbankName', 'title', 'ccoutstandingBalance', 'cccreditLimit'])) {
          items.push({
            liabilityType: 'CREDIT_CARD_OUTSTANDING',
            bankId: row.creditcardbankName || '',
            ...(row.title ? { title: row.title } : {}),
            outstandingBalanceInr: cleanAmount(row.ccoutstandingBalance),
            creditLimitInr: cleanAmount(row.cccreditLimit),
            liabilityTypeText: `CREDIT_CARD_OUTSTANDING ${index + 1}`
          });
        }
      });
    }

    // BNPL
    if (this.selectedliabilities.includes('BNPL')) {
      this.bnpl.controls.forEach((bnpl: any, index: number) => {
        const row = bnpl.getRawValue();

        if (this.hasAnyValue(row, ['bnplbankName', 'title', 'outstandingBalance', 'creditLimit', 'monthlyEMI'])) {
          items.push({
            liabilityType: 'BNPL',
            bankId: row.bnplbankName || '',
            ...(row.title ? { title: row.title } : {}),
            outstandingBalanceInr: cleanAmount(row.outstandingBalance),
            creditLimitInr: cleanAmount(row.creditLimit),
            monthlyEmiInr: cleanAmount(row.monthlyEMI),
            liabilityTypeText: `BNPL ${index + 1}`
          });
        }
      });
    }

    // OTHER LIABILITY
    if (this.selectedliabilities.includes('OTHER_LIABILITY')) {
      this.other.controls.forEach((other: any) => {
        const row = other.getRawValue();

        if (this.hasAnyValue(row, ['LiabilityType', 'libamount', 'MonthlyRepaymentLimit'])) {
          items.push({
            liabilityType: 'OTHER_LIABILITY',
            liabilityTypeText: row.LiabilityType || '',
            amountInr: cleanAmount(row.libamount),
            monthlyRepaymentInr: cleanAmount(row.MonthlyRepaymentLimit)
          });
        }
      });
    }

    return {
      invalid: false,
      applicantId: this.getApiApplicantId(),
      items
    };
  }

  private hasAnyValue(row: any, keys: string[]): boolean {
    return keys.some(key => {
      const val = row?.[key];
      return val !== null && val !== undefined && val !== '';
    });
  }
  buildLiabilityPayloadWithApplicantId(): {
    invalid: boolean;
    applicantId?: any;
    items: any[];
  } {
    const result = this.buildLiabilityPayload();

    if (!result || result.invalid) {
      return {
        invalid: true,
        items: []
      };
    }

    const applicantId = this.getApiApplicantId();

    // if (!applicantId) {
    //   console.error('ApplicantId not found for photo upload');
    //   return;
    // }

    return {
      invalid: false,
      applicantId: applicantId,
      items: result.items
    };
  }

  //compare function
  isPayloadChanged(current: any, saved: any) {
    return JSON.stringify(current) !== JSON.stringify(saved);
  }
  getStepRoute() {
    return this.isCoApplicant ? 'co-liabilitiesinfo' : 'liabilitiesinfo';
  }
  get hasNoLiabilitiesSelected(): boolean {
    return this.selectedliabilities?.includes(this.NO_LIABILITY_CODE);
  }

  next() {


    if (this.hasNoLiabilitiesSelected) {
      const payload = {
        applicantId: this.getApiApplicantId(),
        items: [],
        noLiabilities: true
      };

      this.msgBox.open({
        title: "Are you sure you don't  want to add any Liabilities?",
        message: ``,
        showCancel: true,
        okText: 'Yes, Update',
        onOk: () => {
          this.formSvc.noLiabilitiesSelected({ "hasLiabilities": true }, this.applicationId, this.applicantId).subscribe({
            next: (res) => {
              if (res.status == "success") {
                console.log(res);

                this.lastSavedPayload = this.normalizeLiabilityPayload(payload);

                if (this.isCoApplicant) {
                  this.formSvc.co_liabilitiesInfoData = payload;
                } else {
                  this.formSvc.liabilitiesInfoData = payload;
                }

                // localStorage.setItem(this.getStorageKey(), JSON.stringify(payload));
                this.storageservice.saveSectionData(
                  'liabilitiesinfoData',
                  this.applicationId,
                  this.applicantId,
                  this.isCoApplicant,
                  (payload)
                );
                const draftPayload = {
                  action: 'auto-save',
                  sectionKey: 'SAVE_LIABILITIES',
                  applicationId: this.applicationId,
                  applicantId: this.getApiApplicantId(),
                  jsonData: payload
                };

                this.formSvc.saveandExit(draftPayload).subscribe({
                  next: () => {
                    const stepRoute = this.getStepRoute();
                    this.stepperService.markStepCompleted(stepRoute);
                    this.stepperService.setStepData(stepRoute, this.liabilityForm.getRawValue());
                    this.stepperService.next();
                  },
                  error: err => {
                    console.error('Failed to clear liability draft:', err);
                  }
                });
                const stepRoute = this.getStepRoute();
                this.stepperService.markStepCompleted(stepRoute);
                this.stepperService.setStepData(stepRoute, this.liabilityForm.getRawValue());
                // this.stepperService.next();
              }
            },
            error: (err) => {
              console.log(err);
            }
          });
        },
        onCancel: () => {
          return;
        }
      });
      return;
    }

    const result = this.buildLiabilityPayloadWithApplicantId();

    if (result.invalid) {
      console.log('Form invalid - stop navigation');
      return;
    }


    const payload = { items: result.items, applicantId: result.applicantId, };

    const currentPayload = this.normalizeLiabilityPayload(payload);

    const hasChanged =
      !this.lastSavedPayload ||
      JSON.stringify(currentPayload) !== JSON.stringify(this.lastSavedPayload);

    const stepRoute = this.getStepRoute();

    if (!hasChanged && !this.loadedFromSaveExit) {
      console.log('No changes, skip API');
      this.stepperService.markStepCompleted(stepRoute);
      this.stepperService.setStepData(stepRoute, this.liabilityForm.getRawValue());
      this.stepperService.next();
      return;
    }

    this.formSvc.submitliability(payload, this.applicationId, false).pipe().subscribe({
      next: (res) => {
        console.log("resp---", res);
        if (res.status == "success") {
          // this.lastSavedPayload = { ...payload };
          this.lastSavedPayload = currentPayload;
          this.liabilityForm.markAsPristine();

          if (this.isCoApplicant) {
            this.formSvc.co_liabilitiesInfoData = payload;
          } else {
            this.formSvc.liabilitiesInfoData = payload;
          }


          // const key = this.getStorageKey();
          // localStorage.setItem(key, JSON.stringify(payload));
          this.storageservice.saveSectionData(
            'liabilitiesinfoData',
            this.applicationId,
            this.applicantId,
            this.isCoApplicant,
            (payload)
          );
          this.stepperService.markStepCompleted(stepRoute);
          this.stepperService.setStepData(stepRoute, this.liabilityForm.getRawValue());
          this.stepperService.next();
        }
      },
      // error: (err) => {
      //   console.error('Submit failed:', err);
      // }
    });
  }


  //edit from summary enable and disbale

 enableForm(): void {
  if (this.isDataLoading) {
    return;
  }

  this.originalFormValue =
    this.liabilityForm.getRawValue();

  this.isViewMode = false;
  this.isEditMode = true;
  this.viewOnly = false;

  this.liabilityForm.enable({
    emitEvent: false
  });

  this.cd.detectChanges();
}

  cancelSummaryEdit() {
    if (this.isEditMode && this.originalFormValue) {
      this.liabilityForm.patchValue(this.originalFormValue);
    }

    this.isViewMode = false;
    this.isEditMode = true;
    this.liabilityForm.disable();
  }

  saveSummaryEdit() {
    const result = this.buildLiabilityPayloadWithApplicantId();

    if (result.invalid) {
      console.log('Form invalid - stop navigation');
      return;
    }


    const input = { applicantId: result.applicantId, items: result.items };


    if (this.hasNoLiabilitiesSelected) {
      this.msgBox.open({
        title: "Are you sure you don't  want to add any Liabilities?",
        message: ``,
        showCancel: true,
        okText: 'Yes, Update',
        onOk: () => {
          this.formSvc.noLiabilitiesSelected({ "hasLiabilities": true }, this.applicationId, this.applicantId).subscribe({
            next: (res) => {
              if (res.status == "success") {
                console.log(res);
                const key = this.getStorageKey();
                localStorage.setItem(key, JSON.stringify(input));

                if (this.isCoApplicant) {
                  this.formSvc.liabilitiesInfoData = input;
                } else {
                  this.formSvc.co_liabilitiesInfoData = input;
                }

                this.lastSavedPayload = { ...input };

                this.editSuccess = true;
              }
            }
          })
        },
        onCancel: () => {
          return;
        }
      })

      return;
    }

    this.formSvc.submitliability(input, this.applicationId, false).subscribe({
      next: (res: any) => {
        if (res.status === 'success') {
          const key = this.getStorageKey();
          localStorage.setItem(key, JSON.stringify(input));

          if (this.isCoApplicant) {
            this.formSvc.liabilitiesInfoData = input;
          } else {
            this.formSvc.co_liabilitiesInfoData = input;
          }

          this.lastSavedPayload = { ...input };

          console.log(res);

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
      this.liabilityForm.disable();
    }
  }
}
