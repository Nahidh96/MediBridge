import { useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Divider,
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
import { useDoctorProfile } from '@renderer/hooks/useDoctorProfile';

const CERTIFICATE_TYPES = [
  { value: 'sick_leave', label: 'Sick Leave' },
  { value: 'fitness', label: 'Fitness Certificate' },
  { value: 'medical_leave', label: 'Medical Leave' },
  { value: 'bed_rest', label: 'Bed Rest' },
  { value: 'light_duties', label: 'Light Duties' }
];

const MedicalCertificatesPage = () => {
  const queryClient = useQueryClient();
  const { data: doctorProfile } = useDoctorProfile();
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

  const certificateTypeLabels = useMemo(() => {
    return CERTIFICATE_TYPES.reduce<Record<string, string>>((acc, current) => {
      acc[current.value] = current.label;
      return acc;
    }, {});
  }, []);

  const formatDisplayDate = (input: string) => {
    if (!input) return '—';
    const date = new Date(input);
    if (Number.isNaN(date.getTime())) return input;
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  const handlePrint = (cert: MedicalCertificate) => {
    const practiceName = doctorProfile?.centreName?.trim() || doctorProfile?.name || 'Medical Practice';
    const doctorName = doctorProfile?.name || 'Attending Physician';
    const doctorSpecialty = doctorProfile?.specialty ? doctorProfile.specialty : undefined;
    const doctorLocation = doctorProfile?.location ? doctorProfile.location : undefined;
    const todayFormatted = new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(new Date(cert.issuedAt));
    const certificateHeading = certificateTypeLabels[cert.certificateType] || 'Medical Certificate';

    const printContent = `
      <html>
        <head>
          <title>${practiceName} | Medical Certificate</title>
          <style>
            @page { margin: 32mm 22mm 30mm; }
            body { font-family: 'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1d1d1f; margin: 0; }
            .page { padding: 0 0 40px; }
            .header { text-align: center; margin-bottom: 24px; }
            .practice-name { font-size: 20px; font-weight: 700; letter-spacing: 0.08em; }
            .practice-meta { font-size: 12px; text-transform: uppercase; color: #555; letter-spacing: 0.12em; }
            .divider { border-top: 2px solid #1d72f3; margin: 24px 0; }
            .certificate-title { text-align: center; font-size: 18px; font-weight: 600; margin-bottom: 24px; letter-spacing: 0.1em; }
            .info-grid { display: grid; grid-template-columns: 160px 1fr; gap: 8px 16px; margin-bottom: 24px; font-size: 14px; }
            .section-title { font-weight: 600; margin-bottom: 4px; font-size: 14px; letter-spacing: 0.05em; }
            .muted { color: #555; }
            .body-text { font-size: 14px; line-height: 1.6; margin-bottom: 16px; }
            .signature { margin-top: 40px; text-align: left; }
            .signature-line { width: 240px; border-top: 1px solid #333; margin-bottom: 8px; }
            .footer { margin-top: 48px; font-size: 11px; text-align: center; color: #777; }
            .badge { display: inline-block; padding: 4px 10px; background: #edf2ff; color: #1c4ed8; border-radius: 999px; font-size: 11px; letter-spacing: 0.1em; }
          </style>
        </head>
        <body>
          <div class="page">
            <header class="header">
              <div class="practice-name">${practiceName.toUpperCase()}</div>
              <div class="practice-meta">${[doctorSpecialty, doctorLocation].filter(Boolean).join(' • ')}</div>
            </header>
            <div class="divider"></div>
            <div class="certificate-title">MEDICAL CERTIFICATE</div>
            <div class="info-grid">
              <div class="muted">Certificate Type</div>
              <div><span class="badge">${certificateHeading.toUpperCase()}</span></div>
              <div class="muted">Patient Name</div>
              <div>${cert.patientName || '—'}</div>
              <div class="muted">Coverage Period</div>
              <div>${formatDisplayDate(cert.fromDate)} to ${formatDisplayDate(cert.toDate)} (${cert.daysCount} days)</div>
              <div class="muted">Issued On</div>
              <div>${todayFormatted}</div>
            </div>
            ${cert.diagnosis ? `<div class="section">
              <div class="section-title">Clinical Findings</div>
              <p class="body-text">${cert.diagnosis}</p>
            </div>` : ''}
            ${cert.restrictions ? `<div class="section">
              <div class="section-title">Recommended Restrictions</div>
              <p class="body-text">${cert.restrictions}</p>
            </div>` : ''}
            ${cert.additionalNotes ? `<div class="section">
              <div class="section-title">Additional Notes</div>
              <p class="body-text">${cert.additionalNotes}</p>
            </div>` : ''}
            <p class="body-text">This is to certify that the above-named patient was examined and treated under my care during the stated period and is ${certificateHeading.toLowerCase()}.</p>
            <div class="signature">
              <div class="signature-line"></div>
              <div>${doctorName}</div>
              ${doctorSpecialty ? `<div class="muted">${doctorSpecialty}</div>` : ''}
            </div>
            <footer class="footer">
              ${practiceName} • ${doctorLocation || 'Confidential medical document'}
            </footer>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 200);
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
        <Stack gap={4}>
          <Title order={2}>Medical Certificates</Title>
          <Text c="dimmed" size="sm">
            Provide patients with polished, print-ready documentation that reflects your practice brand.
          </Text>
        </Stack>
        <Button leftSection={<IconCertificate size={18} />} onClick={open}>
          Issue Certificate
        </Button>
      </Group>

      <Card withBorder shadow="xs" radius="md">
        <Stack gap="md">
          <Group justify="space-between" align="flex-end">
            <Stack gap={0}>
              <Text fw={600} size="sm" c="dimmed">
                Practice identity
              </Text>
              <Text fw={600}>{doctorProfile?.centreName || doctorProfile?.name || 'Your practice name'}</Text>
              {(doctorProfile?.specialty || doctorProfile?.location) && (
                <Text size="sm" c="dimmed">
                  {[doctorProfile?.specialty, doctorProfile?.location].filter(Boolean).join(' • ')}
                </Text>
              )}
            </Stack>
            <Text size="xs" c="dimmed">
              Issued certificates display this branding automatically.
            </Text>
          </Group>
          <Divider />
          {certificatesQuery.data && certificatesQuery.data.length === 0 ? (
            <Paper p="xl" withBorder radius="md" bg="gray.0">
              <Stack gap="xs" align="center">
                <IconCertificate size={32} stroke={1.5} />
                <Text fw={600}>No certificates issued yet</Text>
                <Text c="dimmed" size="sm" ta="center" maw={360}>
                  Document sick leave, fitness clearance, and more with a professional, print-ready template.
                </Text>
              </Stack>
            </Paper>
          ) : (
            <Table highlightOnHover striped fontSize="sm" horizontalSpacing="md" verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Patient</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Diagnosis</Table.Th>
                <Table.Th>Period</Table.Th>
                <Table.Th>Issued</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
                {certificatesQuery.data?.map((cert) => (
                  <Table.Tr key={cert.id}>
                    <Table.Td>
                      <Stack gap={0}>
                        <Text fw={600}>{cert.patientName || 'Unknown patient'}</Text>
                        <Text size="xs" c="dimmed">
                          Issued {formatDisplayDate(cert.issuedAt)}
                        </Text>
                      </Stack>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light" color="blue" size="sm">
                        {certificateTypeLabels[cert.certificateType] || cert.certificateType.replace(/_/g, ' ')}
                      </Badge>
                    </Table.Td>
                    <Table.Td>{cert.diagnosis || '—'}</Table.Td>
                    <Table.Td>
                      <Stack gap={0}>
                        <Text size="sm" fw={500}>
                          {formatDisplayDate(cert.fromDate)} → {formatDisplayDate(cert.toDate)}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {cert.daysCount} day{cert.daysCount > 1 ? 's' : ''}
                        </Text>
                      </Stack>
                    </Table.Td>
                    <Table.Td>{formatDisplayDate(cert.issuedAt)}</Table.Td>
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
          )}
        </Stack>
      </Card>

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
