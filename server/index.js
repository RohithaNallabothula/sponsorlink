const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const db = require('./db');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Helper: generate a UUID-like hex id (matching DB default)
const newId = () => crypto.randomBytes(16).toString('hex');

// ─── AUTH ROUTES ─────────────────────────────────────────────────────────────

// POST /api/signup — Create a new user
app.post('/api/signup', (req, res) => {
  const { full_name, email, password, role } = req.body;
  if (!full_name || !email || !password || !role) {
    return res.status(400).json({ error: 'full_name, email, password, and role are required.' });
  }

  const id = newId();
  // In production, use bcrypt to hash password. Here we store as-is for MVP.
  db.run(
    `INSERT INTO users (id, full_name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)`,
    [id, full_name, email, password, role],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(409).json({ error: 'Email already registered.' });
        }
        return res.status(500).json({ error: err.message });
      }
      res.json({ id, full_name, email, role, onboarded: false });
    }
  );
});

// POST /api/login — Authenticate a user
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  db.get(`SELECT * FROM users WHERE email = ? AND password_hash = ?`, [email, password], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: 'Invalid email or password.' });

    db.run(`UPDATE users SET last_login_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`, [user.id]);
    res.json({ id: user.id, full_name: user.full_name, email: user.email, role: user.role });
  });
});

// ─── ONBOARDING / PROFILE ROUTES ─────────────────────────────────────────────

// PUT /api/users/:id/onboarding — Complete organizer or sponsor profile
app.put('/api/users/:id/onboarding', (req, res) => {
  const userId = req.params.id;
  const { role, bio, city, state, phone_number, ...profileData } = req.body;

  // Update base user info
  db.run(
    `UPDATE users SET bio = ?, city = ?, state = ?, phone_number = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`,
    [bio, city, state, phone_number, userId],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });

      // Insert role-specific profile
      if (role === 'organizer') {
        const { organization_name, organization_type, college_name, college_city, designation } = profileData;
        
        if (!organization_name || !designation) {
          return res.status(400).json({ error: 'Organization name and designation are required for organizers.' });
        }

        const pid = newId();
        db.run(
          `INSERT OR REPLACE INTO organizer_profiles (id, user_id, organization_name, organization_type, college_name, college_city, designation) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [pid, userId, organization_name, organization_type, college_name, college_city, designation],
          (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
          }
        );
      } else if (role === 'sponsor') {
        const { company_name, industry, budget_min, budget_max, preferred_event_types, geographic_focus } = profileData;
        const pid = newId();
        db.run(
          `INSERT OR REPLACE INTO sponsor_profiles (id, user_id, company_name, industry, budget_min, budget_max, preferred_event_types, geographic_focus) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [pid, userId, company_name, industry, budget_min || 0, budget_max || 0, preferred_event_types, geographic_focus],
          (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
          }
        );
      } else {
        res.json({ success: true });
      }
    }
  );
});

// ─── EVENT ROUTES ─────────────────────────────────────────────────────────────

// GET /api/events — List all active events
app.get('/api/events', (req, res) => {
  db.all(
    `SELECT e.*, u.full_name as organizer_name 
     FROM events e
     JOIN users u ON u.id = e.organizer_id
     WHERE e.status = 'active' 
     ORDER BY e.created_at DESC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// POST /api/events — Create a new event
app.post('/api/events', (req, res) => {
  const {
    organizer_id, event_name, event_description, event_type, event_date,
    event_end_date, venue_name, location_city, location_state,
    expected_audience_size, audience_age_groups, sponsorship_amount_min,
    sponsorship_amount_max, sponsorship_offerings, contact_email, contact_phone, tiers, image_url
  } = req.body;

  const id = newId();
  db.run(
    `INSERT INTO events (
      id, organizer_id, event_name, event_description, event_type, event_date,
      event_end_date, venue_name, location_city, location_state,
      expected_audience_size, audience_age_groups, sponsorship_amount_min,
      sponsorship_amount_max, sponsorship_offerings, contact_email, contact_phone, image_url
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [id, organizer_id, event_name, event_description, event_type, event_date,
     event_end_date, venue_name, location_city, location_state,
     expected_audience_size, audience_age_groups, sponsorship_amount_min,
     image_url || 'https://images.unsplash.com/photo-1540575861501-7ad0582373f3?auto=format&fit=crop&q=80&w=800'
    ],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });

      // Insert sponsorship tiers if provided
      if (tiers && tiers.length > 0) {
        const stmt = db.prepare(
          `INSERT INTO sponsorship_tiers (id, event_id, tier_name, amount, benefits) VALUES (?,?,?,?,?)`
        );
        tiers.forEach(t => stmt.run(newId(), id, t.name, t.amount, t.benefits));
        stmt.finalize();
      }

      res.json({ id, success: true });
    }
  );
});

