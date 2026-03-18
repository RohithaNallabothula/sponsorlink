const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '..', 'sponsorlink.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run('PRAGMA foreign_keys = OFF');

  // Drop old tables
  ['match_scores', 'messages', 'connections', 'sponsorship_tiers', 'tiers', 'events', 'sponsor_profiles', 'organizer_profiles', 'users'].forEach(t => {
    db.run(`DROP TABLE IF EXISTS ${t}`, err => {
      if (err) console.error(`Drop ${t}:`, err.message);
      else console.log(`✓ Dropped ${t}`);
    });
  });

  // users
  db.run(`CREATE TABLE users (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('organizer','sponsor','admin')),
    bio TEXT,
    city TEXT,
    state TEXT,
    phone_number TEXT,
    avatar_url TEXT,
    onboarded INTEGER NOT NULL DEFAULT 0,
    last_login_at TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  )`, err => { if (err) console.error('users:', err.message); else console.log('✓ Created users'); });

  // organizer_profiles
  db.run(`CREATE TABLE organizer_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    organization_name TEXT,
    organization_type TEXT,
    college_name TEXT,
    college_city TEXT,
    designation TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`, err => { if (err) console.error('organizer_profiles:', err.message); else console.log('✓ Created organizer_profiles'); });

  // sponsor_profiles
  db.run(`CREATE TABLE sponsor_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    company_name TEXT,
    industry TEXT,
    budget_min REAL DEFAULT 0,
    budget_max REAL DEFAULT 0,
    preferred_event_types TEXT,
    geographic_focus TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`, err => { if (err) console.error('sponsor_profiles:', err.message); else console.log('✓ Created sponsor_profiles'); });

  // events
  db.run(`CREATE TABLE events (
    id TEXT PRIMARY KEY,
    organizer_id TEXT NOT NULL,
    event_name TEXT NOT NULL,
    event_description TEXT,
    event_type TEXT,
    event_date TEXT,
    event_end_date TEXT,
    venue_name TEXT,
    location_city TEXT,
    location_state TEXT,
    expected_audience_size INTEGER,
    audience_age_groups TEXT,
    sponsorship_amount_min REAL,
    sponsorship_amount_max REAL,
    sponsorship_offerings TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    image_url TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY(organizer_id) REFERENCES users(id)
  )`, err => { if (err) console.error('events:', err.message); else console.log('✓ Created events'); });

  // sponsorship_tiers
  db.run(`CREATE TABLE sponsorship_tiers (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    tier_name TEXT,
    amount REAL,
    benefits TEXT,
    FOREIGN KEY(event_id) REFERENCES events(id)
  )`, err => { if (err) console.error('sponsorship_tiers:', err.message); else console.log('✓ Created sponsorship_tiers'); });

  // connections
  db.run(`CREATE TABLE connections (
    id TEXT PRIMARY KEY,
    sender_id TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY(sender_id) REFERENCES users(id),
    FOREIGN KEY(receiver_id) REFERENCES users(id)
  )`, err => { if (err) console.error('connections:', err.message); else console.log('✓ Created connections'); });

  // messages
  db.run(`CREATE TABLE messages (
    id TEXT PRIMARY KEY,
    sender_id TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    content TEXT NOT NULL,
    read INTEGER NOT NULL DEFAULT 0,
    sent_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY(sender_id) REFERENCES users(id),
    FOREIGN KEY(receiver_id) REFERENCES users(id)
  )`, err => { if (err) console.error('messages:', err.message); else console.log('✓ Created messages'); });

  // match_scores
  db.run(`CREATE TABLE match_scores (
    id TEXT PRIMARY KEY,
    sponsor_id TEXT NOT NULL,
    event_id TEXT NOT NULL,
    total_score REAL DEFAULT 0,
    budget_score REAL DEFAULT 0,
    industry_score REAL DEFAULT 0,
    location_score REAL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY(sponsor_id) REFERENCES users(id),
    FOREIGN KEY(event_id) REFERENCES events(id)
  )`, err => { if (err) console.error('match_scores:', err.message); else console.log('✓ Created match_scores'); });

  db.run('PRAGMA foreign_keys = ON');
});

db.close(err => {
  if (err) console.error('Close error:', err.message);
  else console.log('\n✅ Migration complete! All tables recreated with correct schema.');
});
