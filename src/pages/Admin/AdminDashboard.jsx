import React, { useState, useEffect } from 'react';
import { Users, Mail, MapPin, Calendar, Shield, Trash2, Edit, X, Plus } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import './Admin.css';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUser, setNewUser] = useState({ full_name: '', email: '', role: 'organizer' });

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users');
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/users/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setUsers(users.filter(u => u.id !== id));
      } else {
        alert(data.error || 'Failed to delete user.');
      }
    } catch (err) {
      alert('Error deleting user.');
    }
  };

  const handleSaveEdit = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: editingUser.full_name, role: editingUser.role })
      });
      const data = await res.json();
      if (data.success) {
        setEditingUser(null);
        fetchUsers();
      } else {
        alert(data.error || 'Failed to update user.');
      }
    } catch (err) {
      alert('Error updating user.');
    }
  };

  const handleCreateUser = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      const data = await res.json();
      if (data.success) {
        setIsCreatingUser(false);
        setNewUser({ full_name: '', email: '', role: 'organizer' });
        fetchUsers();
      } else {
        alert(data.error || 'Failed to create user.');
      }
    } catch (err) {
      alert('Error creating user.');
    }
  };

  if (loading) return <div className="admin-loading">Loading users...</div>;

  const admins = users.filter(u => u.role === 'admin').length;
  const organizers = users.filter(u => u.role === 'organizer').length;
  const sponsors = users.filter(u => u.role === 'sponsor').length;

  return (
    <div className="admin-dashboard">
      <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Admin Dashboard</h1>
          <p>Manage and oversee all platform users globally.</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => setIsCreatingUser(true)}>Add User</Button>
      </div>

      <div className="admin-stats">
        <Card className="stat-card">
          <Users size={32} className="stat-icon text-blue" />
          <div className="stat-info">
            <h3>Total Users</h3>
            <p>{users.length}</p>
          </div>
        </Card>
        <Card className="stat-card">
          <Shield size={32} className="stat-icon text-purple" />
          <div className="stat-info">
            <h3>Admins</h3>
            <p>{admins}</p>
          </div>
        </Card>
        <Card className="stat-card">
          <Calendar size={32} className="stat-icon text-orange" />
          <div className="stat-info">
            <h3>Organizers</h3>
            <p>{organizers}</p>
          </div>
        </Card>
        <Card className="stat-card">
          <MapPin size={32} className="stat-icon text-green" />
          <div className="stat-info">
            <h3>Sponsors</h3>
            <p>{sponsors}</p>
          </div>
        </Card>
      </div>

      <div className="admin-table-container">
        <h2>Registered Users</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Location</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>
                  <div className="user-name-cell">
                    <div className="user-avatar">{user.full_name ? user.full_name.charAt(0).toUpperCase() : '?'}</div>
                    <span>{user.full_name}</span>
                  </div>
                </td>
                <td>
                  <div className="user-email-cell">
                    <Mail size={16} />
                    <span>{user.email}</span>
                  </div>
                </td>
                <td>
                  <span className={`role-badge role-${user.role}`}>
                    {user.role}
                  </span>
                </td>
                <td>
                  <div className="user-location-cell">
                    <MapPin size={16} />
                    <span>{user.city ? `${user.city}, ${user.state}` : 'N/A'}</span>
                  </div>
                </td>
                <td>
                  <div className="admin-actions">
                    <button className="icon-btn edit-btn" title="Edit User" onClick={() => setEditingUser({...user})}><Edit size={16} /></button>
                    <button className="icon-btn delete-btn" title="Delete User" onClick={() => handleDelete(user.id)}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan="5" className="empty-table">No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingUser && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="modal-header">
              <h2>Edit User</h2>
              <button className="icon-btn" onClick={() => setEditingUser(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  value={editingUser.full_name} 
                  onChange={(e) => setEditingUser({...editingUser, full_name: e.target.value})} 
                  className="modal-input"
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select 
                  value={editingUser.role} 
                  onChange={(e) => setEditingUser({...editingUser, role: e.target.value})} 
                  className="modal-input"
                >
                  <option value="organizer">Organizer</option>
                  <option value="sponsor">Sponsor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setEditingUser(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {isCreatingUser && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="modal-header">
              <h2>Create New User</h2>
              <button className="icon-btn" onClick={() => setIsCreatingUser(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  value={newUser.full_name} 
                  onChange={(e) => setNewUser({...newUser, full_name: e.target.value})} 
                  className="modal-input"
                  placeholder="E.g., John Doe"
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  value={newUser.email} 
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})} 
                  className="modal-input"
                  placeholder="john@example.com"
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select 
                  value={newUser.role} 
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})} 
                  className="modal-input"
                >
                  <option value="organizer">Organizer</option>
                  <option value="sponsor">Sponsor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setIsCreatingUser(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreateUser}>Create User</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
