import { Database } from 'sql.js'
import { parseCSV } from './csv-parser'

export async function importTrunkedSystems(db: Database, csv: string) {
  const rows = parseCSV(csv)
  const stmt = db.prepare(`
    INSERT INTO trunked_systems (
      system_id, name, type, system_class, business_type, business_owner, description, wacn, system_protocol, notes, active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  for (const row of rows) {
    stmt.run([
      row['system_id'],
      row['name'],
      row['type'],
      row['system_class'],
      row['business_type'],
      row['business_owner'],
      row['description'],
      row['wacn'],
      row['system_protocol'],
      row['notes'],
      row['active'] ?? 1
    ])
  }
  stmt.free()
}

export async function importTrunkedSites(db: Database, csv: string, systemIdMap: Record<string, number>) {
  const rows = parseCSV(csv)
  const stmt = db.prepare(`
    INSERT INTO trunked_sites (
      system_id, site_id, name, description, county, state, latitude, longitude, range_miles, nac, active, distance_from_kc
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  for (const row of rows) {
    stmt.run([
      systemIdMap[row['system_id']],
      row['site_id'],
      row['name'],
      row['description'],
      row['county'],
      row['state'],
      row['latitude'],
      row['longitude'],
      row['range_miles'],
      row['nac'],
      row['active'] ?? 1,
      row['distance_from_kc']
    ])
  }
  stmt.free()
}

export async function importTalkgroups(db: Database, csv: string, systemIdMap: Record<string, number>) {
  const rows = parseCSV(csv)
  const stmt = db.prepare(`
    INSERT INTO talkgroups (
      system_id, decimal_id, hex_id, alpha_tag, description, mode, category, tag, priority, active, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  for (const row of rows) {
    stmt.run([
      systemIdMap[row['system_id']],
      row['decimal_id'],
      row['hex_id'],
      row['alpha_tag'],
      row['description'],
      row['mode'],
      row['category'],
      row['tag'],
      row['priority'] ?? 0,
      row['active'] ?? 1,
      row['notes']
    ])
  }
  stmt.free()
} 
