import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import EmptyState from '../components/EmptyState';
import { LayoutDashboard, Compass, User, Repeat, Users, MessageSquare, Bell } from 'lucide-react';

const pageMeta = {
  dashboard: { title: 'Student Dashboard', icon: LayoutDashboard, desc: 'Your exchange stats, pending requests, and top matched peers will appear here in Phase 7B.' },
  explore: { title: 'Explore & Match Skills', icon: Compass, desc: 'Search for skills, filter candidates, and view compatibility match scores in Phase 7B.' },
  profile: { title: 'Student Skill Profile', icon: User, desc: 'Manage your bio, skills offered, skills wanted, and availability schedule in Phase 7B.' },
  requests: { title: 'Exchange Requests Manager', icon: Repeat, desc: 'Review incoming requests and manage outgoing skill swap invitations in Phase 7B.' },
  connections: { title: 'Active Connections', icon: Users, desc: 'View your active teaching connections and mark exchanges completed in Phase 7B.' },
  chat: { title: 'Real-Time Messaging', icon: MessageSquare, desc: 'Live Socket.io chat room and direct peer messaging will appear here in Phase 7B.' },
  notifications: { title: 'Notifications Center', icon: Bell, desc: 'Your in-app and real-time socket alerts will appear here in Phase 7B.' },
};

const PlaceholderPage = ({ pageKey = 'dashboard' }) => {
  const current = pageMeta[pageKey] || pageMeta.dashboard;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flex: 1, padding: '3rem 0' }}>
        <div className="container">
          <EmptyState
            title={current.title}
            description={current.desc}
            icon={current.icon}
            actionButton={
              <Link to="/" className="btn btn-secondary">
                Back to Home
              </Link>
            }
          />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PlaceholderPage;
