import { HttpClient } from '@angular/common/http';
import { computed, Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ApiResponse<T> {
  status: string;
  code: number;
  message: string;
  errors: any;
  data: T;
}

export interface LoginPayload {
  username: string;
  password: string;
}
export interface PageResponse<T> {
  content: T[];
  pageable: any;
  totalElements:number; 
  totalPages:number;  
}

export interface UserData {
 id: string;
  custId:string;
  ncId:string
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
  status: string;
  kycStatus: string;
  createdAt: number[];
}

interface CustomerFlowState {  phone: string;
   userId: string;  currentStep: number; custId?: string;  fname?: string;  lname?: string; }
  

@Injectable({
  providedIn: 'root'
})
export class Main {
  private baseUrl = environment.apiBaseUrl;
  // private baseUrl = "/nivicapsit/api";
  private kycSubject = new BehaviorSubject<any>(this.getFromSession());
  kyc$ = this.kycSubject.asObservable();

  private losSubject = new BehaviorSubject<any>(this.getFromSession());
  los$ = this.losSubject.asObservable();


  selectedUserId: string | null = null;
  docofselectedUser: any = null;

  private _lastLogin = signal<string | null>(null);
  lastLogin = computed(() => this._lastLogin());
  
     private _fullName = signal<string | null>(localStorage.getItem('fullname'));
  CustomerFullname = computed(() => this._fullName());


    private readonly storageKey = 'customerFlowState';
  constructor(private http: HttpClient) { }

  getLogin(payload: LoginPayload): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/admin/auth/login`,
      payload
    );
  }
   setLastLogin(value: string) {
    this._lastLogin.set(value);
    localStorage.setItem('lastLogin', value); 
  }
  setFullName(value: string) {
    this._fullName.set(value);
    localStorage.setItem('fullname', value); 
  }

  loadLastLoginFromStorage() {
    const stored = localStorage.getItem('lastLogin');
    if (stored) {
      this._lastLogin.set(stored);
    }
  }
 

  setState(state: CustomerFlowState): void {
    sessionStorage.setItem(
      this.storageKey,
      JSON.stringify(state)
    );
  }

  getState(): CustomerFlowState | null {
    const storedState = sessionStorage.getItem(this.storageKey);

    if (!storedState) {
      return null;
    }

    try {
      return JSON.parse(storedState) as CustomerFlowState;
    } catch {
      this.clearState();
      return null;
    }
  }

  updateStep(currentStep: number): void {
    const state = this.getState();

    if (!state) {
      return;
    }

    this.setState({
      ...state,
      currentStep
    });
  }

  clearState(): void {
    sessionStorage.removeItem(this.storageKey);
  }

  getAllUsers(page:number,size:number): Observable<ApiResponse<PageResponse<UserData>>> {
  return this.http.get<ApiResponse<PageResponse<UserData>>>(
    `${this.baseUrl}/v1/customers/my-customers?page=${page}&size=${size}`,
  );
}
 checkAllUsers(): Observable<ApiResponse<PageResponse<UserData>>> {
  return this.http.get<ApiResponse<PageResponse<UserData>>>(
    `${this.baseUrl}/v1/customers/my-customers`,
  );
}

// 0-6 users
  getAllLoanUsers(page:number,size:number): Observable<ApiResponse<PageResponse<UserData>>> {
  return this.http.get<ApiResponse<PageResponse<UserData>>>(
    `${this.baseUrl}/v1/los/applications/loan-customers?page=${page}&size=${size}`,
  );
}
//all users of loan
 AllLoan_Users(): Observable<ApiResponse<PageResponse<UserData>>> {
  return this.http.get<ApiResponse<PageResponse<UserData>>>(
    `${this.baseUrl}/v1/los/applications/loan-customers`,
  );
}

  getKycDetails(id: string): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/v1/profile/${id}`,
    );
  }

  set_pi_KycData(data: any): void {
    sessionStorage.setItem('kycs', JSON.stringify(data));
    this.kycSubject.next(data);
  }

  get_pi_KycData(): any {
    return this.kycSubject.value;
  }

  private getFromSession(): any {
    try {
      const data = sessionStorage.getItem('kycs');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error parsing session data:', error);
      return null;
    }
  }

  clear(): void {
    sessionStorage.removeItem('kycs');
    this.kycSubject.next(null);
    sessionStorage.removeItem('los');
    this.losSubject.next(null);
     this._lastLogin.set(null);
    localStorage.removeItem('lastLogin');
  }

  Logout(): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}/auth/logout`,
      {},
         );
  }

   // LOS api  
  getLosDetails(id: string): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/v1/los/applications`,
         );
  }

 set_los_Data(data: any): void {
    sessionStorage.setItem('los', JSON.stringify(data));
    this.losSubject.next(data);
  }

  get_los_Data(): any {
    return this.losSubject.value;
  }
  getUserDocuments(id: string): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/v1/los/applications/${id}/documents`,
       );
  }

  downloadDocs(userid: string, id: string): Observable<Blob> {
    return this.http.get<Blob>(
      `${this.baseUrl}/v1/los/applications/${userid}/documents/${id}/download`,
      {
        responseType: 'blob' as 'json',
        
      }
    );
  }

 
//mask the mobile and email address
  maskValue(value: string): string {
  if (!value) return '';

  // EMAIL
  if (value.includes('@')) {
    const [username, domain] = value.split('@');

    if (username.length <= 2) {
      return username[0] + '*@' + domain;
    }

    const visibleChars = 2;
    const maskedPart = '*'.repeat(username.length - visibleChars);

    return username.slice(0, visibleChars) + maskedPart + '@' + domain;
  }

  // MOBILE NUMBER
  const visibleDigits = 7;
  const cleanNumber = value.replace(/\D/g, ''); // remove spaces/dashes

  if (cleanNumber.length <= visibleDigits) return cleanNumber;

  const maskedLength = cleanNumber.length - visibleDigits;
  return  cleanNumber.slice(-visibleDigits) +'*'.repeat(maskedLength) ;
}

// input validations 
restrictInput(event: Event, type: 'text' | 'number' | 'decimal', decimalLimit: number = 2) {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    if (type === 'text') {
      value = value.replace(/[^A-Za-z ]+/g, '');
      value = value.replace(/\s{2,}/g, ' ');
     value = value.replace(/^\s+/, '');
    }

    if (type === 'number') {
      value = value.replace(/[^0-9]+/g, '');
    }

    if (type === 'decimal') {
    value = value.replace(/[^0-9.]+/g, '');

   
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }
    if (parts.length === 2) {
      if (parts[1].length > 2) {
        value = parts[0] + '.' + parts[1].substring(0, decimalLimit);
      }
    }

  }

    if (value !== input.value) {
      input.value = value;
      input.dispatchEvent(new Event('input'));
    }
  }

  restrictInput1(event: Event, type: 'text' | 'number' | 'decimal', decimalPlaces: number = 2, isMutualFund: boolean = false) {
  const input = event.target as HTMLInputElement;
  let value = input.value;

  if (type === 'text') {
    value = value.replace(/[^A-Za-z ]+/g, '');
    value = value.replace(/\s{2,}/g, ' ');
    value = value.replace(/^\s+/, '');
  }

  if (type === 'number') {
    value = value.replace(/[^0-9]+/g, '');
  }

  if (type === 'decimal') {
    value = value.replace(/[^0-9.]+/g, '');

    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Dynamic decimal places: 4 for mutual funds, 2 for others
    const maxDecimalPlaces = isMutualFund ? 4 : decimalPlaces;
    if (parts.length === 2 && parts[1].length > maxDecimalPlaces) {
      value = parts[0] + '.' + parts[1].substring(0, maxDecimalPlaces);
    }
  }

  if (value !== input.value) {
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }
}

  // Indian states and cities api 

   getIndianstates(): Observable<ApiResponse<UserData[]>> {
    return this.http.get<ApiResponse<UserData[]>>(
      `${this.baseUrl}/v1/states`, 
      
    );
  }

  
   getIndianstatescities(id: string): Observable<ApiResponse<UserData[]>> {
    return this.http.get<ApiResponse<UserData[]>>(
      `${this.baseUrl}/v1/${id}/cities`,
    );
  }


  
}


