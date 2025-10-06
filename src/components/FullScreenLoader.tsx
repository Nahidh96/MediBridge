import { FC } from 'react';
import { Center, Loader, Stack, Text } from '@mantine/core';

interface FullScreenLoaderProps {
  label?: string;
}

const FullScreenLoader: FC<FullScreenLoaderProps> = ({ label = 'Loading MediBridge…' }) => (
  <Center h="100vh" w="100%">
    <Stack align="center" gap="sm">
      <Loader size="lg" />
      <Text size="sm" c="dimmed">
        {label}
      </Text>
    </Stack>
  </Center>
);

export default FullScreenLoader;
