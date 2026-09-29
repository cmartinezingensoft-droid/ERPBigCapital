import React from 'react';

/**
 * Phase 1 compatibility shim for the unfinished legacy Projects frontend.
 * The original screens are archived outside src because the current server
 * exposes no /projects API. This shim prevents dependent historical fields
 * from triggering network requests until Projects is deliberately restored.
 */
export const ProjectsSelect = (_props: unknown) => null;
export const ProjectSuggestField = (_props: unknown) => null;
export const ProjectBillableEntries = (_props: unknown) => null;
export const ProjectBillableEntriesLink = (_props: {
  children?: React.ReactNode;
  projectId?: unknown;
}) => null;
export const index = (_props: unknown) => null;
export const ProjectAlerts: [] = [];

export function useProjects(_query?: unknown, _options?: unknown) {
  return {
    data: { projects: [] },
    isLoading: false,
    isSuccess: true,
  } as const;
}
