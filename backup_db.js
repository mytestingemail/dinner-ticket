const fs = require('fs');
const path = require('path');

// Configuration
const DB_FILE = 'tickets.db';
const BACKUP_DIR = 'backups';

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR);
    console.log(`Created backup directory: ${BACKUP_DIR}`);
}

// Generate timestamp for filename
const now = new Date();
const timestamp = now.toISOString().replace(/[:.]/g, '-').split('T').join('_').slice(0, 19);
const backupFilename = `tickets_backup_${timestamp}.db`;
const backupPath = path.join(BACKUP_DIR, backupFilename);

// Perform backup
try {
    if (fs.existsSync(DB_FILE)) {
        fs.copyFileSync(DB_FILE, backupPath);
        console.log(`✅ Backup successful!`);
        console.log(`Source: ${DB_FILE}`);
        console.log(`Destination: ${backupPath}`);

        // Optional: List total backups
        const files = fs.readdirSync(BACKUP_DIR);
        console.log(`Total backups: ${files.length}`);
    } else {
        console.error(`❌ Error: Database file '${DB_FILE}' not found!`);
    }
} catch (error) {
    console.error('❌ Backup failed:', error.message);
}
