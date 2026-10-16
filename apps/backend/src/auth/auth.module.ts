import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { PermissionsGuard } from './permissions.guard.js';
import { MeController } from './me.controller.js';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';

/**
 * Owns `users` (credentials) and `refresh_tokens`. Secrets are passed per call from config.
 * Registers the global JWT guard: every route is authenticated unless `@Public()`.
 */
@Module({
  imports: [
    JwtModule.register({}),
    // Brute-force guard for sign-in (10.5): per client IP. Off in integration tests,
    // which sign in many times from one address.
    ThrottlerModule.forRoot({
      throttlers: [{ name: 'auth', ttl: 60_000, limit: 10 }],
      skipIf: () => process.env.NODE_ENV === 'test',
    }),
  ],
  controllers: [AuthController, MeController, UsersController],
  providers: [
    AuthService,
    UsersService,
    // Order matters: authenticate first, then check the role's permission.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
  exports: [AuthService],
})
export class AuthModule {}
