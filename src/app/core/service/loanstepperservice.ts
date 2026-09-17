import { ChangeDetectorRef, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Loanformservice } from '../service/loanformservice';
import { BehaviorSubject } from 'rxjs';
import { ShowOnDirtyErrorStateMatcher } from '@angular/material/core';

interface Step {
  label: string;
  route: string;

  children?: {
    id: string;
    label: string;
  }[];

}
type StepperType = 'MAIN' | 'CO_APPLICANT';



@Injectable({
  providedIn: 'root'
})
export class Loanstepperservice {
  private applicantId: string | null = null;
  private applicationId: string | null = null;
  private custName: string | null = null;
  private custARN: string | null = null;

  private co_applicantId: string | null = null;
  private co_applicationId: string | null = null;
  private co_custName: string | null = null;
  private co_custARN: string | null = null;

  isasset: boolean = false;
  isincome: boolean = false;
  issalaried: boolean = false;
  coursetypeug: boolean = false;




  private stepperType: StepperType = 'MAIN';


  private educationSubStepsInitialized = false;

  private educationSubSteps: any[] = [];
  private completedEducationSections = new Set<string>();
  private completedSteps = new Set<string>();
  private formData: Record<string, any> = {};

  private stepsSubject = new BehaviorSubject<any[]>([]);
  public steps$ = this.stepsSubject.asObservable();
  private coStepsSubject = new BehaviorSubject<Step[]>([]);
  public coSteps$ = this.coStepsSubject.asObservable();

  private EDUCATION_PROGRESS_KEY = 'educationProgress';

  private summaryEducationEditMode = false;
  private summaryEducationSubstepsUnlocked = false;
  private SUMMARY_EDUCATION_LOCK_KEY = 'summaryEducationLockState';

  private completedStepsKey = 'loan_completed_steps';
  currentCoApplicantIndex: any = 1;
 

  constructor(private formSvc: Loanformservice, private router: Router) {

    this.restoreSummaryEducationLockState();
    this.buildSteps();


    const saved = localStorage.getItem('coursetypeug');
    if (saved !== null) {
      this.coursetypeug = JSON.parse(saved);
    }


  }
  rebuildSteps() {
    this.buildSteps();
  }
 

  private stageRouteMap: Record<string, string> = {
    LOAN_INFO: 'loaninfo',
    GENERAL_INFO: 'genralinfo',
    ESTIMATED_EXPENSE: 'expense',
    SAVE_EXPENSE: 'expense',
    PERSONAL_INFO: 'additionalinfo',
    FETCH_KYC: 'kycinfo',
    SAVE_KYC: 'kycinfo',
    SAVE_LAST_QUALIFICATION: 'educationDetails',
    EDUCATIONAL_DETAILS:'educationDetails',
    INCOME: 'incomeinfo',
    SAVE_ASSETS: 'assetsinfo',
    SAVE_LIABILITIES: 'liabilitiesinfo',
    SAVE_MONTHLY_EXPENSES: 'monthlyexpinfo',
    SAVE_REFERENCES: 'referenceinfo',
    COAPPLICANT: 'co-applicantdetails',
    FETCH_SUMMARY: 'summaryinfo'
  };

  getRouteFromStage(stage: string | null | undefined): string {
    if (!stage) return 'loaninfo';
    return this.stageRouteMap[stage] || 'loaninfo';
  }

  private buildSteps() {
    this.restoreApplicantStatesFromStorage(); // asset values stores
    this.buildMainApplicantSteps();      // always for left vertical stepper
    this.buildCoApplicantSteps();        // always for co-app horizontal stepper
  }


