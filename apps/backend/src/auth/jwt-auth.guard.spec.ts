import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

const principal = { userId: 'u1', tenantId: 't1', role: 'ADMIN' };

function setup(isPublic: boolean | undefined, authorization?: string) {
  const req: { headers: { authorization?: string }; user?: unknown } = {
    headers: { authorization },
  };
  const context = {
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;
  const reflector = { getAllAndOverride: vi.fn().mockReturnValue(isPublic) };
  const auth = {
    verifyAccessToken: vi.fn((token: string) =>
      token === 'good'
        ? Promise.resolve(principal)
        : Promise.reject(new UnauthorizedException('bad token')),
    ),
  };
  const guard = new JwtAuthGuard(reflector as unknown as Reflector, auth as unknown as AuthService);
  return { guard, context, req, auth };
}

describe('JwtAuthGuard', () => {
  it('lets @Public() routes through without a token', async () => {
    const { guard, context, auth } = setup(true);
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(auth.verifyAccessToken).not.toHaveBeenCalled();
  });

  it('puts the verified principal on request.user', async () => {
    const { guard, context, req } = setup(undefined, 'Bearer good');
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(req.user).toEqual(principal);
  });

  it.each([undefined, '', 'good', 'Basic good', 'Bearer'])(
    'rejects a missing or malformed header: %s',
    async (header) => {
      const { guard, context } = setup(undefined, header);
      await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
    },
  );

  it('rejects an invalid token', async () => {
    const { guard, context, req } = setup(false, 'Bearer forged');
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(req.user).toBeUndefined();
  });
});
