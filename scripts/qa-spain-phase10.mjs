import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const json = (p) => JSON.parse(read(p));
const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

const en = json('packages/webapp/src/lang/en/index.json');
const es = json('packages/webapp/src/lang/es/index.json');
const missingEs = Object.keys(en).filter((key) => !(key in es));
check(missingEs.length === 0, `Faltan ${missingEs.length} claves ES: ${missingEs.slice(0, 10).join(', ')}`);

for (const file of [
  'packages/webapp/src/containers/Setup/SetupOrganizationPage.tsx',
  'packages/webapp/src/ee/workspaces/containers/CreateWorkspaceDrawer/CreateWorkspaceForm.tsx',
]) {
  const source = read(file);
  for (const expected of [
    "location: 'ES'",
    "baseCurrency: 'EUR'",
    "language: 'es'",
    "fiscalYear: 'january'",
    "timezone: 'Europe/Madrid'",
  ]) {
    check(source.includes(expected), `${file}: falta valor por defecto ${expected}`);
  }
}

const fiscalYears = read('packages/webapp/src/constants/fiscalYearOptions.tsx');
check(
  fiscalYears.includes("`${intl.get('october')} - ${intl.get('september')}`"),
  'El ejercicio iniciado en octubre no termina en septiembre.',
);
check(
  !fiscalYears.includes("`${intl.get('october')} - ${intl.get('november')}`"),
  'Persiste el antiguo error Octubre-Noviembre.',
);

const fiscalUiFiles = [
  'packages/webapp/src/containers/TaxRates/dialogs/TaxRateFormDialog/TaxRateFormDialogFormContent.tsx',
  'packages/webapp/src/containers/Customers/CustomerForm/CustomerFiscalSection.tsx',
  'packages/webapp/src/containers/Vendors/VendorForm/VendorFiscalSection.tsx',
];
const enumFields = [
  'taxTerritory', 'fiscalRegime', 'spanishOperationType', 'ossScheme',
  'aeatTaxCode', 'aeatRegimeKey', 'aeatOperationQualification',
  'aeatExemptionCause', 'fiscalTerritory', 'taxRegime', 'aeatIdType',
  'electronicInvoiceChannel',
];
for (const file of fiscalUiFiles) {
  const source = read(file);
  for (const field of enumFields) {
    check(
      !new RegExp(`<FInputGroup\\s+name=\\{['\"]${field}['\"]\\}`).test(source),
      `${file}: ${field} sigue siendo campo de texto libre.`,
    );
  }
}

const options = read('packages/webapp/src/constants/spainFiscalOptions.ts');
const dto = read('packages/server/src/modules/TaxRates/dtos/TaxRate.dto.ts');
const operationValues = [
  'domestic', 'intra_community_goods_supply', 'intra_community_goods_acquisition',
  'intra_community_service_supply', 'intra_community_service_acquisition',
  'export', 'import', 'domestic_reverse_charge', 'oss', 'ioss', 'igic_ipsi', 'other',
];
for (const value of operationValues) {
  check(options.includes(`key: '${value}'`), `Falta opción UI para spanishOperationType=${value}`);
  check(dto.includes(`'${value}'`), `El servidor no admite spanishOperationType=${value}`);
}
check(!options.includes('intra_community_services_supply'), 'Persiste valor UI incorrecto services_supply.');

const visibleSources = [
  read('packages/webapp/src/routes/dashboard.tsx'),
  read('packages/webapp/src/constants/sidebarMenu.tsx'),
  read('packages/webapp/src/constants/preferencesMenu.tsx'),
].join('\n');
for (const text of [
  'Accounts Import', 'Manual Journals Import', 'Items Import', 'Invoices Import',
  'Bills Import', 'Vendor Credits Import', 'Bank Transactions Import',
  "text: 'Tax Rates'", "text: 'Rules'", "text: 'API Keys'",
]) {
  check(!visibleSources.includes(text), `Texto visible pendiente en inglés: ${text}`);
}

const taxRateUi = [
  'packages/webapp/src/containers/TaxRates/containers/TaxRatesLandingActionsBar.tsx',
  'packages/webapp/src/containers/TaxRates/containers/TaxRatesLandingEmptyState.tsx',
  'packages/webapp/src/containers/TaxRates/containers/_components.tsx',
  'packages/webapp/src/containers/TaxRates/containers/_utils.tsx',
  'packages/webapp/src/containers/TaxRates/containers/TaxRatesLandingTable.tsx',
  'packages/webapp/src/containers/TaxRates/alerts/TaxRateDeleteAlert.tsx',
  'packages/webapp/src/containers/TaxRates/drawers/TaxRateDetailsDrawer/TaxRateDetailsContentActionsBar.tsx',
  'packages/webapp/src/containers/TaxRates/drawers/TaxRateDetailsDrawer/TaxRateDetailsContentDetails.tsx',
  'packages/webapp/src/containers/TaxRates/dialogs/TaxRateFormDialog/TaxRateFormDialog.tsx',
  'packages/webapp/src/containers/TaxRates/dialogs/TaxRateFormDialog/TaxRateFormDialogForm.tsx',
  'packages/webapp/src/containers/TaxRates/dialogs/TaxRateFormDialog/TaxRateFormDialogFormFooter.tsx',
].map(read).join('\n');
for (const text of [
  'New Tax Rate', 'New tax rate', 'Edit Tax Rate', 'Create Tax Rate',
  'Activate Tax Rate', 'Inactivate Tax Rate', 'Delete Tax Rate',
  'Tax Rate Name', 'Non Recoverable', 'The tax rate has been',
  'Something went wrong.', 'Setup the organization taxes',
]) {
  check(!taxRateUi.includes(text), `Tipos impositivos: texto visible pendiente en inglés: ${text}`);
}

const routes = read('packages/webapp/src/routes/dashboard.tsx');
for (const route of ['/verifactu', '/electronic-invoicing', '/spain-fiscal', '/sii', '/spain-finance']) {
  check(routes.includes(`path: \`${route}\``) || routes.includes(`path: '${route}'`), `Falta ruta ${route}`);
}

const migrationDir = path.join(root, 'packages/server/src/database/tenant/migrations');
const migrations = fs.readdirSync(migrationDir).filter((name) => /^20260829\d+_.*\.(ts|js)$/.test(name));
const prefixes = new Map();
for (const name of migrations) {
  const prefix = name.split('_')[0];
  prefixes.set(prefix, [...(prefixes.get(prefix) ?? []), name]);
}
for (const [prefix, names] of prefixes) {
  check(names.length === 1, `Prefijo de migración duplicado ${prefix}: ${names.join(', ')}`);
}

const e2e = read('e2e/spain-phase10.spec.ts');
for (const token of [
  'createDeliveredInvoiceViaApi', 'createPaymentReceivedViaApi',
  'createOpenedBillViaApi', 'createBillPaymentViaApi',
  '/spain/fiscal/vat-books', '/spain/fiscal/model-303-preview',
  '/spain/finance/pgc/trial-balance',
]) {
  check(e2e.includes(token), `El E2E Fase 10 no cubre ${token}`);
}

if (failures.length) {
  console.error(`QA España Fase 10: FAIL (${failures.length})`);
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('QA España Fase 10: PASS');
console.log(` - Claves EN: ${Object.keys(en).length}`);
console.log(` - Claves ES: ${Object.keys(es).length}`);
console.log(` - Faltantes ES: ${missingEs.length}`);
console.log(` - Migraciones españolas 20260829 verificadas: ${migrations.length}`);
console.log(' - Defaults España, selects AEAT, rutas y E2E: OK');
