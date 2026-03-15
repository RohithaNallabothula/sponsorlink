import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, UserPlus, Check, X, Star, ChevronRight, Handshake } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import './Network.css';


const Network = () => {
  const [requests, setRequests] = useState([]);
  const [matches, setMatches] = useState([]);
  const [users, setUsers] = useState([]);
  const [network, setNetwork] = useState([]);
  const [allInteractions, setAllInteractions] = useState([]); // To track sent/received/pending for filtering
  const [loading, setLoading] = useState(true);
  
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchData = async () => {
    if (!currentUser.id) return;
    setLoading(true);
    try {
      const [reqs, matchRes, userRes, netRes, allRes] = await Promise.all([
        fetch(`http://localhost:5000/api/connections/requests/${currentUser.id}`).then(r => r.json()),
        fetch(`http://localhost:5000/api/matches/${currentUser.id}`).then(r => r.json()),
        fetch(`http://localhost:5000/api/users?exclude=${currentUser.id}`).then(r => r.json()),
        fetch(`http://localhost:5000/api/connections/${currentUser.id}`).then(r => r.json()),
        fetch(`http://localhost:5000/api/connections/all/${currentUser.id}`).then(r => r.json())
      ]);
      
      if (Array.isArray(reqs)) setRequests(reqs);
      if (Array.isArray(matchRes)) setMatches(matchRes);
      if (Array.isArray(userRes)) setUsers(userRes);
      if (Array.isArray(netRes)) setNetwork(netRes);
      if (Array.isArray(allRes)) setAllInteractions(allRes);
    } catch (err) {
      console.error('Failed to fetch network data:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, [currentUser.id]);

  const handleConnection = async (connectionId, status) => {
    try {
      await fetch(`http://localhost:5000/api/connections/${connectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchData(); // Refresh all data
    } catch (err) {
      console.error(`Failed to ${status} connection:`, err);
    }
  };

  const handleConnect = async (receiverId) => {
    try {
      await fetch(`http://localhost:5000/api/connections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: currentUser.id,
          receiver_id: receiverId,
          message: `Hello! I'd like to connect.`
        })
      });
      alert('Connection request sent!');
      fetchData();
    } catch (err) {
      console.error('Failed to send connection request:', err);
    }
  };

  if (loading) return <div className="loading">Loading network...</div>;

  return (
    <div className="network-page">
      {/* Connection Requests Section */}
      {requests.length > 0 && (
        <section className="network-section">
          <div className="section-header-row">
            <h2 className="section-title">Connection Requests</h2>
            <Badge variant="primary">{requests.length}</Badge>
          </div>
          <Card className="requests-card">
            {requests.map(req => (
              <div key={req.id} className="request-item">
                <div className="req-user">
                  <div className="avatar-circle">{req.full_name?.charAt(0)}</div>
                  <div className="req-info">
                    <h4>{req.full_name}</h4>
                    <p>{req.email} • {req.role}</p>
                    {req.message && <p className="req-msg">"{req.message}"</p>}
                  </div>
                </div>
                <div className="req-actions">
                  <Button variant="outline" className="btn-reject" size="sm" onClick={() => handleConnection(req.id, 'rejected')}>Reject</Button>
                  <Button variant="primary" size="sm" onClick={() => handleConnection(req.id, 'accepted')}>Accept</Button>
                </div>
              </div>
            ))}
          </Card>
        </section>
      )}

      {/* Smart Match Recommendations */}
      {matches.length > 0 && (
        <section className="network-section">
          <h2 className="section-title">Smart Match Recommendations</h2>
          <div className="match-carousel">
            {matches.map(match => (
              <Card key={match.id} className="match-card" hover={true}>
                <div className="match-avatar-large">?</div>
                <h3>{match.event_name}</h3>
                <p className="match-email">Organizer: {match.organizer_name}</p>
                <div className="badge-match-pnt">
                  <Badge className="badge-match">{Math.round(match.total_score)}% Match</Badge>
                </div>
                <Button variant="outline" className="btn-connect-sm" onClick={() => handleConnect(match.organizer_id)}>Connect</Button>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* All Users Grid */}
      <section className="network-section">
        <h2 className="section-title">Discover People</h2>
        <div className="users-grid">
          {users
            .filter(u => 
              // Hide if already in network (accepted) or if they sent us a request
              !network.some(n => n.sender_id === u.id || n.receiver_id === u.id) &&
              !requests.some(r => r.sender_id === u.id)
            )
            .map(user => {
              const pendingRequest = allInteractions.find(
                n => (n.sender_id === currentUser.id && n.receiver_id === user.id) && n.status === 'pending'
              );
              
              return (
                <Card key={user.id} className="user-card" hover={true}>
                  <div className="user-avatar-initial">{user.full_name?.charAt(0)}</div>
                  <h3>{user.full_name}</h3>
                  <p>{user.email}</p>
                  <p className="user-role">{user.role} • {user.city}</p>
                  {pendingRequest ? (
                    <Button variant="ghost" className="btn-connect-sm" disabled>
                      <Check size={14} style={{ marginRight: '4px' }} /> Request Sent
                    </Button>
                  ) : (
                    <Button variant="outline" className="btn-connect-sm" onClick={() => handleConnect(user.id)}>Connect</Button>
                  )}
                </Card>
              );
            })}
        </div>
      </section>

      {/* Your Network Section */}
      <section className="network-section">
        <h2 className="section-title">Your Network</h2>
        {network.length > 0 ? (
          <div className="users-grid">
            {network.map(conn => (
              <Card key={conn.id} className="user-card" hover={true}>
                <div className="user-avatar-initial">{conn.full_name?.charAt(0)}</div>
                <h3>{conn.full_name}</h3>
                <p>{conn.email}</p>
                <Badge variant="success">{conn.role}</Badge>
                <Link to="/messages" className="message-link-btn">
                  <Button variant="outline" size="sm" className="full-width">Message</Button>
                </Link>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="empty-network-card">
            <div className="empty-state">
              <div className="empty-icon"><Handshake size={48} /></div>
              <h3>You haven't connected with anyone yet.</h3>
              <p>Start discovering sponsors and organizers to grow your network.</p>
              <Button variant="primary">Discover People</Button>
            </div>
          </Card>
        )}
      </section>
    </div>
  );
};

export default Network;
