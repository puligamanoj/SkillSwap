import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Trash2,
  GitPullRequest,
  CheckCircle,
  XCircle,
  Users,
  MessageSquare,
  Star,
  Award,
  RefreshCw,
  ArrowRight,
  Clock,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import LoadingSpinner from '../components/LoadingSpinner';
import Alert from '../components/Alert';
import EmptyState from '../components/EmptyState';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../services/socket';

const NotificationsPage = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all'); // 'all' or 'unread'
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();

  const fetchNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (err) {
      setError(err.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Listen for real-time notifications
    const socket = getSocket();
    if (socket) {
      const handleRealtimeNotification = (notif) => {
        setNotifications((prev) => {
          // Deduplicate by ID
          if (prev.some((n) => n._id === notif._id)) return prev;
          return [notif, ...prev];
        });
        setUnreadCount((prev) => prev + 1);
      };

      socket.on('notification_received', handleRealtimeNotification);

      return () => {
        socket.off('notification_received', handleRealtimeNotification);
      };
    }
  }, []);

  const handleMarkAsRead = async (notif) => {
    if (notif.isRead) return;

    try {
      await api.patch(`/notifications/${notif._id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notif._id ? { ...n, isRead: true, readAt: new Date() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      setSuccess('All notifications marked as read.');
    } catch (err) {
      setError(err.message || 'Failed to mark all as read.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteNotification = async (e, notifId) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${notifId}`);
      setNotifications((prev) => {
        const target = prev.find((n) => n._id === notifId);
        if (target && !target.isRead) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        return prev.filter((n) => n._id !== notifId);
      });
    } catch (err) {
      setError(err.message || 'Failed to delete notification.');
    }
  };

  const handleNotificationClick = async (notif) => {
    await handleMarkAsRead(notif);

    // Route according to notification type and relatedId
    switch (notif.type) {
      case 'exchange_request':
        navigate('/requests');
        break;
      case 'request_accepted':
        navigate('/connections');
        break;
      case 'request_rejected':
        navigate('/requests');
        break;
      case 'exchange_completed':
        navigate('/connections');
        break;
      case 'new_message':
        if (notif.relatedId) {
          navigate(`/chat?connectionId=${notif.relatedId}`);
        } else {
          navigate('/connections');
        }
        break;
      case 'new_review':
        navigate('/profile');
        break;
      default:
        break;
    }
  };

  // Filter notification list
  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    return true;
  });

  // Icon & Style configuration by notification type
  const getTypeConfig = (type) => {
    switch (type) {
      case 'exchange_request':
        return { icon: GitPullRequest, color: 'var(--primary-400)', bg: 'rgba(99, 102, 241, 0.15)', label: 'Exchange Request' };
      case 'request_accepted':
        return { icon: CheckCircle, color: 'var(--accent-emerald)', bg: 'rgba(16, 185, 129, 0.15)', label: 'Request Accepted' };
      case 'request_rejected':
        return { icon: XCircle, color: 'var(--accent-rose)', bg: 'rgba(239, 68, 68, 0.15)', label: 'Request Declined' };
      case 'exchange_completed':
        return { icon: Award, color: 'var(--accent-amber)', bg: 'rgba(245, 158, 11, 0.15)', label: 'Swap Completed' };
      case 'new_message':
        return { icon: MessageSquare, color: 'var(--accent-cyan)', bg: 'rgba(6, 182, 212, 0.15)', label: 'Chat Message' };
      case 'new_review':
        return { icon: Star, color: 'var(--accent-amber)', bg: 'rgba(245, 158, 11, 0.15)', label: 'New Review' };
      default:
        return { icon: Bell, color: 'var(--primary-400)', bg: 'rgba(99, 102, 241, 0.15)', label: 'Notification' };
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flex: 1, padding: '2.5rem 1rem' }}>
        <div className="container" style={{ maxWidth: '850px' }}>
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justify: 'space-between',
              marginBottom: '2rem',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary-400)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                <Bell size={16} /> Notification Center
              </div>
              <h1 style={{ fontSize: '2.2rem', marginBottom: '0.4rem', color: 'var(--text-main)' }}>
                Notifications
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
                Stay updated on skill requests, acceptance alerts, and messages.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={fetchNotifications}
                className="btn btn-secondary"
                style={{ fontSize: '0.85rem', padding: '0.5rem 0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                disabled={loading}
              >
                <RefreshCw size={15} className={loading ? 'spin' : ''} /> Refresh
              </button>

              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="btn btn-secondary"
                style={{ fontSize: '0.85rem', padding: '0.5rem 0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                disabled={actionLoading || unreadCount === 0}
              >
                <CheckCheck size={16} color="var(--accent-emerald)" /> Mark All as Read
              </button>
            </div>
          </div>

          <Alert type="error" message={error} onClose={() => setError('')} />
          <Alert type="success" message={success} onClose={() => setSuccess('')} />

          {/* Filter Bar */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', backgroundColor: 'var(--bg-surface)', padding: '0.35rem', borderRadius: '12px', border: '1px solid var(--border-light)', width: 'fit-content' }}>
            <button
              type="button"
              onClick={() => setFilter('all')}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: filter === 'all' ? 'var(--primary-500)' : 'transparent',
                color: filter === 'all' ? '#ffffff' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              All ({notifications.length})
            </button>

            <button
              type="button"
              onClick={() => setFilter('unread')}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: filter === 'unread' ? 'var(--primary-500)' : 'transparent',
                color: filter === 'unread' ? '#ffffff' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notifications List */}
          {loading ? (
            <div style={{ padding: '4rem 0', textAlign: 'center' }}>
              <LoadingSpinner size={36} label="Loading your notifications..." />
            </div>
          ) : filteredNotifications.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '3rem' }}>
              {filteredNotifications.map((notif) => {
                const config = getTypeConfig(notif.type);
                const NotifIcon = config.icon;
                const senderName = notif.sender?.name || 'SkillSwap System';
                const senderAvatar = notif.sender?.avatar;
                const createdDate = notif.createdAt ? new Date(notif.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

                return (
                  <div
                    key={notif._id}
                    onClick={() => handleNotificationClick(notif)}
                    className="glass-card"
                    style={{
                      padding: '1.25rem 1.5rem',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justify: 'space-between',
                      gap: '1rem',
                      cursor: 'pointer',
                      transition: 'transform 0.15s ease, border-color 0.15s ease',
                      backgroundColor: notif.isRead ? 'rgba(17, 24, 39, 0.4)' : 'rgba(99, 102, 241, 0.08)',
                      borderLeft: notif.isRead ? '1px solid var(--border-light)' : '4px solid var(--primary-500)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                      {/* Icon */}
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '12px',
                          backgroundColor: config.bg,
                          display: 'flex',
                          alignItems: 'center',
                          justify: 'center',
                          flexShrink: 0,
                          marginTop: '2px',
                        }}
                      >
                        <NotifIcon size={20} color={config.color} />
                      </div>

                      {/* Content */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: config.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            {config.label}
                          </span>
                          {!notif.isRead && (
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary-400)' }} />
                          )}
                        </div>

                        <h4 style={{ fontSize: '1.05rem', margin: '0 0 0.25rem 0', color: 'var(--text-main)' }}>
                          {notif.title}
                        </h4>

                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0 0 0.4rem 0', lineHeight: 1.45 }}>
                          {notif.message}
                        </p>

                        <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Clock size={12} /> {createdDate}
                        </div>
                      </div>
                    </div>

                    {/* Right Delete & Action Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteNotification(e, notif._id)}
                        className="btn btn-secondary"
                        style={{ padding: '0.4rem', borderRadius: '8px', border: 'none', color: 'var(--text-subtle)' }}
                        title="Delete notification"
                      >
                        <Trash2 size={16} />
                      </button>

                      <ArrowRight size={16} color="var(--text-subtle)" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={Bell}
              title="You're all caught up!"
              description={filter === 'unread' ? "You have no unread notifications right now." : "You have no notifications at this time."}
              actionLabel="Go to Dashboard"
              onAction={() => navigate('/dashboard')}
            />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NotificationsPage;