// ─── CONNECTIONS ROUTES ───────────────────────────────────────────────────────

// GET /api/connections/requests/:userId — Get all pending requests for a user
app.get('/api/connections/requests/:userId', (req, res) => {
  db.all(
    `SELECT c.*, u.full_name, u.email, u.role FROM connections c
     JOIN users u ON u.id = c.sender_id
     WHERE c.receiver_id = ? AND c.status = 'pending'`,
    [req.params.userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// GET /api/connections/all/:userId — Get all connection attempts (sent or received)
app.get('/api/connections/all/:userId', (req, res) => {
  db.all(
    `SELECT * FROM connections WHERE sender_id = ? OR receiver_id = ?`,
    [req.params.userId, req.params.userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// GET /api/connections/:userId — Get all connections for a user
app.get('/api/connections/:userId', (req, res) => {
  db.all(
    `SELECT c.*, u.full_name, u.email, u.role FROM connections c
     JOIN users u ON (u.id = CASE WHEN c.sender_id = ? THEN c.receiver_id ELSE c.sender_id END)
     WHERE (c.sender_id = ? OR c.receiver_id = ?) AND c.status = 'accepted'`,
    [req.params.userId, req.params.userId, req.params.userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// POST /api/connections — Send a connection request
app.post('/api/connections', (req, res) => {
  const { sender_id, receiver_id, message } = req.body;
  const id = newId();
  db.run(
    `INSERT INTO connections (id, sender_id, receiver_id, message) VALUES (?, ?, ?, ?)`,
    [id, sender_id, receiver_id, message],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id, success: true });
    }
  );
});

// PATCH /api/connections/:id — Accept or reject a connection
app.patch('/api/connections/:id', (req, res) => {
  const { status } = req.body; // 'accepted' or 'rejected'
  db.run(
    `UPDATE connections SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [status, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// ─── MESSAGES ROUTES ──────────────────────────────────────────────────────────

// GET /api/messages/:userId — Get all messages for a user
app.get('/api/messages/:userId', (req, res) => {
  db.all(
    `SELECT m.*, u.full_name as sender_name FROM messages m
     JOIN users u ON u.id = m.sender_id
     WHERE m.receiver_id = ? OR m.sender_id = ?
     ORDER BY m.sent_at DESC`,
    [req.params.userId, req.params.userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// POST /api/messages — Send a message
app.post('/api/messages', (req, res) => {
  const { sender_id, receiver_id, content } = req.body;
  const id = newId();
  db.run(
    `INSERT INTO messages (id, sender_id, receiver_id, content) VALUES (?, ?, ?, ?)`,
    [id, sender_id, receiver_id, content],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id, success: true });
    }
  );
});

// ─── MATCH SCORES ROUTES ──────────────────────────────────────────────────────

// GET /api/matches/:sponsorId — Get top-scored events for a sponsor
app.get('/api/matches/:sponsorId', (req, res) => {
  db.all(
    `SELECT ms.*, e.event_name, e.event_type, e.location_city, e.sponsorship_amount_min, u.full_name as organizer_name
     FROM match_scores ms
     JOIN events e ON e.id = ms.event_id
     JOIN users u ON u.id = e.organizer_id
     WHERE ms.sponsor_id = ?
     ORDER BY ms.total_score DESC
     LIMIT 20`,
    [req.params.sponsorId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// GET /api/users — List all users (excluding current user)
app.get('/api/users', (req, res) => {
  const excludeId = req.query.exclude;
  let query = `SELECT id, full_name, email, role, city, state FROM users`;
  let params = [];
  if (excludeId) {
    query += ` WHERE id != ?`;
    params.push(excludeId);
  }
  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
