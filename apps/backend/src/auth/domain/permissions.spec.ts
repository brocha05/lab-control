import { can, permissionsOf } from './permissions.js';

describe('permissions (Q-39, Q-40)', () => {
  it('lets only the Jefe de Control de Calidad issue reports and manage users', () => {
    expect(can('QUALITY_MANAGER', 'reports.issue')).toBe(true);
    expect(can('QMS_COORDINATOR', 'reports.issue')).toBe(false);
    expect(can('QMS_COORDINATOR', 'users.manage')).toBe(false);
    expect(can('QUALITY_MANAGER', 'users.manage')).toBe(true);
  });

  it('lets the Coordinador del SGC capture records and prepare reports', () => {
    expect(can('QMS_COORDINATOR', 'records.capture')).toBe(true);
    expect(can('QMS_COORDINATOR', 'reports.prepare')).toBe(true);
  });

  it('leaves the paper-based roles read only (A-101)', () => {
    expect(permissionsOf('LAB_MANAGER')).toEqual([]);
    expect(permissionsOf('FIELD_CREW_CHIEF')).toEqual([]);
  });
});
