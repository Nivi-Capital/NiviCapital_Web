import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Loanstepperservice } from '../../../../core/service/loanstepperservice';
import { Loanformservice } from '../../../../core/service/loanformservice';

@Component({
  selector: 'app-loanstepper',
  imports: [CommonModule, RouterModule],
  standalone: true,
  templateUrl: './loanstepper.html',
  styleUrl: './loanstepper.scss'
})
export class Loanstepper implements OnInit {
  steps: any;
  applicantId:any;
  applicationId:any;
  custName:any;
  custARN:any;
  // completedEducationSections: Set<string> = new Set();
  completedSteps: Set<number> = new Set();

  activeQualificationId!: any;
  educationdetails: any;
  activeEducation: any;
  private flowQualificationId: string | null = null;



  constructor(public router: Router, public stepservice: Loanstepperservice, private route: ActivatedRoute, private stepperService: Loanstepperservice, private formSvc: Loanformservice, private cdr: ChangeDetectorRef) {
    this.stepperService.steps$.subscribe(steps => {
      this.steps = steps;
      this.cdr.detectChanges(); // Force change detection
    });

    // const saved = sessionStorage.getItem('completedEducationSections');


  }


  ngOnInit() {
    this.steps = this.stepservice.steps;

    let Allids = this.stepperService.getLoanId();

    this.applicantId = Allids[0];
    this.applicationId = Allids[1];
    this.custName = Allids[2];
    this.custARN = Allids[3];

    this.route.queryParams.subscribe(params => {


      const label = params['qualificationlabel'];
      if (label) {
        this.activeEducation = label;
        this.activeQualificationId = label;
        this.cdr.detectChanges();
      }

      //  Only rebuild submenu if flow qualificationId changed
      const qid = params['qualificationId'];

      const savedFlowId = sessionStorage.getItem(
        'educationFlowQualificationId'
      );

      // First education load
      if (!this.flowQualificationId) {
        this.flowQualificationId =
          savedFlowId || qid || null;
      }

      if (qid && qid !== this.flowQualificationId ) {
        this.flowQualificationId = qid;

        sessionStorage.setItem(
          'educationFlowQualificationId',
          qid
        );
        this.formSvc.getselectedEducation(qid).subscribe(res => {
          this.educationdetails = res.data ?? res;

          //  build submenu ONCE for this flow
          this.stepperService.setEducationSubSteps(this.educationdetails);
        });
      }

    });
    this.router.events.subscribe(() => {
      // this.cdr.detectChanges(); 
      const cleanUrl = this.router.url.split('?')[0];
      if (!cleanUrl.includes('education')) {
        this.activeQualificationId = undefined;
        this.cdr.detectChanges();
      }

    });

    // this.stepperService.restoreCompletedSteps(); 
    this.stepperService.rebuildSteps();

  }


  get currentIndex(): number {
    const cleanUrl = this.router.url.split('?')[0];
    const lastSegment = cleanUrl.split('/').pop();

    let logicalRoute = lastSegment;


    if (cleanUrl.includes('co-applicantdetails')) {
      logicalRoute = 'co-applicantdetails';
    }

    // Treat education sub-pages as Education Details
    if (lastSegment === 'educationinfo') {
      logicalRoute = 'educationDetails';
    }

    const idx = this.steps.findIndex(
      (s: any) => s.route === logicalRoute
    );

    return idx >= 0 ? idx : 0;
  }


  isActive(index: number) {
    return index === this.currentIndex;
  }


  canNavigateTo(index: number): boolean {

    let routeArr: any = localStorage.getItem(`main_completedSteps_${this.applicantId || 'defaultApplicant'}_${this.applicationId || 'defaultApplication'}`);
    routeArr = JSON.parse(routeArr);
    if (routeArr.find((item: any) => item === "summaryinfo")) {
      const isFromSummary = this.formSvc.isSummaryEditFlow();
      if (!isFromSummary) {
        const summaryData = this.formSvc.getSummary(this.applicationId);
        this.formSvc.startSummaryEditFlow(summaryData, 'MAIN');
      }
    }

    const step = this.steps[index];
    if (!step) return false;

    if (this.stepservice.isMainStepCompleted(step.route)) {
      return true;
    }


    //  allow current step
    if (index === this.currentIndex) {
      return true;
    }

    //  allow next step ONLY if previous is completed
    const prevStep = this.steps[index - 1];
    // if (prevStep && this.stepservice.isStepCompleted(prevStep.route)) {
    //   return true;
    // }

    if (prevStep && this.stepservice.isMainStepCompleted(prevStep.route)) {
      return true;
    }


    return false;
  }


