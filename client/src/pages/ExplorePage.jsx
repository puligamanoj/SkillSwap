import React, { useState, useEffect } from 'react';
import { Compass, Search, Filter, Zap, RefreshCw } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MatchCard from '../components/MatchCard';
import RequestModal from '../components/RequestModal';
import LoadingSpinner from '../components/LoadingSpinner';
import Alert from '../components/Alert';
import EmptyState from '../components/EmptyState';
import api from '../services/api';

const ExplorePage = () => {
  const [matches, setMatches] = useState([]);
  const [sentRequestMap, setSentRequestMap] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [minScore, setMinScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected candidate for Exchange Request Modal
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchMatchesAndRequests = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch matches
      const matchRes = await api.get('/users/matches');
      setMatches(matchRes.data.matches || []);

      // 2. Fetch outgoing requests to track request status per candidate
      try {
        const reqRes = await api.get('/requests?type=outgoing');
        const map = {};
        (reqRes.data.requests || []).forEach((req) => {
          if (req.receiver && (req.status === 'pending' || req.status === 'accepted')) {
            const receiverId = typeof req.receiver === 'object' ? req.receiver._id : req.receiver;
            map[receiverId] = true;
          }
        });
        setSentRequestMap(map);
      } catch (e) {
        setSentRequestMap({});
      }
    } catch (err) {
      setError(err.message || 'Failed to load compatibility matches.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatchesAndRequests();
  }, []);

  const handleOpenRequestModal = (candidate) => {
    setSelectedCandidate(candidate);
    setIsModalOpen(true);
  };

  const handleRequestSent = (receiverId) => {
    setSentRequestMap((prev) => ({ ...prev, [receiverId]: true }));
  };

  // Filter matches client-side without altering backend ranking order
  const filteredMatches = matches.filter((m) => {
    if (minScore > 0 && m.matchScore < minScore) return false;
    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase();
    const userName = m.user?.name?.toLowerCase() || '';
    const inst = m.user?.institution?.toLowerCase() || '';

    const offers = (m.user?.skillsOffered || []).some((s) => s.skillName.toLowerCase().includes(q));
    const wants = (m.user?.skillsWanted || []).some((s) => s.skillName.toLowerCase().includes(q));

    return userName.includes(q) || inst.includes(q) || offers || wants;
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flex: 1, padding: '2.5rem 1rem' }}>
        <div className="container">
          {/* Header */}
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
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-cyan)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                <Compass size={16} /> Skill Discovery Engine
              </div>
              <h1 style={{ fontSize: '2.2rem', marginBottom: '0.4rem', color: 'var(--text-main)' }}>
                Explore Peer Skill Matches
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
                Discover students whose skills directly match your learning goals.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchMatchesAndRequests}
              className="btn btn-secondary"
              style={{ fontSize: '0.88rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              disabled={loading}
            >
              <RefreshCw size={15} className={loading ? 'spin' : ''} /> Refresh Matches
            </button>
          </div>

          <Alert type="error" message={error} onClose={() => setError('')} />

          {/* Search & Compatibility Filter Controls */}
          <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem' }}>
            <div style={{ flex: 1, minWidth: '240px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Search size={18} color="var(--text-subtle)" />
              <input
                type="text"
                className="form-input"
                style={{ border: 'none', background: 'transparent', padding: '0.4rem 0', fontSize: '0.95rem' }}
                placeholder="Search by student name, university, or skill (e.g. Python, Java, React)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Min Score Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={16} color="var(--text-subtle)" />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Min Score:</span>
              <select
                className="form-input"
                style={{ width: '110px', padding: '0.35rem 0.6rem', fontSize: '0.85rem' }}
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
              >
                <option value={0}>All Scores</option>
                <option value={50}>50%+ Match</option>
                <option value={70}>70%+ Match</option>
                <option value={85}>85%+ (High)</option>
              </select>
            </div>

            {searchQuery || minScore > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setMinScore(0);
                }}
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
              >
                Reset Filters
              </button>
            ) : null}
          </div>

          {/* Matches Grid */}
          {loading ? (
            <div style={{ padding: '4rem 0', textAlign: 'center' }}>
              <LoadingSpinner size={36} label="Calculating student compatibility scores..." />
            </div>
          ) : filteredMatches.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                gap: '1.5rem',
                marginBottom: '3rem',
              }}
            >
              {filteredMatches.map((match, idx) => {
                const isReq = sentRequestMap[match.user?._id] || false;
                return (
                  <MatchCard
                    key={match.user?._id || idx}
                    match={match}
                    onActionClick={handleOpenRequestModal}
                    actionLabel="Request Exchange"
                    isRequested={isReq}
                  />
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={Zap}
              title={searchQuery || minScore > 0 ? "No Matches Found for Filter" : "No Compatible Skill Partners Available"}
              description={
                searchQuery || minScore > 0
                  ? "No peer matches found matching your filters. Try resetting your search filters!"
                  : "We couldn't find any compatible peer matches right now. Add more skills to your profile to expand your compatibility network!"
              }
              actionLabel={searchQuery || minScore > 0 ? "Reset Filters" : "Manage My Skills"}
              onAction={() => {
                if (searchQuery || minScore > 0) {
                  setSearchQuery('');
                  setMinScore(0);
                } else {
                  window.location.assign('/profile');
                }
              }}
            />
          )}
        </div>
      </main>

      {/* Exchange Request Modal */}
      <RequestModal
        candidate={selectedCandidate}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCandidate(null);
        }}
        onRequestSent={handleRequestSent}
      />

      <Footer />
    </div>
  );
};

export default ExplorePage;
