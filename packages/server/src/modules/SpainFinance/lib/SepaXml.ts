import { createHash } from 'crypto';

const esc = (value: unknown) => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

export const normalizeIban = (value: unknown) => String(value || '').replace(/\s+/g, '').toUpperCase();
export const normalizeBic = (value: unknown) => String(value || '').replace(/\s+/g, '').toUpperCase();

export function isValidIban(value: unknown) {
  const iban = normalizeIban(value);
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{10,30}$/.test(iban)) return false;
  const moved = `${iban.slice(4)}${iban.slice(0, 4)}`;
  const numeric = moved.replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  let remainder = 0;
  for (const digit of numeric) remainder = (remainder * 10 + Number(digit)) % 97;
  return remainder === 1;
}
export function isValidBic(value?: unknown) {
  if (!value) return true;
  return /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(normalizeBic(value));
}
export function isValidCreditorIdentifier(value?: unknown) {
  if (!value) return false;
  const id = String(value).replace(/\s+/g, '').toUpperCase();
  return /^[A-Z]{2}[0-9]{2}[A-Z0-9]{3}[A-Z0-9]{1,28}$/.test(id) && id.length <= 35;
}
export const sha256 = (value: string) => createHash('sha256').update(value, 'utf8').digest('hex');

const agent = (bic?: string) => bic ? `<FinInstnId><BICFI>${esc(normalizeBic(bic))}</BICFI></FinInstnId>` : '<FinInstnId><Othr><Id>NOTPROVIDED</Id></Othr></FinInstnId>';
const postal = (country?: string) => country ? `<PstlAdr><Ctry>${esc(country.toUpperCase())}</Ctry></PstlAdr>` : '';

export interface SepaBank {
  holder: string; iban: string; bic?: string; countryCode?: string; creditorIdentifier?: string;
}
export interface SepaEntry {
  counterpartyName: string; iban: string; bic?: string; countryCode?: string; amount: number;
  endToEndId: string; remittanceInformation?: string; mandateReference?: string; signatureDate?: string;
  sequenceType?: string;
}

