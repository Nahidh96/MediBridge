import React, { useMemo } from 'react';
import {
  Badge,
  Button,
  Card,
  Grid,
  Group,
  Loader,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
  rem
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import {
  IconArrowRight,
  IconCalendarPlus,
  IconCalendarTime,
  IconCurrencyRupee,
  IconFileCertificate,
  IconHeartbeat,
  IconUsersGroup
} from '@tabler/icons-react';
import { waitForElectronApi } from '@renderer/utils/electronApi';
import { useDoctorProfile } from '@renderer/hooks/useDoctorProfile';
import { useModulesContext } from '@renderer/store/ModuleContext';
import type { EnabledModule } from '@renderer/hooks/useModules';
import { PRACTICE_TYPE_LABELS } from '@shared/modules';
import type { PracticeType } from '@shared/setup';
import { useNavigate } from 'react-router-dom';

interface AnalyticsOverview {
  totals: {
    totalPatients: number;
    upcomingAppointments: number;
    completedAppointments: number;
    revenueLKR: number;
  };
  topMedications: { medication: string; count: number }[];
}

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

  const enabledModuleKeys = useMemo(
    () => modules.filter((module: EnabledModule) => module.enabled).map((module) => module.key),
    [modules]
  );

  const practiceType = doctorProfile?.practiceType as PracticeType | undefined;
  const practiceLabel = practiceType ? PRACTICE_TYPE_LABELS[practiceType] : undefined;
  const locationBlurb = [practiceLabel, doctorProfile?.location?.trim()].filter(Boolean).join(' • ');
  const greetingName = doctorProfile?.name ? doctorProfile.name.split(' ')[0] : undefined;

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
        }
      ].filter((action) => enabledModuleKeys.includes(action.key)),
    [enabledModuleKeys]
  );

  React.useEffect(() => {
    void refetch();
  }, [refetch]);

  if (isLoading || !data) {
    return (
      <Group justify="center" mt="xl">
        <Loader />
      </Group>
    );
  }

  return (
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
              <Badge color="teal" variant="light" size="sm" radius="sm" style={{ alignSelf: 'flex-start' }}>
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
                  variant="light"
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
  );
};

export default Dashboard;
