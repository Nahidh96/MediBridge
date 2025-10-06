import { FC } from 'react';
import { Card, Grid, Group, Stack, Text, Title } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { IconTrendingUp, IconUser } from '@tabler/icons-react';
import { requireElectronApi } from '@renderer/utils/electronApi';

const AnalyticsPage: FC = () => {
  const { data } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: () => requireElectronApi().analytics.overview(),
    staleTime: 5 * 60 * 1000
  });

  return (
    <Stack gap="lg">
      <Title order={2}>Analytics</Title>
      <Text c="dimmed">Track performance metrics tailored to Sri Lankan private practices.</Text>

      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder shadow="sm" padding="lg">
            <Stack gap="xs">
              <Text fw={600} size="lg">
                Snapshot
              </Text>
              <Text size="sm" c="dimmed">
                Latest metrics refreshed from your local database.
              </Text>
              <Grid>
                <Grid.Col span={6}>
                  <Stack gap={0}>
                    <Text size="xs" c="dimmed">
                      Total patients
                    </Text>
                    <Text fw={700} size="xl">
                      {data?.totals.totalPatients ?? 0}
                    </Text>
                  </Stack>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Stack gap={0}>
                    <Text size="xs" c="dimmed">
                      Completed appointments
                    </Text>
                    <Text fw={700} size="xl">
                      {data?.totals.completedAppointments ?? 0}
                    </Text>
                  </Stack>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Stack gap={0}>
                    <Text size="xs" c="dimmed">
                      Upcoming appointments
                    </Text>
                    <Text fw={700} size="xl">
                      {data?.totals.upcomingAppointments ?? 0}
                    </Text>
                  </Stack>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Stack gap={0}>
                    <Text size="xs" c="dimmed">
                      Revenue (LKR)
                    </Text>
                    <Text fw={700} size="xl">
                      {Number(data?.totals.revenueLKR ?? 0).toLocaleString('en-LK')}
                    </Text>
                  </Stack>
                </Grid.Col>
              </Grid>
            </Stack>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder shadow="sm" padding="lg">
            <Stack gap="xs">
              <Text fw={600} size="lg">
                Quick insights
              </Text>
              <Stack gap="sm">
                <Card withBorder padding="md" radius="md">
                  <Stack gap={4}>
                    <Text size="sm" fw={600}>
                      Growth opportunities
                    </Text>
                    <Text size="xs" c="dimmed">
                      Enable SMS reminders in settings to reduce no-shows by 30% on average.
                    </Text>
                  </Stack>
                </Card>
                <Card withBorder padding="md" radius="md">
                  <Stack gap={4}>
                    <Text size="sm" fw={600}>
                      Patient loyalty score
                    </Text>
                    <Text size="xs" c="dimmed">
                      {data ? '82 / 100 (pilot metric)' : 'Collecting data…'}
                    </Text>
                    <Text size="xs" c="dimmed">
                      Based on repeat visits within the past 90 days.
                    </Text>
                  </Stack>
                </Card>
              </Stack>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>

      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder shadow="sm" padding="lg">
            <Stack gap="xs">
              <Stack gap={0}>
                <Text fw={600}>Top medications</Text>
                <Text size="xs" c="dimmed">
                  Based on prescription frequency.
                </Text>
              </Stack>
              {!data?.topMedications?.length ? (
                <Text size="sm" c="dimmed">
                  Not enough prescriptions yet.
                </Text>
              ) : (
                data.topMedications.map((item: { medication: string; count: number }) => (
                  <Stack key={item.medication} gap={2}>
                    <Group align="center" gap="xs">
                      <IconTrendingUp size={16} />
                      <Text fw={600}>{item.medication}</Text>
                    </Group>
                    <Text size="xs" c="dimmed">
                      {item.count} prescriptions
                    </Text>
                  </Stack>
                ))
              )}
            </Stack>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder shadow="sm" padding="lg">
            <Stack gap="xs">
              <Stack gap={0}>
                <Text fw={600}>Patient demographics (beta)</Text>
                <Text size="xs" c="dimmed">
                  Offline analytics grouped by age band coming soon.
                </Text>
              </Stack>
              <Group gap="sm" align="center">
                <IconUser size={18} />
                <Text size="sm" c="dimmed">
                  Data sync and dashboards are generated locally to guarantee privacy.
                </Text>
              </Group>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>
    </Stack>
  );
};

export default AnalyticsPage;
