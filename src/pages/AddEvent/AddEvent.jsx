import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Plus, Trash2, MapPin, Users } from 'lucide-react';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import './AddEvent.css';

const AGE_GROUPS = ['13-18', '18-25', '25-35', '35+'];
const EVENT_TYPES = [
  { label: 'Technical Fest', value: 'technical_fest' },
  { label: 'Cultural Fest', value: 'cultural_fest' },
  { label: 'Startup Event', value: 'startup_event' },
  { label: 'Workshop', value: 'workshop' },
  { label: 'Sports Event', value: 'sports_event' },
  { label: 'Other', value: 'other' }
];

const AddEvent = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    event_name: '',
    event_description: '',
    event_type: 'technical_fest',
    event_date: '',
    venue_name: '',
    location_city: '',
    location_state: '',
    expected_audience_size: '',
    sponsorship_amount_min: '',
    sponsorship_amount_max: '',
    sponsorship_offerings: '',
    contact_email: ''
  });

  const [tiers, setTiers] = useState([{ name: 'Title', amount: '', benefits: '' }]);
  const [selectedAgeGroups, setSelectedAgeGroups] = useState(['18-25']);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addTier = () => setTiers([...tiers, { name: '', amount: '', benefits: '' }]);
  const removeTier = (index) => setTiers(tiers.filter((_, i) => i !== index));

  const toggleAgeGroup = (age) => {
    if (selectedAgeGroups.includes(age)) {
      setSelectedAgeGroups(selectedAgeGroups.filter(a => a !== age));
    } else {
      setSelectedAgeGroups([...selectedAgeGroups, age]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const payload = { ...formData, audience_age_groups: selectedAgeGroups.join(','), organizer_id: user?.id, tiers };
    try {
      await fetch('http://localhost:5000/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      navigate('/discovery');
    } catch (err) {
      console.error('Failed to post event:', err);
    }
  };

  return (
    <div className="add-event-page">
      <div className="section-header">
        <h1><Calendar size={32} className="header-icon" /> Add Event</h1>
      </div>

      <div className="builder-layout">
        {/* Form Column */}
        <div className="builder-form-col">
          <form className="event-form" onSubmit={handleSubmit}>
            <Input label="Event Name" name="event_name" value={formData.event_name} onChange={handleChange} placeholder="e.g. TechX 2026" />
            
            <div className="form-row">
              <div className="input-group">
                <label className="input-label">Event Type</label>
                <select name="event_type" className="select-field" value={formData.event_type} onChange={handleChange}>
                  {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <Input label="Event Date" name="event_date" type="date" value={formData.event_date} onChange={handleChange} />
            </div>
            <div className="form-row">
              <Input label="Min Sponsorship (₹)" name="sponsorship_amount_min" type="number" value={formData.sponsorship_amount_min} onChange={handleChange} placeholder="10,000" />
              <Input label="Max Sponsorship (₹)" name="sponsorship_amount_max" type="number" value={formData.sponsorship_amount_max} onChange={handleChange} placeholder="5,00,000" />
            </div>

            <div className="tiers-section">
              <div className="section-sub-header">
                <h3>Sponsorship Tiers</h3>
                <button type="button" className="add-tier-link" onClick={addTier}>+ Add Tier</button>
              </div>
              {tiers.map((tier, idx) => (
                <div key={idx} className="tier-row">
                  <input placeholder="Tier Name (e.g. Co-Sponsor)" value={tier.name} onChange={(e) => {
                    const newTiers = [...tiers];
                    newTiers[idx].name = e.target.value;
                    setTiers(newTiers);
                  }} />
                  <input placeholder="Amount (₹)" type="number" value={tier.amount} onChange={(e) => {
                    const newTiers = [...tiers];
                    newTiers[idx].amount = e.target.value;
                    setTiers(newTiers);
                  }} />
                  <button type="button" onClick={() => removeTier(idx)} className="btn-remove"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>

            <div className="input-group">
              <label className="input-label">Sponsorship Offerings</label>
              <textarea name="sponsorship_offerings" rows="4" value={formData.sponsorship_offerings} onChange={handleChange} placeholder="Detail branding, stage time, social media reach..." className="textarea-field"></textarea>
            </div>

            <div className="form-row">
              <Input label="Expected Audience Size" name="expected_audience_size" type="number" value={formData.expected_audience_size} onChange={handleChange} placeholder="5000" />
              <div className="input-group">
                <label className="input-label">Target Age Group</label>
                <div className="age-chips">
                  {AGE_GROUPS.map(age => (
                    <div 
                      key={age} 
                      className={`age-chip ${selectedAgeGroups.includes(age) ? 'active' : ''}`}
                      onClick={() => toggleAgeGroup(age)}
                    >
                      {age}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="form-row">
              <Input label="City" name="location_city" value={formData.location_city} onChange={handleChange} placeholder="e.g. Hyderabad" />
              <Input label="State" name="location_state" value={formData.location_state} onChange={handleChange} placeholder="e.g. Telangana" />
            </div>
            <Input label="Contact Email" name="contact_email" value={formData.contact_email} onChange={handleChange} placeholder="contact@event.com" />

            <Button type="submit" variant="primary" className="btn-submit-event">Post Event Listing</Button>
          </form>
        </div>

        {/* Preview Column */}
        <div className="builder-preview-col">
          <div className="sticky-preview">
            <h4 className="preview-label">Event Listing Preview</h4>
            <Card className="preview-card" hover={false}>
              <div className="preview-img-placeholder">
                <Badge variant="primary" className="type-badge">{formData.event_type.replace('_', ' ')}</Badge>
              </div>
              <div className="preview-content">
                <h2 className="preview-title">{formData.event_name || 'Your Event Name'}</h2>
                <p className="preview-org">{formData.location_city ? `${formData.location_city}, ${formData.location_state}` : 'Location'}</p>
                
                <div className="preview-meta">
                  <span><MapPin size={14} /> {formData.location_city || 'City'}</span>
                  <span><Users size={14} /> {formData.expected_audience_size || '0'} People</span>
                </div>

                <div className="preview-amount">
                  <span className="amt-label">Seeking</span>
                  <span className="amt-value">₹{formData.sponsorship_amount_min || '0'}</span>
                </div>

                {tiers.length > 0 && (
                  <div className="preview-tiers">
                    <table>
                      <thead>
                        <tr>
                          <th>Tier</th>
                          <th>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tiers.map((t, i) => (
                          <tr key={i}>
                            <td>{t.name || 'Tier'}</td>
                            <td>₹{t.amount || '0'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddEvent;
