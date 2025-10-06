import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { waitForElectronApi } from '@renderer/utils/electronApi';

export interface EnabledModule {
  key: string;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
}

export function useEnabledModules() {
  return useQuery<EnabledModule[]>({
    queryKey: ['modules', 'enabled'],
    queryFn: async () => {
      const api = await waitForElectronApi();
      return api.modules.getModules();
    },
    refetchOnWindowFocus: false
  });
}

export function useUpdateModules() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (modules: string[]) => {
      const api = await waitForElectronApi();
      return api.modules.updateModules(modules);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules', 'enabled'] });
    }
  });
}
