import { useState } from 'react';
import {
  Button,
  Card,
  Grid,
  Group,
  Loader,
  Modal,
  NumberInput,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  Textarea,
  TextInput,
  Title
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { IconCertificate, IconPrinter } from '@tabler/icons-react';
import type { MedicalCertificate, PatientEntity } from '@shared/entities';
import type { MedicalCertificatePayload } from '@shared/payloads';
import { waitForElectronApi } from '@renderer/utils/electronApi';

const CERTIFICATE_TYPES = [
  { value: 'sick_leave', label: 'Sick Leave' },
  { value: 'fitness', label: 'Fitness Certificate' },
  { value: 'medical_leave', label: 'Medical Leave' },
  { value: 'bed_rest', label: 'Bed Rest' },
  { value: 'light_duties', label: 'Light Duties' }
];

const MedicalCertificatesPage = () => {
  const queryClient = useQueryClient();
  const [opened, { open, close }] = useDisclosure(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [certificateType, setCertificateType] = useState<string | null>('sick_leave');
  const [diagnosis, setDiagnosis] = useState('');
  const [fromDate, setFromDate] = useState<Date | null>(new Date());
  const [toDate, setToDate] = useState<Date | null>(new Date());
  const [daysCount, setDaysCount] = useState<number>(1);
  const [restrictions, setRestrictions] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  const patientsQuery = useQuery<PatientEntity[]>({
    queryKey: ['patients', 'list'],
    queryFn: async () => {
      const api = await waitForElectronApi();
      return api.patients.list();
    },
    staleTime: 10 * 60 * 1000
  });

  const certificatesQuery = useQuery<MedicalCertificate[]>({
    queryKey: ['medical-certificates', 'list'],
    queryFn: async () => {
      const api = await waitForElectronApi();
      return api.medicalCertificates.list();
    },
    refetchOnWindowFocus: false
  });

  const mutation = useMutation<{ id: number }, Error, MedicalCertificatePayload>({
    mutationFn: async (payload: MedicalCertificatePayload) => {
      const api = await waitForElectronApi();
      return api.medicalCertificates.add(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-certificates', 'list'] });
      resetForm();
      close();
    }
  });

  const resetForm = () => {
    setSelectedPatientId(null);
    setCertificateType('sick_leave');
    setDiagnosis('');
    setFromDate(new Date());
    setToDate(new Date());
    setDaysCount(1);
    setRestrictions('');
    setAdditionalNotes('');
  };

  const handleSubmit = () => {
    if (!selectedPatientId || !certificateType || !fromDate || !toDate) {
      return;
    }

    const payload: MedicalCertificatePayload = {
      patientId: parseInt(selectedPatientId, 10),
      certificateType,
      diagnosis: diagnosis.trim() || undefined,
      fromDate: fromDate.toISOString().split('T')[0],
      toDate: toDate.toISOString().split('T')[0],
      daysCount,
      restrictions: restrictions.trim() || undefined,
      additionalNotes: additionalNotes.trim() || undefined
    };

    mutation.mutate(payload);
  };

  const handlePrint = (cert: MedicalCertificate) => {
    // Basic print implementation - will be enhanced later
    const printContent = `
      <html>
        <head>
          <title>Medical Certificate</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            h1 { text-align: center; }
            .content { margin: 20px 0; }
          </style>
        </head>
        <body>
          <h1>MEDICAL CERTIFICATE</h1>
          <div class="content">
            <p><strong>Patient:</strong> ${cert.patientName || 'N/A'}</p>
            <p><strong>Certificate Type:</strong> ${cert.certificateType}</p>
            ${cert.diagnosis ? `<p><strong>Diagnosis:</strong> ${cert.diagnosis}</p>` : ''}
            <p><strong>Period:</strong> ${cert.fromDate} to ${cert.toDate} (${cert.daysCount} days)</p>
            ${cert.restrictions ? `<p><strong>Restrictions:</strong> ${cert.restrictions}</p>` : ''}
            ${cert.additionalNotes ? `<p><strong>Notes:</strong> ${cert.additionalNotes}</p>` : ''}
            <p><strong>Issued:</strong> ${new Date(cert.issuedAt).toLocaleDateString()}</p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const patientOptions = (patientsQuery.data || []).map(p => ({
    value: p.id.toString(),
    label: `${p.full_name}${p.nic ? ` (${p.nic})` : ''}`
  }));

  if (certificatesQuery.isLoading) {
    return (
      <Group justify="center" mt="xl">
        <Loader />
      </Group>
    );
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={2}>Medical Certificates</Title>
        <Button leftSection={<IconCertificate size={18} />} onClick={open}>
          Issue Certificate
        </Button>
      </Group>

      {certificatesQuery.data && certificatesQuery.data.length === 0 ? (
        <Paper p="xl" withBorder>
          <Text c="dimmed" ta="center">
            No medical certificates issued yet. Click "Issue Certificate" to create one.
          </Text>
        </Paper>
      ) : (
        <Card withBorder>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Patient</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Diagnosis</Table.Th>
                <Table.Th>Period</Table.Th>
                <Table.Th>Days</Table.Th>
                <Table.Th>Issued</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {certificatesQuery.data?.map((cert) => (
                <Table.Tr key={cert.id}>
                  <Table.Td>{cert.patientName || 'Unknown'}</Table.Td>
                  <Table.Td>{cert.certificateType.replace(/_/g, ' ')}</Table.Td>
                  <Table.Td>{cert.diagnosis || '—'}</Table.Td>
                  <Table.Td>
                    {cert.fromDate} to {cert.toDate}
                  </Table.Td>
                  <Table.Td>{cert.daysCount}</Table.Td>
                  <Table.Td>{new Date(cert.issuedAt).toLocaleDateString()}</Table.Td>
                  <Table.Td>
                    <Button
                      size="xs"
                      variant="light"
                      leftSection={<IconPrinter size={14} />}
                      onClick={() => handlePrint(cert)}
                    >
                      Print
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Card>
      )}

      <Modal opened={opened} onClose={close} title="Issue Medical Certificate" size="lg">
        <Stack gap="md">
          <Select
            label="Patient"
            placeholder="Select patient"
            required
            data={patientOptions}
            value={selectedPatientId}
            onChange={setSelectedPatientId}
            searchable
          />

          <Select
            label="Certificate Type"
            required
            data={CERTIFICATE_TYPES}
            value={certificateType}
            onChange={setCertificateType}
          />

          <TextInput
            label="Diagnosis (optional)"
            placeholder="e.g., Acute upper respiratory tract infection"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.currentTarget.value)}
          />

          <Grid>
            <Grid.Col span={6}>
              <DatePickerInput
                label="From Date"
                required
                value={fromDate}
                onChange={(val) => {
                  setFromDate(val);
                  if (val && toDate) {
                    const diff = Math.ceil((toDate.getTime() - val.getTime()) / (1000 * 60 * 60 * 24));
                    setDaysCount(Math.max(1, diff + 1));
                  }
                }}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <DatePickerInput
                label="To Date"
                required
                value={toDate}
                onChange={(val) => {
                  setToDate(val);
                  if (fromDate && val) {
                    const diff = Math.ceil((val.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
                    setDaysCount(Math.max(1, diff + 1));
                  }
                }}
              />
            </Grid.Col>
          </Grid>

          <NumberInput
            label="Number of Days"
            required
            min={1}
            value={daysCount}
            onChange={(val) => setDaysCount(Number(val) || 1)}
          />

          <Textarea
            label="Restrictions (optional)"
            placeholder="e.g., Avoid heavy lifting, stay indoors"
            rows={2}
            value={restrictions}
            onChange={(e) => setRestrictions(e.currentTarget.value)}
          />

          <Textarea
            label="Additional Notes (optional)"
            placeholder="Any other relevant information"
            rows={2}
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.currentTarget.value)}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={close}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              loading={mutation.isPending}
              disabled={!selectedPatientId || !certificateType || !fromDate || !toDate}
            >
              Issue Certificate
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
};

export default MedicalCertificatesPage;
