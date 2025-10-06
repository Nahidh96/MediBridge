import React from 'react';
import {
  Badge,
  Button,
  Card,
  Grid,
  Group,
  Loader,
  Paper,
  Progress,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
  useMantineTheme
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import {
  IconUsersGroup,
  IconCalendarTime,
  IconCurrencyRupee,
  IconHeartbeat,
  IconArrowRight,
  IconClipboardText
} from '@tabler/icons-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { waitForElectronApi } from '@renderer/utils/electronApi';
import { useDoctorProfile } from '@renderer/hooks/useDoctorProfile';
import { useModulesContext } from '@renderer/store/ModuleContext';
import { PRACTICE_TYPE_LABELS } from '@shared/modules';
import type { PracticeType } from '@shared/setup';

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
  const theme = useMantineTheme();
  const navigate = useNavigate();
  const modules = useModulesContext();
  const { data, isLoading, refetch } = useQuery<AnalyticsOverview>({
    queryKey: ['analytics', 'overview'],
    queryFn: async () => {
      const api = await waitForElectronApi();
      return api.analytics.overview();
    },
    refetchOnWindowFocus: false
  });
  const { data: doctorProfile } = useDoctorProfile();

  const practiceType = doctorProfile?.practiceType as PracticeType | undefined;
  const practiceLabel = practiceType ? PRACTICE_TYPE_LABELS[practiceType] : undefined;
  const locationBlurb = [practiceLabel, doctorProfile?.location?.trim()].filter(Boolean).join(' • ');
  const greetingName = doctorProfile?.name ? doctorProfile.name.split(' ')[0] : undefined;
  const centreName = doctorProfile?.centreName ?? `Your MediBridge HQ`;
  const quickActionModules = useMemo(
    () =>
      modules
        .filter((module) => module.enabled)
        .filter((module) => ['appointments', 'patient_records', 'medical_certificates', 'billing'].includes(module.key))
        .slice(0, 3),
    [modules]
  );

  const moduleRoutes: Record<string, string> = {
    appointments: '/appointments',
    patient_records: '/patients',
    e_prescriptions: '/prescriptions',
    billing: '/billing',
    pharmacy_inventory: '/pharmacy',
    analytics: '/analytics',
    collaboration: '/collaboration',
    medical_certificates: '/certificates'
  };

  const totalAppointments = data?.totals.upcomingAppointments ?? 0;
  const completedAppointments = data?.totals.completedAppointments ?? 0;
  const appointmentCompletionRate = useMemo(() => {
    const total = totalAppointments + completedAppointments;
    if (!total) return 0;
    return Math.round((completedAppointments / total) * 100);
  }, [completedAppointments, totalAppointments]);

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
        radius="lg"
        padding="xl"
        withBorder
        style={{
          background: `linear-gradient(135deg, ${theme.colors.blue[6]} 0%, ${theme.colors.indigo[5]} 50%, ${theme.colors.cyan[5]} 100%)`,
          color: theme.white
        }}
      >
        <Stack gap="md">
          <Group justify="space-between" align="flex-start">
            <Stack gap={4}>
              <Title order={2} c="white">
                Welcome back{greetingName ? `, ${greetingName}` : ''}
              </Title>
              <Text size="lg" fw={600} c="white">
                {centreName}
              </Text>
              <Text size="sm" c="rgba(255,255,255,0.75)">
                {locationBlurb || 'Ready to deliver exceptional care today.'}
              </Text>
              <Group gap="xs">
                {practiceLabel && (
                  <Badge
                    color="gray"
                    variant="outline"
                    style={{ borderColor: 'rgba(255,255,255,0.65)', color: theme.white }}
                  >
                    {practiceLabel}
                  </Badge>
                )}
                <Badge variant="light" color="teal">
                  {data.totals.totalPatients} patients on record
                </Badge>
                <Badge variant="light" color="yellow">
                  {totalAppointments} upcoming visits
                </Badge>
              </Group>
            </Stack>
            <Paper
              withBorder
              radius="lg"
              p="lg"
              style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
              maw={320}
            >
              <Stack gap="sm">
                <Group gap="xs">
                  <ThemeIcon variant="light" color="teal" radius="md">
                    <IconHeartbeat size={20} />
                  </ThemeIcon>
                  <Text fw={600} c="white">
                    Today’s care pulse
                  </Text>
                </Group>
                <Text size="sm" c="rgba(255,255,255,0.75)">
                  {completedAppointments} appointments already wrapped up. Keep the momentum going!
                </Text>
                <Stack gap={4}>
                  <Group justify="space-between" gap="xs">
                    <Text size="xs" c="rgba(255,255,255,0.6)">
                      Completion rate
                    </Text>
                    <Text size="xs" fw={600} c="white">
                      {appointmentCompletionRate}%
                    </Text>
                  </Group>
                  <Progress color="teal" value={appointmentCompletionRate} radius="xl" />
                </Stack>
              </Stack>
            </Paper>
          </Group>
          {quickActionModules.length > 0 && (
            <Group gap="sm" wrap="wrap">
              {quickActionModules.map((module) => (
                <Button
                  key={module.key}
                  variant="light"
                  color="dark"
                  rightSection={<IconArrowRight size={16} />}
                  onClick={() => navigate(moduleRoutes[module.key] ?? '/')}
                >
                  Open {module.name}
                </Button>
              ))}
              <Button
                variant="default"
                color="gray"
                onClick={() => navigate('/analytics')}
                rightSection={<IconClipboardText size={16} />}
              >
                View analytics
              </Button>
            </Group>
          )}
        </Stack>
      </Card>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
        <Card shadow="sm" withBorder padding="xl">
          <Group>
            <ThemeIcon color="blue" radius="md" size={46}>
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
                Growing patient base keeps your practice thriving.
              </Text>
            </div>
          </Group>
        </Card>
        <Card shadow="sm" withBorder padding="xl">
          <Group>
            <ThemeIcon color="green" radius="md" size={46}>
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
                {appointmentCompletionRate}% completed so far today.
              </Text>
            </div>
          </Group>
        </Card>
        <Card shadow="sm" withBorder padding="xl">
          <Group>
            <ThemeIcon color="orange" radius="md" size={46}>
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
                Track payments and balances in real time.
              </Text>
            </div>
          </Group>
        </Card>
      </SimpleGrid>

      <Card withBorder shadow="sm" padding="xl" radius="lg">
        <Stack gap="sm">
          <Group justify="space-between">
            <Title order={4}>Top prescribed medications</Title>
            <Badge color="blue" variant="light">
              Snapshot of recent scripts
            </Badge>
          </Group>
          {data.topMedications.length === 0 ? (
            <Text size="sm" c="dimmed">
              No prescriptions recorded yet.
            </Text>
          ) : (
            <Grid>
              {data.topMedications.map((item) => (
                <Grid.Col key={item.medication} span={{ base: 12, sm: 6, md: 4 }}>
                  <Card withBorder shadow="xs" padding="md">
                    <Stack gap={2}>
                      <Text fw={600}>{item.medication}</Text>
                      <Text size="xs" c="dimmed">
                        {item.count} prescriptions
                      </Text>
                    </Stack>
                  </Card>
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
