import React, { useState, useEffect } from 'react';
import { X, Star, Send, Award, AlertCircle } from 'lucide-react';
import api from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import Alert from './Alert';

const ReviewModal = ({
  connectionId,
  reviewedUser,
  existingReview = null,
  isOpen,
  onClose,
  onReviewSubmitted,
}) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating || 5);
      setComment(existingReview.comment || '');
    } else {
      setRating(5);
      setComment('');
    }
    setError('');
    setSuccess('');
  }, [existingReview, isOpen]);

  if (!isOpen || !reviewedUser) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!rating || rating < 1 || rating > 5) {
      setError('Please select a star rating between 1 and 5.');
      return;
    }

    setIsSubmitting(true);

    try {
      let response;
      if (existingReview) {
        // Edit review
        response = await api.patch(`/reviews/${existingReview._id}`, {
          rating,
          comment: comment.trim(),
        });
        setSuccess('Review updated successfully!');
      } else {
        // Create review
        response = await api.post('/reviews', {
          connectionId,
          reviewedUser: typeof reviewedUser === 'object' ? reviewedUser._id : reviewedUser,
          rating,
          comment: comment.trim(),
        });
        setSuccess('Review submitted successfully!');
      }

      setIsSubmitting(false);

      if (onReviewSubmitted) {
        onReviewSubmitted(response.data.review);
      }

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setIsSubmitting(false);
      const msg = err.message || 'Failed to submit review.';
      setError(msg);
    }
  };

  const getRatingLabel = (val) => {
    switch (val) {
      case 1:
        return 'Poor Experience (1/5)';
      case 2:
        return 'Fair Experience (2/5)';
      case 3:
        return 'Good Experience (3/5)';
      case 4:
        return 'Very Good Experience (4/5)';
      case 5:
        return 'Excellent Exchange! (5/5)';
      default:
        return 'Select Rating';
    }
  };

  const activeRating = hoverRating || rating;
  const peerName = typeof reviewedUser === 'object' ? reviewedUser.name : 'Peer';
  const peerAvatar = typeof reviewedUser === 'object' ? reviewedUser.avatar : null;
  const peerInitial = peerName ? peerName.charAt(0).toUpperCase() : 'P';

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
          maxWidth: '500px',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.5rem' }}>
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
            {peerAvatar ? (
              <img src={peerAvatar} alt={peerName} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              peerInitial
            )}
          </div>
          <div>
            <h2 style={{ fontSize: '1.35rem', margin: 0, color: 'var(--text-main)' }}>
              {existingReview ? 'Edit Exchange Review' : `Review ${peerName}`}
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>
              Share your feedback on your completed skill exchange
            </p>
          </div>
        </div>

        <Alert type="error" message={error} onClose={() => setError('')} />
        <Alert type="success" message={success} onClose={() => setSuccess('')} />

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Star Rating Selector */}
          <div style={{ textAlign: 'center', backgroundColor: 'var(--bg-card-hover)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Rating: <strong style={{ color: 'var(--accent-amber)' }}>{getRatingLabel(activeRating)}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
              {[1, 2, 3, 4, 5].map((starVal) => {
                const isFilled = starVal <= activeRating;
                return (
                  <button
                    key={starVal}
                    type="button"
                    onClick={() => setRating(starVal)}
                    onMouseEnter={() => setHoverRating(starVal)}
                    onMouseLeave={() => setHoverRating(0)}
                    disabled={isSubmitting}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.25rem',
                      transition: 'transform 0.15s ease',
                    }}
                    title={`${starVal} Star${starVal > 1 ? 's' : ''}`}
                  >
                    <Star
                      size={32}
                      fill={isFilled ? 'var(--accent-amber)' : 'none'}
                      color={isFilled ? 'var(--accent-amber)' : 'var(--text-subtle)'}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comment Textarea */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Review Comment (Optional)</label>
            <textarea
              className="form-input"
              rows={4}
              style={{ resize: 'vertical' }}
              placeholder="Share your experience with this skill exchange... How was their teaching or learning collaboration?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={isSubmitting}
              maxLength={1000}
            />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textAlign: 'right', marginTop: '0.2rem' }}>
              {comment.length}/1000
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting || !rating}>
              {isSubmitting ? (
                <LoadingSpinner size={18} label="Submitting..." />
              ) : (
                <>
                  <Send size={16} /> {existingReview ? 'Update Review' : 'Submit Review'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;
