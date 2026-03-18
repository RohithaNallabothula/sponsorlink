const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
require('dotenv').config();
const { OAuth2Client } = require('google-auth-library');
const db = require('./db');
const app = express();
const PORT = process.env.PORT || 5000;

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

app.use(cors());
app.use(express.json());

// Helper: generate a UUID-like hex id (matching DB default)
const newId = () => crypto.randomBytes(16).toString('hex');

// ─── AUTH ROUTES ─────────────────────────────────────────────────────────────

// ─── AUTH ROUTES ─────────────────────────────────────────────────────────────

// POST /api/auth/google — Authenticate via Google
app.post('/api/auth/google', async (req, res) => {
  const { credential, role } = req.body;
  if (!credential) {
    return res.status(400).json({ error: 'Google credential is required.' });
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload.email;
    const full_name = payload.name;

    db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      
      const isAdmin = email.toLowerCase() === 'nallabothularohitha@gmail.com';
      let finalRole = isAdmin ? 'admin' : role;

      if (user) {
        if (isAdmin && user.role !== 'admin') {
          db.run(`UPDATE users SET role = 'admin', last_login_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`, [user.id]);
          return res.json({ id: user.id, full_name: user.full_name, email: user.email, role: 'admin' });
        } else {
          db.run(`UPDATE users SET last_login_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`, [user.id]);
          return res.json({ id: user.id, full_name: user.full_name, email: user.email, role: user.role });
        }
      } else {
        if (!finalRole) {
          return res.status(401).json({ error: 'Account not found. Please sign up first.' });
        }
        
        const id = newId();
        const randomPassword = crypto.randomBytes(32).toString('hex');
        bcrypt.hash(randomPassword, 10, (err, hash) => {
          if (err) return res.status(500).json({ error: 'Error hashing password.' });
          
          db.run(
            `INSERT INTO users (id, full_name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)`,
            [id, full_name, email, hash, finalRole],
            function(err) {
              if (err) {
                if (err.message.includes('UNIQUE')) {
                  return res.status(409).json({ error: 'Email already registered.' });
                }
                return res.status(500).json({ error: err.message });
              }
              res.json({ id, full_name, email, role: finalRole, onboarded: false });
            }
          );
        });
      }
    });
  } catch (error) {
    console.error('Error verifying Google token:', error);
    res.status(401).json({ error: 'Invalid Google token.' });
  }
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

// GET /api/users/:id — Get specific user profile
app.get('/api/users/:id', (req, res) => {
  db.get(`SELECT id, full_name, email, role, bio, city, state, phone_number, created_at FROM users WHERE id = ?`, [req.params.id], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Fetch associated sub-profile
    if (user.role === 'organizer') {
      db.get(`SELECT * FROM organizer_profiles WHERE user_id = ?`, [user.id], (err, profile) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ ...user, profile_details: profile || {} });
      });
    } else if (user.role === 'sponsor') {
      db.get(`SELECT * FROM sponsor_profiles WHERE user_id = ?`, [user.id], (err, profile) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ ...user, profile_details: profile || {} });
      });
    } else {
      res.json(user);
    }
  });
});

// POST /api/users — Admin manually create a user
app.post('/api/users', async (req, res) => {
  const { full_name, email, role } = req.body;
  if (!full_name || !email || !role) {
    return res.status(400).json({ error: 'full_name, email, and role are required.' });
  }

  const id = newId();
  try {
    const hash = await bcrypt.hash(email + id, 10); // generate dummy password hash
    
    db.run(
      `INSERT INTO users (id, full_name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)`,
      [id, full_name, email, hash, role],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'An account with this email already exists.' });
          }
          return res.status(500).json({ error: err.message });
        }
        res.json({ success: true, id, full_name, email, role });
      }
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:id — Setup for Admin to update user basic info
app.put('/api/users/:id', (req, res) => {
  const { full_name, role } = req.body;
  if (!full_name || !role) {
    return res.status(400).json({ error: 'full_name and role are required.' });
  }

  db.run(
    `UPDATE users SET full_name = ?, role = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`,
    [full_name, role, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// DELETE /api/users/:id — Setup for Admin to delete user
app.delete('/api/users/:id', (req, res) => {
  // Simplistic approach, normally you'd delete related rows logically or have CASCADE ON DELETE in DB schema. For now we delete the user.
  db.run(`DELETE FROM users WHERE id = ?`, [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
