import { useState, type ChangeEvent, type FC } from 'react';
import {
  Button,
  Card,
  Group,
  Modal,
  NumberInput,
  ScrollArea,
  Select,
  Stack,
  Table,
  Text,
  TextInput
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { BillingEntity, PatientEntity } from '@shared/entities';
import type { BillingPayload } from '@shared/payloads';
import { waitForElectronApi } from '@renderer/utils/electronApi';

const initialState: BillingPayload = {
  patientId: 0,
  amount: 2500,
  paymentMethod: 'Cash',
  notes: ''
};

const BillingPage: FC = () => {
  const queryClient = useQueryClient();
  const [modalOpened, modalHandlers] = useDisclosure(false);
  const [form, setForm] = useState<BillingPayload>(initialState);

  const patientsQuery = useQuery<PatientEntity[]>({
    queryKey: ['patients', 'list'],
    queryFn: async () => {
      const api = await waitForElectronApi();
      return api.patients.list();
    },
    staleTime: 10 * 60 * 1000
  });

  const billingQuery = useQuery<BillingEntity[]>({
    queryKey: ['billing', 'list'],
    queryFn: async () => {
      const api = await waitForElectronApi();
      return api.billing.list();
    },
    refetchOnWindowFocus: false
  });

  const mutation = useMutation<{ id: number }, Error, BillingPayload>({
    mutationFn: async (payload: BillingPayload) => {
      const api = await waitForElectronApi();
      return api.billing.recordPayment(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing', 'list'] });
      setForm(initialState);
      modalHandlers.close();
    }
  });

  const handleNotesChange = (event: ChangeEvent<HTMLInputElement>) => {
    setForm((prev: BillingPayload) => ({ ...prev, notes: event.currentTarget.value }));
  };

  const handlePatientSelect = (value: string | null) => {
    setForm((prev: BillingPayload) => ({ ...prev, patientId: Number(value ?? 0) }));
  };

  const handleAmountChange = (value: string | number) => {
    const numeric = typeof value === 'number' ? value : Number(value);
    setForm((prev: BillingPayload) => ({ ...prev, amount: Number.isNaN(numeric) ? 0 : numeric }));
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center">
        <Stack gap={0}>
          <Text size="xl" fw={700}>
            Billing & Payments
          </Text>
          <Text size="sm" c="dimmed">
            Record settlements in LKR without needing an internet connection.
          </Text>
        </Stack>
        <Button onClick={modalHandlers.open}>Record payment</Button>
      </Group>

      <Card withBorder shadow="xs" padding="0">
        <ScrollArea h={540}>
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Date</Table.Th>
                <Table.Th>Patient</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Amount (LKR)</Table.Th>
                <Table.Th>Method</Table.Th>
                <Table.Th>Notes</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {billingQuery.data?.map((item: BillingEntity) => (
                <Table.Tr key={item.id}>
                  <Table.Td>{item.createdAt}</Table.Td>
                  <Table.Td>{item.patientName ?? item.patientId}</Table.Td>
                  <Table.Td>{item.status}</Table.Td>
                  <Table.Td>{Number(item.amount).toLocaleString('en-LK')}</Table.Td>
                  <Table.Td>{item.paymentMethod ?? '—'}</Table.Td>
                  <Table.Td>{item.notes ?? '—'}</Table.Td>
                </Table.Tr>
              ))}
              {billingQuery.data?.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={6}>
                    <Text size="sm" c="dimmed">
                      No billing records yet.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Card>

      <Modal opened={modalOpened} onClose={modalHandlers.close} title="Record payment" size="lg">
        <Stack gap="md">
          <Select
            label="Patient"
            placeholder="Select patient"
            data={
              patientsQuery.data?.map((patient: PatientEntity) => ({
                value: String(patient.id),
                label: patient.full_name
              })) ?? []
            }
            value={form.patientId ? String(form.patientId) : null}
            onChange={handlePatientSelect}
            searchable
          />
          <NumberInput
            label="Amount (LKR)"
            min={0}
            value={form.amount}
            onChange={handleAmountChange}
          />
          <TextInput
            label="Payment method"
            value={form.paymentMethod ?? ''}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setForm((prev: BillingPayload) => ({
                ...prev,
                paymentMethod: event.currentTarget.value
              }))
            }
          />
          <TextInput label="Notes" value={form.notes ?? ''} onChange={handleNotesChange} />
          <Group justify="flex-end">
            <Button variant="default" onClick={modalHandlers.close}>
              Cancel
            </Button>
            <Button
              loading={mutation.isPending}
              onClick={() => mutation.mutate(form)}
              disabled={!form.patientId || !form.amount || mutation.isPending}
            >
              Save payment
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
};

export default BillingPage;
