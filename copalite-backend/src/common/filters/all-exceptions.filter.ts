import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    const isHttpException = exception instanceof HttpException;

    // Handle Express body-parser errors (PayloadTooLargeError, etc.)
    const isBodyParserError = exception instanceof Error && 'status' in exception && 'type' in exception;
    const status = isHttpException
      ? exception.getStatus()
      : isBodyParserError
        ? (exception as any).status || HttpStatus.BAD_REQUEST
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = isHttpException ? exception.getResponse() : null;
    const message = isHttpException
      ? (typeof exceptionResponse === 'object' && exceptionResponse !== null
          ? (exceptionResponse as Record<string, unknown>).message || exception.message
          : exception.message)
      : isBodyParserError
        ? (exception as Error).message
        : 'Internal server error';

    // Log only unexpected errors as errors; known HTTP exceptions as warnings
    if (isHttpException && status < 500) {
      this.logger.warn(
        `${request.method} ${request.url} ${status} — ${typeof message === 'string' ? message : JSON.stringify(message)}`,
      );
    } else {
      this.logger.error(
        `${request.method} ${request.url} ${status} — ${typeof message === 'string' ? message : JSON.stringify(message)}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    if (response.headersSent) {
      return;
    }

    // Preserve structured error responses (validation errors, etc.)
    if (isHttpException && typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      response.status(status).json({
        ...(exceptionResponse as Record<string, unknown>),
        timestamp: new Date().toISOString(),
      });
    } else {
      response.status(status).json({
        statusCode: status,
        message,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
