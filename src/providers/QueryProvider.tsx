/**
 * Query Provider
 *
 * Wraps the app with React Query provider for server state management.
 * Also includes DataSyncProvider for centralized cache invalidation.
 */

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/react-query';
import { DataSyncProvider } from './DataSyncProvider';

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps): React.JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <DataSyncProvider>
        {children}
      </DataSyncProvider>
      {/* Show devtools only in development */}
      {import.meta.env.DEV && (
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition="bottom-left"
        />
      )}
    </QueryClientProvider>
  );
}
