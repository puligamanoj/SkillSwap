import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Repeat2,
  Menu,
  X,
  User,
  LogOut,
  LayoutDashboard,
  Compass,
  MessageSquare,
  Bell,
  GitPullRequest,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { getSocket } from '../services/socket';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  const isActive = (path) => location.pathname === path;

  // Fetch pending requests & unread notification counts when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const fetchCounts = async () => {
        try {
          // 1. Pending incoming requests count
          const reqRes = await api.get('/requests?type=incoming&status=pending');
          setPendingRequestsCount((reqRes.data.requests || []).length);

          // 2. Unread notifications count
          const notifRes = await api.get('/notifications?unreadOnly=true');
          setUnreadNotificationsCount(notifRes.data.unreadCount || (notifRes.data.notifications || []).length);
        } catch (e) {
          // Silent fallback
        }
      };

      fetchCounts();

      // Listen for real-time notifications via Socket.io
      const socket = getSocket();
      if (socket) {
        const handleNotificationReceived = () => {
          setUnreadNotificationsCount((prev) => prev + 1);
        };

        socket.on('notification_received', handleNotificationReceived);

        return () => {
          socket.off('notification_received', handleNotificationReceived);
        };
      }
    } else {
      setPendingRequestsCount(0);
      setUnreadNotificationsCount(0);
    }
  }, [isAuthenticated, location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'rgba(11, 15, 25, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-light)',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          height: '70px',
        }}
      >
        {/* Brand Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, var(--primary-500), var(--accent-cyan))',
              padding: '0.5rem',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
            }}
          >
            <Repeat2 size={22} color="#ffffff" />
          </div>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
            Skill<span className="gradient-text">Swap</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '1.4rem' }} className="desktop-nav">
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  color: isActive('/dashboard') ? 'var(--primary-100)' : 'var(--text-muted)',
                  fontWeight: isActive('/dashboard') ? 600 : 400,
                  fontSize: '0.9rem',
                }}
              >
                <LayoutDashboard size={16} /> Dashboard
              </Link>
              <Link
                to="/explore"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  color: isActive('/explore') ? 'var(--primary-100)' : 'var(--text-muted)',
                  fontWeight: isActive('/explore') ? 600 : 400,
                  fontSize: '0.9rem',
                }}
              >
                <Compass size={16} /> Explore
              </Link>
              <Link
                to="/requests"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  color: isActive('/requests') ? 'var(--primary-100)' : 'var(--text-muted)',
                  fontWeight: isActive('/requests') ? 600 : 400,
                  fontSize: '0.9rem',
                }}
              >
                <GitPullRequest size={16} /> Requests
                {pendingRequestsCount > 0 && (
                  <span
                    style={{
                      backgroundColor: 'var(--accent-rose)',
                      color: '#ffffff',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '0.1rem 0.45rem',
                      borderRadius: '10px',
                      marginLeft: '0.2rem',
                    }}
                  >
                    {pendingRequestsCount}
                  </span>
                )}
              </Link>
              <Link
                to="/connections"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  color: isActive('/connections') ? 'var(--primary-100)' : 'var(--text-muted)',
                  fontWeight: isActive('/connections') ? 600 : 400,
                  fontSize: '0.9rem',
                }}
              >
                <Users size={16} /> Connections
              </Link>
              <Link
                to="/chat"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  color: isActive('/chat') ? 'var(--primary-100)' : 'var(--text-muted)',
                  fontWeight: isActive('/chat') ? 600 : 400,
                  fontSize: '0.9rem',
                }}
              >
                <MessageSquare size={16} /> Chat
              </Link>
              <Link
                to="/notifications"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  color: isActive('/notifications') ? 'var(--primary-100)' : 'var(--text-muted)',
                  fontWeight: isActive('/notifications') ? 600 : 400,
                  fontSize: '0.9rem',
                }}
              >
                <Bell size={16} /> Notifications
                {unreadNotificationsCount > 0 && (
                  <span
                    style={{
                      backgroundColor: 'var(--primary-500)',
                      color: '#ffffff',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '0.1rem 0.45rem',
                      borderRadius: '10px',
                      marginLeft: '0.2rem',
                    }}
                  >
                    {unreadNotificationsCount}
                  </span>
                )}
              </Link>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '0.5rem', paddingLeft: '0.75rem', borderLeft: '1px solid var(--border-light)' }}>
                <Link
                  to="/profile"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    color: isActive('/profile') ? 'var(--primary-100)' : 'var(--text-main)',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    textDecoration: 'none',
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--primary-500), var(--accent-cyan))',
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'center',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                    }}
                  >
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span>{user?.name || 'Profile'}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="btn btn-secondary"
                  style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  title="Logout"
                >
                  <LogOut size={15} /> Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link
                to="/"
                style={{
                  color: isActive('/') ? 'var(--primary-100)' : 'var(--text-muted)',
                  fontWeight: isActive('/') ? 600 : 400,
                  fontSize: '0.95rem',
                }}
              >
                Home
              </Link>
              <a href="/#how-it-works" style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                How It Works
              </a>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '1rem' }}>
                <Link to="/login" className="btn btn-secondary" style={{ padding: '0.5rem 1.25rem' }}>
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary" style={{ padding: '0.5rem 1.25rem' }}>
                  Get Started
                </Link>
              </div>
            </>
          )}
        </nav>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={toggleMobileMenu}
          className="mobile-toggle"
          aria-label="Toggle Navigation"
          style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '0.5rem' }}
        >
          {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border-light)',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
          className="mobile-menu"
        >
          {isAuthenticated ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-light)' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--primary-500), var(--accent-cyan))',
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'center',
                    color: '#ffffff',
                    fontWeight: 700,
                  }}
                >
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{user?.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user?.email}</div>
                </div>
              </div>

              <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--text-main)', fontWeight: 500 }}>
                Dashboard
              </Link>
              <Link to="/explore" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--text-muted)' }}>
                Explore
              </Link>
              <Link to="/requests" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Requests</span>
                {pendingRequestsCount > 0 && (
                  <span style={{ backgroundColor: 'var(--accent-rose)', color: '#ffffff', fontSize: '0.75rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '10px' }}>
                    {pendingRequestsCount}
                  </span>
                )}
              </Link>
              <Link to="/connections" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--text-muted)' }}>
                Connections
              </Link>
              <Link to="/chat" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--text-muted)' }}>
                Chat
              </Link>
              <Link to="/notifications" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Notifications</span>
                {unreadNotificationsCount > 0 && (
                  <span style={{ backgroundColor: 'var(--primary-500)', color: '#ffffff', fontSize: '0.75rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '10px' }}>
                    {unreadNotificationsCount}
                  </span>
                )}
              </Link>
              <Link to="/profile" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--text-muted)' }}>
                Profile
              </Link>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="btn btn-secondary btn-full"
                style={{ marginTop: '0.5rem' }}
              >
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--text-main)', fontWeight: 500 }}>
                Home
              </Link>
              <a href="/#how-it-works" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--text-muted)' }}>
                How It Works
              </a>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="btn btn-secondary btn-full">
                  Login
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="btn btn-primary btn-full">
                  Get Started
                </Link>
              </div>
            </>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 960px) {
          .desktop-nav { display: none !important; }
        }
        @media (min-width: 961px) {
          .mobile-toggle { display: none !important; }
          .mobile-menu { display: none !important; }
        }
      `}</style>
    </header>
  );
};

export default Navbar;