  goToStep(route: string, index: number) {
    if (!this.canNavigateTo(index)) {
      console.log(`Blocked navigation to index ${index}`);
      return;
    }

    this.stepperService.switchToMainApplicantFlow();

    const currentParams = this.route.snapshot.queryParams;
    const cleanedParams = this.stepperService.getCleanQueryParamsForRoute(route, currentParams);

    this.router.navigate(['/loanform', route], {
      queryParams: cleanedParams,
      // queryParamsHandling: 'merge'
    });
  }

  isNextStep(index: number): boolean {
    return index === this.currentIndex + 1;
  }

  isCompleted(index: number): boolean {
    const step = this.steps[index];
    return this.stepservice.isMainStepCompleted(step.route);
  }

  // In component.ts, temporarily add:
  isCompleted1(index: number): boolean {
    const step = this.steps[index];
    return this.stepservice.isStepCompleted(step.route);
  }

  isUpcoming(index: number): boolean {


    const step = this.steps[index];
    if (!step) return false;
    if (this.stepservice.isMainStepCompleted(step.route)) {
      return false;
    }

    return index > this.currentIndex;
  }



  isSubStepperDisabled(parentIndex: number, subIndex: number): boolean {

    const parentStep = this.steps[parentIndex];
    if (!parentStep?.children) return false;


    // lock all substeps until Edit button is clicked
    // if (this.stepservice.isSummaryEducationEditFlow()) {
    //   return !this.stepservice.areSummaryEducationSubstepsUnlocked();
    // }

    const params =
      this.route.snapshot.queryParams;

const isSummaryRoute =
  params['fromSummary'] === true ||
  params['fromSummary'] === 'true'
  ||  this.formSvc.isSummaryEditFlow();;

    if (
      isSummaryRoute &&
      this.stepservice.isSummaryEducationEditFlow()
    ) {
      return !this.stepservice
        .areSummaryEducationSubstepsUnlocked();
    }

    const children = parentStep.children;

    // find active index
    const activeIndex = children.findIndex(
      (c: any) => c.key === this.activeQualificationId
    );

    //  allow all completed
    const stepKey = children[subIndex].key;

    const isApplicationCompleted =
  this.stepservice.isMainStepCompleted('co-applicantdetails') ||
  this.stepservice.isMainStepCompleted('summaryinfo');

if (
  !isSummaryRoute &&
  isApplicationCompleted
) {
  return false;
}
    if (this.stepperService.isEducationStepCompleted(stepKey)) {
      return false;
    }

    if (activeIndex === -1) {
      return subIndex !== 0;
    }

    //  allow current active
    if (subIndex === activeIndex) {
      return false;
    }

    //  only allow previous ones
    // return subIndex > activeIndex;


    if (subIndex < activeIndex) {
      return false;
    }

    //  Future steps → disabled
    return true;

  }

  openEducationSubStep1(sub: any, event: Event, parentIndex: number, subIndex: number) {
    event.preventDefault();
    event.stopPropagation();

    if (
      this.isSubStepperDisabled(parentIndex, subIndex) ||
      this.stepservice.isEducationSubStepperLocked()
    ) {

      return;

    }

    const stepKey = sub.key;

    const qualificationId =
      this.flowQualificationId ||
      this.route.snapshot.queryParams['qualificationId'] || sub.id;
    if (!qualificationId) {
      console.error('Education flow qualification ID is missing'
      );
      return;
    }
    this.activeQualificationId = stepKey;

    // const flowQualificationId = this.route.snapshot.queryParams['qualificationId'] ||   this.flowQualificationId ||    sub.id;

    const currentParams = this.route.snapshot.queryParams;
    // Summary mode must be decided only by current URL.
    const isFromSummary =
      currentParams['fromSummary'] === true ||
      currentParams['fromSummary'] === 'true';

    const queryParams: any = {
      qualificationlabel: stepKey, qualificationId
      // qualificationId: flowQualificationId
    };

    if (isFromSummary) {
      queryParams.fromSummary = true;
      queryParams.mode = currentParams['mode'] || 'view';
      queryParams.section = 'education';
    } else {
      // Clear any stale service-level summary state.
      // this.stepservice.clearSummaryEducationEditFlow();
    }

    this.router.navigate(
      // ['/loanform/educationinfo'],
      ['/loanform', 'educationDetails', 'educationinfo'],
      {

        // relativeTo: this.route,
        queryParams

      })
      .then(() => {
        this.activeQualificationId = stepKey;
        this.cdr.detectChanges();
      });


  }

