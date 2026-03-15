import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Briefcase } from 'lucide-react';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
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
    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (data.id) {
        localStorage.setItem('user', JSON.stringify(data));
        navigate('/dashboard');
      } else {
        alert(data.error || 'Invalid credentials.');
      }
    } catch (err) {
      console.error('Login failed:', err);
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
          <form onSubmit={handleSubmit} className="auth-form">
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
            <Input
              label="Password"
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              icon={Lock}
              required
            />
            <div className="auth-actions-row">
              <label className="remember-me-chk">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <a href="#" className="forgot-link">Forgot password?</a>
            </div>
            <Button type="submit" variant="primary" className="full-width">Sign In</Button>
          </form>
          
          <div className="auth-footer-text">
            <p>Don't have an account? <Link to="/signup">Create one for free</Link></p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;
