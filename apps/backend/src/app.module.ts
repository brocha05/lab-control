import { Module, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { AuthModule } from './auth/auth.module.js';
import { CatalogsModule } from './catalogs/catalogs.module.js';
import { ClientsModule } from './clients/clients.module.js';
import { FieldRecordsModule } from './field-records/field-records.module.js';
import { ProjectsModule } from './projects/projects.module.js';
import { SpecimenTestsModule } from './specimen-tests/specimen-tests.module.js';
import { HealthController } from './health/health.controller.js';
import { Env, validateEnv } from './shared/config/env.validation.js';
import { resolveRequestId } from './shared/http/request-id.js';
import { PrismaModule } from './shared/prisma/prisma.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        forRoutes: [{ path: '{*splat}', method: RequestMethod.ALL }],
        pinoHttp: {
          level: config.get('LOG_LEVEL', { infer: true }),
          genReqId: (req, res) => {
            const id = resolveRequestId(req);
            res.setHeader('X-Request-ID', id);
            return id;
          },
          // Never log credentials. Request bodies are not logged by default.
          redact: ['req.headers.authorization', 'req.headers.cookie'],
          transport:
            config.get('NODE_ENV', { infer: true }) === 'development'
              ? { target: 'pino-pretty', options: { singleLine: true } }
              : undefined,
        },
      }),
    }),
    PrismaModule,
    AuthModule,
    ClientsModule,
    ProjectsModule,
    CatalogsModule,
    FieldRecordsModule,
    SpecimenTestsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
