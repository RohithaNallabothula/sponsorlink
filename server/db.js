const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Points to the user's existing sponsorlink.db in the project root
const dbPath = path.resolve(__dirname, '..', 'sponsorlink.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database:', dbPath);
    // Enable foreign key enforcement
    db.run('PRAGMA foreign_keys = ON');
  }
});

module.exports = db;
