import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { User, Mail, MapPin, Briefcase, Globe, Award, Edit3, Save, X } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import './Profile.css';

const Profile = () => {
  const { id } = useParams();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/users/${id}`);
        const data = await res.json();
        setProfileData({
          name: data.full_name,
          role: data.role,
          email: data.email,
          location: data.city ? `${data.city}, ${data.state}` : 'Not specified',
          bio: data.bio || 'No bio provided.',
          organization: data.profile_details?.organization_name || data.profile_details?.company_name || 'Independent',
          pastEvents: ['TechX 2025', 'Innovate Rajasthan'], // Mock for now
          skills: ['Project Management', 'Tech Strategy', 'Sponsorship'] // Mock for now
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchUser();
  }, [id]);

  const handleSave = () => {
    setIsEditing(false);
    // In a real app, this would be an API call
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Profile...</div>;
  if (!profileData) return <div style={{ padding: '2rem', textAlign: 'center' }}>User not found.</div>;

  return (
    <div className="profile-container">
      <div className="profile-header-stack">
        <div className="profile-banner glass"></div>
        <div className="profile-info-card">
          <div className="profile-avatar-large">{profileData.name ? profileData.name.charAt(0).toUpperCase() : '?'}</div>
          <div className="profile-main-info">
            <div className="profile-name-section">
              <h1>{profileData.name}</h1>
              <Badge variant="primary">{profileData.role}</Badge>
            </div>
            <p className="profile-tagline">{profileData.organization}</p>
            <div className="profile-meta-row">
              <span className="meta-item"><MapPin size={16} /> {profileData.location}</span>
              <span className="meta-item"><Globe size={16} /> sponsorlink.me/aryan</span>
            </div>
          </div>
          <div className="profile-header-actions">
            {!isEditing ? (
              <Button variant="outline" icon={Edit3} onClick={() => setIsEditing(true)}>Edit Profile</Button>
            ) : (
              <div className="edit-actions">
                <Button variant="ghost" icon={X} onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button variant="primary" icon={Save} onClick={handleSave}>Save Changes</Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-column-left">
          <Card title="About">
            {isEditing ? (
              <textarea 
                className="edit-bio" 
                value={profileData.bio} 
                onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
              />
            ) : (
              <p className="profile-bio">{profileData.bio}</p>
            )}
          </Card>
          
          <Card title="Core Skills & Focus">
            <div className="skills-grid">
              {profileData.skills.map(skill => (
                <Badge key={skill} variant="secondary">{skill}</Badge>
              ))}
              {isEditing && <Button variant="ghost" size="sm">+ Add Skill</Button>}
            </div>
          </Card>
        </div>

        <div className="profile-column-right">
          <Card title="Account Information" className="info-card">
            <div className="info-rows">
              <div className="info-row">
                <label>Email</label>
                {isEditing ? (
                  <input type="email" value={profileData.email} onChange={(e) => setProfileData({...profileData, email: e.target.value})} />
                ) : (
                  <span>{profileData.email}</span>
                )}
              </div>
              <div className="info-row">
                <label>Location</label>
                {isEditing ? (
                  <input type="text" value={profileData.location} onChange={(e) => setProfileData({...profileData, location: e.target.value})} />
                ) : (
                  <span>{profileData.location}</span>
                )}
              </div>
            </div>
          </Card>

          <Card title="Past Sponsorship Success" className="success-card">
            <div className="past-events-list">
              {profileData.pastEvents.map(event => (
                <div key={event} className="past-event-item">
                  <Award size={18} className="success-icon" />
                  <span>{event}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
