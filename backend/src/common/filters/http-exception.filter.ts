import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ErrorCode } from '../constants/error-codes';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let code: number = ErrorCode.INTERNAL;
    let message = 'Internal server error';
    let data: unknown = null;

    if (exception instanceof HttpException) {
      httpStatus = exception.getStatus();
      const body = exception.getResponse();

      if (typeof body === 'string') {
        message = body;
      } else if (body && typeof body === 'object') {
        const obj = body as Record<string, unknown>;
        if (typeof obj.message === 'string') {
          message = obj.message;
        } else if (Array.isArray(obj.message)) {
          message = obj.message.join('; ');
        }
        if (typeof obj.code === 'number') {
          code = obj.code;
        }
        if ('data' in obj) {
          data = obj.data;
        }
      }

      if (typeof (exception as { code?: number }).code === 'number') {
        // no-op; prefer body.code
      }

      if (code === ErrorCode.INTERNAL) {
        if (httpStatus === HttpStatus.UNAUTHORIZED) {
          code = ErrorCode.UNAUTHORIZED;
        } else if (httpStatus === HttpStatus.FORBIDDEN) {
          code = ErrorCode.FORBIDDEN;
        } else if (httpStatus === HttpStatus.NOT_FOUND) {
          code = ErrorCode.NOT_FOUND;
        } else if (httpStatus === HttpStatus.BAD_REQUEST) {
          code = ErrorCode.BAD_REQUEST;
        } else if (httpStatus === HttpStatus.CONFLICT) {
          code = ErrorCode.CONFLICT;
        } else if (httpStatus >= 500) {
          code = ErrorCode.INTERNAL;
        } else {
          code = ErrorCode.BAD_REQUEST;
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message || message;
      this.logger.error(exception.message, exception.stack);
    } else {
      this.logger.error(`Unknown exception: ${String(exception)}`);
    }

    response.status(httpStatus).json({
      code,
      message,
      data,
    });
  }
}
