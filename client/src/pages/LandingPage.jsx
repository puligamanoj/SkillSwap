import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Code2,
  Sparkles,
  Users,
  MessageSquare,
  Star,
  CheckCircle2,
  Zap,
  Repeat,
  BookOpen,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const LandingPage = () => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      {/* Hero Section */}
      <section style={{ padding: '5rem 0 4rem', position: 'relative', overflow: 'hidden' }}>
        {/* Background Decorative Glow */}
        <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '400px', background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, rgba(6,182,212,0.05) 50%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: '850px', margin: '0 auto', textAlign: 'center' }}>
            <div className="badge badge-primary" style={{ marginBottom: '1.5rem', padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
              <Sparkles size={16} /> Peer-to-Peer Student Skill Exchange
            </div>

            <h1 style={{ fontSize: '3.2rem', lineHeight: '1.15', marginBottom: '1.5rem', fontFamily: 'var(--font-heading)' }}>
              Learn from peers. <br />
              <span className="gradient-text">Share what you know.</span>
            </h1>

            <p style={{ fontSize: '1.15rem', color: 'var(--text-muted)', marginBottom: '2.5rem', lineHeight: '1.7', maxWidth: '680px', margin: '0 auto 2.5rem' }}>
              SkillSwap empowers students to exchange skills reciprocally for free. Find complementary study partners, share your expertise, and learn new technologies together.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '3.5rem' }}>
              <Link to="/register" className="btn btn-primary" style={{ padding: '0.9rem 2rem', fontSize: '1.05rem' }}>
                Find a Skill Partner <ArrowRight size={18} />
              </Link>
              <Link to="/register" className="btn btn-secondary" style={{ padding: '0.9rem 2rem', fontSize: '1.05rem' }}>
                Share Your Skills
              </Link>
            </div>
          </div>

          {/* Visual Exchange Concept Demonstration Card */}
          <div className="glass-card" style={{ maxWidth: '820px', margin: '0 auto', padding: '2rem', border: '1px solid rgba(99, 102, 241, 0.3)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>RECIPROCAL MATCH EXAMPLE</span>
              <span className="badge badge-success" style={{ fontSize: '0.85rem' }}>
                <Zap size={14} /> 97% Compatibility Score
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', alignItems: 'center' }}>
              {/* Student A */}
              <div style={{ backgroundColor: 'rgba(17, 24, 39, 0.8)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" alt="Student A" style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div>
                    <h4 style={{ fontSize: '1rem', marginBottom: '0.1rem' }}>Alex (Computer Science)</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tech University</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-subtle)' }}>Can Teach:</span>
                    <span className="badge badge-primary">Java (Advanced)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-subtle)' }}>Wants to Learn:</span>
                    <span className="badge badge-cyan">Python (Beginner)</span>
                  </div>
                </div>
              </div>

              {/* Exchange Icon */}
              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(79, 70, 229, 0.5)', marginBottom: '0.4rem' }}>
                  <Repeat size={24} color="#ffffff" />
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Mutual Skill Swap</span>
              </div>

              {/* Student B */}
              <div style={{ backgroundColor: 'rgba(17, 24, 39, 0.8)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80" alt="Student B" style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div>
                    <h4 style={{ fontSize: '1rem', marginBottom: '0.1rem' }}>Brian (Data Engineering)</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>State College</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-subtle)' }}>Can Teach:</span>
                    <span className="badge badge-cyan">Python (Advanced)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-subtle)' }}>Wants to Learn:</span>
                    <span className="badge badge-primary">Java (Intermediate)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How SkillSwap Works Section */}
      <section id="how-it-works" style={{ padding: '5rem 0', backgroundColor: 'var(--bg-surface)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 4rem' }}>
            <h2 style={{ fontSize: '2.2rem', marginBottom: '1rem' }}>How SkillSwap Works</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>Four simple steps to start exchanging skills with fellow students.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem' }}>
            {/* Step 1 */}
            <div className="glass-card" style={{ padding: '2rem' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem', marginBottom: '1.25rem' }}>1</div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem' }}>Create Profile</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Set up your student profile and add skills you can teach and skills you want to learn.</p>
            </div>

            {/* Step 2 */}
            <div className="glass-card" style={{ padding: '2rem' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem', marginBottom: '1.25rem' }}>2</div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem' }}>Find Your Match</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Our smart compatibility matching algorithm ranks peers with complementary skill sets.</p>
            </div>

            {/* Step 3 */}
            <div className="glass-card" style={{ padding: '2rem' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem', marginBottom: '1.25rem' }}>3</div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem' }}>Exchange Skills</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Connect, chat in real-time, and host 1-on-1 peer teaching sessions.</p>
            </div>

            {/* Step 4 */}
            <div className="glass-card" style={{ padding: '2rem' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem', marginBottom: '1.25rem' }}>4</div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem' }}>Review Partner</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Mark the exchange complete and leave a peer review to build your community trust rating.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why SkillSwap Section */}
      <section id="why-skillswap" style={{ padding: '5rem 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 4rem' }}>
            <h2 style={{ fontSize: '2.2rem', marginBottom: '1rem' }}>Why Choose SkillSwap?</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>Designed specifically for college students and peer-learning communities.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            <div className="glass-card" style={{ padding: '2rem', display: 'flex', gap: '1.25rem' }}>
              <div style={{ padding: '0.75rem', height: 'fit-content', borderRadius: '10px', backgroundColor: 'rgba(99,102,241,0.15)', color: 'var(--primary-500)' }}>
                <Users size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Peer-to-Peer Learning</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Learn directly from fellow students who recently mastered the topic you're struggling with.</p>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '2rem', display: 'flex', gap: '1.25rem' }}>
              <div style={{ padding: '0.75rem', height: 'fit-content', borderRadius: '10px', backgroundColor: 'rgba(6,182,212,0.15)', color: 'var(--accent-cyan)' }}>
                <Zap size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Smart Compatibility Engine</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Algorithmic matching ensures reciprocal interest and proficiency alignment for high-value swaps.</p>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '2rem', display: 'flex', gap: '1.25rem' }}>
              <div style={{ padding: '0.75rem', height: 'fit-content', borderRadius: '10px', backgroundColor: 'rgba(16,185,129,0.15)', color: 'var(--accent-emerald)' }}>
                <MessageSquare size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Real-time Communication</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Built-in Socket.io instant messaging and notifications for seamless coordination.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: '4rem 0', position: 'relative' }}>
        <div className="container">
          <div className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center', background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.2), rgba(6, 182, 212, 0.15))', border: '1px solid rgba(99, 102, 241, 0.4)' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Ready to Swap Your First Skill?</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '540px', margin: '0 auto 2rem' }}>
              Join hundreds of student learners exchanging Java, Python, Web Development, Design, and more today.
            </p>
            <Link to="/register" className="btn btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}>
              Create Free Account <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
