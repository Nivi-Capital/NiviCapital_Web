import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry, timeout } from 'rxjs/operators';
import { Msgboxservice } from '../service/msgboxservice';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  // Timeout in milliseconds (30 seconds)
  private readonly REQUEST_TIMEOUT = 30000;
  // Number of retries for failed requests
  private readonly RETRY_ATTEMPTS = 1;

  constructor(private msgBox: Msgboxservice) { }

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Clone request with credentials for cookie-based token
    request = request.clone({
      withCredentials: true
    });

    return next.handle(request).pipe(
      // Add timeout to requests
      timeout(this.REQUEST_TIMEOUT),
      // Retry failed requests (except 4xx and 5xx errors)
      retry({
        count: this.RETRY_ATTEMPTS,
        delay: (error: any) => {
          // Only retry on network errors, not HTTP errors
          if (error instanceof HttpErrorResponse) {
            return throwError(() => error);
          }
          return throwError(() => error);
        },
      }),
      // Handle errors

     catchError((error: HttpErrorResponse) => {
  let errorMessage = 'An unexpected error occurred.';
  let showPopup = true;

  switch (error.status) {
    case 0:
      errorMessage =
        error.error?.message ??
        'Unable to connect to the server. Please check your network connection.';
      break;

    case 400:
      errorMessage =
        error.error?.message ??
        'Bad request. Please verify your input.';
      break;

    case 401:
      showPopup = false; // AuthInterceptor handles this
      return throwError(() => error);

    case 403:
      errorMessage =
        error.error?.message ??
        'You do not have permission to perform this action.';
      break;

    case 404:
      errorMessage =
        error.error?.message ??
        'The requested resource could not be found.';
      break;

    case 408:
      errorMessage =
        error.error?.message ??
        'The request timed out. Please try again.';
      break;

    case 500:
      errorMessage =
        error.error?.message ??
        'Internal server error. Please try again later.';
      break;

    case 503:
      errorMessage =
        error.error?.message ??
        'Service unavailable. Please try again later.';
      break;
  }

  if (showPopup) {
    this.msgBox.open({
      title: 'Error',
      message: errorMessage,
      showCancel: false,
      onOk: () => {}
    });
  }

  return throwError(() => ({
    status: error.status,
    message: errorMessage
  }));
})     
    );
  }
}