  // Main applicant vertical stepper
  private buildMainApplicantSteps() {
    const main = this.formSvc.applicantState;

    const baseSteps: Step[] = [
      { label: 'Loan Info', route: 'loaninfo' },
      { label: 'General Info', route: 'genralinfo' },
      { label: 'Estimated Expense', route: 'expense' },
      { label: 'Additional Info', route: 'additionalinfo' },
      { label: 'KYC', route: 'kycinfo' },
      {
        label: 'Education Details',
        route: 'educationDetails',
        children: this.educationSubSteps
      },
    ];

    const conditionalSteps: Step[] = [];

    if (main.isincome) {
      conditionalSteps.push({
        label: 'Income Details',
        route: 'incomeinfo'
      });
    }

    if (main.isasset) {
      conditionalSteps.push({
        label: 'Assets',
        route: 'assetsinfo'
      });
    }

    const finalSteps: Step[] = [
      ...baseSteps,
      ...conditionalSteps,
      { label: 'Liabilities', route: 'liabilitiesinfo' },
      { label: 'Monthly Expenditure', route: 'monthlyexpinfo' },
      { label: 'Reference', route: 'referenceinfo' },
      { label: 'Co-Applicant', route: 'co-applicantdetails' },
      { label: 'Summary', route: 'summaryinfo' }
    ];

    this.stepsSubject.next(finalSteps);
  }

  // Co-applicant horizontal stepper
  private buildCoApplicantSteps() {
    const co = this.formSvc.coApplicantState;

    const baseSteps: Step[] = [
      { label: 'Basic Info', route: 'co-basicinfo' },
      { label: 'General Info', route: 'co-generalinfo' },
      { label: 'Additional Info', route: 'co-additionalinfo' },
      { label: 'KYC', route: 'co-kyc' },
    ];

    const conditionalSteps: Step[] = [];

    if (co.isincome) {
      conditionalSteps.push({
        label: 'Income Details',
        route: 'co-incomeinfo'
      });
    }

    if (co.isasset) {
      conditionalSteps.push({
        label: 'Assets',
        route: 'co-assetsinfo'
      });
    }

    const finalSteps: Step[] = [
      ...baseSteps,
      ...conditionalSteps,
      { label: 'Liabilities', route: 'co-liabilitiesinfo' },
      { label: 'Monthly Expenditure', route: 'co-monthlyexpinfo' },
      { label: 'Summary', route: 'co-summaryinfo' }
    ];

    this.coStepsSubject.next(finalSteps);
  }

  setCurrentCoApplicantIndex(index: any) {
    this.currentCoApplicantIndex = index || 1;
    this.restoreCompletedSteps()
  }
  getCurrentCoApplicantIndex(): number {
    return Number(this.currentCoApplicantIndex) || 1;
  }



  isStepCompleted(route: string): boolean {
    return this.completedSteps.has(route);
  }


  isMainStepCompleted(route: string): boolean {
    const set = this.getCompletedSetFromKey(this.getMainCompletedKey());
    return set.has(route);
  }

  isCoApplicantStepCompleted(route: string): boolean {
    const set = this.getCompletedSetFromKey(this.getCoApplicantCompletedKey());
    return set.has(route);
  }

  switchToMainApplicantFlow() {
    this.stepperType = 'MAIN';
    this.completedSteps = this.getCompletedSetFromKey(this.getMainCompletedKey());
    this.buildSteps();
  }


  private getCompletedStepsKey(): string {
    return this.stepperType === 'CO_APPLICANT'
      ? this.getCoApplicantCompletedKey()
      : this.getMainCompletedKey();
  }

  //switching main and coapplicant
  private getMainCompletedKey(): string {
    return `main_completedSteps_${this.applicantId || 'defaultApplicant'}_${this.applicationId || 'defaultApplication'}`;
  }

