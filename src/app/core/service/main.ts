import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment'

export interface ApiResponse<T> {
  status: string;
  code: number;
  message: string;
  errors: any;
  data: T;
}


@Injectable({
  providedIn: 'root'
})
export class Main {

    private baseUrl = environment.apiBaseUrl;


  selectedUserId: any;
  docofselectedUser: any;

  constructor(public http: HttpClient) { }

 

   getLogin(payload: any) : Observable<any>{
    return this.http.post<any>(
      `${this.baseUrl}/admin/auth/login`,
      payload,
      { withCredentials: true }
    );
  }

  getAllUsers(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(
      `${this.baseUrl}/admin/users`,
      { withCredentials: true }
    );
  }

  //get kyc details of single user 
  getKycDeatils(id: any): Observable<any[]> {
    return this.http.get<any[]>('/nivicap/api/kyc/user/' + id + '?onlyActive=true');
  }

  //get all applicants
  getAllApplicants(): Observable<any> {
    return this.http.get<any[]>('nivicap/api/los/applications');
  }

  //get all documents of user (pan,aadhar etc)
  getUserDocuments(id: any): Observable<any> {
    return this.http.get<any[]>('nivicap/api/los/applications/' + id + '/documents');
  }

  //Download documents of user (pan,aadhar etc)
  downloadDocs(userid: any, id: any) {
    const url = 'nivicap/api/los/applications/' + userid + '/documents/' + id + '/download'
    this.http.get<any[]>(url);
    window.open(url, '_blank');
  }

}
