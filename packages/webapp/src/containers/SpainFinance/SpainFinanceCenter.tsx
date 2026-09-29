import React from 'react';
import {
  Button,
  Callout,
  Card,
  Checkbox,
  Dialog,
  FormGroup,
  HTMLSelect,
  HTMLTable,
  InputGroup,
  Intent,
  NumericInput,
  Spinner,
  Tag,
} from '@blueprintjs/core';
import styled from 'styled-components';
import { AppToaster, DashboardPageContent } from '@/components';
import {
  useCreateSepaMandate,
  useCreateSepaRemittance,
  useGenerateSepaRemittance,
  useInitializePgc,
  useMarkSepaExported,
  usePgcCatalog,
  usePgcDiagnostics,
  usePgcReport,
  useSepaMandates,
  useSepaRemittance,
  useSepaRemittances,
  useSpainBankAccounts,
  useSpainFinanceConfig,
  useSpainFinanceContacts,
  useSpainTerritorySummary,
  useUpdateSpainBankAccount,
  useUpdateSpainFinanceConfig,
} from '@/hooks/query/spain-finance';

const now = new Date();
const yyyy = now.getFullYear();
const defaultFrom = `${yyyy}-01-01`;
const defaultTo = `${yyyy}-12-31`;
const today = now.toISOString().slice(0,10);
const money = (v:any) => new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(Number(v||0));

export function SpainFinanceCenter(){
  const [tab,setTab]=React.useState<'pgc'|'sepa'|'territory'>('pgc');
  return <DashboardPageContent><Page>
    <Header><div><h2>Finanzas España</h2><p>PGC/PGC-PYMES, estados contables, SEPA, remesas y fiscalidad territorial.</p></div></Header>
    <Tabs><Button active={tab==='pgc'} onClick={()=>setTab('pgc')}>Contabilidad PGC</Button><Button active={tab==='sepa'} onClick={()=>setTab('sepa')}>SEPA y remesas</Button><Button active={tab==='territory'} onClick={()=>setTab('territory')}>Canarias / Ceuta / Melilla</Button></Tabs>
    {tab==='pgc'?<PgcPanel/>:tab==='sepa'?<SepaPanel/>:<TerritoryPanel/>}
  </Page></DashboardPageContent>;
}

