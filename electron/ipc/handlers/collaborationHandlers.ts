import { ipcMain, type IpcMainInvokeEvent } from 'electron';
import { IPC_CHANNELS } from '../channels';
import { mediBridgeDb } from '../../db/database';
import type { CollaborationPayload } from '@shared/payloads';

export function registerCollaborationHandlers() {
  ipcMain.handle(IPC_CHANNELS.COLLABORATION_LIST, () => {
    const db = mediBridgeDb.connection;
    return db
      .prepare(
        `SELECT id, author, message, tag, created_at as createdAt
         FROM collaboration_notes
         ORDER BY created_at DESC`
      )
      .all();
  });

  ipcMain.handle(
    IPC_CHANNELS.COLLABORATION_ADD,
    (_event: IpcMainInvokeEvent, payload: CollaborationPayload) => {
      const db = mediBridgeDb.connection;
      const insert = db.prepare(
        'INSERT INTO collaboration_notes (author, message, tag) VALUES (@author, @message, @tag)'
      );
      const result = insert.run(payload);
      return { id: result.lastInsertRowid };
    }
  );
}