  getCoApplicantCompletedKey1(): string {
    const coloanIds = this.getCo_appId();

    const applicantId = coloanIds?.[0] || 'defaultApplicant';
    const applicationId = coloanIds?.[1] || 'defaultApplication';

    return `coapp_completedSteps_${applicantId}_${applicationId}_${this.currentCoApplicantIndex}`;
  }
  getCoApplicantCompletedKey(): string {
    const mainApplicantId = this.getLoanId()?.[0] || 'defaultMainApplicant';
    const coApplicantId = this.getCo_appId()?.[0];
    const index = this.getCurrentCoApplicantIndex();

    return coApplicantId
      ? `coapp_completedSteps_${mainApplicantId}_${coApplicantId}`
      : `coapp_completedSteps_${mainApplicantId}_temp_${index}`;
  }
  markStepCompleted(route: string) {
    this.completedSteps.add(route);

    localStorage.setItem(
      this.getCompletedStepsKey(),
      JSON.stringify([...this.completedSteps])
    );

    this.rebuildSteps();
  }


  restoreCompletedSteps() {
    const saved = localStorage.getItem(this.getCompletedStepsKey());

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.completedSteps = Array.isArray(parsed)
          ? new Set<string>(parsed)
          : new Set<string>();
      } catch {
        this.completedSteps = new Set<string>();
      }
    } else {
      this.completedSteps = new Set<string>();
    }
  }