function PgcPanel(){
  const [fromDate,setFromDate]=React.useState(defaultFrom); const [toDate,setToDate]=React.useState(defaultTo);
  const [report,setReport]=React.useState<'balance'|'profit-loss'|'trial-balance'>('balance');
  const {data:config}=useSpainFinanceConfig(); const updateConfig=useUpdateSpainFinanceConfig();
  const {data:diag,refetch:refetchDiag}=usePgcDiagnostics(); const {data:catalog}=usePgcCatalog(); const init=useInitializePgc();
  const {data,isLoading,refetch}=usePgcReport(report,{fromDate,toDate});
  const setStandard=async(value:string)=>{try{await updateConfig.mutateAsync({accountingStandard:value});AppToaster.show({message:'Norma contable guardada.',intent:Intent.SUCCESS});}catch(e:any){AppToaster.show({message:e?.message||'No se pudo guardar.',intent:Intent.DANGER});}};
  const initialize=async()=>{try{const r:any=await init.mutateAsync();await refetchDiag();AppToaster.show({message:`Plan ${r.standard==='pgc'?'PGC':'PGC-PYMES'} preparado: ${r.created} cuentas creadas, ${r.updated} mapeadas.`,intent:Intent.SUCCESS});}catch(e:any){AppToaster.show({message:e?.message||'No se pudo inicializar el plan.',intent:Intent.DANGER});}};
  return <Section>
    <Card><Grid>
      <FormGroup label="Norma contable"><HTMLSelect value={config?.accountingStandard||'pymes'} onChange={e=>setStandard(e.target.value)}><option value="pymes">PGC-PYMES</option><option value="pgc">Plan General de Contabilidad</option></HTMLSelect></FormGroup>
      <InfoBox><small>Catálogo operativo</small><b>{catalog?.length||0} cuentas</b></InfoBox>
      <InfoBox><small>Cuentas sin mapear</small><b>{diag?.unmapped?.length??'—'}</b></InfoBox>
      <InfoBox><small>Diagnóstico</small><b>{diag?.ready?'Correcto':'Revisión necesaria'}</b></InfoBox>
      <Button intent={Intent.PRIMARY} icon="database" loading={init.isPending} onClick={initialize}>Inicializar / mapear plan</Button>
    </Grid></Card>
    {!diag?.ready&&diag?<Callout intent={Intent.WARNING} title="Mapeo contable incompleto">Hay {diag.unmapped?.length||0} cuentas sin clasificación PGC, {diag.invalidCodes?.length||0} códigos no numéricos y {diag.duplicateCodes?.length||0} códigos duplicados. La inicialización sólo completa cuentas conocidas; las cuentas personalizadas deben mapearse manualmente.</Callout>:null}
    <Card><Filters><FormGroup label="Desde"><input type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)}/></FormGroup><FormGroup label="Hasta / fecha balance"><input type="date" value={toDate} onChange={e=>setToDate(e.target.value)}/></FormGroup><Button icon="refresh" onClick={()=>refetch()}>Actualizar</Button></Filters></Card>
    <Tabs><Button active={report==='balance'} onClick={()=>setReport('balance')}>Balance de situación</Button><Button active={report==='profit-loss'} onClick={()=>setReport('profit-loss')}>Pérdidas y ganancias</Button><Button active={report==='trial-balance'} onClick={()=>setReport('trial-balance')}>Sumas y saldos</Button></Tabs>
    {isLoading?<Spinner/>:<PgcReport report={report} data={data}/>} 
  </Section>;
}
function PgcReport({report,data}:{report:string;data:any}){
  if(!data)return <Callout>No hay datos.</Callout>;
  if(report==='trial-balance')return <Card><h3>Balance de sumas y saldos <Tag intent={data.balanced?Intent.SUCCESS:Intent.WARNING}>{data.balanced?'Cuadra':'Revisar'}</Tag></h3><TableWrap><HTMLTable striped condensed><thead><tr><th>Cuenta</th><th>Nombre</th><th>Saldo inicial D</th><th>Saldo inicial H</th><th>Debe</th><th>Haber</th><th>Saldo final D</th><th>Saldo final H</th></tr></thead><tbody>{(data.rows||[]).map((r:any)=><tr key={r.id}><td>{r.code}</td><td>{r.name}</td><td>{money(r.openingDebit)}</td><td>{money(r.openingCredit)}</td><td>{money(r.debit)}</td><td>{money(r.credit)}</td><td>{money(r.closingDebit)}</td><td>{money(r.closingCredit)}</td></tr>)}</tbody><tfoot><tr><th colSpan={2}>Totales</th><th>{money(data.totals?.openingDebit)}</th><th>{money(data.totals?.openingCredit)}</th><th>{money(data.totals?.debit)}</th><th>{money(data.totals?.credit)}</th><th>{money(data.totals?.closingDebit)}</th><th>{money(data.totals?.closingCredit)}</th></tr></tfoot></HTMLTable></TableWrap></Card>;
  if(report==='profit-loss')return <Card><h3>Cuenta de pérdidas y ganancias</h3><Summary><InfoBox><small>Ingresos</small><b>{money(data.totals?.income)}</b></InfoBox><InfoBox><small>Gastos</small><b>{money(data.totals?.expenses)}</b></InfoBox><InfoBox><small>Resultado</small><b>{money(data.totals?.result)}</b></InfoBox></Summary><SectionTotals sections={data.sections}/><AccountRows rows={data.rows}/></Card>;
  return <Card><h3>Balance de situación</h3><Summary><InfoBox><small>Activo</small><b>{money(data.totals?.assets)}</b></InfoBox><InfoBox><small>Patrimonio neto + Pasivo</small><b>{money(data.totals?.equityAndLiabilities)}</b></InfoBox><InfoBox><small>Diferencia</small><b>{money(data.totals?.difference)}</b></InfoBox></Summary>{data.totals?.difference!==0?<Callout intent={Intent.WARNING}>{data.note}</Callout>:null}<SectionTotals sections={data.sections}/><AccountRows rows={data.rows}/></Card>;
}
function SectionTotals({sections={}}:{sections:any}){return <Summary>{Object.entries(sections).map(([k,v])=><InfoBox key={k}><small>{k.replace(/_/g,' ')}</small><b>{money(v)}</b></InfoBox>)}</Summary>}
function AccountRows({rows=[]}:{rows:any[]}){return <TableWrap><HTMLTable striped condensed><thead><tr><th>Cuenta</th><th>Nombre</th><th>Sección</th><th>Debe</th><th>Haber</th><th>Saldo</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td>{r.code}</td><td>{r.name}</td><td>{r.pgcSection}</td><td>{money(r.debit)}</td><td>{money(r.credit)}</td><td>{money(r.amount)}</td></tr>)}</tbody></HTMLTable></TableWrap>}

