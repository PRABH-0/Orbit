import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError(err => {
      if (err.status === 401) {
        console.warn('Session expired');

        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('userId');

        if (router.url !== '/signin') {
          router.navigate(['/signin']);
        }
      }

      return throwError(() => err);
    })
  );
};
