import { useQuery } from '@tanstack/react-query';
import { waitForElectronApi } from '@renderer/utils/electronApi';

export function useSetupStatus() {
  return useQuery({
    queryKey: ['setup', 'status'],
    queryFn: async () => {
      const api = await waitForElectronApi();
      return api.setup.isComplete();
    },
    staleTime: Infinity
  });
}
