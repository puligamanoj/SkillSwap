import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  MessageSquare,
  CheckCircle2,
  Calendar,
  Award,
  Target,
  RefreshCw,
  Eye,
  Check,
  Star,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ConnectionDetailsModal from '../components/ConnectionDetailsModal';
import ReviewModal from '../components/ReviewModal';
import LoadingSpinner from '../components/LoadingSpinner';
import Alert from '../components/Alert';
import EmptyState from '../components/EmptyState';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const ConnectionsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('active'); // 'active', 'completed', or 'all'
  const [connections, setConnections] = useState([]);
  const [reviewsMap, setReviewsMap] = useState({}); // connectionId -> user's review object
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals state
  const [selectedConnectionId, setSelectedConnectionId] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [reviewModalConfig, setReviewModalConfig] = useState({
    isOpen: false,
    connectionId: null,
    reviewedUser: null,
    existingReview: null,
  });

  const navigate = useNavigate();

  const fetchConnectionsAndReviews = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch connections
      const connRes = await api.get('/connections');
      const connList = connRes.data.connections || [];
      setConnections(connList);

      // 2. Fetch reviews for completed connections
      const map = {};
      const completedConns = connList.filter((c) => c.status === 'completed');
      for (const conn of completedConns) {
        try {
          const revRes = await api.get(`/reviews/connection/${conn._id}`);
          const myReview = (revRes.data.reviews || []).find(
            (r) => (typeof r.reviewer === 'object' ? r.reviewer._id : r.reviewer) === user?._id
          );
          if (myReview) {
            map[conn._id] = myReview;
          }
        } catch (e) {
          // Silent fallback
        }
      }
      setReviewsMap(map);
    } catch (err) {
      setError(err.message || 'Failed to load skill connections.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnectionsAndReviews();
  }, [user]);

  const handleMarkCompleted = async (connectionId, peerUser) => {
    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.patch(`/connections/${connectionId}/status`, { status: 'completed' });
      setSuccess('Skill exchange connection marked as completed!');
      await fetchConnectionsAndReviews();

      // Open review modal for peer automatically upon completion
      if (peerUser) {
        setReviewModalConfig({
          isOpen: true,
          connectionId,
          reviewedUser: peerUser,
          existingReview: null,
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to update connection status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenReviewModal = (conn, peerUser) => {
    const existing = reviewsMap[conn._id] || null;
    setReviewModalConfig({
      isOpen: true,
      connectionId: conn._id,
      reviewedUser: peerUser,
      existingReview: existing,
    });
  };

  const handleReviewSubmitted = (updatedReview) => {
    if (reviewModalConfig.connectionId) {
      setReviewsMap((prev) => ({
        ...prev,
        [reviewModalConfig.connectionId]: updatedReview,
      }));
    }
    setSuccess('Review saved successfully!');
    fetchConnectionsAndReviews();
  };

  const handleOpenDetails = (id) => {
    setSelectedConnectionId(id);
    setIsDetailsOpen(true);
  };

  // Filter connections by tab
  const filteredConnections = connections.filter((conn) => {
    if (activeTab === 'all') return true;
    return conn.status === activeTab;
  });

  const activeCount = connections.filter((c) => c.status === 'active').length;
  const completedCount = connections.filter((c) => c.status === 'completed').length;

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
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-emerald)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                <Users size={16} /> Established Swap Partnerships
              </div>
              <h1 style={{ fontSize: '2.2rem', marginBottom: '0.4rem', color: 'var(--text-main)' }}>
                Skill Connections
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
                Collaborate with connected peers, exchange skills, and review your completed swaps.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchConnectionsAndReviews}
              className="btn btn-secondary"
              style={{ fontSize: '0.88rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              disabled={loading}
            >
              <RefreshCw size={15} className={loading ? 'spin' : ''} /> Refresh
            </button>
          </div>

          <Alert type="error" message={error} onClose={() => setError('')} />
          <Alert type="success" message={success} onClose={() => setSuccess('')} />

          {/* Navigation Filter Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', backgroundColor: 'var(--bg-surface)', padding: '0.35rem', borderRadius: '12px', border: '1px solid var(--border-light)', width: 'fit-content' }}>
            <button
              type="button"
              onClick={() => setActiveTab('active')}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: activeTab === 'active' ? 'var(--primary-500)' : 'transparent',
                color: activeTab === 'active' ? '#ffffff' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Active ({activeCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('completed')}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: activeTab === 'completed' ? 'var(--primary-500)' : 'transparent',
                color: activeTab === 'completed' ? '#ffffff' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Completed ({completedCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('all')}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: activeTab === 'all' ? 'var(--primary-500)' : 'transparent',
                color: activeTab === 'all' ? '#ffffff' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              All Connections ({connections.length})
            </button>
          </div>

          {/* Connections Grid */}
          {loading ? (
            <div style={{ padding: '4rem 0', textAlign: 'center' }}>
              <LoadingSpinner size={36} label="Fetching active skill connections..." />
            </div>
          ) : filteredConnections.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
              {filteredConnections.map((conn) => {
                const peer = (conn.users || []).find((u) => u._id !== user?._id) || conn.users[0];
                const peerInitial = peer?.name ? peer.name.charAt(0).toUpperCase() : 'C';
                const connectedDate = conn.connectedAt || conn.createdAt ? new Date(conn.connectedAt || conn.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
                const reqInfo = conn.exchangeRequest || {};

                const isCompleted = conn.status === 'completed';
                const existingReview = reviewsMap[conn._id];

                return (
                  <div
                    key={conn._id}
                    className="glass-card"
                    style={{
                      padding: '1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1.25rem',
                      borderLeft: `4px solid ${isCompleted ? 'var(--accent-amber)' : 'var(--accent-emerald)'}`,
                    }}
                  >
                    {/* Peer info & Status Badge */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <div
                          style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--primary-500), var(--accent-cyan))',
                            display: 'flex',
                            alignItems: 'center',
                            justify: 'center',
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: '1.1rem',
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
                          <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.2rem 0', color: 'var(--text-main)' }}>
                            {peer?.name || 'Connected Peer'}
                          </h3>
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                            {peer?.institution || 'SkillSwap Member'}
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
                          backgroundColor: isCompleted ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          border: `1px solid ${isCompleted ? 'var(--accent-amber)' : 'var(--accent-emerald)'}`,
                          color: isCompleted ? 'var(--accent-amber)' : 'var(--accent-emerald)',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          textTransform: 'capitalize',
                        }}
                      >
                        <CheckCircle2 size={14} />
                        <span>{conn.status}</span>
                      </div>
                    </div>

                    {/* Exchanged Skills */}
                    {(reqInfo.offeredSkill || reqInfo.wantedSkill) && (
                      <div
                        style={{
                          backgroundColor: 'var(--bg-card-hover)',
                          padding: '0.85rem 1rem',
                          borderRadius: '10px',
                          border: '1px solid var(--border-light)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.4rem',
                          fontSize: '0.88rem',
                        }}
                      >
                        {reqInfo.offeredSkill && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Award size={15} color="var(--primary-400)" />
                            <span style={{ color: 'var(--text-muted)' }}>Offered Skill:</span>
                            <strong style={{ color: 'var(--text-main)' }}>{reqInfo.offeredSkill}</strong>
                          </div>
                        )}
                        {reqInfo.wantedSkill && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Target size={15} color="var(--accent-cyan)" />
                            <span style={{ color: 'var(--text-muted)' }}>Wanted Skill:</span>
                            <strong style={{ color: 'var(--text-main)' }}>{reqInfo.wantedSkill}</strong>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Date info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--text-subtle)' }}>
                      <Calendar size={14} /> Connected on {connectedDate}
                    </div>

                    {/* Action Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenDetails(conn._id)}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.85rem', padding: '0.45rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <Eye size={15} /> Details
                      </button>

                      {/* Active Action: Mark Complete */}
                      {!isCompleted && (
                        <button
                          type="button"
                          onClick={() => handleMarkCompleted(conn._id, peer)}
                          className="btn btn-secondary"
                          disabled={actionLoading}
                          style={{ fontSize: '0.85rem', padding: '0.45rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          <Check size={15} color="var(--accent-emerald)" /> Mark Complete
                        </button>
                      )}

                      {/* Completed Action: Leave / Edit Review */}
                      {isCompleted && (
                        <button
                          type="button"
                          onClick={() => handleOpenReviewModal(conn, peer)}
                          className="btn btn-secondary"
                          style={{
                            fontSize: '0.85rem',
                            padding: '0.45rem 0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            color: existingReview ? 'var(--accent-amber)' : 'var(--text-main)',
                            borderColor: existingReview ? 'rgba(245, 158, 11, 0.4)' : 'var(--border-light)',
                          }}
                        >
                          <Star size={15} fill={existingReview ? 'var(--accent-amber)' : 'none'} color="var(--accent-amber)" />
                          {existingReview ? `Edit Review (${existingReview.rating}★)` : 'Leave Review'}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => navigate(`/chat?connectionId=${conn._id}`)}
                        className="btn btn-primary"
                        style={{ fontSize: '0.85rem', padding: '0.45rem 1rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <MessageSquare size={15} /> Open Chat
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={Users}
              title="No Active Connections Found"
              description="You have no active skill connections yet. Accept an incoming request or send a skill exchange request to establish connections!"
              actionLabel="Explore Partners"
              onAction={() => navigate('/explore')}
            />
          )}
        </div>
      </main>

      {/* Connection Details Modal */}
      <ConnectionDetailsModal
        connectionId={selectedConnectionId}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedConnectionId(null);
        }}
      />

      {/* Review Modal */}
      <ReviewModal
        connectionId={reviewModalConfig.connectionId}
        reviewedUser={reviewModalConfig.reviewedUser}
        existingReview={reviewModalConfig.existingReview}
        isOpen={reviewModalConfig.isOpen}
        onClose={() => setReviewModalConfig((prev) => ({ ...prev, isOpen: false }))}
        onReviewSubmitted={handleReviewSubmitted}
      />

      <Footer />
    </div>
  );
};

export default ConnectionsPage;
