import React from 'react';
import { Award, Target, Repeat, Zap, ArrowUpRight, Check } from 'lucide-react';
import SkillChip from './SkillChip';

const MatchCard = ({ match, onActionClick, actionLabel = 'Connect', isRequested = false }) => {
  const { user: candidate, matchScore, isDirectMutualSwap, mutualSkills } = match;

  const scoreColor =
    matchScore >= 80 ? 'var(--accent-emerald)' : matchScore >= 50 ? 'var(--accent-cyan)' : 'var(--accent-amber)';

  const avatarInitial = candidate?.name ? candidate.name.charAt(0).toUpperCase() : 'P';

  return (
    <div
      className="glass-card"
      style={{
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        position: 'relative',
        borderLeft: `4px solid ${scoreColor}`,
      }}
    >
      {/* Header: User & Compatibility Score */}
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
            {candidate?.avatar ? (
              <img src={candidate.avatar} alt={candidate.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              avatarInitial
            )}
          </div>

          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.2rem', color: 'var(--text-main)' }}>
              {candidate?.name || 'Peer Student'}
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {candidate?.institution || 'SkillSwap Member'}
            </p>
          </div>
        </div>

        {/* Match Percentage Badge */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.35rem 0.75rem',
              borderRadius: '12px',
              backgroundColor: `rgba(${matchScore >= 80 ? '16, 185, 129' : matchScore >= 50 ? '6, 182, 212' : '245, 158, 11'}, 0.15)`,
              border: `1px solid ${scoreColor}`,
              color: scoreColor,
              fontWeight: 800,
              fontSize: '1rem',
              fontFamily: 'var(--font-heading)',
            }}
          >
            <Zap size={15} />
            <span>{matchScore}%</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '0.25rem' }}>
            Compatibility
          </div>
        </div>
      </div>

      {/* Direct Mutual Exchange Badge */}
      {isDirectMutualSwap && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.35rem 0.75rem',
            borderRadius: '8px',
            backgroundColor: 'rgba(99, 102, 241, 0.12)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            color: '#a5b4fc',
            fontSize: '0.8rem',
            fontWeight: 600,
          }}
        >
          <Repeat size={14} color="var(--primary-400)" /> Perfect Mutual Swap (1:1 Match)
        </div>
      )}

      {/* Bio excerpt */}
      {candidate?.bio && (
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>
          "{candidate.bio}"
        </p>
      )}

      {/* Skills Offered by Peer */}
      <div>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Award size={14} color="var(--primary-400)" /> They Can Teach:
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {candidate?.skillsOffered && candidate.skillsOffered.length > 0 ? (
            candidate.skillsOffered.map((s, idx) => (
              <SkillChip key={idx} skillName={s.skillName} proficiency={s.proficiency} type="offered" />
            ))
          ) : (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>None listed</span>
          )}
        </div>
      </div>

      {/* Skills Wanted by Peer */}
      <div>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Target size={14} color="var(--accent-cyan)" /> They Want to Learn:
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {candidate?.skillsWanted && candidate.skillsWanted.length > 0 ? (
            candidate.skillsWanted.map((s, idx) => (
              <SkillChip key={idx} skillName={s.skillName} proficiency={s.targetProficiency} type="wanted" />
            ))
          ) : (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>None listed</span>
          )}
        </div>
      </div>

      {/* Action CTA Button */}
      <div style={{ marginTop: '0.25rem', display: 'flex', justifyContent: 'flex-end' }}>
        {isRequested ? (
          <button
            type="button"
            className="btn btn-secondary"
            disabled
            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.35rem', opacity: 0.8, cursor: 'not-allowed' }}
          >
            <Check size={16} color="var(--accent-emerald)" /> Request Sent
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onActionClick && onActionClick(candidate)}
            className="btn btn-primary"
            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            {actionLabel} <ArrowUpRight size={15} />
          </button>
        )}
      </div>
    </div>
  );
};

export default MatchCard;
