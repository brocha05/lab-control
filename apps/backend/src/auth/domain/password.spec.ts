import { hashPassword, verifyPassword } from './password.js';

describe('password hashing', () => {
  it('verifies the password it hashed', async () => {
    const hash = await hashPassword('correct horse battery');
    expect(hash.startsWith('scrypt$32768$8$1$')).toBe(true);
    await expect(verifyPassword('correct horse battery', hash)).resolves.toBe(true);
  });

  it('rejects a wrong password', async () => {
    const hash = await hashPassword('correct horse battery');
    await expect(verifyPassword('correct horse batterY', hash)).resolves.toBe(false);
  });

  it('uses a new salt every time', async () => {
    const [a, b] = await Promise.all([hashPassword('same'), hashPassword('same')]);
    expect(a).not.toBe(b);
  });

  it.each(['', 'plain-text', 'bcrypt$2b$12$abc', 'scrypt$0$8$1$c2FsdA$aGFzaA', 'scrypt$x$y$z$a$b'])(
    'returns false for a malformed hash: %s',
    async (stored) => {
      await expect(verifyPassword('anything', stored)).resolves.toBe(false);
    },
  );
});
