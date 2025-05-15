const { copyFileSync, mkdirSync, writeFileSync, readFileSync } = require('fs')
const { join } = require('path')

// Create public directory if it doesn't exist
mkdirSync('public', { recursive: true })

// Extract SQL schema from project guide
const projectGuide = readFileSync('PROJECT_GUIDE.md', 'utf8')
const sqlMatch = projectGuide.match(/```sql\n([\s\S]*?)\n```/)
if (sqlMatch) {
  writeFileSync(join('public', 'sqlite-schema.sql'), sqlMatch[1])
}

// Ensure public/data directory exists
mkdirSync(join('public', 'data'), { recursive: true })

// Copy data files to public directory
copyFileSync('data/Common Frequencies.md', join('public', 'data', 'Common Frequencies.md')) 
