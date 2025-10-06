import { useQuery } from '@tanstack/react-query';
import { waitForElectronApi } from '@renderer/utils/electronApi';
import type { DoctorProfile } from '@shared/entities';

export function useDoctorProfile() {
  return useQuery<DoctorProfile | undefined>({
    queryKey: ['setup', 'profile'],
    queryFn: async () => {
      const api = await waitForElectronApi();
      const result = await api.setup.getProfile();
      return result.profile;
    },
    staleTime: Infinity
  });
}
