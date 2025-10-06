import { ipcMain, type IpcMainInvokeEvent } from 'electron';
import { IPC_CHANNELS } from '../channels';
import { mediBridgeDb } from '../../db/database';
import type { MedicalCertificate, MedicalCertificateEntity } from '@shared/entities';
import type { MedicalCertificatePayload } from '@shared/payloads';

export function registerMedicalCertificateHandlers() {
  ipcMain.handle(IPC_CHANNELS.MEDICAL_CERT_LIST, async () => {
    try {
      await mediBridgeDb.initialize();
      const db = mediBridgeDb.connection;

      const rows = db.prepare(`
        SELECT 
          mc.*,
          p.full_name as patient_name
        FROM medical_certificates mc
        LEFT JOIN patients p ON mc.patient_id = p.id
        ORDER BY mc.issued_at DESC
      `).all() as Array<MedicalCertificateEntity & { patient_name: string }>;

      const certificates: MedicalCertificate[] = rows.map(row => ({
        id: row.id,
        patientId: row.patient_id,
        patientName: row.patient_name,
        certificateType: row.certificate_type,
        diagnosis: row.diagnosis ?? undefined,
        fromDate: row.from_date,
        toDate: row.to_date,
        daysCount: row.days_count,
        restrictions: row.restrictions ?? undefined,
        additionalNotes: row.additional_notes ?? undefined,
        issuedAt: row.issued_at
      }));

      console.log(`[IPC] Medical certificates list: ${certificates.length} records`);
      return certificates;
    } catch (error) {
      console.error('[IPC] Medical certificates list failed:', error);
      throw error;
    }
  });

  ipcMain.handle(IPC_CHANNELS.MEDICAL_CERT_ADD, async (_event: IpcMainInvokeEvent, payload: MedicalCertificatePayload) => {
    try {
      await mediBridgeDb.initialize();
      const db = mediBridgeDb.connection;

      const insert = db.prepare(`
        INSERT INTO medical_certificates (
          patient_id, certificate_type, diagnosis, from_date, to_date, 
          days_count, restrictions, additional_notes, issued_at
        )
        VALUES (
          @patientId, @certificateType, @diagnosis, @fromDate, @toDate,
          @daysCount, @restrictions, @additionalNotes, CURRENT_TIMESTAMP
        )
      `);

      const result = insert.run({
        patientId: payload.patientId,
        certificateType: payload.certificateType,
        diagnosis: payload.diagnosis ?? null,
        fromDate: payload.fromDate,
        toDate: payload.toDate,
        daysCount: payload.daysCount,
        restrictions: payload.restrictions ?? null,
        additionalNotes: payload.additionalNotes ?? null
      });

      console.log(`[IPC] Medical certificate added: ID ${result.lastInsertRowid}`);
      return { id: result.lastInsertRowid };
    } catch (error) {
      console.error('[IPC] Medical certificate add failed:', error);
      throw error;
    }
  });
}
