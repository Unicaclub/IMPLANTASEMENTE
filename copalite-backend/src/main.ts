import { BadRequestException, Logger, RequestMethod, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { RequestLoggingInterceptor } from './common/interceptors/request-logging.interceptor';
import { validateEnv } from './config/env-validation';

async function bootstrap() {
  validateEnv();

  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });

  // Body size limit (prevents large payload DoS — must be before other middleware)
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));

  // Security headers
  app.use(helmet());

  // Cookie parser (for refresh tokens)
  app.use(cookieParser());

  // Global prefix (/health excluded for infrastructure probes)
  app.setGlobalPrefix('api/v1', {
    exclude: [{ path: 'health', method: RequestMethod.GET }],
  });

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        const messages = errors.map(error => ({
          field: error.property,
          errors: Object.values(error.constraints || {}),
        }));
        return new BadRequestException({
          statusCode: 400,
          message: 'Validacao falhou',
          errors: messages,
        });
      },
    }),
  );

  // Global interceptors and filters (observability)
  app.useGlobalInterceptors(new RequestLoggingInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
    credentials: true,
  });

  // Swagger — disabled in production
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Copalite API')
      .setDescription('Copalite Platform - Backend API v1')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.APP_PORT || 3000;
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`Copalite API running on port ${port} [${process.env.NODE_ENV || 'development'}]`);
  if (!isProduction) {
    logger.log(`Swagger docs: http://localhost:${port}/api/docs`);
  } else {
    logger.log('Swagger docs: disabled in production');
  }
}

bootstrap();
