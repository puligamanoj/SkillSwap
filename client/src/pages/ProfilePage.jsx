import React, { useState, useEffect } from 'react';
import { User, Mail, School, Edit3, Save, X, Award, Target, Star, Trash2, MessageSquare, Clock } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProfileCard from '../components/ProfileCard';
import SkillChip from '../components/SkillChip';
import SkillSelector from '../components/SkillSelector';
import ReviewModal from '../components/ReviewModal';
import Alert from '../components/Alert';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const ProfilePage = () => {
  const { user, updateUserState } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [institution, setInstitution] = useState(user?.institution || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showAddOffered, setShowAddOffered] = useState(false);
  const [showAddWanted, setShowAddWanted] = useState(false);
  const [skillActionLoading, setSkillActionLoading] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  // Review Edit modal state
  const [editReviewConfig, setEditReviewConfig] = useState({
    isOpen: false,
    review: null,
  });

  // Fetch reviews received by profile user
  const fetchReviews = async () => {
    if (!user?._id) return;
    setReviewsLoading(true);
    try {
      const response = await api.get(`/reviews/user/${user._id}`);
      setReviews(response.data.reviews || []);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [user?._id]);

  const refreshUserProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data?.user) {
        updateUserState(res.data.user);
      }
    } catch (e) {}
  };

  const startEdit = () => {
    setName(user?.name || '');
    setBio(user?.bio || '');
    setInstitution(user?.institution || '');
    setAvatar(user?.avatar || '');
    setIsEditing(true);
    setError('');
    setSuccess('');
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setError('');
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('Name cannot be empty.');
      return;
    }

    setSaving(true);
    try {
      const response = await api.put('/users/profile', {
        name: name.trim(),
        bio: bio.trim(),
        institution: institution.trim(),
        avatar: avatar.trim(),
      });

      if (response.data.user) {
        updateUserState(response.data.user);
      }
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  // Skill Handlers
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
      setSuccess(`Added '${skillData.skillName}' to your offered skills!`);
      setShowAddOffered(false);
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
      setSuccess('Skill removed.');
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
      setSuccess(`Added '${skillData.skillName}' to your wanted skills!`);
      setShowAddWanted(false);
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
      setSuccess('Skill removed.');
    } catch (err) {
      setError(err.message || 'Failed to remove skill.');
    } finally {
      setSkillActionLoading(false);
    }
  };

  // Review Edit & Delete Handlers
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;

    try {
      await api.delete(`/reviews/${reviewId}`);
      setSuccess('Review deleted successfully.');
      fetchReviews();
      refreshUserProfile();
    } catch (err) {
      setError(err.message || 'Failed to delete review.');
    }
  };

  const skillsOfferedList = user?.skillsOffered || [];
  const skillsWantedList = user?.skillsWanted || [];

  const avgRating = user?.rating?.average ? Number(user.rating.average).toFixed(1) : 'New';
  const ratingCount = user?.rating?.count || 0;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flex: 1, padding: '2.5rem 1rem' }}>
        <div className="container" style={{ maxWidth: '850px' }}>
          {/* Header */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2.2rem', marginBottom: '0.4rem', color: 'var(--text-main)' }}>
              My Profile & Skills
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
              Manage your personal student details, skill offerings, and review history.
            </p>
          </div>

          <Alert type="error" message={error} onClose={() => setError('')} />
          <Alert type="success" message={success} onClose={() => setSuccess('')} />

          {/* Profile Overview Card or Edit Form */}
          {isEditing ? (
            <div className="glass-card" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.4rem', margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Edit3 size={20} color="var(--primary-400)" /> Edit Student Profile
                </h2>
                <button type="button" onClick={cancelEdit} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                  <X size={16} /> Cancel
                </button>
              </div>

              <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Full Name */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={saving}
                    required
                  />
                </div>

                {/* Institution */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">University / Institution</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Stanford University"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    disabled={saving}
                  />
                </div>

                {/* Avatar URL */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Avatar Image URL (Optional)</label>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://example.com/avatar.jpg"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    disabled={saving}
                  />
                </div>

                {/* Bio */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Student Bio / Learning Goals</label>
                  <textarea
                    className="form-input"
                    rows={4}
                    style={{ resize: 'vertical' }}
                    placeholder="Tell peers about your background, projects, and what skills you want to trade..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    disabled={saving}
                  />
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="button" onClick={cancelEdit} className="btn btn-secondary" disabled={saving}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? <LoadingSpinner size={18} label="Saving..." /> : <><Save size={16} /> Save Changes</>}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div style={{ marginBottom: '2.5rem' }}>
              <ProfileCard user={user} onEditClick={startEdit} />
            </div>
          )}

          {/* Skill Management Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '3rem' }}>
            {/* Skills Offered Card */}
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
                  style={{ fontSize: '0.85rem', padding: '0.4rem 0.85rem' }}
                >
                  {showAddOffered ? 'Cancel' : '+ Add Skill'}
                </button>
              </div>

              {showAddOffered && (
                <div style={{ backgroundColor: 'var(--bg-card-hover)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-main)' }}>
                    Add a Skill You Can Teach to Peers:
                  </div>
                  <SkillSelector
                    type="offered"
                    existingSkills={skillsOfferedList}
                    onAddSkill={handleAddOfferedSkill}
                    loading={skillActionLoading}
                  />
                </div>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', minHeight: '40px' }}>
                {skillsOfferedList.length > 0 ? (
                  skillsOfferedList.map((s) => (
                    <SkillChip
                      key={s._id || s.skillName}
                      skillName={s.skillName}
                      proficiency={s.proficiency}
                      type="offered"
                      onRemove={() => handleRemoveOfferedSkill(s._id || s.skillName)}
                      disabled={skillActionLoading}
                    />
                  ))
                ) : (
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-subtle)', fontStyle: 'italic' }}>
                    No offered skills added yet. Click "+ Add Skill" to start offering skills!
                  </span>
                )}
              </div>
            </div>

            {/* Skills Wanted Card */}
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
                  style={{ fontSize: '0.85rem', padding: '0.4rem 0.85rem' }}
                >
                  {showAddWanted ? 'Cancel' : '+ Add Skill'}
                </button>
              </div>

              {showAddWanted && (
                <div style={{ backgroundColor: 'var(--bg-card-hover)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-main)' }}>
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

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', minHeight: '40px' }}>
                {skillsWantedList.length > 0 ? (
                  skillsWantedList.map((s) => (
                    <SkillChip
                      key={s._id || s.skillName}
                      skillName={s.skillName}
                      proficiency={s.targetProficiency}
                      type="wanted"
                      onRemove={() => handleRemoveWantedSkill(s._id || s.skillName)}
                      disabled={skillActionLoading}
                    />
                  ))
                ) : (
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-subtle)', fontStyle: 'italic' }}>
                    No wanted skills added yet. Click "+ Add Skill" to set your learning targets!
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Peer Reviews & Rating Section */}
          <div style={{ marginBottom: '3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ padding: '0.4rem', borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.15)' }}>
                  <Star size={20} color="var(--accent-amber)" fill="var(--accent-amber)" />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.4rem', margin: 0, color: 'var(--text-main)' }}>
                    Student Ratings & Reviews
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                    Feedback received from completed skill exchanges
                  </p>
                </div>
              </div>

              {/* Rating Summary Pill */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '0.4rem 0.85rem', borderRadius: '12px' }}>
                <Star size={18} fill="var(--accent-amber)" color="var(--accent-amber)" />
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-amber)' }}>{avgRating}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>({ratingCount} reviews)</span>
              </div>
            </div>

            {/* Reviews List */}
            {reviewsLoading ? (
              <div style={{ padding: '3rem 0', textAlign: 'center' }}>
                <LoadingSpinner size={32} label="Loading student reviews..." />
              </div>
            ) : reviews.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {reviews.map((rev) => {
                  const reviewerName = rev.reviewer?.name || 'Anonymous Student';
                  const reviewerAvatar = rev.reviewer?.avatar;
                  const reviewerInitial = reviewerName.charAt(0).toUpperCase();
                  const isMyReview = (typeof rev.reviewer === 'object' ? rev.reviewer._id : rev.reviewer) === user?._id;
                  const dateStr = rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

                  return (
                    <div
                      key={rev._id}
                      className="glass-card"
                      style={{
                        padding: '1.25rem 1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                      }}
                    >
                      {/* Reviewer Header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, var(--primary-500), var(--accent-cyan))',
                              display: 'flex',
                              alignItems: 'center',
                              justify: 'center',
                              color: '#ffffff',
                              fontWeight: 700,
                              fontSize: '0.95rem',
                            }}
                          >
                            {reviewerAvatar ? (
                              <img src={reviewerAvatar} alt={reviewerName} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                              reviewerInitial
                            )}
                          </div>

                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                              {reviewerName} {isMyReview && <span style={{ fontSize: '0.75rem', color: 'var(--primary-400)', marginLeft: '0.3rem' }}>(You)</span>}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
                              {rev.reviewer?.institution || 'SkillSwap Member'} • {dateStr}
                            </div>
                          </div>
                        </div>

                        {/* Rating Stars */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={15}
                              fill={s <= rev.rating ? 'var(--accent-amber)' : 'none'}
                              color={s <= rev.rating ? 'var(--accent-amber)' : 'var(--text-subtle)'}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Comment */}
                      {rev.comment && (
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                          "{rev.comment}"
                        </p>
                      )}

                      {/* Edit / Delete Actions if My Review */}
                      {isMyReview && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
                          <button
                            type="button"
                            onClick={() => setEditReviewConfig({ isOpen: true, review: rev })}
                            className="btn btn-secondary"
                            style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            <Edit3 size={13} /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteReview(rev._id)}
                            className="btn btn-secondary"
                            style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent-rose)' }}
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={Star}
                title="No Reviews Yet"
                description="Complete skill exchanges with connected partners to build your student reputation and receive reviews!"
              />
            )}
          </div>
        </div>
      </main>

      {/* Review Edit Modal */}
      <ReviewModal
        connectionId={editReviewConfig.review?.connection?._id || editReviewConfig.review?.connection}
        reviewedUser={editReviewConfig.review?.reviewedUser}
        existingReview={editReviewConfig.review}
        isOpen={editReviewConfig.isOpen}
        onClose={() => setEditReviewConfig({ isOpen: false, review: null })}
        onReviewSubmitted={() => {
          fetchReviews();
          refreshUserProfile();
        }}
      />

      <Footer />
    </div>
  );
};

export default ProfilePage;
