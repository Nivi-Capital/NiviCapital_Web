import { Injectable, signal } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { BehaviorSubject, firstValueFrom, map, Observable, of, shareReplay, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Loanstepperservice } from './loanstepperservice';


type SummaryFlowContext = {
  edit: boolean;
  fromSummary: boolean;
  applicantType: 'MAIN' | 'CO_APPLICANT';
  action: 'VIEW' | 'EDIT' | 'ADD_COAPPLICANT';
};

export interface ApiResponse<T> {
  status: string;
  code: number;
  message: string;
  errors: any;
  data: T;
}
interface OptionItem {
  label: string;
  value: string;
  code?: string;
}

@Injectable({
  providedIn: 'root'
})
export class Loanformservice {

  form!: FormGroup;
  private baseUrl = environment.apiBaseUrl;
  // private baseUrl = "/nivicapsit/api";

  kycdetailsID: any;

  isasset: boolean = false;
  isincome: boolean = false;
  issalaried: boolean = false;
  coursetypeug: boolean = false;

  co_isasset: boolean = false;
  co_isincome: boolean = false;
  co_issalaried: boolean = false;
  co_coursetypeug: boolean = false;

  applicantState = {
    isasset: false,
    isincome: false,
    issalaried: false,
    coursetypeug: false
  };

  coApplicantState = {
    isasset: false,
    isincome: false,
    issalaried: false
  };


  loanInfoData: any;
  generalInfoData: any;
  estExpenseInfoData: any;
  additionalInfoData: any;
  kycInfoData: any;
  incomeInfoData: any;
  aseetsInfoData: any;
  liabilitiesInfoData: any;
  monthlyExpenditureData: any;
  referenceInfoData: any;
  educationdetailsData: any;
  educationInfoData: any;


  co_basicInfoData: any;
  co_generalInfoData: any;
  co_estExpenseInfoData: any;
  co_additionalInfoData: any;
  co_kycInfoData: any;
  co_incomeInfoData: any;
  co_aseetsInfoData: any;
  co_liabilitiesInfoData: any;
  co_monthlyExpenditureData: any;
  co_referenceInfoData: any;
  co_educationInfoData: any;

  coapppmobile: any;
  coappStep: number = 1

  private instituteCache1: OptionItem[] | null = null;
    public instituteCache: OptionItem[] = [];
  private instituteRequest$!: Observable<OptionItem[]>;

  mobileNumber = signal<string | null>(null);

  summaryData: any = null;
  summaryLoaded = false;

  //edit from summary
  private readonly SUMMARY_EDIT_CONTEXT_KEY = 'summaryEditContextData';
  private readonly SUMMARY_STORAGE_KEY = 'summaryData';

  private summaryRequest$?: Observable<ApiResponse<any>>;


  constructor(private http: HttpClient) { this.restoreFromStorage(); }


  restoreFromStorage() {
    this.isasset = JSON.parse(localStorage.getItem('isasset') || 'false');
    this.isincome = JSON.parse(localStorage.getItem('isincome') || 'false');
    this.issalaried = JSON.parse(localStorage.getItem('issalaried') || 'false');
  }

  setValues(isAsset?: boolean, isIncome?: boolean, issalaried?: boolean, coursetypeug?: boolean) {
    if (isAsset !== undefined) {
      this.isasset = isAsset;
      localStorage.setItem('isasset', JSON.stringify(isAsset));
    }

    if (isIncome !== undefined) {
      this.isincome = isIncome;
      localStorage.setItem('isincome', JSON.stringify(isIncome));
    }

    if (issalaried !== undefined) {
      this.issalaried = issalaried;
      localStorage.setItem('issalaried', JSON.stringify(issalaried));
    }

    if (coursetypeug !== undefined) {
      this.coursetypeug = coursetypeug;
      localStorage.setItem('coursetypeug', JSON.stringify(coursetypeug));
    }
  }




  setMobileNumber(number: string) {
    this.mobileNumber.set(number);
  }

