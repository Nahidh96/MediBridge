import { useMemo, type ComponentType, type FC } from 'react';
import {
  AppShell,
  Badge,
  Box,
  Burger,
  Divider,
  Group,
  NavLink,
  ScrollArea,
  Stack,
  Text,
  ThemeIcon,
  rem
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import * as TablerIcons from '@tabler/icons-react';
import { useModulesContext } from '../store/ModuleContext';
import type { EnabledModule } from '../hooks/useModules';
import { useDoctorProfile } from '../hooks/useDoctorProfile';
import { PRACTICE_TYPE_LABELS } from '@shared/modules';
import type { PracticeType } from '@shared/setup';

const routeMap: Record<string, string> = {
  dashboard: '/',
  appointments: '/appointments',
  patient_records: '/patients',
  e_prescriptions: '/prescriptions',
  billing: '/billing',
  pharmacy_inventory: '/pharmacy',
  analytics: '/analytics',
  collaboration: '/collaboration',
  medical_certificates: '/certificates',
  clinical_calculators: '/calculators'
};

interface NavItem {
  key: string;
  label: string;
  icon: string;
  path: string;
  description?: string;
}

const ICON_COMPONENTS = TablerIcons as unknown as Record<string, ComponentType<{ size?: number | string }>>;

const AppLayout: FC = () => {
  const modules = useModulesContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [opened, { toggle }] = useDisclosure();
  const { data: doctorProfile } = useDoctorProfile();

  const practiceType = doctorProfile?.practiceType as PracticeType | undefined;
  const practiceLabel = practiceType ? PRACTICE_TYPE_LABELS[practiceType] : undefined;
  const brandTitle = doctorProfile?.centreName?.trim() || doctorProfile?.name || 'MediBridge';
  const headerDescriptor =
    [practiceLabel, doctorProfile?.location?.trim()].filter(Boolean).join(' • ') ||
    'Offline-first · Sri Lanka ready';

  const enabledModules = useMemo(
    () => modules.filter((module: EnabledModule) => module.enabled),
    [modules]
  );

  const navItems = useMemo<NavItem[]>(() => {
    const moduleLinks = enabledModules.map((module: EnabledModule) => ({
      key: module.key,
      label: module.name,
      icon: module.icon,
      path: routeMap[module.key] ?? `/${module.key}`,
      description: module.description
    }));

    return [
      {
        key: 'dashboard',
        label: 'Dashboard',
        icon: 'IconLayoutDashboard',
        path: '/',
        description: 'Overview & daily momentum'
      },
      ...moduleLinks
    ];
  }, [enabledModules]);

  const headerGradient =
    'linear-gradient(135deg, var(--mantine-color-teal-7) 0%, var(--mantine-color-blue-6) 60%, var(--mantine-color-indigo-6) 100%)';

  return (
    <AppShell
      header={{ height: 88 }}
      navbar={{ width: 304, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="lg"
      withBorder={false}
    >
      <AppShell.Header style={{ background: headerGradient }}>
        <Box h="100%" px="lg">
          <Group h="100%" justify="space-between" wrap="nowrap">
            <Group gap="md" wrap="nowrap">
              <Burger
                opened={opened}
                onClick={toggle}
                hiddenFrom="sm"
                size="sm"
                color="var(--mantine-color-white)"
              />
              <Stack gap={4}>
                <Text fw={700} size="lg" c="white">
                  {brandTitle}
                </Text>
                <Group gap={6} wrap="wrap">
                  {practiceLabel && (
                    <Badge color="teal" variant="filled" radius="sm">
                      {practiceLabel}
                    </Badge>
                  )}
                  {doctorProfile?.centreName && (
                    <Badge color="indigo" variant="filled" radius="sm">
                      Trusted centre
                    </Badge>
                  )}
                </Group>
              </Stack>
            </Group>
            <Stack gap={2} align="flex-end">
              <Text size="sm" fw={500} c="white" style={{ opacity: 0.9 }}>
                {headerDescriptor}
              </Text>
              <Group gap={8}>
                <Badge color="teal" variant="outline" radius="sm">
                  Offline ready
                </Badge>
                <Badge color="yellow" radius="sm" variant="light">
                  Secure & private
                </Badge>
              </Group>
            </Stack>
          </Group>
        </Box>
      </AppShell.Header>

      <AppShell.Navbar p="md" withBorder={false}>
        <Stack gap="md" h="100%">
          <Stack gap={2}>
            <Group gap={6}>
              <ThemeIcon size={rem(32)} radius="xl" color="teal" variant="light">
                <TablerIcons.IconHeartbeat size={18} />
              </ThemeIcon>
              <Stack gap={0}>
                <Text fw={600} size="xs" c="dimmed">
                  Navigate MediBridge
                </Text>
                <Text size="xs" c="dimmed" style={{ opacity: 0.7, fontSize: rem(11) }}>
                  Choose a workspace to get started
                </Text>
              </Stack>
            </Group>
            <Divider color="teal.1" />
          </Stack>

          <AppShell.Section component={ScrollArea} type="scroll" flex={1} px={4}>
            <Stack gap={4}>
              {navItems.map((item: NavItem) => {
                const IconComponent = ICON_COMPONENTS[item.icon] ?? TablerIcons.IconCircle;
                const isActive = location.pathname === item.path;
                return (
                  <NavLink
                    key={item.key}
                    label={item.label}
                    description={item.description}
                    active={isActive}
                    variant="light"
                    leftSection={
                      <ThemeIcon
                        size={rem(28)}
                        variant={isActive ? 'filled' : 'light'}
                        color={isActive ? 'teal' : 'teal'}
                        style={{ backgroundColor: isActive ? undefined : 'var(--mantine-color-teal-0)' }}
                      >
                        <IconComponent size={16} />
                      </ThemeIcon>
                    }
                    onClick={() => navigate(item.path)}
                    style={{
                      borderRadius: rem(12),
                      boxShadow: isActive ? '0 12px 24px rgba(0, 128, 96, 0.12)' : '0 4px 12px rgba(15, 23, 42, 0.05)'
                    }}
                    styles={{
                      label: { fontWeight: 600, fontSize: rem(13) },
                      description: { fontSize: rem(11), opacity: 0.7 }
                    }}
                  />
                );
              })}
            </Stack>
          </AppShell.Section>

          <Box
            p="md"
            bg="var(--mantine-color-white)"
            style={{ borderRadius: rem(14), boxShadow: '0 14px 36px rgba(15, 23, 42, 0.12)' }}
          >
            <Stack gap={4}>
              <Group gap={4}>
                <TablerIcons.IconSparkles size={14} color="var(--mantine-color-teal-6)" />
                <Text fw={600} size="xs">
                  Pro tip
                </Text>
              </Group>
              <Text size="xs" c="dimmed" style={{ fontSize: rem(11), lineHeight: 1.4 }}>
                Enable more modules anytime from the setup wizard to unlock richer clinic workflows.
              </Text>
            </Stack>
          </Box>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <Box maw={1200} mx="auto" w="100%" px="md" pb="xl">
          <Outlet />
        </Box>
      </AppShell.Main>
    </AppShell>
  );
};

export default AppLayout;
