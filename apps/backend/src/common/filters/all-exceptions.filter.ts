import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exResponse = exception.getResponse();

      if (typeof exResponse === 'string') {
        message = exResponse;
      } else if (typeof exResponse === 'object') {
        message = (exResponse as any).message || message;
        errors = (exResponse as any).errors || null;
      }
    } else {
      this.logger.error(
        `Unhandled exception on ${request?.method} ${request?.url}: ${exception}`,
        exception instanceof Error ? exception.stack : undefined,
      );
      message = (exception as Error)?.message || 'Internal server error';
    }

    this.logger.warn(`${request?.method} ${request?.url} → ${status} ${JSON.stringify(message).slice(0, 200)}`);

    response.status(status).json({
      statusCode: status,
      message,
      errors,
      timestamp: new Date().toISOString(),
    });
  }
}
