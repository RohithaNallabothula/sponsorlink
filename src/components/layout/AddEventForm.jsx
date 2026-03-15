import React, { useState } from 'react';
import { X, Calendar, MapPin, Users, Target, Info } from 'lucide-react';
import Card from '../common/Card';
import Input from '../common/Input';
import Button from '../common/Button';
import { EVENT_TYPES } from '../../utils/mockData';
import './AddEventForm.css';

const AddEventForm = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    minBudget: '',
    audience: '',
    location: '',
    description: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const CATEGORY_IMAGES = {
    'Technical Fest': 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800',
    'Cultural Fest': 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=800',
    'Sports Event': 'https://images.unsplash.com/photo-1461896704190-3213c9381224?auto=format&fit=crop&q=80&w=800',
    'Corporate Conference': 'https://images.unsplash.com/photo-1475721027187-4024733924f3?auto=format&fit=crop&q=80&w=800',
    'Startup Event': 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&q=80&w=800',
    'Workshop': 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=800',
    'Other': 'https://images.unsplash.com/photo-1540575861501-7ad0582373f3?auto=format&fit=crop&q=80&w=800'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.id) return alert('Please login to create an event.');

    try {
      const response = await fetch('http://localhost:5000/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizer_id: user.id,
          event_name: formData.name,
          event_type: formData.type,
          sponsorship_amount_min: parseInt(formData.minBudget),
          expected_audience_size: formData.audience,
          location_city: formData.location.split(',')[0].trim(),
          location_state: formData.location.split(',')[1]?.trim() || '',
          event_description: formData.description,
          image_url: CATEGORY_IMAGES[formData.type] || CATEGORY_IMAGES['Other']
        })
      });

      if (response.ok) {
        alert('Event created successfully!');
        onClose();
      } else {
        const err = await response.json();
        alert(`Error: ${err.error}`);
      }
    } catch (err) {
      console.error('Failed to create event:', err);
      alert('Failed to connect to server.');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <Card 
          title="Create New Event" 
          subtitle="Define your event to get matched with the right sponsors"
          footer={
            <div className="modal-footer-btns">
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button variant="primary" onClick={handleSubmit}>Create Listing</Button>
            </div>
          }
        >
          <form className="add-event-form">
            <div className="form-grid">
              <Input
                label="Event Name"
                name="name"
                placeholder="e.g. Annual Tech Fest 2026"
                value={formData.name}
                onChange={handleChange}
                icon={Info}
                required
              />
              <div className="input-group">
                <label className="input-label">Event Category</label>
                <select className="select-field" name="type" value={formData.type} onChange={handleChange}>
                  <option value="">Select Category</option>
                  {EVENT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
              <Input
                label="Minimum Sponsorship (Rs.)"
                name="minBudget"
                type="number"
                placeholder="100"
                value={formData.minBudget}
                onChange={handleChange}
                icon={Target}
                required
              />
              <Input
                label="Expected Audience"
                name="audience"
                placeholder="e.g. 500+ Students"
                value={formData.audience}
                onChange={handleChange}
                icon={Users}
                required
              />
            </div>
            <Input
              label="Location"
              name="location"
              placeholder="e.g. Mumbai, Maharashtra"
              value={formData.location}
              onChange={handleChange}
              icon={MapPin}
              required
            />
            <div className="input-group">
              <label className="input-label">Description</label>
              <textarea 
                className="textarea-field"
                name="description"
                placeholder="Tell sponsors what makes your event unique..."
                value={formData.description}
                onChange={handleChange}
                rows="4"
              />
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default AddEventForm;
