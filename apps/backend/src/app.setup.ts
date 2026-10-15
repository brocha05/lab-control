import { INestApplication, ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './shared/http/global-exception.filter.js';
import { ResponseInterceptor } from './shared/http/response.interceptor.js';

/**
 * Global HTTP behaviour, shared by main.ts and the integration tests so both run the
 * exact same pipeline (docs/api/conventions.md).
 */
export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix('api/v1');
  // docs/api/conventions.md#validation
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());
}
