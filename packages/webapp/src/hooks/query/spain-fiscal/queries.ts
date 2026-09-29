import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { checkVies, fetchSpanishFiscalConfig, fetchSpanishModel303, fetchSpanishModel347, fetchSpanishModel349, fetchSpanishModel369, fetchSpanishVatBooks, updateSpanishFiscalConfig, type SpanishFiscalPeriod, type ViesCheckInput } from '@farocapital/sdk-ts';
import { useApiFetcher } from '@/hooks/useRequest';
export const spainFiscalKeys={all:['SPAIN_FISCAL'] as const, config:()=>['SPAIN_FISCAL','CONFIG'] as const, report:(name:string,p:SpanishFiscalPeriod)=>['SPAIN_FISCAL',name,p] as const};
export function useSpanishFiscalConfig(){const f=useApiFetcher({enableCamelCaseTransform:true});return useQuery({queryKey:spainFiscalKeys.config(),queryFn:()=>fetchSpanishFiscalConfig(f)});}
export function useUpdateSpanishFiscalConfig(){const f=useApiFetcher({enableCamelCaseTransform:true});const q=useQueryClient();return useMutation({mutationFn:(body:any)=>updateSpanishFiscalConfig(f,body),onSuccess:()=>q.invalidateQueries({queryKey:spainFiscalKeys.all})});}
export function useSpanishFiscalReport(name:'books'|'303'|'349'|'347'|'369',p:SpanishFiscalPeriod){const f=useApiFetcher({enableCamelCaseTransform:true});const fn={books:fetchSpanishVatBooks,'303':fetchSpanishModel303,'349':fetchSpanishModel349,'347':fetchSpanishModel347,'369':fetchSpanishModel369}[name];return useQuery({queryKey:spainFiscalKeys.report(name,p),queryFn:()=>fn(f,p)});}
export function useViesCheck(){const f=useApiFetcher({enableCamelCaseTransform:true});return useMutation({mutationFn:(body:ViesCheckInput)=>checkVies(f,body)});}