  clearmobile() {
    this.mobileNumber.set(null);
  }


  // *************************loan info api*********************************

  submitLoanInfo(payload: any, id: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}/v1/los/applications/${id}/loan-detail`,
      payload
    );
  }


  //*************************  genral info apis  *************************
  getOccupations(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/v1/masters/occupations`,

    );
  }



  getlendingpartners(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/v1/masters/lending-partners`,

    );
  }

  getCoursetype(id: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/v1/masters/course-types/${id}`,

    );
  }

  getCourseName(id: string, type: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/v1/masters/courses/${id}/${type}`,

    );
  }


  //------------coapplicant relationship with applicant
  getRelationShip(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/v1/los/applications/relations`,

    );
  }

  // ************************* Australian states and cities api *************************

  getAustralianstates(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/v1/masters/states`,

    );
  }


  getAustralianstatescities(id: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/v1/masters/universities/${id}`,

    );
  }

  // ************************* save general info api  *************************
  submitGenralInfo(payload: any, id: string,edit?: boolean): Observable<ApiResponse<any>> {
    if(edit){
      return this.http.put<ApiResponse<any>>(
        `${this.baseUrl}/v1/los/applications/${id}/general-info`,
        payload
      );
    }
    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}/v1/los/applications/${id}/general-info`,
      payload
    );
  }

  //coapplicant genrela info 
  submit_Coapp_GenralInfo(payload: any, id: string,edit?:boolean): Observable<ApiResponse<any>> {
    // return this.http.post<ApiResponse<any>>(
    //   `${this.baseUrl}/v1/los/applications/coApp-general-info`,
    //   payload
    // );

     const url = `${this.baseUrl}/v1/los/applications/coApp-general-info`;

  return edit
    ? this.http.put<ApiResponse<any>>(url, payload)
    : this.http.post<ApiResponse<any>>(url, payload);
  }

  // ************************* additional info api  *************************

  //upload user profile photo
  uploadPhoto(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}/v1/files/upload/profile-picture`,
      payload
    );
  }


submitAdditionalInfo(
  payload: any,
  id: string,
  edit: boolean = false
): Observable<ApiResponse<any>> {
  const url = `${this.baseUrl}/v1/los/applications/${id}/personal-info`;

  return edit
    ? this.http.put<ApiResponse<any>>(url, payload)
    : this.http.post<ApiResponse<any>>(url, payload);
}
  // ************************* save kyc info api *************************

  setKycId(id: string) {
    this.kycdetailsID = id;

  }


  getKycId() {
    return this.kycdetailsID;
  }
//update passport document
  uploadpassport(data: any, id: string): Observable<ApiResponse<any>> {
    console.log("service--", data);

    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}/v1/kyc/${id}/documents`,
      data
    );
  }
  getKycDetails(id: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/v1/los/applications/${id}/kyc`,

    );
  }
