import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      gcTime: 1000 * 60 * 10,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

export const PERSISTED_QUERY_KEYS = [
  ['groups'],
  ['emergency-types'],
  ['skills-catalog'],
] as const;
