import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Calendar, TrendingUp, Search, Sliders } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Input from '../../components/common/Input';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('events');
  const [events, setEvents] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchData = () => {
    setLoading(true);
    const eventsPromise = user.id
      ? fetch(`http://localhost:5000/api/events`)
          .then(r => r.json())
          .then(data => setEvents(Array.isArray(data) ? data.filter(e => e.organizer_id === user.id) : []))
          .catch(() => setEvents([]))
      : Promise.resolve();

    const connectionsPromise = user.id
      ? fetch(`http://localhost:5000/api/connections/${user.id}`)
          .then(r => r.json())
          .then(data => setConnections(Array.isArray(data) ? data : []))
          .catch(() => setConnections([]))
      : Promise.resolve();

    Promise.all([eventsPromise, connectionsPromise]).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="welcome-section">
          <h1>Welcome back, {user.full_name || 'User'}</h1>
          <p>
            {events.length > 0
              ? `You have ${events.length} active event${events.length > 1 ? 's' : ''}.`
              : 'Create your first event to get matched with sponsors.'}
          </p>
        </div>
        <div className="header-actions">
          <Button variant="primary" icon={Plus} onClick={() => navigate('/add-event')}>Create Event</Button>
        </div>
      </header>

      <div className="dashboard-stats">
        <Card className="stat-card" hover={false}>
          <div className="stat-icon purple"><Calendar size={24} /></div>
          <div className="stat-info">
            <h3>{events.length}</h3>
            <p>Active Events</p>
          </div>
        </Card>
        <Card className="stat-card" hover={false}>
          <div className="stat-icon pink"><Users size={24} /></div>
          <div className="stat-info">
            <h3>{connections.length}</h3>
            <p>Connections</p>
          </div>
        </Card>
        <Card className="stat-card" hover={false}>
          <div className="stat-icon cyan"><TrendingUp size={24} /></div>
          <div className="stat-info">
            <h3>{user.id ? 'Active' : '—'}</h3>
            <p>Account Status</p>
          </div>
        </Card>
      </div>

      <div className="dashboard-main">
        <div className="content-left">
          <div className="tabs">
            <button
              className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`}
              onClick={() => setActiveTab('events')}
            >
              My Events
            </button>
            <button
              className={`tab-btn ${activeTab === 'connections' ? 'active' : ''}`}
              onClick={() => setActiveTab('connections')}
            >
              Connections
            </button>
          </div>

          <div className="tab-content">
            {loading ? (
              <p className="empty-state">Loading...</p>
            ) : activeTab === 'events' ? (
              <div className="event-list">
                {events.length === 0 ? (
                  <p className="empty-state">No events yet. Create your first event!</p>
                ) : (
                  events.map(event => (
                    <Card key={event.id} className="event-item" hover={true}>
                      <div className="event-item-header">
                        <h3>{event.event_name}</h3>
                        <Badge variant="success">{event.status}</Badge>
                      </div>
                      <div className="event-item-details">
                        <p><Calendar size={14} /> {event.event_type}</p>
                        <p><Users size={14} /> {event.expected_audience_size ? `${event.expected_audience_size} attendees` : 'Audience TBD'}</p>
                      </div>
                      <div className="event-item-footer">
                        <span className="budget">
                          Target: Rs. {event.sponsorship_amount_min || 'TBD'}
                        </span>
                        <Button variant="outline" size="sm">Manage</Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            ) : (
              <div className="sponsor-list">
                {connections.length === 0 ? (
                  <p className="empty-state">No connections yet. Start networking!</p>
                ) : (
                  connections.map(conn => (
                    <Card key={conn.id} className="sponsor-item" hover={true}>
                      <div className="sponsor-item-header">
                        <div className="sponsor-info">
                          <h3>{conn.full_name}</h3>
                          <p>{conn.email} • {conn.role}</p>
                        </div>
                        <Badge variant="success">{conn.status}</Badge>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <aside className="content-right">
          <Card className="search-card" title="Global Discovery">
            <Input placeholder="Search sponsors, events..." icon={Search} />
            <div className="quick-filters">
              <Button variant="ghost" size="sm" icon={Sliders}>Filters</Button>
            </div>
          </Card>

          <Card className="premium-upsell glass" title="Upgrade to Premium">
            <p>Get unlimited matches and priority placement for your events.</p>
            <Button variant="secondary" className="full-width">Go Premium</Button>
          </Card>
        </aside>
      </div>
    </div>
  );
};

export default Dashboard;
