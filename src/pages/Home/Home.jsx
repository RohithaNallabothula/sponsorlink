import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, Users, Zap, Compass, Star } from 'lucide-react';
import Button from '../../components/common/Button';
import './Home.css';

const CATEGORIES = [
  'Technical Fest', 'Cultural Fest', 'Startup Event', 'Workshop', 
  'Sports Event', 'Corporate Conf', 'Exhibition'
];

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Find Your Perfect Event Sponsor</h1>
          <p className="subheadline">
            SponsorLink matches event organizers with brands and individuals 
            ready to sponsor — intelligently.
          </p>
          <div className="hero-actions">
            <Button variant="primary" onClick={() => navigate('/signup')}>
              Post Your Event
            </Button>
            <Button variant="outline" onClick={() => navigate('/discovery')}>
              Find Events to Sponsor
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <div className="section-header">
          <h2>How It Works</h2>
        </div>
        <div className="steps-grid">
          <div className="step-item">
            <div className="step-icon"><Users size={32} /></div>
            <h3>Create Your Profile</h3>
            <p>Tell us about your organization or brand and what you're looking for.</p>
          </div>
          <div className="step-item">
            <div className="step-icon"><Zap size={32} /></div>
            <h3>Get Matched</h3>
            <p>Our algorithm finds the best event-sponsor matches based on your goals.</p>
          </div>
          <div className="step-item">
            <div className="step-icon"><Target size={32} /></div>
            <h3>Connect & Sponsor</h3>
            <p>Reach out, negotiate, and close deals directly through the platform.</p>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="stats-bar">
        <div className="stat-unit">
          <span className="stat-value">2,400+</span>
          <span className="stat-label">Events Listed</span>
        </div>
        <div className="stat-unit divider">
          <span className="stat-value">890+</span>
          <span className="stat-label">Active Sponsors</span>
        </div>
        <div className="stat-unit">
          <span className="stat-value">₹4.2Cr</span>
          <span className="stat-label">Sponsored</span>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-section">
        <h2>Popular Event Categories</h2>
        <div className="categories-chips">
          {CATEGORIES.map(cat => (
            <div key={cat} className="cat-chip">{cat}</div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-logo">
            <div className="logo-icon">S</div>
            <span>SponsorLink</span>
          </div>
          <div className="footer-nav">
            <a href="#">About</a>
            <a href="#">Contact</a>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
          </div>
          <p className="footer-tagline">Connecting India's events with the right brands.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
