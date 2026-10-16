import ExcelJS from 'exceljs';
import type { CalendarDate } from '../shared/dates/calendar-date.js';
import type { BitacoraRecord, BitacoraSample } from './bitacora.js';
import type { ProjectBitacora } from './bitacora.service.js';

/**
 * The Bitácora as the lab keeps it today: one Excel workbook, a tab per project
 * (Q-68), FPC01-02 columns, record and sample data in merged cells (A-95, Q-91).
 */

const COLUMNS: { header: string; width: number }[] = [
  { header: 'Informe', width: 11 },
  { header: 'Fecha de muestreo', width: 12 },
  { header: 'Proveedor', width: 14 },
  { header: 'Hecho en obra', width: 8 },
  { header: 'Premezclado', width: 11 },
  { header: 'Resistencia de proyecto (kg/cm²)', width: 12 },
  { header: 'Revenimiento de proyecto (cm)', width: 13 },
  { header: 'T.M.A. (cm)', width: 7 },
  { header: 'Elemento colado', width: 34 },
  { header: 'No. muestra', width: 8 },
  { header: 'Hora de elaboración', width: 10 },
  { header: 'Revenimientos (cm)', width: 12 },
  { header: 'Temperatura (°C)', width: 11 },
  { header: 'Masa unitaria (kg/m³)', width: 11 },
  { header: 'Contenido de aire (%)', width: 10 },
  { header: 'Número de espécimen (cilindro/viga)', width: 12 },
  { header: 'Edad de ensayo (días)', width: 8 },
  { header: 'Fecha de ensayo', width: 12 },
  { header: 'Carga máxima aplicada (kgf)', width: 12 },
  { header: 'Área (cm²)', width: 9 },
  { header: 'Esfuerzo (kg/cm²)', width: 10 },
  { header: '% de resistencia', width: 10 },
];
/** Columns 1–9 and 14–15 belong to the record; 10–13 to the sample (1-based). */
const RECORD_COLS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 14, 15];
const SAMPLE_COLS = [10, 11, 12, 13];

const dmy = (d: CalendarDate | null): string => {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
};
const fixed = (v: number | null, decimals: number): string =>
  v === null ? '' : v.toFixed(decimals);

function slumps(s: BitacoraSample): string {
  // Both readings when the test was repeated, never an average (Q-66).
  return [s.slump1Cm, s.slump2Cm]
    .filter((v): v is number => v !== null)
    .map((v) => v.toFixed(1))
    .join(' / ');
}

/** Excel tab names: ≤ 31 characters, no []:*?/\, unique. */
function sheetName(b: ProjectBitacora, used: Set<string>): string {
  const base =
    (b.project.code ? `${b.project.code} ${b.project.name}` : b.project.name)
      .replace(/[[\]:*?/\\]/g, ' ')
      .trim()
      .slice(0, 31) || 'Proyecto';
  let name = base;
  for (let i = 2; used.has(name.toLowerCase()); i++) {
    const suffix = ` (${i})`;
    name = base.slice(0, 31 - suffix.length) + suffix;
  }
  used.add(name.toLowerCase());
  return name;
}

function recordRow(r: BitacoraRecord): (string | number | null)[] {
  return [
    r.registryNumber ?? '',
    dmy(r.pourDate),
    r.supplier ?? '',
    r.production === 'SITE_MIXED' ? 'X' : '',
    r.production === 'READY_MIXED' ? 'X' : '',
    r.specifiedStrengthKgCm2,
    r.specifiedSlumpCm === null
      ? ''
      : `${r.specifiedSlumpCm.toFixed(1)}${r.specifiedSlumpToleranceCm !== null ? ` ± ${r.specifiedSlumpToleranceCm.toFixed(1)}` : ''}`,
    fixed(r.maxAggregateSizeCm, 1),
    r.castElement ?? '',
  ];
}

function addProjectSheet(wb: ExcelJS.Workbook, b: ProjectBitacora, name: string): void {
  const ws = wb.addWorksheet(name, {
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    views: [{ state: 'frozen', ySplit: 4 }],
  });
  ws.columns = COLUMNS.map((c) => ({ width: c.width }));

  ws.mergeCells(1, 1, 1, COLUMNS.length);
  ws.getCell(1, 1).value = 'BITÁCORA ELECTRÓNICA DE ENSAYOS DE CONCRETO HIDRÁULICO · FPC01-02';
  ws.getCell(1, 1).font = { bold: true, size: 12 };
  ws.getCell(2, 1).value = `Obra: ${b.project.name}`;
  ws.getCell(3, 1).value = `Solicitante: ${b.project.client.name}`;

  const header = ws.getRow(4);
  COLUMNS.forEach((c, i) => {
    const cell = header.getCell(i + 1);
    cell.value = c.header;
    cell.font = { bold: true, size: 9 };
    cell.alignment = { wrapText: true, vertical: 'middle', horizontal: 'center' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFEFEC' } };
  });
  header.height = 42;

  let row = 5;
  for (const r of b.records) {
    const recordStart = row;
    for (const s of r.samples) {
      const sampleStart = row;
      const specimens = s.specimens.length ? s.specimens : [null];
      for (const sp of specimens) {
        const values: (string | number | null)[] = [
          ...recordRow(r),
          s.sampleNumber,
          s.moldedAt ?? '',
          slumps(s),
          fixed(s.concreteTemperatureC, 1),
          r.unitWeightKgM3 ?? '-',
          r.airContentPct === null ? '-' : r.airContentPct.toFixed(1),
          sp?.specimenNumber ?? '',
          sp?.ageDays ?? '',
          dmy(sp?.date ?? null),
          sp?.maxLoadKgf ?? '',
          sp?.areaCm2 ?? '',
          sp?.stressKgCm2 ?? '',
          sp?.percentOfDesign ?? '',
        ];
        const line = ws.getRow(row);
        values.forEach((v, i) => {
          const cell = line.getCell(i + 1);
          cell.value = v === null ? '' : v;
          cell.alignment = {
            vertical: 'middle',
            horizontal: i === 8 ? 'left' : 'center',
            wrapText: i === 8,
          };
          cell.font = { size: 9 };
        });
        line.getCell(19).numFmt = '#,##0';
        line.getCell(20).numFmt = '0.00';
        line.getCell(22).numFmt = '0.0';
        if (sp && !sp.tested) {
          // Not tested yet: the date shown is the scheduled one.
          line.getCell(18).font = { size: 9, italic: true, color: { argb: 'FF7A7E83' } };
        }
        row++;
      }
      if (row - 1 > sampleStart) {
        for (const c of SAMPLE_COLS) ws.mergeCells(sampleStart, c, row - 1, c);
      }
    }
    if (row - 1 > recordStart) {
      for (const c of RECORD_COLS) ws.mergeCells(recordStart, c, row - 1, c);
    }
  }

  for (let r = 4; r < row; r++) {
    ws.getRow(r).eachCell({ includeEmpty: true }, (cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
  }
}

export async function bitacoraWorkbook(bitacoras: readonly ProjectBitacora[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'LabControl';
  const used = new Set<string>();
  for (const b of bitacoras) addProjectSheet(wb, b, sheetName(b, used));
  if (bitacoras.length === 0) wb.addWorksheet('Bitácora');
  return Buffer.from(await wb.xlsx.writeBuffer());
}
