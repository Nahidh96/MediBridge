import { ipcMain, type IpcMainInvokeEvent } from 'electron';
import { IPC_CHANNELS } from '../channels';
import { mediBridgeDb } from '../../db/database';
import type { InventoryPayload } from '@shared/payloads';

export function registerInventoryHandlers() {
  ipcMain.handle(IPC_CHANNELS.INVENTORY_LIST, () => {
    const db = mediBridgeDb.connection;
    return db
      .prepare(
        `SELECT id, item_name as itemName, sku, quantity, reorder_level as reorderLevel,
                supplier, unit_price as unitPrice, updated_at as updatedAt
         FROM inventory_items
         ORDER BY item_name`
      )
      .all();
  });

  ipcMain.handle(
    IPC_CHANNELS.INVENTORY_UPDATE,
    (_event: IpcMainInvokeEvent, payload: InventoryPayload) => {
      const db = mediBridgeDb.connection;
      if (payload.id) {
        const update = db.prepare(`
          UPDATE inventory_items
          SET item_name = @itemName,
              sku = @sku,
              quantity = @quantity,
              reorder_level = @reorderLevel,
              supplier = @supplier,
              unit_price = @unitPrice,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = @id
        `);
        update.run(payload);
        return { id: payload.id };
      }

      const insert = db.prepare(`
        INSERT INTO inventory_items (item_name, sku, quantity, reorder_level, supplier, unit_price)
        VALUES (@itemName, @sku, @quantity, @reorderLevel, @supplier, @unitPrice)
      `);
      const result = insert.run(payload);
      return { id: result.lastInsertRowid };
    }
  );
}
