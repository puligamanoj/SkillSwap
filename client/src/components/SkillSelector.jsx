import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Check, AlertCircle } from 'lucide-react';
import api from '../services/api';
import LoadingSpinner from './LoadingSpinner';

const SkillSelector = ({
  type = 'offered', // 'offered' or 'wanted'
  existingSkills = [], // Array of skill names already added
  onAddSkill,
  loading = false,
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [proficiency, setProficiency] = useState(type === 'offered' ? 'Intermediate' : 'Beginner');
  const [experienceYears, setExperienceYears] = useState(1);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const wrapperRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search existing database skills when typing
  useEffect(() => {
    if (!query.trim() || query.trim().length < 1) {
      setSuggestions([]);
      setSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const response = await api.get(`/skills/search?query=${encodeURIComponent(query.trim())}`);
        if (response.data && response.data.skills) {
          setSuggestions(response.data.skills);
        }
      } catch (err) {
        // Fallback: search default skill list endpoint
        try {
          const res = await api.get(`/skills?search=${encodeURIComponent(query.trim())}`);
          setSuggestions(res.data.skills || []);
        } catch (e) {
          setSuggestions([]);
        }
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const isDuplicate = (skillName) => {
    const normalized = skillName.trim().toLowerCase();
    return existingSkills.some((s) => {
      const existingName = typeof s === 'string' ? s : s.skillName;
      return existingName.toLowerCase() === normalized;
    });
  };

  const handleSelectSuggestion = (skill) => {
    setQuery(skill.name);
    setShowDropdown(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const trimmed = query.trim();
    if (!trimmed) {
      setError('Please enter a skill name.');
      return;
    }

    if (isDuplicate(trimmed)) {
      setError(`'${trimmed}' is already in your ${type === 'offered' ? 'offered' : 'wanted'} skills list.`);
      return;
    }

    if (type === 'offered') {
      onAddSkill({ skillName: trimmed, proficiency, experienceYears: Number(experienceYears) || 1 });
    } else {
      onAddSkill({ skillName: trimmed, targetProficiency: proficiency });
    }

    setQuery('');
    setShowDropdown(false);
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {error && (
          <div style={{ color: 'var(--accent-rose)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Skill Name Input with Autocomplete */}
          <div style={{ flex: 1, minWidth: '180px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.5rem', paddingRight: '2rem', fontSize: '0.9rem' }}
              placeholder={type === 'offered' ? 'e.g. Java, Python, React...' : 'e.g. Machine Learning, Figma...'}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowDropdown(true);
                if (error) setError('');
              }}
              onFocus={() => setShowDropdown(true)}
              disabled={loading}
            />
            {searching && (
              <div style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}>
                <LoadingSpinner size={14} label="" />
              </div>
            )}

            {/* Dropdown Suggestions */}
            {showDropdown && suggestions.length > 0 && (
              <ul
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '0.25rem',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '10px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  zIndex: 50,
                  listStyle: 'none',
                  padding: '0.25rem 0',
                }}
              >
                {suggestions.map((item) => {
                  const dup = isDuplicate(item.name);
                  return (
                    <li
                      key={item._id || item.name}
                      onClick={() => !dup && handleSelectSuggestion(item)}
                      style={{
                        padding: '0.5rem 1rem',
                        cursor: dup ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justify: 'space-between',
                        fontSize: '0.88rem',
                        color: dup ? 'var(--text-subtle)' : 'var(--text-main)',
                        backgroundColor: 'transparent',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!dup) e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <span>{item.name} <small style={{ color: 'var(--text-subtle)', marginLeft: '0.4rem' }}>({item.category || 'General'})</small></span>
                      {dup && <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Added</span>}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Proficiency Dropdown */}
          <select
            className="form-input"
            style={{ width: '130px', fontSize: '0.85rem' }}
            value={proficiency}
            onChange={(e) => setProficiency(e.target.value)}
            disabled={loading}
          >
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
            <option value="Expert">Expert</option>
          </select>

          {/* Add Button */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !query.trim()}
            style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.88rem' }}
          >
            <Plus size={16} /> Add
          </button>
        </div>
      </form>
    </div>
  );
};

export default SkillSelector;
