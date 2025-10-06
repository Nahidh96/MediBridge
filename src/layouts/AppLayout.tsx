import { useMemo, type ComponentType, type FC } from 'react';
import {
  ActionIcon,
  AppShell,
  Avatar,
  Badge,
  Burger,
  Divider,
  Group,
  NavLink,
  Paper,
  ScrollArea,
  Stack,
  Text,
  rem,
  ThemeIcon,
  useMantineTheme
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import * as TablerIcons from '@tabler/icons-react';
import { IconArrowsLeftRight } from '@tabler/icons-react';
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
  medical_certificates: '/certificates'
};

interface NavItem {
  key: string;
  label: string;
  icon: string;
  path: string;
}

const ICON_COMPONENTS = TablerIcons as unknown as Record<string, ComponentType<{ size?: number | string }>>;

const AppLayout: FC = () => {
  const modules = useModulesContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [opened, { toggle }] = useDisclosure();
  const theme = useMantineTheme();
  const { data: doctorProfile } = useDoctorProfile();

  const practiceType = doctorProfile?.practiceType as PracticeType | undefined;
  const practiceLabel = practiceType ? PRACTICE_TYPE_LABELS[practiceType] : undefined;
  const brandTitle = doctorProfile?.centreName?.trim() || doctorProfile?.name || 'MediBridge';
  const brandSubtitle = doctorProfile?.centreName?.trim()
    ? doctorProfile?.name || practiceLabel || 'Powered by MediBridge'
    : practiceLabel || 'Offline-first · Sri Lanka ready';
  const headerDescriptor =
    [practiceLabel, doctorProfile?.location?.trim()].filter(Boolean).join(' • ') ||
    'Offline-first · Sri Lanka ready';
  const doctorInitials = useMemo(() => {
    const source = doctorProfile?.centreName || doctorProfile?.name || 'MB';
    return source
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }, [doctorProfile?.centreName, doctorProfile?.name]);

  const enabledModules = useMemo(
    () => modules.filter((module: EnabledModule) => module.enabled),
    [modules]
  );

  const navItems = useMemo<NavItem[]>(
    () => {
      const moduleLinks = enabledModules.map((module: EnabledModule) => ({
        key: module.key,
        label: module.name,
        icon: module.icon,
        path: routeMap[module.key] ?? `/${module.key}`
      }));

      return [
        {
          key: 'dashboard',
          label: 'Dashboard',
          icon: 'IconHome',
          path: '/'
        },
        ...moduleLinks
      ];
    },
    [enabledModules]
  );

  return (
    <AppShell
      header={{ height: 64 }}
      navbar={{ width: 260, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header
        withBorder={false}
        style={{
          background: `linear-gradient(135deg, ${theme.colors.blue[6]} 0%, ${theme.colors.cyan[5]} 100%)`,
          color: theme.white
        }}
      >
        <Group h="100%" px="lg" justify="space-between">
          <Group gap="sm">
            <Burger
              color="white"
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
            />
            <Avatar
              radius="xl"
              variant="filled"
              color="dark"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: theme.white }}
            >
              {doctorInitials}
            </Avatar>
            <Stack gap={0}>
              <Text fw={700} size="lg">
                {brandTitle}
              </Text>
              <Group gap={6} wrap="nowrap">
                <Text size="xs" fw={500} c="rgba(255,255,255,0.8)">
                  {brandSubtitle}
                </Text>
                {practiceLabel && (
                  <Badge
                    size="xs"
                    variant="light"
                    color="gray"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.65)',
                      color: theme.black
                    }}
                  >
                    {practiceLabel}
                  </Badge>
                )}
              </Group>
            </Stack>
          </Group>
          <Group gap="sm">
            <Badge
              variant="light"
              color="gray"
              size="sm"
              style={{
                backgroundColor: 'rgba(255,255,255,0.7)',
                color: theme.black,
                fontWeight: 500
              }}
            >
              {headerDescriptor}
            </Badge>
            <Badge color="teal" variant="filled" size="sm">
              Offline ready
            </Badge>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Stack gap="sm" h="100%">
          <Stack gap="xs">
            <Text
              size="xs"
              c="dimmed"
              fw={600}
              tt="uppercase"
              style={{ letterSpacing: '0.08em' }}
            >
              Workspace
            </Text>
            <Paper radius="md" withBorder shadow="xs" p="sm">
              <Group justify="space-between" align="center">
                <Text size="sm" fw={600}>
                  Modules in use
                </Text>
                <Badge size="sm" variant="light" color="blue">
                  {enabledModules.length}
                </Badge>
              </Group>
              <Divider my="sm" variant="dashed" />
              <Text size="xs" c="dimmed">
                Select a module to jump straight into your workflow.
              </Text>
            </Paper>
          </Stack>
          <Divider variant="dashed" />
          <AppShell.Section component={ScrollArea.Autosize} px={2}>
            <Stack gap={6}>
              {navItems.map((item: NavItem) => {
                const IconComponent = ICON_COMPONENTS[item.icon] ?? TablerIcons.IconCircle;
                const isActive = location.pathname === item.path;
                return (
                  <NavLink
                    key={item.key}
                    label={item.label}
                    active={isActive}
                    leftSection={
                      <ThemeIcon
                        size={rem(30)}
                        radius="md"
                        variant={isActive ? 'filled' : 'light'}
                        color={isActive ? 'blue' : 'gray'}
                      >
                        <IconComponent size={18} />
                      </ThemeIcon>
                    }
                    styles={{
                      root: {
                        borderRadius: rem(12),
                        paddingInline: rem(12),
                        paddingBlock: rem(10),
                        transition: 'all 120ms ease',
                        backgroundColor: isActive ? theme.colors.blue[0] : undefined,
                        boxShadow: isActive ? '0 4px 12px rgba(30, 144, 255, 0.15)' : undefined
                      },
                      label: {
                        fontWeight: 600,
                        color: isActive ? theme.colors.blue[7] : theme.black
                      }
                    }}
                    onClick={() => navigate(item.path)}
                    rightSection={
                      isActive ? (
                        <ActionIcon size="sm" variant="subtle" color="blue" aria-label="Current view">
                          <IconArrowsLeftRight size={14} />
                        </ActionIcon>
                      ) : undefined
                    }
                  />
                );
              })}
            </Stack>
          </AppShell.Section>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
};

export default AppLayout;
