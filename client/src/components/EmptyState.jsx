import React from 'react';
import { Inbox } from 'lucide-react';

const EmptyState = ({ title = 'No items found', description = 'There is nothing to display here right now.', icon: Icon = Inbox, actionButton }) => {
  return (
    <div
      className="glass-card"
      style={{
        textAlign: 'center',
        padding: '3rem 2rem',
        margin: '2rem 0',
      }}
    >
      <div style={{ display: 'inline-flex', padding: '1rem', borderRadius: '50%', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary-500)', marginBottom: '1rem' }}>
        <Icon size={36} />
      </div>
      <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{title}</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '420px', margin: '0 auto 1.5rem' }}>{description}</p>
      {actionButton}
    </div>
  );
};

export default EmptyState;
