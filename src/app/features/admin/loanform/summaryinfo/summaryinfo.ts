import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Addcustomerservice } from '../../../../core/service/addcustomerservice';
import { Loanformservice } from '../../../../core/service/loanformservice';
import { Loanstepperservice } from '../../../../core/service/loanstepperservice';
import { Main } from '../../../../core/service/main';
import { otherFields } from '../../../../shared/config/custdetails.config';
import { Button } from 'bootstrap';
import { Inputfield } from '../../../systemdesign/inputfield/inputfield';
import { Buttons } from '../../../systemdesign/buttons/buttons';
import { SummaryHelper } from '../../../../utils/summaryHelper';
import { Successbox } from '../../customer/successbox/successbox';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';


@Component({
  selector: 'app-summaryinfo',
  imports: [CommonModule, ReactiveFormsModule, Inputfield, Buttons, Successbox],
  standalone: true,
  templateUrl: './summaryinfo.html',
  styleUrl: './summaryinfo.scss'
})
export class Summaryinfo {

  openIndex: number[] = [0];
  openKeys: string[] = ['general'];
  accordions = [
    { key: 'general', title: 'General Info', alwaysOpen: true },
    { key: 'expense', title: 'Estimated Expense', alwaysOpen: false, amount: 0 },
    { key: 'additional', title: 'Additional Info', alwaysOpen: false },
    { key: 'kyc', title: 'KYC', alwaysOpen: true },
    { key: 'education', title: 'Education Details', alwaysOpen: false },
    { key: 'income', title: 'Income Details', alwaysOpen: true },
    { key: 'assets', title: 'Assets', alwaysOpen: false, amount: 0 },
    { key: 'liabilities', title: 'Liabilities', alwaysOpen: true, amount: 0 },
    { key: 'monthly', title: 'Monthly Expenditure', alwaysOpen: false, amount: 0 },
    { key: 'reference', title: 'Reference', alwaysOpen: true },
    // { key: 'coapplicants', title: 'Co-Applicant', alwaysOpen: true },
  ];


  summaryForm!: FormGroup;
  summaryData: any = null;
  summaryLoaded = false;

  currentOccupation = '';
  courseDetailsFields: { label: string; value: any }[] = [];

  // estimatedExpense 

  educationFees: { tuitionInr: any; tuitionAud: number } | null = null;
  livingExpenses: Array<{
    isGroup?: any;
    children?: any;
    name: string;
    frequency: string;
    amountInr: number;
    amountAud: number;
    description?: string;

  }> = [];

  miscellaneousExpenses: Array<{
    name: string;
    frequency: string;
    amountInr: number;
    amountAud: number;
    description?: string;
    isGroup?: any;
    children?: any;
  }> = [];
  totalEstimatedExpenseInr: any;
  totalEstimatedExpenseAud: any;
  totalassetsval: any;
  totalliabilities: any;
  totalMonthlyExpenditure: any;
  totalMiscellaneousExpense: any;
  totalLivingExpense: any;


  additionalInfoFields: any = {
    mainApplicant: [],
    spouse: [],
    father: [],
    mother: []
  };
  otherFields = otherFields;
  applicantId: any;
  applicationId: any;
  isEmployed = false;
  isSelfEmployed = false;


  KycInfoFields: any = {
    identityAndResidency: [],
    permanentAddress: [],
    currentAddress: [],
    otherAddress: []

  };


  documentTypes = [
    { key: 'salarySlips', label: 'Salary Slip' },
    { key: 'form16', label: 'Form 16' },
    { key: 'bankStatements', label: 'Bank Statement' },
    { key: 'itrs', label: 'ITR' },
    { key: 'otherIncome', label: 'Other Document Name' },

  ];
  incomeDetails: any = {
    editUrl: '',
    salarySlips: [],
    bankStatements: [],
    form16: [],
    itrs: [],
    otherIncome: []
  };
  businessdocumentTypes = [
    { key: 'business_finance_3_years', label: 'Year' },
    { key: 'business_itr_3_years', label: 'ITR' },
    { key: 'business_gst_1_year', label: '1 Year GST return' },
    { key: 'business_bank_statement_1_year', label: '1 Year Bank Statement' },

    { key: 'otherBussinessincome', label: 'Other Document Name' },

  ];
  incomeBusinessDetails: any = {
    editUrl: '',
    business_gst_1_year: [],
    business_itr_3_years: [],
    business_bank_statement_1_year: [],
    business_finance_3_years: [],
    oneYearGstReturns: [],
    otherBussinessincome: []
  };


