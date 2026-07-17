import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { ErrorCode } from '../constants/error-codes';

export type ApiResponse<T = unknown> = {
  code: number;
  message: string;
  data: T;
};

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        if (
          data &&
          typeof data === 'object' &&
          'code' in (data as object) &&
          'message' in (data as object) &&
          'data' in (data as object)
        ) {
          return data as unknown as ApiResponse<T>;
        }
        return {
          code: ErrorCode.OK,
          message: 'ok',
          data: data as T,
        };
      }),
    );
  }
}
