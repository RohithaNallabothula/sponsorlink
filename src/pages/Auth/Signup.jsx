import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User } from 'lucide-react';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import './Auth.css';

const Signup = () => {
  const [role, setRole] = useState('organizer');
  const [formData, setFormData] = useState({ full_name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (localStorage.getItem('user')) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formData.full_name,
          email: formData.email,
          password: formData.password,
          role
        })
      });
      const data = await response.json();
      if (data.id) {
        localStorage.setItem('user', JSON.stringify({ ...data, role }));
        navigate('/onboarding');
      } else {
        setError(data.error || 'Signup failed. Please try again.');
      }
    } catch (err) {
      setError('Server error. Please make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card-wrapper">
        <div className="auth-logo-brand">
          <div className="logo-box">S</div>
          <span className="brand-name">SponsorLink</span>
        </div>
        <p className="auth-brand-sub">Join India's premier sponsorship network</p>

        <Card title="Create Account">
          {/* Role Toggle */}
          <div className="role-toggle-pill">
            <button
              type="button"
              className={`toggle-btn ${role === 'organizer' ? 'active' : ''}`}
              onClick={() => setRole('organizer')}
            >
              Event Organizer
            </button>
            <button
              type="button"
              className={`toggle-btn ${role === 'sponsor' ? 'active' : ''}`}
              onClick={() => setRole('sponsor')}
            >
              Sponsor
            </button>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <Input
              label="Full Name"
              name="full_name"
              placeholder="Enter your full name"
              value={formData.full_name}
              onChange={handleChange}
              icon={User}
              required
            />
            <Input
              label="Email Address"
              type="email"
              name="email"
              placeholder="name@company.com"
              value={formData.email}
              onChange={handleChange}
              icon={Mail}
              required
            />
            <div className="password-group">
              <Input
                label="Password"
                type="password"
                name="password"
                placeholder="Min. 6 characters"
                value={formData.password}
                onChange={handleChange}
                icon={Lock}
                required
              />
              <div className="password-strength-bar">
                <div className={`strength-fill ${formData.password.length === 0 ? '' : formData.password.length < 6 ? 'weak' : formData.password.length < 10 ? 'medium' : 'strong'}`}></div>
              </div>
            </div>
            <Input
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              placeholder="Re-enter your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              icon={Lock}
              required
            />

            <div className="terms-row">
              <input type="checkbox" required id="tos" />
              <label htmlFor="tos">I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a></label>
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="auth-footer-text">
            <p>Already have an account? <Link to="/login">Sign In</Link></p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Signup;
