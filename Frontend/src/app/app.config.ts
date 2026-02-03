import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';
import { loaderInterceptor } from './interceptors/loader.interceptor';
import { jwtInterceptor } from './interceptors/jwt.interceptor';
import { refreshInterceptor } from './interceptors/refresh.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        jwtInterceptor,
        authInterceptor,
        loaderInterceptor,
        refreshInterceptor
      ])
    )
  ]
};
