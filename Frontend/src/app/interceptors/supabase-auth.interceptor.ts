import { HttpInterceptorFn } from '@angular/common/http';
import { from, switchMap, catchError, throwError } from 'rxjs';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { supabase } from '../supabase.client';

export const supabaseAuthInterceptor: HttpInterceptorFn = (req, next) => {

  const router = inject(Router);

  return from(supabase.auth.getSession()).pipe(
    switchMap(({ data }) => {

      const token = data.session?.access_token;

      // 🚨 If no token → redirect
      if (!token) {
        router.navigate(['/signin']);
        return next(req);
      }

      const authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });

      return next(authReq).pipe(
        catchError((error) => {

          if (error.status === 401) {
            supabase.auth.signOut(); // ❗ no async
            router.navigate(['/signin']);
          }

          return throwError(() => error);
        })
      );
    })
  );
};
