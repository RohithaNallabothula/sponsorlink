import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import Card from '../../components/common/Card';
import './Auth.css';

const Login = () => {
  const navigate = useNavigate();

  React.useEffect(() => {
    if (localStorage.getItem('user')) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential })
      });
      const data = await response.json();
      if (data.id) {
        localStorage.setItem('user', JSON.stringify(data));
        navigate('/dashboard');
      } else {
        alert(data.error || 'Google login failed.');
      }
    } catch (err) {
      console.error('Google login failed:', err);
      alert('Server error during Google login.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card-wrapper">
        <div className="auth-logo-brand">
          <div className="logo-box">S</div>
          <span className="brand-name">SponsorLink</span>
        </div>
        
        <Card title="Welcome Back">
          <div className="auth-form">
            <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => alert('Google authentication failed.')}
                theme="outline"
                shape="rectangular"
                text="signin_with"
                size="large"
              />
            </div>
          </div>
          
          <div className="auth-footer-text">
            <p>Don't have an account? <Link to="/signup">Create one for free</Link></p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;
