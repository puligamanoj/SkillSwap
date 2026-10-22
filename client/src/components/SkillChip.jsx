import React from 'react';
import { X, Award, Target } from 'lucide-react';

const SkillChip = ({
  skillName,
  proficiency,
  type = 'offered', // 'offered' or 'wanted'
  onRemove,
  disabled = false,
}) => {
  const isOffered = type === 'offered';

  const badgeBg = isOffered
    ? 'rgba(99, 102, 241, 0.12)'
    : 'rgba(6, 182, 212, 0.12)';

  const borderColor = isOffered
    ? 'rgba(99, 102, 241, 0.35)'
    : 'rgba(6, 182, 212, 0.35)';

  const textColor = isOffered ? '#a5b4fc' : '#67e8f9';

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.4rem 0.85rem',
        borderRadius: '20px',
        backgroundColor: badgeBg,
        border: `1px solid ${borderColor}`,
        color: textColor,
        fontSize: '0.85rem',
        fontWeight: 500,
        transition: 'all 0.2s ease',
      }}
    >
      {isOffered ? <Award size={14} /> : <Target size={14} />}
      <span>{skillName}</span>

      {proficiency && (
        <span
          style={{
            fontSize: '0.72rem',
            padding: '0.1rem 0.4rem',
            borderRadius: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            color: 'var(--text-muted)',
            fontWeight: 400,
          }}
        >
          {proficiency}
        </span>
      )}

      {onRemove && (
        <button
          type="button"
          onClick={() => !disabled && onRemove()}
          disabled={disabled}
          style={{
            background: 'none',
            border: 'none',
            color: textColor,
            cursor: disabled ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            padding: '2px',
            borderRadius: '50%',
            opacity: 0.8,
            transition: 'opacity 0.2s ease',
          }}
          title={`Remove ${skillName}`}
          aria-label={`Remove ${skillName}`}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};

export default SkillChip;
