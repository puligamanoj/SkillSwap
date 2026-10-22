import React from 'react';

const StatCard = ({ icon: Icon, value, label, color = 'var(--primary-500)', subtitle }) => {
  return (
    <div
      className="glass-card"
      style={{
        padding: '1.25rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1.25rem',
        transition: 'transform 0.2s ease, border-color 0.2s ease',
      }}
    >
      <div
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '14px',
          backgroundColor: `rgba(${color === 'var(--primary-500)' ? '99, 102, 241' : color === 'var(--accent-cyan)' ? '6, 182, 212' : color === 'var(--accent-emerald)' ? '16, 185, 129' : '245, 158, 11'}, 0.15)`,
          border: `1px solid ${color}`,
          display: 'flex',
          alignItems: 'center',
          justify: 'center',
          flexShrink: 0,
        }}
      >
        {Icon && <Icon size={26} color={color} />}
      </div>

      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            fontFamily: 'var(--font-heading)',
            color: 'var(--text-main)',
            lineHeight: 1.1,
          }}
        >
          {value !== undefined && value !== null ? value : 0}
        </div>
        <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '0.2rem', fontWeight: 500 }}>
          {label}
        </div>
        {subtitle && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '0.15rem' }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