  // Declare monthlyExpenditure property to hold API data
  monthlyExpenditure: any = {
    totalMonthlyInr: 0,
    rentHomeMaintenance: null,
    groceriesHousehold: null,
    utilitiesElectricityWaterGas: null,
    transportation: null,
    schoolEducationFees: null,
    medicalMedicines: null,
    otherRecurringExpenses: [
      { expenseName: '', amountInr: '' }
    ]
  };
  // Define the dynamic fields array for iteration in template
  monthlyExpenditureFields = [
    { key: 'rentHomeMaintenance', label: 'Rent / Home Maintenance' },
    { key: 'groceriesHousehold', label: 'Groceries and Household' },
    { key: 'telephoneInternetBills', label: 'Telephone and Internet bills' },
    { key: 'utilitiesElectricityWaterGas', label: 'Utilities / Bills (Electricity, Water, Gas)' },
    { key: 'transportation', label: 'Transportation' },
    { key: 'schoolEducationFees', label: 'School Education Fees' },
    { key: 'medicalMedicines', label: 'Medical / Medicines' },
    { key: 'otherRecurringExpenses', label: 'Other Recurring Expenses' }
  ];



  assetsSections: any[] = [];
  isasset: boolean = false;
  liabilitiesSections: any[] = [];

  qualificationDetail: any = {
    QualificationDetails: [],
  };

  EducationInfoFields: any = {
    tenth: [],
    twelfth: [],
    diploma: [],
    bachelors: [],
    postgraduate: [],
    others: [],
    ieltsPte: [],
    offerLetter: []

  };
  educationSections = [
    { title: '10th', key: 'tenth' },
    { title: '12th', key: 'twelfth' },
    { title: 'Diploma', key: 'diploma' },
    { title: 'Undergraduate', key: 'bachelors' },
    { title: 'Postgraduate', key: 'postgraduate' },
    { title: 'Other', key: 'others' },
 
  ];


  ReferenceInfoFields: any = {


  };

  filteredAccordions: any[] = [];
  showIncome = false;
  showAssets = false;
  showMonthly = false;

  mainApplicantSummary: any = null;
  coApplicantSummaries: any[] = [];
  summaryApplicants: any[] = [];
  submitDescription: any = "";

  isSummaryLoading = false;
summaryLoadError = '';

  constructor(private fb: FormBuilder, private formSvc: Loanformservice, private stepperService: Loanstepperservice, private cd: ChangeDetectorRef, private loanformservice: Loanformservice,
    private router: Router, private route: ActivatedRoute, public main: Main, private apiservice: Addcustomerservice, private sanitizer: DomSanitizer) { }

