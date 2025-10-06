import { useState, type ChangeEvent, type FC } from 'react';
import {
  Button,
  Card,
  Group,
  Modal,
  ScrollArea,
  Stack,
  Table,
  Text,
  TextInput
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PatientEntity } from '@shared/entities';
import type { PatientPayload } from '@shared/payloads';
import { waitForElectronApi } from '@renderer/utils/electronApi';

const initialState: PatientPayload = {
  fullName: '',
  nic: '',
  contact: '',
  dob: '',
  allergies: '',
  notes: ''
};

const PatientsPage: FC = () => {
  const queryClient = useQueryClient();
  const [modalOpened, modalHandlers] = useDisclosure(false);
  const [form, setForm] = useState<PatientPayload>(initialState);

  const patientsQuery = useQuery<PatientEntity[]>({
    queryKey: ['patients', 'list'],
    queryFn: async () => {
      const api = await waitForElectronApi();
      return api.patients.list();
    },
    refetchOnWindowFocus: false
  });

  const mutation = useMutation<{ id: number }, Error, PatientPayload>({
    mutationFn: async (payload: PatientPayload) => {
      const api = await waitForElectronApi();
      return api.patients.add(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients', 'list'] });
      setForm(initialState);
      modalHandlers.close();
    }
  });

  const handleChange = (field: keyof PatientPayload) => (event: ChangeEvent<HTMLInputElement>) => {
    setForm((prev: PatientPayload) => ({ ...prev, [field]: event.currentTarget.value }));
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center">
        <Stack gap={0}>
          <Text size="xl" fw={700}>
            Patient Records
          </Text>
          <Text size="sm" c="dimmed">
            Offline-first health records, accessible across all configured modules.
          </Text>
        </Stack>
        <Button onClick={modalHandlers.open}>Add patient</Button>
      </Group>

      <Card withBorder shadow="xs" padding="0">
        <ScrollArea h={540}>
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Contact</Table.Th>
                <Table.Th>NIC</Table.Th>
                <Table.Th>Allergies</Table.Th>
                <Table.Th>Notes</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {patientsQuery.data?.map((patient: PatientEntity) => (
                <Table.Tr key={patient.id}>
                  <Table.Td>{patient.full_name}</Table.Td>
                  <Table.Td>{patient.contact ?? '—'}</Table.Td>
                  <Table.Td>{patient.nic ?? '—'}</Table.Td>
                  <Table.Td>{patient.allergies ?? '—'}</Table.Td>
                  <Table.Td>{patient.notes ?? '—'}</Table.Td>
                </Table.Tr>
              ))}
              {patientsQuery.data?.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={5}>
                    <Text size="sm" c="dimmed">
                      No patients recorded yet.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Card>

      <Modal opened={modalOpened} onClose={modalHandlers.close} title="Add new patient" size="lg">
        <Stack gap="md">
          <TextInput
            label="Full name"
            required
            value={form.fullName}
            onChange={handleChange('fullName')}
          />
          <Group grow>
            <TextInput label="NIC" value={form.nic} onChange={handleChange('nic')} />
            <TextInput label="Contact" value={form.contact} onChange={handleChange('contact')} />
          </Group>
          <TextInput label="Date of birth" value={form.dob} onChange={handleChange('dob')} placeholder="YYYY-MM-DD" />
          <TextInput label="Allergies" value={form.allergies} onChange={handleChange('allergies')} />
          <TextInput label="Notes" value={form.notes} onChange={handleChange('notes')} />
          <Group justify="flex-end">
            <Button variant="default" onClick={modalHandlers.close}>
              Cancel
            </Button>
            <Button loading={mutation.isPending} onClick={() => mutation.mutate(form)} disabled={mutation.isPending}>
              Save patient
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
};

export default PatientsPage;
