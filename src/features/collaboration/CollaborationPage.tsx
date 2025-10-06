import { useState, type ChangeEvent, type FC } from 'react';
import {
  Button,
  Card,
  Group,
  Modal,
  ScrollArea,
  Stack,
  Text,
  Textarea,
  TextInput
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CollaborationEntity } from '@shared/entities';
import type { CollaborationPayload } from '@shared/payloads';
import { requireElectronApi } from '@renderer/utils/electronApi';

const initialState: CollaborationPayload = {
  author: '',
  message: '',
  tag: ''
};

const CollaborationPage: FC = () => {
  const queryClient = useQueryClient();
  const [modalOpened, modalHandlers] = useDisclosure(false);
  const [form, setForm] = useState<CollaborationPayload>(initialState);

  const notesQuery = useQuery<CollaborationEntity[]>({
    queryKey: ['collaboration', 'list'],
    queryFn: () => requireElectronApi().collaboration.list(),
    refetchOnWindowFocus: false
  });

  const mutation = useMutation<{ id: number }, Error, CollaborationPayload>({
    mutationFn: async (payload: CollaborationPayload) => requireElectronApi().collaboration.add(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaboration', 'list'] });
      setForm(initialState);
      modalHandlers.close();
    }
  });

  const handleChange = (field: keyof CollaborationPayload) => (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev: CollaborationPayload) => ({ ...prev, [field]: event.currentTarget.value }));
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center">
        <Stack gap={0}>
          <Text size="xl" fw={700}>
            Multi-doctor Collaboration
          </Text>
          <Text size="sm" c="dimmed">
            Capture cross-cover handovers, referral notes, and shared observations securely.
          </Text>
        </Stack>
        <Button onClick={modalHandlers.open}>New note</Button>
      </Group>

      <Card withBorder shadow="xs" padding="0">
        <ScrollArea h={540}>
          <Stack gap="sm" p="lg">
            {notesQuery.data?.map((item: CollaborationEntity) => (
              <Card key={item.id} withBorder shadow="xs" padding="md">
                <Stack gap={4}>
                  <Group justify="space-between">
                    <Text fw={600}>{item.author}</Text>
                    <Text size="xs" c="dimmed">
                      {item.createdAt}
                    </Text>
                  </Group>
                  <Text size="sm">{item.message}</Text>
                  {item.tag && (
                    <Text size="xs" c="blue">
                      #{item.tag}
                    </Text>
                  )}
                </Stack>
              </Card>
            ))}
            {notesQuery.data?.length === 0 && (
              <Text size="sm" c="dimmed">
                No collaboration notes yet.
              </Text>
            )}
          </Stack>
        </ScrollArea>
      </Card>

      <Modal opened={modalOpened} onClose={modalHandlers.close} title="New collaboration note" size="lg">
        <Stack gap="md">
          <TextInput
            label="Author"
            required
            value={form.author}
            onChange={handleChange('author')}
          />
          <Textarea
            label="Message"
            minRows={3}
            required
            value={form.message}
            onChange={handleChange('message')}
          />
          <TextInput label="Tag" value={form.tag ?? ''} onChange={handleChange('tag')} placeholder="Optional tag" />
          <Group justify="flex-end">
            <Button variant="default" onClick={modalHandlers.close}>
              Cancel
            </Button>
            <Button
              loading={mutation.isPending}
              onClick={() => mutation.mutate(form)}
              disabled={!form.author || !form.message || mutation.isPending}
            >
              Save note
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
};

export default CollaborationPage;