export function buildPain001(input: { messageId: string; requestedDate: string; bank: SepaBank; entries: SepaEntry[]; createdAt?: Date }) {
  const created = (input.createdAt || new Date()).toISOString().replace(/\.\d{3}Z$/, '');
  const sum = input.entries.reduce((s, e) => s + Number(e.amount || 0), 0).toFixed(2);
  const txs = input.entries.map((e) => `<CdtTrfTxInf>
<PmtId><EndToEndId>${esc(e.endToEndId)}</EndToEndId></PmtId><Amt><InstdAmt Ccy="EUR">${Number(e.amount).toFixed(2)}</InstdAmt></Amt>
<CdtrAgt>${agent(e.bic)}</CdtrAgt><Cdtr><Nm>${esc(e.counterpartyName)}</Nm>${postal(e.countryCode)}</Cdtr>
<CdtrAcct><Id><IBAN>${esc(normalizeIban(e.iban))}</IBAN></Id></CdtrAcct>
<RmtInf><Ustrd>${esc(e.remittanceInformation || e.endToEndId)}</Ustrd></RmtInf></CdtTrfTxInf>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.09"><CstmrCdtTrfInitn>
<GrpHdr><MsgId>${esc(input.messageId)}</MsgId><CreDtTm>${created}</CreDtTm><NbOfTxs>${input.entries.length}</NbOfTxs><CtrlSum>${sum}</CtrlSum><InitgPty><Nm>${esc(input.bank.holder)}</Nm></InitgPty></GrpHdr>
<PmtInf><PmtInfId>${esc(`${input.messageId}-P1`)}</PmtInfId><PmtMtd>TRF</PmtMtd><BtchBookg>true</BtchBookg><NbOfTxs>${input.entries.length}</NbOfTxs><CtrlSum>${sum}</CtrlSum><PmtTpInf><SvcLvl><Cd>SEPA</Cd></SvcLvl></PmtTpInf><ReqdExctnDt><Dt>${esc(input.requestedDate)}</Dt></ReqdExctnDt>
<Dbtr><Nm>${esc(input.bank.holder)}</Nm>${postal(input.bank.countryCode)}</Dbtr><DbtrAcct><Id><IBAN>${esc(normalizeIban(input.bank.iban))}</IBAN></Id></DbtrAcct><DbtrAgt>${agent(input.bank.bic)}</DbtrAgt><ChrgBr>SLEV</ChrgBr>${txs}</PmtInf>
</CstmrCdtTrfInitn></Document>`;
}

export function buildPain008(input: { messageId: string; requestedDate: string; scheme: 'CORE' | 'B2B'; bank: SepaBank; entries: SepaEntry[]; createdAt?: Date }) {
  if (!input.bank.creditorIdentifier) throw new Error('La cuenta ordenante no tiene identificador de acreedor SEPA.');
  const created = (input.createdAt || new Date()).toISOString().replace(/\.\d{3}Z$/, '');
  const sum = input.entries.reduce((s, e) => s + Number(e.amount || 0), 0).toFixed(2);
  const bySeq = new Map<string, SepaEntry[]>();
  for (const entry of input.entries) {
    const seq = entry.sequenceType || 'RCUR';
    bySeq.set(seq, [...(bySeq.get(seq) || []), entry]);
  }
  let paymentBlocks = '';
  let blockIndex = 0;
  for (const [seq, entries] of bySeq.entries()) {
    blockIndex += 1;
    const blockSum = entries.reduce((s, e) => s + Number(e.amount || 0), 0).toFixed(2);
    const txs = entries.map((e) => {
      if (!e.mandateReference || !e.signatureDate) throw new Error(`Falta mandato SEPA para ${e.counterpartyName}.`);
      return `<DrctDbtTxInf><PmtId><EndToEndId>${esc(e.endToEndId)}</EndToEndId></PmtId><InstdAmt Ccy="EUR">${Number(e.amount).toFixed(2)}</InstdAmt>
<DrctDbtTx><MndtRltdInf><MndtId>${esc(e.mandateReference)}</MndtId><DtOfSgntr>${esc(e.signatureDate)}</DtOfSgntr></MndtRltdInf></DrctDbtTx>
<DbtrAgt>${agent(e.bic)}</DbtrAgt><Dbtr><Nm>${esc(e.counterpartyName)}</Nm>${postal(e.countryCode)}</Dbtr><DbtrAcct><Id><IBAN>${esc(normalizeIban(e.iban))}</IBAN></Id></DbtrAcct>
<RmtInf><Ustrd>${esc(e.remittanceInformation || e.endToEndId)}</Ustrd></RmtInf></DrctDbtTxInf>`;
    }).join('');
    paymentBlocks += `<PmtInf><PmtInfId>${esc(`${input.messageId}-P${blockIndex}`)}</PmtInfId><PmtMtd>DD</PmtMtd><BtchBookg>true</BtchBookg><NbOfTxs>${entries.length}</NbOfTxs><CtrlSum>${blockSum}</CtrlSum>
<PmtTpInf><SvcLvl><Cd>SEPA</Cd></SvcLvl><LclInstrm><Cd>${input.scheme}</Cd></LclInstrm><SeqTp>${esc(seq)}</SeqTp></PmtTpInf><ReqdColltnDt>${esc(input.requestedDate)}</ReqdColltnDt>
<Cdtr><Nm>${esc(input.bank.holder)}</Nm>${postal(input.bank.countryCode)}</Cdtr><CdtrAcct><Id><IBAN>${esc(normalizeIban(input.bank.iban))}</IBAN></Id></CdtrAcct><CdtrAgt>${agent(input.bank.bic)}</CdtrAgt><ChrgBr>SLEV</ChrgBr>
<CdtrSchmeId><Id><PrvtId><Othr><Id>${esc(input.bank.creditorIdentifier)}</Id><SchmeNm><Prtry>SEPA</Prtry></SchmeNm></Othr></PrvtId></Id></CdtrSchmeId>${txs}</PmtInf>`;
  }
  return `<?xml version="1.0" encoding="UTF-8"?><Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.008.001.08"><CstmrDrctDbtInitn>
<GrpHdr><MsgId>${esc(input.messageId)}</MsgId><CreDtTm>${created}</CreDtTm><NbOfTxs>${input.entries.length}</NbOfTxs><CtrlSum>${sum}</CtrlSum><InitgPty><Nm>${esc(input.bank.holder)}</Nm></InitgPty></GrpHdr>${paymentBlocks}</CstmrDrctDbtInitn></Document>`;
}
