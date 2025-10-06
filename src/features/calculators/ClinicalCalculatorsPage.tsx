import React, { useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Card,
  Divider,
  Grid,
  Group,
  NumberInput,
  SegmentedControl,
  Stack,
  Text,
  Title
} from '@mantine/core';
import {
  IconActivityHeartbeat,
  IconCalculator,
  IconHeartbeat,
  IconInfoCircle,
  IconScale,
  IconStethoscope
} from '@tabler/icons-react';

type WeightUnit = 'kg' | 'lb';
type HeightUnit = 'cm' | 'ft_in';

interface BmiCategory {
  min: number;
  max: number;
  label: string;
  description: string;
  color: string;
}

const BMI_CATEGORIES: BmiCategory[] = [
  {
    min: 0,
    max: 18.4,
    label: 'Underweight',
    description: 'Encourage nutrition review and rule out underlying causes.',
    color: 'yellow'
  },
  {
    min: 18.5,
    max: 24.9,
    label: 'Healthy range',
    description: 'Maintain current lifestyle and monitoring cadence.',
    color: 'teal'
  },
  {
    min: 25,
    max: 29.9,
    label: 'Overweight',
    description: 'Offer lifestyle counselling and follow-up tracking.',
    color: 'orange'
  },
  {
    min: 30,
    max: Infinity,
    label: 'Obesity',
    description: 'Assess comorbidities and consider multi-disciplinary pathway.',
    color: 'red'
  }
];

const round = (value: number, digits = 1): number =>
  Math.round(value * 10 ** digits) / 10 ** digits;

