import React, { useState, useEffect } from 'react';
import { Search, Filter, MapPin, Calendar, Users, Check } from 'lucide-react';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import './Discovery.css';

const Discovery = () => {
  const [activeTab, setActiveTab] = useState('events');
  const [search, setSearch] = useState('');
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [allInteractions, setAllInteractions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [eventsRes, usersRes, allRes] = await Promise.all([
        fetch('http://localhost:5000/api/events').then(r => r.json()),
        fetch(`http://localhost:5000/api/users${currentUser.id ? `?exclude=${currentUser.id}` : ''}`).then(r => r.json()),
        fetch(`http://localhost:5000/api/connections/all/${currentUser.id}`).then(r => r.json())
      ]);
      
      setEvents(Array.isArray(eventsRes) ? eventsRes : []);
      setUsers(Array.isArray(usersRes) ? usersRes : []);
      setAllInteractions(Array.isArray(allRes) ? allRes : []);
    } catch (err) {
      console.error('Fetch discovery data failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser.id]);

  const handleConnect = async (receiverId) => {
    if (!currentUser.id) return alert('Please login to connect.');
    try {
      await fetch(`http://localhost:5000/api/connections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: currentUser.id,
          receiver_id: receiverId,
          message: `Hi, I found you on the Discovery page!`
        })
      });
      alert('Connection request sent!');
      fetchData();
    } catch (err) {
      console.error('Connect failed:', err);
    }
  };

  const filteredEvents = events.filter(e =>
    !search ||
    (e.event_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.event_type || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.location_city || '').toLowerCase().includes(search.toLowerCase())
  );

  const filteredUsers = users.filter(u =>
    !search ||
    (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.role || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.city || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="discovery-container">
      <header className="discovery-header">
        <div className="discovery-title">
          <h1>Discovery</h1>
          <p>Find the perfect partners and high-impact events.</p>
        </div>
        <div className="discovery-search">
          <Input
            placeholder={`Search ${activeTab === 'events' ? 'events' : 'people'}...`}
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button variant="outline" icon={Filter}>Filters</Button>
        </div>
      </header>

      <div className="discovery-tabs">
        <button 
          className={`tab-link ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          <Calendar size={18} /> Events
        </button>
        <button 
          className={`tab-link ${activeTab === 'people' ? 'active' : ''}`}
          onClick={() => setActiveTab('people')}
        >
          <Users size={18} /> People
        </button>
      </div>

      <div className="discovery-grid">
        {loading ? (
          <p className="empty-state">Loading discovery...</p>
        ) : activeTab === 'events' ? (
          filteredEvents.length === 0 ? (
            <div className="empty-state-v2">
              <Calendar size={48} />
              <p>No events found. Be the first to list one!</p>
              <Button variant="primary" onClick={() => window.location.href='/add-event'}>Create Event</Button>
            </div>
          ) : (
            filteredEvents.map(event => (
              <Card key={event.id} className="discovery-card" hover={true}>
                <div className="discovery-card-image">
                  <div className="event-type-tag">{event.event_type}</div>
                  <img
                    src={event.image_url || `https://images.unsplash.com/photo-1540575861501-7ad0582373f3?auto=format&fit=crop&q=80&w=400`}
                    alt={event.event_name}
                  />
                </div>
                <div className="discovery-card-content">
                  <h3>{event.event_name}</h3>
                  <p className="organizer-name">by {event.organizer_name || 'Organizer'}</p>

                  <div className="event-meta">
                    <div className="meta-item">
                      <MapPin size={14} />
                      {[event.location_city, event.location_state].filter(Boolean).join(', ') || 'Location TBD'}
                    </div>
                    <div className="meta-item">
                      <Users size={14} />
                      {event.expected_audience_size ? `${event.expected_audience_size} attendees` : 'Audience TBD'}
                    </div>
                    {event.event_date && (
                      <div className="meta-item">
                        <Calendar size={14} />
                        {new Date(event.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    )}
                  </div>

                  <p className="event-desc">{event.event_description}</p>

                  <div className="discovery-card-footer">
                    <div className="budget-tag">
                      <span>Starts at</span>
                      <span className="amount">
                        Rs. {event.sponsorship_amount_min ? event.sponsorship_amount_min.toLocaleString('en-IN') : 'TBD'}
                      </span>
                    </div>
                    <Button variant="primary" size="sm">View Details</Button>
                  </div>
                </div>
              </Card>
            ))
          )
        ) : (
          filteredUsers.length === 0 ? (
            <div className="empty-state-v2">
              <Users size={48} />
              <p>No other people found yet. Invite your network to join SponsorLink!</p>
            </div>
          ) : (
            filteredUsers.map(user => {
              const pendingRequest = allInteractions.find(
                n => (n.sender_id === currentUser.id && n.receiver_id === user.id) && n.status === 'pending'
              );
              const isConnected = allInteractions.some(
                n => (n.sender_id === user.id || n.receiver_id === user.id) && n.status === 'accepted'
              );

              return (
                <Card key={user.id} className="user-discovery-card" hover={true}>
                  <div className="user-avatar-large">{user.full_name?.charAt(0)}</div>
                  <div className="user-info">
                    <h3>{user.full_name}</h3>
                    <Badge variant={user.role === 'sponsor' ? 'success' : 'primary'}>{user.role}</Badge>
                    <p className="user-loc"><MapPin size={14} /> {user.city}, {user.state}</p>
                    <p className="user-email">{user.email}</p>
                  </div>
                  <div className="user-discovery-footer">
                    {isConnected ? (
                      <Button variant="ghost" size="sm" className="full-width" disabled>Connected</Button>
                    ) : pendingRequest ? (
                      <Button variant="ghost" size="sm" className="full-width" disabled>
                        <Check size={14} style={{ marginRight: '4px' }} /> Request Sent
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" className="full-width" onClick={() => handleConnect(user.id)}>Connect</Button>
                    )}
                  </div>
                </Card>
              );
            })
          )
        )}
      </div>
    </div>
  );
};

export default Discovery;
