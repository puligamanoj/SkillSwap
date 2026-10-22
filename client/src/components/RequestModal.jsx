import React, { useState, useEffect } from 'react';
import { X, Send, Repeat2, Award, Target, MessageSquare, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import Alert from './Alert';

const RequestModal = ({ candidate, isOpen, onClose, onRequestSent }) => {
  const { user } = useAuth();
  const [offeredSkill, setOfferedSkill] = useState('');
  const [wantedSkill, setWantedSkill] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Default selection when candidate changes
  useEffect(() => {
    if (candidate) {
      // Find mutual overlap if possible
      const myOffered = (user?.skillsOffered || []).map((s) => s.skillName);
      const peerOffered = (candidate?.skillsOffered || []).map((s) => s.skillName);

      if (myOffered.length > 0) setOfferedSkill(myOffered[0]);
      if (peerOffered.length > 0) setWantedSkill(peerOffered[0]);

      setMessage('');
      setError('');
      setSuccess('');
    }
  }, [candidate, user]);

  if (!isOpen || !candidate) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!offeredSkill) {
      setError('Please select a skill you will teach.');
      return;
    }
    if (!wantedSkill) {
      setError('Please select a skill you want to learn from this peer.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post('/requests', {
        receiver: candidate._id,
        offeredSkill: offeredSkill.trim(),
        wantedSkill: wantedSkill.trim(),
        message: message.trim(),
      });

      setSuccess('Skill exchange request sent successfully!');
      setIsSubmitting(false);

      if (onRequestSent) {
        onRequestSent(candidate._id, response.data.request);
      }

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setIsSubmitting(false);
      const msg = err.message || 'Failed to send exchange request.';
      setError(msg);
    }
  };

  const myOfferedSkills = user?.skillsOffered || [];
  const peerOfferedSkills = candidate?.skillsOffered || [];

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
          maxWidth: '520px',
          padding: '2rem',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
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

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div
            style={{
              padding: '0.6rem',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--primary-500), var(--accent-cyan))',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
            }}
          >
            <Repeat2 size={24} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', margin: 0, color: 'var(--text-main)' }}>
              Send Skill Exchange Request
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
              Request to learn from <strong>{candidate.name}</strong>
            </p>
          </div>
        </div>

        <Alert type="error" message={error} onClose={() => setError('')} />
        <Alert type="success" message={success} onClose={() => setSuccess('')} />

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Skill You Will Teach */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Award size={15} color="var(--primary-400)" /> Skill You Will Teach ({user?.name})
            </label>
            {myOfferedSkills.length > 0 ? (
              <select
                className="form-input"
                value={offeredSkill}
                onChange={(e) => setOfferedSkill(e.target.value)}
                disabled={isSubmitting}
                required
              >
                {myOfferedSkills.map((s) => (
                  <option key={s._id || s.skillName} value={s.skillName}>
                    {s.skillName} ({s.proficiency || 'Intermediate'})
                  </option>
                ))}
              </select>
            ) : (
              <div style={{ color: 'var(--accent-amber)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertCircle size={15} /> You have no skills listed to teach. Please add skills in Profile!
              </div>
            )}
          </div>

          {/* Skill You Want to Learn */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Target size={15} color="var(--accent-cyan)" /> Skill You Want to Learn (From {candidate.name})
            </label>
            {peerOfferedSkills.length > 0 ? (
              <select
                className="form-input"
                value={wantedSkill}
                onChange={(e) => setWantedSkill(e.target.value)}
                disabled={isSubmitting}
                required
              >
                {peerOfferedSkills.map((s) => (
                  <option key={s._id || s.skillName} value={s.skillName}>
                    {s.skillName} ({s.proficiency || 'Intermediate'})
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                className="form-input"
                placeholder="Enter skill name to learn..."
                value={wantedSkill}
                onChange={(e) => setWantedSkill(e.target.value)}
                disabled={isSubmitting}
                required
              />
            )}
          </div>

          {/* Message */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <MessageSquare size={15} color="var(--text-subtle)" /> Personal Message (Optional)
            </label>
            <textarea
              className="form-input"
              rows={3}
              style={{ resize: 'vertical' }}
              placeholder={`Hi ${candidate.name}, I'd love to swap skills! I can teach you ${offeredSkill || 'my skills'} in exchange for learning ${wantedSkill || 'yours'}...`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isSubmitting}
              maxLength={500}
            />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textAlign: 'right', marginTop: '0.2rem' }}>
              {message.length}/500
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isSubmitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || myOfferedSkills.length === 0 || !offeredSkill || !wantedSkill}
            >
              {isSubmitting ? (
                <LoadingSpinner size={18} label="Sending..." />
              ) : (
                <>
                  <Send size={16} /> Send Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequestModal;
