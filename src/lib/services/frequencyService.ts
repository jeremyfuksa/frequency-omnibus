import { DatabaseService } from '../db/database';
import { Frequency, FrequencyFilter } from '../../types/database';

export class FrequencyService {
  private db: DatabaseService;

  constructor() {
    this.db = DatabaseService.getInstance();
  }

  public async getFrequencies(
    filter?: FrequencyFilter, 
    page = 1, 
    pageSize = 100
  ): Promise<{ data: Frequency[], total: number }> {
    let baseSql = 'SELECT * FROM frequencies WHERE 1=1';
    const countSql = 'SELECT COUNT(*) as total FROM frequencies WHERE 1=1';
    const params: any[] = [];

    if (filter) {
      if (filter.mode && filter.mode.length > 0) {
        baseSql += ' AND mode IN (' + filter.mode.map(() => '?').join(',') + ')';
        params.push(...filter.mode);
      }

      if (filter.serviceType && filter.serviceType.length > 0) {
        baseSql += ' AND service_type IN (' + filter.serviceType.map(() => '?').join(',') + ')';
        params.push(...filter.serviceType);
      }

      if (filter.county && filter.county.length > 0) {
        baseSql += ' AND county IN (' + filter.county.map(() => '?').join(',') + ')';
        params.push(...filter.county);
      }

      if (filter.state && filter.state.length > 0) {
        baseSql += ' AND state IN (' + filter.state.map(() => '?').join(',') + ')';
        params.push(...filter.state);
      }

      if (filter.active !== undefined) {
        baseSql += ' AND active = ?';
        params.push(filter.active ? 1 : 0);
      }

      if (filter.tagContains) {
        baseSql += ' AND tags LIKE ?';
        params.push(`%${filter.tagContains}%`);
      }

      if (filter.frequencyRange) {
        baseSql += ' AND frequency BETWEEN ? AND ?';
        params.push(filter.frequencyRange[0], filter.frequencyRange[1]);
      }
    }

    // Get total count with the same filters
    const countParams = [...params]; // Copy params for count query
    const countResults = await this.db.query<{total: number}>(countSql, countParams);
    const total = countResults[0]?.total || 0;

    // Add order and pagination to data query
    baseSql += ' ORDER BY frequency ASC LIMIT ? OFFSET ?';
    params.push(pageSize, (page - 1) * pageSize);

    const data = await this.db.query<Frequency>(baseSql, params);
    
    return { data, total };
  }

  public async getAllFrequencies(filter?: FrequencyFilter): Promise<Frequency[]> {
    let sql = 'SELECT * FROM frequencies WHERE 1=1';
    const params: any[] = [];

    if (filter) {
      if (filter.mode && filter.mode.length > 0) {
        sql += ' AND mode IN (' + filter.mode.map(() => '?').join(',') + ')';
        params.push(...filter.mode);
      }

      if (filter.serviceType && filter.serviceType.length > 0) {
        sql += ' AND service_type IN (' + filter.serviceType.map(() => '?').join(',') + ')';
        params.push(...filter.serviceType);
      }

      if (filter.county && filter.county.length > 0) {
        sql += ' AND county IN (' + filter.county.map(() => '?').join(',') + ')';
        params.push(...filter.county);
      }

      if (filter.state && filter.state.length > 0) {
        sql += ' AND state IN (' + filter.state.map(() => '?').join(',') + ')';
        params.push(...filter.state);
      }

      if (filter.active !== undefined) {
        sql += ' AND active = ?';
        params.push(filter.active ? 1 : 0);
      }

      if (filter.tagContains) {
        sql += ' AND tags LIKE ?';
        params.push(`%${filter.tagContains}%`);
      }

      if (filter.frequencyRange) {
        sql += ' AND frequency BETWEEN ? AND ?';
        params.push(filter.frequencyRange[0], filter.frequencyRange[1]);
      }
    }

    sql += ' ORDER BY frequency ASC';
    return this.db.query<Frequency>(sql, params);
  }

  public async getFrequencyById(id: number): Promise<Frequency | null> {
    const results = await this.db.query<Frequency>(
      'SELECT * FROM frequencies WHERE id = ?',
      [id]
    );
    return results[0] || null;
  }

  public async addFrequency(frequency: Omit<Frequency, 'id' | 'created_at' | 'updated_at'>): Promise<Frequency> {
    const fields = Object.keys(frequency).join(', ');
    const placeholders = Object.keys(frequency).map(() => '?').join(', ');
    const values = Object.values(frequency);

    const sql = `
      INSERT INTO frequencies (${fields})
      VALUES (${placeholders})
    `;

    await this.db.execute(sql, values);
    const results = await this.db.query<Frequency>(
      'SELECT * FROM frequencies WHERE id = last_insert_rowid()'
    );
    return results[0];
  }

  public async updateFrequency(id: number, frequency: Partial<Frequency>): Promise<Frequency | null> {
    const updates = Object.entries(frequency)
      .filter(([key]) => key !== 'id' && key !== 'created_at')
      .map(([key]) => `${key} = ?`);
    
    if (updates.length === 0) return null;

    const sql = `
      UPDATE frequencies
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const values = [
      ...Object.values(frequency).filter((_, i) => 
        Object.keys(frequency)[i] !== 'id' && 
        Object.keys(frequency)[i] !== 'created_at'
      ),
      id
    ];

    await this.db.execute(sql, values);
    return this.getFrequencyById(id);
  }

  public async deleteFrequency(id: number): Promise<void> {
    await this.db.execute('DELETE FROM frequencies WHERE id = ?', [id]);
  }

  public async batchUpdateFrequencies(updates: { id: number; data: Partial<Frequency> }[]): Promise<void> {
    // Use transaction for better performance
    await this.db.execute('BEGIN TRANSACTION');
    try {
      for (const update of updates) {
        await this.updateFrequency(update.id, update.data);
      }
      await this.db.execute('COMMIT');
    } catch (error) {
      await this.db.execute('ROLLBACK');
      throw error;
    }
  }

  public async importFrequencies(frequencies: Omit<Frequency, 'id' | 'created_at' | 'updated_at'>[]): Promise<void> {
    const chunkSize = 100;
    await this.db.execute('BEGIN TRANSACTION');
    
    try {
      // Process in chunks
      for (let i = 0; i < frequencies.length; i += chunkSize) {
        const chunk = frequencies.slice(i, i + chunkSize);
        await this.processFrequencyChunk(chunk);
        
        // Allow UI updates between chunks
        await new Promise(resolve => setTimeout(resolve, 0));
      }
      
      await this.db.execute('COMMIT');
    } catch (error) {
      await this.db.execute('ROLLBACK');
      throw error;
    }
  }
  
  private async processFrequencyChunk(frequencies: Omit<Frequency, 'id' | 'created_at' | 'updated_at'>[]): Promise<void> {
    for (const frequency of frequencies) {
      const fields = Object.keys(frequency).join(', ');
      const placeholders = Object.keys(frequency).map(() => '?').join(', ');
      const values = Object.values(frequency);
  
      const sql = `
        INSERT INTO frequencies (${fields})
        VALUES (${placeholders})
      `;
  
      await this.db.execute(sql, values);
    }
  }

  public async toggleExportFlag(id: number, flag: keyof Pick<Frequency, 'export_chirp' | 'export_uniden' | 'export_sdrtrunk' | 'export_sdrplus' | 'export_opengd77'>): Promise<void> {
    const sql = `
      UPDATE frequencies
      SET ${flag} = CASE WHEN ${flag} = 1 THEN 0 ELSE 1 END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    await this.db.execute(sql, [id]);
  }
} 
