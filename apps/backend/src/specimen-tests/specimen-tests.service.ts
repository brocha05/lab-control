import { Injectable } from '@nestjs/common';
import type { Prisma, SpecimenTestStatus } from '../generated/prisma/client.js';
import { PrismaService } from '../shared/prisma/prisma.service.js';
import { assignSpecimensToAges, type TestAgeRule } from './domain/test-schedule.js';

/** A sample's specimens, as the field-records module hands them over for planning. */
export interface SampleToPlan {
  specimens: { id: string; specimenNumber: number }[];
}

export interface SpecimenTestBrief {
  id: string;
  specimenId: string;
  ageDays: number;
  keepExactDate: boolean;
  status: SpecimenTestStatus;
}

/**
 * Owns `specimen_tests`. Every method takes `tenantId` first.
 */
@Injectable()
export class SpecimenTestsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Plans one SCHEDULED test per specimen with the project's default ages (Q-20),
   * ascending specimen numbers to ascending ages (Q-14, A-82). Runs inside the
   * transaction that completes the field record, so both happen or neither does.
   */
  async planForSamples(
    tx: Prisma.TransactionClient,
    tenantId: string,
    samples: readonly SampleToPlan[],
    ages: readonly TestAgeRule[],
  ): Promise<number> {
    const data = samples.flatMap((sample) => {
      const idByNumber = new Map(sample.specimens.map((s) => [s.specimenNumber, s.id]));
      return assignSpecimensToAges([...idByNumber.keys()], ages).map((a) => ({
        tenantId,
        specimenId: idByNumber.get(a.specimenNumber) as string,
        ageDays: a.ageDays,
      }));
    });
    if (data.length === 0) return 0;
    const { count } = await tx.specimenTest.createMany({ data });
    return count;
  }

  /** For the field-records module: the tests of some specimens (cancelled ones too). */
  async briefsForSpecimens(
    tenantId: string,
    specimenIds: readonly string[],
  ): Promise<SpecimenTestBrief[]> {
    if (specimenIds.length === 0) return [];
    return this.prisma.specimenTest.findMany({
      where: { tenantId, specimenId: { in: [...specimenIds] } },
      select: { id: true, specimenId: true, ageDays: true, keepExactDate: true, status: true },
      orderBy: { createdAt: 'asc' },
    });
  }
}