  openEducationSubStep(
    sub: any,
    event: Event,
    parentIndex: number,
    subIndex: number
  ): void {
    event.preventDefault();
    event.stopPropagation();

    const currentParams =
      this.route.snapshot.queryParams;

    const isFromSummary =
      currentParams['fromSummary'] === true ||
      currentParams['fromSummary'] === 'true';

    const isSummaryLocked =
      isFromSummary &&
      this.stepservice.isEducationSubStepperLocked();

    if (
      this.isSubStepperDisabled(
        parentIndex,
        subIndex
      ) ||
      isSummaryLocked
    ) {
      return;
    }

    const stepKey = sub.key;

    /*
     * Always use the highest qualification flow ID.
     * Never use sub.id as qualificationId.
     */
    const qualificationId =
      sessionStorage.getItem(
        'educationFlowQualificationId'
      ) ||
      this.flowQualificationId ||
      currentParams['qualificationId'];

    if (!qualificationId) {
      console.error(
        'Education flow qualification ID is missing'
      );
      return;
    }

    this.activeQualificationId = stepKey;

    const queryParams: any = {
      qualificationlabel: stepKey,
      qualificationId,
      educationStepId: sub.id,
      /*
       * Marks this navigation as a submenu click,
       * so ngOnInit does not rebuild the submenu.
       */
      educationStepClick: true
    };

    if (isFromSummary) {
      queryParams.fromSummary = true;
      queryParams.mode =
        currentParams['mode'] || 'view';
      queryParams.section = 'education';
    }
    this.activeQualificationId = sub.key;
    this.router.navigate(
      [
        '/loanform',
        'educationDetails',
        'educationinfo'
      ],
      {
        queryParams
      }
    ).then(() => {
      // this.activeQualificationId = stepKey;
      this.cdr.detectChanges();
    });
  }
  isInsideEducation(): boolean {
    return (
      this.router.url.includes('educationDetails') ||
      this.router.url.includes('educationinfo')
    );
  }

  normalizeQualification(name: string): string {
    const lower = name.toLowerCase();

    // School
    if (lower === '10th') return '10th';
    if (lower === '12th') return '12th';

    // Diploma
    // if (lower.includes('diploma') || lower.includes('diploma10') || (lower.includes('diploma') && lower.includes('10'))) return 'diploma10';
    // if (lower.includes('diploma') || lower.includes('diploma12') || (lower.includes('diploma') && lower.includes('12'))) return 'diploma12';
    //  if (lower.includes('diploma')) return 'diploma';

    //  Diploma AFTER 12th (check FIRST)
    if (lower.includes('diploma') && lower.includes('12')) {
      return 'diploma12';
    }

    //  Diploma AFTER 10th
    if (lower.includes('diploma') && lower.includes('10')) {
      return 'diploma10';
    }


    if (lower.includes('others') && lower.includes('after 12th')) return 'others12';
    if (lower.includes('others') && lower.includes('diploma')) return 'othersdiploma';

    // UG
    if (lower.includes('undergraduate')) return 'ug';
    // PG
    if (lower.includes('postgraduate')) return 'pg';

    // IELTS / PTE
    if (lower.includes('ielts') || lower.includes('pte')) return 'ielts';

    // Offer letter / Others
    if (lower.includes('offer')) return 'offerletter';
    if (lower.includes('others')) return 'others';

    // console.warn('Unknown qualification:', name);
    return 'others';
  }

  get completedEducationSections() {
    return this.stepservice.getCompletedEducationSections();
  }
  //active coapplocant only
  isCoApplicantActive(): boolean {
    return this.router.url.includes('/co-applicantdetails');
  }

}