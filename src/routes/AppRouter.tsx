import { FC, useCallback } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import FullScreenLoader from '../components/FullScreenLoader';
import { useSetupStatus } from '../hooks/useSetupStatus';
import { useEnabledModules, type EnabledModule } from '../hooks/useModules';
import { ModuleProvider } from '../store/ModuleContext';
import AppLayout from '../layouts/AppLayout';
import SetupWizard from '../features/setup/SetupWizard';
import Dashboard from '../features/dashboard/Dashboard';
import PatientsPage from '../features/patients/PatientsPage';
import AppointmentsPage from '../features/appointments/AppointmentsPage';
import PrescriptionsPage from '../features/prescriptions/PrescriptionsPage';
import BillingPage from '../features/billing/BillingPage';
import InventoryPage from '../features/inventory/InventoryPage';
import AnalyticsPage from '../features/analytics/AnalyticsPage';
import CollaborationPage from '../features/collaboration/CollaborationPage';
import MedicalCertificatesPage from '../features/certificates/MedicalCertificatesPage';
import ClinicalCalculatorsPage from '../features/calculators/ClinicalCalculatorsPage';

const AppRouter: FC = () => {
  const setupQuery = useSetupStatus();
  const modulesQuery = useEnabledModules();

  const handleSetupComplete = useCallback(async () => {
    await setupQuery.refetch();
    await modulesQuery.refetch();
  }, [modulesQuery, setupQuery]);

  if (setupQuery.isLoading || modulesQuery.isLoading) {
    return <FullScreenLoader />;
  }

  if (!setupQuery.data) {
    return <SetupWizard onComplete={handleSetupComplete} />;
  }

  const modules = modulesQuery.data ?? [];
  const enabledModuleKeys = modules
    .filter((module: EnabledModule) => module.enabled)
    .map((module: EnabledModule) => module.key);

  return (
    <HashRouter>
      <ModuleProvider modules={modules}>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            {enabledModuleKeys.includes('patient_records') && (
              <Route path="patients" element={<PatientsPage />} />
            )}
            {enabledModuleKeys.includes('appointments') && (
              <Route path="appointments" element={<AppointmentsPage />} />
            )}
            {enabledModuleKeys.includes('e_prescriptions') && (
              <Route path="prescriptions" element={<PrescriptionsPage />} />
            )}
            {enabledModuleKeys.includes('billing') && <Route path="billing" element={<BillingPage />} />}
            {enabledModuleKeys.includes('pharmacy_inventory') && (
              <Route path="pharmacy" element={<InventoryPage />} />
            )}
            {enabledModuleKeys.includes('analytics') && <Route path="analytics" element={<AnalyticsPage />} />}
            {enabledModuleKeys.includes('collaboration') && (
              <Route path="collaboration" element={<CollaborationPage />} />
            )}
            {enabledModuleKeys.includes('medical_certificates') && (
              <Route path="certificates" element={<MedicalCertificatesPage />} />
            )}
            {enabledModuleKeys.includes('clinical_calculators') && (
              <Route path="calculators" element={<ClinicalCalculatorsPage />} />
            )}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </ModuleProvider>
    </HashRouter>
  );
};

export default AppRouter;
