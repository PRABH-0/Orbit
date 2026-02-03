import { inject } from '@angular/core';
import {
  HttpErrorResponse,
  HttpInterceptorFn
} from '@angular/common/http';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

export const refreshInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (req.url.includes('/auth/refresh')) {
    return next(req);
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {

        return authService.refreshToken().pipe(
          switchMap(res => {
            localStorage.setItem('token', res.accessToken);

            const clonedReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${res.accessToken}`
              }
            });

            return next(clonedReq);
          }),
          catchError(() => {
            localStorage.clear();
            router.navigate(['/signin']);
            return throwError(() => error);
          })
        );
      }

      return throwError(() => error);
    })
  );
};

