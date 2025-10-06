import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../channels';
import { mediBridgeDb } from '../../db/database';

export function registerAnalyticsHandlers() {
  ipcMain.handle(IPC_CHANNELS.ANALYTICS_OVERVIEW, () => {
    const db = mediBridgeDb.connection;
    const totals = db.prepare(
      `SELECT
          (SELECT COUNT(1) FROM patients) AS totalPatients,
          (SELECT COUNT(1) FROM appointments WHERE status = 'scheduled') AS upcomingAppointments,
          (SELECT COUNT(1) FROM appointments WHERE status = 'completed') AS completedAppointments,
          (SELECT IFNULL(SUM(amount), 0) FROM billing_records WHERE status = 'paid') AS revenueLKR
       `
    ).get();

    const topMedications = db
      .prepare(
        `SELECT medication, COUNT(1) as count
         FROM prescriptions
         GROUP BY medication
         ORDER BY count DESC
         LIMIT 5`
      )
      .all();

    return {
      totals,
      topMedications
    };
  });
}
