import { HttpInterceptorFn } from '@angular/common/http';
import { from, switchMap } from 'rxjs';
import { supabase } from '../supabase.client';

export const supabaseAuthInterceptor: HttpInterceptorFn = (req, next) => {
  return from(supabase.auth.getSession()).pipe(
    switchMap(({ data }) => {
      const token = data.session?.access_token;

      if (!token) {
        return next(req);
      }

      const authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });   

      return next(authReq);
    })
  );
};
