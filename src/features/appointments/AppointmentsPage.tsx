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
  Textarea,
  TextInput
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AppointmentEntity, PatientEntity } from '@shared/entities';
import type { AppointmentPayload } from '@shared/payloads';
import { waitForElectronApi } from '@renderer/utils/electronApi';

const initialState: AppointmentPayload = {
  patientId: 0,
  scheduledFor: '',
  doctorNotes: '',
  clinicRoom: ''
};

const AppointmentsPage: FC = () => {
  const queryClient = useQueryClient();
  const [modalOpened, modalHandlers] = useDisclosure(false);
  const [form, setForm] = useState<AppointmentPayload>(initialState);

  const patientsQuery = useQuery<PatientEntity[]>({
    queryKey: ['patients', 'list'],
    queryFn: async () => {
      const api = await waitForElectronApi();
      return api.patients.list();
    },
    staleTime: 10 * 60 * 1000
  });

  const appointmentsQuery = useQuery<AppointmentEntity[]>({
    queryKey: ['appointments', 'list'],
    queryFn: async () => {
      const api = await waitForElectronApi();
      return api.appointments.list();
    },
    refetchOnWindowFocus: false
  });

  const mutation = useMutation<{ id: number }, Error, AppointmentPayload>({
    mutationFn: async (payload: AppointmentPayload) => {
      const api = await waitForElectronApi();
      return api.appointments.add(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', 'list'] });
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

  const handleChange = (field: keyof AppointmentPayload) => (event: ChangeEvent<HTMLInputElement>) => {
    setForm((prev: AppointmentPayload) => ({ ...prev, [field]: event.currentTarget.value }));
  };

  const handleNotesChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setForm((prev: AppointmentPayload) => ({ ...prev, doctorNotes: event.currentTarget.value }));
  };

  const handlePatientSelect = (value: string | null) => {
    setForm((prev: AppointmentPayload) => ({ ...prev, patientId: Number(value ?? 0) }));
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center">
        <Stack gap={0}>
          <Text size="xl" fw={700}>
            Appointment Scheduling
          </Text>
          <Text size="sm" c="dimmed">
            Manage your upcoming consultations and channeling sessions.
          </Text>
        </Stack>
        <Button onClick={modalHandlers.open}>Book appointment</Button>
      </Group>

      <Card withBorder shadow="xs" padding="0">
        <ScrollArea h={540}>
          <Table withTableBorder highlightOnHover striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Date & Time</Table.Th>
                <Table.Th>Patient</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Clinic room</Table.Th>
                <Table.Th>Notes</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {appointmentsQuery.data?.map((appointment: AppointmentEntity) => (
                <Table.Tr key={appointment.id}>
                  <Table.Td>{appointment.scheduledFor}</Table.Td>
                  <Table.Td>{appointment.patientName ?? appointment.patientId}</Table.Td>
                  <Table.Td>{appointment.status}</Table.Td>
                  <Table.Td>{appointment.clinicRoom ?? '—'}</Table.Td>
                  <Table.Td>{appointment.doctorNotes ?? '—'}</Table.Td>
                </Table.Tr>
              ))}
              {appointmentsQuery.data?.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={5}>
                    <Text size="sm" c="dimmed">
                      No appointments yet. Add one to get started.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Card>

      <Modal opened={modalOpened} onClose={modalHandlers.close} title="Book an appointment" size="lg">
        <Stack gap="md">
          <Select
            label="Patient"
            placeholder="Select patient"
            data={patientOptions}
            value={form.patientId ? String(form.patientId) : null}
            onChange={handlePatientSelect}
            searchable
            nothingFoundMessage={patientsQuery.data?.length ? 'No matches' : 'Add patients first'}
          />
          <TextInput
            label="Scheduled for"
            placeholder="YYYY-MM-DD HH:mm"
            value={form.scheduledFor}
            onChange={handleChange('scheduledFor')}
          />
          <TextInput
            label="Clinic room"
            placeholder="Room or facility"
            value={form.clinicRoom ?? ''}
            onChange={handleChange('clinicRoom')}
          />
          <Textarea label="Doctor notes" minRows={3} value={form.doctorNotes ?? ''} onChange={handleNotesChange} />
          <Group justify="flex-end">
            <Button variant="default" onClick={modalHandlers.close}>
              Cancel
            </Button>
            <Button
              loading={mutation.isPending}
              onClick={() => mutation.mutate(form)}
              disabled={!form.patientId || !form.scheduledFor || mutation.isPending}
            >
              Save appointment
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
};

export default AppointmentsPage;
