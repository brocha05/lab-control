import {
  type CompletenessRecord,
  type CompletenessSample,
  missingForCompletion,
} from './completeness.js';

/** MCH-068 as filled in on paper (blank boxes stay null). */
function mch068(): CompletenessRecord {
  const truck = (ticket: string) => ({
    ticketNumber: ticket,
    volumeM3: 7,
    plantDepartureTime: '08:36',
    siteArrivalTime: '10:15',
    pourStartTime: '10:25',
    pourEndTime: '10:56',
    ambientTemperatureC: 32,
    concreteTemperatureC: 34,
    slump1Cm: 15,
    samples: [] as CompletenessSample[],
  });
  const deliveries = [truck('1'), truck('2'), truck('3'), truck('4')];
  deliveries[0].samples = [
    {
      sampleNumber: 102,
      moldedAt: '10:30',
      specimens: [405, 406, 407, 408].map((n, i) => ({
        specimenNumber: n,
        moldCode: ['020', '092', '022', '094'][i],
      })),
    },
  ];
  return {
    registrySequence: 68,
    supplier: { id: 's' },
    strengthCriterion: 'FC',
    specifiedStrengthKgCm2: 250,
    specifiedSlumpCm: 14,
    specifiedSlumpToleranceCm: 3.5,
    maxAggregateSizeMm: 20,
    cementType: { id: 'c' },
    designAgeDays: 7,
    screened: false,
    skyCondition: 'CLOUDY',
    windCondition: 'CALM',
    lightingCondition: 'NATURAL',
    slumpConeCode: 'CR-02',
    tapeMeasureCode: 'FLX-01',
    strikeOffBarCode: 'EM-10',
    slumpRodCode: '03',
    samplingRodCode: '03',
    wheelbarrowCode: '03',
    programmedElement: 'Muro adicional',
    castElement: 'Muro adicional',
    samplerName: 'Tec. Antonio Torres R.',
    approvedByName: 'Cliente',
    deliveries,
  };
}

describe('missingForCompletion (Q-33)', () => {
  it('accepts the lab example as complete', () => {
    expect(missingForCompletion(mch068())).toEqual([]);
  });

  it('treats screened = false as answered', () => {
    expect(missingForCompletion({ ...mch068(), screened: false })).toEqual([]);
    expect(missingForCompletion({ ...mch068(), screened: null })).toEqual(['screened']);
  });

  it('requires the visto bueno (Q-73)', () => {
    expect(missingForCompletion({ ...mch068(), approvedByName: null })).toEqual(['approvedByName']);
  });

  it('lists missing delivery, sample and specimen items with 1-based positions', () => {
    const record = mch068();
    record.deliveries[0].pourEndTime = null;
    record.deliveries[0].samples[0].moldedAt = '';
    record.deliveries[0].samples[0].specimens[3].moldCode = null;
    expect(missingForCompletion(record)).toEqual([
      'deliveries[1].pourEndTime',
      'deliveries[1].samples[1].moldedAt',
      'deliveries[1].samples[1].specimens[4].moldCode',
    ]);
  });

  it('needs at least one delivery and one sample', () => {
    expect(missingForCompletion({ ...mch068(), deliveries: [] })).toContain('deliveries');
    const noSamples = mch068();
    noSamples.deliveries[0].samples = [];
    expect(missingForCompletion(noSamples)).toEqual(['samples']);
  });
});
