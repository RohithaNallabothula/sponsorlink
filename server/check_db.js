const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, '..', 'sponsorlink.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  console.log('--- Database Status Report ---');
  db.get("SELECT count(*) as count FROM users", (err, row) => {
    console.log(`Users registered: ${row ? row.count : 0}`);
  });
  db.get("SELECT count(*) as count FROM events", (err, row) => {
    console.log(`Events listed: ${row ? row.count : 0}`);
  });
  db.get("SELECT count(*) as count FROM messages", (err, row) => {
    console.log(`Messages sent: ${row ? row.count : 0}`);
  });
  db.get("SELECT count(*) as count FROM connections", (err, row) => {
    console.log(`Connections: ${row ? row.count : 0}`);
  });
});

db.close();
