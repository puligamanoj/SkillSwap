import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  GitPullRequest,
  Inbox,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  MessageSquare,
  Award,
  Target,
  RefreshCw,
  Ban,
  Check,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import LoadingSpinner from '../components/LoadingSpinner';
import Alert from '../components/Alert';
import EmptyState from '../components/EmptyState';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const RequestsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('incoming'); // 'incoming' or 'outgoing'
  const [statusFilter, setStatusFilter] = useState('all');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/requests');
      setRequests(response.data.requests || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch exchange requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleUpdateStatus = async (requestId, newStatus) => {
    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.patch(`/requests/${requestId}/status`, { status: newStatus });
      setSuccess(`Request status updated to '${newStatus}'!`);

      // Refresh list
      await fetchRequests();
    } catch (err) {
      setError(err.message || `Failed to update request status to '${newStatus}'.`);
    } finally {
      setActionLoading(false);
    }
  };

  // Filter requests based on tab and status
  const currentRequests = requests.filter((r) => {
    const isIncoming = r.receiver?._id === user?._id || r.isReceiver;
    const isOutgoing = r.sender?._id === user?._id || r.isSender;

    if (activeTab === 'incoming' && !isIncoming) return false;
    if (activeTab === 'outgoing' && !isOutgoing) return false;

    if (statusFilter !== 'all' && r.status !== statusFilter) return false;

    return true;
  });

  const incomingCount = requests.filter((r) => r.receiver?._id === user?._id || r.isReceiver).length;
  const outgoingCount = requests.filter((r) => r.sender?._id === user?._id || r.isSender).length;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flex: 1, padding: '2.5rem 1rem' }}>
        <div className="container">
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
                <GitPullRequest size={16} /> Skill Exchange Workflows
              </div>
              <h1 style={{ fontSize: '2.2rem', marginBottom: '0.4rem', color: 'var(--text-main)' }}>
                Exchange Requests
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
                Manage incoming proposals and track your outgoing requests.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchRequests}
              className="btn btn-secondary"
              style={{ fontSize: '0.88rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              disabled={loading}
            >
              <RefreshCw size={15} className={loading ? 'spin' : ''} /> Refresh
            </button>
          </div>

          <Alert type="error" message={error} onClose={() => setError('')} />
          <Alert type="success" message={success} onClose={() => setSuccess('')} />

          {/* Navigation Tabs & Status Filter Bar */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '2rem' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: 'var(--bg-surface)', padding: '0.35rem', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
              <button
                type="button"
                onClick={() => setActiveTab('incoming')}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: activeTab === 'incoming' ? 'var(--primary-500)' : 'transparent',
                  color: activeTab === 'incoming' ? '#ffffff' : 'var(--text-muted)',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.2s ease',
                }}
              >
                <Inbox size={16} /> Incoming ({incomingCount})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('outgoing')}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: activeTab === 'outgoing' ? 'var(--primary-500)' : 'transparent',
                  color: activeTab === 'outgoing' ? '#ffffff' : 'var(--text-muted)',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.2s ease',
                }}
              >
                <Send size={16} /> Outgoing ({outgoingCount})
              </button>
            </div>

            {/* Status Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Status:</span>
              <select
                className="form-input"
                style={{ width: '130px', padding: '0.35rem 0.6rem', fontSize: '0.85rem' }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Requests List */}
          {loading ? (
            <div style={{ padding: '4rem 0', textAlign: 'center' }}>
              <LoadingSpinner size={36} label="Loading exchange requests..." />
            </div>
          ) : currentRequests.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '3rem' }}>
              {currentRequests.map((req) => {
                const peer = activeTab === 'incoming' ? req.sender : req.receiver;
                const peerInitial = peer?.name ? peer.name.charAt(0).toUpperCase() : 'P';
                const createdDate = req.createdAt ? new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

                // Status Badge styling
                const statusBadgeStyle =
                  req.status === 'accepted'
                    ? { bg: 'rgba(16, 185, 129, 0.15)', border: 'var(--accent-emerald)', color: 'var(--accent-emerald)', icon: CheckCircle }
                    : req.status === 'rejected'
                    ? { bg: 'rgba(239, 68, 68, 0.15)', border: 'var(--accent-rose)', color: 'var(--accent-rose)', icon: XCircle }
                    : req.status === 'cancelled'
                    ? { bg: 'rgba(107, 114, 128, 0.15)', border: 'var(--text-subtle)', color: 'var(--text-subtle)', icon: Ban }
                    : { bg: 'rgba(245, 158, 11, 0.15)', border: 'var(--accent-amber)', color: 'var(--accent-amber)', icon: Clock };

                const StatusIcon = statusBadgeStyle.icon;

                return (
                  <div
                    key={req._id}
                    className="glass-card"
                    style={{
                      padding: '1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem',
                      borderLeft: `4px solid ${statusBadgeStyle.border}`,
                    }}
                  >
                    {/* Header: Peer info & Status badge */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <div
                          style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--primary-500), var(--accent-cyan))',
                            display: 'flex',
                            alignItems: 'center',
                            justify: 'center',
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: '1.05rem',
                            flexShrink: 0,
                          }}
                        >
                          {peer?.avatar ? (
                            <img src={peer.avatar} alt={peer.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            peerInitial
                          )}
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-main)' }}>
                              {peer?.name || 'Student Peer'}
                            </h3>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
                              ({activeTab === 'incoming' ? 'From' : 'To'})
                            </span>
                          </div>
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>
                            {peer?.institution || 'SkillSwap Member'} • {createdDate}
                          </p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.35rem 0.75rem',
                          borderRadius: '12px',
                          backgroundColor: statusBadgeStyle.bg,
                          border: `1px solid ${statusBadgeStyle.border}`,
                          color: statusBadgeStyle.color,
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          textTransform: 'capitalize',
                        }}
                      >
                        <StatusIcon size={14} />
                        <span>{req.status}</span>
                      </div>
                    </div>

                    {/* Exchanged Skills Info */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: '0.75rem',
                        backgroundColor: 'var(--bg-card-hover)',
                        padding: '0.85rem 1rem',
                        borderRadius: '10px',
                        border: '1px solid var(--border-light)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem' }}>
                        <Award size={16} color="var(--primary-400)" />
                        <span style={{ color: 'var(--text-muted)' }}>Offered Skill:</span>
                        <strong style={{ color: 'var(--text-main)' }}>{req.offeredSkill}</strong>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem' }}>
                        <Target size={16} color="var(--accent-cyan)" />
                        <span style={{ color: 'var(--text-muted)' }}>Wanted Skill:</span>
                        <strong style={{ color: 'var(--text-main)' }}>{req.wantedSkill}</strong>
                      </div>
                    </div>

                    {/* Personal Message Excerpt */}
                    {req.message && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.88rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        <MessageSquare size={15} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--text-subtle)' }} />
                        <span>"{req.message}"</span>
                      </div>
                    )}

                    {/* Action Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.25rem' }}>
                      {/* Incoming Pending Actions: Accept & Reject */}
                      {activeTab === 'incoming' && req.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(req._id, 'rejected')}
                            className="btn btn-secondary"
                            disabled={actionLoading}
                            style={{ fontSize: '0.85rem', padding: '0.45rem 0.9rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                          >
                            <XCircle size={15} color="var(--accent-rose)" /> Reject
                          </button>

                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(req._id, 'accepted')}
                            className="btn btn-primary"
                            disabled={actionLoading}
                            style={{ fontSize: '0.85rem', padding: '0.45rem 1rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                          >
                            {actionLoading ? <LoadingSpinner size={16} label="" /> : <><Check size={15} /> Accept Request</>}
                          </button>
                        </>
                      )}

                      {/* Outgoing Pending Action: Cancel */}
                      {activeTab === 'outgoing' && req.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(req._id, 'cancelled')}
                          className="btn btn-secondary"
                          disabled={actionLoading}
                          style={{ fontSize: '0.85rem', padding: '0.45rem 0.9rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          <Ban size={15} /> Cancel Request
                        </button>
                      )}

                      {/* If status is Accepted: Link to View Connection */}
                      {req.status === 'accepted' && (
                        <Link
                          to="/connections"
                          className="btn btn-secondary"
                          style={{ fontSize: '0.85rem', padding: '0.45rem 0.9rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          View Active Connection <ArrowRight size={15} />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={GitPullRequest}
              title={activeTab === 'incoming' ? 'No Incoming Exchange Requests' : 'No Outgoing Exchange Requests'}
              description={
                activeTab === 'incoming'
                  ? 'You currently have no incoming skill exchange requests from peers.'
                  : 'You have not sent any exchange requests yet. Browse Explore to find compatible skill partners!'
              }
              actionLabel={activeTab === 'outgoing' ? 'Explore Skill Partners' : 'Manage Skills'}
              onAction={() => window.location.assign(activeTab === 'outgoing' ? '/explore' : '/profile')}
            />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RequestsPage;
