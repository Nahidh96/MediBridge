import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import initSqlJs, {
  type Database as SqlJsDatabase,
  type SqlJsStatic,
  type Statement as SqlJsStatement
} from 'sql.js';

interface RunResult {
  changes: number;
  lastInsertRowid: number;
}

type StatementParams = unknown;

class SqlJsStatementWrapper {
  constructor(
    private readonly db: SqlJsDatabase,
    private readonly sql: string,
    private readonly markDirty: () => void,
    private readonly persistIfDirty: () => void,
    private readonly getLastInsertRowId: () => number
  ) {}

  run(params?: unknown): RunResult {
    const statement = this.prepareStatement(params);

    try {
      while (statement.step()) {
        // Exhaust iterator to ensure statement executes fully.
      }
    } finally {
      statement.free();
    }

    this.markDirty();
    this.persistIfDirty();

    return {
      changes: this.db.getRowsModified(),
      lastInsertRowid: this.getLastInsertRowId()
    };
  }

  get<T = Record<string, unknown>>(params?: unknown): T | undefined {
    const statement = this.prepareStatement(params);

    try {
      if (!statement.step()) {
        return undefined;
      }

      return statement.getAsObject() as T;
    } finally {
      statement.free();
    }
  }

  all<T = Record<string, unknown>>(params?: unknown): T[] {
    const statement = this.prepareStatement(params);
    const rows: T[] = [];

    try {
      while (statement.step()) {
        rows.push(statement.getAsObject() as T);
      }
    } finally {
      statement.free();
    }

    return rows;
  }

  private prepareStatement(params: StatementParams): SqlJsStatement {
    const statement = this.db.prepare(this.sql);

    if (params && typeof params === 'object' && !Array.isArray(params)) {
      const boundParams = Object.fromEntries(
        Object.entries(params as Record<string, unknown>).map(([key, value]) => [
          `@${key}`,
          value
        ])
      ) as Parameters<SqlJsStatement['bind']>[0];
      statement.bind(boundParams);
    }

    return statement;
  }
}

class SqlJsConnection {
  constructor(
    private readonly db: SqlJsDatabase,
    private readonly markDirty: () => void,
    private readonly persistIfDirty: () => void,
    private readonly getLastInsertRowId: () => number
  ) {}

  prepare(sql: string) {
    return new SqlJsStatementWrapper(
      this.db,
      sql,
      this.markDirty,
      this.persistIfDirty,
      this.getLastInsertRowId
    );
  }

  exec(sql: string) {
    this.db.exec(sql);
    this.markDirty();
    this.persistIfDirty();
  }

  transaction(handler: () => void) {
    return () => {
      this.db.exec('BEGIN TRANSACTION;');

      try {
        handler();
        this.db.exec('COMMIT;');
        this.persistIfDirty();
      } catch (error) {
        this.db.exec('ROLLBACK;');
        throw error;
      }
    };
  }
}

class MediBridgeDatabase {
  private sqlJs?: SqlJsStatic;
  private instance?: SqlJsDatabase;
  private connectionWrapper?: SqlJsConnection;
  private dbPath = '';
  private dirty = false;

  async initialize() {
    if (this.instance) {
      return;
    }

    const userDataPath = app.getPath('userData');
    this.dbPath = path.join(userDataPath, 'medibridge.db');
    fs.mkdirSync(path.dirname(this.dbPath), { recursive: true });

    this.sqlJs = await initSqlJs({
      locateFile: (file: string) => path.join(this.resolveWasmDirectory(), file)
    });

    if (fs.existsSync(this.dbPath)) {
      const fileBuffer = fs.readFileSync(this.dbPath);
      this.instance = new this.sqlJs.Database(new Uint8Array(fileBuffer));
    } else {
      this.instance = new this.sqlJs.Database();
    }

    this.bootstrap();
    this.persistIfDirty(true);
  }

  get connection(): SqlJsConnection {
    if (!this.instance) {
      throw new Error('Database has not been initialized');
    }

    if (!this.connectionWrapper) {
      this.connectionWrapper = new SqlJsConnection(
        this.instance,
        this.markDirty,
        () => this.persistIfDirty(),
        this.getLastInsertRowId
      );
    }

    return this.connectionWrapper;
  }

  persist() {
    this.persistIfDirty(true);
  }

  private bootstrap() {
    if (!this.instance) {
      return;
    }

    const createTablesSQL = `
      CREATE TABLE IF NOT EXISTS doctor_profile (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        name TEXT NOT NULL,
        specialty TEXT NOT NULL,
        practice_type TEXT NOT NULL,
        centre_name TEXT,
        location TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS enabled_modules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        module_key TEXT NOT NULL UNIQUE,
        enabled INTEGER NOT NULL DEFAULT 1,
        metadata TEXT
      );

      CREATE TABLE IF NOT EXISTS patients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        nic TEXT,
        contact TEXT,
        dob TEXT,
        allergies TEXT,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        doctor_notes TEXT,
        scheduled_for TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'scheduled',
        clinic_room TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(patient_id) REFERENCES patients(id)
      );

      CREATE TABLE IF NOT EXISTS prescriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        diagnosis TEXT,
        medication TEXT,
        dosage TEXT,
        duration TEXT,
        issued_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(patient_id) REFERENCES patients(id)
      );

      CREATE TABLE IF NOT EXISTS billing_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        currency TEXT NOT NULL DEFAULT 'LKR',
        status TEXT NOT NULL DEFAULT 'pending',
        payment_method TEXT,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(patient_id) REFERENCES patients(id)
      );

      CREATE TABLE IF NOT EXISTS medical_certificates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        certificate_type TEXT NOT NULL,
        diagnosis TEXT,
        from_date TEXT NOT NULL,
        to_date TEXT NOT NULL,
        days_count INTEGER NOT NULL,
        restrictions TEXT,
        additional_notes TEXT,
        issued_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(patient_id) REFERENCES patients(id)
      );

      CREATE TABLE IF NOT EXISTS inventory_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_name TEXT NOT NULL,
        sku TEXT,
        quantity INTEGER NOT NULL DEFAULT 0,
        reorder_level INTEGER NOT NULL DEFAULT 10,
        supplier TEXT,
        unit_price REAL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS collaboration_notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        author TEXT NOT NULL,
        message TEXT NOT NULL,
        tag TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `;

    this.instance.exec(createTablesSQL);
    try {
      this.instance.exec('ALTER TABLE doctor_profile ADD COLUMN centre_name TEXT;');
      this.markDirty();
    } catch (error) {
      if (error instanceof Error && /duplicate column name/i.test(error.message)) {
        // Column already exists, ignore.
      } else {
        throw error;
      }
    }
    this.markDirty();
  }

  private resolveWasmDirectory() {
    if (app.isPackaged) {
      return path.join(process.resourcesPath, 'sqljs');
    }

    return path.join(app.getAppPath(), 'node_modules/sql.js/dist');
  }

  private markDirty = () => {
    this.dirty = true;
  };

  private persistIfDirty(force = false) {
    if (!this.instance || (!this.dirty && !force)) {
      return;
    }

    const data = this.instance.export();
    fs.writeFileSync(this.dbPath, data);
    this.dirty = false;
  }

  private getLastInsertRowId = () => {
    if (!this.instance) {
      return 0;
    }

    const result = this.instance.exec('SELECT last_insert_rowid() as id;');
    if (!result.length || !result[0].values.length) {
      return 0;
    }

    const value = result[0].values[0][0];
    return typeof value === 'number' ? value : Number(value) || 0;
  };
}

export const mediBridgeDb = new MediBridgeDatabase();
