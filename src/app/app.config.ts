import { ApplicationConfig, inject,provideAppInitializer,provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';

import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, HTTP_INTERCEPTORS, withInterceptorsFromDi, withXsrfConfiguration, withFetch } from '@angular/common/http';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { ErrorInterceptor } from './core/interceptors/error.interceptor';
import { LoggingInterceptor } from './core/interceptors/logging.interceptor';
import { CachingInterceptor } from './core/interceptors/caching.interceptor';
// import { CsrfService } from './core/service/CsrfService';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),

    provideHttpClient(
      withFetch(),

      // withXsrfConfiguration({
      //   cookieName: 'XSRF-TOKEN',
      //   headerName: 'X-XSRF-TOKEN'
      // }),

      withInterceptorsFromDi()
    ),

    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
    // provideAppInitializer(() => {
  // const csrfService = inject(CsrfService);
  //   return csrfService.initialize();

// })
  ]
};
 