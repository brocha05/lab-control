import { Prisma } from '../../generated/prisma/client.js';

/** True for a unique-constraint violation (Prisma P2002). Map it to a 409 in the service. */
export function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}
