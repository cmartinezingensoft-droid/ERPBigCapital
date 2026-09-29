import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createSepaMandate,
  createSepaRemittance,
  fetchPgcBalanceSheet,
  fetchPgcCatalog,
  fetchPgcDiagnostics,
  fetchPgcProfitLoss,
  fetchPgcTrialBalance,
  fetchSepaMandates,
  fetchSepaRemittance,
  fetchSepaRemittances,
  fetchSpainBankAccounts,
  fetchSpainFinanceConfig,
  fetchSpainFinanceContacts,
  fetchSpainTerritorySummary,
  generateSepaRemittance,
  initializePgc,
  markSepaRemittanceExported,
  updateSepaMandate,
  updateSpainBankAccount,
  updateSpainFinanceConfig,
  updateSpainFinanceContact,
  validateSepa,
  type SepaBankAccountInput,
  type SepaContactInput,
  type SepaMandateInput,
  type SepaRemittanceInput,
  type SpainFinancePeriod,
} from '@farocapital/sdk-ts';
import { useApiFetcher } from '@/hooks/useRequest';

export const spainFinanceKeys = {
  all: ['SPAIN_FINANCE'] as const,
  config: () => ['SPAIN_FINANCE','CONFIG'] as const,
  pgc: (name: string, p?: SpainFinancePeriod) => ['SPAIN_FINANCE','PGC',name,p] as const,
  banks: () => ['SPAIN_FINANCE','BANKS'] as const,
  contacts: (search?: string) => ['SPAIN_FINANCE','CONTACTS',search] as const,
  mandates: () => ['SPAIN_FINANCE','MANDATES'] as const,
  remittances: () => ['SPAIN_FINANCE','REMITTANCES'] as const,
  remittance: (id?: number) => ['SPAIN_FINANCE','REMITTANCE',id] as const,
  territory: () => ['SPAIN_FINANCE','TERRITORY'] as const,
};
const useInvalidate = () => { const q=useQueryClient(); return () => q.invalidateQueries({queryKey:spainFinanceKeys.all}); };

export function useSpainFinanceConfig(){const f=useApiFetcher({enableCamelCaseTransform:true});return useQuery({queryKey:spainFinanceKeys.config(),queryFn:()=>fetchSpainFinanceConfig(f)});}
export function useUpdateSpainFinanceConfig(){const f=useApiFetcher({enableCamelCaseTransform:true});const inv=useInvalidate();return useMutation({mutationFn:(b:any)=>updateSpainFinanceConfig(f,b),onSuccess:inv});}
export function usePgcCatalog(){const f=useApiFetcher({enableCamelCaseTransform:true});return useQuery({queryKey:spainFinanceKeys.pgc('catalog'),queryFn:()=>fetchPgcCatalog(f)});}
export function usePgcDiagnostics(){const f=useApiFetcher({enableCamelCaseTransform:true});return useQuery({queryKey:spainFinanceKeys.pgc('diagnostics'),queryFn:()=>fetchPgcDiagnostics(f)});}
export function useInitializePgc(){const f=useApiFetcher({enableCamelCaseTransform:true});const inv=useInvalidate();return useMutation({mutationFn:()=>initializePgc(f),onSuccess:inv});}
export function usePgcReport(name:'balance'|'profit-loss'|'trial-balance',p:SpainFinancePeriod){const f=useApiFetcher({enableCamelCaseTransform:true});const fn={balance:fetchPgcBalanceSheet,'profit-loss':fetchPgcProfitLoss,'trial-balance':fetchPgcTrialBalance}[name];return useQuery({queryKey:spainFinanceKeys.pgc(name,p),queryFn:()=>fn(f,p)});}
export function useSpainBankAccounts(){const f=useApiFetcher({enableCamelCaseTransform:true});return useQuery({queryKey:spainFinanceKeys.banks(),queryFn:()=>fetchSpainBankAccounts(f)});}
export function useUpdateSpainBankAccount(){const f=useApiFetcher({enableCamelCaseTransform:true});const inv=useInvalidate();return useMutation({mutationFn:({id,body}:{id:number;body:SepaBankAccountInput})=>updateSpainBankAccount(f,id,body),onSuccess:inv});}
export function useSpainFinanceContacts(search?:string){const f=useApiFetcher({enableCamelCaseTransform:true});return useQuery({queryKey:spainFinanceKeys.contacts(search),queryFn:()=>fetchSpainFinanceContacts(f,search)});}
export function useUpdateSpainFinanceContact(){const f=useApiFetcher({enableCamelCaseTransform:true});const inv=useInvalidate();return useMutation({mutationFn:({id,body}:{id:number;body:SepaContactInput})=>updateSpainFinanceContact(f,id,body),onSuccess:inv});}
export function useSepaValidation(){const f=useApiFetcher({enableCamelCaseTransform:true});return useMutation({mutationFn:({iban,bic}:{iban:string;bic?:string})=>validateSepa(f,iban,bic)});}
export function useSepaMandates(){const f=useApiFetcher({enableCamelCaseTransform:true});return useQuery({queryKey:spainFinanceKeys.mandates(),queryFn:()=>fetchSepaMandates(f)});}
export function useCreateSepaMandate(){const f=useApiFetcher({enableCamelCaseTransform:true});const inv=useInvalidate();return useMutation({mutationFn:(b:SepaMandateInput)=>createSepaMandate(f,b),onSuccess:inv});}
export function useUpdateSepaMandate(){const f=useApiFetcher({enableCamelCaseTransform:true});const inv=useInvalidate();return useMutation({mutationFn:({id,body}:{id:number;body:any})=>updateSepaMandate(f,id,body),onSuccess:inv});}
export function useSepaRemittances(){const f=useApiFetcher({enableCamelCaseTransform:true});return useQuery({queryKey:spainFinanceKeys.remittances(),queryFn:()=>fetchSepaRemittances(f)});}
export function useSepaRemittance(id?:number){const f=useApiFetcher({enableCamelCaseTransform:true});return useQuery({queryKey:spainFinanceKeys.remittance(id),queryFn:()=>fetchSepaRemittance(f,id as number),enabled:Boolean(id)});}
export function useCreateSepaRemittance(){const f=useApiFetcher({enableCamelCaseTransform:true});const inv=useInvalidate();return useMutation({mutationFn:(b:SepaRemittanceInput)=>createSepaRemittance(f,b),onSuccess:inv});}
export function useGenerateSepaRemittance(){const f=useApiFetcher({enableCamelCaseTransform:true});const inv=useInvalidate();return useMutation({mutationFn:(id:number)=>generateSepaRemittance(f,id),onSuccess:inv});}
export function useMarkSepaExported(){const f=useApiFetcher({enableCamelCaseTransform:true});const inv=useInvalidate();return useMutation({mutationFn:(id:number)=>markSepaRemittanceExported(f,id),onSuccess:inv});}
export function useSpainTerritorySummary(){const f=useApiFetcher({enableCamelCaseTransform:true});return useQuery({queryKey:spainFinanceKeys.territory(),queryFn:()=>fetchSpainTerritorySummary(f)});}