  ngOnInit(): void {
    this.stepperService.markStepCompleted('summaryinfo');
    let Allids = this.stepperService.getLoanId();

    this.applicantId = Allids[0];
    this.applicationId = Allids[1];
    // this.custName = Allids[2];
    // this.custARN = Allids[3];

    let AllCoapp_ids = this.stepperService.getCo_appId();


    if (

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

  this.buildForm();
    this.getSummarydetails()
   
  }



  trackByKey(index: number, field: any) {
    return field.key;
  }
  trackByAccordion(index: number, acc: any) {
    return acc.key;
  }


  buildForm() {
    const group: { [key: string]: FormControl } = {};
    this.summaryForm = new FormGroup(group);
  }
  toggle1(index: number) {
    if (this.openIndex.includes(index)) {
      this.openIndex = this.openIndex.filter(i => i !== index);
    } else {
      this.openIndex.push(index);
    }
    this.cd.detectChanges();
  }

  toggle(key: string) {
    if (this.openKeys.includes(key)) {
      this.openKeys = this.openKeys.filter(k => k !== key);
    } else {
      this.openKeys.push(key);
    }
  }
  toggleCoAppAccordion(item: any) {
    item.showAccordion = !item.showAccordion;
  }
  private getApplicantType(applicant: any): string {
    return String(
      applicant?.applicantType ||
      applicant?.applicantype ||
      applicant?.applicant_type ||
      ''
    )
      .toUpperCase()
      .trim();
  }


  getSummarydetails() {
      this.isSummaryLoading = true;
        this.summaryLoaded = false;
         this.summaryLoadError = '';

    this.formSvc.getSummary(this.applicationId).subscribe(
      (res: any) => {
        try {
        if (res && res.status === 'success' && res.data) {

          const rootData = res.data;

          const applicants = Array.isArray(rootData?.applicants)
            ? rootData.applicants
            : [];

          const mainApplicant = applicants.find((x: any) =>
            this.getApplicantType(x) === 'PRIMARY'
          );

          const coApplicants = applicants.filter((x: any) =>
            this.getApplicantType(x).startsWith('CO_APPLICANT')
          );

          if (mainApplicant) {
            this.mainApplicantSummary = this.buildApplicantSummary(
              mainApplicant,
              'MAIN',
              0
            );

            // keep existing main UI working
            this.bindMainApplicantSummary(this.mainApplicantSummary);
          }


          this.coApplicantSummaries = coApplicants
           .filter((coapp: any) => this.isCompletedCoApplicant(coapp))
            .map((coapp: any, index: number) => {
              try {
                coapp.showAccordion = false;
                return this.buildApplicantSummary(
                  coapp,
                  'CO_APPLICANT',
                  this.getCoApplicantIndex(coapp, index)
                );
              } catch (err) {
                console.error('Error building coapp summary:', coapp, err);
                return null;
              }
            })
            .filter(Boolean);

          console.log('CO APPLICANT SUMMARIES:', this.coApplicantSummaries);
this.summaryLoaded = true;
          this.cd.detectChanges();
        } 
      else {
          this.summaryLoadError = 'Unable to load summary details.';
        }
      }catch (err) {
        console.error('Summary binding failed:', err);
        this.summaryLoadError = 'Something went wrong while preparing summary.';
      } finally {
        this.isSummaryLoading = false;
        this.cd.detectChanges();
      }
      },
      (error) => {
        console.error('Error fetching summary details:', error);
        this.summaryLoadError = 'Failed to load summary details.';
      this.isSummaryLoading = false;
      this.summaryLoaded = false;

      this.cd.detectChanges();
      }
    );
  }
private isCompletedCoApplicant(coapp: any): boolean {
  const status = (
    coapp?.status ||
    coapp?.uiStatus ||
    coapp?.applicationStatus ||
    ''
  )
    .toString()
    .trim()
    .toUpperCase();

  return status === 'COMPLETED' || status === 'SUBMITTED';
}
  private getCoApplicantIndex(applicant: any, fallbackIndex: number): number {
    const type = this.getApplicantType(applicant);

    const match = type.match(/^CO_APPLICANT(\d+)$/);

    if (match) {
      return Number(match[1]) ;
    }

    return fallbackIndex + 1;
  }
  private buildApplicantSummary(data: any, applicantType: 'MAIN' | 'CO_APPLICANT', index: number): any {
    if (!data) return null;

    const basicInfoData = SummaryHelper.extractcoappBasicInfo(data);
    const generalInfoData =
      applicantType === 'CO_APPLICANT'
        ? SummaryHelper.extractcoappGeneralInfo(data?.generalInfo || {})
        : SummaryHelper.extractGeneralInfo(data?.generalInfo || {});

    const estimatedExpenseData = SummaryHelper.extractEstimatedExpense(
      data?.estimatedExpense || {}
    );

    const additionalInfoData = SummaryHelper.extractAdditionalInfo(
      data?.additionalInfo || {},
      applicantType
    );

    const kycInfoData = SummaryHelper.extractKYCInfo(data?.kyc || {});

    const assetsSections = SummaryHelper.extractAssetsInfo(data?.assets || {});

    const liabilitiesSections = SummaryHelper.extractLiabilitiesInfo(
      data?.liabilities || {}
    );

    const referenceInfoData = SummaryHelper.extractReferenceInfo(
      // data?.references || []
      Array.isArray(data?.references) ? data.references : []
    );

    const qualificationInfoData = SummaryHelper.extractQualificationInfo(
      data?.qualificationDetail || {}
    );

    const educationInfoData = SummaryHelper.extractEducationInfo(
      data?.educationDetails || {}
    );

    const monthlyExpenditure = data?.monthlyExpenditure || {};

    const monthlyFields = [
      { key: 'rentHomeMaintenance', label: 'Rent / Home Maintenance' },
      { key: 'groceriesHousehold', label: 'Groceries and Household' },
      { key: 'telephoneInternetBills', label: 'Telephone and Internet bills' },
      { key: 'utilitiesElectricityWaterGas', label: 'Utilities / Bills (Electricity, Water, Gas)' },
      { key: 'transportation', label: 'Transportation' },
      { key: 'schoolEducationFees', label: 'School Education Fees' },
      { key: 'medicalMedicines', label: 'Medical / Medicines' }
    ];

    const monthlyExpenditureFields = monthlyFields.filter(field =>
      this.hasMonthlyValue(monthlyExpenditure[field.key])
    );

    return {
      applicantType,
      applicantId: data?.applicantId,
      applicationId: data?.applicationId,
      arNumber: data?.arNumber,
      customerId: data?.customerId,
      status: data?.status,
      applicantTypeRaw: this.getApplicantType(data),
      index: index,

      applicantName:
        data?.applicantName ||
        `${data?.firstName || ''} ${data?.middleName || ''} ${data?.lastName || ''}`
          .replace(/\s+/g, ' ')
          .trim(),

      firstName: data?.firstName || '',
      middleName: data?.middleName || '',
      lastName: data?.lastName || '',
      mobileNumber: data?.mobileNumber || '',
      emailId: data?.emailId || '',

      totalEstimatedExpenseAud: data?.totalEstimatedExpenseAud || 0,
      totalEstimatedExpenseInr: data?.totalEstimatedExpenseInr || 0,
      conversionRate: data?.conversionRate || 0,
      netWorthInr: data?.netWorthInr || 0,

      basicDetailsFields: basicInfoData?.basicDetailsFields || '',
      currentOccupation: generalInfoData?.currentOccupation || '-',
      courseDetailsFields: generalInfoData?.courseDetailsFields || [],

      educationFees: estimatedExpenseData?.educationFees || null,
      livingExpenses: estimatedExpenseData?.livingExpenses || [],
      miscellaneousExpenses: estimatedExpenseData?.miscellaneousExpenses || [],
      totalLivingExpense: data?.estimatedExpense?.totalLivingExpense || 0,
      totalMiscellaneousExpense: data?.estimatedExpense?.totalMiscExpense || 0,


      additionalInfoFields: additionalInfoData || {
        applicantDetails: [],
        spouse: [],
        father: [],
        mother: []
      },


      kycInfoFields: kycInfoData || {
        identityAndResidency: [],
        permanentAddress: [],
        secondAddress: []
      },


      incomeDetails: this.sortIncomeDocuments(data?.incomeDetails) || {
        editUrl: '',
        salarySlips: [],
        bankStatements: [],
        form16: [],
        itrs: [],
        otherIncome: []
      },

      incomeBusinessDetails: this.sortIncomeDocuments(data?.incomeBusinessDetails) || {
        editUrl: '',
        business_gst_1_year: [],
        business_itr_3_years: [],
        business_bank_statement_1_year: [],
        business_finance_3_years: [],
        oneYearGstReturns: [],
        otherBussinessincome: []
      },

      assetsSections: assetsSections || [],
      totalAssets: data?.assets?.totalAssets || 0,

      liabilitiesSections: liabilitiesSections || [],
      totalLiabilities: data?.liabilities?.totalLiabilities || 0,

      monthlyExpenditure,
      monthlyExpenditureFields,
      totalMonthlyExpenditure: monthlyExpenditure?.totalMonthlyInr || 0,

      qualificationDetail: qualificationInfoData,
      educationInfoFields: educationInfoData,
      referenceInfoFields: referenceInfoData || []
    };
  }
  private bindMainApplicantSummary(summary: any): void {
    if (!summary) return;

    this.summaryData = summary;
    this.formSvc.setSummary(summary);

    this.totalEstimatedExpenseAud = summary.totalEstimatedExpenseAud;
    this.totalEstimatedExpenseInr = summary.totalEstimatedExpenseInr;

    this.setAccordionAmount('expense', this.totalEstimatedExpenseInr);

    this.currentOccupation = summary.currentOccupation;
    this.courseDetailsFields = summary.courseDetailsFields;

    this.isasset = this.courseDetailsFields.some(
      (field: any) =>
        field.label === 'Do you have Assets?' &&
        String(field.value).toLowerCase() === 'yes'
    );

    const occupation = this.normalizeOccupation(this.currentOccupation);

    this.isEmployed = occupation === 'employed';
    this.isSelfEmployed =
      occupation === 'self employed' ||
      occupation === 'self-employed';

    this.showIncome = this.isEmployed || this.isSelfEmployed;

    this.showAssets =
      this.isasset === true &&
      occupation !== 'housewife' &&
      occupation !== 'housewife / homemaker';

    this.filteredAccordions = this.accordions.filter(acc => {
      if (acc.key === 'income' && !this.showIncome) return false;
      if (acc.key === 'assets' && !this.showAssets) return false;
      return true;
    });

    this.educationFees = summary.educationFees;
    this.livingExpenses = summary.livingExpenses;
    this.miscellaneousExpenses = summary.miscellaneousExpenses;
    this.totalLivingExpense = summary.totalLivingExpense;
    this.totalMiscellaneousExpense = summary.totalMiscellaneousExpense;

    this.additionalInfoFields = summary.additionalInfoFields;
    this.KycInfoFields = summary.kycInfoFields;

    this.incomeDetails = summary.incomeDetails;
    this.incomeBusinessDetails = summary.incomeBusinessDetails;

    this.monthlyExpenditure = {
      ...this.monthlyExpenditure,
      ...(summary.monthlyExpenditure || {})
    };

    this.monthlyExpenditureFields = summary.monthlyExpenditureFields;
    this.totalMonthlyExpenditure = summary.totalMonthlyExpenditure;
    this.setAccordionAmount('monthly', this.totalMonthlyExpenditure);

    this.assetsSections = summary.assetsSections;
    this.totalassetsval = summary.totalAssets;
    this.setAccordionAmount('assets', this.totalassetsval);

    this.liabilitiesSections = summary.liabilitiesSections;
    this.totalliabilities = summary.totalLiabilities;
    this.setAccordionAmount('liabilities', this.totalliabilities);

    this.qualificationDetail = summary.qualificationDetail;
    this.EducationInfoFields = summary.educationInfoFields;

    this.ReferenceInfoFields = summary.referenceInfoFields;
  }
  private setAccordionAmount(key: string, amount: any): void {
    const acc = this.accordions.find((x: any) => x.key === key);
    if (acc) {
      acc.amount = amount || 0;
    }
  }
  editCoApplicant(coapp: any,section: string) {
     this.formSvc.startSummaryEditFlow( coapp, 'CO_APPLICANT'  );

    this.stepperService.setStepperType('CO_APPLICANT');
    this.stepperService.setCurrentCoApplicantIndex(coapp.index);

    sessionStorage.setItem('coAppIds', JSON.stringify({
      applicantId: coapp.applicantId,
      applicationId: coapp.applicationId || this.applicationId,
      fullName: coapp.applicantName,
      coApplicantIndex: coapp.index,
      status:coapp.status || 'COMPLETED',
       mode:  'existing' ,
    }));

    this.stepperService.setCo_appId(
      coapp.applicantId,
      coapp.applicationId || this.applicationId,
      coapp.applicantName,
      undefined,
      coapp.index
    );

    this.router.navigate(
      ['/loanform', 'co-applicantdetails', 'coapplicantinfo',section],
      {
        queryParams: {
          coApplicantIndex: coapp.index,
          coApplicantId: coapp.applicantId,
          mode: 'view',
          fromSummary: true
        }
      }
    );
  }
  getSummarydetails1() {
    this.formSvc.getSummary(this.applicationId).subscribe(
      (res: any) => {
        if (res && res.status === 'success' && res.data) {
          const data = res.data.applicants[0];

          this.summaryData = data;
          this.formSvc.setSummary(data);

          this.totalEstimatedExpenseAud = data.totalEstimatedExpenseAud;
          this.totalEstimatedExpenseInr = data.totalEstimatedExpenseInr;
          this.accordions[1].amount = this.totalEstimatedExpenseInr;


          // Use helper methods to extract data
          const generalInfoData = SummaryHelper.extractGeneralInfo(data.generalInfo);
          this.currentOccupation = generalInfoData.currentOccupation;
          this.courseDetailsFields = generalInfoData.courseDetailsFields;
          this.isasset = this.courseDetailsFields.some((field: any) => field.label === 'Do you have Assets?' && field.value === 'Yes');

          const occupation = this.normalizeOccupation(this.currentOccupation);



          this.isEmployed = occupation === 'employed';
          this.isSelfEmployed = occupation === 'self employed' || occupation === 'Self-employed';
          this.showIncome = this.isEmployed || this.isSelfEmployed;

          this.showAssets =
            this.isasset === true &&
            occupation !== 'housewife' &&
            occupation !== 'housewife / homemaker';

          this.filteredAccordions = this.accordions.filter(acc => {


            if (acc.key === 'income' && !this.showIncome) return false;
            if (acc.key === 'assets' && !this.showAssets) return false;



            return true;
          });



          // Extract Estimated Expense
          const estimatedExpenseData = SummaryHelper.extractEstimatedExpense(data.estimatedExpense);
          this.educationFees = estimatedExpenseData.educationFees;
          this.livingExpenses = estimatedExpenseData.livingExpenses;
          this.miscellaneousExpenses = estimatedExpenseData.miscellaneousExpenses;
          this.totalLivingExpense = data.estimatedExpense.totalLivingExpense;
          this.totalMiscellaneousExpense = data.estimatedExpense.totalMiscExpense;



          const additionalInfoData = SummaryHelper.extractAdditionalInfo(data.additionalInfo, 'MAIN');
          this.additionalInfoFields = additionalInfoData;

          const KYCInfoData = SummaryHelper.extractKYCInfo(data.kyc);
          this.KycInfoFields = KYCInfoData;

          this.incomeDetails = data.incomeDetails || {
            editUrl: '',
            salarySlips: [],
            bankStatements: [],
            form16: [],
            itrs: [],
            otherIncome: []
          };

          this.incomeBusinessDetails = data.incomeBusinessDetails || {
            editUrl: '',
            business_gst_1_year: [],
            business_itr_3_years: [],
            business_bank_statement_1_year: [],
            business_finance_3_years: [],
            oneYearGstReturns: [],
            otherBussinessincome: []
          };


          // this.monthlyExpenditure = res.data.monthlyExpenditure || this.monthlyExpenditure;
          this.monthlyExpenditure = { ...this.monthlyExpenditure, ...(data.monthlyExpenditure || {}) };

          const allFields = [
            { key: 'rentHomeMaintenance', label: 'Rent / Home Maintenance' },
            { key: 'groceriesHousehold', label: 'Groceries and Household' },
            { key: 'utilitiesElectricityWaterGas', label: 'Utilities / Bills (Electricity, Water, Gas)' },
            { key: 'transportation', label: 'Transportation' },
            { key: 'schoolEducationFees', label: 'School Education Fees' },
            { key: 'medicalMedicines', label: 'Medical / Medicines' },
            //  { key: 'otherRecurringExpenses', label: 'Other Recurring Expenses' }
          ];

          // this.monthlyExpenditureFields = allFields.filter(field => this.monthlyExpenditure[field.key] != null);
          this.monthlyExpenditureFields = allFields.filter(field =>
            this.hasMonthlyValue(this.monthlyExpenditure[field.key])
          );
          this.totalMonthlyExpenditure = data.monthlyExpenditure.totalMonthlyInr;
          this.accordions[8].amount = this.totalMonthlyExpenditure;


          this.assetsSections = SummaryHelper.extractAssetsInfo(data.assets);
          console.log("assetsSections", this.assetsSections);

          this.totalassetsval = data.assets.totalAssets;
          this.accordions[6].amount = this.totalassetsval;


          this.liabilitiesSections = SummaryHelper.extractLiabilitiesInfo(data.liabilities);
          this.totalliabilities = data.liabilities.totalLiabilities;
          this.accordions[7].amount = this.totalliabilities;

          const qualificationInfoData = SummaryHelper.extractQualificationInfo(data.qualificationDetail);
          this.qualificationDetail = qualificationInfoData;

          const educationInfoData = SummaryHelper.extractEducationInfo(data.educationDetails);
          this.EducationInfoFields = educationInfoData;
          this.educationSections = this.educationSections.filter(section => {
            const fields = this.EducationInfoFields[section.key];

            // return fields?.some((field: any) => field.value && field.value !== '-');
            return fields?.some((field: any) => {
              if (field.key === 'marksheetUrl') {
                return Array.isArray(field.value) && field.value.length > 0;
              }
              return field.value && field.value !== '-';
            });
          });



          const ReferenceInfoData = SummaryHelper.extractReferenceInfo(data.references);
          this.ReferenceInfoFields = ReferenceInfoData;

          this.cd.detectChanges();
        }
      },
      (error) => {
        console.error('Error fetching summary details:', error);
      }
    );
  }

  submitsummary() {
    let input = {
      "applicationId": this.applicationId,
      "applicantId": this.applicantId
    }
    this.formSvc.submitMainApplicationSummary(this.applicationId, {}).subscribe((res: any) => {
      console.log(res);
      if (res.status === "success") {
         this.formSvc.clearSummaryEditFlow();
           this.formSvc.clearSummaryEducationEditFlow?.();
             this.stepperService.clearSummaryEducationEditFlow();
             sessionStorage.removeItem( 'summaryEducationLockState'  );
             sessionStorage.removeItem('coAppIds');
             sessionStorage.removeItem(
'educationFlowQualificationId'
);

        this.submitDescription = `Application Reference Number : ${res.application.referenceNumber}`;
        return;
      }
    },

      (error) => {
        console.log('Submit summary failed', error);
      }
    );

    this.formSvc.submitCoappSummary(input).subscribe(
      (res: any) => {
        console.log(res)
        if (res.status === "success") {
          // this.saveCoApplicantOnDashboard();
          // this.router.navigate(['/loanform/co-applicantdetails']);
        }
      },

      (error) => {
        console.error('Submit summary failed', error);
      }

    )
  }

  openPdf() {
    this.formSvc.openPdfFileApplicationSummary(this.applicationId).subscribe((res: any) => {
      const fileUrl = URL.createObjectURL(res);
      const safeUrl: SafeResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(fileUrl);
      window.open(fileUrl, '_blank');
      setTimeout(() => URL.revokeObjectURL(fileUrl), 10000);
    },
      (error) => {
        console.log(error);
      }
    );
  }

  handleSuccessAction(action: string) {
    if (action === 'openPdf') {
      this.openPdf();
    }

    else if (action === 'ToDashboard') {
      this.submitDescription = "";
      this.router.navigate(['/admin/dashboard']);
    }
  }

  labelDisplayMap: { [key: string]: string } = {
    'GROCERIES HOUSEHOLD': 'Groceries and Household',
    'RENT HOME MAINTENANCE': 'Rent / Home Maintenance',
    'TRANSPORTATION': 'Transportation',
    'SCHOOL EDUCATION FEES': 'School Education Fees',
    'MEDICAL MEDICINES': 'Medical / Medicines',
    'UTILITIES': 'Utilities',
    'OTHER RECURRING EXPENSES': 'Other Recurring Expenses'
  };

  getDisplayLabel(rawName: string): string {
    if (!rawName) return '-';
    // Normalize key to uppercase trimmed for matching
    const key = rawName.trim().toUpperCase();
    return this.labelDisplayMap[key] || rawName;
  }

  hasArrayData(data: any, keys: string[]): boolean {
    return keys.some(key => Array.isArray(data?.[key]) && data[key].length > 0);
  }
  isArray(value: any): boolean {
    return Array.isArray(value);
  }

  hasIncomeData(): boolean {
    const salariedKeys = [
      'salarySlips',
      'bankStatements',
      'form16',
      'itrs',
      'otherIncome'
    ];

    const businessKeys = [
      'business_gst_1_year',
      'business_itr_3_years',
      'business_bank_statement_1_year',
      'business_finance_3_years',
      'otherBussinessincome'
    ];

    return (
      this.hasArrayData(this.incomeDetails, salariedKeys) ||
      this.hasArrayData(this.incomeBusinessDetails, businessKeys)
    );
  }
//sorted income documents
  private getDocumentSequence(document: any): number {
  const value = String(
    document?.name ||
    document?.documentName ||
    document?.title ||
    ''
  )
    .trim()
    .toLowerCase();

  const match = value.match(/(\d+)\s*$/);

  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

private sortIncomeDocuments(income: any): any {
  if (!income) {
    return income;
  }

  const sortableKeys = [
    'salarySlips',
    'itrs',
    'business_finance_3_years',
    'business_itr_3_years'
  ];

  const sortedIncome = {
    ...income
  };

  sortableKeys.forEach(key => {
    sortedIncome[key] = Array.isArray(income[key])
      ? [...income[key]].sort(
          (first: any, second: any) =>
            this.getDocumentSequence(first) -
            this.getDocumentSequence(second)
        )
      : [];
  });

  return sortedIncome;
}

  formatInr(value: number): string {
    return new Intl.NumberFormat('en-IN').format(value);
  }
  private normalizeOccupation(value: string): string {
    return (value || '')
      .toLowerCase()
      .trim()
      .replace(/[_-]/g, ' ')
      .replace(/\s+/g, ' ');
  }
  private hasMonthlyValue(val: any): boolean {
    if (val == null) return false;

    if (Array.isArray(val)) return val.length > 0;

    if (typeof val === 'object') {
      const amount = val.amountInr;
      const name = val.name;
      return (amount != null && amount !== '' && Number(amount) !== 0) || !!name;
    }

    return val !== '';
  }
  goToEdit(sectionKey: string, event: Event) {
    event.stopPropagation();
    event.preventDefault();

 const frontendRouteMap: any = {
      general: '/loanform/genralinfo',
      expense: '/loanform/expense',
      additional: '/loanform/additionalinfo',
      kyc: '/loanform/kycinfo',
      education: '/loanform/educationDetails',
      income: '/loanform/incomeinfo',
      assets: '/loanform/assetsinfo',
      liabilities: '/loanform/liabilitiesinfo',
      monthly: '/loanform/monthlyexpinfo',
      reference: '/loanform/referenceinfo'
    };

    const route = frontendRouteMap[sectionKey];

    if (!route) {
      console.warn('No frontend route found for section:', sectionKey);
      return;
    }

    this.formSvc.startSummaryEditFlow(this.summaryData, 'MAIN');

    this.router.navigate([route], {
      queryParams: {
        fromSummary: true,
        mode: 'view',
        section: sectionKey
      }
    });
  }
//show 35 char with ... only if filename is bigger
     getFileName(filename:any,maxLength: number = 30): string {
  const fileName = filename || '';
    if (fileName.length <= maxLength) {
          return fileName; 
        }
            return `${fileName.substring(0, maxLength)}...`;
}

  submit() {
  }
  back() {

  }
  next() {

  }
}
