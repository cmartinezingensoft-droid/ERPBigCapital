import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchSiiConfig, fetchSiiRecord, fetchSiiRecords, retrySiiRecord, submitSiiRecord, syncSii, updateSiiConfig, type SiiConsoleQuery } from '@farocapital/sdk-ts';
import { useApiFetcher } from '@/hooks/useRequest';
export const siiKeys={all:['SII'] as const,config:()=>['SII','CONFIG'] as const,records:(q:SiiConsoleQuery)=>['SII','RECORDS',q] as const,record:(id?:number)=>['SII','RECORD',id] as const};
const invalidator=()=>{const q=useQueryClient();return()=>q.invalidateQueries({queryKey:siiKeys.all});};
export function useSiiConfig(){const f=useApiFetcher({enableCamelCaseTransform:true});return useQuery({queryKey:siiKeys.config(),queryFn:()=>fetchSiiConfig(f)});}
export function useUpdateSiiConfig(){const f=useApiFetcher({enableCamelCaseTransform:true});const inv=invalidator();return useMutation({mutationFn:(b:any)=>updateSiiConfig(f,b),onSuccess:inv});}
export function useSiiRecords(q:SiiConsoleQuery){const f=useApiFetcher({enableCamelCaseTransform:true});return useQuery({queryKey:siiKeys.records(q),queryFn:()=>fetchSiiRecords(f,q)});}
export function useSiiRecord(id?:number){const f=useApiFetcher({enableCamelCaseTransform:true});return useQuery({queryKey:siiKeys.record(id),queryFn:()=>fetchSiiRecord(f,id as number),enabled:Boolean(id)});}
export function useSyncSii(){const f=useApiFetcher({enableCamelCaseTransform:true});const inv=invalidator();return useMutation({mutationFn:(b:{fromDate?:string;toDate?:string})=>syncSii(f,b),onSuccess:inv});}
export function useSubmitSii(){const f=useApiFetcher({enableCamelCaseTransform:true});const inv=invalidator();return useMutation({mutationFn:(id:number)=>submitSiiRecord(f,id),onSuccess:inv});}
export function useRetrySii(){const f=useApiFetcher({enableCamelCaseTransform:true});const inv=invalidator();return useMutation({mutationFn:(id:number)=>retrySiiRecord(f,id),onSuccess:inv});}
