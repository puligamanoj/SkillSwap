import React, { useState, useEffect } from 'react';
import { X, Users, Calendar, Award, Target, MessageSquare, CheckCircle2, ArrowRight } from 'lucide-react';
import api from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import Alert from './Alert';

const ConnectionDetailsModal = ({ connectionId, isOpen, onClose }) => {
  const [connection, setConnection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && connectionId) {
      const fetchConnectionDetails = async () => {
        setLoading(true);
        setError('');
        try {
          const response = await api.get(`/connections/${connectionId}`);
          setConnection(response.data.connection || null);
        } catch (err) {
          setError(err.message || 'Failed to load connection details.');
        } finally {
          setLoading(false);
        }
      };

      fetchConnectionDetails();
    }
  }, [isOpen, connectionId]);

  if (!isOpen || !connectionId) return null;

  const users = connection?.users || [];
  const reqInfo = connection?.exchangeRequest || {};

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 8, 15, 0.82)',
        backdropFilter: 'blur(10px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justify: 'center',
        padding: '1rem',
      }}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '560px',
          padding: '2rem',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          <X size={22} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div
            style={{
              padding: '0.6rem',
              borderRadius: '12px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid var(--accent-emerald)',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
            }}
          >
            <Users size={24} color="var(--accent-emerald)" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', margin: 0, color: 'var(--text-main)' }}>
              Skill Connection Details
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
              Established skill exchange connection
            </p>
          </div>
        </div>

        <Alert type="error" message={error} onClose={() => setError('')} />

        {loading ? (
          <div style={{ padding: '3rem 0', textAlign: 'center' }}>
            <LoadingSpinner size={32} label="Loading connection details..." />
          </div>
        ) : connection ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Participants */}
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Connected Peer Students:
              </div>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {users.map((u) => (
                  <div
                    key={u._id}
                    style={{
                      flex: 1,
                      minWidth: '180px',
                      backgroundColor: 'var(--bg-card-hover)',
                      padding: '0.85rem',
                      borderRadius: '10px',
                      border: '1px solid var(--border-light)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                    }}
                  >
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
                      {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>{u.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{u.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills Exchanged */}
            <div style={{ backgroundColor: 'var(--bg-card-hover)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Skills Exchanged:
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                {reqInfo.offeredSkill && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
                    <Award size={16} color="var(--primary-400)" />
                    <span style={{ color: 'var(--text-muted)' }}>Offered Skill:</span>
                    <strong style={{ color: 'var(--text-main)' }}>{reqInfo.offeredSkill}</strong>
                  </div>
                )}
                {reqInfo.wantedSkill && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
                    <Target size={16} color="var(--accent-cyan)" />
                    <span style={{ color: 'var(--text-muted)' }}>Wanted Skill:</span>
                    <strong style={{ color: 'var(--text-main)' }}>{reqInfo.wantedSkill}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Connection Status & Timestamps */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={15} color="var(--accent-emerald)" />
                <span>Status: <strong style={{ color: 'var(--accent-emerald)', textTransform: 'capitalize' }}>{connection.status}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Calendar size={15} color="var(--text-subtle)" />
                <span>Connected: {new Date(connection.connectedAt || connection.createdAt).toLocaleDateString()}</span>
              </div>
              {connection.completedAt && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Calendar size={15} color="var(--text-subtle)" />
                  <span>Completed: {new Date(connection.completedAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            {/* Action Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Close View
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ConnectionDetailsModal;
