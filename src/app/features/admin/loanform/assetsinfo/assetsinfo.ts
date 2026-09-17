import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { Buttons } from '../../../systemdesign/buttons/buttons';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Loanformservice } from '../../../../core/service/loanformservice';
import { Loanstepperservice } from '../../../../core/service/loanstepperservice';
import { Main } from '../../../../core/service/main';
import { Dropdown, DropdownOption } from '../../../systemdesign/dropdown/dropdown';
import { Inputfield } from "../../../systemdesign/inputfield/inputfield";
import { Datepickernew } from '../../../systemdesign/datepickernew/datepickernew';
import { Msgboxservice } from '../../../../core/service/msgboxservice';
import { firstValueFrom } from 'rxjs';
import { Storage } from '../../../../core/service/storage';
import { Successbox } from '../../customer/successbox/successbox';
import { Messagebox } from "../../../systemdesign/messagebox/messagebox";
import moment from 'moment';
interface BankOption {
  value: string;
  label: string;
}
@Component({
  selector: 'app-assetsinfo',
  standalone: true,
  imports: [CommonModule, Buttons, Dropdown, Inputfield, ReactiveFormsModule, Datepickernew, Successbox, Messagebox],
  templateUrl: './assetsinfo.html',
  styleUrl: './assetsinfo.scss'
})
export class Assetsinfo implements OnInit {
  applicantId: any;
  applicationId: any;

  openIndex: number[] = [0];
  accordions1 = [
    { title: 'Gold ', alwaysOpen: true, key: 'gold' },
    { title: 'Liquid Assets ', alwaysOpen: true, key: 'LiquidAssets' },
    { title: 'Property/ Land Assets ', alwaysOpen: true, key: 'Property/LandAssets' },
    { title: 'Fixed Deposit ', alwaysOpen: true, key: 'FixedDeposit' },
    { title: 'Investments ', alwaysOpen: true, key: 'Investments' },

  ];
  accordions: any[] = [];

  @Input() avatarUrl = '';
  @Input() hasAvatar = false;
  maritalstatus: string = 'Marital Status';

  assetsCatagories: DropdownOption[] = [];
  selectedAssets: any[] = [];
  selectedAssetIds: string[] = [];

  selectedPropertyIds: string[] = [];
  selectPorperty = []

  selectOwnertype: DropdownOption[] = [
    { label: 'Self-owned', value: 'Self-owned', icon: '' },
    { label: 'Joint-owned', value: 'Joint-owned', icon: '' },
    { label: 'Inherited', value: 'Inherited', icon: '' },
  ];

  selectedowner = ''
  selectedownertype: string[] = [];

  selectBanks: BankOption[] = [];
  selectedbankIds: string[] = [];

  selectedInvestmentIds: string[] = [];
  selectInvestments: DropdownOption[] = []

  selectedinvestmentIds: string[] = [];

  assetsForm!: FormGroup;
  selectedAssetLabel: string = '';

  assetOrder: string[] = [
    'GOLD',
    'LIQUID',
    'PROPERTY',
    'FIXED_DEPOSIT',
    'INVESTMENTS',
    'OTHER'
  ];

  groupIdMap: { [key: string]: string[] } = {};
  assetCodeMap: { [key: string]: string } = {};

  totalamount = 0;
  totalINRamt: any;
  totalproperty = 0;
  totalfd = 0;
  totalother = 0;
  totalinvestment = 0;

  selectedbakname!: string;
  invalidamt: boolean = false;;


  assetFieldMap: any = {
    'Gold': { form: 'gold', type: 'group' },
    'Liquid Assets': { form: 'liquidAssets', type: 'group' },
    'Property/ Land Assets': { form: 'properties', type: 'array' },
    'Fixed Deposit': { form: 'fixedDeposits', type: 'array' },
    'Investments': { form: 'investments', type: 'array' },
    'Other': { form: 'otherassets', type: 'array' }
  };

  summaryFieldMap: any = {
    'Gold': { keyName: 'gold' },
    'Liquid Assets': { keyName: 'liquidAssets' },
    'Property/ Land Assets': { keyName: 'properties' },
    'Fixed Deposit': { keyName: 'fixedDeposits' },
    'Investments': { keyName: 'investments' },
    'Other': { keyName: 'otherAssets' }
  }

  private readonly NO_ASSETS_CODE = "I don't have Assets";

  private readonly REAL_ASSETS_CODES = [
    "Gold",
    "Liquid Assets",
    "Property/ Land Assets",
    "Fixed Deposit",
    "Investments",
    "Other"
  ];

  checkoccupation: boolean = false;
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

  description1 = `Great ! Your Assets Info Details\n Uploaded Successfully.`;
  summarySection: any = {};

 isDataLoading = true;
loadError = ''; 

loadedFromSaveExit = false;

constructor(private fb: FormBuilder, public main: Main, private route: ActivatedRoute, private msgBox: Msgboxservice, private storageservice: Storage,
    private stepperService: Loanstepperservice, private formSvc: Loanformservice, private cd: ChangeDetectorRef, private router: Router) { }


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


    // this.applicantId = this.isCoApplicant ? AllCoapp_ids[0] : Allids[0];
    if (this.isCoApplicant) {
      this.applicantId = AllCoapp_ids?.[0];
      this.applicationId = AllCoapp_ids?.[1];
    } else {
      this.applicantId = Allids?.[0];
      this.applicationId = Allids?.[1];
    }
    this.stepperService.rebuildSteps();

    this.assetsForm = this.fb.group({
      gold: this.fb.group({
        goldvalue: ['', Validators.required]
      }),


      liquidAssets: this.fb.group({
        cashinhand: ['', Validators.required],
        savingbalance: ['', Validators.required]
      }),

      properties: this.fb.array([]),

      fixedDeposits: this.fb.array([]),
      investments: this.fb.array([]),

      otherassets: this.fb.array([]),
    });

    this.applyApplicantViewMode(queryParams)

    this.assetsForm.valueChanges.subscribe(() => {
      this.calculateGrandTotal();
    });


    await Promise.all([
      this.allAssetCatagory(),
      this.getbanks()
    ]);
    await this.loadPropertyMaster();