function SepaPanel(){
  const {data:config}=useSpainFinanceConfig(); const {data:banks,isLoading:loadingBanks}=useSpainBankAccounts();
  const {data:contacts}=useSpainFinanceContacts(); const {data:mandates}=useSepaMandates(); const {data:remittances,refetch}=useSepaRemittances();
  const updateBank=useUpdateSpainBankAccount(); const createMandate=useCreateSepaMandate(); const createRemittance=useCreateSepaRemittance(); const generate=useGenerateSepaRemittance();
  const [selected,setSelected]=React.useState<number|undefined>(); const detail=useSepaRemittance(selected);
  const [mandate,setMandate]=React.useState<any>({contactId:'',mandateReference:'',scheme:'CORE',signatureFecha:today,debtorName:'',debtorIban:'',debtorBic:'',debtorCountryCode:'ES'});
  const [remit,setRemit]=React.useState<any>({remittanceType:'SDD',scheme:'CORE',accountId:'',requestedFecha:today,contactId:'',amount:0,concept:''});
  const saveBank=async(bank:any)=>{try{await updateBank.mutateAsync({id:bank.id,body:bank});AppToaster.show({message:'Cuenta bancaria SEPA guardada.',intent:Intent.SUCCESS});}catch(e:any){AppToaster.show({message:e?.message||'No se pudo guardar.',intent:Intent.DANGER});}};
  const submitMandate=async()=>{try{await createMandate.mutateAsync({...mandate,contactId:Number(mandate.contactId)});setMandate({...mandate,mandateReference:'',debtorIban:'',debtorBic:''});AppToaster.show({message:'Mandato SEPA creado.',intent:Intent.SUCCESS});}catch(e:any){AppToaster.show({message:e?.message||'No se pudo crear el mandato.',intent:Intent.DANGER});}};
  const submitRemittance=async()=>{try{const c=(contacts||[]).find((x:any)=>Number(x.id)===Number(remit.contactId));const m=(mandates||[]).find((x:any)=>Number(x.contactId)===Number(remit.contactId)&&x.status==='active'&&(remit.remittanceType!=='SDD'||x.scheme===remit.scheme));if(!c)throw new Error('Seleccione un tercero.');if(remit.remittanceType==='SDD'&&!m)throw new Error('El tercero no tiene un mandato activo compatible.');const r:any=await createRemittance.mutateAsync({remittanceType:remit.remittanceType,scheme:remit.remittanceType==='SDD'?remit.scheme:undefined,accountId:Number(remit.accountId),requestedFecha:remit.requestedDate,entries:[{contactId:Number(c.id),mandateId:m?.id,counterpartyName:c.sepaAccountHolder||c.displayName,iban:m?.debtorIban||c.sepaIban||'',bic:m?.debtorBic||c.sepaBic||'',countryCode:c.billingAddressCountry||'ES',amount:Number(remit.amount),remittanceInformation:remit.concept||'Remesa FaroCapital'}]});setSelected(r.id);AppToaster.show({message:'Remesa creada en borrador.',intent:Intent.SUCCESS});}catch(e:any){AppToaster.show({message:e?.message||'No se pudo crear.',intent:Intent.DANGER});}};
  const doGenerate=async(id:number)=>{try{await generate.mutateAsync(id);await refetch();setSelected(id);AppToaster.show({message:'XML SEPA generado y sellado con SHA-256.',intent:Intent.SUCCESS});}catch(e:any){AppToaster.show({message:e?.message||'No se pudo generar.',intent:Intent.DANGER});}};
  return <Section>
    <Callout intent={Intent.PRIMARY} title="Esquemas SEPA vigentes">Transferencias: {config?.sepaCreditTransferSchema||'pain.001.001.09'} · Adeudos: {config?.sepaDirectDebitSchema||'pain.008.001.08'}. FaroCapital utiliza dirección estructurada cuando hay datos disponibles y evita depender del formato no estructurado antes del corte del {config?.structuredAddressRequiredFrom||'2026-11-15'}.</Callout>
    <Card><h3>Cuentas bancarias</h3>{loadingBanks?<Spinner/>:<BankAccounts banks={banks||[]} onSave={saveBank}/>}</Card>
    <Grid2>
      <Card><h3>Nuevo mandato SDD</h3><FormGroup label="Cliente"><HTMLSelect fill value={mandate.contactId} onChange={e=>{const id=e.target.value;const c=(contacts||[]).find((x:any)=>String(x.id)===id);setMandate({...mandate,contactId:id,debtorName:c?.displayName||'',debtorIban:c?.sepaIban||'',debtorBic:c?.sepaBic||''})}}><option value="">Seleccione…</option>{(contacts||[]).map((c:any)=><option key={c.id} value={c.id}>{c.displayName}</option>)}</HTMLSelect></FormGroup><FormGroup label="Referencia única"><InputGroup value={mandate.mandateReference} onChange={e=>setMandate({...mandate,mandateReference:e.target.value})}/></FormGroup><Grid><FormGroup label="Esquema"><HTMLSelect value={mandate.scheme} onChange={e=>setMandate({...mandate,scheme:e.target.value})}><option>CORE</option><option>B2B</option></HTMLSelect></FormGroup><FormGroup label="Fecha firma"><input type="date" value={mandate.signatureDate} onChange={e=>setMandate({...mandate,signatureFecha:e.target.value})}/></FormGroup></Grid><FormGroup label="Titular"><InputGroup value={mandate.debtorName} onChange={e=>setMandate({...mandate,debtorName:e.target.value})}/></FormGroup><FormGroup label="IBAN"><InputGroup value={mandate.debtorIban} onChange={e=>setMandate({...mandate,debtorIban:e.target.value})}/></FormGroup><FormGroup label="BIC"><InputGroup value={mandate.debtorBic} onChange={e=>setMandate({...mandate,debtorBic:e.target.value})}/></FormGroup><Button intent={Intent.PRIMARY} loading={createMandate.isPending} onClick={submitMandate}>Crear mandato</Button></Card>
      <Card><h3>Nueva remesa</h3><Grid><FormGroup label="Tipo"><HTMLSelect value={remit.remittanceType} onChange={e=>setRemit({...remit,remittanceType:e.target.value})}><option value="SDD">Adeudo directo SDD</option><option value="SCT">Transferencia SCT</option></HTMLSelect></FormGroup>{remit.remittanceType==='SDD'?<FormGroup label="Esquema"><HTMLSelect value={remit.scheme} onChange={e=>setRemit({...remit,scheme:e.target.value})}><option>CORE</option><option>B2B</option></HTMLSelect></FormGroup>:null}</Grid><FormGroup label="Cuenta ordenante"><HTMLSelect fill value={remit.accountId} onChange={e=>setRemit({...remit,accountId:e.target.value})}><option value="">Seleccione…</option>{(banks||[]).filter((b:any)=>b.sepaEnabled).map((b:any)=><option key={b.id} value={b.id}>{b.name} · {b.iban}</option>)}</HTMLSelect></FormGroup><FormGroup label={remit.remittanceType==='SDD'?'Cliente / deudor':'Proveedor / beneficiario'}><HTMLSelect fill value={remit.contactId} onChange={e=>setRemit({...remit,contactId:e.target.value})}><option value="">Seleccione…</option>{(contacts||[]).map((c:any)=><option key={c.id} value={c.id}>{c.displayName}</option>)}</HTMLSelect></FormGroup><Grid><FormGroup label="Fecha solicitada"><input type="date" value={remit.requestedDate} onChange={e=>setRemit({...remit,requestedFecha:e.target.value})}/></FormGroup><FormGroup label="Importe"><NumericInput min={0.01} value={remit.amount} onValueChange={v=>setRemit({...remit,amount:v})}/></FormGroup></Grid><FormGroup label="Concepto"><InputGroup value={remit.concept} onChange={e=>setRemit({...remit,concept:e.target.value})}/></FormGroup><Button intent={Intent.PRIMARY} loading={createRemittance.isPending} onClick={submitRemittance}>Crear borrador</Button></Card>
    </Grid2>
    <Card><h3>Mandatos</h3><TableWrap><HTMLTable striped condensed><thead><tr><th>Referencia</th><th>Tercero</th><th>Esquema</th><th>Firma</th><th>Estado</th><th>IBAN</th></tr></thead><tbody>{(mandates||[]).map((m:any)=><tr key={m.id}><td>{m.mandateReference}</td><td>{m.contactName}</td><td>{m.scheme}</td><td>{String(m.signatureDate||'').slice(0,10)}</td><td>{m.status}</td><td>{m.debtorIban}</td></tr>)}</tbody></HTMLTable></TableWrap></Card>
    <Card><h3>Remesas</h3><TableWrap><HTMLTable striped condensed><thead><tr><th>Mensaje</th><th>Tipo</th><th>Esquema</th><th>Fecha</th><th>Operaciones</th><th>Total</th><th>Estado</th><th>SHA-256</th><th></th></tr></thead><tbody>{(remittances||[]).map((r:any)=><tr key={r.id}><td><Button minimal onClick={()=>setSelected(r.id)}>{r.messageId}</Button></td><td>{r.remittanceType}</td><td>{r.scheme||'—'}</td><td>{String(r.requestedDate||'').slice(0,10)}</td><td>{r.transactionCount}</td><td>{money(r.controlSum)}</td><td><Tag>{r.status}</Tag></td><td><Mono>{r.xmlSha256?String(r.xmlSha256).slice(0,16)+'…':'—'}</Mono></td><td>{r.status==='draft'?<Button small icon="build" onClick={()=>doGenerate(r.id)}>Generar XML</Button>:<Button small icon="eye-open" onClick={()=>setSelected(r.id)}>Ver XML</Button>}</td></tr>)}</tbody></HTMLTable></TableWrap></Card>
    <RemittanceDialog id={selected} onClose={()=>setSelected(undefined)} />
  </Section>;
}
function BankAccounts({banks,onSave}:{banks:any[];onSave:(b:any)=>void}){const [drafts,setDrafts]=React.useState<Record<number,any>>({});const d=(b:any)=>({...b,...drafts[b.id]});const set=(id:number,k:string,v:any)=>setDrafts(x=>({...x,[id]:{...(x[id]||{}),[k]:v}}));return <TableWrap><HTMLTable striped condensed><thead><tr><th>Cuenta</th><th>IBAN</th><th>BIC</th><th>Titular</th><th>ID acreedor SDD</th><th>SEPA</th><th></th></tr></thead><tbody>{banks.map(b=>{const x=d(b);return <tr key={b.id}><td>{b.code} · {b.name}</td><td><InputGroup value={x.iban||''} onChange={e=>set(b.id,'iban',e.target.value)}/></td><td><InputGroup value={x.bic||''} onChange={e=>set(b.id,'bic',e.target.value)}/></td><td><InputGroup value={x.bankAccountHolder||''} onChange={e=>set(b.id,'bankAccountHolder',e.target.value)}/></td><td><InputGroup value={x.sepaCreditorIdentifier||''} onChange={e=>set(b.id,'sepaCreditorIdentifier',e.target.value)}/></td><td><Checkbox checked={Boolean(x.sepaEnabled)} onChange={e=>set(b.id,'sepaEnabled',(e.target as HTMLInputElement).checked)}/></td><td><Button small onClick={()=>onSave(x)}>Guardar</Button></td></tr>})}</tbody></HTMLTable></TableWrap>}
function RemittanceDialog({id,onClose}:{id?:number;onClose:()=>void}){const {data,isLoading}=useSepaRemittance(id);const exported=useMarkSepaExported();const download=async()=>{if(!data?.xmlPayload)return;const blob=new Blob([data.xmlPayload],{type:'application/xml'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`${data.messageId||`sepa-${data.id}`}.xml`;a.click();URL.revokeObjectURL(url);if(data.status==='generated'){try{await exported.mutateAsync(data.id);}catch{AppToaster.show({message:'XML descargado, pero no se pudo registrar el estado exportado.',intent:Intent.WARNING});}}};return <Dialog isOpen={Boolean(id)} onClose={onClose} title={data?.messageId||'Detalle remesa'} style={{width:'min(1000px,95vw)'}}><DialogBody>{isLoading?<Spinner/>:data?<><Summary><InfoBox><small>Estado</small><b>{data.status}</b></InfoBox><InfoBox><small>Total</small><b>{money(data.controlSum)}</b></InfoBox><InfoBox><small>Operaciones</small><b>{data.transactionCount}</b></InfoBox></Summary><p><b>SHA-256:</b> <Mono>{data.xmlSha256||'—'}</Mono></p><h4>Operaciones</h4><TableWrap><HTMLTable striped condensed><thead><tr><th>Tercero</th><th>IBAN</th><th>Importe</th><th>EndToEnd</th><th>Secuencia</th></tr></thead><tbody>{(data.entries||[]).map((e:any)=><tr key={e.id}><td>{e.counterpartyName}</td><td>{e.iban}</td><td>{money(e.amount)}</td><td>{e.endToEndId}</td><td>{e.sequenceType||'—'}</td></tr>)}</tbody></HTMLTable></TableWrap>{data.xmlPayload?<><p><Button icon="download" intent={Intent.PRIMARY} onClick={download} loading={exported.isLoading}>Descargar XML SEPA</Button></p><h4>XML</h4><Xml>{data.xmlPayload}</Xml></>:null}</>:null}</DialogBody></Dialog>}

function TerritoryPanel(){const {data:config}=useSpainFinanceConfig();const update=useUpdateSpainFinanceConfig();const {data,isLoading}=useSpainTerritorySummary();const setTerritory=async(v:string)=>{try{await update.mutateAsync({fiscalTerritory:v});AppToaster.show({message:'Territorio fiscal de empresa guardado.',intent:Intent.SUCCESS});}catch(e:any){AppToaster.show({message:e?.message||'No se pudo guardar.',intent:Intent.DANGER});}};return <Section><Card><Grid><FormGroup label="Territorio fiscal de la empresa"><HTMLSelect value={config?.fiscalTerritory||'common'} onChange={e=>setTerritory(e.target.value)}><option value="common">Península/Baleares · IVA</option><option value="canary">Canarias · IGIC</option><option value="ceuta">Ceuta · IPSI</option><option value="melilla">Melilla · IPSI</option></HTMLSelect></FormGroup><Callout intent={Intent.WARNING} title="Regímenes separados">IGIC e IPSI no se mezclan con el IVA ordinario ni con sus casillas del Modelo 303. La clasificación territorial se conserva por tercero y por línea fiscal.</Callout></Grid></Card>{isLoading?<Spinner/>:<><Card><h3>Tipos fiscales territoriales</h3><TableWrap><HTMLTable striped condensed><thead><tr><th>Código</th><th>Nombre</th><th>Territorio</th><th>Tipo</th><th>Activo</th></tr></thead><tbody>{(data?.taxes||[]).map((t:any)=><tr key={t.id}><td>{t.code}</td><td>{t.name}</td><td>{t.taxTerritory}</td><td>{t.rate}%</td><td>{t.active?'Sí':'No'}</td></tr>)}</tbody></HTMLTable></TableWrap></Card><Card><h3>Terceros por territorio</h3><Summary>{(data?.contacts||[]).map((c:any)=><InfoBox key={c.fiscalTerritory}><small>{c.fiscalTerritory||'common'}</small><b>{c.count}</b></InfoBox>)}</Summary>{data?.warning?<Callout intent={Intent.WARNING}>{data.warning}</Callout>:null}</Card></>}</Section>}

const Page=styled.div`display:grid;gap:16px;padding-bottom:28px;`;
const Section=styled.div`display:grid;gap:16px;`;
const Header=styled.div`display:flex;justify-content:space-between;align-items:flex-start;gap:16px;`;
const Tabs=styled.div`display:flex;gap:8px;flex-wrap:wrap;`;
const Grid=styled.div`display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;align-items:end;`;
const Grid2=styled.div`display:grid;grid-template-columns:repeat(auto-fit,minmax(360px,1fr));gap:16px;`;
const Filters=styled.div`display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;align-items:end;`;
const Summary=styled.div`display:grid;grid-template-columns:repeat(auto-fit,minmax(155px,1fr));gap:10px;margin:12px 0;`;
const InfoBox=styled.div`border:1px solid rgba(128,128,128,.25);border-radius:6px;padding:10px;display:grid;gap:4px;b{font-size:18px}`;
const TableWrap=styled.div`overflow:auto;max-height:560px;`;
const Mono=styled.code`font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;`;
const DialogBody=styled.div`padding:20px;display:grid;gap:12px;`;
const Xml=styled.pre`white-space:pre-wrap;word-break:break-word;max-height:360px;overflow:auto;background:rgba(128,128,128,.08);padding:12px;border-radius:6px;font-size:11px;`;
