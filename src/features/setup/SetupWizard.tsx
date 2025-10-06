import { useState, useMemo, type ChangeEvent, type ComponentType, type FC } from 'react';
import {
  Anchor,
  Badge,
  Button,
  Card,
  Checkbox,
  Group,
  Grid,
  Stepper,
  Stack,
  Text,
  TextInput,
  Title,
  Select,
  List
} from '@mantine/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as TablerIcons from '@tabler/icons-react';
import { MODULES, PRACTICE_TYPE_LABELS, getDefaultModules } from '@shared/modules';
import type { SetupAnswers, PracticeType } from '@shared/setup';
import { waitForElectronApi, getElectronApi, BridgeUnavailableError } from '@renderer/utils/electronApi';

interface SetupWizardProps {
  onComplete: () => void;
}

type ModuleDescriptor = (typeof MODULES)[number];

const practiceEntries = Object.entries(PRACTICE_TYPE_LABELS) as [PracticeType, string][];
const practiceOptions: { value: PracticeType; label: string }[] = practiceEntries.map(([value, label]) => ({
  value,
  label
}));

const ICON_COMPONENTS = TablerIcons as unknown as Record<
  string,
  ComponentType<{ size?: number | string; color?: string }>
>;

const SetupWizard: FC<SetupWizardProps> = ({ onComplete }: SetupWizardProps) => {
  const queryClient = useQueryClient();
  const [activeStep, setActiveStep] = useState(0);
  const [form, setForm] = useState<SetupAnswers>({
    name: '',
    specialty: '',
    practiceType: 'private_practice',
    centreName: '',
    location: '',
    modules: getDefaultModules('private_practice')
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mutation = useMutation<{ success: boolean }, Error, SetupAnswers>({
    mutationFn: async (payload: SetupAnswers) => {
      const api = await waitForElectronApi();
      return api.setup.completeSetup(payload);
    },
    onMutate: () => {
      setErrorMessage(null);
    },
    onSuccess: async (_data, variables) => {
      queryClient.setQueryData(['setup', 'status'], true);
      queryClient.setQueryData(['modules', 'enabled'], MODULES.map((module: ModuleDescriptor) => ({
        ...module,
        enabled: variables.modules.includes(module.key)
      })));

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['setup', 'status'] }),
        queryClient.invalidateQueries({ queryKey: ['modules', 'enabled'] }),
        queryClient.invalidateQueries({ queryKey: ['setup', 'profile'] })
      ]);

      onComplete();
    },
    onError: (error) => {
      const bridgeMissing = error instanceof BridgeUnavailableError || !getElectronApi();
      const message = bridgeMissing
        ? 'The desktop bridge is unavailable. Please relaunch the MediBridge app from its desktop shortcut.'
        : error?.message ?? 'Something went wrong while saving your setup.';
      setErrorMessage(message);
    }
  });

  const recommended = useMemo(() => new Set(getDefaultModules(form.practiceType)), [form.practiceType]);

  const toggleModule = (key: string) => {
    setForm((prev: SetupAnswers) => {
      const modules = prev.modules.includes(key)
        ? prev.modules.filter((moduleKey: string) => moduleKey !== key)
        : [...prev.modules, key];
      return { ...prev, modules };
    });
  };

  const handlePracticeChange = (value: string | null) => {
    if (!value) return;
    setForm((prev: SetupAnswers) => ({
      ...prev,
      practiceType: value as PracticeType,
      modules: Array.from(new Set([...prev.modules, ...getDefaultModules(value as PracticeType)]))
    }));
  };

  const nextStep = () => setActiveStep((current: number) => Math.min(current + 1, 2));
  const prevStep = () => setActiveStep((current: number) => Math.max(current - 1, 0));

  const canSubmit = form.name.trim() && form.specialty.trim() && form.modules.length > 0;

  return (
    <Stack maw={960} mx="auto" my={40} p="lg">
      <Title order={2}>Let’s tailor MediBridge for your practice</Title>
      <Text c="dimmed">Answer a few quick questions so we can enable the right tools for you.</Text>

      <Stepper active={activeStep} onStepClick={setActiveStep} allowNextStepsSelect={false} mt="xl">
        <Stepper.Step label="Practice Profile" description="Tell us about yourself">
          <Grid mt="lg" gutter="xl">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label="Doctor / Practice Name"
                required
                value={form.name}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setForm({ ...form, name: event.currentTarget.value })
                }
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label="Medical Centre Name (Optional)"
                value={form.centreName ?? ''}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setForm({ ...form, centreName: event.currentTarget.value })
                }
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label="Specialty"
                required
                value={form.specialty}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setForm({ ...form, specialty: event.currentTarget.value })
                }
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label="Type of Practice"
                data={practiceOptions}
                required
                value={form.practiceType}
                onChange={handlePracticeChange}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label="Location (Optional)"
                value={form.location ?? ''}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setForm({ ...form, location: event.currentTarget.value })
                }
              />
            </Grid.Col>
          </Grid>
        </Stepper.Step>

        <Stepper.Step label="Feature Modules" description="Pick what you need">
          <Stack mt="lg" gap="md">
            <Text size="sm" c="dimmed">
              Recommended modules for a {PRACTICE_TYPE_LABELS[form.practiceType]} are preselected. You can
              always adjust this later in Settings.
            </Text>
            <Grid gutter="lg">
              {MODULES.map((module: ModuleDescriptor) => {
                const IconComponent = ICON_COMPONENTS[module.icon] ?? TablerIcons.IconGridDots;
                const isSelected = form.modules.includes(module.key);
                const isRecommended = recommended.has(module.key);
                return (
                  <Grid.Col key={module.key} span={{ base: 12, sm: 6, md: 4 }}>
                    <Card
                      padding="lg"
                      withBorder
                      radius="md"
                      shadow={isSelected ? 'md' : 'xs'}
                      style={{
                        borderColor: isSelected ? 'var(--mantine-color-blue-5)' : undefined
                      }}
                    >
                      <Stack gap="sm">
                        <Group justify="space-between" align="center">
                          <Group gap="sm">
                            <IconComponent size={26} color="var(--mantine-color-blue-5)" />
                            <Text fw={600}>{module.name}</Text>
                          </Group>
                          {isRecommended && <Badge color="blue">Recommended</Badge>}
                        </Group>
                        <Text size="sm" c="dimmed">
                          {module.description}
                        </Text>
                        <Checkbox
                          checked={isSelected}
                          label={isSelected ? 'Enabled' : 'Enable module'}
                          onChange={() => toggleModule(module.key)}
                        />
                      </Stack>
                    </Card>
                  </Grid.Col>
                );
              })}
            </Grid>
          </Stack>
        </Stepper.Step>

        <Stepper.Completed>
          <Stack gap="md" mt="lg">
            <Title order={3}>Review & confirm</Title>
            <Text size="sm" c="dimmed">
              Make sure everything looks right before we set up the database.
            </Text>
            <Card withBorder shadow="sm" radius="md" padding="lg">
              <Stack gap="sm">
                <Text fw={600}>Practice Summary</Text>
                <List spacing="xs" size="sm">
                  <List.Item>Doctor: {form.name}</List.Item>
                  <List.Item>Specialty: {form.specialty}</List.Item>
                  <List.Item>Practice type: {PRACTICE_TYPE_LABELS[form.practiceType]}</List.Item>
                  {form.centreName && <List.Item>Medical centre: {form.centreName}</List.Item>}
                  {form.location && <List.Item>Location: {form.location}</List.Item>}
                </List>
              </Stack>
            </Card>

            <Card withBorder shadow="sm" radius="md" padding="lg">
              <Stack gap="xs">
                <Text fw={600}>Enabled Modules</Text>
                <List spacing="xs" size="sm">
                  {form.modules.map((moduleKey: string) => {
                    const module = MODULES.find(
                      (item: ModuleDescriptor) => item.key === moduleKey
                    );
                    return <List.Item key={moduleKey}>{module?.name ?? moduleKey}</List.Item>;
                  })}
                </List>
                <Anchor size="xs" onClick={() => setActiveStep(1)}>
                  Adjust modules
                </Anchor>
              </Stack>
            </Card>
          </Stack>
        </Stepper.Completed>
      </Stepper>

      {errorMessage && (
        <Text c="red" size="sm">
          {errorMessage}
        </Text>
      )}

      <Group justify="space-between" mt="xl">
        <Button variant="subtle" disabled={activeStep === 0} onClick={prevStep}>
          Back
        </Button>
        {activeStep < 2 && (
          <Button
            onClick={nextStep}
            disabled={activeStep === 0 && (!form.name.trim() || !form.specialty.trim())}
          >
            Continue
          </Button>
        )}
        {activeStep === 2 && (
          <Button
            loading={mutation.isPending}
            onClick={() =>
              mutation.mutate({
                ...form,
                centreName: form.centreName?.trim() || undefined,
                location: form.location?.trim() || undefined
              })
            }
            disabled={!canSubmit || mutation.isPending}
          >
            Finish setup
          </Button>
        )}
      </Group>
    </Stack>
  );
};

export default SetupWizard;
