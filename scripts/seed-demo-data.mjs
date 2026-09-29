const API_BASE = process.env.API_BASE ?? 'http://localhost:3000';
const EMAIL = process.env.SEED_EMAIL ?? 'codex-login-1788019577@example.test';
const PASSWORD = process.env.SEED_PASSWORD ?? 'CodexTest123!';
const stamp = process.env.SEED_STAMP ?? new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);

async function request(path, { method = 'GET', body, auth } = {}) {
  const headers = { 'content-type': 'application/json' };
  if (auth) {
    headers.authorization = `Bearer ${auth.accessToken}`;
    headers['organization-id'] = auth.organizationId;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error(`${method} ${path} -> ${res.status} ${res.statusText}: ${text}`);
  }
  return data;
}

const unwrapList = (body, key) => {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.[key])) return body[key];
  if (Array.isArray(body?.data)) return body.data;
  return [];
};

const pickId = (body) =>
  body?.id ??
  body?.data?.id ??
  body?.customer?.id ??
  body?.vendor?.id ??
  body?.item?.id ??
  body?.saleInvoice?.id ??
  body?.bill?.id ??
  body?.expense?.id;

const money = (value) => Math.round(value * 100) / 100;

async function main() {
  const signin = await request('/api/auth/signin', {
    method: 'POST',
    body: { email: EMAIL, password: PASSWORD },
  });
  const auth = {
    accessToken: signin.access_token,
    organizationId: signin.organization_id,
  };

  const accounts = unwrapList(await request('/api/accounts', { auth }), 'accounts');
  const account = (name) => {
    const found = accounts.find((item) => item.name === name);
    if (!found) throw new Error(`No existe la cuenta contable requerida: ${name}`);
    return found;
  };

  const sellAccount = account('Sales of Product Income');
  const costAccount = account('Cost of Goods Sold');
  const inventoryAccount = account('Inventory Asset');
  const pettyCash = account('Petty Cash');
  const rent = account('Rent');
  const openingBalance = account('Opening Balance Equity');

  const created = {
    organizationId: auth.organizationId,
    customers: [],
    vendors: [],
    items: [],
    invoices: [],
    bills: [],
    expenses: [],
    inventoryAdjustments: [],
    paymentsReceived: [],
    billPayments: [],
    warnings: [],
  };

  const customers = [
    'Cliente Demo Norte SL',
    'Cliente Demo Sur SL',
    'Cliente Demo Online SL',
    'Cliente Demo Canarias SL',
    'Cliente Demo Servicios SA',
  ];
  for (const [index, displayName] of customers.entries()) {
    const payload = {
      customerType: 'business',
      displayName: `${displayName} ${stamp}`,
      currencyCode: 'EUR',
      fiscalCountry: 'ES',
      fiscalTerritory: index === 3 ? 'canary' : 'common',
      taxRegime: 'standard',
    };
    const response = await request('/api/customers', { method: 'POST', body: payload, auth });
    created.customers.push({ id: pickId(response), displayName: payload.displayName });
  }

  const vendors = [
    'Proveedor Demo Suministros SL',
    'Proveedor Demo Logistica SA',
    'Proveedor Demo Tecnologia SL',
    'Proveedor Demo Consultoria',
  ];
  for (const displayName of vendors) {
    const payload = {
      displayName: `${displayName} ${stamp}`,
      currencyCode: 'EUR',
      fiscalCountry: 'ES',
      fiscalTerritory: 'common',
      taxRegime: 'standard',
    };
    const response = await request('/api/vendors', { method: 'POST', body: payload, auth });
    created.vendors.push({ id: pickId(response), displayName: payload.displayName });
  }

  const items = [
    { name: 'Servicio Demo Consultoria', type: 'service', sellPrice: 95, costPrice: 35 },
    { name: 'Servicio Demo Soporte mensual', type: 'service', sellPrice: 180, costPrice: 70 },
    { name: 'Producto Demo Licencia anual', type: 'non-inventory', sellPrice: 420, costPrice: 140 },
    { name: 'Producto Demo Hardware', type: 'inventory', sellPrice: 650, costPrice: 390 },
    { name: 'Producto Demo Instalacion', type: 'non-inventory', sellPrice: 240, costPrice: 90 },
  ];
  for (const item of items) {
    const payload = {
      name: `${item.name} ${stamp}`,
      type: item.type,
      sellable: true,
      purchasable: true,
      sellPrice: item.sellPrice,
      costPrice: item.costPrice,
      sellAccountId: sellAccount.id,
      costAccountId: costAccount.id,
      ...(item.type === 'inventory' ? { inventoryAccountId: inventoryAccount.id } : {}),
    };
    const response = await request('/api/items', { method: 'POST', body: payload, auth });
    created.items.push({ id: pickId(response), name: payload.name, ...item });
  }

  const inventoryItem = created.items.find((item) => item.type === 'inventory');
  if (inventoryItem?.id) {
    const response = await request('/api/inventory-adjustments/quick', {
      method: 'POST',
      auth,
      body: {
        date: '2026-08-29',
        type: 'increment',
        adjustmentAccountId: openingBalance.id,
        reason: `Stock inicial demo ${stamp}`,
        itemId: inventoryItem.id,
        quantity: 25,
        cost: inventoryItem.costPrice,
        publish: true,
      },
    });
    created.inventoryAdjustments.push({ id: pickId(response), itemId: inventoryItem.id, quantity: 25 });
  }

  const invoiceLines = [
    { customer: 0, item: 0, rate: 95, quantity: 8, date: '2026-08-01' },
    { customer: 1, item: 2, rate: 420, quantity: 2, date: '2026-08-04' },
    { customer: 2, item: 1, rate: 180, quantity: 3, date: '2026-08-10' },
    { customer: 3, item: 4, rate: 240, quantity: 4, date: '2026-08-15' },
    { customer: 4, item: 3, rate: 650, quantity: 2, date: '2026-08-20' },
  ];
  for (const [index, invoice] of invoiceLines.entries()) {
    const response = await request('/api/sale-invoices', {
      method: 'POST',
      auth,
      body: {
        customerId: created.customers[invoice.customer].id,
        invoiceDate: invoice.date,
        dueDate: '2026-09-15',
        delivered: true,
        referenceNo: `DEMO-VTA-${stamp}-${index + 1}`,
        entries: [
          {
            index: 1,
            itemId: created.items[invoice.item].id,
            rate: invoice.rate,
            quantity: invoice.quantity,
            description: `Venta demo ${stamp}`,
          },
        ],
      },
    });
    created.invoices.push({
      id: pickId(response),
      customerId: created.customers[invoice.customer].id,
      total: money(invoice.rate * invoice.quantity),
    });
  }

  const billLines = [
    { vendor: 0, item: 3, rate: 390, quantity: 5, date: '2026-08-03' },
    { vendor: 1, item: 4, rate: 90, quantity: 6, date: '2026-08-08' },
    { vendor: 2, item: 2, rate: 140, quantity: 4, date: '2026-08-18' },
    { vendor: 3, item: 0, rate: 35, quantity: 10, date: '2026-08-23' },
  ];
  for (const [index, bill] of billLines.entries()) {
    const response = await request('/api/bills', {
      method: 'POST',
      auth,
      body: {
        vendorId: created.vendors[bill.vendor].id,
        billDate: bill.date,
        dueDate: '2026-09-20',
        billNumber: `DEMO-COMP-${stamp}-${index + 1}`,
        referenceNo: `DEMO-COMP-REF-${stamp}-${index + 1}`,
        exchangeRate: 1,
        open: true,
        entries: [
          {
            index: 1,
            itemId: created.items[bill.item].id,
            rate: bill.rate,
            quantity: bill.quantity,
            description: `Compra demo ${stamp}`,
          },
        ],
      },
    });
    created.bills.push({
      id: pickId(response),
      vendorId: created.vendors[bill.vendor].id,
      total: money(bill.rate * bill.quantity),
    });
  }

  const expenses = [
    { referenceNo: `DEMO-GASTO-${stamp}-1`, amount: 325, date: '2026-08-05', description: 'Alquiler oficina demo' },
    { referenceNo: `DEMO-GASTO-${stamp}-2`, amount: 88.5, date: '2026-08-12', description: 'Material oficina demo' },
    { referenceNo: `DEMO-GASTO-${stamp}-3`, amount: 149.9, date: '2026-08-25', description: 'Servicios externos demo' },
  ];
  for (const expense of expenses) {
    const response = await request('/api/expenses', {
      method: 'POST',
      auth,
      body: {
        referenceNo: expense.referenceNo,
        paymentDate: expense.date,
        paymentAccountId: pettyCash.id,
        description: expense.description,
        publish: true,
        categories: [
          {
            index: 1,
            expenseAccountId: rent.id,
            amount: expense.amount,
          },
        ],
      },
    });
    created.expenses.push({ id: pickId(response), referenceNo: expense.referenceNo, amount: expense.amount });
  }

  const firstInvoice = created.invoices[0];
  if (firstInvoice?.id) {
    try {
      const response = await request('/api/payments-received', {
        method: 'POST',
        auth,
        body: {
          customerId: firstInvoice.customerId,
          paymentDate: '2026-08-28',
          amount: firstInvoice.total,
          exchangeRate: 1,
          depositAccountId: pettyCash.id,
          referenceNo: `DEMO-COBRO-${stamp}-1`,
          aeatPaymentMethod: '01',
          aeatPaymentReference: `DEMO-TRF-${stamp}-1`,
          entries: [{ invoiceId: firstInvoice.id, paymentAmount: firstInvoice.total }],
        },
      });
      created.paymentsReceived.push({ id: pickId(response), invoiceId: firstInvoice.id, amount: firstInvoice.total });
    } catch (error) {
      created.warnings.push(`No se pudo crear el cobro demo: ${error.message}`);
    }
  }

  const firstBill = created.bills[0];
  if (firstBill?.id) {
    try {
      const response = await request('/api/bill-payments', {
        method: 'POST',
        auth,
        body: {
          vendorId: firstBill.vendorId,
          paymentDate: '2026-08-29',
          amount: firstBill.total,
          exchangeRate: 1,
          paymentAccountId: pettyCash.id,
          paymentNumber: `DEMO-PAGO-${stamp}-1`,
          aeatPaymentMethod: '01',
          aeatPaymentReference: `DEMO-TRF-P-${stamp}-1`,
          entries: [{ billId: firstBill.id, paymentAmount: firstBill.total }],
        },
      });
      created.billPayments.push({ id: pickId(response), billId: firstBill.id, amount: firstBill.total });
    } catch (error) {
      created.warnings.push(`No se pudo crear el pago demo: ${error.message}`);
    }
  }

  console.log(JSON.stringify(created, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