    await this.loadAssetsForBothFlows()
   } catch (error) {
    console.error(
      'Failed to initialize assets page',
      error
    );

    this.loadError =
      'Unable to load assets details. Please try again.';
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
  if (!this.assetsForm) {
    return;
  }

  if (this.isViewMode && !this.isEditMode) {
    this.assetsForm.disable({
      emitEvent: false
    });
  } else {
    this.assetsForm.enable({
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
          this.assetsForm.disable({ emitEvent: false });
        } else {
          this.isViewMode = false;
          this.isEditMode = true;
          this.assetsForm.enable({ emitEvent: false });
        }
      } else {
        this.isFromSummary = false;
        this.isSummaryEditMode = false;
        this.viewOnly = false;
        this.isViewMode = false;
        this.isEditMode = false;
        this.assetsForm.enable({ emitEvent: false });
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

      this.assetsForm.enable({ emitEvent: false });
    } else if (this.isSummaryEditMode) {
      if (this.viewOnly) {
        this.isViewMode = true;
        this.isEditMode = false;
        this.assetsForm.disable({ emitEvent: false });
      } else {
        this.isViewMode = false;
        this.isEditMode = true;
        this.assetsForm.enable({ emitEvent: false });
      }
    } else {
      this.isFromSummary = false;
      this.isSummaryEditMode = false;
      this.viewOnly = false;
      this.isViewMode = false;
      this.isEditMode = false;

      this.assetsForm.enable({ emitEvent: false });
    }
  }
  getStorageKey() {
    const main_ApplicantId = this.stepperService.getLoanId()?.[0];
    const co_ApplicantId = this.stepperService.getCo_appId()?.[0];
    const index = this.stepperService.getCurrentCoApplicantIndex();

    return this.storageservice.getStorageKey(
      'assetsinfoData',
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

  private async loadAssetsForBothFlows() {
    const key = this.getStorageKey();

    // const localData = localStorage.getItem(key);
    // const parsedLocal = localData ? JSON.parse(localData) : null;

    const parsedLocal = this.storageservice.getStoredSectionData(
      'assetsinfoData',
      this.applicationId,
      this.applicantId,
      this.isCoApplicant
    );

    const apiApplicantId = this.getApiApplicantId();


    let [draftData, summarySection, generalInfoData] = await Promise.all([
      apiApplicantId ? this.getSavedAssets(apiApplicantId) : Promise.resolve(null),
      this.getSummarySection('assets'), this.getSummarySection('generalInfo')
    ]);
    if (generalInfoData && !generalInfoData?.hasAssets) {
      summarySection = [];
      this.selectedAssets = [this.NO_ASSETS_CODE];
      this.clearAllAssetSelections();
      this.syncNoAssetsToGeneral();
      this.cd.detectChanges();
    }
    if (generalInfoData.occupationInfo.occupation == "Employed" || generalInfoData.occupationInfo.occupation == "Self-employed") {
      this.checkoccupation = true;
    } else { this.checkoccupation = false }

    this.summarySection = summarySection;


    const normalizedSummary = this.normalizeAssets(summarySection);
    const normalizedDraft = this.normalizeAssets(draftData);
    const normalizedLocal = this.normalizeAssets(parsedLocal);

    this.loadedFromSaveExit = !!normalizedDraft?.items?.length;

    let finalData;
    if (this.isFromSummary) {
      finalData = this.mergeAssetsData(
        normalizedSummary,
      );
    } else {
      finalData = this.mergeAssetsData(
        normalizedSummary,
        normalizedDraft,
        normalizedLocal
      );

    }

    // const finalData =
    //   normalizedSummary ||
    //   normalizedDraft ||
    //   normalizedLocal;

    console.log('finalAssetsData', finalData);

    if (!finalData || !finalData.items?.length) {
      this.lastSavedPayload = null;
      return;
    }


    if (this.isCoApplicant) {
      this.formSvc.co_aseetsInfoData = finalData;
    } else {
      this.formSvc.aseetsInfoData = finalData;
    }

    this.patchAssetsData(finalData,this.isFromSummary);

    this.calculateGrandTotal();

    this.lastSavedPayload = this.buildAssetsPayloadWithApplicantId();

    // localStorage.setItem(key, JSON.stringify(finalData));
    this.storageservice.saveSectionData(
      'assetsinfoData',
      this.applicationId,
      this.applicantId,
      this.isCoApplicant,
      JSON.stringify(finalData)
    );
    this.stepperService.markStepCompleted(this.getStepRoute());
  }


  private mergeAssetsData(...sources: any[]): any {
    const validSources = sources.filter(Boolean);
    if (!validSources.length) return null;

    const mergedItems: any[] = [];

    validSources.forEach(source => {
      const items = Array.isArray(source?.items) ? source.items : [];
      mergedItems.push(...items);
    });

    const dedupedItems = this.dedupeAssetItems(mergedItems);

    return {
      applicantId:
        validSources.find(x => x?.applicantId)?.applicantId || this.getApiApplicantId(),
      totalAssets: dedupedItems.reduce(
        (sum, item) => sum + Number(item.valueInr || 0),
        0
      ),
      items: dedupedItems
    };
  }


  //avoid duplicate
  private dedupeAssetItems(items: any[]): any[] {
    const map = new Map<string, any>();

    items.forEach(item => {
      const key = [
        item.assetItemMasterId || '',
        item.assetCode || '',
        item.assetType || '',
        item.bankId || '',
        item.propertyId || '',
        item.location || '',
        item.maturityDate || '',
        item.valueInr || 0
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

  private normalizeAssets(data: any): any {
    if (!data) return null;

    // Already draft/local payload format
    if (Array.isArray(data.items)) {
      // return data;

      return {
        applicantId: data.applicantId || this.getApiApplicantId(),
        totalAssets: Number(data.totalAssets || 0),
        items: data.items || []
      };

    }

    const items: any[] = [];

    const addItem = (code: string, value: any, extra: any = {}) => {
      const assetItemMasterId = this.assetCodeMap[code];

      if (!assetItemMasterId && code !== 'LIQUID_CASH') {
        console.warn('Missing asset master code:', code);
      }

      items.push({
        assetItemMasterId,
        assetCode: code,
        valueInr: this.cleanAmount(value),
        ...extra
      });
    };

    // GOLD
    (data.gold || []).forEach((x: any) => {
      addItem('GOLD', x.valueInr, {
        assetType: x.assetType || 'GOLD'
      });
    });

    // LIQUID ASSETS
    (data.liquidAssets || []).forEach((x: any) => {
      addItem('LIQUID_CASH', x.amountInr || x.valueInr, {
        assetType: x.assetType || x.type || x.name || 'Liquid Asset'
      });
    });

    // PROPERTY
    (data.properties || []).forEach((x: any, index: number) => {
      addItem('PROPERTY', x.marketValueInr || x.valueInr, {
        assetType: x.assetType || `Property ${index + 1}`,
        propertyId: x.propertyId || x.propertyType || '',
        propertyType: x.propertyType || '',
        ownershipType: x.ownershipType || '',
        location: x.location || ''
      });
    });

    // FIXED DEPOSIT
    (data.fixedDeposits || []).forEach((x: any, index: number) => {
      addItem('FIXED_DEPOSIT', x.amountInr || x.valueInr, {
        assetType: x.assetType || `Fixed Deposit ${index + 1}`,
        bankId: x.bankId || this.getBankIdByName(x.bankName),
        bankName: x.bankName || '',
        description: x.description || x.title || '',
        maturityDate: x.maturityDate || ''
      });
    });

    // INVESTMENTS
    (data.investments || []).forEach((x: any) => {
      const investmentCode = this.getInvestmentCode(x.type || x.assetType);

      addItem(investmentCode, x.valueInr, {
        assetType: x.assetType || x.type || investmentCode,
        type: x.type || x.assetType || ''
      });
    });

    // OTHER ASSETS
    (data.otherAssets || []).forEach((x: any) => {
      addItem('OTHER', x.valueInr || x.amountInr, {
        assetType: x.assetType || x.type || ''
      });
    });

    if (!items.length) return null;

    return {
      applicantId: this.getApiApplicantId(),
      totalAssets: data.totalAssets || 0,
      items
    };
  }
  private cleanAmount(value: any): number {
    if (value == null || value === '') return 0;
    return Number(value.toString().replace(/,/g, '')) || 0;
  }

  private getBankIdByName(bankName: string): string {
    if (!bankName) return '';

    return this.selectBanks.find(
      b => b.label?.toLowerCase().trim() === bankName.toLowerCase().trim()
    )?.value || '';
  }

  private getInvestmentCode(value: string): string {
    const text = (value || '').toLowerCase();

    if (text.includes('stock')) return 'STOCKS';
    if (text.includes('mutual')) return 'MUTUAL_FUNDS';
    if (text.includes('bond')) return 'BONDS';
    if (text.includes('debenture')) return 'DEBENTURES';
    if (text.includes('other')) return 'OTHERS';

    return value?.toUpperCase?.() || 'OTHERS';
  }
  get f() {
    return this.assetsForm.controls;
  }


  control(path: string) {
    return this.assetsForm.get(path);
  }

  get properties(): FormArray {
    return this.assetsForm.get('properties') as FormArray;
  }

  get fixedDeposits(): FormArray {
    return this.assetsForm.get('fixedDeposits') as FormArray;
  }


  get investmentsArray(): FormArray {
    return this.assetsForm.get('investments') as FormArray;
  }

  get otherassets(): FormArray {
    return this.assetsForm.get('otherassets') as FormArray;
  }

  //properties
  createProperty(): FormGroup {
    return this.fb.group({
      propertytype: ['', Validators.required],
      ownershiptype: ['', Validators.required],
      marketval: ['', Validators.required],
      location: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]]
    });
  }
  addProperty() {
    this.properties.push(this.createProperty());
  }
  //fixed deposits
  createFD(): FormGroup {
    return this.fb.group({
      bankname: [''],
      description: [''],
      bankamt: ['', [Validators.required, this.nonZeroValidator]],
      maturitydate: ['', [Validators.required, this.validDateValidator, this.dateMinValidator(() => new Date())]]
    });
  }
  addFD() {
    this.fixedDeposits.push(this.createFD());
  }
  //investments

  createInvestment(type: string): FormGroup {

    if (type === 'Others') {
      return this.fb.group({
        type: [type, Validators.required],
        name: ['', Validators.required],
        value: ['', [Validators.required, this.nonZeroValidator]]
      });
    }


    return this.fb.group({
      type: [type, Validators.required],
      value: ['', [Validators.required, this.nonZeroValidator]]
    });
  }


  //Other assets
  createOther(): FormGroup {
    return this.fb.group({
      assettype: ['', [Validators.required, Validators.pattern('^[A-Za-z ]+$'), Validators.minLength(2), Validators.maxLength(50)]],
      assetamt: ['', Validators.required],

    });
  }
  addOther() {
    this.otherassets.push(this.createOther());
  }


  toggle(index: number) {
    const acc = this.accordions[index];

    if (acc?.key) {
      this.ensureAssetSectionInitialized(acc.key);
    }

    if (this.openIndex.includes(index)) {
      this.openIndex = this.openIndex.filter(i => i !== index);
    } else {
      this.openIndex = [...this.openIndex, index];
    }

    this.cd.detectChanges();
  }

  private ensureAssetSectionInitialized(key: string): void {
    const config = this.assetFieldMap[key];
    if (!config) return;

    const control = this.assetsForm.get(config.form);

    if (control instanceof FormArray && control.length === 0) {
      if (key === 'Property/ Land Assets') {
        control.push(this.createProperty());
      }

      if (key === 'Fixed Deposit') {
        control.push(this.createFD());
      }

      if (key === 'Investments') {
        // don't auto push because investments depend on dropdown selection
      }

      if (key === 'Other') {
        control.push(this.createOther());
      }
    }
  }
  removeAccordion(key: string, index: number, event: Event) {
    event.stopPropagation();
    event.preventDefault();
    console.log(key);
    let accArr: any = [];

    if (this.summaryFieldMap?.[key]) {
      this.summarySection[this.summaryFieldMap[key].keyName].forEach((item: any) => {
        accArr.push(item.id);
      });
    }

    console.log(accArr)

    this.msgBox.open({
      title: 'Are you sure want to Remove',
      message: ``,
      showCancel: true,
       okText:'Yes',
      onOk: () => {
        event.stopPropagation();

        this.selectedAssets = this.selectedAssets.filter(k => k !== key);
        this.selectedAssets = [...this.selectedAssets];

        this.openIndex = this.openIndex.filter(i => i !== index);

        switch (key) {
          case 'Gold':
            this.resetGold();
            break;

          case 'Liquid Assets':
            this.resetLiquidAssets();
            break;

          case 'Property/ Land Assets':
            this.properties.clear();
            this.selectedPropertyIds = [];
            this.properties.push(this.createProperty());
            break;

          case 'Fixed Deposit':
            this.fixedDeposits.clear();
            this.fixedDeposits.push(this.createFD());
            break;

          case 'Investments':
            this.investmentsArray.clear();
            this.selectedInvestmentIds = [];
            break;

          case 'other':
            this.otherassets.clear();
            this.otherassets.push(this.createOther());
            break;
        }

        if (accArr) {
          this.deleteItemArr(accArr);
        }

        this.calculateGrandTotal();
        // this.syncNoAssetsToGeneral();
        this.cd.detectChanges();
      }
    });
  }

  resetGold() {
    this.assetsForm.setControl(
      'gold',
      this.fb.group({
        goldvalue: ['', Validators.required]
      })
    );
  }

  resetLiquidAssets() {
    this.assetsForm.setControl(
      'liquidAssets',
      this.fb.group({
        cashinhand: ['', Validators.required],
        savingbalance: ['', Validators.required]
      })
    );
  }

  handleAmountInput(event: any, controlName: string, ctrl?: any) {
    const type: string = ctrl?.get?.('type')?.value || '';
    const isMutualFund = type.toLowerCase().includes('mutual fund');
    const decimalLimit = isMutualFund ? 4 : 2;

    this.main.restrictInput(event, 'decimal', decimalLimit);

    if (ctrl) {
      this.formatAmountfromarray(event, controlName, ctrl);
      ctrl.get(controlName)?.markAsTouched();
    } else {
      this.formatAmount1(event, controlName);
    }

    setTimeout(() => {
      this.calculateGrandTotal();
      this.cd.detectChanges();
    });
  }

  formatIndian1(x: string): string {
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
  formatAmount1(event: any, controlName: string) {
    let value = event.target.value;
    if (!value) {
      this.assetsForm.get(controlName)?.setValue('');
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
    this.assetsForm.get(controlName)?.setValue(formatted, { emitEvent: false });
  }

  formatAmount(controlName: string) {

    const control = this.assetsForm.get(controlName);
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
      this.assetsForm.get(controlName)?.setValue(formatted, { emitEvent: false });
    }
  }


  submit() {
    if (this.assetsForm.invalid) return;

    console.log(this.assetsForm.value);
  }


  //i dont have asset will change in general
  private syncNoAssetsToGeneral() {
    const hasAssets = this.selectedAssets?.length > 0;

    this.stepperService.setApplicantValues('main', {
      isasset: hasAssets,
      isincome: this.formSvc.applicantState.isincome,
      issalaried: this.formSvc.applicantState.issalaried,
      coursetypeug: this.formSvc.applicantState.coursetypeug
    });

    localStorage.setItem('main_isasset', JSON.stringify(hasAssets));
  }
  
  onAssetChange(values: string | string[]): void {
    const rawSelected = Array.isArray(values) ? values : [values];

    this.assetsCatagories.forEach((item: any) => {
      item.disabled = false;
    });

    let normalizedSelected = rawSelected
      .map(v => this.normalizeToAccordionKey(v))
      .filter(Boolean);

    // remove duplicates
    normalizedSelected = [...new Set(normalizedSelected)];

    const previousSelected = [...this.selectedAssets];

    const hasNoAssets = normalizedSelected.includes(this.NO_ASSETS_CODE);

    const totalAssets = this.assetsCatagories.length;

    this.assetsCatagories.forEach((item: any) => {
      if (
        (!hasNoAssets && rawSelected.length === totalAssets - 1) ||
        (hasNoAssets && rawSelected.length === totalAssets)
      ) {
        item.disabled = item.value === this.NO_ASSETS_CODE;

      } else if (hasNoAssets) {
        item.disabled = item.value !== this.NO_ASSETS_CODE;

      } else {
        item.disabled = false;
      }
    });

    // remove "I don't have Assets" from real asset list
    let realAssets = normalizedSelected.filter(
      x => x !== this.NO_ASSETS_CODE
    );


    const allRealAssetsSelected = this.REAL_ASSETS_CODES.every(asset =>
      realAssets.includes(asset)
    );

    if (allRealAssetsSelected) {
      realAssets = [...this.REAL_ASSETS_CODES];
      this.selectedAssets = realAssets;

      // initialize accordions/forms for all real assets
      this.selectedAssets.forEach(key => {
        const config = this.assetFieldMap[key];
        if (!config) return;

        const control = this.assetsForm.get(config.form);

        if (control instanceof FormArray && control.length === 0) {
          if (key === 'Property/ Land Assets') control.push(this.createProperty());
          if (key === 'Fixed Deposit') control.push(this.createFD());
          if (key === 'Other') control.push(this.createOther());
        }
      });

      this.openIndex = this.selectedAssets
        .map(val => this.accordions.findIndex(a => a.key === val))
        .filter(i => i !== -1);

      this.calculateGrandTotal();
      // this.syncNoAssetsToGeneral();
      this.cd.detectChanges();
      return;
    }

    if (hasNoAssets) {
      this.selectedAssets = [this.NO_ASSETS_CODE];
      this.clearAllAssetSelections();
      // this.syncNoAssetsToGeneral();
      this.cd.detectChanges();
      return;
    }


    this.selectedAssets = realAssets;

    const deselected = previousSelected.filter(k => !realAssets.includes(k));
    const newlySelected = this.selectedAssets.filter(k => !previousSelected.includes(k));

    // reset deselected controls
    deselected.forEach(key => {
      const config = this.assetFieldMap[key];
      if (!config) return;

      const control = this.assetsForm.get(config.form);

      if (control instanceof FormGroup) {
        control.reset();
      }

      if (control instanceof FormArray) {
        control.clear();
      }

      if (key === 'Investments') {
        this.selectedInvestmentIds = [];
      }

      if (key === 'Property/ Land Assets') {
        this.selectedPropertyIds = [];
      }

      if (key === 'Other') {
        // optional additional cleanup if needed
      }
    });


    // newlySelected.forEach(key => {
    //   const config = this.assetFieldMap[key];
    //   if (!config) return;

    //   const control = this.assetsForm.get(config.form);

    //   if (control instanceof FormArray && control.length === 0) {
    //     if (key === 'Property/ Land Assets') control.push(this.createProperty());
    //     if (key === 'Fixed Deposit') control.push(this.createFD());
    //     if (key === 'Other') control.push(this.createOther());
    //   }
    // });

    // initialize newly selected arrays
    this.selectedAssets.forEach(key => {
      this.ensureAssetSectionInitialized(key);
    });

    // open only selected accordions
    this.openIndex = this.selectedAssets
      .map(val => this.accordions.findIndex(a => a.key === val))
      .filter(i => i !== -1);

    this.calculateGrandTotal();
    // this.syncNoAssetsToGeneral();
    this.cd.detectChanges();
  }

  //clear the selected if idont asset selected
  private clearAllAssetSelections(): void {
    // reset form groups
    this.resetGold();
    this.resetLiquidAssets();

    // clear form arrays completely
    this.properties.clear();
    this.fixedDeposits.clear();
    this.investmentsArray.clear();
    this.otherassets.clear();

    // reset related dropdown selections
    this.selectedInvestmentIds = [];
    this.selectedPropertyIds = [];
    this.selectedownertype = [];

    // close all accordions
    this.openIndex = [];

    this.calculateGrandTotal();
  }
  private normalizeToAccordionKey(code: string): string {
    switch (code) {
      case 'GOLD': return 'Gold';
      case 'LIQUID': return 'Liquid Assets';
      case 'PROPERTY': return 'Property/ Land Assets';
      case 'FIXED_DEPOSIT': return 'Fixed Deposit';
      case 'INVESTMENTS': return 'Investments';
      case 'OTHER': return 'Other';
      // case 'OTHER': return 'Other Assets';
      default: return code;
    }
  }


  allAssetCatagory(): Promise<void> {
    return new Promise((resolve) => {
      this.formSvc.getAllAssets().subscribe((res: any) => {
        const list = res.data ?? res;

        this.groupIdMap = list.reduce((acc: any, item: any) => {
          if (!acc[item.name]) {
            acc[item.name] = [];
          }
          acc[item.name].push(item.id);
          return acc;
        }, {});

        const uniqueGroups = [...new Set(list.map((s: any) => s.name))];

        const sortedGroups = uniqueGroups.sort(
          (a: any, b: any) =>
            this.assetOrder.indexOf(a) - this.assetOrder.indexOf(b)
        );

        this.assetsCatagories = sortedGroups.map((group: any) => ({
          value: group,
          label: this.formatTitle(group),
          code: group,
          disabled: false
        }));

        this.accordions = sortedGroups.map((group: any) => ({
          title: this.accordianTitle(group),
          alwaysOpen: true,
          key: this.accordianTitle(group)
        }));

        this.assetCodeMap = list.reduce((acc: any, item: any) => {
          acc[item.code] = item.id;
          return acc;
        }, {});

        this.formSvc.selectedAssets('INVESTMENTS').subscribe((invRes: any) => {
          const invList = invRes.data ?? invRes;

          this.selectInvestments = invList.map((s: any) => ({
            value: s.id,
            label: s.name,
            code: s.code
          }));

          invList.forEach((item: any) => {
            this.assetCodeMap[item.code] = item.id;
          });

          this.cd.detectChanges();
          resolve();
        });
      });
    });
  }
 

  accordianTitle(text: string) {

    switch (text) {
      case 'GOLD':
        return 'Gold';
      case 'LIQUID':
        return 'Liquid Assets';
      case 'PROPERTY':
        return 'Property/ Land Assets';
      case 'FIXED_DEPOSIT':
        return 'Fixed Deposit';
      case 'INVESTMENTS':
        return 'Investments';
      case 'OTHER':
        return 'Other Assets';
      default:
        return text;
    }
  }
  formatTitle(text: string): string {

    return text
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }
  SelectedAssetvalue(values: string | string[]) {
    const ids = Array.isArray(values) ? values : [values];


    if (ids.includes(this.NO_ASSETS_CODE)) {
      this.selectedAssetLabel = this.NO_ASSETS_CODE;
      return;
    }

    const selected = this.assetsCatagories.filter(s => ids.includes(s.value));

    this.selectedAssetLabel = selected.map(s => s.label).join(', ');

    console.log("selectedAssetLabel:", this.selectedAssetLabel);
    this.propertyinvestmentasset();
  }

  propertyinvestmentasset() {
    if (this.selectedAssetLabel.includes('Property')) {
      let data = 'PROPERTY_LAND_ASSETS'
      this.formSvc.selectedAssets(data).subscribe((res: any) => {
        const list = res.data ?? res;

        this.selectPorperty = list.map((s: any) => ({
          value: s.id,
          label: s.name,
          code: s.code
        }));

      });
    }
    if (this.selectedAssetLabel.includes('Investments')) {
      let data = 'INVESTMENTS'
      this.formSvc.selectedAssets(data).subscribe((res: any) => {
        const list = res.data ?? res;

        this.selectInvestments = list.map((s: any) => ({
          value: s.id,
          label: s.name,
          code: s.code
        }));


        list.forEach((item: any) => {
          this.assetCodeMap[item.code] = item.id;
        });

      });
      console.log(" this.assetCodeMap investment", this.assetCodeMap);

    }



  }

  onchange(values: string | string[], type: 'property' | 'investment' | 'propertyOwnertype' | 'bank') {

    const ids = Array.isArray(values) ? values : [values];
    if (type === 'property') {
      this.selectedPropertyIds = ids;
    }

    else {
      this.selectedownertype = ids;
    }
  }

  onchangeinvestment(selectedIds: any) {

    if (!Array.isArray(selectedIds) || selectedIds.length === 0) {
      this.investmentsArray.clear();
      this.selectedInvestmentIds = [];
      this.cd.detectChanges();
      return;
    }


    if (selectedIds.length === 0) {
      this.investmentsArray.clear();
      console.log('Investments cleared');
      return;
    }

    // map ids → codes
    const selectedCodes: string[] = selectedIds
      .map(id => this.selectInvestments.find(x => x.value === id)?.label)
      .filter((name): name is string => typeof name === 'string');



    const existingCodes: string[] = this.investmentsArray.controls.map(
      ctrl => ctrl.value?.type
    );


    //  Add newly selected
    selectedCodes.forEach(name => {
      if (!existingCodes.includes(name)) {
        this.investmentsArray.push(
          this.createInvestment(name)
        );
      }
    });

    //  Remove deselected
    for (let i = this.investmentsArray.length - 1; i >= 0; i--) {
      const ctrl = this.investmentsArray.at(i);
      if (!selectedCodes.includes(ctrl.value.type)) {
        this.investmentsArray.removeAt(i);
      }
    }
    this.cd.detectChanges();
    console.log('Investments shown:', this.investmentsArray.value);
  }

  //get property id by label
  private resolvePropertyId(rawValue: any): string {
    return this.resolveOptionValue(this.selectPorperty, rawValue);
  }

  private resolveOptionValue(list: any[], rawValue: any): string {
    if (!rawValue) return '';

    const normalized = rawValue?.toString().trim();

    // If already ID
    const existsAsValue = list.some(x => x.value === normalized);
    if (existsAsValue) return normalized;

    // Convert label → value
    return list.find(x =>
      x.label?.toLowerCase().trim() === normalized.toLowerCase()
    )?.value || '';
  }
  removeitem(index: number, type: 'property' | 'fd' | 'other') {
    let item: any = {};
    if (this.summarySection?.properties && type === 'property') {
      item = this.summarySection.properties[index];
    }
    if (this.summarySection?.fixedDeposits && type === 'fd') {
      item = this.summarySection.fixedDeposits[index];
    }
    if (this.summarySection?.otherAssets && type === 'other') {
      item = this.summarySection.otherAssets[index];
    }

    this.msgBox.open({
      title: 'Are you sure want to Remove',
      message: ``,
      showCancel: true,
       okText:'Yes',
      onOk: () => {
        switch (type) {
          case 'property':
            this.properties.removeAt(index);
            break;
          case 'fd':
            this.fixedDeposits.removeAt(index);
            break;
          case 'other':
            this.otherassets.removeAt(index);
            break;
        }
        this.handleEmptyAccordion(type);
        this.calculateGrandTotal();  // Recalc total
        if (item) {
          this.deleteItemArr([item.id]);
        }
      }
    });
  }

  deleteItemArr(idArr: any) {
    this.formSvc.deleteAssets({
      applicationId: this.applicationId,
      applicantId: this.applicantId,
      assetIds: idArr
    }).subscribe({
      next: (res) => {
        console.log(res);
      },
      error: (error) => {
        console.log(error);
      }
    });
  }

  handleEmptyAccordion(type: 'property' | 'fd' | 'other') {
    let array: FormArray;
    let accKey: string;

    switch (type) {
      case 'property':
        array = this.properties;
        accKey = 'Property/ Land Assets';  // Match  acc.key
        break;
      case 'fd':
        array = this.fixedDeposits;
        accKey = 'Fixed Deposit';  // Match acc.key
        break;
      case 'other':
        array = this.otherassets;
        accKey = 'other';  // Match acc.key (lowercase from template)
        break;
    }

    if (array && array.length === 0) {
      // Remove from selectedAssets → hides *ngIf accordion
      this.selectedAssets = this.selectedAssets.filter(k => k !== accKey);
      this.selectedAssets = [...this.selectedAssets];  // Trigger change detection

      // Close accordion
      const accIndex = this.accordions.findIndex(a => a.key === accKey);
      if (accIndex !== -1) {
        this.openIndex = this.openIndex.filter(i => i !== accIndex);
      }
    }
  }

  calculateGrandTotal() {

    const gold = Number(this.assetsForm.get('gold.goldvalue')?.value?.toString().replace(/,/g, '') || 0);

    const liquid = Number(this.assetsForm.get('liquidAssets.cashinhand')?.value?.toString().replace(/,/g, '') || 0) +
      Number(this.assetsForm.get('liquidAssets.savingbalance')?.value?.toString().replace(/,/g, '') || 0);

    this.totalproperty = this.calculateTotal('properties', 'marketval');
    this.totalinvestment = this.calculateTotal('investments', 'value');
    this.totalfd = this.calculateTotal('fixedDeposits', 'bankamt');
    this.totalother = this.calculateTotal('otherassets', 'assetamt');

    this.totalINRamt = gold + liquid + this.totalproperty + this.totalfd + this.totalother + this.totalinvestment;

    this.totalINRamt = this.formatIndian(this.totalINRamt.toString());
  }

  calculateTotal(formArrayName: string, controlName: string): number {

    let total = 0;

    const formArray = this.assetsForm.get(formArrayName) as FormArray;

    formArray.controls.forEach((grp: any) => {
      const val = grp.get(controlName)?.value;

      if (val) {
        const clean = Number(val.toString().replace(/,/g, ''));
        total += clean;
      }
    });

    return total;
  }


 
  get isNextDisabled(): boolean {
    const form = this.assetsForm.value;


    if (!this.selectedAssets?.length) return true;

    if (this.selectedAssets.includes('Gold') && !form.gold?.goldvalue) return true;

    if (this.selectedAssets.includes('Liquid Assets')) {
      const hasLiquidData = form.liquidAssets?.cashinhand || form.liquidAssets?.savingbalance;
      if (!hasLiquidData) return true;
    }


    if (this.selectedAssets.includes('Property/ Land Assets') && this.properties.length === 0) return true;

    if (this.selectedAssets.includes('Fixed Deposit') && this.fixedDeposits.length === 0) return true;
    if (this.selectedAssets.includes('other') && this.otherassets.length === 0) return true;

    if (this.selectedAssets.includes('investments')) {
      const hasInvestmentData = form.investments?.stockvalue || form.investments?.mutualfundvalue;
      if (!hasInvestmentData) return true;
    }


    return false;
  }


  getbanks1() {
    this.formSvc.getallBanks().subscribe((res: any) => {
      const list = res.data ?? res;

      this.selectBanks = list.map((s: any) => ({
        value: s.id,
        label: s.name,



      }));

    });
  }
  getbanks(): Promise<void> {
    return new Promise((resolve) => {
      this.formSvc.getallBanks().subscribe((res: any) => {
        const list = res.data ?? res;

        this.selectBanks = list.map((s: any) => ({
          value: s.id,
          label: s.name
        }));

        resolve();
      });
    });
  }
  onBankSelected(selectedId: any, fd: AbstractControl) {
    const fg = fd as FormGroup;

    const found = this.selectBanks.find(
      (b: BankOption) => b.value === selectedId
    );
    const bankLabel = found?.label ?? '';
    this.selectedbakname = bankLabel;

    const titleCtrl = fg.get('description');

    if (bankLabel === 'Other') {
      titleCtrl?.setValidators([Validators.required]);
    } else {
      titleCtrl?.clearValidators();
      titleCtrl?.setValue('');
    }

    titleCtrl?.updateValueAndValidity();
  }

  private loadPropertyMaster(): Promise<void> {
    return new Promise((resolve) => {
      this.formSvc.selectedAssets('PROPERTY_LAND_ASSETS').subscribe((res: any) => {
        const list = res.data ?? res;

        this.selectPorperty = list.map((s: any) => ({
          value: s.id,
          label: s.name,
          code: s.code
        }));

        resolve();
      });
    });
  }

  isOtherSelected(fd: AbstractControl): boolean {
    const selectedId = fd.get('bankname')?.value;
    const found = this.selectBanks.find(b => b.value === selectedId);
    return found?.label === 'Other';
  }

  back() {
    this.stepperService.previous();
  }
  dateMinValidator = (getMinDate: () => Date) => {
    return (control: any) => {
      const value = control.value;
      const minDate = getMinDate();

      if (!value || !minDate) return null;

      const selected = new Date(value);
      const min = new Date(getMinDate());


      selected.setHours(0, 0, 0, 0);
      min.setHours(0, 0, 0, 0);

      return selected < min ? { minDateError: true } : null;

    };
  };
validDateValidator(control: any) {
  const value = control.value;

  if (!value) return null;

  const date = new Date(value);

  // Invalid date
  if (isNaN(date.getTime())) {
    return { invalidDate: true };
  }

  return null;
}
  nonZeroValidator(control: any) {
    const raw = control.value;

    if (!raw) return null;

    const numeric = Number(raw.toString().replace(/,/g, ''));

    return numeric === 0 ? { zeroNotAllowed: true } : null;
  }
 
  parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;

    const parts = dateStr.split('/');

    if (parts.length !== 3) return null;

    const [day, month, year] = parts;

    return new Date(+year, +month - 1, +day);
  }

private toDateValue(value: unknown): Date | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null;
    }

    const date = new Date(
      value.getFullYear(),
      value.getMonth(),
      value.getDate()
    );

    date.setHours(0, 0, 0, 0);
    return date;
  }

  if (
    typeof value === 'object' &&
    value !== null &&
    '_isAMomentObject' in value
  ) {
    const momentValue = value as any;

    if (!momentValue.isValid()) {
      return null;
    }

    const date = momentValue.toDate();
    date.setHours(0, 0, 0, 0);

    return date;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const text = value.trim();

  const parsed = moment(
    text,
    [
      'DD/MM/YYYY',
      'YYYY-MM-DD',
      moment.ISO_8601
    ],
    true
  );

  if (!parsed.isValid()) {
    return null;
  }

  const date = parsed.toDate();
  date.setHours(0, 0, 0, 0);

  return date;
}
  patchAssetsData(inputData?: any,fromSummary: boolean = false) {

    const data = inputData || (
      this.isCoApplicant
        ? this.formSvc.co_aseetsInfoData
        : this.formSvc.aseetsInfoData
    );


    if (!data || !data.items) return;

    const items = data.items;


    this.selectedAssets = [];
    this.properties.clear();
    this.fixedDeposits.clear();
    this.otherassets.clear();
    this.investmentsArray.clear();
    this.selectedInvestmentIds = [];
    this.selectedPropertyIds = [];

    items.forEach((item: any) => {

      const code1 = Object.keys(this.assetCodeMap)
        .find(key => (this.assetCodeMap[key] === item.assetItemMasterId));


      const code =
        item.assetCode ||
        Object.keys(this.assetCodeMap).find(
          key => this.assetCodeMap[key] === item.assetItemMasterId
        );



      if (!code) return;

      // ---------------- GOLD ----------------
      if (code === 'GOLD') {
        this.selectedAssets.push(this.normalizeToAccordionKey('GOLD'));

        this.assetsForm.get('gold')?.patchValue({
          goldvalue: this.formatIndian(item.valueInr?.toString() || '0'),  // (item.valueInr)
        });
      }

      // ---------------- LIQUID ----------------
      if (code === 'LIQUID_CASH') {
        this.selectedAssets.push(this.normalizeToAccordionKey('LIQUID'));

        const liquidGroup = this.assetsForm.get('liquidAssets');

        if (!liquidGroup?.value.cashinhand) {
          liquidGroup?.patchValue({ cashinhand:  this.formatIndian(item.valueInr?.toString() || '0')  });
        } else {
          liquidGroup?.patchValue({ savingbalance:  this.formatIndian(item.valueInr?.toString() || '0') });
        }
      }

      // ---------------- PROPERTY ----------------
      if (code === 'PROPERTY') {
        this.selectedAssets.push(this.normalizeToAccordionKey('PROPERTY'));

        const group = this.createProperty();

        group.patchValue({
          propertytype: item.propertyId || item.propertyType || '',
          ownershiptype: item.ownershipType,
          marketval:  this.formatIndian(item.valueInr?.toString() || '0'),
          location: item.location
        });

        this.properties.push(group);
      }

      // ---------------- FD ----------------
      if (code === 'FIXED_DEPOSIT') {
        this.selectedAssets.push(this.normalizeToAccordionKey('FIXED_DEPOSIT'));

        const group = this.createFD();

        group.patchValue({
          bankname: item.bankId || this.getBankIdByName(item.bankName),
          description: item.description || '',
          bankamt: this.formatIndian(item.valueInr?.toString() || '0'),
          // maturitydate: fromSummary ?this.toDateValue(item.maturityDate):item.maturityDate,
          maturitydate: this.toDateValue(item.maturityDate)
        });

        this.fixedDeposits.push(group);
      }

      // ---------------- INVESTMENTS ----------------


      if (
        code === 'STOCKS' ||
        code === 'MUTUAL_FUNDS' ||
        code === 'BONDS' ||
        code === 'DEBENTURES' ||
        code === 'OTHERS'
      ) {
        this.selectedAssets.push(this.normalizeToAccordionKey('INVESTMENTS'));

        // restore dropdown selection
        this.selectedInvestmentIds.push(item.assetItemMasterId);

        let formType = '';

        if (code === 'STOCKS') formType = 'Stocks';
        if (code === 'MUTUAL_FUNDS') formType = 'Mutual Funds';
        if (code === 'BONDS') formType = 'Bonds';
        if (code === 'DEBENTURES') formType = 'Debentures';
        if (code === 'OTHERS') formType = 'Others';

        const group = this.createInvestment(formType);

        group.patchValue({
          type: formType,
          value:  this.formatIndian(item.valueInr?.toString() || '0'),
          name: code === 'OTHERS' ? item.assetType : ''
        });

        this.investmentsArray.push(group);
      }

      // ---------------- OTHER ----------------
      if (code === 'OTHER') {
        this.selectedAssets.push(this.normalizeToAccordionKey('OTHER'));

        const group = this.createOther();

        group.patchValue({
          assettype: item.assetType,
          assetamt:  this.formatIndian(item.valueInr?.toString() || '0')
        });

        this.otherassets.push(group);
      }

    });

    this.selectedAssets = [...new Set(this.selectedAssets)];


    this.openIndex = [];
    this.selectedAssets.forEach(val => {
      const index = this.accordions.findIndex(a => a.key === val);
      if (index !== -1) {
        this.openIndex.push(index);
      }
    });

    // this.syncNoAssetsToGeneral();
    this.cd.detectChanges();
  }
  formatDateForPayload(dateValue: any): string {
    if (!dateValue) return '';

    if (typeof dateValue === 'string') {
      return dateValue.split('T')[0];
    }

    if (dateValue?.format) {
      return dateValue.format('YYYY-MM-DD');
    }

    const d = new Date(dateValue);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }

    return '';
  }

  //payload that will send in next btn api call
  buildAssetsPayload(): { invalid: boolean; items: any[]; } {
    const form = this.assetsForm.getRawValue();
    const items: any[] = [];
    let invalid = false;

    const addItem = (code: string, value: any, extra: any = null) => {
      const assetItemMasterId = this.assetCodeMap[code];
      if (!value) return;


      if (!assetItemMasterId) {
        console.log('Missing asset code mapping for:', code);
        invalid = true;
        return;
      }


      items.push({
        assetItemMasterId: this.assetCodeMap[code],
        valueInr: cleanAmount(value),
        ...extra
      });
    };
    const cleanAmount = (val: any) =>
      val ? Number(val.toString().replace(/,/g, '')) : 0;

    const markInvalid = (path: string) => {
      this.assetsForm.get(path)?.markAsTouched();
      invalid = true;
    };

    //  GOLD
    if (this.selectedAssets.includes('Gold')) {
      const val = form.gold?.goldvalue;

      !val ? markInvalid('gold.goldvalue') : addItem('GOLD', val, {
        assetType: 'GOLD'
      });
    }

    //  LIQUID
    if (this.selectedAssets.includes('Liquid Assets')) {
      const cash = form.liquidAssets?.cashinhand;
      const savings = form.liquidAssets?.savingbalance;

      !cash ? markInvalid('liquidAssets.cashinhand') : addItem('LIQUID_CASH', cash, { assetType: 'Cash In Hand' });
      !savings ? markInvalid('liquidAssets.savingbalance') : addItem('LIQUID_CASH', savings, { assetType: 'Savings Account Balance (INR)' });
    }

    //  PROPERTY (FormArray)
    if (this.selectedAssets.includes('Property/ Land Assets')) {
      const arr = this.assetsForm.get('properties') as FormArray;

      arr.controls.forEach((ctrl: any, index: number) => {
        if (ctrl.invalid) {
          ctrl.markAllAsTouched();
          invalid = true;
          console.log('properties true:');
        } else {
          addItem('PROPERTY', ctrl.value.marketval, {
            propertyId: this.resolvePropertyId(
              ctrl.value.propertyId || ctrl.value.propertytype
            ),
            // propertyType: ctrl.value.propertytype,
            ownershipType: ctrl.value.ownershiptype,
            location: ctrl.value.location,
            assetType: `Property ${index + 1}`
          });
        }
      });
    }



    //  FIXED DEPOSIT (FormArray)
    if (this.selectedAssets.includes('Fixed Deposit')) {
      const arr1 = this.assetsForm.get('fixedDeposits') as FormArray;
      const arr = this.fixedDeposits;
      if (!arr || arr.length === 0) {

        invalid = true;
      }
      else {
        arr.controls.forEach((ctrl: any, index: number) => {
          ctrl.markAllAsTouched();
          if (ctrl.invalid) {

            invalid = true;
            console.log('Fixed Deposit true:'); return

          } else {

            addItem('FIXED_DEPOSIT', ctrl.value.bankamt, {
              bankId: ctrl.value.bankname,
              // ...(this.isOtherSelected(ctrl) && { description: ctrl.value.description }),

              ...(this.isOtherSelected(ctrl) && ctrl.value.description?.trim()
                ? { description: ctrl.value.description }
                : {}),

              // maturityDate: (ctrl.value.maturitydate).format('YYYY-MM-DD'),
              maturityDate: this.formatDateForPayload(ctrl.value.maturitydate),
              assetType: `Fixed Deposit ${index + 1}`
            });
          }
        });
      }
    }



    //  INVESTMENTS 
    if (this.selectedAssets.includes('Investments')) {

      const arr = this.investmentsArray;

      if (!arr || arr.length === 0) {
        invalid = true;
        // return;
      } else {

        arr.controls.forEach((ctrl: any) => {
          ctrl.markAllAsTouched();
          if (ctrl.invalid) {
            ctrl.markAllAsTouched();
            invalid = true;
            console.log('Investment true:');
            return;
          }

          const type = ctrl.value.type == 'Mutual Funds' ? 'MUTUAL_FUNDS' : (ctrl.value.type).toUpperCase();
          const amount = ctrl.value.value;

          if (type === 'Others') {
            addItem('Others', amount, {
              assetType: ctrl.value.name
            });
          }
          else {
            addItem(type, amount, { assetType: type });
          }
        });
      }
    }


    //  Other Assets
    if (this.selectedAssets.includes('Other')) {
      const arr = this.assetsForm.get('otherassets') as FormArray;

      arr.controls.forEach((ctrl: any,) => {
        if (ctrl.invalid) {
          ctrl.markAllAsTouched();
          invalid = true;
          console.log('Other Assets true:');
        } else {
          addItem('OTHER', ctrl.value.assetamt, {
            assetType: ctrl.value.assettype,


          });
        }
      });
    }
    if (invalid || this.invalidamt === true) { console.log("invalid--"); return { invalid: true, items: [] }; }



    const payload = { items };

    console.log("FINAL PAYLOAD:", payload);


    return {
      invalid: false,
      items,

    };
  }
  //draft payload 
  buildDraftAssetsPayloadWithApplicantId(): {
    invalid: boolean;
    applicantId?: any;
    items: any[];
  } {
    const form = this.assetsForm.getRawValue();
    const items: any[] = [];

    const addItem = (code: string, value: any, extra: any = {}) => {
      const assetItemMasterId = this.assetCodeMap[code];

      // For draft save, skip only if absolutely nothing exists
      if (!assetItemMasterId && code !== 'LIQUID_CASH') {
        console.warn('Missing asset code mapping for:', code);
        return;
      }

      items.push({
        assetItemMasterId,
        assetCode: code,
        valueInr: this.cleanAmount(value),
        ...extra
      });
    };

    // GOLD
    if (this.selectedAssets.includes('Gold') && this.hasValue(form.gold?.goldvalue)) {
      addItem('GOLD', form.gold.goldvalue, {
        assetType: 'GOLD'
      });
    }

    // LIQUID
    if (this.selectedAssets.includes('Liquid Assets')) {
      if (this.hasValue(form.liquidAssets?.cashinhand)) {
        addItem('LIQUID_CASH', form.liquidAssets.cashinhand, {
          assetType: 'Cash In Hand'
        });
      }

      if (this.hasValue(form.liquidAssets?.savingbalance)) {
        addItem('LIQUID_CASH', form.liquidAssets.savingbalance, {
          assetType: 'Savings Account Balance (INR)'
        });
      }
    }

    // PROPERTY
    if (this.selectedAssets.includes('Property/ Land Assets')) {
      this.properties.controls.forEach((ctrl: any, index: number) => {
        const row = ctrl.value;

        if (this.hasAnyValue(row, ['propertytype', 'ownershiptype', 'marketval', 'location'])) {
          addItem('PROPERTY', row.marketval || 0, {
            propertyId: row.propertytype || row.propertyId || '',
            // propertyType: row.propertytype || '',
            ownershipType: row.ownershiptype || '',
            location: row.location || '',
            assetType: `Property ${index + 1}`
          });
        }
      });
    }

    // FIXED DEPOSIT
    if (this.selectedAssets.includes('Fixed Deposit')) {
      this.fixedDeposits.controls.forEach((ctrl: any, index: number) => {
        const row = ctrl.value;

        if (this.hasAnyValue(row, ['bankname', 'description', 'bankamt', 'maturitydate'])) {
          addItem('FIXED_DEPOSIT', row.bankamt || 0, {
            bankId: row.bankname || '',
            description: row.description || '',
            maturityDate: this.formatDateForPayload(row.maturitydate),
            assetType: `Fixed Deposit ${index + 1}`
          });
        }
      });
    }

    // INVESTMENTS
    if (this.selectedAssets.includes('Investments')) {
      this.investmentsArray.controls.forEach((ctrl: any) => {
        const row = ctrl.value;

        if (this.hasAnyValue(row, ['type', 'value', 'name'])) {
          let typeCode = '';
          switch ((row.type || '').toLowerCase()) {
            case 'stocks':
              typeCode = 'STOCKS';
              break;
            case 'mutual funds':
              typeCode = 'MUTUAL_FUNDS';
              break;
            case 'bonds':
              typeCode = 'BONDS';
              break;
            case 'debentures':
              typeCode = 'DEBENTURES';
              break;
            case 'others':
              typeCode = 'OTHERS';
              break;
          }

          if (typeCode) {
            addItem(typeCode, row.value || 0, {
              assetType: row.type === 'Others' ? (row.name || 'Others') : row.type
            });
          }
        }
      });
    }

    // OTHER ASSETS
    if (this.selectedAssets.includes('Other')) {
      this.otherassets.controls.forEach((ctrl: any) => {
        const row = ctrl.value;

        if (this.hasAnyValue(row, ['assettype', 'assetamt'])) {
          addItem('OTHER', row.assetamt || 0, {
            assetType: row.assettype || ''
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

  buildAssetsPayloadWithApplicantId(): {
    invalid: boolean;
    applicantId?: any;
    items: any[];
  } {
    const result = this.buildAssetsPayload();

    if (!result || result.invalid) {
      return {
        invalid: true,
        items: []
      };
    }
    const applicantId = this.getApiApplicantId();



    return {
      invalid: false,
      applicantId: applicantId,
      items: result.items
    };
  }

  //check already saved or not
  isPayloadChanged(current: any, saved: any) {
    return JSON.stringify(current) !== JSON.stringify(saved);
  }
  //get saved data from api
  getSavedAssets(applicantId: any): Promise<any> {
    return new Promise((resolve) => {
      this.formSvc.getSavedData(
        this.applicationId,
        applicantId,
        "SAVE_ASSETS"
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
        // const result1 = this.buildAssetsPayload();

        const result = this.buildDraftAssetsPayloadWithApplicantId(); //this.buildAssetsPayloadWithApplicantId();

        if (!result) {
          console.log("Invalid form - not saving");
          return;
        }

        // const input = { items: result.items };

        const input = {
          applicantId: result.applicantId,
          items: result.items
        };

        console.log(input);

        // const key = this.getStorageKey();
        // localStorage.setItem(key, JSON.stringify(input));
        this.storageservice.saveSectionData(
          'assetsinfoData',
          this.applicationId,
          this.applicantId,
          this.isCoApplicant,
          input
        );

        if (this.isCoApplicant) {
          this.formSvc.co_aseetsInfoData = input;
        } else {
          this.formSvc.aseetsInfoData = input;
        }

        const applicantId = this.getApiApplicantId();

        if (!applicantId) {
          console.error('ApplicantId not found for photo upload');
          return;
        }


        const inputdata = {
          action: "auto-save",
          sectionKey: "SAVE_ASSETS",
          applicationId: this.applicationId,
          applicantId: applicantId,
          jsonData: input
        };

        this.formSvc.saveandExit(inputdata).subscribe({
          next: () => {
            this.lastSavedPayload = { ...input };
          }, error: (err) => {
            console.error("Assets saveExit error:", err);
          }

        });
        this.router.navigate(['/admin/losoperation']);
      }
    });
  }
  getStepRoute() {
    return this.isCoApplicant ? 'co-assetsinfo' : 'assetsinfo';
  }
  private hasValue(val: any): boolean {
    return val !== null && val !== undefined && val !== '';
  }

  private hasAnyValue(obj: any, keys: string[]): boolean {
    return keys.some(key => this.hasValue(obj?.[key]));
  }
  get hasNoassetsSelected(): boolean {
    return this.selectedAssets?.includes(this.NO_ASSETS_CODE);
  }

  next() {

    const payload = this.buildAssetsPayloadWithApplicantId();//{ items: result.items, applicantId: this.applicantId, };

    if (payload.invalid) {

      console.log("Form invalid - stop navigation");
      this.assetsForm.markAllAsTouched();
      return;

    }

    if (this.isCoApplicant && !this.checkoccupation && this.hasNoassetsSelected) {
      // if ((occupationType?.[0]?.label === "Housewife / Homemaker" || occupationType?.[0]?.label === "Unemployed") && this.checkboxasset === "No") {
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
      // }
    }

    const hasChanged = !this.lastSavedPayload ||
      this.isPayloadChanged(payload, this.lastSavedPayload);

    const stepRoute = this.getStepRoute();

    if (!hasChanged && !this.loadedFromSaveExit) {
      console.log("No changes, skip API");

      this.stepperService.markStepCompleted(stepRoute);
      this.stepperService.setStepData(stepRoute, this.assetsForm.getRawValue());
      this.stepperService.next();
      return;
    }

    if (this.hasNoassetsSelected) {
      this.msgBox.open({
        title: 'Update Asset Information?',
        message: `You previously declared that you have assets in the\n General Information section. \nBy selecting 'I don't have assets', your earlier information\n will be updated. \n
        Are you sure you want to continue?`,
        showCancel: true,
        okText: 'Yes, Update',
        onOk: () => {
          this.formSvc.noAssetsSelected({ "hasAssets": false }, this.applicationId, this.applicantId).subscribe({
            next: (res) => {
              if(res.status == "success"){
                this.nextResponseFunction(res, payload, stepRoute);
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
    } else {
      this.formSvc.getAssets(payload, this.applicationId, false).subscribe({
        next: (res) => {
          if(res.status == "success"){
            this.nextResponseFunction(res, payload, stepRoute);
          }
        },
        error: (err) => {
          console.log(err);
        }
      });  
    }
  }

  nextResponseFunction(res: any, payload: any, stepRoute: any){
    this.lastSavedPayload = { ...payload };


    if (this.isCoApplicant) {
      this.formSvc.co_aseetsInfoData = payload;
    } else {
      this.formSvc.aseetsInfoData = payload;
    }


    // localStorage.setItem(this.getStorageKey(), JSON.stringify(payload));
    this.storageservice.saveSectionData(
      'assetsinfoData',
      this.applicationId,
      this.applicantId,
      this.isCoApplicant,
      JSON.stringify(payload)
    );
    this.stepperService.markStepCompleted(stepRoute);
    this.stepperService.setStepData(stepRoute, this.assetsForm.getRawValue());

    this.stepperService.next();
  }




  //edit from summary
  enableForm(): void {
  if (this.isDataLoading) {
    return;
  }

  this.originalFormValue =
    this.assetsForm.getRawValue();

  this.isViewMode = false;
  this.isEditMode = true;
  this.viewOnly = false;

  this.assetsForm.enable({
    emitEvent: false
  });

  this.cd.detectChanges();
}

  cancelSummaryEdit() {
    if (this.isEditMode && this.originalFormValue) {
      this.assetsForm.patchValue(this.originalFormValue);
    }

    this.isViewMode = true;
    this.isEditMode = false;
    this.assetsForm.disable();
  }

  saveSummaryEdit() {
    const input = this.buildAssetsPayloadWithApplicantId();//{ items: result.items, applicantId: this.applicantId, };

    if (input.invalid) {

      console.log("Form invalid - stop navigation");
      this.assetsForm.markAllAsTouched();
      return;

    }

    if (this.hasNoassetsSelected) {
      this.msgBox.open({
        title: 'Update Asset Information?',
        message: `You previously declared that you have assets in the\n General Information section. \nBy selecting 'I don't have assets', your earlier information\n will be updated. \n
        Are you sure you want to continue?`,
        showCancel: true,
        okText: 'Yes, Update',
        onOk: () => {
          this.formSvc.noAssetsSelected({ "hasAssets": false }, this.applicationId, this.applicantId).subscribe({
            next: (res) => {
              if (res.status === 'success') {
                this.saveResponseFunction(res, input);
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
    } else {
      this.formSvc.getAssets(input, this.applicationId, false).subscribe({
        next: (res) => {
          if (res.status === 'success') {
            this.saveResponseFunction(res, input);
          }
        },
        error: (err) => {
          console.log(err);
        }
      });  
    }
  }

  saveResponseFunction(res: any, input: any){
    const key = this.getStorageKey();
    localStorage.setItem(key, JSON.stringify(input));

    if (this.isCoApplicant) {
      this.formSvc.co_aseetsInfoData = input;
    } else {
      this.formSvc.aseetsInfoData = input;
    }

    this.lastSavedPayload = { ...input };

    console.log(res);

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
      this.assetsForm.disable();
    }
  }
}
