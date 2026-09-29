import React from 'react';
import { Button, Callout, Card, FormGroup, HTMLSelect, HTMLTable, InputGroup, Intent, Spinner, Switch, Tag } from '@blueprintjs/core';
import styled from 'styled-components';
import { AppToaster, DashboardPageContent } from '@/components';
import { useSpanishFiscalConfig, useSpanishFiscalReport, useUpdateSpanishFiscalConfig, useViesCheck } from '@/hooks/query/spain-fiscal';

const today = new Date();
const y = today.getFullYear();
const startDefault = `${y}-01-01`;
const endDefault = `${y}-12-31`;
const money = (v:any) => new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(Number(v||0));
const pct = (v:any) => `${Number(v||0).toLocaleString('es-ES')} %`;

export function SpainFiscalCenter(){
  const [fromDate,setFromDate]=React.useState(startDefault); const [toDate,setToDate]=React.useState(endDefault);
  const [tab,setTab]=React.useState<'303'|'349'|'347'|'369'|'books'>('303');
  const period={fromDate,toDate};
  const {data:config,isLoading:loadingConfig}=useSpanishFiscalConfig();
  const update=useUpdateSpanishFiscalConfig(); const {data,isLoading,refetch}=useSpanishFiscalReport(tab,period);
  const vies=useViesCheck(); const [country,setCountry]=React.useState('FR'); const [vat,setVat]=React.useState('');
  const save=async(body:any)=>{try{await update.mutateAsync(body);AppToaster.show({message:'Configuración fiscal guardada.',intent:Intent.SUCCESS});}catch(e:any){AppToaster.show({message:e?.message||'No se pudo guardar.',intent:Intent.DANGER});}};
  const check=async()=>{try{const r:any=await vies.mutateAsync({countryCode:country,vatNumber:vat});AppToaster.show({message:r.valid?`VIES válido: ${r.name||vat}`:`VIES no válido: ${country}${vat}`,intent:r.valid?Intent.SUCCESS:Intent.WARNING});}catch(e:any){AppToaster.show({message:e?.message||'No se pudo consultar VIES.',intent:Intent.DANGER});}};
  return <DashboardPageContent><Page>
    <Header><div><h2>Fiscalidad España</h2><p>Libros de IVA, preliquidaciones 303/349/347/369, RECC y validación VIES.</p></div><Button icon="refresh" onClick={()=>refetch()}>Actualizar</Button></Header>
    {loadingConfig?<Spinner size={24}/>:<Card><Grid>
      <FormGroup label="Periodicidad IVA"><HTMLSelect value={config?.vatPeriodicity||'quarterly'} onChange={e=>save({vatPeriodicity:e.target.value})}><option value="quarterly">Trimestral</option><option value="monthly">Mensual</option></HTMLSelect></FormGroup>
      <FormGroup label="IVA deducible %"><InputGroup type="number" min={0} max={100} value={String(config?.inputVatDeductibilityPercent??100)} onChange={e=>save({inputVatDeductibilityPercent:Number(e.target.value)})}/></FormGroup>
      <FormGroup label="Regímenes"><Switch checked={Boolean(config?.reccEnabled)} label="RECC" onChange={()=>save({reccEnabled:!config?.reccEnabled})}/><Switch checked={Boolean(config?.ossUnionEnabled)} label="OSS Unión" onChange={()=>save({ossUnionEnabled:!config?.ossUnionEnabled})}/><Switch checked={Boolean(config?.ossNonUnionEnabled)} label="OSS no Unión" onChange={()=>save({ossNonUnionEnabled:!config?.ossNonUnionEnabled})}/><Switch checked={Boolean(config?.iossEnabled)} label="IOSS" onChange={()=>save({iossEnabled:!config?.iossEnabled})}/></FormGroup>
      <Callout intent={config?.siiEnabled?Intent.WARNING:Intent.NONE} title={config?.siiEnabled?'Empresa configurada para SII':'SII no activo'}>{config?.siiEnabled?'VERI*FACTU queda excluido para esta empresa y el Modelo 347 se marca como no exigible cuando procede.':'Puede activarse desde la consola SII cuando la empresa esté obligada o acogida.'}</Callout>
    </Grid></Card>}
    <Card><Filters><FormGroup label="Desde"><input type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)}/></FormGroup><FormGroup label="Hasta"><input type="date" value={toDate} onChange={e=>setToDate(e.target.value)}/></FormGroup><FormGroup label="VIES país"><InputGroup value={country} maxLength={2} onChange={e=>setCountry(e.target.value.toUpperCase())}/></FormGroup><FormGroup label="NIF-IVA"><InputGroup value={vat} onChange={e=>setVat(e.target.value.toUpperCase())} rightElement={<Button minimal icon="search" loading={vies.isPending} onClick={check}/>}/></FormGroup></Filters></Card>
    <Tabs>{(['303','349','347','369','books'] as const).map(t=><Button key={t} active={tab===t} onClick={()=>setTab(t)}>{t==='books'?'Libros IVA':`Modelo ${t}`}</Button>)}</Tabs>
    {isLoading?<Spinner/>:<Report data={data} tab={tab}/>} 
  </Page></DashboardPageContent>;
}

