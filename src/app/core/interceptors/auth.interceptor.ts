import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpClient,
  HttpErrorResponse,
} from '@angular/common/http';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { BehaviorSubject, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';



@Injectable()

export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<any>(null);
  private baseUrl = environment.apiBaseUrl;
  constructor(private router: Router, private http: HttpClient,) { }
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const request = req.clone({ withCredentials: true });

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        console.log(error)
       

        if (error.status !== 401) {
          return throwError(() => error);
        }
        
        const msg = error.error?.message;

        // Only refresh when access token has expired ot token missing
        if (error.error?.code === 401 && (msg === 'ACCESS_TOKEN_EXPIRED' || msg === 'TOKEN_MISSING')) {
          return this.handleRefreshToken(request, next);
        }

        // force Logout scenarios
        if (
          msg === 'SESSION_REVOKED' ||
          msg === 'TOKEN_INVALID' ||
          msg === 'ACCOUNT_DISABLED' ||
          msg === 'REFRESH_TOKEN_EXPIRED'
        ) {
          this.router.navigate(['/login']);
        }

        return throwError(() => error);
      })
    );
  }


private handleRefreshToken(
    request: HttpRequest<any>,
    next: HttpHandler
  ) {

    if (this.isRefreshing) {
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap(() => next.handle(request))
      );
    }

    this.isRefreshing = true;
    this.refreshTokenSubject.next(null);

    return this.http
      .post(
        `${this.baseUrl}/auth/refresh`,
        {},
        { withCredentials: true }
      )
      .pipe(
        switchMap(() => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(true);

          // Retry original request
          return next.handle(request);
        }),
        catchError((err) => {
          this.isRefreshing = false;
          this.router.navigate(['/login'])

          return throwError(() => err);
        })
      );
  }


 
}



