import React from 'react';
import { Link } from 'react-router-dom';
import { Repeat2, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer style={{ backgroundColor: 'var(--bg-surface)', borderTop: '1px solid var(--border-light)', padding: '3.5rem 0 2rem', marginTop: '4rem' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2.5rem', marginBottom: '3rem' }}>
          {/* Brand Info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <div style={{ background: 'linear-gradient(135deg, var(--primary-500), var(--accent-cyan))', padding: '0.4rem', borderRadius: '8px', display: 'flex' }}>
                <Repeat2 size={20} color="#ffffff" />
              </div>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontWeight: 800 }}>
                Skill<span className="gradient-text">Swap</span>
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6' }}>
              Peer-to-peer student skill exchange platform. Learn from peers and share what you know.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-main)' }}>Platform</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.9rem' }}>
              <li><a href="/#how-it-works" style={{ color: 'var(--text-muted)' }}>How It Works</a></li>
              <li><a href="/#why-skillswap" style={{ color: 'var(--text-muted)' }}>Why SkillSwap</a></li>
              <li><Link to="/explore" style={{ color: 'var(--text-muted)' }}>Explore Skills</Link></li>
            </ul>
          </div>

          {/* Account Links */}
          <div>
            <h4 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-main)' }}>Account</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.9rem' }}>
              <li><Link to="/login" style={{ color: 'var(--text-muted)' }}>Login</Link></li>
              <li><Link to="/register" style={{ color: 'var(--text-muted)' }}>Register</Link></li>
              <li><Link to="/dashboard" style={{ color: 'var(--text-muted)' }}>Dashboard</Link></li>
            </ul>
          </div>

          {/* Tech Stack Info */}
          <div>
            <h4 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-main)' }}>College Full-Stack Project</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.6' }}>
              Built with React.js, Express.js, Node.js, MongoDB Atlas, and Socket.io. Designed for high resume value.
            </p>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-subtle)' }}>
          <span>© {new Date().getFullYear()} SkillSwap. All rights reserved.</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            Designed with <Heart size={14} color="var(--accent-rose)" fill="var(--accent-rose)" /> for students everywhere
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
