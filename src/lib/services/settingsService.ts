import { DatabaseService } from '../db/database';

export interface AppSetting {
  id: number;
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  created_at: string;
  updated_at: string | null;
}

export class SettingsService {
  private db: DatabaseService;

  constructor() {
    this.db = DatabaseService.getInstance();
  }

  public async getSetting<T>(key: string, defaultValue: T): Promise<T> {
    const results = await this.db.query<AppSetting>(
      'SELECT * FROM app_settings WHERE key = ?',
      [key]
    );

    if (results.length === 0) {
      return defaultValue;
    }

    const setting = results[0];
    return this.parseValue(setting.value, setting.type) as T;
  }

  public async setSetting<T>(key: string, value: T, type: AppSetting['type']): Promise<void> {
    const stringValue = this.stringifyValue(value);
    
    const sql = `
      INSERT INTO app_settings (key, value, type, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        type = excluded.type,
        updated_at = CURRENT_TIMESTAMP
    `;

    await this.db.execute(sql, [key, stringValue, type]);
  }

  public async deleteSetting(key: string): Promise<void> {
    await this.db.execute('DELETE FROM app_settings WHERE key = ?', [key]);
  }

  public async getAllSettings(): Promise<AppSetting[]> {
    return this.db.query<AppSetting>('SELECT * FROM app_settings ORDER BY key ASC');
  }

  private parseValue(value: string, type: AppSetting['type']): any {
    switch (type) {
      case 'number':
        return Number(value);
      case 'boolean':
        return value === 'true';
      case 'json':
        return JSON.parse(value);
      default:
        return value;
    }
  }

  private stringifyValue(value: any): string {
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }
} 