//restore from summary if localdate empty
  restoreCompletedStepsFromRoutes(
  routes: string[],
  options?: { replace?: boolean }
): void {
  const shouldReplace = options?.replace ?? true;

  if (shouldReplace) {
    this.completedSteps = new Set<string>();
  }

  routes
    .filter((route): route is string => !!route)
    .forEach(route => this.completedSteps.add(route));

  // Cache the backend-derived state.
  localStorage.setItem(
    this.getCompletedStepsKey(),
    JSON.stringify([...this.completedSteps])
  );

  this.buildSteps();
}
getCompletedRoutesFromStage(stage: string | null | undefined): string[] {
  if (!stage) {
    return [];
  }

  const lastCompletedRoute = this.getRouteFromStage(stage);
  const steps = this.getActiveNavigationSteps();

  const index = steps.findIndex(step => step.route === lastCompletedRoute);

  if (index < 0) {
    return [];
  }

  return steps.slice(0, index + 1).map(step => step.route);
}
hydrateMainProgressFromSummary(summary: any): void {
  const routes = new Set<string>();

  const applicants = Array.isArray(summary?.applicants)
    ? summary.applicants
    : [];

  const primaryApplicant = applicants.find(
    (applicant: any) =>
      this.formSvc.getApplicantType(applicant) === 'PRIMARY'
  );

  if (!primaryApplicant) {
    this.restoreCompletedStepsFromRoutes([]);
    return;
  }

  // Adjust these property names to match the real summary API.
  if (summary?.loanInfo || primaryApplicant?.loanInfo) {
    routes.add('loaninfo');
  }

  if (primaryApplicant?.generalInfo) {
    routes.add('genralinfo');
  }

  if (
    primaryApplicant?.estimatedExpense ||
    primaryApplicant?.expenseInfo ||
    summary?.estimatedExpense
  ) {
    routes.add('expense');
  }

  if (
    primaryApplicant?.additionalInfo ||
    primaryApplicant?.personalInfo
  ) {
    routes.add('additionalinfo');
  }

  if (
    primaryApplicant?.kycInfo ||
    primaryApplicant?.kyc
  ) {
    routes.add('kycinfo');
  }

  if (
    primaryApplicant?.educationDetails ||
    primaryApplicant?.educationInfo
  ) {
    routes.add('educationDetails');
  }

  if (
    primaryApplicant?.incomeInfo ||
    primaryApplicant?.incomeDetails
  ) {
    routes.add('incomeinfo');
  }

  if (
    primaryApplicant?.assetsInfo ||
    primaryApplicant?.assets
  ) {
    routes.add('assetsinfo');
  }

  if (
    primaryApplicant?.liabilitiesInfo ||
    primaryApplicant?.liabilities
  ) {
    routes.add('liabilitiesinfo');
  }

  if (
    primaryApplicant?.monthlyExpenditure ||
    primaryApplicant?.monthlyExpenseInfo
  ) {
    routes.add('monthlyexpinfo');
  }

  if (
    primaryApplicant?.referenceInfo ||
    primaryApplicant?.references
  ) {
    routes.add('referenceinfo');
  }

  if (
    summary?.coApplicants?.length ||
    applicants.some(
      (applicant: any) =>
        this.formSvc
          .getApplicantType(applicant)
          .startsWith('CO_APPLICANT')
    )
  ) {
    routes.add('co-applicantdetails');
  }

  if (
    summary?.status === 'COMPLETED' ||
    summary?.isCompleted === true
  ) {
    routes.add('summaryinfo');
  }

  this.restoreCompletedStepsFromRoutes([...routes]);
}
  // ========================================================
  get steps(): Step[] {
    return this.stepsSubject.getValue();
  }


  get coSteps(): Step[] {
    return this.coStepsSubject.getValue(); // co-applicant horizontal stepper
  }

  setStepperType(type: StepperType) {
    this.stepperType = type;

    this.restoreCompletedSteps();
    this.buildSteps();

  }

  private getActiveNavigationSteps(): Step[] {
    return this.stepperType === 'CO_APPLICANT'
      ? this.coSteps
      : this.steps;
  }

  //-----------education steps ----------------
  setEducationSubSteps(data: any[]) {


    this.educationSubSteps = data.map(d => {
      const name = d.qualificationName.toLowerCase();

      let key = '';

      if (name.includes('diploma') && name.includes('10')) {
        key = 'diploma10';
      } else if (name.includes('diploma') && name.includes('12')) {
        key = 'diploma12';
      } 
      else if (name.includes('others') && name.includes('12')) {
        key = 'others12';

      }
      else if (name.includes('others') && name.includes('diploma')) {
        key = 'othersdiploma';

      }
      else if (name.includes('postgraduate')) {
        key = 'pg';

      }
      else if (name.includes('undergraduate')) {
        key = 'ug';

      }
      
      else if (name.includes('10th')) {
        key = '10th';
      } else if (name.includes('12th')) {
        key = '12th';
      }

      return {
        id: d.qualificationId,
        label: d.qualificationName.split('(')[0].trim(), // UI label
        key: key || d.qualificationName
      };
    });

    this.educationSubSteps.push({ id: "0", label: "IELTS / PTE", key: "ielts" })
    this.educationSubSteps.push({ id: "1", label: "University Offer Letter", key: "offerletter" })

    this.educationSubStepsInitialized = true;
    this.buildSteps();
  }


  private getEducationProgressKey(): string {
    return `educationProgress_${this.applicantId}`;
  }

  markEducationSectionComplete(step: string) {
    this.completedEducationSections.add(step);


    if (this.applicantId) {
      localStorage.setItem(
        this.getEducationProgressKey(),
        JSON.stringify([...this.completedEducationSections])
      );
    }

  }
  private restoreEducationProgress1() {
    if (!this.applicantId) return;

    const saved = localStorage.getItem(this.getEducationProgressKey());

    if (saved) {
      this.completedEducationSections = new Set(JSON.parse(saved));
    } else {
      this.completedEducationSections = new Set();
    }
  }
