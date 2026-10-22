import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Award,
  Target,
  Zap,
  Users,
  Plus,
  Compass,
  User,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import StatCard from '../components/StatCard';
import SkillChip from '../components/SkillChip';
import SkillSelector from '../components/SkillSelector';
import MatchCard from '../components/MatchCard';
import LoadingSpinner from '../components/LoadingSpinner';
import Alert from '../components/Alert';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const DashboardPage = () => {
  const { user, updateUserState } = useAuth();
  const [matches, setMatches] = useState([]);
  const [connectionsCount, setConnectionsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddOffered, setShowAddOffered] = useState(false);
  const [showAddWanted, setShowAddWanted] = useState(false);
  const [skillActionLoading, setSkillActionLoading] = useState(false);

  const navigate = useNavigate();

  // Load matches & connection metrics on dashboard load
  const loadDashboardData = async () => {
    setError('');
    setLoading(true);
    try {
      // 1. Fetch matches
      const matchRes = await api.get('/users/matches');
      setMatches(matchRes.data.matches || []);

      // 2. Fetch active connections count
      try {
        const connRes = await api.get('/connections');
        setConnectionsCount((connRes.data.connections || connRes.data.data || []).length);
      } catch (e) {
        setConnectionsCount(0);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Skill Management Handlers
  const handleAddOfferedSkill = async (skillData) => {
    setSkillActionLoading(true);
    setError('');
    try {
      const res = await api.post('/users/skills/offered', skillData);
      if (res.data.user) {
        updateUserState(res.data.user);
      } else if (res.data.skillsOffered) {
        updateUserState({ ...user, skillsOffered: res.data.skillsOffered });
      }
      setSuccess(`Added '${skillData.skillName}' to skills you teach!`);
      setShowAddOffered(false);
      // Reload matches after skill update
      loadDashboardData();
    } catch (err) {
      setError(err.message || 'Failed to add offered skill.');
    } finally {
      setSkillActionLoading(false);
    }
  };

  const handleRemoveOfferedSkill = async (skillIdOrName) => {
    setSkillActionLoading(true);
    setError('');
    try {
      const res = await api.delete(`/users/skills/offered/${encodeURIComponent(skillIdOrName)}`);
      if (res.data.skillsOffered) {
        updateUserState({ ...user, skillsOffered: res.data.skillsOffered });
      }
      setSuccess('Skill removed successfully.');
      loadDashboardData();
    } catch (err) {
      setError(err.message || 'Failed to remove skill.');
    } finally {
      setSkillActionLoading(false);
    }
  };

  const handleAddWantedSkill = async (skillData) => {
    setSkillActionLoading(true);
    setError('');
    try {
      const res = await api.post('/users/skills/wanted', skillData);
      if (res.data.user) {
        updateUserState(res.data.user);
      } else if (res.data.skillsWanted) {
        updateUserState({ ...user, skillsWanted: res.data.skillsWanted });
      }
      setSuccess(`Added '${skillData.skillName}' to skills you want to learn!`);
      setShowAddWanted(false);
      loadDashboardData();
    } catch (err) {
      setError(err.message || 'Failed to add wanted skill.');
    } finally {
      setSkillActionLoading(false);
    }
  };

  const handleRemoveWantedSkill = async (skillIdOrName) => {
    setSkillActionLoading(true);
    setError('');
    try {
      const res = await api.delete(`/users/skills/wanted/${encodeURIComponent(skillIdOrName)}`);
      if (res.data.skillsWanted) {
        updateUserState({ ...user, skillsWanted: res.data.skillsWanted });
      }
      setSuccess('Skill removed successfully.');
      loadDashboardData();
    } catch (err) {
      setError(err.message || 'Failed to remove skill.');
    } finally {
      setSkillActionLoading(false);
    }
  };

  const skillsOfferedList = user?.skillsOffered || [];
  const skillsWantedList = user?.skillsWanted || [];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flex: 1, padding: '2.5rem 1rem' }}>
        <div className="container">
          {/* Welcome Header */}
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
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary-400)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                <Sparkles size={16} /> Student Dashboard
              </div>
              <h1 style={{ fontSize: '2.2rem', marginBottom: '0.4rem', color: 'var(--text-main)' }}>
                Welcome back, <span className="gradient-text">{user?.name || 'Student'}</span>!
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '600px' }}>
                Find the right peer to learn from and share what you know.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setShowAddOffered(!showAddOffered)}
                className="btn btn-primary"
                style={{ fontSize: '0.88rem', padding: '0.6rem 1.1rem' }}
              >
                <Plus size={16} /> Add Skill
              </button>
              <Link to="/explore" className="btn btn-secondary" style={{ fontSize: '0.88rem', padding: '0.6rem 1.1rem' }}>
                <Compass size={16} /> Find Matches
              </Link>
              <Link to="/profile" className="btn btn-secondary" style={{ fontSize: '0.88rem', padding: '0.6rem 1.1rem' }}>
                <User size={16} /> Edit Profile
              </Link>
            </div>
          </div>

          {/* Feedback Alerts */}
          <Alert type="error" message={error} onClose={() => setError('')} />
          <Alert type="success" message={success} onClose={() => setSuccess('')} />

          {/* Dashboard Summary Stat Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1.25rem',
              marginBottom: '2.5rem',
            }}
          >
            <StatCard
              icon={Award}
              value={skillsOfferedList.length}
              label="Skills I Teach"
              color="var(--primary-500)"
              subtitle="Offered to peers"
            />
            <StatCard
              icon={Target}
              value={skillsWantedList.length}
              label="Skills I Want to Learn"
              color="var(--accent-cyan)"
              subtitle="Learning goals"
            />
            <StatCard
              icon={Zap}
              value={matches.length}
              label="Available Matches"
              color="var(--accent-emerald)"
              subtitle="Compatible partners"
            />
            <StatCard
              icon={Users}
              value={connectionsCount}
              label="Active Connections"
              color="var(--accent-amber)"
              subtitle="Established swaps"
            />
          </div>

          {/* My Skills Section Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1.5rem',
              marginBottom: '3rem',
            }}
          >
            {/* Skills I Teach Card */}
            <div className="glass-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{ padding: '0.4rem', borderRadius: '8px', backgroundColor: 'rgba(99, 102, 241, 0.15)' }}>
                    <Award size={20} color="var(--primary-400)" />
                  </div>
                  <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Skills I Can Teach</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddOffered(!showAddOffered)}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                >
                  {showAddOffered ? 'Cancel' : '+ Add'}
                </button>
              </div>

              {/* Add Offered Skill Form */}
              {showAddOffered && (
                <div style={{ backgroundColor: 'var(--bg-card-hover)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-main)' }}>
                    Add a Skill You Can Teach:
                  </div>
                  <SkillSelector
                    type="offered"
                    existingSkills={skillsOfferedList}
                    onAddSkill={handleAddOfferedSkill}
                    loading={skillActionLoading}
                  />
                </div>
              )}

              {/* Offered Skills List */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', minHeight: '60px' }}>
                {skillsOfferedList.length > 0 ? (
                  skillsOfferedList.map((skill) => (
                    <SkillChip
                      key={skill._id || skill.skillName}
                      skillName={skill.skillName}
                      proficiency={skill.proficiency}
                      type="offered"
                      onRemove={() => handleRemoveOfferedSkill(skill._id || skill.skillName)}
                      disabled={skillActionLoading}
                    />
                  ))
                ) : (
                  <div style={{ color: 'var(--text-subtle)', fontSize: '0.9rem', fontStyle: 'italic', padding: '1rem 0' }}>
                    You haven't listed any skills to teach yet. Click "+ Add" above!
                  </div>
                )}
              </div>
            </div>

            {/* Skills I Want to Learn Card */}
            <div className="glass-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{ padding: '0.4rem', borderRadius: '8px', backgroundColor: 'rgba(6, 182, 212, 0.15)' }}>
                    <Target size={20} color="var(--accent-cyan)" />
                  </div>
                  <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Skills I Want to Learn</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddWanted(!showAddWanted)}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                >
                  {showAddWanted ? 'Cancel' : '+ Add'}
                </button>
              </div>

              {/* Add Wanted Skill Form */}
              {showAddWanted && (
                <div style={{ backgroundColor: 'var(--bg-card-hover)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-main)' }}>
                    Add a Skill You Want to Learn:
                  </div>
                  <SkillSelector
                    type="wanted"
                    existingSkills={skillsWantedList}
                    onAddSkill={handleAddWantedSkill}
                    loading={skillActionLoading}
                  />
                </div>
              )}

              {/* Wanted Skills List */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', minHeight: '60px' }}>
                {skillsWantedList.length > 0 ? (
                  skillsWantedList.map((skill) => (
                    <SkillChip
                      key={skill._id || skill.skillName}
                      skillName={skill.skillName}
                      proficiency={skill.targetProficiency}
                      type="wanted"
                      onRemove={() => handleRemoveWantedSkill(skill._id || skill.skillName)}
                      disabled={skillActionLoading}
                    />
                  ))
                ) : (
                  <div style={{ color: 'var(--text-subtle)', fontSize: '0.9rem', fontStyle: 'italic', padding: '1rem 0' }}>
                    You haven't listed any skills you want to learn yet. Click "+ Add" above!
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Top Compatible Matches Section */}
          <div style={{ marginBottom: '3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h2 style={{ fontSize: '1.6rem', margin: '0 0 0.25rem 0', color: 'var(--text-main)' }}>
                  Top Compatible Matches
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                  Ranked by smart reciprocal skill matching algorithms.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={loadDashboardData}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.85rem', padding: '0.45rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  disabled={loading}
                >
                  <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh Matches
                </button>
                <Link to="/explore" className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '0.45rem 0.85rem' }}>
                  View All Matches ({matches.length})
                </Link>
              </div>
            </div>

            {loading ? (
              <div style={{ padding: '3rem 0', textAlign: 'center' }}>
                <LoadingSpinner size={32} label="Finding optimal compatibility matches..." />
              </div>
            ) : matches.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                  gap: '1.5rem',
                }}
              >
                {matches.slice(0, 3).map((match, idx) => (
                  <MatchCard
                    key={match.user?._id || idx}
                    match={match}
                    onActionClick={(peer) => navigate('/explore')}
                    actionLabel="View Compatibility"
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Zap}
                title="No Compatible Skill Matches Found Yet"
                description={
                  skillsOfferedList.length === 0 || skillsWantedList.length === 0
                    ? "To find compatible peer matches, make sure to add at least one skill you can teach AND one skill you want to learn!"
                    : "No peers currently match your exact skill combination. Try adding more skills or exploring all students!"
                }
                actionLabel="Add Skills Now"
                onAction={() => setShowAddOffered(true)}
              />
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default DashboardPage;