function Report({data,tab}:{data:any;tab:string}){
 if(!data)return <Callout>No hay datos para el período.</Callout>;
 if(tab==='303') return <Card><h3>Preliquidación Modelo 303 <Tag intent={Intent.WARNING}>CONTROL</Tag></h3><Summary><Box><small>IVA devengado</small><b>{money(data.result?.accruedTax)}</b></Box><Box><small>IVA deducible</small><b>{money(data.result?.deductibleTax)}</b></Box><Box><small>Resultado</small><b>{money(data.result?.difference)}</b></Box><Box><small>RECC</small><b>{data.recc?.enabled?'Activo':'No'}</b></Box></Summary><p>{data.disclaimer}</p><h4>Devengado nacional por tipo</h4><RateTable rows={data.accrued?.domesticByRate}/><h4>Deducible nacional por tipo</h4><RateTable rows={data.deductible?.domesticByRate}/></Card>;
 if(tab==='349') return <Card><h3>Predeclaración Modelo 349</h3><p>Periodicidad orientativa: <b>{data.periodicityHint}</b>. Avisos VIES: <b>{data.warnings?.length||0}</b>.</p><GenericTable rows={data.data} cols={['operationCode','countryCode','vatNumber','counterpartyName','viesStatus','taxableBase','documents']}/></Card>;
 if(tab==='347') return <Card><h3>Predeclaración Modelo 347</h3>{data.status==='NOT_REQUIRED_BY_SII'?<Callout intent={Intent.WARNING}>La configuración SII marca este modelo como no exigible para el período.</Callout>:<><p>Umbral aplicado: {money(data.threshold||3005.06)}</p><GenericTable rows={(data.data||[]).map((r:any)=>({...r,T1:r.quarters?.T1,T2:r.quarters?.T2,T3:r.quarters?.T3,T4:r.quarters?.T4}))} cols={['key','taxNumber','name','annualAmount','T1','T2','T3','T4']}/></>}</Card>;
 if(tab==='369') return <Card><h3>Preliquidación Modelo 369 · OSS/IOSS</h3><GenericTable rows={data.data} cols={['scheme','countryCode','vatRate','taxableBase','vatAmount']}/></Card>;
 return <Card><h3>Libros registro de IVA</h3><Summary><Box><small>Base emitida</small><b>{money(data.totals?.issuedBase)}</b></Box><Box><small>IVA repercutido</small><b>{money(data.totals?.outputVat)}</b></Box><Box><small>Base recibida</small><b>{money(data.totals?.receivedBase)}</b></Box><Box><small>IVA soportado</small><b>{money(data.totals?.inputVat)}</b></Box></Summary><h4>Emitidas</h4><GenericTable rows={data.issued} cols={['date','documentNumber','counterpartyName','counterpartyFiscalNumber','operationType','vatRate','taxableBase','vatAmount']}/><h4>Recibidas</h4><GenericTable rows={data.received} cols={['date','documentNumber','counterpartyName','counterpartyFiscalNumber','operationType','vatRate','taxableBase','vatAmount']}/></Card>;
}
function RateTable({rows=[]}:{rows:any[]}){return <HTMLTable striped condensed><thead><tr><th>Tipo</th><th>Base</th><th>Cuota</th><th>RE</th></tr></thead><tbody>{rows.map((r,i)=><tr key={i}><td>{pct(r.rate)}</td><td>{money(r.base)}</td><td>{money(r.vat)}</td><td>{money(r.surcharge)}</td></tr>)}</tbody></HTMLTable>}
function GenericTable({rows=[],cols}:{rows:any[];cols:string[]}){return <TableWrap><HTMLTable striped condensed><thead><tr>{cols.map(c=><th key={c}>{c}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{cols.map(c=><td key={c}>{typeof r?.[c]==='number'&&/amount|base|vat/i.test(c)?money(r[c]):String(r?.[c]??'—')}</td>)}</tr>)}</tbody></HTMLTable></TableWrap>}
const Page=styled.div`display:grid;gap:16px;padding-bottom:24px;`; const Header=styled.div`display:flex;justify-content:space-between;gap:16px;align-items:flex-start;`; const Grid=styled.div`display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:16px;`; const Filters=styled.div`display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;align-items:end;`; const Tabs=styled.div`display:flex;gap:8px;flex-wrap:wrap;`; const Summary=styled.div`display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin:12px 0;`; const Box=styled.div`border:1px solid rgba(128,128,128,.25);border-radius:6px;padding:12px;display:grid;gap:4px;b{font-size:20px}`; const TableWrap=styled.div`overflow:auto;max-height:520px;`;
