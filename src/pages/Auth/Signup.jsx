import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import Card from '../../components/common/Card';
import './Auth.css';

const Signup = () => {
  const [role, setRole] = useState('organizer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (localStorage.getItem('user')) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential, role })
      });
      const data = await response.json();
      if (data.id) {
        localStorage.setItem('user', JSON.stringify(data));
        if (!data.onboarded) {
          navigate('/onboarding');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(data.error || 'Google signup failed. Please try again.');
      }
    } catch (err) {
      setError('Server error during Google signup.');
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

          <div className="auth-form" style={{ marginTop: '20px' }}>
            <div className="terms-row" style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
              <input type="checkbox" required id="tos" defaultChecked />
              <label htmlFor="tos">I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a></label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google authentication failed.')}
                theme="outline"
                shape="rectangular"
                text="signup_with"
                size="large"
              />
            </div>
          </div>

          <div className="auth-footer-text">
            <p>Already have an account? <Link to="/login">Sign In</Link></p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Signup;