private restoreEducationProgress(): void {
  if (!this.applicantId) {
   
    return;
  }

  const key = this.getEducationProgressKey();
  const saved = localStorage.getItem(key);


  if (!saved) {
    this.completedEducationSections =
      new Set<string>();

    return;
  }

  try {
    const parsed = JSON.parse(saved);

    this.completedEducationSections =
      Array.isArray(parsed)
        ? new Set<string>(parsed)
        : new Set<string>();
  } catch {
    this.completedEducationSections =
      new Set<string>();
  }
}

  getCompletedEducationSections(): Set<string> {
    return this.completedEducationSections;
  }


  setEducationStepData(step: string, data: any) {
    this.formData[step] = data;
  }

  getEducationStepData(step: string) {
    return this.formData[step] ?? null;
  }

  isEducationStepCompleted(step: string): boolean {
    return this.completedEducationSections.has(step);
  }


  private saveEducationProgress() {
    localStorage.setItem(
      this.getEducationProgressKey(),
      JSON.stringify([...this.completedEducationSections])
    );
  }




  //---------------all other steps --------------




  markCompletedStepsTillRoute(route: string) {
    const steps = this.stepsSubject.getValue();

    const index = steps.findIndex(s => s.route === route);

    if (index === -1) return;

    for (let i = 0; i <= index; i++) {
      this.completedSteps.add(steps[i].route);
    }

    const key =
      this.stepperType === 'CO_APPLICANT'
        ? this.getCoApplicantCompletedKey()
        : this.getMainCompletedKey();

    if (this.applicantId) {
      localStorage.setItem(
        key,
        JSON.stringify([...this.completedSteps])
      );
    }

    this.buildSteps();
  }

  restoreLoanEditContext() {
    const stored =
      sessionStorage.getItem('loanContextData') ||
      sessionStorage.getItem('loanEditData');

    if (!stored) return null;

    const parsed = JSON.parse(stored);

    this.applicantId = parsed.applicantId;
    this.applicationId = parsed.applicationId;
    this.custName = parsed.custName;
    this.custARN = parsed.custARN;

    this.restoreEducationProgress();
    this.restoreCompletedSteps();
    this.buildSteps();

    return parsed;
  }

  //for main applicant
  setLoanId(id1: string, id2: string, name: string, arn: string) {

    if (
this.applicantId &&
this.applicantId !== id1
) {
sessionStorage.removeItem(
'educationFlowQualificationId'
);
}

    this.applicantId = id1;
    this.applicationId = id2;
    this.custName = name;
    this.custARN = arn;

    sessionStorage.setItem(
      'loanContextData',
      JSON.stringify({
        applicantId: id1,
        applicationId: id2,
        custName: name,
        custARN: arn
      })
    );

    this.restoreEducationProgress();
    this.restoreCompletedSteps();
    this.buildSteps();
  }
  getLoanId() {
    return [this.applicantId, this.applicationId, this.custName, this.custARN];
  }

  //coapplicant data store
  setCo_appId(id1: string, id2: string, name: string, arn?: string, index?: number) {
    this.co_applicantId = id1;
    this.co_applicationId = id2;
    this.co_custName = name;
    this.co_custARN = arn || null;

    if (index) {
      this.currentCoApplicantIndex = Number(index);
    }


    sessionStorage.setItem(
      'coAppIds',
      JSON.stringify({
        applicantId: id1,
        applicationId: id2,
        fullName: name,
        custARN: arn,
        coApplicantIndex: index || this.getCurrentCoApplicantIndex()
      })
    );
    this.restoreCompletedSteps();
    this.buildSteps();
  }

  getCo_appId() {
    return [this.co_applicantId, this.co_applicationId, this.co_custName, this.co_custARN];
  }
  clearCoAppId() {
    this.co_applicantId = null;
    this.co_applicationId = null;
    this.co_custName = null;
    this.co_custARN = null;

    sessionStorage.removeItem('coAppIds');
  }
  restoreCoAppIdFromSession() {
    const storedCoApp = sessionStorage.getItem('coAppIds');

    if (!storedCoApp) return;

    const parsed = JSON.parse(storedCoApp);

    this.co_applicantId = parsed.applicantId;
    this.co_applicationId = parsed.applicationId;
    this.co_custName = parsed.fullName;
    this.co_custARN = parsed.custARN || null;

    if (parsed.coApplicantIndex) {
      this.currentCoApplicantIndex = Number(parsed.coApplicantIndex);
    }

  }

  restoreLoanIdFromSession() {
    const stored = sessionStorage.getItem('loanEditData');

    if (!stored) return;

    const parsed = JSON.parse(stored);

    this.applicantId = parsed.applicantId;
    this.applicationId = parsed.applicationId;
    this.custName = parsed.custName;
    this.custARN = parsed.custARN;

    this.restoreEducationProgress();
    this.restoreCompletedSteps();
    this.buildSteps();
  }
  setvalues(isAsset?: boolean, isIncome?: boolean, issalaried?: boolean, coursetypeug?: boolean) {
    this.formSvc.setValues(isAsset, isIncome, issalaried, coursetypeug);
    this.buildSteps();
  }

  setApplicantValues(
    type: 'main' | 'coapp',
    values: {
      isasset?: boolean;
      isincome?: boolean;
      issalaried?: boolean;
      coursetypeug?: boolean;
    }
  ) {
    if (type === 'main') {
      this.formSvc.applicantState = {
        ...this.formSvc.applicantState,
        ...values
      };

      // Optional backward compatibility
      this.formSvc.isasset = this.formSvc.applicantState.isasset;
      this.formSvc.isincome = this.formSvc.applicantState.isincome;
      this.formSvc.issalaried = this.formSvc.applicantState.issalaried;
      this.formSvc.coursetypeug = this.formSvc.applicantState.coursetypeug;

      localStorage.setItem(
        'applicantState',
        JSON.stringify(this.formSvc.applicantState)
      );

    } else {
      this.formSvc.coApplicantState = {
        ...this.formSvc.coApplicantState,
        ...values
      };

      // Optional backward compatibility
      this.formSvc.co_isasset = this.formSvc.coApplicantState.isasset;
      this.formSvc.co_isincome = this.formSvc.coApplicantState.isincome;
      this.formSvc.co_issalaried = this.formSvc.coApplicantState.issalaried;

      // localStorage.setItem(
      //       'coApplicantState',
      //       JSON.stringify(this.formSvc.coApplicantState)
      //     );
      localStorage.setItem(
        this.getCoApplicantStateKey(),
        JSON.stringify(this.formSvc.coApplicantState)
      );
    }

    this.buildSteps();
  }


  getvalues() {
    return { isAsset: this.formSvc.isasset, isIncome: this.formSvc.isincome, issalaried: this.formSvc.issalaried, coursetypeug: this.formSvc.coursetypeug };
  }


  next() {
    const cleanUrl = this.router.url.split('?')[0];

    const segments = cleanUrl.split('/').filter(Boolean);
    let lastSegment = segments.at(-1) || '';

    let currentStepRoute = lastSegment;


    if (lastSegment === 'educationinfo') {
      currentStepRoute = 'educationDetails';
    }

    const routeMap: Record<string, string> = {
      educationinfo: 'educationDetails',
      coapplicantinfo: 'co-applicantdetails'
    };

    // const currentStepRoute = routeMap[lastSegment] || lastSegment;

    const steps = this.getActiveNavigationSteps();


    const index1 = this.steps.findIndex(s => s.route === currentStepRoute);
    const index = steps.findIndex(s => s.route === currentStepRoute);
    if (index === -1) return;

    if (index < steps.length - 1) {
      const nextRoute = steps[index + 1].route;


      const basePath =
        this.stepperType === 'CO_APPLICANT'
          ? ['/loanform', 'co-applicantdetails', 'coapplicantinfo']
          : ['/loanform'];


      const currentParams = this.router.routerState.snapshot.root.queryParams;
      const cleanedParams = this.getCleanQueryParamsForRoute(nextRoute, currentParams);

      this.router.navigate([...basePath, nextRoute], {
        queryParams: cleanedParams,
        // queryParamsHandling: 'merge'
      });
    }
  }



  previous() {


    const cleanUrl = this.router.url.split('?')[0];

    const segments = cleanUrl.split('/').filter(Boolean);
    const lastSegment = segments.at(-1) || '';



    let currentStepRoute = lastSegment;

    // MAIN education child route
    if (lastSegment === 'educationinfo') {
      currentStepRoute = 'educationDetails';
    }


    const steps = this.getActiveNavigationSteps();


    // const steps = this.stepsSubject.getValue();   
    const index = steps.findIndex(s => s.route === currentStepRoute);
    if (index === -1) return;


    if (index > 0) {
      const prevRoute = steps[index - 1].route;


      const basePath =
        this.stepperType === 'CO_APPLICANT'
          ? ['/loanform', 'co-applicantdetails', 'coapplicantinfo']
          : ['/loanform'];


   
      const currentParams = this.router.routerState.snapshot.root.queryParams;
const cleanedParams = this.getCleanQueryParamsForRoute(prevRoute, currentParams);

this.router.navigate([...basePath, prevRoute], {
  queryParams: cleanedParams,
  // queryParamsHandling: 'merge'
});

    }

    else if (this.stepperType === 'CO_APPLICANT') {
      //    go back to mobile screen when at first step
      this.router.navigate(['/loanform', 'co-applicantdetails'], {
        queryParams: {
        

        }
      });
    }

  }
  resetEducationSubSteps() {
    this.educationSubSteps = [];
    this.educationSubStepsInitialized = false;
    this.buildSteps();
  }

  setStepData(step: string, data: any) {
    this.formData[step] = data;
  }

  getStepData(step: string) {
    return this.formData[step];
  }

 private buildFormKey(step: string): string {
  if (this.stepperType === 'CO_APPLICANT') {
    const coApplicantId =
      this.co_applicantId ||
      `temp-${this.getCurrentCoApplicantIndex()}`;

    return `CO_APPLICANT_${coApplicantId}_${step}`;
  }

  const mainApplicantId =
    this.applicantId || 'default-main-applicant';

  return `MAIN_${mainApplicantId}_${step}`;
}

