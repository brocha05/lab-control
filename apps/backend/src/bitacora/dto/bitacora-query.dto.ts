import { IsOptional, IsUUID, Matches } from 'class-validator';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** GET /projects/:id/bitacora: optional pour-date window. */
export class BitacoraQueryDto {
  @IsOptional()
  @Matches(DATE, { message: 'from must be YYYY-MM-DD' })
  from?: string;

  @IsOptional()
  @Matches(DATE, { message: 'to must be YYYY-MM-DD' })
  to?: string;
}

/** GET /bitacora/export: one project, or every project (a tab each) when omitted. */
export class BitacoraExportQueryDto {
  @IsOptional()
  @IsUUID()
  projectId?: string;
}