submitKycMetadata(payload: any) {
  return this.http.post(
    `${this.baseUrl}/v1/kyc/metadata`,
    payload
  );
}
//upload single kyc documents 
uploadKycDocument(
  custId: string,
  file: File,
  docType: string,
 
): Observable<ApiResponse<any>> {
  const formData = new FormData();

  formData.append('file', file);
  formData.append('docType', docType);

 

  return this.http.post<ApiResponse<any>>(
    `${this.baseUrl}/v1/kyc/${custId}/document`,
    formData
  );
}
//update passport number
updatepassportNumber(data: any): Observable<ApiResponse<any>> {
    console.log("service--", data);

    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}/v1/kyc/metadata/passport`,
      data
    );
  }

  // ************************* estimate expense  *************************
  getlivingexp(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/v1/los/expense-masters/living`,

    );
  }

  getmiscellaneousexp(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/v1/los/expense-masters/miscellaneous`,

    );
  }

  estimateExpense(payload: any, id: string, edit: any): Observable<ApiResponse<any>> {
    console.log("service--", payload);

    // return this.http.post<ApiResponse<any>>(
    //   `${this.baseUrl}/v1/los/applications/${id}/estimated-expenses`,
    //   data
    // );
    const url = `${this.baseUrl}/v1/los/applications/${id}/estimated-expenses`;

  return edit
    ? this.http.put<ApiResponse<any>>(url, payload)
    : this.http.post<ApiResponse<any>>(url, payload);

  }

  deleteEstimatedExpense(payload: any): Observable<ApiResponse<any>> {
    const httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      body: payload
    };

    return this.http.delete<ApiResponse<any>>(
      `${this.baseUrl}/v1/los/applications/delete-estimated-expense`, httpOptions
    );
  }

  // ************************* saveEducation Metadata (institute name ,percentage,location etc)  *************************

  saveEducationMetadata(payload: any, id: string,edit?:boolean): Observable<ApiResponse<any>> {

    const url = `${this.baseUrl}/v1/los/applications/${id}/documents/metadata`;

    return this.http.post<ApiResponse<any>>(url, payload);

  }

  // ************************* Income   *************************

  uploadIncome(payload: any, id: string,edit?:boolean): Observable<ApiResponse<any>> {

    const url = `${this.baseUrl}/v1/los/applications/${id}/documents/upload`;

    return this.http.post<ApiResponse<any>>(url, payload);

  }

  deleteIncome(payload: any): Observable<ApiResponse<any>> {
    const httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      body: payload
    };

    return this.http.delete<ApiResponse<any>>(
      `${this.baseUrl}/v1/los/applications/documents/delete-income-document`, httpOptions
    );
  }  

  // ************************* assets   *************************

  getAllAssets(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/v1/los/asset-masters`,

    );
  }
  selectedAssets(data: any): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/v1/los/asset-masters/group/${data}`,

    );
  }

  getAssets(payload: any, id: string, edit: boolean): Observable<ApiResponse<any>> {

    // return this.http.post<ApiResponse<any>>(
    //   `${this.baseUrl}/v1/los/applications/${id}/assets`,
    //   payload
    // );

     const url = `${this.baseUrl}/v1/los/applications/${id}/assets`;

  return edit
    ? this.http.put<ApiResponse<any>>(url, payload)
    : this.http.post<ApiResponse<any>>(url, payload);
  }
  getallBanks(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/v1/los/applications/bank-list`,
    )
  };

  noAssetsSelected(payload: any, id1: any, id2: any) : Observable<ApiResponse<any>>{
    return this.http.put<ApiResponse<any>>(
      `${this.baseUrl}/v1/los/applications/${id1}/applicants/${id2}/has-assets`, payload
    );
  }

  deleteAssets(payload: any): Observable<ApiResponse<any>> {
    const httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      body: payload
    };

    return this.http.delete<ApiResponse<any>>(
      `${this.baseUrl}/v1/los/applications/delete-asset`, httpOptions
    );
  }

  // ************************* Liability   *************************

  getAllLiabilities(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/v1/los/applications/liability-types`,

    );
  }
  getloan_type(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/v1/los/applications/loan-types`,

    );
  }
  getalllenders(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/v1/los/applications/lender-names`,
    )
  };

  submitliability(payload: any, id: string, edit: boolean): Observable<ApiResponse<any>> {

    // return this.http.post<ApiResponse<any>>(
    //   `${this.baseUrl}/v1/los/applications/${id}/liabilities`,
    //   payload
    // );
     const url = `${this.baseUrl}/v1/los/applications/${id}/liabilities`;

  return edit
    ? this.http.put<ApiResponse<any>>(url, payload)
    : this.http.post<ApiResponse<any>>(url, payload);
  }

  deleteLiability(payload: any): Observable<ApiResponse<any>> {
    const httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      body: payload
    };

    return this.http.delete<ApiResponse<any>>(
      `${this.baseUrl}/v1/los/applications/delete-liability`, httpOptions
    );
  }

  noLiabilitiesSelected(payload: any, id1: any, id2: any) : Observable<ApiResponse<any>>{
    return this.http.patch<ApiResponse<any>>(
      `${this.baseUrl}/v1/los/applications/${id1}/applicants/${id2}/has-liabilities`, payload
    );
  }

  // ************************* Monthly Expenditure   *************************
  MonthlyExpenditure(data: any, id: string): Observable<ApiResponse<any>> {

    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}/v1/los/applications/${id}/monthly-expenses`,
      data
    );
  }

  deleteMonthlyExpenditure(payload: any): Observable<ApiResponse<any>> {
    const httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      body: payload
    };

    return this.http.delete<ApiResponse<any>>(
      `${this.baseUrl}/v1/los/applications/delete-monthly-expense`, httpOptions
    );
  }

  // *************************Education *************************


  getInstitutesCached(): Observable<OptionItem[]> {

    //  1. Return cached data if already loaded
    // if (this.instituteCache) {
    //   return of(this.instituteCache);
    // }

    // //  2. If API call already in progress, reuse it
    // if (this.instituteRequest$) {
    //   return this.instituteRequest$;
    // }

    //  3. Make API call ONCE
    this.instituteRequest$ = this.http.get<any>(`${this.baseUrl}/v1/masters/institute-names`)
      .pipe(
        map(res =>
          (res.data ?? res).map((s: any) => ({
            value: s.id,
            //  value: s.instituteName,
            label: s.instituteName
          }))
        ),
        tap(data => {
          this.instituteCache = data;
        }),
        shareReplay(1)
      );

    return this.instituteRequest$;

   
  }

  getInstitutesBySearch(searchText: string){
    this.instituteRequest$ = this.http.get<any>(`${this.baseUrl}/v1/masters/institute-names/search?keyword=${searchText}`)
      .pipe(
        map(res =>
          (res.data ?? res).map((s: any) => ({
            value: s.id,
            //  value: s.instituteName,
            label: s.instituteName
          }))
        ),
        tap(data => {
          this.instituteCache = [...this.instituteCache, ...data];
        }),
        shareReplay(1)
      );
 
    return this.instituteRequest$;
  }
  getEducation(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/v1/masters/qualifications`,

    );
  }

  getInstitutes(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/v1/masters/institute-names`,

    );
  }
  getAllCities(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/v1/cities`,

    );
  }


  getselectedEducation(data: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/v1/masters/qualifications/${data}`,

    );
  }


  selectedqualification(data: any, id: string,edit?:boolean): Observable<ApiResponse<any>> {

    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}/v1/los/applications/${id}/save-last-qualification-details`,
      data
    );
  }

  deleteEducationDoc(payload: any): Observable<ApiResponse<any>> {
    const httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      body: payload
    };

    return this.http.delete<ApiResponse<any>>(
      `${this.baseUrl}/v1/los/applications/documents/delete-income-document`, httpOptions
    );
  } 
  // *************************Reference *************************

  saveReference(payload: any, id: string, edit: boolean): Observable<ApiResponse<any>> {

    // return this.http.post<ApiResponse<any>>(
    //   `${this.baseUrl}/v1/los/applications/${id}/references`,
    //   payload
    // );
     const url = `${this.baseUrl}/v1/los/applications/${id}/references`;

  return edit
    ? this.http.put<ApiResponse<any>>(url, payload)
    : this.http.post<ApiResponse<any>>(url, payload);
  }
  // *************************Summary *************************

  getSummary(id: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/v1/los/applications/${id}/summary`,

    );
  }
  // submit main summary form
  submitMainApplicationSummary(applicantId: string, data: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}/v1/los/applications/${applicantId}/submit`, data
    )
  }

  // *************************coapplicant *************************

  //coapplicant summary - single summary coapplicant
  getCoappSummary(id1: string, id2: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/v1/los/applications/${id1}/summary/${id2}`,

    );
  }

  //delete single coapplicant 
  deleteCoapp(id1: string, id2: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(
      `${this.baseUrl}/v1/los/applications/${id1}/co-applicants/${id2}`,

    );
  }
  //coapplicant summary
  submitCoappSummary(data: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}/v1/los/applications/applicant/submit`,
      data
    );
  }

  //get coapplicant against main applicant
  getAllCoapp(id1: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/v1/los/applications/${id1}/co-applicants`,

    );
  }

  // retrive coappliacnt
   retriveCoapp(id1: string,id2: string): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(
      `${this.baseUrl}/v1/los/applications/${id1}/co-applicants/${id2}/retrieve`,{}
        
    );
  }
  // show deleted coappliacnt
   getdeletedCoapp(id1: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/v1/los/applications/${id1}/co-applicants/retry`,{}
        
    );
  }
  // *************************pdf *************************


  // open summary pdf file
  openPdfFileApplicationSummary(applicationId: string): Observable<Blob> {
    return this.http.get(
      `${this.baseUrl}/v1/los/applications/${applicationId}/summary/pdf`, {
      responseType: 'blob'
    }
    )
  }



  // ************************* Save and Exit data *************************

  saveandExit(data: any): Observable<ApiResponse<any>> {

    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}/v1/los/draft/save`,
      data
    );
  }

  // *************************get saved data *************************


  getSavedData(id1: string, id2: string, sectionkey: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/v1/los/draft/get?applicationId=${id1}&applicantId=${id2}&sectionKey=${sectionkey}`,

    );
  }

//education and income get data 
    getSavedDataEducation_income(id1: string, id2: string, sectionkey: string,category:string,subcategory:string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/v1/los/draft/get?applicationId=${id1}&applicantId=${id2}&sectionKey=${sectionkey}&category=${category}&subcategory=${subcategory}`,

    );
  }
    // *************************get saved KYC data *************************

     saveandExitKYCData(data: any): Observable<ApiResponse<any>> {

    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}/v1/los/draft/saveKYC`,
      data
    );
  }

  getSavedkYCData(custId: string, sectionkey: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/v1/los/draft/getKYC?custId=${custId}&sectionKey=${sectionkey}`,

    );
  }

  // ************************* Save and Exit basic info from coapplicant data *************************

  saveandExitBasicinfo(data: any): Observable<ApiResponse<any>> {

    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}/v1/los/draft/cif-generation`,
      data
    );
  }

  // *************************get saved basic info from coapplicant data *************************


  getSavedBasicInfo(id1: string, id2: string, sectionkey: string, phoneNumber: any): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/v1/los/draft/basic-info-draft?applicationId=${id1}&applicantId=${id2}&phoneNumber=${phoneNumber}&sectionKey=${sectionkey}`,

    );
  }

  // *************************get saved data for income and education*************************
  getUploadedData(id1: string, id2: string, sectionkey: string, category: string, subcategory: string, documentType: string): Observable<ApiResponse<any>> {
    // console.log(id1, id2, sectionkey, category, subcategory, documentType)
    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/v1/los/draft/get?applicationId=${id1}&applicantId=${id2}&sectionKey=${sectionkey}&category=${category}&subcategory=${subcategory}&documentType=${documentType}`,

    );
  }

  // *************************edit flow from summary*************************

  startSummaryEditFlow(
    data: any,
    applicantType: 'MAIN' | 'CO_APPLICANT' = 'MAIN'
  ) {
    const context1 = {
      edit: true,
      fromSummary: true,
      applicantType
    };
const existing =JSON.parse(sessionStorage.getItem(this.SUMMARY_EDIT_CONTEXT_KEY) || '{}'   );
 const context = { ...existing,  edit: true, fromSummary: true,   applicantType  };
    sessionStorage.setItem(this.SUMMARY_EDIT_CONTEXT_KEY, JSON.stringify(context));
    this.setSummary(data);
  }

isSummaryEditFlow(): boolean {
      const ctx = sessionStorage.getItem(this.SUMMARY_EDIT_CONTEXT_KEY);

    if (!ctx) return false;

    try {
      return JSON.parse(ctx)?.edit === true;
    } catch {
      return false;
    }
  }

  isFromSummaryFlow(): boolean {
    const ctx = sessionStorage.getItem(this.SUMMARY_EDIT_CONTEXT_KEY);

    if (!ctx) return false;

    try {
      return JSON.parse(ctx)?.fromSummary === true;
    } catch {
      return false;
    }
  }

  getSummaryEditApplicantType(): 'MAIN' | 'CO_APPLICANT' {
    const ctx = sessionStorage.getItem(this.SUMMARY_EDIT_CONTEXT_KEY);

    if (!ctx) return 'MAIN';

    try {
      return JSON.parse(ctx)?.applicantType || 'MAIN';
    } catch {
      return 'MAIN';
    }
  }

  setSummary(data: any) {
    this.summaryData = data;
    this.summaryLoaded = true;

    sessionStorage.setItem(this.SUMMARY_STORAGE_KEY, JSON.stringify(data));
  }

  getSummaryData() {
    if (this.summaryData) {
      return this.summaryData;
    }

    const stored = sessionStorage.getItem(this.SUMMARY_STORAGE_KEY);

    if (!stored) return null;

    try {
      this.summaryData = JSON.parse(stored);
      this.summaryLoaded = true;
      return this.summaryData;
    } catch {
      return null;
    }
  }

  getSummarySection(section: string) {
    const data = this.getSummaryData();
    return data?.[section] || null;
  }

  clearSummaryEditFlow() {
    sessionStorage.removeItem(this.SUMMARY_EDIT_CONTEXT_KEY);
  }

  clearSummary() {
    this.summaryData = null;
    this.summaryLoaded = false;
    sessionStorage.removeItem(this.SUMMARY_STORAGE_KEY);
  }
  getCoApplicantMode() {
  let sessionCoApp: any = {};

  try {
    sessionCoApp = JSON.parse(sessionStorage.getItem('coAppIds') || '{}');
  } catch {
    sessionCoApp = {};
  }

  const status = (
    sessionCoApp?.status ||
    sessionCoApp?.uiStatus ||
    ''
  ).toUpperCase();

  const isCompleted =
    status === 'COMPLETED' ||
    status === 'SUBMITTED';

  const isDraft =
    status === 'DRAFT' ||
    status === 'IN_PROGRESS' ||
    !status;

  return {
    status,
    isCompleted,
    isDraft,
    raw: sessionCoApp
  };
}

// ***********************education edit*******************

private summaryEducationEditFlow = false;
private educationSubstepsUnlocked = false;

startSummaryEducationEditFlow() {
  this.summaryEducationEditFlow = true;
  this.educationSubstepsUnlocked = false;
}

unlockEducationSubstepsForSummaryEdit() {
  this.summaryEducationEditFlow = true;
  this.educationSubstepsUnlocked = true;
}

clearSummaryEducationEditFlow() {
  this.summaryEducationEditFlow = false;
  this.educationSubstepsUnlocked = false;
}

isSummaryEditFlow1(): boolean {
  return this.summaryEducationEditFlow;
}

areEducationSubstepsUnlocked(): boolean {
  return this.educationSubstepsUnlocked;
}

getCoApplicantPageMode(routeParams: any) {
  let storedCoAppData: any = {};

  try {
    storedCoAppData = JSON.parse(sessionStorage.getItem('coAppIds') || '{}');
  } catch {
    storedCoAppData = {};
  }

  const status = (
    storedCoAppData?.status ||
    ''
  ).toUpperCase();

  const isCompleted =
    status === 'COMPLETED' ||
    status === 'SUBMITTED';

  const isNew =
    storedCoAppData?.mode === 'new';

  const isDraft =
    !isNew &&
    !isCompleted;

  const cameFromSummary =
    routeParams['fromSummary'] === true ||
    routeParams['fromSummary'] === 'true' ||
    storedCoAppData?.mode === 'view' ||
    this.isSummaryEditFlow();

  const isSummaryEditMode =
    !isNew &&
    isCompleted &&
    cameFromSummary;

  const viewOnly =
    isSummaryEditMode &&
    routeParams['mode'] !== 'edit';

  return {
    isCompleted,
    isDraft,
    isNew,
    isSummaryEditMode,
    viewOnly
  };
}

  // *************************Edit flow from table*********************************


  isEditFlow(): boolean {
    const ctx = sessionStorage.getItem('loanContextData');
    if (!ctx) return false;

    try {
      return JSON.parse(ctx)?.edit === true;
    } catch {
      return false;
    }
  }

  loadSummaryIfEdit(applicationId: string, applicantId: string) {
    if (!this.isEditFlow()) return null;

    if (this.summaryLoaded && this.summaryData) {
      return null;
    }

    return this.getCoappSummary(applicationId, applicantId);
  }
  ///--------------------------------------
  getApplicantType(applicant: any): string {
    return String(
      applicant?.applicantType ||
      applicant?.applicantype ||
      applicant?.applicant_type ||
      ''
    )
      .toUpperCase()
      .trim();
  }

  getCoApplicantIndexFromType(applicant: any): number {
    const type = this.getApplicantType(applicant);
    const match = type.match(/^CO_APPLICANT(\d+)$/);

    return match ? Number(match[1]) + 1 : 1;
  }

  getApplicantFromSummary(
    applicants: any[],
    options: {
      isCoApplicant: boolean;
      coApplicantId?: string | null;
      coApplicantIndex?: number | string | null;
    }
  ): any {
    if (!Array.isArray(applicants)) return null;

    if (!options.isCoApplicant) {
      return applicants.find((x: any) =>
        this.getApplicantType(x) === 'PRIMARY'
      ) || null;
    }

    const currentCoIndex = Number(options.coApplicantIndex || 1);

    return (
      applicants.find((x: any) =>
        x?.applicantId &&
        options.coApplicantId &&
        x.applicantId === options.coApplicantId
      ) ||
      applicants.find((x: any) =>
        this.getApplicantType(x).startsWith('CO_APPLICANT') &&
        this.getCoApplicantIndexFromType(x) === currentCoIndex
      ) ||
      null
    );
  }

  getApplicantSectionFromSummary(
    summaryResponse: any,
    sectionKey: string,
    options: {
      isCoApplicant: boolean;
      coApplicantId?: string | null;
      coApplicantIndex?: number | string | null;
    }
  ): any {
    const applicants = Array.isArray(summaryResponse?.data?.applicants)
      ? summaryResponse.data.applicants
      : [];

    const applicant = this.getApplicantFromSummary(applicants, options);

    return applicant?.[sectionKey] || null;
  }
  getApplicantFromSummaryResponse(
    summaryResponse: any,
    options: {
      isCoApplicant: boolean;
      coApplicantId?: string | null;
      coApplicantIndex?: number | string | null;
    }
  ): any {
    const applicants = Array.isArray(summaryResponse?.data?.applicants)
      ? summaryResponse.data.applicants
      : [];

    return this.getApplicantFromSummary(applicants, options);
  }


  async getSummarySectionForApplicant(
    applicationId: string,
    sectionKey: string,
    options: {
      isCoApplicant?: boolean;
      coApplicantId?: string | null;
      coApplicantIndex?: number | null;
    } = {}
  ): Promise<any> {
    if (!applicationId) return null;

    try {
      const res: any = await firstValueFrom(this.getSummary(applicationId));

      if (!res || res.status !== 'success') {
        return null;
      }

      return this.getApplicantSectionFromSummary(
        res,
        sectionKey,
        {
          isCoApplicant: !!options.isCoApplicant,
          coApplicantId: options.coApplicantId || null,
          coApplicantIndex: options.coApplicantIndex ?? null
        }
      );
    } catch (error) {
      console.error(`Failed to get summary section: ${sectionKey}`, error);
      return null;
    }
  }

}