const toNumber = (value: string | number | null | undefined, fallback = 0): number => {
  if (typeof value === 'number') {
    return Number.isNaN(value) ? fallback : value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
};

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const ClinicalCalculatorsPage: React.FC = () => {
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('kg');
  const [weightValue, setWeightValue] = useState<number>(70);
  const [heightUnit, setHeightUnit] = useState<HeightUnit>('cm');
  const [heightCmValue, setHeightCmValue] = useState<number>(170);
  const [heightFeetValue, setHeightFeetValue] = useState<number>(5);
  const [heightInchesValue, setHeightInchesValue] = useState<number>(7);

  const handleWeightUnitChange = (nextUnit: string) => {
    const castUnit = nextUnit as WeightUnit;
    if (castUnit === weightUnit) {
      return;
    }

    const convertedValue =
      castUnit === 'kg' ? round(weightValue * 0.45359237, 1) : round(weightValue / 0.45359237, 1);
    setWeightUnit(castUnit);
    setWeightValue(convertedValue);
  };

  const handleHeightUnitChange = (nextUnit: string) => {
    const castUnit = nextUnit as HeightUnit;
    if (castUnit === heightUnit) {
      return;
    }

    if (castUnit === 'cm') {
      const totalInches = heightFeetValue * 12 + heightInchesValue;
      setHeightCmValue(round(totalInches * 2.54, 1));
    } else {
      const totalInches = heightCmValue / 2.54;
      const feet = Math.floor(totalInches / 12);
      const inches = Math.round(totalInches - feet * 12);
      setHeightFeetValue(feet || 0);
      setHeightInchesValue(inches);
    }

    setHeightUnit(castUnit);
  };

  const weightKg = useMemo(
    () => (weightUnit === 'kg' ? weightValue : weightValue * 0.45359237),
    [weightUnit, weightValue]
  );

  const heightCm = useMemo(() => {
    if (heightUnit === 'cm') {
      return heightCmValue;
    }
    const totalInches = heightFeetValue * 12 + heightInchesValue;
    return totalInches * 2.54;
  }, [heightUnit, heightCmValue, heightFeetValue, heightInchesValue]);

  const heightMeters = heightCm / 100;

  const bmi = useMemo(() => {
    if (!weightKg || !heightMeters) {
      return null;
    }
    return weightKg / (heightMeters * heightMeters);
  }, [weightKg, heightMeters]);

  const bmiCategory = useMemo(() => {
    if (!bmi) {
      return undefined;
    }
    return BMI_CATEGORIES.find((category) => bmi >= category.min && bmi <= category.max);
  }, [bmi]);

  const healthyWeightRange = useMemo(() => {
    if (!heightMeters) {
      return undefined;
    }
    const min = 18.5 * heightMeters * heightMeters;
    const max = 24.9 * heightMeters * heightMeters;
    return {
      minKg: min,
      maxKg: max,
      minLb: min * 2.20462262,
      maxLb: max * 2.20462262
    };
  }, [heightMeters]);

  const bsa = useMemo(() => {
    if (!heightCm || !weightKg) {
      return null;
    }
    return Math.sqrt((heightCm * weightKg) / 3600);
  }, [heightCm, weightKg]);

  const maintenanceFluidsMl = useMemo(() => {
    if (!weightKg) {
      return null;
    }

    let remaining = weightKg;
    let total = 0;

    if (remaining > 20) {
      total += (remaining - 20) * 20;
      remaining = 20;
    }
    if (remaining > 10) {
      total += (remaining - 10) * 50;
      remaining = 10;
    }
    total += remaining * 100;
    return total;
  }, [weightKg]);

  const renderNumber = (value: number | null, digits = 1) =>
    value === null || Number.isNaN(value) ? '—' : round(value, digits).toFixed(digits);

  return (
    <Stack gap="xl" p="md">
      <Stack gap="xs">
        <Group justify="space-between" align="flex-end">
          <div>
            <Badge color="indigo" size="md" radius="sm" leftSection={<IconCalculator size={14} />}>
              Offline clinical calculators
            </Badge>
            <Title order={2} mt="xs">
              Rapid BMI, BSA & dosing helpers
            </Title>
            <Text c="dimmed" size="sm">
              Designed for Sri Lankan clinics: switch units instantly, keep results private on-device.
            </Text>
          </div>
        </Group>
      </Stack>

      <Grid gutter="xl">
        <Grid.Col span={{ base: 12, lg: 6 }}>
          <Card withBorder shadow="sm" padding="xl" radius="lg">
            <Stack gap="md">
              <Group justify="space-between" align="center">
                <Group gap="sm">
                  <IconScale size={28} color="var(--mantine-color-teal-6)" />
                  <div>
                    <Title order={3}>Body Mass Index</Title>
                    <Text size="sm" c="dimmed">
                      Assess weight category and counsel quickly.
                    </Text>
                  </div>
                </Group>
                {bmi && (
                  <Badge size="lg" color={bmiCategory?.color ?? 'gray'} variant="light">
                    BMI {renderNumber(bmi)}
                  </Badge>
                )}
              </Group>

              <Divider label="Inputs" labelPosition="left" />

              <Stack gap="sm">
                <Text fw={600} size="sm">
                  Weight
                </Text>
                <Group gap="sm" align="flex-end">
                  <NumberInput
                    value={weightValue}
                    onChange={(value) => setWeightValue(Math.max(0, toNumber(value, 0)))}
                    min={0}
                    step={0.5}
                    maw={200}
                    hideControls
                  />
                  <Text size="sm" fw={600} c="dimmed">
                    {weightUnit}
                  </Text>
                  <SegmentedControl
                    value={weightUnit}
                    onChange={handleWeightUnitChange}
                    data={[
                      { label: 'kg', value: 'kg' },
                      { label: 'lb', value: 'lb' }
                    ]}
                  />
                </Group>
              </Stack>

              <Stack gap="sm">
                <Text fw={600} size="sm">
                  Height
                </Text>
                <Group gap="sm" align="flex-end" wrap="wrap">
                  {heightUnit === 'cm' ? (
                    <Group gap="sm" align="flex-end">
                      <NumberInput
                        value={heightCmValue}
                        onChange={(value) => setHeightCmValue(Math.max(0, toNumber(value, 0)))}
                        min={0}
                        step={0.5}
                        maw={200}
                        hideControls
                      />
                      <Text size="sm" fw={600} c="dimmed">
                        cm
                      </Text>
                    </Group>
                  ) : (
                    <Group gap="sm" align="flex-end">
                      <NumberInput
                        value={heightFeetValue}
                        onChange={(value) => setHeightFeetValue(Math.max(0, Math.floor(toNumber(value, 0))))}
                        min={0}
                        step={1}
                        maw={100}
                        hideControls
                        label="ft"
                      />
                      <NumberInput
                        value={heightInchesValue}
                        onChange={(value) =>
                          setHeightInchesValue(clamp(Math.floor(toNumber(value, 0)), 0, 11))
                        }
                        min={0}
                        max={11}
                        step={1}
                        maw={100}
                        hideControls
                        label="in"
                      />
                    </Group>
                  )}
                  <SegmentedControl
                    value={heightUnit}
                    onChange={handleHeightUnitChange}
                    data={[
                      { label: 'cm', value: 'cm' },
                      { label: 'ft/in', value: 'ft_in' }
                    ]}
                  />
                </Group>
              </Stack>

              <Divider label="Insights" labelPosition="left" />

              <Stack gap="sm">
                <Group gap="xs" align="baseline">
                  <IconHeartbeat size={20} color="var(--mantine-color-pink-6)" />
                  <Text fw={600}>Classification</Text>
                </Group>
                <Text>
                  {bmi
                    ? `${bmiCategory?.label ?? 'Not classified'} · ${
                        bmiCategory?.description ?? 'Adjust inputs to calculate classification.'
                      }`
                    : 'Enter weight and height to calculate BMI.'}
                </Text>

                {healthyWeightRange && (
                  <Card radius="md" padding="md" withBorder>
                    <Stack gap={4}>
                      <Text fw={600} size="sm">
                        Healthy weight window
                      </Text>
                      <Text size="sm" c="dimmed">
                        {`${renderNumber(healthyWeightRange.minKg)} – ${renderNumber(healthyWeightRange.maxKg)} kg (${renderNumber(healthyWeightRange.minLb)} – ${renderNumber(healthyWeightRange.maxLb)} lb)`}
                      </Text>
                    </Stack>
                  </Card>
                )}
              </Stack>
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, lg: 6 }}>
          <Stack gap="lg">
            <Card withBorder shadow="sm" padding="xl" radius="lg">
              <Stack gap="md">
                <Group gap="sm">
                  <IconActivityHeartbeat size={28} color="var(--mantine-color-indigo-6)" />
                  <div>
                    <Title order={3}>Body surface area</Title>
                    <Text size="sm" c="dimmed">
                      Mosteller formula (cm, kg) for chemo and paediatric dosing checks.
                    </Text>
                  </div>
                </Group>
                <Card radius="md" padding="md" withBorder>
                  <Stack gap={4}>
                    <Text fw={600} size="sm">
                      Calculated BSA
                    </Text>
                    <Text size="lg" fw={700}>
                      {bsa ? `${renderNumber(bsa)} m²` : '—'}
                    </Text>
                    <Text size="xs" c="dimmed">
                      Inputs reuse weight and height from BMI card.
                    </Text>
                  </Stack>
                </Card>
              </Stack>
            </Card>

            <Card withBorder shadow="sm" padding="xl" radius="lg">
              <Stack gap="md">
                <Group gap="sm">
                  <IconStethoscope size={28} color="var(--mantine-color-teal-6)" />
                  <div>
                    <Title order={3}>Maintenance fluids (adult)</Title>
                    <Text size="sm" c="dimmed">
                      Holliday-Segar approximation for baseline requirements.
                    </Text>
                  </div>
                </Group>
                <Card radius="md" padding="md" withBorder>
                  <Stack gap={4}>
                    <Text fw={600} size="sm">
                      Daily volume
                    </Text>
                    <Text size="lg" fw={700}>
                      {maintenanceFluidsMl ? `${renderNumber(maintenanceFluidsMl, 0)} mL` : '—'}
                    </Text>
                    <Text size="xs" c="dimmed">
                      Weight-based: 100/50/20 rule (use clinical judgement for renal or cardiac limits).
                    </Text>
                  </Stack>
                </Card>
              </Stack>
            </Card>
          </Stack>
        </Grid.Col>
      </Grid>

      <Alert icon={<IconInfoCircle size={18} />} color="yellow" radius="md" variant="light">
        These tools support — not replace — clinical decision making. Always correlate with bedside
        observations and laboratory data before prescribing or discharging.
      </Alert>
    </Stack>
  );
};

export default ClinicalCalculatorsPage;
