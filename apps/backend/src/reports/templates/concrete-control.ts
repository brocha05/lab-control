import Handlebars from 'handlebars';
import type { ConcreteControlSnapshot } from '../domain/concrete-control.js';

/**
 * `concrete-control` template v1, laid out like FPC06-04 (ADR-006): letter, portrait,
 * bordered tables, specimens as columns (6 per page), unused columns struck through.
 * Logic-less: every value comes from the snapshot; helpers only format.
 */

const hb = Handlebars.create();

const dmy = (v: unknown): string => {
  if (typeof v !== 'string') return '—';
  const [y, m, d] = v.split('-');
  return `${d}/${m}/${y}`;
};
hb.registerHelper('dmy', dmy);
hb.registerHelper('fixed', (v: unknown, decimals: unknown) =>
  typeof v === 'number' ? v.toFixed(Number(decimals)) : '—',
);
// "357 771": thin-space thousands, as on the lab's report.
hb.registerHelper('thousands', (v: unknown) =>
  typeof v === 'number'
    ? Math.round(v)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    : '—',
);
hb.registerHelper('orNA', (v: unknown) => (typeof v === 'string' && v.trim() ? v : 'N/A'));
hb.registerHelper('or', (v: unknown, fallback: unknown) =>
  v === null || v === undefined || v === '' ? fallback : v,
);
hb.registerHelper('times', (n: unknown, options: Handlebars.HelperOptions) =>
  Array.from({ length: Number(n) || 0 }, () => options.fn({})).join(''),
);
hb.registerHelper('add', (a: unknown, b: unknown) => Number(a) + Number(b));
hb.registerHelper('join', (list: unknown, sep: unknown) =>
  Array.isArray(list) ? list.join(String(sep)) : '',
);
hb.registerHelper('joinFixed', (list: unknown, sep: unknown) =>
  Array.isArray(list) ? list.map((x: number) => x.toFixed(1)).join(String(sep)) : '',
);

const STYLES = `
@page { size: letter portrait; margin: 12mm 12mm 14mm; }
* { box-sizing: border-box; }
body { margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 8.5pt; color: #111; }
.page { page-break-after: always; }
.page:last-child { page-break-after: auto; }
header { display: flex; justify-content: space-between; align-items: flex-start; gap: 8mm; }
.lab { font-weight: bold; font-size: 10pt; }
.lab small { display: block; font-weight: normal; font-size: 7.5pt; color: #444; }
.title { color: #b3261e; font-weight: bold; font-size: 11pt; text-align: center; margin: 3mm 0 2mm; }
.meta { text-align: right; font-size: 8pt; }
.meta b { font-size: 9pt; }
table { width: 100%; border-collapse: collapse; margin-top: 2mm; table-layout: fixed; }
th, td { border: 0.6pt solid #333; padding: 1.2mm 1.4mm; vertical-align: middle; }
th { background: #eceae4; font-weight: bold; text-align: left; }
.section { background: #d9d6cc; text-align: center; font-weight: bold; }
.c { text-align: center; }
.num { text-align: center; font-family: "Courier New", monospace; }
.label { width: 34%; background: #f5f4f0; font-weight: bold; }
.empty { background: repeating-linear-gradient(135deg, transparent 0 3.5mm, #999 3.5mm 3.8mm); }
.notes { margin-top: 2mm; font-size: 7pt; line-height: 1.35; }
.notes p { margin: 0 0 1mm; }
.obs { min-height: 10mm; }
.signs { display: flex; justify-content: space-around; margin-top: 14mm; text-align: center; font-size: 7.5pt; }
.signs div { width: 62mm; border-top: 0.6pt solid #111; padding-top: 1mm; }
footer { margin-top: 4mm; border-top: 0.6pt solid #2e7d32; padding-top: 1mm; color: #2e7d32; font-size: 7pt; display: flex; justify-content: space-between; }
`;

