import React, { useMemo, useState } from 'react';
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Grid,
  Group,
  Loader,
  Modal,
  PasswordInput,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
  rem
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import {
  IconArrowRight,
  IconActivityHeartbeat,
  IconCalendarPlus,
  IconCalendarTime,
  IconCurrencyRupee,
  IconFileCertificate,
  IconHeartbeat,
  IconLock,
  IconSettings,
  IconUsersGroup
} from '@tabler/icons-react';
import { waitForElectronApi } from '@renderer/utils/electronApi';
import { useDoctorProfile } from '@renderer/hooks/useDoctorProfile';
import { useModulesContext } from '@renderer/store/ModuleContext';
import type { EnabledModule } from '@renderer/hooks/useModules';
import { PRACTICE_TYPE_LABELS } from '@shared/modules';
import type { PracticeType } from '@shared/setup';
import { useNavigate } from 'react-router-dom';
import { useDisclosure } from '@mantine/hooks';
import SetupWizard from '../setup/SetupWizard';

interface AnalyticsOverview {
  totals: {
    totalPatients: number;
    upcomingAppointments: number;
    completedAppointments: number;
    revenueLKR: number;
  };
  topMedications: { medication: string; count: number }[];
}

const DASHBOARD_UNLOCK_TOKEN_KEY = 'medibridge.dashboard-unlocked';