setStepData1(step: string, data: any): void {
  const key = this.buildFormKey(step);

  const ownerApplicantId =  this.stepperType === 'CO_APPLICANT'
        ? this.co_applicantId
        : this.applicantId

  this.formData[key] = {
    ...data,
    ownerApplicantId: String(ownerApplicantId || '')
     
  };
}

getStepData1(step: string): any {
  const key = this.buildFormKey(step);
  const data = this.formData[key];

  if (!data) {
    return null;
  }

  const expectedApplicantId =
    this.stepperType === 'CO_APPLICANT'
      ? this.co_applicantId
      : this.applicantId;

  if (
    data.ownerApplicantId &&
    String(data.ownerApplicantId) !== String(expectedApplicantId)
  ) {
    console.warn('Ignoring step data belonging to another applicant', {
      expectedApplicantId,
      actualApplicantId: data.ownerApplicantId,
      key
    });

    return null;
  }

  return data;
}

  getAllData() {
    return this.formData;
  }

  clear() {
    this.formData = {};
  }

  removeStepCompleted(route: string) {
    this.completedSteps.delete(route);

    localStorage.setItem(
      this.getCompletedStepsKey(),
      JSON.stringify([...this.completedSteps])
    );
    this.rebuildSteps();
  }



  private getCompletedSetFromKey(key: string): Set<string> {
    const saved = localStorage.getItem(key);

    if (!saved) return new Set<string>();

    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed)
        ? new Set<string>(parsed)
        : new Set<string>();
    } catch {
      return new Set<string>();
    }
  }




  //coapplicant asset hides 
  restoreApplicantStatesFromStorage() {
    const mainState = localStorage.getItem('applicantState');
    // const coState = localStorage.getItem('coApplicantState');

    const coState = localStorage.getItem(this.getCoApplicantStateKey());
    if (mainState) {
      try {
        this.formSvc.applicantState = {
          ...this.formSvc.applicantState,
          ...JSON.parse(mainState)
        };

      } catch (e) {
        console.error('Invalid applicantState JSON', e);
      }

    }

    if (coState) {
      try {
        this.formSvc.coApplicantState = {
          ...this.formSvc.coApplicantState,
          ...JSON.parse(coState)
        };

      } catch (e) {
        console.error('Invalid applicantState JSON', e);
      }

    }
  }


  getCoApplicantStateKey(): string {
    const applicationId = this.getCo_appId()?.[1];
    const coApplicantId = this.getCo_appId()?.[0];
    const coApplicantIndex = this.getCurrentCoApplicantIndex();
    return coApplicantId
      ? `coApplicantState_${applicationId}_${coApplicantId}`
      : `coApplicantState_${applicationId}_temp_${coApplicantIndex}`;
  }


  //edit from summary for education substeps

  private persistSummaryEducationLockState() {
    sessionStorage.setItem(
      this.SUMMARY_EDUCATION_LOCK_KEY,
      JSON.stringify({
        summaryEducationEditMode: this.summaryEducationEditMode,
        summaryEducationSubstepsUnlocked: this.summaryEducationSubstepsUnlocked
      })
    );
  }

  restoreSummaryEducationLockState() {
    const saved = sessionStorage.getItem(this.SUMMARY_EDUCATION_LOCK_KEY);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);
      this.summaryEducationEditMode = !!parsed.summaryEducationEditMode;
      this.summaryEducationSubstepsUnlocked = !!parsed.summaryEducationSubstepsUnlocked;
    } catch {
      this.summaryEducationEditMode = false;
      this.summaryEducationSubstepsUnlocked = false;
    }
  }

  startSummaryEducationEditFlow() {
    // summary flow active + substeps locked
    this.summaryEducationEditMode = true;
    this.summaryEducationSubstepsUnlocked = false;
    this.persistSummaryEducationLockState();
  }

  unlockSummaryEducationSubsteps() {
    // summary flow active + substeps unlocked
    this.summaryEducationEditMode = true;
    this.summaryEducationSubstepsUnlocked = true;
    this.persistSummaryEducationLockState();
  }

  clearSummaryEducationEditFlow() {
    this.summaryEducationEditMode = false;
    this.summaryEducationSubstepsUnlocked = false;
    sessionStorage.removeItem(this.SUMMARY_EDUCATION_LOCK_KEY);
  }

  isSummaryEducationEditFlow(): boolean {
    return this.summaryEducationEditMode;
  }

  areSummaryEducationSubstepsUnlocked(): boolean {
    return this.summaryEducationSubstepsUnlocked;
  }

  isEducationSubStepperLocked(): boolean {
    return this.summaryEducationEditMode && !this.summaryEducationSubstepsUnlocked;
  }

  // clear queryparam of education
 
  getCleanQueryParamsForRoute(route: string, currentParams: any = {}) {
  const isEducationRoute =
    route === 'educationDetails' ||
    route === 'educationinfo';

  //    if (!isEducationRoute) {
  //   return {};
  // }

  const cleanParams: any = {};

  // Preserve selected co-applicant across all co-applicant steps
  if (this.stepperType === 'CO_APPLICANT') {
    cleanParams.coApplicantIndex =
      Number(currentParams['coApplicantIndex']) ||
      this.getCurrentCoApplicantIndex();

    cleanParams.mode =
      currentParams['mode'] ||
      'existing';
  }

  // ✅ Keep summary edit params only if user came from summary
  const isFromSummary =
    currentParams['fromSummary'] === true ||
    currentParams['fromSummary'] === 'true';

  if (isFromSummary) {
    cleanParams.fromSummary = true;

    if (currentParams['mode']) {
      cleanParams.mode = currentParams['mode'];
    }
  
  }

  // Keep education params only for education pages
  if (isEducationRoute) {
    if (currentParams['qualificationlabel']) {
      cleanParams.qualificationlabel = currentParams['qualificationlabel'];
    }

    if (currentParams['qualificationId']) {
      cleanParams.qualificationId = currentParams['qualificationId'];
    }

    if (currentParams['section']) {
      cleanParams.section = currentParams['section'];
    }
  }


  return cleanParams;
}
}
