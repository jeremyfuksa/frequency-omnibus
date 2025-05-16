import { DatabaseService } from '../db/database';
import { TrunkedSystem, TrunkedSite, Talkgroup, TrunkedSystemFilter } from '../../types/database';

export class TrunkedSystemService {
  private db: DatabaseService;

  constructor() {
    this.db = DatabaseService.getInstance();
  }

  public async getSystems(filter?: TrunkedSystemFilter): Promise<TrunkedSystem[]> {
    let sql = 'SELECT * FROM trunked_systems WHERE 1=1';
    const params: any[] = [];

    if (filter) {
      if (filter.type && filter.type.length > 0) {
        sql += ' AND type IN (' + filter.type.map(() => '?').join(',') + ')';
        params.push(...filter.type);
      }

      if (filter.systemClass && filter.systemClass.length > 0) {
        sql += ' AND system_class IN (' + filter.systemClass.map(() => '?').join(',') + ')';
        params.push(...filter.systemClass);
      }

      if (filter.active !== undefined) {
        sql += ' AND active = ?';
        params.push(filter.active ? 1 : 0);
      }

      if (filter.protocol && filter.protocol.length > 0) {
        sql += ' AND system_protocol IN (' + filter.protocol.map(() => '?').join(',') + ')';
        params.push(...filter.protocol);
      }
    }

    sql += ' ORDER BY name ASC';
    return this.db.query<TrunkedSystem>(sql, params);
  }

  public async getSystemById(id: number): Promise<TrunkedSystem | null> {
    const results = await this.db.query<TrunkedSystem>(
      'SELECT * FROM trunked_systems WHERE id = ?',
      [id]
    );
    return results[0] || null;
  }

  public async addSystem(system: Omit<TrunkedSystem, 'id' | 'created_at' | 'updated_at'>): Promise<TrunkedSystem> {
    const fields = Object.keys(system).join(', ');
    const placeholders = Object.keys(system).map(() => '?').join(', ');
    const values = Object.values(system);

    const sql = `
      INSERT INTO trunked_systems (${fields})
      VALUES (${placeholders})
    `;

    await this.db.execute(sql, values);
    const results = await this.db.query<TrunkedSystem>(
      'SELECT * FROM trunked_systems WHERE id = last_insert_rowid()'
    );
    return results[0];
  }

  public async updateSystem(id: number, system: Partial<TrunkedSystem>): Promise<TrunkedSystem | null> {
    const updates = Object.entries(system)
      .filter(([key]) => key !== 'id' && key !== 'created_at')
      .map(([key]) => `${key} = ?`);
    
    if (updates.length === 0) return null;

    const sql = `
      UPDATE trunked_systems
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const values = [
      ...Object.values(system).filter((_, i) => 
        Object.keys(system)[i] !== 'id' && 
        Object.keys(system)[i] !== 'created_at'
      ),
      id
    ];

    await this.db.execute(sql, values);
    return this.getSystemById(id);
  }

  public async deleteSystem(id: number): Promise<void> {
    // Delete associated records first
    await this.db.execute('DELETE FROM talkgroups WHERE system_id = ?', [id]);
    await this.db.execute('DELETE FROM trunked_sites WHERE system_id = ?', [id]);
    await this.db.execute('DELETE FROM trunked_systems WHERE id = ?', [id]);
  }

  public async getSitesBySystemId(systemId: number): Promise<TrunkedSite[]> {
    return this.db.query<TrunkedSite>(
      'SELECT * FROM trunked_sites WHERE system_id = ? ORDER BY name ASC',
      [systemId]
    );
  }

  public async getSiteById(id: number): Promise<TrunkedSite | null> {
    const results = await this.db.query<TrunkedSite>(
      'SELECT * FROM trunked_sites WHERE id = ?',
      [id]
    );
    return results[0] || null;
  }

  public async addSite(site: Omit<TrunkedSite, 'id' | 'created_at' | 'updated_at'>): Promise<TrunkedSite> {
    const fields = Object.keys(site).join(', ');
    const placeholders = Object.keys(site).map(() => '?').join(', ');
    const values = Object.values(site);

    const sql = `
      INSERT INTO trunked_sites (${fields})
      VALUES (${placeholders})
    `;

    await this.db.execute(sql, values);
    const results = await this.db.query<TrunkedSite>(
      'SELECT * FROM trunked_sites WHERE id = last_insert_rowid()'
    );
    return results[0];
  }

  public async updateSite(id: number, site: Partial<TrunkedSite>): Promise<TrunkedSite | null> {
    const updates = Object.entries(site)
      .filter(([key]) => key !== 'id' && key !== 'created_at')
      .map(([key]) => `${key} = ?`);
    
    if (updates.length === 0) return null;

    const sql = `
      UPDATE trunked_sites
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const values = [
      ...Object.values(site).filter((_, i) => 
        Object.keys(site)[i] !== 'id' && 
        Object.keys(site)[i] !== 'created_at'
      ),
      id
    ];

    await this.db.execute(sql, values);
    return this.getSiteById(id);
  }

  public async deleteSite(id: number): Promise<void> {
    await this.db.execute('DELETE FROM trunked_sites WHERE id = ?', [id]);
  }

  public async getTalkgroupsBySystemId(systemId: number): Promise<Talkgroup[]> {
    return this.db.query<Talkgroup>(
      'SELECT * FROM talkgroups WHERE system_id = ? ORDER BY decimal_id ASC',
      [systemId]
    );
  }

  public async getTalkgroupById(id: number): Promise<Talkgroup | null> {
    const results = await this.db.query<Talkgroup>(
      'SELECT * FROM talkgroups WHERE id = ?',
      [id]
    );
    return results[0] || null;
  }

  public async addTalkgroup(talkgroup: Omit<Talkgroup, 'id' | 'created_at' | 'updated_at'>): Promise<Talkgroup> {
    const fields = Object.keys(talkgroup).join(', ');
    const placeholders = Object.keys(talkgroup).map(() => '?').join(', ');
    const values = Object.values(talkgroup);

    const sql = `
      INSERT INTO talkgroups (${fields})
      VALUES (${placeholders})
    `;

    await this.db.execute(sql, values);
    const results = await this.db.query<Talkgroup>(
      'SELECT * FROM talkgroups WHERE id = last_insert_rowid()'
    );
    return results[0];
  }

  public async updateTalkgroup(id: number, talkgroup: Partial<Talkgroup>): Promise<Talkgroup | null> {
    const updates = Object.entries(talkgroup)
      .filter(([key]) => key !== 'id' && key !== 'created_at')
      .map(([key]) => `${key} = ?`);
    
    if (updates.length === 0) return null;

    const sql = `
      UPDATE talkgroups
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const values = [
      ...Object.values(talkgroup).filter((_, i) => 
        Object.keys(talkgroup)[i] !== 'id' && 
        Object.keys(talkgroup)[i] !== 'created_at'
      ),
      id
    ];

    await this.db.execute(sql, values);
    return this.getTalkgroupById(id);
  }

  public async deleteTalkgroup(id: number): Promise<void> {
    await this.db.execute('DELETE FROM talkgroups WHERE id = ?', [id]);
  }

  public async getCompleteSystem(systemId: number): Promise<{
    system: TrunkedSystem;
    sites: TrunkedSite[];
    talkgroups: Talkgroup[];
  } | null> {
    const system = await this.getSystemById(systemId);
    if (!system) return null;

    const sites = await this.getSitesBySystemId(systemId);
    const talkgroups = await this.getTalkgroupsBySystemId(systemId);

    return {
      system,
      sites,
      talkgroups
    };
  }
} 
