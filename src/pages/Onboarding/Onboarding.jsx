import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronRight } from 'lucide-react';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import './Onboarding.css';

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [formData, setFormData] = useState({
    bio: '',
    city: '',
    state: '',
    phone_number: '',
    // Organizer fields
    organization_name: '',
    organization_type: '',
    college_name: '',
    designation: '',
    // Sponsor fields
    company_name: '',
    industry: '',
    budget_min: 0,
    budget_max: '',
    geographic_focus: '',
    preferred_event_types: []
  });

  const isOrganizer = user.role === 'organizer';

  const updateField = (name, value) => setFormData(prev => ({ ...prev, [name]: value }));

  const handleNext = async () => {
    // Validation for Organizer fields at Step 2
    if (step === 2 && isOrganizer) {
      if (!formData.organization_name || !formData.designation) {
        alert('Please fill in all required fields (Organization Name and Designation).');
        return;
      }
    }

    if (step < 3) {
      setStep(step + 1);
    } else {
      try {
        await fetch(`http://localhost:5000/api/users/${user.id}/onboarding`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, role: user.role })
        });
        navigate('/dashboard');
      } catch (err) {
        console.error('Onboarding failed:', err);
      }
    }
  };

  return (
    <div className="onboarding-page">
      <div className="onboarding-stepper">
        {[1, 2, 3].map((s, i) => (
          <React.Fragment key={s}>
            <div className={`step-dot ${step >= s ? 'active' : ''}`}>{s}</div>
            {i < 2 && <div className={`step-line ${step > s ? 'active' : ''}`}></div>}
          </React.Fragment>
        ))}
      </div>

      <div className="onboarding-card-wrapper">
        <Card
          title={step === 1 ? 'Personal Details' : step === 2 ? isOrganizer ? 'Organization Info' : 'Sponsor Info' : 'Location & Contact'}
          subtitle={step === 1 ? `Setting up your ${user.role} profile` : step === 2 ? 'Tell sponsors about your work' : 'Help teams find you'}
        >
          {step === 1 && (
            <div className="onboarding-step-form">
              <div className="input-group">
                <label className="input-label">Professional Bio</label>
                <textarea className="textarea-field" rows="4" placeholder="Describe your goals..." value={formData.bio} onChange={e => updateField('bio', e.target.value)} />
              </div>
            </div>
          )}

          {step === 2 && isOrganizer && (
            <div className="onboarding-step-form">
              <Input label="Organization Name *" placeholder="e.g. BITS Pilani Tech Society" value={formData.organization_name} onChange={e => updateField('organization_name', e.target.value)} />
              <Input label="Designation *" placeholder="e.g. Event Lead" value={formData.designation} onChange={e => updateField('designation', e.target.value)} />
              <Input label="College / Institute" placeholder="e.g. BITS Pilani" value={formData.college_name} onChange={e => updateField('college_name', e.target.value)} />
            </div>
          )}

          {step === 2 && !isOrganizer && (
            <div className="onboarding-step-form">
              <Input label="Company Name" placeholder="e.g. Red Bull India" value={formData.company_name} onChange={e => updateField('company_name', e.target.value)} />
              <Input label="Industry" placeholder="e.g. Energy Drinks" value={formData.industry} onChange={e => updateField('industry', e.target.value)} />
              <Input label="Max Sponsorship Budget (₹)" type="number" placeholder="500000" value={formData.budget_max} onChange={e => updateField('budget_max', e.target.value)} />
            </div>
          )}

          {step === 3 && (
            <div className="onboarding-step-form">
              <Input label="City" placeholder="e.g. Hyderabad" value={formData.city} onChange={e => updateField('city', e.target.value)} />
              <Input label="State" placeholder="e.g. Telangana" value={formData.state} onChange={e => updateField('state', e.target.value)} />
              <Input label="Phone Number" placeholder="+91 XXXXX XXXXX" value={formData.phone_number} onChange={e => updateField('phone_number', e.target.value)} />
            </div>
          )}

          <div className="onboarding-actions">
            {step > 1 && <Button variant="ghost" onClick={() => setStep(step - 1)}>Back</Button>}
            <Button variant="primary" className="ml-auto" onClick={handleNext} icon={step === 3 ? Check : ChevronRight}>
              {step === 3 ? 'Complete Profile' : 'Next Step'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;
