import { useState, type ChangeEvent, type FC } from 'react';
import {
  Button,
  Card,
  Group,
  Modal,
  NumberInput,
  ScrollArea,
  Stack,
  Table,
  Text,
  TextInput
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { InventoryEntity } from '@shared/entities';
import type { InventoryPayload } from '@shared/payloads';
import { requireElectronApi } from '@renderer/utils/electronApi';

const initialState: InventoryPayload = {
  itemName: '',
  sku: '',
  quantity: 0,
  reorderLevel: 10,
  supplier: '',
  unitPrice: undefined
};

const InventoryPage: FC = () => {
  const queryClient = useQueryClient();
  const [modalOpened, modalHandlers] = useDisclosure(false);
  const [form, setForm] = useState<InventoryPayload>(initialState);

  const inventoryQuery = useQuery<InventoryEntity[]>({
    queryKey: ['inventory', 'list'],
    queryFn: () => requireElectronApi().inventory.list(),
    refetchOnWindowFocus: false
  });

  const mutation = useMutation<{ id: number }, Error, InventoryPayload>({
    mutationFn: async (payload: InventoryPayload) => requireElectronApi().inventory.upsert(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', 'list'] });
      setForm(initialState);
      modalHandlers.close();
    }
  });

  const openEdit = (item: InventoryEntity) => {
    setForm({
      id: item.id,
      itemName: item.itemName,
  sku: item.sku ?? undefined,
      quantity: item.quantity,
      reorderLevel: item.reorderLevel,
  supplier: item.supplier ?? undefined,
      unitPrice: item.unitPrice ?? undefined
    });
    modalHandlers.open();
  };

  const handleInputChange = (field: keyof InventoryPayload) => (event: ChangeEvent<HTMLInputElement>) => {
    setForm((prev: InventoryPayload) => ({ ...prev, [field]: event.currentTarget.value }));
  };

  const handleNumericChange = (field: 'quantity' | 'reorderLevel' | 'unitPrice') => (
    value: string | number
  ) => {
    const numeric = typeof value === 'number' ? value : Number(value);
    setForm((prev: InventoryPayload) => ({
      ...prev,
      [field]: Number.isNaN(numeric) ? 0 : numeric
    }));
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center">
        <Stack gap={0}>
          <Text size="xl" fw={700}>
            Pharmacy & Inventory
          </Text>
          <Text size="sm" c="dimmed">
            Monitor stock levels and keep your dispensary audit-ready.
          </Text>
        </Stack>
        <Button onClick={() => {
          setForm(initialState);
          modalHandlers.open();
        }}>
          Add item
        </Button>
      </Group>

      <Card withBorder shadow="xs" padding="0">
        <ScrollArea h={540}>
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Item</Table.Th>
                <Table.Th>SKU</Table.Th>
                <Table.Th>Quantity</Table.Th>
                <Table.Th>Reorder level</Table.Th>
                <Table.Th>Supplier</Table.Th>
                <Table.Th>Unit price</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {inventoryQuery.data?.map((item: InventoryEntity) => (
                <Table.Tr key={item.id}>
                  <Table.Td>{item.itemName}</Table.Td>
                  <Table.Td>{item.sku ?? '—'}</Table.Td>
                  <Table.Td>{item.quantity}</Table.Td>
                  <Table.Td>{item.reorderLevel}</Table.Td>
                  <Table.Td>{item.supplier ?? '—'}</Table.Td>
                  <Table.Td>{item.unitPrice ? `LKR ${Number(item.unitPrice).toLocaleString('en-LK')}` : '—'}</Table.Td>
                  <Table.Td>
                    <Button variant="light" size="xs" onClick={() => openEdit(item)}>
                      Edit
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
              {inventoryQuery.data?.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={7}>
                    <Text size="sm" c="dimmed">
                      Inventory is empty. Add your first item.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Card>

      <Modal
        opened={modalOpened}
        onClose={() => {
          modalHandlers.close();
          setForm(initialState);
        }}
        title={form.id ? 'Edit inventory item' : 'Add inventory item'}
        size="lg"
      >
        <Stack gap="md">
          <TextInput
            label="Item name"
            required
            value={form.itemName}
            onChange={handleInputChange('itemName')}
          />
          <TextInput label="SKU" value={form.sku ?? ''} onChange={handleInputChange('sku')} />
          <Group grow>
            <NumberInput label="Quantity" min={0} value={form.quantity} onChange={handleNumericChange('quantity')} />
            <NumberInput
              label="Reorder level"
              min={0}
              value={form.reorderLevel}
              onChange={handleNumericChange('reorderLevel')}
            />
          </Group>
          <Group grow>
            <TextInput
              label="Supplier"
              value={form.supplier ?? ''}
              onChange={handleInputChange('supplier')}
            />
            <NumberInput
              label="Unit price (LKR)"
              min={0}
              value={form.unitPrice ?? 0}
              onChange={handleNumericChange('unitPrice')}
            />
          </Group>
          <Group justify="flex-end">
            <Button variant="default" onClick={modalHandlers.close}>
              Cancel
            </Button>
            <Button
              loading={mutation.isPending}
              onClick={() => mutation.mutate(form)}
              disabled={!form.itemName || mutation.isPending}
            >
              Save item
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
};

export default InventoryPage;
