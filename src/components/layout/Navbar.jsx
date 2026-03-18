import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { MessageSquare, User, Users, LogOut, Link2, Plus, Search, Bell, Shield } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();
  const [notifCount, setNotifCount] = useState(0);

  const fetchNotifications = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`http://localhost:5000/api/connections/requests/${user.id}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setNotifCount(data.length);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [user?.id]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
    window.location.reload(); 
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">
        <Link2 size={32} color="#E8621A" />
        <span>SponsorLink</span>
      </Link>
      <div className="navbar-links">
        {user && (
          <>
            {user.role === 'admin' && (
              <NavLink to="/admin" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
                <Shield size={20} />
                <span>Admin</span>
              </NavLink>
            )}
            <NavLink to="/discovery" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
              <Search size={20} />
              <span>Discovery</span>
            </NavLink>
            <NavLink to="/network" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
              <div className="nav-icon-wrapper">
                <Users size={20} />
                {notifCount > 0 && <span className="nav-badge">{notifCount}</span>}
              </div>
              <span>Network</span>
            </NavLink>
            <NavLink to="/messages" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
              <MessageSquare size={20} />
              <span>Messages</span>
            </NavLink>
            <NavLink to="/add-event" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
              <Plus size={20} />
              <span>Add Event</span>
            </NavLink>
            <NavLink to={`/profile/${user.id}`} className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
              <User size={20} />
              <span>Profile</span>
            </NavLink>
          </>
        )}
      </div>
      <div className="navbar-auth">
        {!user ? (
          <NavLink to="/login" className="nav-item">
            <span>Sign In</span>
          </NavLink>
        ) : (
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
