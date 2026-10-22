import React from 'react';
import { User, Mail, School, Star, Calendar, Edit3, Award, Target } from 'lucide-react';

const ProfileCard = ({ user, onEditClick }) => {
  if (!user) return null;

  const initial = user.name ? user.name.charAt(0).toUpperCase() : 'S';
  const ratingAvg = user.rating?.average ? Number(user.rating.average).toFixed(1) : 'New';
  const ratingCount = user.rating?.count || 0;
  const memberSince = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Recently';

  return (
    <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Info */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary-500), var(--accent-cyan))',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '1.8rem',
              boxShadow: '0 8px 20px rgba(99, 102, 241, 0.3)',
              flexShrink: 0,
            }}
          >
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              initial
            )}
          </div>

          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem', color: 'var(--text-main)' }}>
              {user.name}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.35rem' }}>
              <Mail size={15} /> <span>{user.email}</span>
            </div>
            {user.institution && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                <School size={15} color="var(--accent-cyan)" /> <span>{user.institution}</span>
              </div>
            )}
          </div>
        </div>

        {/* Rating & Edit Action */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem' }}>
          {onEditClick && (
            <button
              type="button"
              onClick={onEditClick}
              className="btn btn-secondary"
              style={{ fontSize: '0.85rem', padding: '0.45rem 0.9rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Edit3 size={15} /> Edit Profile
            </button>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              padding: '0.35rem 0.75rem',
              borderRadius: '12px',
              color: 'var(--accent-amber)',
              fontSize: '0.9rem',
              fontWeight: 700,
            }}
          >
            <Star size={16} fill="var(--accent-amber)" color="var(--accent-amber)" />
            <span>{ratingAvg}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontWeight: 400 }}>({ratingCount} reviews)</span>
          </div>
        </div>
      </div>

      {/* Bio */}
      {user.bio ? (
        <div style={{ backgroundColor: 'var(--bg-card-hover)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-subtle)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            About Student
          </div>
          <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {user.bio}
          </p>
        </div>
      ) : (
        <div style={{ fontSize: '0.88rem', color: 'var(--text-subtle)', fontStyle: 'italic' }}>
          No bio added yet. Click "Edit Profile" to add your bio!
        </div>
      )}

      {/* Footer Metrics */}
      <div style={{ display: 'flex', gap: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <Award size={16} color="var(--primary-400)" />
          <span><strong>{(user.skillsOffered || []).length}</strong> Skills Offered</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <Target size={16} color="var(--accent-cyan)" />
          <span><strong>{(user.skillsWanted || []).length}</strong> Skills Wanted</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <Calendar size={16} color="var(--text-subtle)" />
          <span>Joined {memberSince}</span>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
