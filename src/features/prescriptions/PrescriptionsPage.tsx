import { useMemo, useState, type ChangeEvent, type FC } from 'react';
import {
  Button,
  Card,
  Group,
  Modal,
  ScrollArea,
  Select,
  Stack,
  Table,
  Text,
  TextInput
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PatientEntity, PrescriptionEntity } from '@shared/entities';
import type { PrescriptionPayload } from '@shared/payloads';
import { waitForElectronApi } from '@renderer/utils/electronApi';

const initialState: PrescriptionPayload = {
  patientId: 0,
  diagnosis: '',
  medication: '',
  dosage: '',
  duration: ''
};

const PrescriptionsPage: FC = () => {
  const queryClient = useQueryClient();
  const [modalOpened, modalHandlers] = useDisclosure(false);
  const [form, setForm] = useState<PrescriptionPayload>(initialState);

  const patientsQuery = useQuery<PatientEntity[]>({
    queryKey: ['patients', 'list'],
    queryFn: async () => {
      const api = await waitForElectronApi();
      return api.patients.list();
    },
    staleTime: 10 * 60 * 1000
  });

  const prescriptionsQuery = useQuery<PrescriptionEntity[]>({
    queryKey: ['prescriptions', 'list'],
    queryFn: async () => {
      const api = await waitForElectronApi();
      return api.prescriptions.list();
    },
    refetchOnWindowFocus: false
  });

  const mutation = useMutation<{ id: number }, Error, PrescriptionPayload>({
    mutationFn: async (payload: PrescriptionPayload) => {
      const api = await waitForElectronApi();
      return api.prescriptions.add(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions', 'list'] });
      setForm(initialState);
      modalHandlers.close();
    }
  });

  const patientOptions = useMemo(
    () =>
      patientsQuery.data?.map((patient: PatientEntity) => ({
        value: String(patient.id),
        label: patient.full_name
      })) ?? [],
    [patientsQuery.data]
  );

  const handleChange = (field: keyof PrescriptionPayload) => (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev: PrescriptionPayload) => ({ ...prev, [field]: event.currentTarget.value }));
  };

  const handlePatientSelect = (value: string | null) => {
    setForm((prev: PrescriptionPayload) => ({ ...prev, patientId: Number(value ?? 0) }));
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center">
        <Stack gap={0}>
          <Text size="xl" fw={700}>
            E-Prescriptions
          </Text>
          <Text size="sm" c="dimmed">
            Issue clear, printable prescriptions tailored to Sri Lankan pharmacies.
          </Text>
        </Stack>
        <Button onClick={modalHandlers.open}>New prescription</Button>
      </Group>

      <Card withBorder shadow="xs" padding="0">
        <ScrollArea h={540}>
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Issued</Table.Th>
                <Table.Th>Patient</Table.Th>
                <Table.Th>Diagnosis</Table.Th>
                <Table.Th>Medication</Table.Th>
                <Table.Th>Dosage</Table.Th>
                <Table.Th>Duration</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {prescriptionsQuery.data?.map((item: PrescriptionEntity) => (
                <Table.Tr key={item.id}>
                  <Table.Td>{item.issuedAt}</Table.Td>
                  <Table.Td>{item.patientName ?? item.patientId}</Table.Td>
                  <Table.Td>{item.diagnosis}</Table.Td>
                  <Table.Td>{item.medication}</Table.Td>
                  <Table.Td>{item.dosage}</Table.Td>
                  <Table.Td>{item.duration}</Table.Td>
                </Table.Tr>
              ))}
              {prescriptionsQuery.data?.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={6}>
                    <Text size="sm" c="dimmed">
                      No prescriptions yet. Create one to get started.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Card>

      <Modal opened={modalOpened} onClose={modalHandlers.close} title="New prescription" size="lg">
        <Stack gap="md">
          <Select
            label="Patient"
            placeholder="Select patient"
            data={patientOptions}
            value={form.patientId ? String(form.patientId) : null}
            onChange={handlePatientSelect}
            searchable
          />
          <TextInput
            label="Diagnosis"
            required
            value={form.diagnosis}
            onChange={handleChange('diagnosis')}
          />
          <TextInput
            label="Medication"
            required
            value={form.medication}
            onChange={handleChange('medication')}
          />
          <TextInput
            label="Dosage instructions"
            required
            value={form.dosage}
            onChange={handleChange('dosage')}
          />
          <TextInput
            label="Duration"
            required
            value={form.duration}
            onChange={handleChange('duration')}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={modalHandlers.close}>
              Cancel
            </Button>
            <Button
              loading={mutation.isPending}
              onClick={() => mutation.mutate(form)}
              disabled={!form.patientId || !form.diagnosis || !form.medication || mutation.isPending}
            >
              Save prescription
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
};

export default PrescriptionsPage;