const SOURCE = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>{{reportNumber}}</title><style>${STYLES}</style></head>
<body>
{{#each pages}}
<section class="page">
  <header>
    <div class="lab">{{or ../lab.legalName ../lab.name}}<small>Laboratorio de control de calidad de materiales</small></div>
    <div class="meta">No. informe: <b>{{../reportNumber}}</b>{{#if (gt ../version 1)}}<br>Versión {{../version}}{{/if}}<br>Página {{add @index 1}} de {{../pages.length}}</div>
  </header>
  <div class="title">INFORME DE PRUEBAS DE CONTROL DE CONCRETO HIDRÁULICO</div>

  <table>
    <tr><td class="label">Proyecto</td><td>{{../project.name}}</td></tr>
    <tr><td class="label">Contratista</td><td>{{../client.name}}</td></tr>
    <tr><td class="label">Contacto</td><td>{{or ../client.contactName "—"}}{{#if ../client.contactPhone}} · Tel. {{../client.contactPhone}}{{/if}}</td></tr>
  </table>

  <table>
    <tr><th colspan="4" class="section">IDENTIFICACIÓN DE LA MUESTRA</th></tr>
    <tr><td class="label">Fecha de colado</td><td class="num">{{dmy ../record.pourDate}}</td><td class="label">Fecha de informe</td><td class="num">{{dmy ../issueDate}}</td></tr>
    <tr><td class="label">Número de muestra</td><td class="num">{{or sampleNumber "—"}}</td><td class="label">Registro de campo</td><td class="num">{{../record.registryNumber}}</td></tr>
    <tr><td class="label">Elemento colado</td><td colspan="3">{{or ../record.castElement "—"}}</td></tr>
  </table>

  <table>
    <tr><th colspan="2" class="section">DATOS DEL PROPORCIONAMIENTO</th><th colspan="2" class="section">DATOS DE LA OBRA</th></tr>
    <tr><td class="label">Número y fecha</td><td>{{orNA ../fields.mixDesignReference}}</td><td class="label">Equipo de mezclado</td><td>{{orNA ../fields.mixingEquipment}}</td></tr>
    <tr><td class="label">f'c (kg/cm²) / revenimiento (cm)</td><td class="num">{{fixed ../record.specifiedStrengthKgCm2 1}} / {{fixed ../record.specifiedSlumpCm 1}}{{#if ../record.specifiedSlumpToleranceCm}} ± {{fixed ../record.specifiedSlumpToleranceCm 1}}{{/if}}</td><td class="label">Método de compactación</td><td>{{orNA ../fields.compactionMethod}}</td></tr>
    <tr><td class="label">Aditivo</td><td>{{orNA ../fields.admixture}}</td><td class="label">Proveedor (tipo de cemento)</td><td>{{or ../record.supplier "—"}}{{#if ../record.cementType}} ({{../record.cementType}}){{/if}}</td></tr>
    <tr><td class="label">Temperatura (°C)</td><td class="num">{{fixed concreteTemperatureC 1}}</td><td class="label">Revenimiento (cm)</td><td class="num">{{or (joinFixed slumpsCm " / ") "—"}}</td></tr>
  </table>

  <table>
    <colgroup><col style="width:28%">{{#times 6}}<col style="width:12%">{{/times}}</colgroup>
    <tr><th colspan="7" class="section">DATOS DE LOS ESPECÍMENES (CILINDROS)</th></tr>
    <tr><td class="label">Número de espécimen</td>{{#each specimens}}<td class="num"><b>{{or specimenNumber "—"}}</b></td>{{/each}}{{#times emptyColumns}}<td class="empty"></td>{{/times}}</tr>
    <tr><td class="label">Fecha de colado</td>{{#each specimens}}<td class="num">{{dmy pourDate}}</td>{{/each}}{{#times emptyColumns}}<td class="empty"></td>{{/times}}</tr>
    <tr><td class="label">Fecha de ensayo</td>{{#each specimens}}<td class="num">{{dmy testDate}}{{#if outsideAgeTolerance}}*{{/if}}</td>{{/each}}{{#times emptyColumns}}<td class="empty"></td>{{/times}}</tr>
    <tr><td class="label">Edad (días)</td>{{#each specimens}}<td class="num">{{ageDays}}</td>{{/each}}{{#times emptyColumns}}<td class="empty"></td>{{/times}}</tr>
    <tr><td class="label">Diámetro (cm)</td>{{#each specimens}}<td class="num">{{fixed meanDiameterCm 2}}</td>{{/each}}{{#times emptyColumns}}<td class="empty"></td>{{/times}}</tr>
    <tr><td class="label">Área (cm²)</td>{{#each specimens}}<td class="num">{{fixed areaCm2 2}}</td>{{/each}}{{#times emptyColumns}}<td class="empty"></td>{{/times}}</tr>
    <tr><td class="label">Carga máxima (kgf)</td>{{#each specimens}}<td class="num">{{thousands maxLoadKgf}}</td>{{/each}}{{#times emptyColumns}}<td class="empty"></td>{{/times}}</tr>
    <tr><td class="label">Carga máxima (N)</td>{{#each specimens}}<td class="num">{{thousands maxLoadN}}</td>{{/each}}{{#times emptyColumns}}<td class="empty"></td>{{/times}}</tr>
    <tr><td class="label">Resistencia a la compresión (kg/cm²)</td>{{#each specimens}}<td class="num">{{stressKgCm2}}</td>{{/each}}{{#times emptyColumns}}<td class="empty"></td>{{/times}}</tr>
    <tr><td class="label">Promedio de resistencia (kg/cm²)</td>{{#each averages}}<td class="num" colspan="{{span}}">{{fixed stressKgCm2 1}}</td>{{/each}}{{#times emptyColumns}}<td class="empty"></td>{{/times}}</tr>
    <tr><td class="label">Resistencia a la compresión (MPa)</td>{{#each specimens}}<td class="num">{{fixed stressMPa 1}}</td>{{/each}}{{#times emptyColumns}}<td class="empty"></td>{{/times}}</tr>
    <tr><td class="label">Promedio de resistencia (MPa)</td>{{#each averages}}<td class="num" colspan="{{span}}">{{fixed stressMPa 1}}</td>{{/each}}{{#times emptyColumns}}<td class="empty"></td>{{/times}}</tr>
    <tr><td class="label">% de resistencia de proyecto</td>{{#each specimens}}<td class="num">{{fixed percentOfDesign 1}}</td>{{/each}}{{#times emptyColumns}}<td class="empty"></td>{{/times}}</tr>
    <tr><td class="label">Promedio de % de resistencia</td>{{#each averages}}<td class="num" colspan="{{span}}">{{fixed percentOfDesign 1}}</td>{{/each}}{{#times emptyColumns}}<td class="empty"></td>{{/times}}</tr>
    <tr><td class="label">Tipo de falla</td>{{#each specimens}}<td class="num">{{or failureType "-"}}</td>{{/each}}{{#times emptyColumns}}<td class="empty"></td>{{/times}}</tr>
  </table>

  <div class="notes">
    <p><b>Notas:</b> Muestreo según NMX-C-161-ONNCCE-2013; flujo de revenimiento en concreto autoconsolidable NMX-C-472-ONNCCE-2013; temperatura NMX-C-435-ONNCCE-2010; elaboración y curado de especímenes NMX-C-159-ONNCCE-2016; cabeceo NMX-C-109-ONNCCE-2013; ensayo a compresión NMX-C-083-ONNCCE-2014.</p>
    <p>El plan de muestreo atiende los requisitos del proyecto o del cliente. Las condiciones ambientales se registran en los registros de trabajo de cada ensayo. Este informe no puede reproducirse parcialmente sin autorización del laboratorio y solo ampara las muestras aquí descritas.</p>
    {{#if ../outsideAgeTolerance.length}}<p>* Especímenes {{join ../outsideAgeTolerance ", "}} ensayados fuera de la tolerancia de edad de NMX-C-083-ONNCCE-2014.</p>{{/if}}
  </div>

  <table><tr><td class="label">Observaciones</td><td class="obs">{{or ../fields.observations ""}}</td></tr></table>

  <div class="signs"><div>Jefe de laboratorio</div><div>Jefe de control de calidad</div></div>

  <footer><span>{{or ../lab.address ""}}{{#if ../lab.phone}} · Tel. {{../lab.phone}}{{/if}}</span><span>FPC06-04</span></footer>
</section>
{{/each}}
</body></html>`;

hb.registerHelper('gt', (a: unknown, b: unknown) => Number(a) > Number(b));

const template = hb.compile<ConcreteControlSnapshot>(SOURCE, { strict: false });

export function renderConcreteControlHtml(snapshot: ConcreteControlSnapshot): string {
  return template(snapshot);
}