const Dashboard: React.FC = () => {
  const { data, isLoading, refetch } = useQuery<AnalyticsOverview>({
    queryKey: ['analytics', 'overview'],
    queryFn: async () => {
      const api = await waitForElectronApi();
      return api.analytics.overview();
    },
    refetchOnWindowFocus: false
  });
  const { data: doctorProfile } = useDoctorProfile();
  const modules = useModulesContext();
  const navigate = useNavigate();
  const [settingsOpen, { open: openSettings, close: closeSettings }] = useDisclosure(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [enteredPassword, setEnteredPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  const readUnlockToken = React.useCallback(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      return window.sessionStorage.getItem(DASHBOARD_UNLOCK_TOKEN_KEY);
    } catch (error) {
      console.warn('Unable to read dashboard unlock token from session storage', error);
      return null;
    }
  }, []);

  const writeUnlockToken = React.useCallback((value: string | null) => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      if (!value) {
        window.sessionStorage.removeItem(DASHBOARD_UNLOCK_TOKEN_KEY);
      } else {
        window.sessionStorage.setItem(DASHBOARD_UNLOCK_TOKEN_KEY, value);
      }
    } catch (error) {
      console.warn('Unable to persist dashboard unlock token to session storage', error);
    }
  }, []);

  const enabledModuleKeys = useMemo(
    () => modules.filter((module: EnabledModule) => module.enabled).map((module) => module.key),
    [modules]
  );

  const practiceType = doctorProfile?.practiceType as PracticeType | undefined;
  const practiceLabel = practiceType ? PRACTICE_TYPE_LABELS[practiceType] : undefined;
  const locationBlurb = [practiceLabel, doctorProfile?.location?.trim()].filter(Boolean).join(' • ');
  const greetingName = doctorProfile?.name ? doctorProfile.name.split(' ')[0] : undefined;
  const trimmedPassword = doctorProfile?.password?.trim() ?? '';
  const requiresPassword = trimmedPassword.length > 0;

  const quickActions = useMemo(
    () =>
      [
        {
          key: 'patient_records',
          label: 'New patient',
          path: '/patients',
          icon: IconUsersGroup
        },
        {
          key: 'appointments',
          label: 'Schedule visit',
          path: '/appointments',
          icon: IconCalendarPlus
        },
        {
          key: 'medical_certificates',
          label: 'Issue certificate',
          path: '/certificates',
          icon: IconFileCertificate
        },
        {
          key: 'clinical_calculators',
          label: 'Open calculators',
          path: '/calculators',
          icon: IconActivityHeartbeat
        }
      ].filter((action) => enabledModuleKeys.includes(action.key)),
    [enabledModuleKeys]
  );

  React.useEffect(() => {
    void refetch();
  }, [refetch]);

  React.useEffect(() => {
    if (!doctorProfile) {
      return;
    }

    if (!requiresPassword) {
      writeUnlockToken(null);
      if (!hasAccess) {
        setHasAccess(true);
      }
      if (authModalOpen) {
        setAuthModalOpen(false);
      }
      return;
    }

    const storedToken = readUnlockToken();
    const passwordToken = trimmedPassword;

    if (storedToken === passwordToken) {
      if (!hasAccess) {
        setHasAccess(true);
      }
      if (authModalOpen) {
        setAuthModalOpen(false);
      }
      return;
    }

    if (storedToken && storedToken !== passwordToken) {
      writeUnlockToken(null);
    }

    setHasAccess(false);
    setAuthModalOpen(true);
  }, [
    doctorProfile,
    requiresPassword,
    trimmedPassword,
    hasAccess,
    authModalOpen,
    readUnlockToken,
    writeUnlockToken
  ]);

  React.useEffect(() => {
    if (authModalOpen) {
      setEnteredPassword('');
      setAuthError(null);
    }
  }, [authModalOpen]);

  const handlePasswordSubmit = () => {
    const storedPassword = doctorProfile?.password?.trim() ?? '';
    const providedPassword = enteredPassword.trim();

    if (!requiresPassword) {
      writeUnlockToken(null);
      setHasAccess(true);
      setAuthModalOpen(false);
      return;
    }

    if (storedPassword.length > 0 && storedPassword === providedPassword) {
      writeUnlockToken(storedPassword);
      setHasAccess(true);
      setAuthModalOpen(false);
      setAuthError(null);
      setEnteredPassword('');
    } else {
      setAuthError('Incorrect password. Please try again.');
    }
  };

  const handlePasswordKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handlePasswordSubmit();
    }
  };

  const handleSetupComplete = () => {
    closeSettings();
    void refetch();
  };

  const passwordModal = (
    <Modal
      opened={authModalOpen}
      onClose={() => undefined}
      withCloseButton={false}
      closeOnEscape={false}
      closeOnClickOutside={false}
      centered
      title="Enter dashboard password"
      overlayProps={{ opacity: 0.35, blur: 6 }}
      styles={{ title: { fontWeight: 600 } }}
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          This workspace is protected. Please enter the practice password to continue.
        </Text>
        <PasswordInput
          data-autofocus
          placeholder="Enter password"
          value={enteredPassword}
          onChange={(event) => setEnteredPassword(event.currentTarget.value)}
          onKeyDown={handlePasswordKeyDown}
        />
        {authError && (
          <Text size="sm" c="red">
            {authError}
          </Text>
        )}
        <Group justify="flex-end">
          <Button color="teal" leftSection={<IconLock size={14} />} onClick={handlePasswordSubmit}>
            Unlock dashboard
          </Button>
        </Group>
      </Stack>
    </Modal>
  );

  const settingsModal = (
    <Modal
      opened={settingsOpen}
      onClose={closeSettings}
      fullScreen
      centered
      title="Update practice settings"
      overlayProps={{ opacity: 0.3, blur: 6 }}
      styles={{ title: { fontWeight: 600 } }}
    >
      <SetupWizard onComplete={handleSetupComplete} />
    </Modal>
  );

  if (requiresPassword && !hasAccess) {
    return (
      <>
        {settingsModal}
        {passwordModal}
        <Group justify="center" mt="xl">
          <Stack align="center" gap="sm">
            <ThemeIcon color="teal" variant="light" size={64} radius="xl">
              <IconLock size={28} />
            </ThemeIcon>
            <Text fw={600}>Dashboard locked</Text>
            <Text size="sm" c="dimmed" ta="center">
              Enter the password you set during setup to view analytics and quick actions.
            </Text>
          </Stack>
        </Group>
      </>
    );
  }

  if (isLoading || !data) {
    return (
      <>
        {settingsModal}
        {passwordModal}
        <Group justify="center" mt="xl">
          <Loader />
        </Group>
      </>
    );
  }

  return (
    <>
      {settingsModal}
      {passwordModal}

      <Stack gap="xl">
        <Card
          radius="xl"
          padding="xl"
          shadow="xl"
          style={{
            background:
              'linear-gradient(135deg, rgba(32, 201, 151, 0.92) 0%, rgba(55, 135, 245, 0.9) 60%, rgba(111, 66, 193, 0.92) 100%)',
            color: 'white'
          }}
        >
          <Stack gap="lg">
            <Group justify="space-between" align="flex-start" wrap="wrap">
              <Stack gap="xs" maw={520}>
                <Badge color="teal" variant="filled" size="sm" radius="sm" style={{ alignSelf: 'flex-start' }}>
                  {practiceLabel ?? 'MediBridge Workspace'}
                </Badge>
                <Title order={2} c="white" fw={700} style={{ lineHeight: 1.1 }}>
                  Welcome back{greetingName ? `, ${greetingName}` : ''}
                </Title>
                {doctorProfile?.centreName && (
                  <Text fw={600} size="lg" c="white" style={{ opacity: 0.92 }}>
                    {doctorProfile.centreName}
                  </Text>
                )}
                <Text size="sm" c="white" style={{ opacity: 0.82 }}>
                  {locationBlurb || 'All your clinic metrics, appointments, and inventory in one offline-ready HQ.'}
                </Text>
              </Stack>
              <Group gap="sm" align="flex-start">
                <Tooltip label="Settings" withArrow>
                  <ActionIcon
                    size={40}
                    radius="xl"
                    variant="default"
                    aria-label="Open settings"
                    onClick={openSettings}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.18)',
                      color: 'var(--mantine-color-white)',
                      border: '1px solid rgba(255, 255, 255, 0.45)'
                    }}
                  >
                    <IconSettings size={20} />
                  </ActionIcon>
                </Tooltip>
                <ThemeIcon size={72} radius="xl" variant="white" color="teal">
                  <IconHeartbeat size={36} />
                </ThemeIcon>
              </Group>
            </Group>

            {quickActions.length > 0 ? (
              <Group gap="sm" wrap="wrap">
                {quickActions.map((action) => (
                  <Button
                    key={action.key}
                    variant="white"
                    color="teal"
                    leftSection={<action.icon size={16} />}
                    onClick={() => navigate(action.path)}
                  >
                    {action.label}
                  </Button>
                ))}
                {enabledModuleKeys.includes('analytics') && (
                  <Button
                    variant="filled"
                    color="indigo"
                    rightSection={<IconArrowRight size={16} />}
                    onClick={() => navigate('/analytics')}
                  >
                    View analytics
                  </Button>
                )}
              </Group>
            ) : (
              <Text size="sm" c="white" style={{ opacity: 0.8 }}>
                Enable additional modules from your setup wizard to unlock quick actions here.
              </Text>
            )}
          </Stack>
        </Card>

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
          <Card
            shadow="lg"
            padding="xl"
            radius="lg"
            style={{
              background: 'linear-gradient(135deg, rgba(32, 201, 151, 0.16) 0%, rgba(32, 201, 151, 0.04) 100%)',
              border: '1px solid rgba(32, 201, 151, 0.18)'
            }}
          >
            <Group>
              <ThemeIcon color="teal" radius="md" size={46} variant="light">
                <IconUsersGroup size={24} />
              </ThemeIcon>
              <div>
                <Text size="xs" c="dimmed" fw={600}>
                  Total patients
                </Text>
                <Text size="xl" fw={700}>
                  {data.totals.totalPatients}
                </Text>
                <Text size="xs" c="dimmed">
                  {data.totals.totalPatients > 0
                    ? 'Your panel is growing steadily.'
                    : 'No records yet — add your first patient.'}
                </Text>
              </div>
            </Group>
          </Card>
          <Card
            shadow="lg"
            padding="xl"
            radius="lg"
            style={{
              background: 'linear-gradient(135deg, rgba(55, 135, 245, 0.15) 0%, rgba(55, 135, 245, 0.04) 100%)',
              border: '1px solid rgba(55, 135, 245, 0.2)'
            }}
          >
            <Group>
              <ThemeIcon color="indigo" radius="md" size={46} variant="light">
                <IconCalendarTime size={24} />
              </ThemeIcon>
              <div>
                <Text size="xs" c="dimmed" fw={600}>
                  Upcoming appointments
                </Text>
                <Text size="xl" fw={700}>
                  {data.totals.upcomingAppointments}
                </Text>
                <Text size="xs" c="dimmed">
                  {data.totals.upcomingAppointments > 0
                    ? 'Stay on time with your booked sessions.'
                    : 'No appointments scheduled yet.'}
                </Text>
              </div>
            </Group>
          </Card>
          <Card
            shadow="lg"
            padding="xl"
            radius="lg"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 184, 77, 0.18) 0%, rgba(255, 184, 77, 0.05) 100%)',
              border: '1px solid rgba(255, 184, 77, 0.24)'
            }}
          >
            <Group>
              <ThemeIcon color="orange" radius="md" size={46} variant="light">
                <IconCurrencyRupee size={24} />
              </ThemeIcon>
              <div>
                <Text size="xs" c="dimmed" fw={600}>
                  Revenue (LKR)
                </Text>
                <Text size="xl" fw={700}>
                  {Number(data.totals.revenueLKR).toLocaleString('en-LK')}
                </Text>
                <Text size="xs" c="dimmed">
                  {data.totals.revenueLKR > 0
                    ? 'Keep tabs on cash flow and receivables.'
                    : 'Record a payment to start tracking revenue.'}
                </Text>
              </div>
            </Group>
          </Card>
        </SimpleGrid>

        <Card withBorder shadow="lg" padding="xl" radius="lg">
          <Stack gap="sm">
            <Title order={4}>Top prescribed medications</Title>
            {data.topMedications.length === 0 ? (
              <Text size="sm" c="dimmed">
                No prescriptions recorded yet.
              </Text>
            ) : (
              <Grid>
                {data.topMedications.map((item) => (
                  <Grid.Col key={item.medication} span={{ base: 12, sm: 6, md: 4 }}>
                    <Paper
                      withBorder
                      shadow="xs"
                      radius="md"
                      p="md"
                      style={{
                        borderColor: 'rgba(32, 201, 151, 0.25)',
                        boxShadow: '0 10px 22px rgba(15, 23, 42, 0.08)'
                      }}
                    >
                      <Group justify="space-between" align="center">
                        <Stack gap={2}>
                          <Text fw={600}>{item.medication}</Text>
                          <Text size="xs" c="dimmed">
                            {item.count} prescriptions
                          </Text>
                        </Stack>
                        <ThemeIcon size={rem(36)} radius="lg" variant="light" color="teal">
                          <IconHeartbeat size={18} />
                        </ThemeIcon>
                      </Group>
                    </Paper>
                  </Grid.Col>
                ))}
              </Grid>
            )}
          </Stack>
        </Card>
      </Stack>
    </>
  );
};

export default Dashboard;
